/* 
 * users.js - User management and status pane 
 */

function openAddUserModal() {
    const modal = document.getElementById('add-user-modal');
    if (modal) modal.style.display = 'flex';
}

function closeAddUserModal() {
    const modal = document.getElementById('add-user-modal');
    if (modal) modal.style.display = 'none';
}

function loadUsersTable() {
    const tableBody = document.getElementById('users-table-body');
    if (!tableBody) return;
    let users = [];
    try {
        users = JSON.parse(localStorage.getItem('crm_users') || '[]');
    } catch (e) { users = []; }

    const onlineUsers = JSON.parse(localStorage.getItem('crm_online_users') || '{}');

    tableBody.innerHTML = users.map(u => {
        const isOnline = !!onlineUsers[u.email];
        return `
            <tr>
                <td>
                    <div style="display: flex; align-items: center; gap: 0.75rem;">
                        <img src="https://ui-avatars.com/api/?name=${encodeURIComponent(u.name)}&background=random" style="width: 32px; height: 32px; border-radius: 50%;">
                        <div>
                            <div style="font-weight: 700;">${u.name}</div>
                            <div style="font-size: 0.75rem; color: var(--text-light);">${u.email}</div>
                        </div>
                    </div>
                </td>
                <td><span class="badge ${u.role === 'admin' ? 'badge-danger' : 'badge-primary'}">${u.role === 'admin' ? 'Yönetici' : 'Kullanıcı'}</span></td>
                <td>
                    <div style="display: flex; align-items: center; gap: 0.5rem;">
                        <span style="width: 8px; height: 8px; border-radius: 50%; background: ${isOnline ? '#10b981' : '#94a3b8'};"></span>
                        <span style="font-size: 0.8rem; font-weight: 600; color: ${isOnline ? '#10b981' : 'var(--text-light)'};">${isOnline ? 'Çevrimiçi' : 'Çevrimdışı'}</span>
                    </div>
                </td>
                <td>
                    ${currentUser.role === 'admin' ? `
                        <div style="display: flex; gap: 0.5rem;">
                            <button onclick="resetPassword('${u.email}')" class="btn btn-warning" style="padding: 0.25rem 0.6rem; font-size: 0.7rem;">Şifre Sıfırla</button>
                            ${u.email !== 'admin@admin.com' ? `<button onclick="deleteUser('${u.email}')" class="btn btn-danger" style="padding: 0.25rem 0.6rem; font-size: 0.7rem;"><i class="fa-solid fa-trash-can"></i></button>` : '-'}
                        </div>
                    ` : '-'}
                </td>
            </tr>
        `;
    }).join('');
}

function handleNewUser(event) {
    event.preventDefault();
    const name = document.getElementById('new-user-name').value;
    const email = document.getElementById('new-user-email').value;
    const password = document.getElementById('new-user-password').value;
    const role = document.getElementById('new-user-role').value;

    let users = [];
    try { users = JSON.parse(localStorage.getItem('crm_users') || '[]'); } catch (e) { users = []; }
    if (users.find(u => u.email === email)) return alert('Bu e-posta zaten kullanımda.');

    const newUser = { name, email, password, role };
    users.push(newUser);
    localStorage.setItem('crm_users', JSON.stringify(users));
    logActivity('yeni kullanıcı ekledi:', name, { detail: `Rol: ${role}` });
    loadUsersTable();
    if (typeof closeAddUserModal === 'function') closeAddUserModal();
    event.target.reset();
}

function deleteUser(email) {
    if (email === 'admin@admin.com') return alert('Ana yönetici hesabı silinemez.');
    if (!confirm('Bu kullanıcı silinecek. Emin misiniz?')) return;

    let users = [];
    try { users = JSON.parse(localStorage.getItem('crm_users') || '[]'); } catch (e) { users = []; }
    const target = users.find(u => u.email === email);
    users = users.filter(u => u.email !== email);
    localStorage.setItem('crm_users', JSON.stringify(users));
    logActivity('kullanıcıyı sistemden sildi:', target ? target.name : email);
    loadUsersTable();
}

function resetPassword(email) {
    const newPass = prompt("Yeni şifreyi giriniz:", "123");
    if (!newPass) return;
    let users = [];
    try { users = JSON.parse(localStorage.getItem('crm_users') || '[]'); } catch (e) { users = []; }
    const idx = users.findIndex(u => u.email === email);
    if (idx !== -1) {
        users[idx].password = newPass;
        localStorage.setItem('crm_users', JSON.stringify(users));
        logActivity('kullanıcı şifresini güncelledi:', users[idx].name);
        alert('Şifre başarıyla güncellendi.');
    }
}

function updateUsersStatusPane() {
    const list = document.getElementById('users-status-list');
    if (!list) return;
    let users = []; try { users = JSON.parse(localStorage.getItem('crm_users') || '[]'); } catch (e) { }

    // Ensure default admin is shown if list is otherwise empty or missing admin
    if (!users.some(u => u.email === 'admin@admin.com')) {
        users.unshift({ name: 'Sistem Yöneticisi', email: 'admin@admin.com', role: 'admin' });
    }

    const onlineMap = JSON.parse(localStorage.getItem('crm_online_users') || '{}');
    list.innerHTML = users.map(u => {
        const isOnline = !!onlineMap[u.email];
        return `<div title="${u.name} - ${isOnline ? 'Çevrimiçi' : 'Çevrimdışı'}" style="width:10px; height:10px; border-radius:50%; background:${isOnline ? '#10b981' : 'rgba(255,255,255,0.1)'}; border:1.5px solid ${isOnline ? 'white' : 'rgba(255,255,255,0.1)'}; box-shadow:0 0 4px rgba(0,0,0,0.1); flex-shrink:0;"></div>`;
    }).join('');
}
