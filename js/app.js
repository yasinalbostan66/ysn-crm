/* 
 * app.js - Application Init and Orchestration 
 */

document.addEventListener('DOMContentLoaded', async () => {
    // Firebase modülünün yüklenmesini bekle (race condition önleyici)
    let retry = 0;
    while (typeof initFirebase !== 'function' && retry < 20) {
        await new Promise(r => setTimeout(r, 50));
        retry++;
    }

    // Firebase bulut senkronizasyonu - önce çalıştır
    if (typeof initFirebase === 'function') {
        try {
            await initFirebase();
            console.log('[App] Firebase senkronizasyonu tamamlandı');
        } catch(e) {
            console.warn('[App] Firebase başlatılamadı, localStorage ile devam ediliyor:', e.message);
        }
    }
    init();
});

async function init() {
    // Inject Modals immediately to ensure buttons work
    if (typeof injectModals === 'function') {
        injectModals();
    }

    initTheme();

    if (typeof Chart !== 'undefined' && typeof ChartDataLabels !== 'undefined') {
        Chart.register(ChartDataLabels);
        Chart.defaults.set('plugins.datalabels', {
            color: '#fff',
            textStrokeColor: '#000',
            textStrokeWidth: 2,
            font: { weight: 'bold', size: 12 },
            formatter: (value, ctx) => {
                let sum = 0;
                let dataArr = ctx.chart.data.datasets[0].data;
                dataArr.forEach(data => sum += Number(data));
                if (sum === 0 || value === 0) return '';
                let percentage = (Number(value) * 100 / sum).toFixed(1) + "%";
                return percentage;
            }
        });
    }

    // Ensure users exist
    let rawUsers = [];
    try { rawUsers = JSON.parse(localStorage.getItem('crm_users') || '[]'); } catch (e) { }
    let cleanUsers = rawUsers.filter(u => u && u.name);
    if (cleanUsers.length === 0) {
        cleanUsers = [{ name: 'Sistem Yöneticisi', email: 'admin@admin.com', password: '123', role: 'admin' }];
    }
    if (rawUsers.length !== cleanUsers.length) {
        localStorage.setItem('crm_users', JSON.stringify(cleanUsers));
    }

    // Check for persistent session (localStorage önce, sonra sessionStorage)
    if (!currentUser) {
        const session = localStorage.getItem('crm_user_session') || sessionStorage.getItem('crm_user_session');
        if (session) {
            try {
                currentUser = JSON.parse(session);
                // Her iki depoya da yaz ki sayfalar arası sorunsuz çalışsın
                sessionStorage.setItem('crm_user_session', session);
            } catch (e) {
                localStorage.removeItem('crm_user_session');
                sessionStorage.removeItem('crm_user_session');
            }
        }
    }

    if (currentUser) {
        // Log online status
        let onlineUsers = {};
        try { onlineUsers = JSON.parse(localStorage.getItem('crm_online_users') || '{}'); } catch (e) { onlineUsers = {}; }
        onlineUsers[currentUser.email] = true;
        localStorage.setItem('crm_online_users', JSON.stringify(onlineUsers));

        // Start services
        if (typeof updateTime === 'function') {
            updateTime();
            if (!window.__timeSet) {
                setInterval(updateTime, 1000);
                window.__timeSet = true;
            }
        }
        
        if (typeof fetchExchangeRates === 'function') {
            fetchExchangeRates();
            setInterval(fetchExchangeRates, 1000 * 60 * 30);
        }

        if (typeof fetchWeather === 'function') {
            fetchWeather();
            setInterval(fetchWeather, 1000 * 60 * 30);
        }

        setInterval(() => {
            if (typeof updateStats === 'function') updateStats();
            if (typeof updateUsersStatusPane === 'function') updateUsersStatusPane();
        }, 10000);

    }

    // Pre-fill email if remembered (independent of current login status)
    const rememberedEmail = localStorage.getItem('crm_remembered_email');
    if (rememberedEmail) {
        const emailInput = document.getElementById('login-email');
        const rememberCheck = document.getElementById('login-remember');
        if (emailInput) emailInput.value = rememberedEmail;
        if (rememberCheck) rememberCheck.checked = true;
    }

    if (currentUser) {
        // Display Dashboard
        showDashboard();
        return;
    }

    // Show Login
    const auth = document.getElementById('auth-container');
    const dash = document.getElementById('main-dashboard');
    if (auth) auth.style.display = 'flex';
    if (dash) dash.style.display = 'none';
}

function showDashboard() {
    const auth = document.getElementById('auth-container');
    const dash = document.getElementById('main-dashboard');
    if (auth) auth.style.display = 'none';
    if (dash) dash.style.display = 'flex';

    if (currentUser) {
        // Sayfa yolunu belirle
        const path = window.location.pathname.split('/').pop() || 'index.html';
        // sessionKey kontrolü - mobilde / GitHub Pages'de isIndex her zaman false olabilir, kaldırdık
        sessionStorage.setItem('crm_initial_load_complete', 'true');

        // Update User Profile in Sidebar
        const userNameEl = document.getElementById('sidemenu-user-name');
        const userRoleEl = document.getElementById('sidemenu-user-role');
        if (userNameEl) userNameEl.innerText = currentUser.name;
        if (userRoleEl) userRoleEl.innerText = currentUser.role === 'admin' ? 'Yönetici' : 'Kullanıcı';

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

        const standalonePages = ['stock', 'accounting'];

        if (standalonePages.includes(viewId)) {
            // These are full standalone pages - no showView needed
            if (typeof refreshApp === 'function') refreshApp();
        } else if (typeof showView === 'function') {
            showView(viewId);
        } else if (typeof refreshApp === 'function') {
            refreshApp();
        }

        // Delay for Chart.js and heavy DOM updates
        setTimeout(() => {
            if (typeof refreshApp === 'function') refreshApp();
        }, 500);
    }
}

window.showDashboard = showDashboard;

// Service Worker Registration for PWA Installation
if ('serviceWorker' in navigator) {
    window.addEventListener('load', () => {
        navigator.serviceWorker.register('./sw.js')
            .then(reg => console.log('Service Worker Registered!', reg))
            .catch(err => console.log('Service Worker Registration Failed!', err));
    });
}