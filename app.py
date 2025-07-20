from flask import Flask, render_template, request, jsonify, redirect, url_for, flash
from flask_sqlalchemy import SQLAlchemy
from flask_login import LoginManager, UserMixin, login_user, logout_user, login_required, current_user
from werkzeug.security import generate_password_hash, check_password_hash
import requests
import os

app = Flask(__name__)
app.config['SECRET_KEY'] = 'a-very-secret-key-that-you-should-change'
app.config['SQLALCHEMY_DATABASE_URI'] = 'sqlite:///dashboard.db'
app.config['SQLALCHEMY_TRACK_MODIFICATIONS'] = False

db = SQLAlchemy(app)
login_manager = LoginManager(app)
login_manager.login_view = 'login'

class User(UserMixin, db.Model):
    id = db.Column(db.Integer, primary_key=True)
    username = db.Column(db.String(150), unique=True, nullable=False)
    password_hash = db.Column(db.String(150), nullable=False)

    def set_password(self, password):
        self.password_hash = generate_password_hash(password)

    def check_password(self, password):
        return check_password_hash(self.password_hash, password)

class LinkGroup(db.Model):
    id = db.Column(db.Integer, primary_key=True)
    name = db.Column(db.String(100), nullable=False)
    icon = db.Column(db.String(50), nullable=False, default='folder')
    position = db.Column(db.Integer, nullable=False)
    user_id = db.Column(db.Integer, db.ForeignKey('user.id'), nullable=False)
    links = db.relationship('Link', backref='group', cascade="all, delete-orphan", lazy=True)

class Link(db.Model):
    id = db.Column(db.Integer, primary_key=True)
    title = db.Column(db.String(100), nullable=False)
    url = db.Column(db.String(200), nullable=False)
    position = db.Column(db.Integer, nullable=False)
    group_id = db.Column(db.Integer, db.ForeignKey('link_group.id'), nullable=False)


with app.app_context():
    db.create_all()

@login_manager.user_loader
def load_user(user_id):
    return db.session.get(User, int(user_id))

@app.before_request
def check_for_setup():
    if not User.query.first() and request.endpoint not in ['setup', 'static']:
        return redirect(url_for('setup'))
    if User.query.first() and request.endpoint == 'setup':
        return redirect(url_for('login'))

@app.route('/setup', methods=['GET', 'POST'])
def setup():
    if User.query.first():
        return redirect(url_for('login'))
        
    if request.method == 'POST':
        username = request.form.get('username')
        password = request.form.get('password')

        if not username or not password:
            flash('Username and password are required.', 'error')
            return redirect(url_for('setup'))
        
        new_user = User(username=username)
        new_user.set_password(password)
        db.session.add(new_user)
        db.session.commit()
        
        flash('Admin account created successfully! Please log in.', 'success')
        return redirect(url_for('login'))

    return render_template('setup.html')

@app.route('/login', methods=['GET', 'POST'])
def login():
    if current_user.is_authenticated:
        return redirect(url_for('dashboard'))

    if request.method == 'POST':
        username = request.form.get('username')
        password = request.form.get('password')
        user = User.query.filter_by(username=username).first()

        if user and user.check_password(password):
            login_user(user)
            return redirect(url_for('dashboard'))
        else:
            flash('Invalid username or password.', 'error')

    return render_template('login.html')

@app.route('/logout')
@login_required
def logout():
    logout_user()
    return redirect(url_for('login'))

@app.route('/')
@login_required
def dashboard():
    return render_template('dashboard.html')

@app.route('/api/dashboard', methods=['GET'])
@login_required
def get_dashboard_data():
    groups = LinkGroup.query.filter_by(user_id=current_user.id).order_by(LinkGroup.position).all()
    dashboard_data = []
    for group in groups:
        links = Link.query.filter_by(group_id=group.id).order_by(Link.position).all()
        dashboard_data.append({
            'id': group.id,
            'name': group.name,
            'icon': group.icon,
            'links': [{'id': link.id, 'title': link.title, 'url': link.url} for link in links]
        })
    return jsonify(dashboard_data)

@app.route('/api/groups', methods=['POST'])
@login_required
def add_group():
    data = request.get_json()
    name = data.get('name', '').strip()
    icon = data.get('icon', 'folder').strip()
    if not name:
        return jsonify({'error': 'Group name is required'}), 400

    max_pos = db.session.query(db.func.max(LinkGroup.position)).filter_by(user_id=current_user.id).scalar() or 0
    
    new_group = LinkGroup(name=name, icon=icon, user_id=current_user.id, position=max_pos + 1)
    db.session.add(new_group)
    db.session.commit()

    return jsonify({'id': new_group.id, 'name': new_group.name, 'icon': new_group.icon, 'links': []}), 201

@app.route('/api/groups/<int:group_id>', methods=['PUT'])
@login_required
def update_group(group_id):
    group = LinkGroup.query.filter_by(id=group_id, user_id=current_user.id).first_or_404()
    data = request.get_json()
    name = data.get('name', '').strip()
    icon = data.get('icon', 'folder').strip()
    if not name:
        return jsonify({'error': 'Group name is required'}), 400
    
    group.name = name
    group.icon = icon
    db.session.commit()
    
    return jsonify({'id': group.id, 'name': group.name, 'icon': group.icon})

@app.route('/api/groups/<int:group_id>', methods=['DELETE'])
@login_required
def delete_group(group_id):
    group = LinkGroup.query.filter_by(id=group_id, user_id=current_user.id).first_or_404()
    db.session.delete(group)
    db.session.commit()
    return jsonify({'message': 'Group deleted successfully'})

@app.route('/api/links', methods=['POST'])
@login_required
def add_link():
    data = request.get_json()
    group_id = data.get('group_id')
    title = data.get('title', '').strip()
    url = data.get('url', '').strip()

    if not all([group_id, title, url]):
        return jsonify({'error': 'Missing data'}), 400

    group = LinkGroup.query.filter_by(id=group_id, user_id=current_user.id).first_or_404()
    
    max_pos = db.session.query(db.func.max(Link.position)).filter_by(group_id=group.id).scalar() or 0

    new_link = Link(title=title, url=url, group_id=group.id, position=max_pos + 1)
    db.session.add(new_link)
    db.session.commit()

    return jsonify({'id': new_link.id, 'title': new_link.title, 'url': new_link.url}), 201

@app.route('/api/links/<int:link_id>', methods=['PUT'])
@login_required
def update_link(link_id):
    link = Link.query.get_or_404(link_id)
    if link.group.user_id != current_user.id:
        return jsonify({'error': 'Forbidden'}), 403

    data = request.get_json()
    title = data.get('title', '').strip()
    url = data.get('url', '').strip()

    if not title or not url:
        return jsonify({'error': 'Title and URL are required'}), 400
    
    link.title = title
    link.url = url
    db.session.commit()
    return jsonify({'id': link.id, 'title': link.title, 'url': link.url})

@app.route('/api/links/<int:link_id>', methods=['DELETE'])
@login_required
def delete_link(link_id):
    link = Link.query.get_or_404(link_id)
    if link.group.user_id != current_user.id:
        return jsonify({'error': 'Forbidden'}), 403

    db.session.delete(link)
    db.session.commit()
    return jsonify({'message': 'Link deleted successfully'})

@app.route('/api/update-positions', methods=['POST'])
@login_required
def update_positions():
    data = request.get_json()
    
    for index, group_data in enumerate(data.get('groups', [])):
        group = LinkGroup.query.filter_by(id=group_data['id'], user_id=current_user.id).first()
        if group:
            group.position = index
            for link_index, link_id in enumerate(group_data.get('links', [])):
                link = Link.query.get(link_id)
                if link and link.group_id == group.id:
                    link.position = link_index

    db.session.commit()
    return jsonify({'message': 'Positions updated successfully'})

@app.route('/api/check-status', methods=['POST'])
@login_required
def check_status():
    data = request.get_json()
    url = data.get('url')
    if not url:
        return jsonify({'error': 'URL is required'}), 400

    headers = {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36'
    }

    try:
        response = requests.head(url, timeout=5, allow_redirects=True, headers=headers)
        if response.ok:
            return jsonify({'status': 'online'})
    except requests.RequestException:
        pass
    try:
        response = requests.get(url, timeout=5, allow_redirects=True, headers=headers, stream=True)
        if response.ok:
            return jsonify({'status': 'online'})
        else:
            return jsonify({'status': 'offline', 'code': response.status_code})
    except requests.RequestException:
        return jsonify({'status': 'offline'})