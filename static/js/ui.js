let state = { groups: [] };

export function setState(newState) {
    state = newState;
}

export function openModal(modal) {
    modal.classList.add('visible');
    modal.querySelector('input, button')?.focus();
}

export function closeModal(modal) {
    modal.classList.remove('visible');
}

export function showErrorToast(message) {
    const toast = document.getElementById('error-toast');
    if (!toast) return;
    toast.textContent = message;
    toast.classList.add('visible');
    setTimeout(() => {
        toast.classList.remove('visible');
    }, 3000);
}

function createGroupElement(group) {
    const div = document.createElement('div');
    div.className = 'link-group';
    div.dataset.groupId = group.id;
    div.dataset.groupName = group.name.toLowerCase();

    const linksList = group.links.map(link => {
        let domain;
        try {
            domain = new URL(link.url).hostname;
        } catch (e) {
            domain = '';
        }
        const faviconUrl = domain ? `https://www.google.com/s2/favicons?sz=32&domain_url=${domain}` : '';
        
        return `
            <li class="link-item" data-link-id="${link.id}" data-link-title="${link.title.toLowerCase()}" data-link-url="${link.url.toLowerCase()}">
                <a href="${link.url}" target="_blank" rel="noopener noreferrer">
                    <span class="link-status" title="Checking status..."></span>
                    <img src="${faviconUrl}" class="favicon" alt="" loading="lazy" onerror="this.style.display='none'">
                    <span>${link.title}</span>
                </a>
                <div class="link-actions">
                    <button class="icon-btn edit-link-btn" title="Edit Link" data-link-id="${link.id}" data-link-title="${encodeURIComponent(link.title)}" data-link-url="${encodeURIComponent(link.url)}">
                        <span class="material-icons-outlined">edit</span>
                    </button>
                    <button class="icon-btn delete-btn delete-link-btn" title="Delete Link" data-link-id="${link.id}">
                        <span class="material-icons-outlined">delete</span>
                    </button>
                </div>
            </li>
        `;
    }).join('');

    div.innerHTML = `
        <div class="link-group-header">
            <h3><span class="material-icons-outlined">${group.icon || 'folder'}</span><span>${group.name}</span></h3>
            <div class="group-actions">
                <button class="icon-btn add-link-to-group-btn" data-group-id="${group.id}" title="Add Link">
                    <span class="material-icons-outlined">add</span>
                </button>
                <button class="icon-btn edit-group-btn" data-group-id="${group.id}" data-group-name="${encodeURIComponent(group.name)}" data-group-icon="${group.icon || 'folder'}">
                    <span class="material-icons-outlined">edit</span>
                </button>
                <button class="icon-btn delete-btn delete-group-btn" data-group-id="${group.id}">
                    <span class="material-icons-outlined">delete</span>
                </button>
            </div>
        </div>
        <ul class="links-list" data-group-id="${group.id}">${linksList}</ul>
    `;
    return div;
}

export function renderDashboard(dashboardContainer, noResultsMessage) {
    dashboardContainer.innerHTML = '';
    noResultsMessage.style.display = 'none';

    if (state.groups.length === 0 && document.getElementById('search-bar').value === '') {
        const emptyState = document.createElement('div');
        emptyState.className = 'login-container';
        emptyState.style.margin = '40px auto';
        emptyState.innerHTML = `
            <h2>Welcome!</h2>
            <p>No groups yet. Click the <span class="material-icons-outlined">add</span> button to create your first group.</p>
        `;
        dashboardContainer.appendChild(emptyState);
        return;
    }

    state.groups.forEach(group => {
        const groupElement = createGroupElement(group);
        dashboardContainer.appendChild(groupElement);
    });
}

export function handleSearch(query, noResultsMessage) {
    let hasVisibleGroups = false;
    document.querySelectorAll('.link-group').forEach(group => {
        const groupName = group.dataset.groupName;
        let groupHasVisibleLinks = false;

        group.querySelectorAll('.link-item').forEach(link => {
            const linkTitle = link.dataset.linkTitle;
            const linkUrl = link.dataset.linkUrl;
            const isMatch = linkTitle.includes(query) || linkUrl.includes(query);
            link.style.display = isMatch ? '' : 'none';
            if (isMatch) groupHasVisibleLinks = true;
        });

        const isGroupMatch = groupName.includes(query) || groupHasVisibleLinks;
        group.style.display = isGroupMatch ? '' : 'none';
        if (isGroupMatch) hasVisibleGroups = true;
    });
    noResultsMessage.style.display = hasVisibleGroups ? 'none' : 'block';
}

export function populateIconPicker(grid, icons, onSelect) {
    grid.innerHTML = '';
    icons.forEach(iconName => {
        const btn = document.createElement('button');
        btn.dataset.iconName = iconName;
        btn.innerHTML = `<span class="material-icons-outlined">${iconName}</span>`;
        btn.addEventListener('click', () => onSelect(iconName));
        grid.appendChild(btn);
    });
}