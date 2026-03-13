/* 
 * components.js - Sidebar, TopNavBar, and UI common components 
 */

function renderSidebar() {
    const sidebarTarget = document.getElementById('sidebar-target');
    if (!sidebarTarget) return;

    const currentPage = window.location.pathname.split('/').pop() || 'index.html';

    const menuItems = [
        { icon: 'fa-solid fa-house-chimney', label: 'Anasayfa', view: 'home', id: 'index.html' },
        { icon: 'fa-solid fa-chart-column', label: 'Satış Analizi', view: 'dashboard', id: 'sales-analysis.html' },
        { icon: 'fa-solid fa-file-invoice-dollar', label: 'Teklif Oluştur', view: 'quotes', id: 'quotes.html' },
        { icon: 'fa-solid fa-building-user', label: 'Firma Listesi', view: 'customers', id: 'companies.html' },
        { icon: 'fa-solid fa-magnifying-glass-chart', label: 'Firma Analizi', view: 'revenue', id: 'company-analysis.html' },
        { icon: 'fa-solid fa-users-gear', label: 'Kullanıcılar', view: 'users-mgmt', id: 'users.html' },
        { icon: 'fa-solid fa-diagram-next', label: 'Satış Evreleri', view: 'kanban', id: 'sales-pipeline.html' },
        { icon: 'fa-solid fa-calendar-check', label: 'Ziyaret Takvimi', view: 'visits', id: 'calendar.html' },
        { icon: 'fa-solid fa-rocket', label: 'Pazarlama', view: 'marketing', id: 'marketing.html' },
        { icon: 'fa-solid fa-gears', label: 'Teknik Servis ve Destek', view: 'support', id: 'technical-service.html' },
        { icon: 'fa-solid fa-boxes-stacked', label: 'Stok Yönetimi', view: 'stock', id: 'stock.html' },
        { icon: 'fa-solid fa-calculator', label: 'Muhasebe', view: 'accounting', id: 'accounting.html' },
        { icon: 'fa-solid fa-bullhorn', label: 'Duyurular', view: 'announcements', id: 'announcements.html' },
        { icon: 'fa-solid fa-cloud-arrow-up', label: 'Yedekleme', action: 'showBackupModal', id: 'backup' }
    ];

    let html = `
        <aside class="sidebar" style="display: flex; flex-direction: column; height: 100vh; padding-top: 0 !important;">
            <div class="logo-container" style="padding: 2.5rem 1.5rem; background: white; flex-shrink: 0; display: flex; justify-content: center;">
                <div class="logo" style="padding: 0; cursor: pointer;" onclick="window.location.href='index.html'">
                    <img src="img/logo.png" style="width: 240px; height: auto; display: block;">
                </div>
            </div>
            
            <ul class="nav-menu" style="flex: 1; overflow-y: auto; padding: 1rem 0;">
    `;

    menuItems.forEach(item => {
        const isActive = currentPage === item.id || (currentPage === '' && item.id === 'index.html');
        const vId = item.view || item.id;

        if (item.id === 'backup') {
            html += `
                <li class="nav-item" onclick="showBackupModal()">
                    <i class="${item.icon}" style="width: 20px; font-size: 1rem;"></i>
                    ${item.label}
                </li>
            `;
        } else {
            html += `
                <li class="nav-item ${isActive ? 'active' : ''}" data-view="${vId}" onclick="window.location.href='${item.id}'">
                    <i class="${item.icon}" style="width: 20px; font-size: 1rem;"></i>
                    ${item.label}
                </li>
            `;
        }
    });

    const uName = currentUser ? currentUser.name : 'Misafir';
    const uRole = (currentUser && currentUser.role === 'admin') ? 'Yönetici' : 'Kullanıcı';

    html += `
            </ul>

            <div id="users-status-pane" style="margin: 0.5rem 1.5rem 1rem 1.5rem; padding: 1rem; background: rgba(255,255,255,0.03); border-radius: 0.8rem; border: 1px solid rgba(255,255,255,0.05);">
                <h4 style="font-size: 0.65rem; color: #64748b; margin-bottom: 0.75rem; text-transform: uppercase; font-weight: 800; letter-spacing: 0.05em; display: flex; align-items: center; gap: 0.5rem;">
                    <span style="width: 6px; height: 6px; background: #10b981; border-radius: 50%; display: inline-block;"></span>
                    Aktif Kullanıcılar
                </h4>
                <div id="users-status-list" style="display: flex; flex-wrap: wrap; gap: 0.5rem;"></div>
            </div>

            <div class="sidebar-footer" style="padding: 1rem; border-top: 1px solid rgba(255,255,255,0.05); background: rgba(0,0,0,0.1); flex-shrink: 0;">
                <div style="display: flex; align-items: center; gap: 0.75rem; margin-bottom: 1rem; padding: 0.5rem; background: rgba(255,255,255,0.03); border-radius: 0.5rem;">
                    <img src="https://ui-avatars.com/api/?name=${encodeURIComponent(uName)}&background=0284c7&color=fff" style="width: 32px; height: 32px; border-radius: 50%; border: 1px solid rgba(255,255,255,0.1);">
                    <div style="flex: 1; overflow: hidden;">
                        <div id="sidemenu-user-name" style="font-size: 0.8rem; font-weight: 700; color: white; white-space: nowrap; overflow: hidden; text-overflow: ellipsis;" title="${uName}">${uName}</div>
                        <div id="sidemenu-user-role" style="font-size: 0.65rem; color: #94a3b8; font-weight: 600;">${uRole}</div>
                    </div>
                </div>

                <div style="display: flex; gap: 0.5rem;">
                    <button onclick="toggleTheme()" title="Temayı Değiştir" style="flex: 1; background: rgba(255,255,255,0.05); border: 1px solid rgba(255,255,255,0.1); color: white; padding: 0.5rem; border-radius: 0.4rem; cursor: pointer; display: flex; align-items: center; justify-content: center; transition: all 0.2s;">
                        <i class="fa-solid fa-circle-half-stroke" style="font-size: 0.9rem;"></i>
                    </button>
                    <button onclick="handleLogout()" title="Çıkış Yap" style="flex: 1; background: rgba(239, 68, 68, 0.1); border: 1px solid rgba(239, 68, 68, 0.2); color: #ef4444; padding: 0.5rem; border-radius: 0.4rem; cursor: pointer; display: flex; align-items: center; justify-content: center; gap: 0.4rem; font-size: 0.75rem; font-weight: 700; transition: all 0.2s;">
                        <i class="fa-solid fa-right-from-bracket"></i>
                        ÇIKIŞ
                    </button>
                </div>
            </div>
        </aside>
    `;

    sidebarTarget.innerHTML = html;
    if (typeof updateUsersStatusPane === 'function') updateUsersStatusPane();
}

function renderTopNavBar() {
    const main = document.querySelector('main.main-content') || document.querySelector('main');
    if (!main) return;

    const existingNav = document.getElementById('top-nav-bar');
    if (existingNav && existingNav.children.length > 0) return;

    const pageNames = {
        'index.html': 'Ana Sayfa',
        'sales-analysis.html': 'Satış Analizi',
        'companies.html': 'Firmalar',
        'company-analysis.html': 'Firma Analizi',
        'users.html': 'Kullanıcılar',
        'sales-pipeline.html': 'Satış Hattı (Kanban)',
        'announcements.html': 'Duyurular',
        'calendar.html': 'Ziyaret Takvimi',
        'marketing.html': 'Pazarlama',
        'technical-service.html': 'Teknik Servis',
        'quotes.html': 'Teklif Yönetimi',
        'stock.html': 'Stok Yönetimi',
        'accounting.html': 'Muhasebe'
    };
    const path = window.location.pathname.split('/').pop() || 'index.html';
    const pageName = pageNames[path] || 'LİNKUP CRM';

    const navHTML = `
        <div style="display: flex; align-items: center; gap: 1rem;">
            <button class="mobile-menu-btn" onclick="document.body.classList.toggle('sidebar-active')" style="display: none; background: transparent; border: none; font-size: 1.25rem; color: var(--text); cursor: pointer; padding: 0.5rem; border-radius: 0.5rem;">
                <i class="fa-solid fa-bars"></i>
            </button>
            <div style="display: flex; gap: 0.5rem; background: rgba(0,0,0,0.03); padding: 0.25rem; border-radius: 0.5rem;" class="nav-history-btns">
                <button onclick="window.history.back()" title="Geri" class="btn-top-nav" style="background:transparent; border:none; padding: 0.5rem 0.8rem;">
                    <i class="fa-solid fa-arrow-left"></i>
                </button>
                <button onclick="window.history.forward()" title="İleri" class="btn-top-nav" style="background:transparent; border:none; padding: 0.5rem 0.8rem;">
                    <i class="fa-solid fa-arrow-right"></i>
                </button>
            </div>
            <div style="height: 20px; width: 1px; background: var(--border);" class="nav-divider"></div>
            <div style="display:flex;align-items:center;gap:0.5rem;">
                <i class="fa-solid fa-map-location-dot" style="color:var(--primary);font-size:0.9rem;"></i>
                <span style="font-weight:700;font-size:0.95rem;color:var(--text);">${pageName}</span>
            </div>
        </div>
        <div style="display: flex; align-items: center; gap: 1rem;">
            <div style="text-align: right; line-height: 1.2;">
                <img src="img/logo.png" style="height: 75px; width: auto; opacity: 1;">
            </div>
        </div>
    `;

    const navStyle = `
        display: flex; align-items: center; justify-content: space-between;
        padding: 0.75rem 2rem; margin-bottom: 2rem;
        background: var(--card-bg); border-bottom: 1px solid var(--border);
        box-shadow: 0 1px 3px rgba(0,0,0,0.05);
        position: sticky; top: 0; z-index: 100;
        width: calc(100% + 4rem); margin-left: -2rem; margin-right: -2rem; margin-top: -2rem;
    `;

    if (existingNav) {
        // Populate existing empty placeholder div
        existingNav.style.cssText = navStyle;
        existingNav.innerHTML = navHTML;
    } else {
        const navBar = document.createElement('div');
        navBar.id = 'top-nav-bar';
        navBar.style.cssText = navStyle;
        navBar.innerHTML = navHTML;
        main.insertBefore(navBar, main.firstChild);
    }
}

document.addEventListener('DOMContentLoaded', () => {
    // Session check for redirects
    const session = localStorage.getItem('crm_user_session') || sessionStorage.getItem('crm_user_session');
    const path = window.location.pathname.split('/').pop() || 'index.html';

    // Redirect only if not on index.html and session missing
    if (!session && path !== 'index.html' && path !== 'auth.html' && path !== 'login.html') {
        window.location.href = 'index.html';
        return;
    }

    renderSidebar();
    renderTopNavBar();
});
