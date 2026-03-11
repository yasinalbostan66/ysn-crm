/* 
 * marketing.js - Marketing campaigns, segments, and automation 
 */

function renderMarketing() {
    let campaigns = [];
    try { campaigns = JSON.parse(localStorage.getItem('crm_mkt_campaigns') || '[]'); } catch (e) { campaigns = []; }

    const totalCampEl = document.getElementById('mkt-active-count');
    if (totalCampEl) totalCampEl.innerText = campaigns.filter(c => c.status === 'Açık').length;

    try {
        const mktCtx1 = document.getElementById('mktChannelChart')?.getContext('2d');
        if (mktCtx1 && typeof Chart !== 'undefined') {
            if (window.mktChannelChart) window.mktChannelChart.destroy();
            window.mktChannelChart = new Chart(mktCtx1, {
                type: 'doughnut',
                data: { labels: ['E-Posta', 'Sosyal Medya', 'Google Ads', 'Fuar', 'Referans'], datasets: [{ data: [35, 25, 20, 15, 5], backgroundColor: ['#3b82f6', '#8b5cf6', '#10b981', '#f59e0b', '#94a3b8'], borderWidth: 0 }] },
                options: { responsive: true, maintainAspectRatio: false, plugins: { legend: { position: 'bottom', labels: { boxWidth: 10, font: { size: 10, weight: 'bold' } } } } }
            });
        }
    } catch (e) { console.warn('Chart error:', e); }

    try {
        const mktCtx2 = document.getElementById('mktRevenueChart')?.getContext('2d');
        if (mktCtx2 && typeof Chart !== 'undefined') {
            if (window.mktRevenueChart) window.mktRevenueChart.destroy();
            window.mktRevenueChart = new Chart(mktCtx2, {
                type: 'bar',
                data: { labels: ['Oca', 'Şub', 'Mar', 'Nis'], datasets: [{ label: 'Harcanan ($)', data: [1200, 1900, 1500, 2100], backgroundColor: '#94a3b8' }, { label: 'Dönüş (x1k $)', data: [5, 12, 8, 15], backgroundColor: '#10b981' }] },
                options: { responsive: true, maintainAspectRatio: false, scales: { y: { beginAtZero: true } } }
            });
        }
    } catch (e) { console.warn('Chart error:', e); }

    renderMarketingCampaigns();
    renderMarketingSegments();
    renderMarketingAnalysis();
}

function openNewCampaignModal() {
    const modal = document.getElementById('mkt-campaign-modal');
    if (modal) {
        document.getElementById('mkt-campaign-form').reset();
        document.getElementById('mkt-id').value = '';
        document.getElementById('mkt-modal-title').innerText = 'Yeni Kampanya Oluştur';
        modal.style.display = 'flex';
    }
}

function closeMktCampaignModal() {
    const modal = document.getElementById('mkt-campaign-modal');
    if (modal) modal.style.display = 'none';
}

function handleNewCampaign(event) {
    event.preventDefault();
    const id = document.getElementById('mkt-id').value;

    let campaigns = [];
    try { campaigns = JSON.parse(localStorage.getItem('crm_mkt_campaigns') || '[]'); } catch (e) { campaigns = []; }

    const newCamp = {
        id: id || Date.now(),
        name: document.getElementById('mkt-name').value,
        code: document.getElementById('mkt-code').value,
        type: document.getElementById('mkt-type').value,
        segment: document.getElementById('mkt-segment-id').value,
        goal: document.getElementById('mkt-goal').value,
        budget: document.getElementById('mkt-budget').value,
        expectedRevenue: document.getElementById('mkt-expected-revenue').value,
        status: document.getElementById('mkt-status').value,
        startDate: document.getElementById('mkt-start-date').value,
        endDate: document.getElementById('mkt-end-date').value,
        reach: Math.floor(Math.random() * 5000),
        conversion: (Math.random() * 5).toFixed(1) + '%'
    };

    if (id) {
        const idx = campaigns.findIndex(c => c.id == id);
        if (idx > -1) campaigns[idx] = newCamp;
    } else {
        campaigns.unshift(newCamp);
    }

    localStorage.setItem('crm_mkt_campaigns', JSON.stringify(campaigns));
    logActivity('yeni kampanya ekledi', newCamp.name, 'Pazarlama');
    closeMktCampaignModal();
    renderMarketing();
}

function renderMarketingCampaigns() {
    const list = document.getElementById('campaign-list-target');
    if (!list) return;

    let campaigns = [];
    try { campaigns = JSON.parse(localStorage.getItem('crm_mkt_campaigns') || '[]'); } catch (e) { campaigns = []; }

    if (campaigns.length === 0) {
        list.innerHTML = `<div style="grid-column: 1/-1; padding: 3rem; text-align: center; background: var(--card-bg); border-radius: 1rem; border: 1px dashed var(--border); color: var(--text-light);">
            Henüz bir kampanya planlanmadı.
        </div>`;
        return;
    }

    list.innerHTML = campaigns.map(c => `
        <div class="campaign-card">
            <span class="campaign-type-badge" style="background: rgba(var(--primary-rgb), 0.1); color: var(--primary);">${c.type}</span>
            <h3 style="font-size: 1.1rem; font-weight: 800; margin-bottom: 0.5rem;">${c.name}</h3>
            <p style="font-size: 0.8rem; color: var(--text-light); line-height: 1.4; flex-grow: 1;">${c.goal || 'Açıklama girilmedi.'}</p>
            
            <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 0.75rem; border-top: 1px solid var(--border); padding-top: 1rem; margin-top: auto;">
                <div>
                    <label style="font-size: 0.65rem; color: var(--text-light); display: block;">ERİŞİM</label>
                    <span style="font-size: 0.9rem; font-weight: 800;">${c.reach || 0}</span>
                </div>
                <div>
                    <label style="font-size: 0.65rem; color: var(--text-light); display: block;">DÖNÜŞÜM</label>
                    <span style="font-size: 0.9rem; font-weight: 800; color: var(--success);">${c.conversion || '%0'}</span>
                </div>
            </div>
            
            <div style="display: flex; justify-content: space-between; align-items: center; margin-top: 1rem;">
                <span class="badge ${c.status === 'Açık' ? 'badge-success' : 'badge-primary'}" style="font-size: 0.6rem;">${c.status}</span>
                <div style="display: flex; gap: 0.5rem;">
                     <button onclick="deleteCampaign(${c.id})" style="background:none; border:none; color:var(--danger); cursor:pointer;"><i class="fa-solid fa-trash-can"></i></button>
                </div>
            </div>
        </div>
    `).join('');
}

function deleteCampaign(id) {
    let campaigns = [];
    try { campaigns = JSON.parse(localStorage.getItem('crm_mkt_campaigns') || '[]'); } catch (e) { campaigns = []; }
    const camp = campaigns.find(c => c.id == id);
    if (!camp || !confirm(`"${camp.name}" kampanyası silinsin mi?`)) return;

    campaigns = campaigns.filter(c => c.id != id);
    localStorage.setItem('crm_mkt_campaigns', JSON.stringify(campaigns));
    logActivity('kampanya sildi', camp.name, 'Pazarlama');
    renderMarketing();
}

function renderMarketingSegments() {
    const list = document.getElementById('mkt-segments-target');
    if (!list) return;

    const segments = [
        { name: 'V.I.P Müşteriler', type: 'Dinamik', criteria: 'Gelir > 50k', count: 12, cr: '%8.4' },
        { name: 'Sessiz Müşteriler', type: 'Dinamik', criteria: '90 Gün Pasif', count: 45, cr: '%2.1' },
        { name: 'Yeni Potansiyeller', type: 'Dinamik', criteria: 'Son 30 Gün', count: 18, cr: '%12.5' }
    ];

    list.innerHTML = segments.map(s => `
        <tr style="border-bottom: 1px solid var(--border); transition: background 0.2s;" onmouseover="this.style.background='rgba(var(--primary-rgb), 0.02)'" onmouseout="this.style.background='transparent'">
            <td style="font-weight: 700; padding: 1rem 0.75rem;">${s.name}</td>
            <td><span class="badge badge-primary" style="font-size: 0.6rem;">${s.type}</span></td>
            <td style="font-size: 0.75rem; color: var(--text-light);">${s.criteria}</td>
            <td style="font-weight: 800;">${s.count}</td>
            <td style="color: var(--success); font-weight: 800;">${s.cr}</td>
            <td><button onclick="alert('${s.name} segmenti detayları yakında aktif edilecektir.')" class="btn btn-secondary" style="padding: 0.25rem 0.5rem; font-size: 0.65rem;">Detay</button></td>
        </tr>
    `).join('');
}

function renderMarketingAnalysis() {
    // Basic summary log
    console.log("Marketing Analysis Rendered");
}

function switchMktTab(tab, el) {
    document.querySelectorAll('.marketing-tab').forEach(t => t.classList.remove('active'));
    el.classList.add('active');

    document.getElementById('mkt-campaigns-section').style.display = 'none';
    document.getElementById('mkt-automation-section').style.display = 'none';
    document.getElementById('mkt-segments-section').style.display = 'none';
    document.getElementById('mkt-analysis-section').style.display = 'none';

    document.getElementById('mkt-' + tab + '-section').style.display = 'block';

    // Always re-render when switching to ensure data is fresh
    renderMarketing();
}
