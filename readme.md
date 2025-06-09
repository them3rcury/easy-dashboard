# Easy Dashboard 🚀

As a fun little side project and to use it for myself as well, I decided to have a go at this project I called **Easy Dashboard**.
Have fun!

## Preview

![Dashboard Preview](https://raw.githubusercontent.com/them3rcury/easy-dashboard/refs/heads/master/screenshots/preview3.png)

More screenshots can be found [here](https://github.com/them3rcury/easy-dashboard/tree/master/screenshots).

*demo soon™*

## What's Inside? (The Fun Stuff)

* **Your Links, Your Way**: Neatly tuck your links into groups. Finally, a home for all those dev docs, project links, and random articles!
* **Organize with Ease**: Just drag and drop your links and groups to arrange them exactly how you like.
* **Your Dashboard, Your Rules**: Effortlessly add, edit, and delete links and groups. No fuss.
* **Match Your Vibe**: Are you a creature of the night or a fan of the light? Flip between a slick dark mode and a clean light mode. Your browser will even remember your choice!
* **Quick Find**: A speedy search bar helps you find any link or group in a flash.
* **Keep It To Yourself**: A simple login keeps your personal dashboard private. The first person to sign up becomes the one and only admin and user.

## Bringing Your Dashboard to Life

Ready to get your own dashboard up and running? You've got two paths to choose from.

### What You'll Need

* Python 3.x (if you're going the local route)
* Docker and Docker Compose (if you want the easy setup)

### Option 1: The Docker Way (Easy Mode)

This is the fastest way to get started.

1.  **Clone this repo:**
    ```sh
    git clone https://github.com/them3rcury/easy-dashboard
    cd easy-dashboard
    ```

2.  **Let Docker do the magic:**
    This single command builds the container and gets everything running.
    ```sh
    docker-compose up -d
    ```

3.  **You're in!**
    Open your browser and head to `http://localhost:5000`.

### Option 2: The Local Setup (Hands-On Mode)

Here’s how to run it on your machine locally.

1.  **Clone this repo:**
    ```sh
    git clone https://github.com/them3rcury/easy-dashboard
    cd easy-dashboard
    ```

2.  **Setup the venv:**
    * On macOS/Linux:
        ```sh
        python3 -m venv venv
        source venv/bin/activate
        ```
    * On Windows:
        ```sh
        python -m venv venv
        .\venv\Scripts\activate
        ```

3.  **Install the goodies:**
    This will grab all the Python packages the project needs.
    ```sh
    pip install -r requirements.txt
    ```

4.  **Launch it!**
    * On macOS/Linux:
        ```sh
        export FLASK_APP=app.py
        flask run
        ```
    * On Windows:
        ```sh
        set FLASK_APP=app.py
        flask run
        ```

5.  **Use it!**
    Open your browser and navigate to `http://127.0.0.1:5000`.

## A Note on Your First Run

The very first time you launch the app, it'll ask you to create an account. This first account is special—it's the one and only user account for your dashboard.

* **Flask** for the backend
* **Flask-SQLAlchemy** for the database
* **Vanilla JavaScript** for the interactive frontend (no complex frameworks!)
* **Docker** for easy-peasy containerization

Feel free to fork this repository, dive into the code, and make it your own. Want to add a new feature? Go for it!