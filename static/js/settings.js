function applyAndSave(key, value, attribute, element) {
    localStorage.setItem(key, value);
    if (attribute && element) {
        element.setAttribute(attribute, value);
    }
}

export function initializeSettings(elements) {
    const {
        themeSwitcherBtn,
        densityRadios,
        colorSchemeRadios,
        dashboardTitleInput,
        dashboardTitle
    } = elements;

    const savedTheme = localStorage.getItem('theme') || (window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light');
    applyAndSave('theme', savedTheme, 'data-theme', document.documentElement);

    const savedDensity = localStorage.getItem('dashboardDensity') || 'default';
    applyAndSave('dashboardDensity', savedDensity, 'data-density', document.body);
    document.getElementById(`density-${savedDensity}`).checked = true;

    const savedColorScheme = localStorage.getItem('dashboardColorScheme') || 'default';
    applyAndSave('dashboardColorScheme', savedColorScheme, 'data-color-scheme', document.documentElement);
    document.getElementById(`color-${savedColorScheme}`).checked = true;
    
    const savedTitle = localStorage.getItem('dashboardTitle') || 'My Dashboard';
    dashboardTitle.textContent = savedTitle;
    dashboardTitleInput.value = savedTitle;

    themeSwitcherBtn.addEventListener('click', () => {
        const newTheme = document.documentElement.getAttribute('data-theme') === 'dark' ? 'light' : 'dark';
        applyAndSave('theme', newTheme, 'data-theme', document.documentElement);
    });

    densityRadios.forEach(radio => radio.addEventListener('change', (e) => applyAndSave('dashboardDensity', e.target.value, 'data-density', document.body)));
    colorSchemeRadios.forEach(radio => radio.addEventListener('change', (e) => applyAndSave('dashboardColorScheme', e.target.value, 'data-color-scheme', document.documentElement)));
    
    dashboardTitleInput.addEventListener('input', (e) => {
        const newTitle = e.target.value;
        dashboardTitle.textContent = newTitle;
        applyAndSave('dashboardTitle', newTitle);
    });
}