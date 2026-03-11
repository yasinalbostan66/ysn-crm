/* 
 * announcements.js - Announcement system for users 
 */

function renderAnnouncements() {
    const listContainer = document.getElementById('announcements-container');
    if (!listContainer) return;

    let announcements = [];
    try { announcements = JSON.parse(localStorage.getItem('crm_announcements') || '[]'); } catch (e) { announcements = []; }

    // Admin check for "Add Announcement" button
    const addBtn = document.getElementById('add-announcement-btn');
    if (addBtn) {
        if (currentUser && currentUser.role === 'admin') {
            addBtn.style.display = 'flex';
            // Add Multi-delete UI if it doesn't exist
            if (!document.getElementById('multi-delete-bar')) {
                const bar = document.createElement('div');
                bar.id = 'multi-delete-bar';
                bar.style.cssText = 'display:none; align-items:center; gap:1rem; background:rgba(239, 68, 68, 0.05); padding: 0.75rem 1.5rem; border-radius: 0.5rem; border: 1px solid rgba(239, 68, 68, 0.2); margin-top: 1rem;';
                bar.innerHTML = `
                    <div style="display:flex; align-items:center; gap:0.5rem;">
                        <input type="checkbox" id="ann-select-all" onclick="toggleSelectAllAnnouncements(this.checked)" style="width:16px; height:16px; cursor:pointer;">
                        <span style="font-size:0.75rem; font-weight:700; color:var(--danger);">Tümünü Seç</span>
                    </div>
                    <button onclick="deleteSelectedAnnouncements()" class="btn btn-danger" style="padding: 0.4rem 1rem; font-size: 0.7rem; font-weight:800; border-radius:2rem;">
                        <i class="fa-solid fa-trash-can"></i> Seçilenleri Sil (<span id="selected-ann-count">0</span>)
                    </button>
                    <button onclick="cancelMultiDeleteAnn()" style="background:none; border:none; color:var(--text-light); font-size:0.7rem; cursor:pointer; font-weight:700;">Vazgeç</button>
                `;
                addBtn.parentElement.after(bar);
            }
        } else {
            addBtn.style.display = 'none';
        }
    }

    if (announcements.length === 0) {
        listContainer.innerHTML = `
            <div style="grid-column: 1 / -1; text-align: center; background: var(--card-bg); border: 1px dashed var(--border); padding: 5rem; border-radius: 1rem; color: var(--text-light);">
                <i class="fa-solid fa-bullhorn" style="font-size: 3rem; margin-bottom: 2rem; opacity: 0.3;"></i>
                <p style="font-size: 1.1rem; font-weight: 500;">Henüz yayınlanmış bir duyuru bulunmamaktadır.</p>
            </div>
        `;
        return;
    }

    listContainer.innerHTML = announcements.sort((a, b) => new Date(b.date) - new Date(a.date)).map(ann => {
        const dateStr = new Date(ann.date).toLocaleDateString('tr-TR', { day: 'numeric', month: 'long', year: 'numeric', hour: '2-digit', minute: '2-digit' });
        const typeIcon = ann.isSystem ? 'fa-gears' : 'fa-bullhorn';
        const typeColor = ann.isSystem ? 'var(--secondary)' : 'var(--primary)';
        const typeLabel = ann.isSystem ? 'SİSTEM GÜNCELLEMESİ' : 'DUYURU';

        return `
            <div class="stat-card announcement-card" data-id="${ann.id}" style="padding: 1.5rem; position: relative; border-left: 4px solid ${typeColor}; background: ${ann.isSystem ? 'rgba(var(--primary-rgb),0.02)' : 'var(--card-bg)'}">
                ${(currentUser && currentUser.role === 'admin') ? `
                    <div style="position:absolute; top: 1.5rem; left: -2.5rem; width: 24px; height: 24px; display:flex; align-items:center;">
                        <input type="checkbox" class="ann-checkbox" value="${ann.id}" onchange="updateSelectedAnnCount()" style="width:18px; height:18px; cursor:pointer;">
                    </div>
                    <style>.announcement-card { margin-left: 0; transition: margin-left 0.3s; } .multi-delete-active .announcement-card { margin-left: 3rem; }</style>
                ` : ''}
                <div style="display:flex; align-items:center; gap:0.5rem; margin-bottom: 0.5rem;">
                    <i class="fa-solid ${typeIcon}" style="font-size: 0.75rem; color: ${typeColor};"></i>
                    <span style="font-size: 0.65rem; font-weight: 800; color: ${typeColor}; text-transform: uppercase;">${typeLabel}</span>
                </div>
                <div style="display: flex; justify-content: space-between; align-items: flex-start; margin-bottom: 1rem;">
                    <div>
                        <h3 style="font-size: 1.1rem; font-weight: 800; color: var(--text);">${ann.title}</h3>
                        <span style="font-size: 0.75rem; color: var(--text-light); font-weight: 700;">📅 ${dateStr}</span>
                    </div>
                    ${(currentUser && currentUser.role === 'admin') ? `
                        <button onclick="deleteAnnouncement('${ann.id}')" 
                                style="background: rgba(var(--danger-rgb), 0.1); border: none; padding: 0.4rem; border-radius: 0.4rem; cursor: pointer; color: var(--danger); transition: all 0.2s;"
                                onmouseover="this.style.background='var(--danger)';this.style.color='white'"
                                onmouseout="this.style.background='rgba(var(--danger-rgb), 0.1)';this.style.color='var(--danger)'"
                                title="Duyuruyu Sil">
                            <i class="fa-solid fa-trash-can"></i>
                        </button>
                    ` : ''}
                </div>
                <div style="font-size: 0.9rem; line-height: 1.6; color: var(--text); background: var(--bg); padding: 1.25rem; border-radius: 0.75rem; border: 1px solid var(--border);">
                    ${(ann.text || '').replace(/\n/g, '<br>')}
                </div>
            </div>
        `;
    }).join('');
}

function openAnnouncementModal() {
    const modal = document.getElementById('announcement-modal');
    if (modal) modal.style.display = 'flex';
}

function closeAnnouncementModal() {
    const modal = document.getElementById('announcement-modal');
    if (modal) modal.style.display = 'none';
}

function handleNewAnnouncement(event) {
    event.preventDefault();
    try {
        const titleEl = document.getElementById('ann-title');
        const textEl = document.getElementById('ann-text');

        if (!titleEl || !textEl) throw new Error('Duyuru elemanları bulunamadı.');

        const title = titleEl.value.trim();
        const text = textEl.value.trim();

        if (!title || !text) {
            alert('Lütfen başlık ve içerik alanlarını doldurun.');
            return;
        }

        let announcements = [];
        try {
            announcements = JSON.parse(localStorage.getItem('crm_announcements') || '[]');
        } catch (e) {
            announcements = [];
        }

        const newAnn = { id: Date.now(), title, text, date: new Date().toISOString() };
        announcements.unshift(newAnn);
        localStorage.setItem('crm_announcements', JSON.stringify(announcements));

        if (typeof logActivity === 'function') {
            logActivity('yeni bir duyuru yayınladı:', title);
        }

        renderAnnouncements();
        if (typeof renderHomeAnnouncement === 'function') renderHomeAnnouncement();

        closeAnnouncementModal();
        if (event.target && typeof event.target.reset === 'function') {
            event.target.reset();
        }
    } catch (error) {
        console.error('Duyuru yayınlama hatası:', error);
        alert('Duyuru yayınlanırken bir hata oluştu: ' + error.message);
    }
}

function deleteAnnouncement(id) {
    if (!confirm('Duyuru silinsin mi?')) return;
    let announcements = [];
    try { announcements = JSON.parse(localStorage.getItem('crm_announcements') || '[]'); } catch (e) { announcements = []; }
    announcements = announcements.filter(a => a.id != id);
    localStorage.setItem('crm_announcements', JSON.stringify(announcements));
    renderAnnouncements();
}

function renderHomeAnnouncement() {
    const box = document.getElementById('home-announcement-box');
    if (!box) return;
    let ann = [];
    try { ann = JSON.parse(localStorage.getItem('crm_announcements') || '[]'); } catch (e) { ann = []; }

    if (ann.length === 0) {
        box.innerHTML = '<div style="font-size:0.75rem; color:var(--text-light); font-style:italic;">Yeni duyuru bulunmuyor.</div>';
        return;
    }

    const latest = ann.slice(0, 2);
    box.innerHTML = latest.map(item => {
        const typeIcon = item.isSystem ? 'fa-gears' : 'fa-bullhorn';
        const typeColor = item.isSystem ? 'var(--secondary)' : 'var(--primary)';
        return `
            <div style="margin-bottom: 0.75rem; padding-bottom: 0.75rem; border-bottom: 1px solid var(--border);">
                <div style="display:flex; align-items:center; gap:0.5rem; color:${typeColor}; margin-bottom:0.2rem;">
                    <i class="fa-solid ${typeIcon}" style="font-size:0.7rem;"></i>
                    <span style="font-size:0.65rem; font-weight:800; text-transform:uppercase;">${item.title}</span>
                </div>
                <p style="font-size:0.75rem; color:var(--text); line-height:1.4;">${(item.text || '').substring(0, 80)}${(item.text || '').length > 80 ? '...' : ''}</p>
            </div>
        `;
    }).join('') + `
        <button onclick="showView('announcements')" style="background:none; border:none; color:var(--primary); font-size:0.65rem; font-weight:700; cursor:pointer; padding:0;">TÜMÜNÜ GÖR &raquo;</button>
    `;
}
function toggleSelectAllAnnouncements(checked) {
    document.querySelectorAll('.ann-checkbox').forEach(cb => cb.checked = checked);
    updateSelectedAnnCount();
}

function updateSelectedAnnCount() {
    const checked = document.querySelectorAll('.ann-checkbox:checked');
    const bar = document.getElementById('multi-delete-bar');
    const countSpan = document.getElementById('selected-ann-count');
    const container = document.getElementById('announcements-container');

    if (checked.length > 0) {
        bar.style.display = 'flex';
        container.classList.add('multi-delete-active');
        countSpan.innerText = checked.length;
    } else {
        bar.style.display = 'none';
        container.classList.remove('multi-delete-active');
    }
}

function cancelMultiDeleteAnn() {
    document.querySelectorAll('.ann-checkbox').forEach(cb => cb.checked = false);
    updateSelectedAnnCount();
}

function deleteSelectedAnnouncements() {
    const checked = Array.from(document.querySelectorAll('.ann-checkbox:checked')).map(cb => cb.value);
    if (checked.length === 0) return;

    if (confirm(`${checked.length} adet duyuru silinecek. Emin misiniz?`)) {
        let announcements = [];
        try { announcements = JSON.parse(localStorage.getItem('crm_announcements') || '[]'); } catch (e) { announcements = []; }
        announcements = announcements.filter(a => !checked.includes(String(a.id)));
        localStorage.setItem('crm_announcements', JSON.stringify(announcements));
        renderAnnouncements();
        updateSelectedAnnCount();
    }
}
