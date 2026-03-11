/* 
 * sales.js - Customer management, Kanban, and Sales Analysis 
 */


function loadCustomerTable(data) {
    const body = document.getElementById('customer-body');
    if (!body) return;
    body.innerHTML = '';

    data.forEach((item, index) => {
        const status = getStatus(item);
        const prob = item.P === 'x' ? 'Yüksek' : (item.Q === 'x' ? 'Orta' : (item.R === 'x' ? 'Düşük' : '-'));
        const probClass = item.P === 'x' ? 'badge-success' : (item.Q === 'x' ? 'badge-warning' : (item.R === 'x' ? 'badge-danger' : ''));

        const tr = document.createElement('tr');
        const originalIndex = customerData.indexOf(item);
        const canEdit = canModifyFirm(item);

        tr.innerHTML = `
                    <td style="font-weight: 500;">${item.A}</td>
                    <td style="color: var(--text-light);">${item.B || '-'}</td>
                    <td>${item.D || '-'}</td>
                    <td><span class="badge ${status.class}">${status.text}</span></td>
                    <td style="font-weight: 600;">$${(parseInt(item.N) || 0).toLocaleString()}</td>
                    <td><span class="badge ${probClass}">${prob}</span></td>
                    <td>
                        <div style="display: flex; gap: 0.5rem;">
                            <button onclick="showDetails(${originalIndex})" style="background: none; border: 1px solid var(--border); padding: 0.4rem 0.8rem; border-radius: 0.4rem; cursor: pointer; color: var(--primary); font-weight: 500; font-size: 0.75rem;">Detay</button>
                            
                            ${canEdit ? `
                                <button onclick="openEditModal(${originalIndex})" style="background: none; border: 1px solid var(--border); padding: 0.4rem 0.8rem; border-radius: 0.4rem; cursor: pointer; color: var(--warning); font-weight: 500; font-size: 0.75rem;">Düzenle</button>
                            ` : ''}

                            ${currentUser.role === 'admin' ? `
                            <button onclick="deleteCustomer(${originalIndex})" style="background: none; border: 1px solid var(--border); padding: 0.4rem 0.8rem; border-radius: 0.4rem; cursor: pointer; color: var(--danger); font-weight: 500; font-size: 0.75rem;">
                                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><polyline points="3 6 5 6 21 6"></polyline><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"></path><line x1="10" y1="11" x2="10" y2="17"></line><line x1="14" y1="11" x2="14" y2="17"></line></svg>
                            </button>
                            ` : ''}
                        </div>
                    </td>
                `;
        body.appendChild(tr);
    });
}

function filterCustomers() {
    const searchEl = document.getElementById('customer-search');
    if (!searchEl) return;
    const query = searchEl.value.toLowerCase();
    const filtered = customerData.filter(item =>
        (item.A && item.A.toLowerCase().includes(query)) ||
        (item.B && item.B.toLowerCase().includes(query))
    );
    loadCustomerTable(filtered);
}

function deleteCustomer(index) {
    if (!canModifyFirm(customerData[index])) return alert('Bu firmayı silme yetkiniz yok.');
    if (confirm('Bu firmayı silmek istediğinizden emin misiniz?')) {
        const targetName = customerData[index].A;
        const details = { detail: `Firma silindi. Şehir: ${customerData[index].B}` };
        customerData.splice(index, 1);
        if (typeof saveToLocal === 'function') saveToLocal();
        logActivity('şirket sildi:', targetName, details);
        if (typeof refreshApp === 'function') refreshApp();
    }
}

function showDetails(index) {
    const item = customerData[index];
    if (!item) return;
    const status = getStatus(item);
    const prob = item.P === 'x' ? 'Yüksek' : (item.Q === 'x' ? 'Orta' : (item.R === 'x' ? 'Düşük' : '-'));
    const probClass = item.P === 'x' ? 'badge-success' : (item.Q === 'x' ? 'badge-warning' : (item.R === 'x' ? 'badge-danger' : 'badge-primary'));

    let visits = [];
    try { visits = JSON.parse(localStorage.getItem('crm_visits') || '[]'); } catch (e) { visits = []; }
    const companyVisits = visits.filter(v => v.company === item.A)
        .sort((a, b) => new Date(b.date + ' ' + b.time) - new Date(a.date + ' ' + a.time));

    let services = [];
    try { services = JSON.parse(localStorage.getItem('crm_service_requests') || '[]'); } catch (e) { services = []; }
    const companyServices = services.filter(s => s.company === item.A)
        .sort((a, b) => new Date(b.date) - new Date(a.date));

    let generatedQuotes = [];
    try { generatedQuotes = JSON.parse(localStorage.getItem('crm_generated_quotes') || '[]'); } catch (e) { generatedQuotes = []; }
    const companyQuotes = generatedQuotes.filter(q => q.customer === item.A)
        .sort((a, b) => b.id - a.id);

    const content = document.getElementById('modal-details-content');
    if (!content) return;

    content.innerHTML = `
        <div style="padding: 2rem; position: relative;">
            <span class="close-modal" onclick="closeModal()" style="top: 1rem; right: 1rem;">&times;</span>
            <div style="display: flex; gap: 2rem; align-items: start; margin-bottom: 2rem; background: var(--bg); padding: 1.5rem; border-radius: 1rem; border: 1px solid var(--border);">
                ${item.logo ? `<img src="${item.logo}" style="width: 120px; height: 120px; object-fit: contain; border-radius: 0.75rem; background: white; border: 1px solid var(--border); padding: 0.5rem;">` : `
                    <div style="width: 120px; height: 120px; background: var(--card-bg); border-radius: 0.75rem; display: flex; align-items: center; justify-content: center; border: 1px dashed var(--border); color: var(--text-light);">
                        <i class="fa-solid fa-image" style="font-size: 2rem;"></i>
                    </div>
                `}
                <div style="flex: 1;">
                    <h2 style="font-size: 1.75rem; color: var(--text); margin-bottom: 0.5rem;">${item.A}</h2>
                    <div style="display: flex; gap: 0.5rem; align-items: center; margin-bottom: 0.75rem;">
                        <span class="badge ${status.class}">${status.text}</span>
                        <span class="badge ${probClass}" style="opacity: 0.8;">Olasılık: ${prob}</span>
                        <span style="font-size: 0.8rem; color: var(--text-light); font-weight: 600;">• Kod: ${status.code}</span>
                    </div>
                    <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 0.5rem; font-size: 0.85rem; color: var(--text-light);">
                        <span><i class="fa-solid fa-location-dot" style="width: 15px;"></i> ${item.B || '-'}</span>
                        <span><i class="fa-solid fa-industry" style="width: 15px;"></i> ${item.industry || '-'}</span>
                        <span><i class="fa-solid fa-bullhorn" style="width: 15px;"></i> ${item.leadSource || '-'}</span>
                        <span><i class="fa-solid fa-user-check" style="width: 15px;"></i> ${item.createdBy || '-'}</span>
                    </div>
                </div>
            </div>
            <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 2rem;">
                <div>
                    <h4 style="font-size: 0.8rem; font-weight: 800; color: var(--primary); text-transform: uppercase; margin-bottom: 1rem; display: flex; align-items: center; gap: 0.5rem;">
                        <i class="fa-solid fa-circle-info"></i> Firma Bilgileri
                    </h4>
                    <div style="display: flex; flex-direction: column; gap: 0.75rem;">
                        <div class="stat-card" style="padding: 1rem; border: 1px solid var(--border);">
                            <p style="font-size: 0.7rem; color: var(--text-light); text-transform: uppercase;">Yetkili</p>
                            <p style="font-weight: 700;">${item.contact || '-'} (${item.contactTitle || '-'})</p>
                        </div>
                        <div class="stat-card" style="padding: 1rem; border: 1px solid var(--border);">
                            <p style="font-size: 0.7rem; color: var(--text-light); text-transform: uppercase;">İletişim</p>
                            <p style="font-weight: 700;"><i class="fa-solid fa-envelope"></i> ${item.email || '-'}</p>
                            <p style="font-weight: 700;"><i class="fa-solid fa-phone"></i> ${item.phone || '-'}</p>
                        </div>
                        <div class="stat-card" style="padding: 1rem; border-left: 4px solid var(--success);">
                            <p style="font-size: 0.7rem; color: var(--text-light); text-transform: uppercase;">Ticari Veriler</p>
                            <p style="font-weight: 800; font-size: 1.1rem; color: var(--success);">$${(parseInt(item.N) || 0).toLocaleString()}</p>
                            <p style="font-size: 0.75rem; color: var(--text-light);">İlgi: ${item.D || '-'}</p>
                            ${item.O ? `<p style="font-size: 0.75rem; color: var(--text-light);">Kurulum: ${item.O}</p>` : ''}
                        </div>
                        <div class="stat-card" style="padding: 1rem; border-left: 4px solid var(--warning);">
                            <p style="font-size: 0.7rem; color: var(--text-light); text-transform: uppercase;">Notlar / Detaylar</p>
                            <div style="font-size: 0.8rem; line-height: 1.4; color: var(--text);">${item.S || 'Firma hakkında henüz bir not eklenmemiş.'}</div>
                        </div>
                    </div>
                </div>
                <div>
                    <h4 style="font-size: 0.8rem; font-weight: 800; color: var(--primary); text-transform: uppercase; margin-bottom: 1rem; display: flex; align-items: center; gap: 0.5rem;">
                        <i class="fa-solid fa-clock-rotate-left"></i> Hareket Geçmişi
                    </h4>
                    <div style="max-height: 400px; overflow-y: auto; display: flex; flex-direction: column; gap: 0.5rem;">
                        ${companyVisits.length === 0 && companyServices.length === 0 && companyQuotes.length === 0 ? '<p style="font-size: 0.75rem; color: var(--text-light);">Henüz kayıt bulunmuyor.</p>' : ''}
                        ${companyQuotes.map(q => `
                            <div style="font-size: 0.75rem; padding: 0.75rem; background: var(--bg); border-radius: 0.5rem; border-left: 3px solid #10b981;">
                                <div style="display: flex; justify-content: space-between; margin-bottom: 0.25rem;">
                                    <span style="font-weight: 700; color: #10b981;">Teklif: Proforma Teklifi</span>
                                    <span style="color: var(--text-light);">${q.date}</span>
                                </div>
                                <div style="display: flex; justify-content: space-between; align-items: center;">
                                    <span style="font-weight: 800; font-size: 0.85rem;">${q.total} USD</span>
                                    <span style="font-size: 0.65rem; padding: 2px 6px; background: rgba(16,185,129,0.1); color: #10b981; border-radius: 4px; font-weight: 800;">HAZIRLANDI</span>
                                </div>
                            </div>
                        `).join('')}
                        ${companyVisits.map(v => `
                            <div style="font-size: 0.75rem; padding: 0.75rem; background: var(--bg); border-radius: 0.5rem; border-left: 3px solid var(--primary);">
                                <div style="display: flex; justify-content: space-between; margin-bottom: 0.25rem;">
                                    <div style="display: flex; flex-direction: column;">
                                        <span style="font-weight: 700;">Ziyaret: ${v.visitType || 'Belirtilmemiş'}</span>
                                        <span style="font-size: 0.65rem; color: var(--text-light); text-transform: uppercase;">Aşama: ${v.stage || '-'}</span>
                                    </div>
                                    <span style="color: var(--text-light);">${new Date(v.date).toLocaleDateString()} ${v.time || ''}</span>
                                </div>
                                <p style="margin-top: 0.25rem;">${v.notes || v.note || 'Not girilmemiş.'}</p>
                            </div>
                        `).join('')}
                        ${companyServices.map(s => `
                            <div style="font-size: 0.75rem; padding: 0.75rem; background: var(--bg); border-radius: 0.5rem; border-left: 3px solid var(--warning);">
                                <div style="display: flex; justify-content: space-between; margin-bottom: 0.25rem;">
                                    <span style="font-weight: 700;">Teknik Servis: ${s.formNo}</span>
                                    <span style="color: var(--text-light);">${new Date(s.date).toLocaleDateString()}</span>
                                </div>
                                <p>${s.complaint}</p>
                                <span class="badge ${s.status === 'Açık' ? 'badge-danger' : 'badge-success'}">${s.status}</span>
                            </div>
                        `).join('')}
                    </div>
                </div>
            </div>
            <div style="margin-top: 2rem; padding-top: 1rem; border-top: 1px solid var(--border); display: flex; justify-content: space-between; align-items: center;">
                <div style="display: flex; gap: 1rem;">
                    <button onclick="openEditModal(${index})" class="btn btn-warning" style="padding: 0.5rem 1rem; font-size:0.75rem;">
                        <i class="fa-solid fa-pen-to-square"></i> Düzenle
                    </button>
                    ${currentUser && currentUser.role === 'admin' ? `
                        <button onclick="deleteCustomer(${index})" class="btn btn-danger" style="padding: 0.5rem 1rem; font-size:0.75rem;">
                            <i class="fa-solid fa-trash"></i> Sil
                        </button>
                    ` : ''}
                </div>
                <button onclick="closeModal()" class="btn btn-secondary" style="padding: 0.5rem 1rem; font-size:0.75rem;">Kapat</button>
            </div>
        </div>
    `;
    const detailsModal = document.getElementById('details-modal');
    if (detailsModal) {
        detailsModal.style.display = 'flex';
        const modalContent = detailsModal.querySelector('.modal-content');
        if (modalContent) modalContent.scrollTop = 0;
    }
}

function closeModal() {
    const detailsModal = document.getElementById('details-modal');
    if (detailsModal) detailsModal.style.display = 'none';
}

function showDetailsByName(name) {
    const idx = customerData.findIndex(c => c.A === name);
    if (idx !== -1) showDetails(idx);
}

function updateProbability(index, newValue) {
    if (!customerData[index]) return;
    const targetName = customerData[index].A;
    delete customerData[index].P;
    delete customerData[index].Q;
    delete customerData[index].R;

    let probText = "-";
    if (newValue !== "-") {
        customerData[index][newValue] = 'x';
        probText = newValue === 'P' ? 'Yüksek' : (newValue === 'Q' ? 'Orta' : 'Düşük');
    }

    logActivity(`olasılığı "${probText}" olarak güncelledi:`, targetName);
    if (typeof saveToLocal === 'function') saveToLocal();
    if (typeof refreshApp === 'function') refreshApp();
}

function updateStage(index, newStage) {
    if (!customerData[index]) return;
    const targetName = customerData[index].A;
    const stages = ['F', 'G', 'H', 'I', 'J', 'K', 'L'];
    const stageTexts = { F: 'S (Şüpheli)', G: 'P (Potansiyel)', H: 'A (İhtiyaç)', I: 'D (Demo)', J: 'A/N (Pazarlık)', K: 'C (Kapanış)', L: 'O (Sipariş)' };
    stages.forEach(s => delete customerData[index][s]);
    customerData[index][newStage] = 'x';

    logActivity(`evresini "${stageTexts[newStage]}" olarak güncelledi:`, targetName);
    if (typeof saveToLocal === 'function') saveToLocal();
    if (typeof refreshApp === 'function') refreshApp();
    showDetails(index);
}

function openAddModal() {
    const titleEl = document.getElementById('add-modal-title');
    const indexEl = document.getElementById('editing-index');
    const form = document.getElementById('add-company-form');
    if (titleEl) titleEl.innerText = "Yeni Firma Oluştur";
    if (indexEl) indexEl.value = "-1";
    if (form) {
        form.reset();
        if (form.elements['stage_F']) form.elements['stage_F'].value = new Date().toISOString().split('T')[0];
    }
    const addModal = document.getElementById('add-modal');
    if (addModal) addModal.style.display = 'flex';
}

function openEditModal(index) {
    const item = customerData[index];
    if (!item) return;
    if (!canModifyFirm(item)) return alert('Bu firmanın bilgilerini değiştirme yetkiniz yok.');

    const titleEl = document.getElementById('add-modal-title');
    const indexEl = document.getElementById('editing-index');
    const form = document.getElementById('add-company-form');
    if (titleEl) titleEl.innerText = "Şirket Bilgilerini Düzenle";
    if (indexEl) indexEl.value = index;

    if (form) {
        form.elements['A'].value = item.A || '';
        form.elements['B'].value = item.B || '';
        form.elements['address'].value = item.address || '';
        form.elements['contact'].value = item.contact || '';
        form.elements['contactTitle'].value = item.contactTitle || '';
        form.elements['linkedin'].value = item.linkedin || '';
        form.elements['website'].value = item.website || '';
        form.elements['industry'].value = item.industry || '';
        form.elements['leadSource'].value = item.leadSource || 'Web Sitesi';
        form.elements['email'].value = item.email || '';
        form.elements['phone'].value = item.phone || '';
        form.elements['C'].value = item.C || '';
        form.elements['D'].value = item.D || '';
        form.elements['E'].value = item.E || '';
        form.elements['N'].value = item.N || '';
        form.elements['O'].value = item.O || '';
        form.elements['S'].value = item.S || '';

        const stages = ['F', 'G', 'H', 'I', 'J', 'K', 'L'];
        stages.forEach(s => {
            if (item[s]) {
                const dateVal = item[s] === 'x' ? new Date().toISOString().split('T')[0] : item[s];
                if (form.elements['stage_' + s]) form.elements['stage_' + s].value = dateVal;
            } else {
                if (form.elements['stage_' + s]) form.elements['stage_' + s].value = '';
            }
        });

        const probs = ['P', 'Q', 'R'];
        probs.forEach(p => {
            if (item[p] === 'x' || item[p]) form.elements['prob'].value = p;
        });
    }

    const addModal = document.getElementById('add-modal');
    if (addModal) addModal.style.display = 'flex';
}

function closeAddModal() {
    const addModal = document.getElementById('add-modal');
    const form = document.getElementById('add-company-form');
    const logo64 = document.getElementById('company-logo-base64');
    const editIndex = document.getElementById('editing-index');
    if (addModal) addModal.style.display = 'none';
    if (form) form.reset();
    if (logo64) logo64.value = "";
    if (editIndex) editIndex.value = "-1";
}

function handleNewCompany(event) {
    event.preventDefault();
    const formData = new FormData(event.target);
    const editingIndex = parseInt(formData.get('editingIndex'));

    const newCompanyData = {
        A: formData.get('A'),
        B: formData.get('B'),
        address: formData.get('address'),
        contact: formData.get('contact'),
        contactTitle: formData.get('contactTitle'),
        industry: formData.get('industry'),
        leadSource: formData.get('leadSource'),
        email: formData.get('email'),
        phone: formData.get('phone'),
        linkedin: formData.get('linkedin'),
        website: formData.get('website'),
        logo: document.getElementById('company-logo-base64')?.value || '',
        C: formData.get('C'),
        D: formData.get('D'),
        E: formData.get('E'),
        N: formData.get('N'),
        O: formData.get('O'),
        S: formData.get('S') || ''
    };

    const prob = formData.get('prob');
    if (prob) newCompanyData[prob] = 'x';

    const allStageKeys = ['F', 'G', 'H', 'I', 'J', 'K', 'L'];
    let lastStage = "F";
    allStageKeys.forEach(key => {
        const dateVal = formData.get('stage_' + key);
        if (dateVal) {
            newCompanyData[key] = dateVal;
            lastStage = key;
        }
    });

    const stageTexts = { F: 'S (Şüpheli)', G: 'P (Potansiyel)', H: 'A (İhtiyaç)', I: 'D (Demo)', J: 'A/N (Pazarlık)', K: 'C (Kapanış)', L: 'O (Sipariş)' };

    if (editingIndex === -1) {
        newCompanyData.createdBy = currentUser.name;
        newCompanyData.id = Date.now() + Math.random();
        logActivity('yeni bir şirket ekledi:', newCompanyData.A, { detail: `Mevcut Evre: ${stageTexts[lastStage]}` });
        customerData.unshift(newCompanyData);
    } else {
        const oldData = customerData[editingIndex];
        const oldName = oldData.A;
        newCompanyData.createdBy = oldData.createdBy || currentUser.name;
        newCompanyData.id = oldData.id || (Date.now() + Math.random());

        const newName = newCompanyData.A;
        logActivity('şirket bilgilerini güncelledi:', newName, { detail: `Mevcut Evre: ${stageTexts[lastStage]}` });
        customerData[editingIndex] = newCompanyData;

        if (oldName !== newName) {
            let visits = [];
            try { visits = JSON.parse(localStorage.getItem('crm_visits') || '[]'); } catch (e) { visits = []; }
            visits.forEach(v => { if (v.company === oldName) v.company = newName; });
            localStorage.setItem('crm_visits', JSON.stringify(visits));
        }
    }

    if (typeof saveToLocal === 'function') saveToLocal();
    if (typeof refreshApp === 'function') refreshApp();
    closeAddModal();
}

/* Kanban System */
function renderKanban() {
    const container = document.getElementById('kanban-container');
    if (!container) return;
    container.innerHTML = '';

    const stagesStr = {
        'F': 'S – Şüpheli', 'G': 'P – Potansiyel', 'H': 'A – İhtiyaç',
        'I': 'D – Demo', 'J': 'A/N – Pazarlık', 'K': 'C – Kapanış', 'L': 'O – Sipariş'
    };
    const stageCodes = { F: 'S', G: 'P', H: 'A', I: 'D', J: 'A/N', K: 'C', L: 'O' };
    const stageColors = { F: '#94a3b8', G: '#3b82f6', H: '#1e40af', I: '#6366f1', J: '#f59e0b', K: '#10b981', L: '#059669' };
    const stageKeys = Object.keys(stagesStr);

    stageKeys.forEach((key, index) => {
        const col = document.createElement('div');
        col.style.cssText = 'flex: 0 0 300px; background: var(--bg); border-radius: 1rem; padding: 1.25rem; display: flex; flex-direction: column; gap: 1rem; border: 1px solid var(--border); transition: all 0.3s;';

        const firmsInStage = customerData.filter(c => getStatus(c).code === stageCodes[key]);
        const totalVal = firmsInStage.reduce((sum, f) => sum + (parseInt(f.N) || 0), 0);
        const stageColor = stageColors[key];

        const colHeader = document.createElement('div');
        colHeader.style.cssText = 'display: flex; flex-direction: column; gap: 0.4rem; margin-bottom: 0.5rem;';
        colHeader.innerHTML = `
            <div style="display: flex; justify-content: space-between; align-items: center;">
                <h3 style="font-size: 0.72rem; font-weight: 900; color: ${stageColor}; text-transform: uppercase; letter-spacing: 0.5px;">${stagesStr[key]}</h3>
                <span style="background: ${stageColor}; color: white; padding: 0.15rem 0.55rem; border-radius: 1rem; font-size: 0.65rem; font-weight: 800;">${firmsInStage.length}</span>
            </div>
            <div style="font-size: 0.85rem; font-weight: 900; color: var(--success);">$${totalVal.toLocaleString()}</div>
            <div style="height: 3px; background: ${stageColor}; border-radius: 2px; opacity: 0.4;"></div>
        `;

        col.appendChild(colHeader);

        const cardsContainer = document.createElement('div');
        cardsContainer.style.cssText = 'display: flex; flex-direction: column; gap: 0.75rem; flex: 1; overflow-y: auto; max-height: 70vh;';

        firmsInStage.forEach(firm => {
            const card = document.createElement('div');
            card.className = 'stat-card';
            card.style.cssText = `padding: 1rem; cursor: pointer; border-left: 4px solid ${stageColor}; position: relative; transition: transform 0.2s, box-shadow 0.2s;`;
            card.onmouseover = () => { card.style.transform = 'translateY(-2px)'; card.style.boxShadow = '0 8px 16px rgba(0,0,0,0.1)'; };
            card.onmouseout = () => { card.style.transform = 'translateY(0)'; card.style.boxShadow = ''; };

            const rev = parseInt(firm.N) || 0;
            const nextKey = stageKeys[index + 1];
            const canEdit = canModifyFirm(firm);
            const prob = firm.P === 'x' ? '★★★ Yüksek' : (firm.Q === 'x' ? '★★ Orta' : '★ Düşük');
            const probColor = firm.P === 'x' ? '#10b981' : (firm.Q === 'x' ? '#f59e0b' : '#94a3b8');

            const allStages = ['F', 'G', 'H', 'I', 'J', 'K', 'L'];
            const stageDotLabels = { F: 'S', G: 'P', H: 'A', I: 'D', J: 'A/N', K: 'C', L: 'O' };
            const stageDotsHTML = allStages.map(s => {
                const done = !!firm[s];
                const isCurrent = s === key;
                const dotColor = done ? stageColors[s] : '#e2e8f0';
                const dateHint = (done && firm[s] !== 'x') ? firm[s] : '';
                return `<span title="${stageDotLabels[s]}${dateHint ? ' - ' + dateHint : ''}" style="width:${isCurrent ? '18px' : '10px'}; height:${isCurrent ? '18px' : '10px'}; border-radius:50%; background:${dotColor}; display:inline-flex; align-items:center; justify-content:center; font-size:${isCurrent ? '8px' : '0px'}; color:white; font-weight:900; border:${isCurrent ? '1.5px solid white' : '1px solid rgba(0,0,0,0.05)'}; transition: all 0.2s;">${isCurrent ? stageDotLabels[s] : ''}</span>`;
            }).join('<span style="flex: 1; height: 1px; background: #f1f5f9; margin: 0 1px;"></span>');

            card.innerHTML = `
                <div onclick="if(typeof showDetailsByName === 'function') showDetailsByName('${firm.A}')">
                    <div style="font-weight: 800; color: var(--text); font-size: 0.85rem; margin-bottom: 0.15rem;">${firm.A}</div>
                    <div style="font-size: 0.65rem; color: var(--text-light); margin-bottom: 0.6rem;">${firm.contact || '-'} &bull; ${firm.B || '-'}</div>
                    <div style="display:flex; align-items:center; gap:2px; margin-bottom: 0.6rem; flex-wrap: nowrap;">
                        ${stageDotsHTML}
                    </div>
                    <div style="display: flex; justify-content: space-between; align-items: center; border-top: 1px solid var(--border); padding-top: 0.4rem; margin-top: 0.2rem;">
                        <span style="font-size: 0.85rem; font-weight: 900; color: var(--success);">$${rev.toLocaleString()}</span>
                        <span style="font-size: 0.65rem; font-weight: 700; color: ${probColor};">${prob}</span>
                    </div>
                </div>
                ${(nextKey && canEdit) ? `
                    <button onclick="event.stopPropagation(); moveFirmToStage('${firm.A}', '${nextKey}')" style="width:100%; margin-top:0.5rem; background: ${stageColors[nextKey]}; border: none; color: white; padding: 0.3rem; border-radius: 5px; font-size: 0.65rem; font-weight: 800; cursor: pointer; opacity: 0.85;" onmouseover="this.style.opacity='1'" onmouseout="this.style.opacity='0.85'">➡️ ${stagesStr[nextKey]}'e İlerle</button>
                ` : ''}
            `;
            cardsContainer.appendChild(card);
        });

        col.appendChild(cardsContainer);
        container.appendChild(col);
    });
}

function moveFirmToStage(firmName, nextStageCode) {
    const idx = customerData.findIndex(c => c.A === firmName);
    if (idx === -1) return;
    if (!canModifyFirm(customerData[idx])) return alert('Bu işlemi yapma yetkiniz yok.');
    const today = new Date().toISOString().split('T')[0];
    customerData[idx][nextStageCode] = today;
    const stageTexts = { F: 'S (Şüpheli)', G: 'P (Potansiyel)', H: 'A (İhtiyaç)', I: 'D (Demo)', J: 'A/N (Pazarlık)', K: 'C (Kapanış)', L: 'O (Sipariş)' };
    logActivity('kanban evresini güncelledi:', firmName, { detail: `${stageTexts[nextStageCode]} evresine taşındı (${today})` });
    if (typeof saveToLocal === 'function') saveToLocal();
    if (typeof refreshApp === 'function') refreshApp();
    renderKanban();
}

/* Analysis & Charts */
function initDashboardCharts() {
    if (cityChart && typeof cityChart.destroy === 'function') cityChart.destroy();
    if (statusChart && typeof statusChart.destroy === 'function') statusChart.destroy();

    const cities = {};
    customerData.forEach(item => { if (item.B) cities[item.B] = (cities[item.B] || 0) + 1; });

    const cityEl = document.getElementById('cityChart');
    if (cityEl) {
        cityChart = new Chart(cityEl.getContext('2d'), {
            type: 'pie',
            data: { labels: Object.keys(cities), datasets: [{ data: Object.values(cities), backgroundColor: ['#2563eb', '#10b981', '#f59e0b', '#ef4444', '#8b5cf6', '#06b6d4', '#ec4899'] }] },
            options: { responsive: true, maintainAspectRatio: false, plugins: { legend: { position: 'right', labels: { boxWidth: 12, font: { size: 10, weight: 'bold' } } } } }
        });
    }

    const stageLabelsMap = { 'Şüpheli': 'S', 'Potansiyel': 'P', 'İhtiyaç Bel.': 'A', 'Demo': 'D', 'Pazarlık': 'A/N', 'Kapanış': 'C', 'Sipariş': 'O' };
    const statuses = { 'Şüpheli': 0, 'Potansiyel': 0, 'İhtiyaç Bel.': 0, 'Demo': 0, 'Pazarlık': 0, 'Kapanış': 0, 'Sipariş': 0 };
    customerData.forEach(item => { const s = getStatus(item).text; if (statuses[s] !== undefined) statuses[s]++; });

    const statusEl = document.getElementById('statusChart');
    if (statusEl) {
        if (statusEl.parentElement) statusEl.parentElement.style.height = '300px';
        statusChart = new Chart(statusEl.getContext('2d'), {
            type: 'bar',
            data: { labels: Object.keys(statuses).map(k => `${stageLabelsMap[k]} (${k})`), datasets: [{ label: 'Müşteri Sayısı', data: Object.values(statuses), backgroundColor: ['#94a3b8', '#3b82f6', '#1e40af', '#6366f1', '#f59e0b', '#10b981', '#059669'], borderRadius: 6 }] },
            options: {
                responsive: true, maintainAspectRatio: false,
                plugins: { legend: { display: false }, datalabels: { anchor: 'end', align: 'top', color: '#475569', font: { weight: 'bold', size: 11 }, formatter: (val) => val > 0 ? val : '' } },
                scales: { y: { beginAtZero: true, grid: { color: 'rgba(0,0,0,0.04)' }, ticks: { precision: 0 } }, x: { grid: { display: false }, ticks: { font: { size: 9 } } } }
            }
        });
    }
    updatePipelineChart(customerData);
    renderDashboardTables();
}

function renderDashboardTables() {
    const tbody = document.getElementById('dashboard-details-body');
    if (tbody) {
        let html = '';
        const cities = {};
        customerData.forEach(item => { if (item.B) cities[item.B] = (cities[item.B] || 0) + 1; });
        for (const city in cities) {
            const cityCustomers = customerData.filter(c => c.B === city);
            const closedCount = cityCustomers.filter(c => getStatus(c).code === 'O').length;
            const potRev = cityCustomers.reduce((acc, c) => acc + parseNum(c.N), 0);
            const firmRows = cityCustomers.map(c => `<span onclick="if(typeof showDetailsByName === 'function') showDetailsByName('${c.A.replace(/'/g, "\\'")}')" style="cursor:pointer; color:var(--primary); text-decoration:underline;">${c.A}</span>`).join(', ');
            const stages = {};
            cityCustomers.forEach(c => { const sCode = getStatus(c).code; stages[sCode] = (stages[sCode] || 0) + 1; });
            const stagesText = Object.keys(stages).map(k => `${k}: ${stages[k]}`).join(', ');
            html += `<tr><td style="font-weight:600;">${city}</td><td><div style="max-height:150px; overflow-y:auto;">${firmRows}</div></td><td style="text-align:center;">${cities[city]}</td><td style="color:var(--success); font-weight:600; text-align:center;">${closedCount}</td><td>$${potRev.toLocaleString()}</td><td style="color:var(--text-light); font-size:0.8rem;"><div style="max-height:150px; overflow-y:auto;">${stagesText || '-'}</div></td></tr>`;
        }
        tbody.innerHTML = html;
    }
}

function initRevenueCharts() {
    if (revStatusChart && typeof revStatusChart.destroy === 'function') revStatusChart.destroy();
    if (revCityChart && typeof revCityChart.destroy === 'function') revCityChart.destroy();
    const revElStatus = document.getElementById('revStatusChart');
    const revElCity = document.getElementById('revCityChart');
    if (!revElStatus) return;

    updateRevenueStats();
    const revStats = { 'Şüpheli': 0, 'Potansiyel': 0, 'İhtiyaç': 0, 'Demo': 0, 'Pazarlık': 0, 'Kapanış': 0, 'Sipariş': 0 };
    customerData.forEach(item => {
        const s = getStatus(item).text;
        const rev = parseInt(item.N) || 0;
        if (s.includes('İhtiyaç')) revStats['İhtiyaç'] += rev;
        else if (revStats[s] !== undefined) revStats[s] += rev;
    });

    revStatusChart = new Chart(revElStatus.getContext('2d'), {
        type: 'bar',
        data: { labels: Object.keys(revStats), datasets: [{ label: 'Gelir ($)', data: Object.values(revStats), backgroundColor: '#10b981' }] },
        options: { responsive: true, scales: { y: { beginAtZero: true } } }
    });

    const revCities = {};
    customerData.forEach(item => { if (item.B) revCities[item.B] = (revCities[item.B] || 0) + (parseInt(item.N) || 0); });
    if (revElCity) {
        revCityChart = new Chart(revElCity.getContext('2d'), {
            type: 'doughnut',
            data: { labels: Object.keys(revCities), datasets: [{ data: Object.values(revCities), backgroundColor: ['#2563eb', '#10b981', '#f59e0b', '#ef4444', '#8b5cf6', '#06b6d4', '#ec4899'] }] },
            options: { responsive: true, plugins: { legend: { position: 'right' } } }
        });
    }
    renderRevenueTables();
}

function renderRevenueTables() {
    const tbody = document.getElementById('revenue-details-body');
    if (tbody) {
        let html = '';
        const sortedCustomers = [...customerData].sort((a, b) => (parseInt(b.N) || 0) - (parseInt(a.N) || 0)).slice(0, 50);
        let visits = [];
        try { visits = JSON.parse(localStorage.getItem('crm_visits') || '[]'); } catch (e) { visits = []; }
        sortedCustomers.forEach(c => {
            const rev = (parseInt(c.N) || 0);
            if (rev === 0) return;
            const firmVisits = visits.filter(v => v.company === c.A);
            const lastVisitDate = firmVisits.length > 0 ? Array.from(firmVisits).sort((a, b) => new Date(b.date) - new Date(a.date))[0].date : null;
            const visitText = lastVisitDate ? new Date(lastVisitDate).toLocaleDateString() : 'Ziyaret Yok';
            const status = getStatus(c);
            const stageDateText = (status.date && status.date !== 'x') ? status.date : 'Belirtilmedi';
            html += `<tr><td style="font-weight:600; color:var(--primary);">${c.A}</td><td><span class="badge ${lastVisitDate ? 'badge-primary' : 'badge-warning'}">${visitText}</span></td><td style="font-weight:700;">$${rev.toLocaleString()}</td><td style="font-size:0.8rem; font-weight: 500; color: var(--text-light); text-align: center;">${status.text} (${stageDateText})</td></tr>`;
        });
        tbody.innerHTML = html;
    }
}

function updateRevenueStats() {
    let total = 0, weighted = 0, max = 0;
    customerData.forEach(item => {
        const rev = parseInt(item.N) || 0;
        total += rev; if (rev > max) max = rev;
        let probWeight = 0.1;
        if (item.P === 'x' || item.P) probWeight = 0.9;
        else if (item.Q === 'x' || item.Q) probWeight = 0.5;
        else if (item.R === 'x' || item.R) probWeight = 0.2;
        const stageStatus = getStatus(item);
        const stageWeight = stageStatus.value ? stageStatus.value / 100 : 0.5; // Value based weighting
        weighted += rev * probWeight * stageWeight;
    });
    const elTotal = document.getElementById('rev-total');
    const elWeighted = document.getElementById('rev-weighted');
    const elAvg = document.getElementById('rev-avg');
    const elMax = document.getElementById('rev-max');
    if (elTotal) elTotal.innerText = '$' + total.toLocaleString();
    if (elWeighted) elWeighted.innerText = '$' + Math.round(weighted).toLocaleString();
    if (elAvg) elAvg.innerText = '$' + Math.round(customerData.length > 0 ? total / customerData.length : 0).toLocaleString();
    if (elMax) elMax.innerText = '$' + max.toLocaleString();
}

function updatePipelineChart(data) {
    const canvas = document.getElementById('pipelineChart');
    if (!canvas) return;
    if (window.pipelineChartObj) window.pipelineChartObj.destroy();
    const stageMap = { 'S': 0, 'P': 0, 'A': 0, 'D': 0, 'A/N': 0, 'C': 0, 'O': 0 };
    data.forEach(item => { const code = getStatus(item).code; if (stageMap[code] !== undefined) stageMap[code]++; });
    const labels = ['S (Şüpheli)', 'P (Potansiyel)', 'A (İhtiyaç)', 'D (Demo)', 'A/N (Pazarlık)', 'C (Kapanış)', 'O (Sipariş)'];
    const bgColors = ['#94a3b8', '#3b82f6', '#1e40af', '#6366f1', '#f59e0b', '#10b981', '#059669'];
    if (canvas.closest('div')) canvas.closest('div').style.minHeight = '280px';
    window.pipelineChartObj = new Chart(canvas.getContext('2d'), {
        type: 'bar',
        data: { labels, datasets: [{ label: 'Firma Sayısı', data: Object.values(stageMap), backgroundColor: bgColors, borderRadius: 6 }] },
        options: {
            indexAxis: 'y', responsive: true, maintainAspectRatio: false,
            plugins: { legend: { display: false }, datalabels: { anchor: 'end', align: 'end', color: '#475569', font: { weight: 'bold', size: 12 }, formatter: (val) => val > 0 ? val : '' } },
            scales: { x: { grid: { display: false }, ticks: { precision: 0 }, beginAtZero: true }, y: { grid: { display: false } } }
        }
    });
}

/* Exports & Imports */
async function exportViewToPDF(viewId) {
    const element = document.getElementById(viewId);
    if (!element) return;
    const titleText = element.querySelector('h1')?.innerText || 'Satış Analizi';
    const buttons = element.querySelectorAll('button');
    buttons.forEach(b => { b.style.opacity = '0'; b.style.pointerEvents = 'none'; });

    try {
        const chartImages = [];
        element.querySelectorAll('canvas').forEach(canv => {
            try { chartImages.push({ id: canv.id, src: canv.toDataURL('image/png') }); } catch (e) { chartImages.push(null); }
        });

        const offscreen = document.createElement('div');
        offscreen.style.cssText = 'position:fixed;top:-99999px;left:0;width:1100px;padding:40px;background:#ffffff;color:#1e293b;font-family:Arial,sans-serif;';
        const dateStr = new Date().toLocaleString('tr-TR');
        let html = `
            <div style="display:flex;justify-content:space-between;border-bottom:3px solid #2563eb;padding-bottom:20px;margin-bottom:28px;">
                <div><div style="font-size:26px;font-weight:800;color:#2563eb;">LİNKUP CRM</div></div>
                <div style="text-align:right;"><div style="font-size:20px;font-weight:700;">${titleText}</div><div>${dateStr}</div></div>
            </div>`;

        const kpiCards = [];
        element.querySelectorAll('.stat-card').forEach(card => {
            const label = card.querySelector('.stat-label')?.innerText;
            const value = card.querySelector('.stat-value')?.innerText;
            if (label && value) kpiCards.push({ label, value });
        });
        if (kpiCards.length > 0) {
            html += `<div style="display:flex;gap:14px;margin-bottom:24px;flex-wrap:wrap;">`;
            kpiCards.forEach(k => { html += `<div style="flex:1;min-width:160px;background:#f8fafc;border:1px solid #e2e8f0;padding:14px;border-left:4px solid #2563eb;"><div>${k.label}</div><div style="font-size:20px;font-weight:800;">${k.value}</div></div>`; });
            html += `</div>`;
        }

        if (chartImages.length > 0) {
            html += `<div style="display:flex;gap:14px;margin-bottom:24px;flex-wrap:wrap;">`;
            chartImages.forEach(img => { if (img) html += `<div style="flex:1;min-width:280px;"><img src="${img.src}" style="width:100%;"></div>`; });
            html += `</div>`;
        }

        element.querySelectorAll('table').forEach(tbl => {
            html += `<table style="width:100%;border-collapse:collapse;margin-bottom:20px;">`;
            tbl.querySelectorAll('tr').forEach((row, ri) => {
                const isHdr = row.parentElement.tagName === 'THEAD';
                html += `<tr>`;
                row.querySelectorAll('th,td').forEach(cell => {
                    html += `<${isHdr ? 'th' : 'td'} style="padding:7px;border:1px solid #e2e8f0;background:${isHdr ? '#1e293b' : (ri % 2 ? '#f8fafc' : '#fff')};color:${isHdr ? '#fff' : '#1e293b'};">${cell.innerText}</${isHdr ? 'th' : 'td'}>`;
                });
                html += `</tr>`;
            });
            html += `</table>`;
        });

        offscreen.innerHTML = html;
        document.body.appendChild(offscreen);
        await new Promise(r => setTimeout(r, 500));
        const canvas = await html2canvas(offscreen, { scale: 2, useCORS: true });
        document.body.removeChild(offscreen);
        const { jsPDF } = window.jspdf;
        const pdf = new jsPDF('p', 'mm', 'a4');
        const pdfW = pdf.internal.pageSize.getWidth();
        const imgH = (canvas.height * pdfW) / canvas.width;
        pdf.addImage(canvas.toDataURL('image/png'), 'PNG', 0, 0, pdfW, imgH);
        pdf.save(`${titleText.replace(/\s+/g, '_')}.pdf`);
    } catch (err) { alert('PDF Hatası: ' + err.message); }
    finally { buttons.forEach(b => { b.style.opacity = '1'; b.style.pointerEvents = 'auto'; }); }
}

function exportViewToExcel(viewId) {
    const dateStr = new Date().toISOString().split('T')[0];
    const fileName = viewId === 'dashboard' ? 'Satis_Analizi' : (viewId === 'revenue' ? 'Gelir_Raporu' : 'Musteri_Hareketi');
    const wb = XLSX.utils.book_new();

    // -- Sheet 1: KPI Statistics ------------------------------------------------
    let totalRevenue = 0, weightedRevenue = 0;
    customerData.forEach(item => {
        const rev = parseInt(item.N) || 0;
        totalRevenue += rev;
        let probWeight = 0.1;
        if (item.P === 'x') probWeight = 0.9;
        else if (item.Q === 'x') probWeight = 0.5;
        else if (item.R === 'x') probWeight = 0.2;
        weightedRevenue += rev * probWeight;
    });

    const kpiRows = [
        { 'Metrik': 'Toplam Firma', 'Değer': customerData.length },
        { 'Metrik': 'Kapanan Satış', 'Değer': customerData.filter(c => getStatus(c).code === 'O').length },
        { 'Metrik': 'Toplam Tahmini Gelir ($)', 'Değer': totalRevenue },
        { 'Metrik': 'Ağırlıklı Gelir ($)', 'Değer': Math.round(weightedRevenue) }
    ];
    const wsKPI = XLSX.utils.json_to_sheet(kpiRows);
    wsKPI['!cols'] = [{ wch: 30 }, { wch: 15 }];
    XLSX.utils.book_append_sheet(wb, wsKPI, 'KPI Özet');

    // -- Sheet 2: City Analysis --------------------------------------------------
    const cityMap = {};
    customerData.forEach(item => {
        if (!item.B) return;
        if (!cityMap[item.B]) cityMap[item.B] = { firms: [], closed: 0, revenue: 0 };
        cityMap[item.B].firms.push(item.A);
        if (getStatus(item).code === 'O') cityMap[item.B].closed++;
        cityMap[item.B].revenue += (parseInt(item.N) || 0);
    });
    const cityRows = Object.keys(cityMap).map(city => ({
        'Şehir': city,
        'Firma Sayısı': cityMap[city].firms.length,
        'Sipariş Alınan': cityMap[city].closed,
        'Toplam Tahmini Gelir ($)': cityMap[city].revenue,
        'Firmalar': cityMap[city].firms.join(', ')
    }));
    const wsCity = XLSX.utils.json_to_sheet(cityRows);
    wsCity['!cols'] = [{ wch: 18 }, { wch: 14 }, { wch: 16 }, { wch: 24 }, { wch: 60 }];
    XLSX.utils.book_append_sheet(wb, wsCity, 'Şehir Analizi');

    // -- Sheet 3: All Firms Detailed ---------------------------------------------
    const firmRows = customerData.map(item => {
        const status = getStatus(item);
        const prob = item.P === 'x' ? 'Yüksek (H)' : (item.Q === 'x' ? 'Orta (M)' : (item.R === 'x' ? 'Düşük (L)' : '—'));
        return {
            'Şirket Adı': item.A || '',
            'Şehir': item.B || '',
            'Adres': item.address || '',
            'Yetkili': item.contact || '',
            'Ünvan': item.contactTitle || '',
            'E-Posta': item.email || '',
            'Telefon': item.phone || '',
            'Sektör': item.industry || '',
            'Ürün/İlgi': item.D || '',
            'Tahmini Gelir ($)': parseInt(item.N) || 0,
            'Mevcut Evre': `${status.code} – ${status.text}`,
            'Olasılık': prob,
            'Notlar': item.S || '',
            'Oluşturan': item.createdBy || ''
        };
    });
    const wsFirms = XLSX.utils.json_to_sheet(firmRows);
    wsFirms['!cols'] = [{ wch: 28 }, { wch: 14 }, { wch: 30 }, { wch: 18 }, { wch: 16 }, { wch: 26 }, { wch: 16 }, { wch: 20 }, { wch: 20 }, { wch: 18 }, { wch: 22 }, { wch: 16 }, { wch: 40 }, { wch: 16 }];
    XLSX.utils.book_append_sheet(wb, wsFirms, 'Tüm Firmalar');

    // -- Sheet 4: Recent Activities ----------------------------------------------
    let activities = [];
    try { activities = JSON.parse(localStorage.getItem('crm_activities') || '[]'); } catch (e) { }
    const actRows = activities.map(a => {
        const ts = a.timestamp || a.time || '';
        const d = ts ? new Date(ts) : null;
        return {
            'Tarih': d && !isNaN(d) ? d.toLocaleDateString('tr-TR') : '—',
            'Saat': d && !isNaN(d) ? d.toLocaleTimeString('tr-TR', { hour: '2-digit', minute: '2-digit' }) : '—',
            'Kullanıcı': a.user || '',
            'İşlem': (a.action || '').replace(':', ''),
            'Hedef': a.target || '',
            'Detay': a.details ? ((a.details.city || '') + ' ' + (a.details.detail || '')).trim() : ''
        };
    });
    if (actRows.length > 0) {
        const wsAct = XLSX.utils.json_to_sheet(actRows);
        wsAct['!cols'] = [{ wch: 14 }, { wch: 10 }, { wch: 18 }, { wch: 22 }, { wch: 28 }, { wch: 40 }];
        XLSX.utils.book_append_sheet(wb, wsAct, 'Son Hareketler');
    }

    XLSX.writeFile(wb, `${fileName}_${dateStr}.xlsx`);
}

function handleExcelImport(event) {
    const file = event.target.files[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = function (e) {
        const workbook = XLSX.read(new Uint8Array(e.target.result), { type: 'array' });
        const json = XLSX.utils.sheet_to_json(workbook.Sheets[workbook.SheetNames[0]]);
        if (json.length > 0 && confirm(`${json.length} firma aktarılsın mı?`)) {
            json.forEach(row => {
                customerData.push({
                    A: row["Şirket Adı"] || row["Firma"] || "Yeni Firma",
                    B: row["Şehir"] || "",
                    D: row["Ürün"] || "",
                    N: row["Gelir"] || 0,
                    id: Date.now() + Math.random(),
                    createdBy: currentUser.name
                });
            });
            if (typeof saveToLocal === 'function') saveToLocal();
            if (typeof refreshApp === 'function') refreshApp();
        }
    };
    reader.readAsArrayBuffer(file);
}
