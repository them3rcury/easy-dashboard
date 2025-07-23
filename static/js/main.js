import * as api from './api.js';
import * as ui from './ui.js';
import { initializeSettings } from './settings.js';

document.addEventListener('DOMContentLoaded', () => {
    const elements = {
        dashboardContainer: document.getElementById('dashboard-container'),
        searchBar: document.getElementById('search-bar'),
        searchContainer: document.querySelector('.search-container'),
        noResultsMessage: document.getElementById('no-results-message'),
        
        addGroupModal: document.getElementById('add-group-modal'),
        openAddModalBtn: document.getElementById('open-add-modal-btn'),
        newGroupNameInput: document.getElementById('new-group-name-modal'),
        addGroupBtn: document.getElementById('add-group-btn-modal'),
        
        editGroupModal: document.getElementById('edit-group-modal'),
        editGroupIdInput: document.getElementById('edit-group-id-modal'),
        editGroupNameInput: document.getElementById('edit-group-name-modal'),
        saveGroupChangesBtn: document.getElementById('save-group-changes-btn'),
        
        addLinkModal: document.getElementById('add-link-modal'),
        addLinkGroupIdInput: document.getElementById('add-link-group-id-modal'),
        newLinkTitleInput: document.getElementById('new-link-title-modal'),
        newLinkUrlInput: document.getElementById('new-link-url-modal'),
        addLinkBtnModal: document.getElementById('add-link-btn-modal'),
        
        editLinkModal: document.getElementById('edit-link-modal'),
        editLinkIdInput: document.getElementById('edit-link-id-modal'),
        editLinkTitleInput: document.getElementById('edit-link-title-modal'),
        editLinkUrlInput: document.getElementById('edit-link-url-modal'),
        saveLinkChangesBtn: document.getElementById('save-link-changes-btn'),

        iconPickerModal: document.getElementById('icon-picker-modal'),
        iconPickerGrid: document.getElementById('icon-picker-grid'),
        addGroupIconInput: document.getElementById('add-group-icon-input'),
        addIconPickerBtn: document.getElementById('add-icon-picker-btn'),
        editGroupIconInput: document.getElementById('edit-group-icon-input'),
        editIconPickerBtn: document.getElementById('edit-icon-picker-btn'),

        settingsModal: document.getElementById('settings-modal'),
        openSettingsModalBtn: document.getElementById('open-settings-modal-btn'),
        themeSwitcherBtn: document.getElementById('theme-switcher'),
        densityRadios: document.querySelectorAll('input[name="density"]'),
        colorSchemeRadios: document.querySelectorAll('input[name="color-scheme"]'),
        dashboardTitleInput: document.getElementById('dashboard-title-input'),
        dashboardTitle: document.getElementById('dashboard-title'),

        errorToast: document.getElementById('error-toast'),
    };

    const ICONS = ['folder', 'work', 'build', 'code', 'school', 'shopping_cart', 'receipt_long', 'videogame_asset', 'movie', 'music_note', 'book', 'restaurant', 'local_fire_department', 'flight', 'public', 'home'];
    let activeIconTarget = { button: null, input: null };
    
    async function handleApiCall(apiFunction, ...args) {
        try {
            await apiFunction(...args);
            refreshDashboard();
        } catch (error) {
            console.error('API Error:', error);
            ui.showErrorToast('An unexpected error occurred.');
        }
    }
    
    function checkAllLinkStatuses() {
        const linkElements = document.querySelectorAll('.link-item a');
        linkElements.forEach(async (linkElement) => {
            const url = linkElement.href;
            const statusElement = linkElement.querySelector('.link-status');
            if (!statusElement) return;
    
            try {
                const result = await api.checkLinkStatus(url);
                if (result.status === 'online') {
                    statusElement.classList.add('online');
                    statusElement.title = 'Status: Online';
                } else {
                    statusElement.classList.add('offline');
                    statusElement.title = `Status: Offline${result.code ? ` (Code: ${result.code})` : ''}`;
                }
            } catch (error) {
                console.error(`Failed to check status for ${url}`, error);
                statusElement.classList.add('offline');
                statusElement.title = 'Status: Error checking status';
            }
        });
    }

    async function refreshDashboard() {
        try {
            const data = await api.fetchDashboardData();
            ui.setState({ groups: data });
            ui.renderDashboard(elements.dashboardContainer, elements.noResultsMessage);
            initializeDragAndDrop();
            checkAllLinkStatuses();
        } catch (error) {
            console.error(error);
            ui.showErrorToast('Failed to load dashboard data.');
        }
    }
    
    function initializeDragAndDrop() {
        if (typeof Sortable === 'undefined') return;
        Sortable.create(elements.dashboardContainer, {
            animation: 150,
            handle: '.link-group-header',
            onEnd: async () => {
                const groupsData = Array.from(document.querySelectorAll('.link-group')).map((groupEl, index) => ({
                    id: groupEl.dataset.groupId,
                    links: Array.from(groupEl.querySelectorAll('.link-item')).map(linkEl => linkEl.dataset.linkId)
                }));
                await api.updatePositions(groupsData);
            }
        });
        document.querySelectorAll('.links-list').forEach(list => {
            Sortable.create(list, {
                group: 'links',
                animation: 150,
                onEnd: async () => {
                    const groupsData = Array.from(document.querySelectorAll('.link-group')).map((groupEl, index) => ({
                        id: groupEl.dataset.groupId,
                        links: Array.from(groupEl.querySelectorAll('.link-item')).map(linkEl => linkEl.dataset.linkId)
                    }));
                    await api.updatePositions(groupsData);
                }
            });
        });
    }

    elements.openAddModalBtn.addEventListener('click', () => {
        elements.addIconPickerBtn.innerHTML = `<span class="material-icons-outlined">folder</span>`;
        elements.newGroupNameInput.value = '';
        elements.addGroupIconInput.value = 'folder';
        ui.openModal(elements.addGroupModal);
        elements.newGroupNameInput.focus();
    });

    elements.addGroupBtn.addEventListener('click', () => {
        const name = elements.newGroupNameInput.value.trim();
        const icon = elements.addGroupIconInput.value.trim();
        if (!name) return;
        handleApiCall(api.addGroup, name, icon);
        ui.closeModal(elements.addGroupModal);
    });

    elements.saveGroupChangesBtn.addEventListener('click', () => {
        const groupId = elements.editGroupIdInput.value;
        const name = elements.editGroupNameInput.value.trim();
        const icon = elements.editGroupIconInput.value.trim();
        if (!name) return;
        handleApiCall(api.updateGroup, groupId, name, icon);
        ui.closeModal(elements.editGroupModal);
    });

    elements.addLinkBtnModal.addEventListener('click', () => {
        const groupId = elements.addLinkGroupIdInput.value;
        const title = elements.newLinkTitleInput.value.trim();
        let url = elements.newLinkUrlInput.value.trim();
        if (!title || !url) return ui.showErrorToast('Title and URL are required.');
        if (!url.startsWith('http://') && !url.startsWith('https://')) {
            url = 'https://' + url;
        }
        handleApiCall(api.addLink, groupId, title, url);
        ui.closeModal(elements.addLinkModal);
    });

    elements.saveLinkChangesBtn.addEventListener('click', () => {
        const linkId = elements.editLinkIdInput.value;
        const title = elements.editLinkTitleInput.value.trim();
        let url = elements.editLinkUrlInput.value.trim();
        if (!title || !url) return ui.showErrorToast('Title and URL are required.');
        if (!url.startsWith('http://') && !url.startsWith('https://')) {
            url = 'https://' + url;
        }
        handleApiCall(api.updateLink, linkId, title, url);
        ui.closeModal(elements.editLinkModal);
    });

    elements.dashboardContainer.addEventListener('click', (e) => {
        const targetBtn = e.target.closest('button');
        if (!targetBtn) return;

        const { groupId, linkId, groupName, groupIcon, linkTitle, linkUrl } = targetBtn.dataset;

        if (targetBtn.classList.contains('delete-group-btn')) {
            if (confirm('Are you sure you want to delete this group and all its links?')) {
                handleApiCall(api.deleteGroup, groupId);
            }
        } else if (targetBtn.classList.contains('delete-link-btn')) {
            if (confirm('Are you sure you want to delete this link?')) {
                handleApiCall(api.deleteLink, linkId);
            }
        } else if (targetBtn.classList.contains('add-link-to-group-btn')) {
            elements.addLinkGroupIdInput.value = groupId;
            elements.newLinkTitleInput.value = '';
            elements.newLinkUrlInput.value = '';
            ui.openModal(elements.addLinkModal);
            elements.newLinkTitleInput.focus();
        } else if (targetBtn.classList.contains('edit-group-btn')) {
            elements.editGroupIdInput.value = groupId;
            elements.editGroupIconInput.value = groupIcon;
            elements.editIconPickerBtn.innerHTML = `<span class="material-icons-outlined">${groupIcon}</span>`;
            elements.editGroupNameInput.value = decodeURIComponent(groupName);
            ui.openModal(elements.editGroupModal);
            elements.editGroupNameInput.focus();
        } else if (targetBtn.classList.contains('edit-link-btn')) {
            elements.editLinkIdInput.value = linkId;
            elements.editLinkTitleInput.value = decodeURIComponent(linkTitle);
            elements.editLinkUrlInput.value = decodeURIComponent(linkUrl);
            ui.openModal(elements.editLinkModal);
            elements.editLinkTitleInput.focus();
        }
    });

    const onIconSelect = (iconName) => {
        if (activeIconTarget.input && activeIconTarget.button) {
            activeIconTarget.input.value = iconName;
            activeIconTarget.button.innerHTML = `<span class="material-icons-outlined">${iconName}</span>`;
        }
        ui.closeModal(elements.iconPickerModal);
    };

    ui.populateIconPicker(elements.iconPickerGrid, ICONS, onIconSelect);

    elements.addIconPickerBtn.addEventListener('click', () => {
        activeIconTarget = { button: elements.addIconPickerBtn, input: elements.addGroupIconInput };
        ui.openModal(elements.iconPickerModal);
    });
    
    elements.editIconPickerBtn.addEventListener('click', () => {
        activeIconTarget = { button: elements.editIconPickerBtn, input: elements.editGroupIconInput };
        ui.openModal(elements.iconPickerModal);
    });
    
    let debounceTimer;
    elements.searchBar.addEventListener('input', () => {
        clearTimeout(debounceTimer);
        debounceTimer = setTimeout(() => {
            const query = elements.searchBar.value.toLowerCase().trim();
            ui.handleSearch(query, elements.noResultsMessage);
        }, 300);
    });

    elements.searchContainer.addEventListener('click', (e) => {
        if (e.target === elements.searchContainer) {
            elements.searchBar.focus();
        }
    });

    elements.searchBar.addEventListener('focus', () => {
        elements.searchContainer.classList.add('focused');
    });

    elements.searchBar.addEventListener('blur', () => {
        if (elements.searchBar.value === '') {
            elements.searchContainer.classList.remove('focused');
        }
    });

    document.querySelectorAll('.modal-close-btn').forEach(btn => btn.addEventListener('click', () => ui.closeModal(btn.closest('.modal'))));
    elements.openSettingsModalBtn.addEventListener('click', () => ui.openModal(elements.settingsModal));
    window.addEventListener('keydown', (e) => {
        if (e.key === 'Escape') {
            document.querySelectorAll('.modal.visible').forEach(ui.closeModal);
        }
    });
    window.addEventListener('click', (e) => {
        if (e.target.classList.contains('modal')) {
            ui.closeModal(e.target);
        }
    });

    function updateGreeting() {
        const now = new Date();
        const dateDisplay = document.getElementById('date-display');
        const greetingMessage = document.getElementById('greeting-message');
        
        if (dateDisplay) {
            const options = { 
                weekday: 'long', 
                year: 'numeric', 
                month: 'long', 
                day: 'numeric' 
            };
            dateDisplay.textContent = now.toLocaleDateString('en-US', options).toUpperCase();
        }
        
        if (greetingMessage) {
            const hour = now.getHours();
            let greeting;
            
            if (hour < 12) {
                greeting = 'Good morning!';
            } else if (hour < 17) {
                greeting = 'Good afternoon!';
            } else {
                greeting = 'Good evening!';
            }
            
            greetingMessage.textContent = greeting;
        }
    }
    
    function initializeGreeting() {
        updateGreeting();
        setInterval(updateGreeting, 60000);
    }

    initializeGreeting();
    initializeSettings(elements);
    refreshDashboard();
});