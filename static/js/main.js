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
    };

    const ICONS = ['folder', 'work', 'build', 'code', 'school', 'shopping_cart', 'receipt_long', 'videogame_asset', 'movie', 'music_note', 'book', 'restaurant', 'local_fire_department', 'flight', 'public', 'home'];
    let activeIconTarget = { button: null, input: null };
    
    async function refreshDashboard() {
        try {
            const data = await api.fetchDashboardData();
            ui.setState({ groups: data });
            ui.renderDashboard(elements.dashboardContainer, elements.noResultsMessage);
            initializeDragAndDrop();
        } catch (error) {
            console.error(error);
            elements.dashboardContainer.innerHTML = `<p>${error.message}</p>`;
        }
    }
    
    function initializeDragAndDrop() {
        Sortable.create(elements.dashboardContainer, {
            animation: 150,
            handle: '.link-group-header',
            onEnd: async () => {
                const groupsData = Array.from(document.querySelectorAll('.link-group')).map((groupEl, index) => ({
                    id: groupEl.dataset.groupId,
                    position: index,
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
                        position: index,
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

    elements.addGroupBtn.addEventListener('click', async () => {
        const name = elements.newGroupNameInput.value.trim();
        const icon = elements.addGroupIconInput.value.trim();
        if (!name) return;
        await api.addGroup(name, icon);
        ui.closeModal(elements.addGroupModal);
        refreshDashboard();
    });

    elements.saveGroupChangesBtn.addEventListener('click', async () => {
        const groupId = elements.editGroupIdInput.value;
        const name = elements.editGroupNameInput.value.trim();
        const icon = elements.editGroupIconInput.value.trim();
        if (!name) return;
        await api.updateGroup(groupId, name, icon);
        ui.closeModal(elements.editGroupModal);
        refreshDashboard();
    });

    elements.addLinkBtnModal.addEventListener('click', async () => {
        const groupId = elements.addLinkGroupIdInput.value;
        const title = elements.newLinkTitleInput.value.trim();
        const url = elements.newLinkUrlInput.value.trim();
        if (!title || !url) return alert('Title and URL are required.');
        await api.addLink(groupId, title, url);
        ui.closeModal(elements.addLinkModal);
        refreshDashboard();
    });

    elements.saveLinkChangesBtn.addEventListener('click', async () => {
        const linkId = elements.editLinkIdInput.value;
        const title = elements.editLinkTitleInput.value.trim();
        const url = elements.editLinkUrlInput.value.trim();
        if (!title || !url) return alert('Title and URL are required.');
        await api.updateLink(linkId, title, url);
        ui.closeModal(elements.editLinkModal);
        refreshDashboard();
    });

    elements.dashboardContainer.addEventListener('click', async (e) => {
        const targetBtn = e.target.closest('button');
        if (!targetBtn) return;

        if (targetBtn.classList.contains('delete-group-btn')) {
            if (confirm('Are you sure you want to delete this group and all its links?')) {
                await api.deleteGroup(targetBtn.dataset.groupId);
                refreshDashboard();
            }
        }
        if (targetBtn.classList.contains('delete-link-btn')) {
            if (confirm('Are you sure you want to delete this link?')) {
                await api.deleteLink(targetBtn.dataset.linkId);
                refreshDashboard();
            }
        }
        if (targetBtn.classList.contains('add-link-to-group-btn')) {
            elements.addLinkGroupIdInput.value = targetBtn.dataset.groupId;
            ui.openModal(elements.addLinkModal);
            elements.newLinkTitleInput.focus();
        }
        if (targetBtn.classList.contains('edit-group-btn')) {
            elements.editGroupIdInput.value = targetBtn.dataset.groupId;
            elements.editGroupIconInput.value = targetBtn.dataset.groupIcon;
            elements.editIconPickerBtn.innerHTML = `<span class="material-icons-outlined">${targetBtn.dataset.groupIcon}</span>`;
            elements.editGroupNameInput.value = decodeURIComponent(targetBtn.dataset.groupName);
            ui.openModal(elements.editGroupModal);
            elements.editGroupNameInput.focus();
        }
        if (targetBtn.classList.contains('edit-link-btn')) {
            elements.editLinkIdInput.value = targetBtn.dataset.linkId;
            elements.editLinkTitleInput.value = decodeURIComponent(targetBtn.dataset.linkTitle);
            elements.editLinkUrlInput.value = decodeURIComponent(targetBtn.dataset.linkUrl);
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

    elements.searchBar.addEventListener('input', () => {
        const query = elements.searchBar.value.toLowerCase().trim();
        ui.handleSearch(query, elements.noResultsMessage);
    });

    elements.searchContainer.addEventListener('click', () => {
        elements.searchBar.focus();
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
    window.addEventListener('click', (e) => {
        if (e.target.classList.contains('modal')) {
            ui.closeModal(e.target);
        }
    });

    initializeSettings(elements);
    refreshDashboard();
});