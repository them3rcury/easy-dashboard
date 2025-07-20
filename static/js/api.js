export async function fetchDashboardData() {
    const response = await fetch('/api/dashboard');
    if (!response.ok) {
        throw new Error('Failed to fetch dashboard data');
    }
    return response.json();
}

export async function addGroup(name, icon) {
    await fetch('/api/groups', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name, icon }),
    });
}

export async function updateGroup(groupId, name, icon) {
    await fetch(`/api/groups/${groupId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name, icon }),
    });
}

export async function deleteGroup(groupId) {
    await fetch(`/api/groups/${groupId}`, { method: 'DELETE' });
}

export async function addLink(groupId, title, url) {
    await fetch('/api/links', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ group_id: groupId, title, url }),
    });
}

export async function updateLink(linkId, title, url) {
    await fetch(`/api/links/${linkId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ title, url }),
    });
}

export async function deleteLink(linkId) {
    await fetch(`/api/links/${linkId}`, { method: 'DELETE' });
}

export async function updatePositions(groupsData) {
    await fetch('/api/update-positions', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ groups: groupsData }),
    });
}

export async function checkLinkStatus(url) {
    const response = await fetch('/api/check-status', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ url }),
    });
    if (!response.ok) {
        throw new Error('Failed to check link status');
    }
    return response.json();
}