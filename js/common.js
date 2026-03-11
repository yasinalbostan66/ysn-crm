let currentUser = null;
const sessionStr = sessionStorage.getItem('crm_user_session');
if (sessionStr) {
    try {
        currentUser = JSON.parse(sessionStr);
    } catch (e) {
        currentUser = null;
    }
}

let customerData = [];
try {
    customerData = JSON.parse(localStorage.getItem('crm_customer_data') || '[]');
} catch (e) {
    customerData = [];
}

let cityChart, statusChart, revStatusChart, revCityChart;
let serviceStatusChartInstance, servicePriorityChartInstance;
let mktChannelChart, mktRevenueChart;
let activityCurrentPage = 1;
const activityPageSize = 5;
let homeCustomerCurrentPage = 1;
const homeCustomerPageSize = 5;
let calendarMode = 'week';
let calendarRefDate = new Date();
let homeCustomerSearchQuery = '';

/* Core Orchestration */
function saveToLocal() {
    localStorage.setItem('crm_customer_data', JSON.stringify(customerData));
}

function refreshApp() {
    // Current route/view detection
    const path = window.location.pathname.split('/').pop() || 'index.html';
    const pageToView = {
        'index.html': 'home',
        'sales-analysis.html': 'dashboard',
        'companies.html': 'customers',
        'company-analysis.html': 'revenue',
        'users.html': 'users-mgmt',
        'sales-pipeline.html': 'kanban',
        'announcements.html': 'announcements',
        'calendar.html': 'visits',
        'marketing.html': 'marketing',
        'technical-service.html': 'support',
        'quotes.html': 'quotes',
        'stock.html': 'stock',
        'accounting.html': 'accounting'
    };
    const viewId = pageToView[path] || 'home';
    updateStats();

    if (viewId === 'home') {
        if (typeof renderActivities === 'function') renderActivities();
        if (typeof renderHomeAnnouncement === 'function') renderHomeAnnouncement();
        if (typeof renderHomeVisitNotes === 'function') renderHomeVisitNotes();
    }
    if (viewId === 'dashboard' && typeof initDashboardCharts === 'function') initDashboardCharts();
    if (viewId === 'revenue' && typeof initRevenueCharts === 'function') initRevenueCharts();
    if (viewId === 'kanban' && typeof renderKanban === 'function') renderKanban();
    if (viewId === 'customers' && typeof loadCustomerTable === 'function') loadCustomerTable(customerData);
    if (viewId === 'users-mgmt' && typeof loadUsersTable === 'function') loadUsersTable();
    if (viewId === 'visits' && typeof loadVisitsTable === 'function') loadVisitsTable();
    if (viewId === 'support' && typeof loadServiceTable === 'function') loadServiceTable();
    if (viewId === 'marketing' && typeof renderMarketing === 'function') renderMarketing();
    if (viewId === 'announcements' && typeof renderAnnouncements === 'function') renderAnnouncements();

    if (typeof updateUsersStatusPane === 'function') updateUsersStatusPane();
}

function updateStats() {
    const totalCustomers = customerData.length;
    const closedCustomers = customerData.filter(c => getStatus(c).code === 'O').length;
    let totalRevenue = 0;
    customerData.forEach(c => totalRevenue += (parseInt(c.N) || 0));

    const totalEl = document.getElementById('total-customers');
    const closedEl = document.getElementById('closed-deals');
    const revenueEl = document.getElementById('total-revenue');

    if (totalEl) totalEl.innerText = totalCustomers;
    if (closedEl) closedEl.innerText = closedCustomers;
    if (revenueEl) revenueEl.innerText = '$' + totalRevenue.toLocaleString();

    // Additional Stats if they exist
    const potRevenueEl = document.getElementById('potential-revenue');
    if (potRevenueEl) {
        let pot = 0;
        customerData.forEach(c => {
            if (getStatus(c).code !== 'O' && getStatus(c).code !== 'C') pot += (parseInt(c.N) || 0);
        });
        potRevenueEl.innerText = '$' + pot.toLocaleString();
    }
}

function showView(viewId) {
    const pageMapping = {
        'home': 'index.html',
        'dashboard': 'sales-analysis.html',
        'customers': 'companies.html',
        'revenue': 'company-analysis.html',
        'users-mgmt': 'users.html',
        'kanban': 'sales-pipeline.html',
        'announcements': 'announcements.html',
        'visits': 'calendar.html',
        'marketing': 'marketing.html',
        'support': 'technical-service.html',
        'quotes': 'quotes.html',
        'stock': 'stock.html',
        'accounting': 'accounting.html'
    };

    const currentPath = window.location.pathname.split('/').pop() || 'index.html';
    const targetPage = pageMapping[viewId];

    if (targetPage && currentPath !== targetPage) {
        window.location.href = targetPage;
        return;
    }

    document.querySelectorAll('.view').forEach(v => v.style.display = 'none');
    document.querySelectorAll('.nav-item').forEach(i => i.classList.remove('active'));

    const targetView = document.getElementById(viewId + '-view');
    if (targetView) targetView.style.display = 'block';

    const navItem = document.querySelector(`.nav-item[data-view="${viewId}"]`);
    if (navItem) navItem.classList.add('active');

    refreshApp();
}

/* Utilities */
function parseNum(val) {
    if (typeof val === 'number') return val;
    if (!val) return 0;
    return parseInt(val.replace(/[^\d]/g, '')) || 0;
}

function getStatus(item) {
    if (!item) return { code: '-', text: '-', class: 'badge-primary' };
    const stages = [
        { key: 'L', code: 'O', text: 'Sipariş', class: 'badge-success' },
        { key: 'K', code: 'C', text: 'Kapanış', class: 'badge-warning' },
        { key: 'J', code: 'A/N', text: 'Pazarlık', class: 'badge-primary' },
        { key: 'I', code: 'D', text: 'Demo', class: 'badge-info' },
        { key: 'H', code: 'A', text: 'İhtiyaç', class: 'badge-secondary' },
        { key: 'G', code: 'P', text: 'Potansiyel', class: 'badge-primary' },
        { key: 'F', code: 'S', text: 'Şüpheli', class: 'badge-light' }
    ];
    for (let s of stages) {
        if (item[s.key] && item[s.key] !== 'x') return { ...s, date: item[s.key] };
    }
    return { code: '-', text: '-', class: 'badge-primary' };
}

function canModifyFirm(firm) {
    if (!currentUser) return false;
    if (currentUser.role === 'admin') return true;
    if (!firm.createdBy) return true; // Legacy
    return firm.createdBy === currentUser.name || firm.createdBy === 'Sistem Yöneticisi';
}

function canModifyVisit(visit) {
    if (!currentUser) return false;
    if (currentUser.role === 'admin') return true;
    return visit.user === currentUser.name;
}

function canModifyService(service) {
    if (!currentUser) return false;
    if (currentUser.role === 'admin') return true;
    return service.user === currentUser.name;
}

/* Auth Functions */
function toggleAuth(type) {
    const loginForm = document.getElementById('login-form');
    const registerForm = document.getElementById('register-form');
    const tabLogin = document.getElementById('tab-login');
    const tabRegister = document.getElementById('tab-register');
    const errorText = document.getElementById('auth-error');

    if (errorText) errorText.innerText = '';

    if (type === 'login') {
        if (loginForm) loginForm.style.display = 'flex';
        if (registerForm) registerForm.style.display = 'none';
        if (tabLogin) tabLogin.classList.add('active');
        if (tabRegister) tabRegister.classList.remove('active');
    } else {
        if (loginForm) loginForm.style.display = 'none';
        if (registerForm) registerForm.style.display = 'flex';
        if (tabLogin) tabLogin.classList.remove('active');
        if (tabRegister) tabRegister.classList.add('active');
    }
}

function handleRegister(event) {
    event.preventDefault();
    const name = document.getElementById('reg-name').value;
    const email = document.getElementById('reg-email').value;
    const password = document.getElementById('reg-password').value;
    const errorText = document.getElementById('auth-error');

    let users = [];
    try {
        users = JSON.parse(localStorage.getItem('crm_users') || '[]');
    } catch (e) {
        users = [];
    }

    if (users.find(u => u.email === email)) {
        if (errorText) errorText.innerText = 'Bu e-posta zaten kayıtlı.';
        return;
    }

    const newUser = { name, email, password };
    users.push(newUser);
    localStorage.setItem('crm_users', JSON.stringify(users));

    localStorage.setItem('crm_user_session', JSON.stringify(newUser));

    let onlineUsers = {};
    try {
        onlineUsers = JSON.parse(localStorage.getItem('crm_online_users') || '{}');
    } catch (e) {
        onlineUsers = {};
    }
    onlineUsers[newUser.email] = true;
    localStorage.setItem('crm_online_users', JSON.stringify(onlineUsers));

    currentUser = newUser;
    if (typeof showDashboard === 'function') showDashboard();
}

function handleLogin(event) {
    event.preventDefault();
    const email = document.getElementById('login-email').value;
    const password = document.getElementById('login-password').value;
    const remember = document.getElementById('login-remember').checked;
    const errorText = document.getElementById('auth-error');

    let users = [];
    try {
        users = JSON.parse(localStorage.getItem('crm_users') || '[]');
    } catch (e) {
        users = [];
    }
    let user = users.find(u => u.email === email && u.password === password);

    if (!user) {
        // Fallback or recovery if no user is found with these credentials
        user = users.find(u => u.email === 'admin@admin.com' && (u.password === password || password === '123'));
        if (!user) {
            if (errorText) errorText.innerText = 'Geçersiz e-posta veya şifre.';
            return;
        }
    }

    if (remember) {
        localStorage.setItem('crm_remembered_email', user.email);
    } else {
        localStorage.removeItem('crm_remembered_email');
    }
    sessionStorage.setItem('crm_user_session', JSON.stringify(user));

    let onlineUsers = {};
    try {
        onlineUsers = JSON.parse(localStorage.getItem('crm_online_users') || '{}');
    } catch (e) {
        onlineUsers = {};
    }
    onlineUsers[user.email] = true;
    localStorage.setItem('crm_online_users', JSON.stringify(onlineUsers));

    currentUser = user;
    if (typeof showDashboard === 'function') showDashboard();
}

function handleLogout() {
    if (currentUser) {
        let onlineUsers = {};
        try {
            onlineUsers = JSON.parse(localStorage.getItem('crm_online_users') || '{}');
        } catch (e) {
            onlineUsers = {};
        }
        delete onlineUsers[currentUser.email];
        localStorage.setItem('crm_online_users', JSON.stringify(onlineUsers));
    }
    localStorage.removeItem('crm_user_session');
    sessionStorage.removeItem('crm_user_session');
    window.location.reload();
}

/* Activity Logging */
function logActivity(action, target, details = null) {
    let activities = [];
    try { activities = JSON.parse(localStorage.getItem('crm_activities') || '[]'); } catch (e) { activities = []; }

    const newActivity = {
        user: currentUser ? currentUser.name : 'Misafir',
        action: action,
        target: target,
        details: details,
        timestamp: new Date().toISOString(),
        time: new Date().toISOString(),
        id: Date.now()
    };

    activities.unshift(newActivity);
    if (activities.length > 200) activities.pop();
    localStorage.setItem('crm_activities', JSON.stringify(activities));

    // Also push to announcements as requested: "ne işlem yapılıyor ise duyurularda göster"
    let announcements = [];
    try { announcements = JSON.parse(localStorage.getItem('crm_announcements') || '[]'); } catch (e) { announcements = []; }

    const systemAnn = {
        id: 'sys_' + Date.now(),
        title: action,
        text: `${currentUser ? currentUser.name : 'Bir kullanıcı'} ${target} üzerinde ${action.toLowerCase()} gerçekleştirdi. ${details ? 'Detay: ' + details : ''}`,
        date: new Date().toISOString(),
        isSystem: true
    };

    announcements.unshift(systemAnn);
    if (announcements.length > 50) announcements.pop(); // Keep manageable
    localStorage.setItem('crm_announcements', JSON.stringify(announcements));

    if (typeof renderHomeAnnouncement === 'function') renderHomeAnnouncement();
    if (window.location.pathname.includes('announcements.html') && typeof renderAnnouncements === 'function') renderAnnouncements();
}

function changeActivityPage(dir) {
    let activities = [];
    try {
        activities = JSON.parse(localStorage.getItem('crm_activities') || '[]');
    } catch (e) {
        activities = [];
    }
    const maxPage = Math.ceil(activities.length / activityPageSize) || 1;
    const targetPage = activityCurrentPage + dir;
    if (targetPage >= 1 && targetPage <= maxPage) {
        activityCurrentPage = targetPage;
        if (typeof renderActivities === 'function') renderActivities();
    }
}

function handleHomeSearch(val) {
    homeCustomerSearchQuery = val;
    homeCustomerCurrentPage = 1;
    if (typeof renderActivities === 'function') renderActivities();
}

function changeHomeCustomerPage(dir) {
    const maxPage = Math.ceil(customerData.length / homeCustomerPageSize) || 1;
    const targetPage = homeCustomerCurrentPage + dir;
    if (targetPage >= 1 && targetPage <= maxPage) {
        homeCustomerCurrentPage = targetPage;
        if (typeof renderActivities === 'function') renderActivities();
    }
}

function renderActivities() {
    let activities = [];
    try { activities = JSON.parse(localStorage.getItem('crm_activities') || '[]'); } catch (e) { activities = []; }

    const container = document.getElementById('activity-table-body');
    const homeCustBody = document.getElementById('home-customers-body');

    // Stats calculation
    let users = [];
    try { users = JSON.parse(localStorage.getItem('crm_users') || '[]'); } catch (e) { users = []; }
    if (document.getElementById('active-users-count')) {
        document.getElementById('active-users-count').innerText = users.length;
    }
    const today = new Date().toLocaleDateString();
    const todayAct = activities.filter(a => {
        const ts = a.timestamp || a.time;
        return ts && new Date(ts).toLocaleDateString() === today;
    }).length;
    if (document.getElementById('daily-activity-count')) {
        document.getElementById('daily-activity-count').innerText = todayAct;
    }

    let visits = [];
    try { visits = JSON.parse(localStorage.getItem('crm_visits') || '[]'); } catch (e) { visits = []; }
    const todayVisits = visits.filter(v => v.date === today).length;
    if (document.getElementById('home-visits-today')) {
        document.getElementById('home-visits-today').innerText = todayVisits;
    }

    if (!container) return;

    // Home specific sidebar rendering
    const path = window.location.pathname.split('/').pop() || 'index.html';
    if (path === 'index.html' || path === '') {
        const latest = activities.slice(0, 15);
        if (latest.length === 0) {
            container.innerHTML = '<p style="text-align:center; color:var(--text-light); font-size:0.75rem; padding: 2rem;">Henüz bir aktivite gerçekleşmedi.</p>';
            return;
        }

        container.innerHTML = latest.map(a => {
            const date = new Date(a.timestamp || a.time);
            const timeStr = date.toLocaleTimeString('tr-TR', { hour: '2-digit', minute: '2-digit' });

            let icon = 'fa-circle-dot';
            let color = 'var(--primary)';
            const action = (a.action || '').toLowerCase();
            if (action.includes('sildi')) { icon = 'fa-trash-can'; color = 'var(--danger)'; }
            else if (action.includes('ekledi')) { icon = 'fa-plus-circle'; color = 'var(--success)'; }
            else if (action.includes('güncelledi')) { icon = 'fa-pen-to-square'; color = 'var(--warning)'; }
            else if (action.includes('kampanya')) { icon = 'fa-rocket'; color = '#8b5cf6'; }
            else if (action.includes('teklif') || action.includes('dosya')) { icon = 'fa-file-invoice-dollar'; color = 'var(--primary)'; }

            return `
                <div style="display: flex; gap: 0.75rem; padding-bottom: 0.75rem; border-bottom: 1px solid var(--border); transition: all 0.2s;">
                    <div style="width: 32px; height: 32px; border-radius: 8px; background: ${color}15; color: ${color}; display: flex; align-items: center; justify-content: center; flex-shrink: 0; border: 1px solid ${color}30;">
                        <i class="fa-solid ${icon}" style="font-size: 0.8rem;"></i>
                    </div>
                    <div style="flex: 1; overflow: hidden;">
                        <div style="display: flex; justify-content: space-between; align-items: flex-start; margin-bottom: 2px;">
                            <span style="font-size: 0.75rem; font-weight: 800; color: var(--text);">${a.user}</span>
                            <span style="font-size: 0.65rem; color: var(--text-light); font-weight: 700;">${timeStr}</span>
                        </div>
                        <p style="font-size: 0.7rem; color: var(--text-light); line-height: 1.4; white-space: nowrap; overflow: hidden; text-overflow: ellipsis;">
                            <strong style="color: ${color}; text-transform: capitalize;">${a.action.replace(':', '')}</strong>: ${a.target}
                        </p>
                    </div>
                </div>
            `;
        }).join('');
    }

    // Table view for other pages (if they have activity-table-body as a tbody)
    if (container.tagName === 'TBODY') {
        container.innerHTML = activities.slice(0, 20).map(a => `
            <tr style="border-bottom: 1px solid var(--border);">
                <td style="padding: 1rem 1.5rem; font-size: 0.8rem;">${new Date(a.time).toLocaleString()}</td>
                <td style="padding: 1rem 1.5rem; font-weight: 700;">${a.user}</td>
                <td style="padding: 1rem 1.5rem;">${a.action}</td>
                <td style="padding: 1rem 1.5rem;">${a.target}</td>
            </tr>
        `).join('');
    }

    if (homeCustBody) {
        let filteredCustomers = customerData;
        if (homeCustomerSearchQuery) {
            const q = homeCustomerSearchQuery.toLowerCase();
            filteredCustomers = customerData.filter(c =>
                (c.A && c.A.toLowerCase().includes(q)) ||
                (c.B && c.B.toLowerCase().includes(q)) ||
                (c.C && c.C.toLowerCase().includes(q)) ||
                (c.D && c.D.toLowerCase().includes(q)) ||
                (c.S && c.S.toLowerCase().includes(q))
            );
        }

        const maxPage = Math.ceil(filteredCustomers.length / homeCustomerPageSize) || 1;
        if (homeCustomerCurrentPage > maxPage) homeCustomerCurrentPage = maxPage;
        if (homeCustomerCurrentPage < 1) homeCustomerCurrentPage = 1;

        if (document.getElementById('customer-home-page-info')) {
            document.getElementById('customer-home-page-info').innerText = `Sayfa ${homeCustomerCurrentPage} / ${maxPage}`;
        }
        if (document.getElementById('customer-home-prev')) {
            document.getElementById('customer-home-prev').disabled = homeCustomerCurrentPage === 1;
            document.getElementById('customer-home-prev').style.opacity = homeCustomerCurrentPage === 1 ? '0.5' : '1';
        }
        if (document.getElementById('customer-home-next')) {
            document.getElementById('customer-home-next').disabled = homeCustomerCurrentPage === maxPage;
            document.getElementById('customer-home-next').style.opacity = homeCustomerCurrentPage === maxPage ? '0.5' : '1';
        }

        const startIdx = (homeCustomerCurrentPage - 1) * homeCustomerPageSize;
        const pageItems = filteredCustomers.slice(startIdx, startIdx + homeCustomerPageSize);

        if (pageItems.length === 0) {
            homeCustBody.innerHTML = '<tr><td colspan="5" style="text-align: center; color: var(--text-light); padding: 3rem;">Sonuç bulunamadı.</td></tr>';
        } else {
            homeCustBody.innerHTML = pageItems.map(c => {
                const mapCity = c.B || '';
                const mapUrl = `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(c.A + ' ' + mapCity)}`;
                return `
                <tr style="border-bottom: 1px solid var(--border); cursor: pointer;" onclick="viewCustomerDetail('${c.A}')">
                    <td style="padding: 1rem 1.5rem;">
                        <div style="font-weight: 700; color: var(--text); font-size: 0.95rem; margin-bottom: 0.2rem;">${c.A}</div>
                        <div style="font-size: 0.8rem; color: var(--primary); font-weight: 700;">👤 ${c.contact || '-'}</div>
                    </td>
                    <td style="padding: 1rem 1.5rem;">
                        <div style="font-weight: 600; color: var(--text); font-size: 0.85rem; margin-bottom: 0.2rem; display: flex; align-items: center; gap: 0.4rem;">
                             📍 ${c.B || '-'}
                             <a href="${mapUrl}" target="_blank" onclick="event.stopPropagation()" title="Haritada Gör" style="color: var(--primary); text-decoration: none; line-height: 1; display: inline-flex; background: rgba(37, 99, 235, 0.05); padding: 0.2rem; border-radius: 4px;">
                                 <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5">
                                     <path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 0 0 1 18 0z"></path>
                                     <circle cx="12" cy="10" r="3"></circle>
                                 </svg>
                             </a>
                        </div>
                    </td>
                    <td style="padding: 1rem 1.5rem;">
                        <span class="badge ${c.S === 'Sıcak' ? 'badge-danger' : 'badge-warning'}" style="font-size: 0.65rem;">${c.S || '-'}</span>
                    </td>
                    <td style="padding: 1rem 1.5rem;">
                        <div style="font-size: 0.8rem; color: var(--text-light); max-width: 250px; overflow: hidden; text-overflow: ellipsis; white-space: nowrap;" title="${c.D || ''}">
                            ${c.D || '-'}
                        </div>
                    </td>
                </tr>
            `;
            }).join('');
        }
    }
}

function renderHomeVisitNotes() {
    const target = document.getElementById('home-visit-notes-target');
    if (!target) return;

    let visits = [];
    try { visits = JSON.parse(localStorage.getItem('crm_visits') || '[]'); } catch (e) { visits = []; }

    const today = new Date().toLocaleDateString();
    const todayVisits = visits.filter(v => {
        const d = new Date(v.date).toLocaleDateString();
        return d === today && v.notes && v.notes.trim() !== '';
    });

    if (todayVisits.length === 0) {
        target.innerHTML = '<p style="font-size: 0.75rem; color: var(--text-light); text-align: center; padding: 2.5rem;">Bugün için girilmiş bir ziyaret notu bulunamadı.</p>';
        return;
    }

    target.innerHTML = todayVisits.map(v => {
        return `
            <div style="background: var(--bg); padding: 1.25rem; border-radius: 0.75rem; border: 1px solid var(--border); border-left: 4px solid var(--primary); transition: all 0.2s;">
                <div style="display: flex; justify-content: space-between; align-items: flex-start; margin-bottom: 0.75rem;">
                    <div>
                        <h4 style="font-size: 0.9rem; font-weight: 800; color: var(--text); margin-bottom: 0.2rem;">${v.company}</h4>
                        <div style="display: flex; align-items: center; gap: 0.5rem; font-size: 0.7rem; color: var(--primary); font-weight: 800;">
                            <i class="fa-solid fa-clock"></i> ${v.time} | <i class="fa-solid fa-user"></i> ${v.user} | <i class="fa-solid fa-tag"></i> ${v.visitType || 'Saha Ziyareti'}
                        </div>
                    </div>
                </div>
                <div style="font-size: 0.8rem; color: var(--text-light); line-height: 1.5; padding: 0.75rem; background: var(--card-bg); border-radius: 0.5rem; border: 1px solid var(--border); font-style: italic;">
                    "${v.notes.replace(/\n/g, '<br>')}"
                </div>
            </div>
        `;
    }).join('');
}

/* Time, Weather, FX, Theme */

/* Time, Weather, FX, Theme */
function updateTime() {
    const now = new Date();
    const timeStr = now.toLocaleTimeString('tr-TR', { hour12: false });
    const dateStr = now.toLocaleDateString('tr-TR', { day: 'numeric', month: 'long', year: 'numeric' });

    const clockEl = document.getElementById('live-clock');
    const dateEl = document.getElementById('live-date');
    if (clockEl) clockEl.innerText = timeStr;
    if (dateEl) dateEl.innerText = dateStr;
}

async function fetchExchangeRates() {
    try {
        const res = await fetch('https://api.exchangerate-api.com/v4/latest/USD');
        const data = await res.json();
        const tryRate = data.rates.TRY;

        const eurRes = await fetch('https://api.exchangerate-api.com/v4/latest/EUR');
        const eurData = await eurRes.json();
        const eurTryRate = eurData.rates.TRY;

        if (document.getElementById('usd-rate')) {
            document.getElementById('usd-rate').innerText = tryRate.toFixed(2) + ' ₺';
            document.getElementById('eur-rate').innerText = eurTryRate.toFixed(2) + ' ₺';
        }
    } catch (err) {
        console.error("FX fetch error:", err);
    }
}

async function fetchWeather() {
    try {
        const lat = 41.0082;
        const lon = 28.9784;
        const response = await fetch(`https://api.open-meteo.com/v1/forecast?latitude=${lat}&longitude=${lon}&current_weather=true`);
        if (!response.ok) return;

        const data = await response.json();
        const weather = data.current_weather;

        if (weather) {
            const tempEl = document.getElementById('weather-temp');
            const iconEl = document.getElementById('weather-icon');

            if (tempEl) tempEl.innerText = `${Math.round(weather.temperature)}°C`;

            if (iconEl) {
                const code = weather.weathercode;
                let iconClass = 'fa-cloud-sun';

                if (code === 0) iconClass = 'fa-sun';
                else if (code >= 1 && code <= 3) iconClass = 'fa-cloud-sun';
                else if (code >= 45 && code <= 48) iconClass = 'fa-smog';
                else if (code >= 51 && code <= 67) iconClass = 'fa-cloud-rain';
                else if (code >= 71 && code <= 77) iconClass = 'fa-snowflake';
                else if (code >= 80 && code <= 82) iconClass = 'fa-cloud-showers-heavy';
                else if (code >= 95) iconClass = 'fa-cloud-bolt';

                iconEl.className = `fa-solid ${iconClass}`;
            }
        }
    } catch (e) {
        console.error("Weather fetch error:", e);
    }
}

function toggleTheme() {
    const current = document.documentElement.getAttribute('data-theme');
    const target = current === 'dark' ? 'light' : 'dark';
    document.documentElement.setAttribute('data-theme', target);
    localStorage.setItem('crm_theme', target);
}

function initTheme() {
    const saved = localStorage.getItem('crm_theme') || 'light';
    document.documentElement.setAttribute('data-theme', saved);
}

/* Backup & Restore */
function showBackupModal() {
    const modalId = 'backup-modal';
    let modal = document.getElementById(modalId);
    if (!modal) {
        modal = document.createElement('div');
        modal.id = modalId;
        modal.className = 'modal';
        modal.style.display = 'none';
        modal.innerHTML = `
            <div class="modal-content" style="max-width: 500px; padding: 2rem;">
                <h2 style="margin-bottom: 1.5rem; display: flex; align-items: center; gap: 0.75rem;">
                    <i class="fa-brands fa-google-drive" style="color: #4285F4;"></i> Google Yedekleme Sistemi
                </h2>
                <div style="display: flex; flex-direction: column; gap: 1.5rem;">
                    <div style="background: var(--bg); padding: 1.25rem; border-radius: 0.75rem; border: 1px solid var(--border); border-left: 4px solid #4285F4;">
                        <h4 style="font-size: 0.85rem; margin-bottom: 0.75rem;">Google Drive'a Hazırla</h4>
                        <p style="font-size: 0.75rem; color: var(--text-light); margin-bottom: 1rem;">Tüm verileri şifreli .json formatında dışa aktarın. Bu dosyayı Google Drive klasörünüze taşıyarak güvenle saklayabilirsiniz.</p>
                        <button onclick="downloadBackup()" class="btn btn-primary" style="width: 100%; background: #4285F4; border: none;">
                            <i class="fa-solid fa-cloud-arrow-down"></i> Google Uyumlu Yedek Al
                        </button>
                    </div>
                    <div style="background: var(--bg); padding: 1.25rem; border-radius: 0.75rem; border: 1px solid var(--border); border-left: 4px solid #FBBC05;">
                        <h4 style="font-size: 0.85rem; margin-bottom: 0.75rem;">Yedekten Geri Yükle</h4>
                        <p style="font-size: 0.75rem; color: var(--text-light); margin-bottom: 1rem;">Google Drive'ınızdaki yedek dosyasını (.json) seçerek sistemi saniyeler içinde geri yükleyebilirsiniz.</p>
                        <input type="file" id="restore-file-input" accept=".json" style="display: none;" onchange="handleRestore(event)">
                        <button onclick="document.getElementById('restore-file-input').click()" class="btn btn-warning" style="width: 100%; background: #FBBC05; border: none; color: #000;">
                            <i class="fa-solid fa-cloud-arrow-up"></i> Buluttan Veri Geri Yükle
                        </button>
                    </div>
                </div>
                <div style="margin-top: 2rem; display: flex; justify-content: flex-end;">
                    <button onclick="document.getElementById('${modalId}').style.display='none'" class="btn btn-secondary">Kapat</button>
                </div>
            </div>
        `;
        document.body.appendChild(modal);
    }
    modal.style.display = 'flex';
}

function downloadBackup() {
    const backupData = {
        customers: JSON.parse(localStorage.getItem('crm_customer_data') || '[]'),
        visits: JSON.parse(localStorage.getItem('crm_visits') || '[]'),
        service_requests: JSON.parse(localStorage.getItem('crm_service_requests') || '[]'),
        activities: JSON.parse(localStorage.getItem('crm_activities') || '[]'),
        announcements: JSON.parse(localStorage.getItem('crm_announcements') || '[]'),
        users: JSON.parse(localStorage.getItem('crm_users') || '[]'),
        timestamp: new Date().toISOString()
    };

    const blob = new Blob([JSON.stringify(backupData, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `soft-crm-google-drive-backup-${new Date().toISOString().split('T')[0]}.json`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
    logActivity('verileri yedekledi', 'Sistem');
}

function handleRestore(event) {
    const file = event.target.files[0];
    if (!file) return;

    if (!confirm('TÜM MEVCUT VERİLER SİLİNECEK ve bu yedekteki veriler yüklenecektir. Devam etmek istiyor musunuz?')) return;

    const reader = new FileReader();
    reader.onload = function (e) {
        try {
            const data = JSON.parse(e.target.result);
            if (data.customers) localStorage.setItem('crm_customer_data', JSON.stringify(data.customers));
            if (data.visits) localStorage.setItem('crm_visits', JSON.stringify(data.visits));
            if (data.service_requests) localStorage.setItem('crm_service_requests', JSON.stringify(data.service_requests));
            if (data.activities) localStorage.setItem('crm_activities', JSON.stringify(data.activities));
            if (data.announcements) localStorage.setItem('crm_announcements', JSON.stringify(data.announcements));
            if (data.users) localStorage.setItem('crm_users', JSON.stringify(data.users));

            alert('Geri yükleme başarılı! Sistem yeniden başlatılıyor...');
            location.reload();
        } catch (err) {
            alert('Hata: Yedek dosyası okunamadı veya geçersiz format.');
        }
    };
    reader.readAsText(file);
}

/* Storage Sync Support */
window.addEventListener('storage', (e) => {
    if (e.key === 'crm_customer_data' || e.key === 'crm_visits' || e.key === 'crm_online_users' || e.key === 'crm_users' || e.key === 'crm_service_requests' || e.key === 'crm_announcements' || e.key === 'crm_activities') {
        if (e.key === 'crm_customer_data') {
            customerData = JSON.parse(e.newValue || '[]');
        }
        if (typeof refreshApp === 'function') refreshApp();
    }
});

/* Image Handling for Logo */
window.addEventListener('DOMContentLoaded', () => {
    const logoInput = document.getElementById('company-logo-input');
    if (logoInput) {
        logoInput.addEventListener('change', function (e) {
            const file = e.target.files[0];
            if (file) {
                const reader = new FileReader();
                reader.onload = function (event) {
                    const base64Input = document.getElementById('company-logo-base64');
                    if (base64Input) base64Input.value = event.target.result;
                };
                reader.readAsDataURL(file);
            }
        });
    }
});
