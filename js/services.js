/* 
 * services.js - Technical service request management 
 */

function openServiceFormModal() {
    const modal = document.getElementById('service-form-modal');
    if (modal) modal.style.display = 'flex';
    const dateInput = document.getElementById('service-date');
    if (dateInput) dateInput.value = new Date().toISOString().split('T')[0];
    const companyList = document.getElementById('service-companies-list');
    if (companyList) {
        companyList.innerHTML = '';
        customerData.forEach(c => {
            companyList.innerHTML += `<option value="${c.A}"></option>`;
        });
    }
}

function closeServiceFormModal() {
    const modal = document.getElementById('service-form-modal');
    if (modal) modal.style.display = 'none';
}

function handleNewServiceForm(e) {
    e.preventDefault();
    const company = document.getElementById('service-company-input').value;
    const contact = document.getElementById('service-contact-person').value;
    const deviceModel = document.getElementById('service-device-model').value;
    const serialNumber = document.getElementById('service-serial-number').value;
    const type = document.getElementById('service-type').value;
    const warranty = document.getElementById('service-warranty').value;
    const priority = document.getElementById('service-priority').value;
    const complaint = document.getElementById('service-complaint').value;
    const formDate = document.getElementById('service-date').value;

    const newService = {
        id: Date.now() + Math.random(),
        formNo: 'SRV-' + Math.floor(Math.random() * 90000 + 10000),
        company, contact, deviceModel, serialNumber,
        type, warranty, priority, complaint,
        date: formDate ? new Date(formDate).toISOString() : new Date().toISOString(),
        status: 'Açık'
    };

    let services = [];
    try {
        services = JSON.parse(localStorage.getItem('crm_service_requests') || '[]');
    } catch (e) { services = []; }
    services.push(newService);
    localStorage.setItem('crm_service_requests', JSON.stringify(services));

    e.target.reset();
    alert('Servis formu başarıyla oluşturuldu!');
    closeServiceFormModal();
    if (typeof refreshApp === 'function') refreshApp();
}

function loadServiceTable() {
    const tableBody = document.getElementById('service-table-body');
    if (!tableBody) return;
    let services = [];
    try {
        services = JSON.parse(localStorage.getItem('crm_service_requests') || '[]');
    } catch (e) { services = []; }

    const totalEl = document.getElementById('total-services-count');
    const openEl = document.getElementById('open-services-count');
    const closedEl = document.getElementById('closed-services-count');
    if (totalEl) totalEl.innerText = services.length;
    if (openEl) openEl.innerText = services.filter(s => s.status === 'Açık').length;
    if (closedEl) closedEl.innerText = services.filter(s => s.status === 'Kapalı').length;

    const statusCounts = { 'Açık': 0, 'Kapalı': 0, 'İşlemde': 0 };
    const priorityCounts = { 'acil': 0, 'yuksek': 0, 'normal': 0 };
    services.forEach(s => {
        if (statusCounts[s.status] !== undefined) statusCounts[s.status]++;
        if (priorityCounts[s.priority] !== undefined) priorityCounts[s.priority]++;
    });

    try {
        const sStatusCtx = document.getElementById('serviceStatusChart')?.getContext('2d');
        if (sStatusCtx && typeof Chart !== 'undefined') {
            if (serviceStatusChartInstance) serviceStatusChartInstance.destroy();
            serviceStatusChartInstance = new Chart(sStatusCtx, {
                type: 'doughnut',
                data: {
                    labels: Object.keys(statusCounts),
                    datasets: [{
                        data: Object.values(statusCounts).every(v => v === 0) ? [1, 1, 1] : Object.values(statusCounts),
                        backgroundColor: Object.values(statusCounts).every(v => v === 0) ? ['rgba(239, 68, 68, 0.2)', 'rgba(16, 185, 129, 0.2)', 'rgba(245, 158, 11, 0.2)'] : ['#ef4444', '#10b981', '#f59e0b'],
                        borderWidth: 0
                    }]
                },
                options: {
                    responsive: true,
                    maintainAspectRatio: false,
                    plugins: {
                        legend: { position: 'bottom', labels: { boxWidth: 12, padding: 20, font: { weight: 'bold' } } },
                        tooltip: { enabled: !Object.values(statusCounts).every(v => v === 0) }
                    }
                }
            });
        }
    } catch (e) { console.warn('Chart error (status):', e); }

    try {
        const sPriorityCtx = document.getElementById('servicePriorityChart')?.getContext('2d');
        if (sPriorityCtx && typeof Chart !== 'undefined') {
            if (servicePriorityChartInstance) servicePriorityChartInstance.destroy();
            servicePriorityChartInstance = new Chart(sPriorityCtx, {
                type: 'bar',
                data: {
                    labels: ['Acil', 'Yüksek', 'Normal'],
                    datasets: [{
                        data: [priorityCounts.acil, priorityCounts.yuksek, priorityCounts.normal],
                        backgroundColor: ['#ef4444', '#f59e0b', '#2563eb'],
                        borderRadius: 8
                    }]
                },
                options: {
                    responsive: true,
                    maintainAspectRatio: false,
                    plugins: { legend: { display: false } },
                    scales: {
                        y: { beginAtZero: true, ticks: { precision: 0 }, grid: { borderDash: [5, 5] } },
                        x: { grid: { display: false } }
                    }
                }
            });
        }
    } catch (e) { console.warn('Chart error (priority):', e); }

    if (services.length === 0) {
        tableBody.innerHTML = '<tr><td colspan="8" style="text-align: center; color: var(--text-light); padding: 2rem;">Henüz kayıtlı bir servis formu bulunmamaktadır.</td></tr>';
        return;
    }

    tableBody.innerHTML = services.sort((a, b) => new Date(b.date) - new Date(a.date)).map(s => {
        const priorityBadge = s.priority === 'acil' ? 'badge-danger' : (s.priority === 'yuksek' ? 'badge-warning' : 'badge-primary');
        const pText = s.priority === 'acil' ? '🔴 Acil' : (s.priority === 'yuksek' ? '🟠 Yüksek' : 'Normal');
        const statusBadge = s.status === 'Açık' ? 'badge-danger' : 'badge-success';
        const dateText = new Date(s.date).toLocaleDateString('tr-TR');
        const dText = s.type === 'ariza' ? '🔧 Arıza' : (s.type === 'bakim' ? '🔍 Bakım' : (s.type === 'kurulum' ? '📦 Kurulum' : '🎓 Eğitim'));
        const noteSnippet = s.complaint ? `<div style="font-size:0.75rem;color:var(--text-light);margin-top:2px;max-width:200px;overflow:hidden;text-overflow:ellipsis;white-space:nowrap;" title="${s.complaint}">${s.complaint}</div>` : '';

        return `
            <tr>
                <td style="font-weight: 700; color: var(--primary);">${s.formNo}</td>
                <td><div style="font-weight: 600;">${s.company}</div><div style="font-size:0.7rem;color:var(--text-light);">${s.contact || ''}</div></td>
                <td style="color: var(--text-light);">${s.deviceModel}</td>
                <td><span class="badge ${statusBadge}">${s.status}</span></td>
                <td><span class="badge ${priorityBadge}">${pText}</span></td>
                <td><div style="font-size:0.75rem;font-weight:600;">${dateText}</div><div style="font-size:0.7rem;color:var(--text-light);">${dText}</div></td>
                <td>${noteSnippet || '<span style="color:var(--text-light);font-size:0.75rem;">—</span>'}</td>
                <td style="display: flex; gap: 0.4rem; flex-wrap: wrap;">
                    <button onclick="showServiceRequestDetails('${s.id || s.formNo}')" class="btn btn-secondary" style="padding: 0.3rem 0.6rem; font-size: 0.7rem;">Detay</button>
                    ${s.status === 'Açık' ? `<button onclick="closeServiceRequest('${s.id || s.formNo}')" class="btn btn-success" style="padding: 0.3rem 0.6rem; font-size: 0.7rem;">Kapat</button>` : ''}
                    <button onclick="exportServiceToPDF('${s.id || s.formNo}')" class="btn btn-warning" style="padding: 0.3rem 0.6rem; font-size: 0.7rem;"><i class="fa-solid fa-file-pdf"></i></button>
                    <button onclick="deleteServiceRequest('${s.id || s.formNo}')" class="btn btn-danger" style="padding: 0.3rem 0.6rem; font-size: 0.7rem;"><i class="fa-solid fa-trash-can"></i></button>
                </td>
            </tr>
        `;
    }).join('');
}

function closeServiceRequest(id) {
    let services = []; try { services = JSON.parse(localStorage.getItem('crm_service_requests') || '[]'); } catch (e) { }
    const serviceIndex = services.findIndex(s => s.id == id || s.formNo == id);
    if (serviceIndex === -1) return;
    
    const note = prompt('Servis kapanış notunu giriniz:');
    if (note === null) return; // User cancelled
    
    services[serviceIndex].status = 'Kapalı';
    services[serviceIndex].closingNote = note;
    services[serviceIndex].closedAt = new Date().toISOString();
    
    localStorage.setItem('crm_service_requests', JSON.stringify(services));
    loadServiceTable();
    if(typeof logActivity === 'function') logActivity('servis kapattı', services[serviceIndex].formNo, 'Kapanış notu eklendi.');
}

function deleteServiceRequest(id) {
    if (!confirm('Bu servis talebi silinecek. Emin misiniz?')) return;
    let services = []; try { services = JSON.parse(localStorage.getItem('crm_service_requests') || '[]'); } catch (e) { }
    services = services.filter(s => s.id != id && s.formNo != id);
    localStorage.setItem('crm_service_requests', JSON.stringify(services));
    loadServiceTable();
}

function showServiceRequestDetails(id) {
    let services = []; try { services = JSON.parse(localStorage.getItem('crm_service_requests') || '[]'); } catch (e) { }
    const s = services.find(item => item.id == id || item.formNo == id);
    if (!s) return;
    const content = document.getElementById('modal-details-content');
    if (!content) return;
    content.innerHTML = `
        <div style="padding: 2rem;">
            <span class="close-modal" onclick="closeModal()" style="top: 1.5rem; right: 1.5rem;">&times;</span>
            <div style="display: flex; align-items: center; gap: 1rem; margin-bottom: 2rem; border-bottom: 2px solid var(--border); padding-bottom: 1rem;">
                <i class="fa-solid fa-screwdriver-wrench" style="font-size: 1.5rem; color: var(--primary);"></i>
                <h2 style="font-size: 1.25rem;">Servis Talebi Detayı - ${s.formNo}</h2>
            </div>
            <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 2rem;">
                <div><h4 style="font-size: 0.8rem; color: var(--text-light); margin-bottom: 0.5rem;">Müşteri Bilgileri</h4><p style="font-weight: 700;">${s.company}</p><p style="font-size: 0.85rem; color: var(--text-light);">${s.contact || '-'}</p></div>
                <div><h4 style="font-size: 0.8rem; color: var(--text-light); margin-bottom: 0.5rem;">Cihaz Bilgileri</h4><p style="font-weight: 700;">${s.deviceModel}</p><p style="font-size: 0.85rem; color: var(--text-light);">SN: ${s.serialNumber || '-'}</p></div>
                <div><h4 style="font-size: 0.8rem; color: var(--text-light); margin-bottom: 0.5rem;">Servis Türü & Öncelik</h4><p>${s.type.toUpperCase()} / ${s.priority.toUpperCase()}</p></div>
                <div><h4 style="font-size: 0.8rem; color: var(--text-light); margin-bottom: 0.5rem;">Durum</h4><p><span class="badge ${s.status === 'Açık' ? 'badge-danger' : 'badge-success'}">${s.status}</span></p></div>
                <div style="grid-column: span 2;">
                    <h4 style="font-size: 0.8rem; color: var(--text-light); margin-bottom: 0.5rem;">Şikayet / Not</h4>
                    <div style="background: var(--bg); padding: 1rem; border-radius: 0.5rem; border: 1px solid var(--border); font-size: 0.9rem; line-height: 1.5;">${(s.complaint || 'Belirtilmedi').replace(/\n/g, '<br>')}</div>
                </div>
                ${s.status === 'Kapalı' && s.closingNote ? `
                <div style="grid-column: span 2;">
                    <h4 style="font-size: 0.8rem; color: var(--success); margin-bottom: 0.5rem;">Serivs Kapanış Notu</h4>
                    <div style="background: rgba(16, 185, 129, 0.1); padding: 1rem; border-radius: 0.5rem; border: 1px solid rgba(16, 185, 129, 0.2); font-size: 0.9rem; line-height: 1.5; color: var(--success);">${s.closingNote.replace(/\n/g, '<br>')}</div>
                </div>
                ` : ''}
            </div>
        </div>
    `;
    const detailsModal = document.getElementById('details-modal');
    if (detailsModal) detailsModal.style.display = 'flex';
}

function exportServiceToPDF(id) {
    let services = []; try { services = JSON.parse(localStorage.getItem('crm_service_requests') || '[]'); } catch (e) { }
    const s = services.find(x => x.id == id || x.formNo == id);
    if (!s) return alert('Servis kaydı bulunamadı.');
    const { jsPDF } = window.jspdf;
    const pdf = new jsPDF({ orientation: 'portrait', unit: 'mm', format: 'a4' });
    const margin = 20; let y = 20;
    pdf.setFillColor(24, 30, 45); pdf.rect(0, 0, 210, 45, 'F');
    pdf.setTextColor(255, 255, 255); pdf.setFont('helvetica', 'bold'); pdf.setFontSize(22); pdf.text('SOFT CRM', margin, 25);
    pdf.setFont('helvetica', 'normal'); pdf.setFontSize(10); pdf.text('TEKNİK SERVİS VE BAKIM FORMU', margin, 32);
    pdf.setFont('helvetica', 'bold'); pdf.setFillColor(255, 59, 48); pdf.rect(140, 15, 55, 12, 'F'); pdf.setTextColor(255, 255, 255); pdf.setFontSize(9); pdf.text('FORM NO: ' + s.formNo, 145, 23);
    pdf.setTextColor(200, 200, 200); pdf.setFontSize(8); pdf.text('DÜZENLEME TARİHİ: ' + new Date().toLocaleDateString('tr-TR'), 140, 32);
    y = 60;
    const drawSectionHeader = (title, yPos) => {
        pdf.setFillColor(245, 247, 250); pdf.rect(margin, yPos - 5, 170, 8, 'F');
        pdf.setTextColor(37, 99, 235); pdf.setFont('helvetica', 'bold'); pdf.setFontSize(9); pdf.text(title.toUpperCase(), margin + 2, yPos + 1);
        return yPos + 12;
    };
    const drawRow = (label, value, xPos) => {
        pdf.setTextColor(100, 100, 100); pdf.setFont('helvetica', 'bold'); pdf.setFontSize(8); pdf.text(label + ':', xPos, y);
        pdf.setTextColor(30, 30, 30); pdf.setFont('helvetica', 'normal'); pdf.text(String(value || '-'), xPos + 30, y);
    };
    y = drawSectionHeader('Müşteri ve Cihaz Bilgileri', y);
    drawRow('Müşteri', s.company, margin); drawRow('Cihaz Modeli', s.deviceModel, margin + 85); y += 8;
    drawRow('Yetkili', s.contact, margin); drawRow('Seri Numarası', s.serialNumber, margin + 85); y += 15;
    y = drawSectionHeader('Servis Detayları', y);
    drawRow('Servis Türü', s.type.toUpperCase(), margin); drawRow('Durum', s.status.toUpperCase(), margin + 85); y += 8;
    drawRow('Garanti', s.warranty.toUpperCase(), margin); drawRow('Öncelik', s.priority.toUpperCase(), margin + 85); y += 15;
    y = drawSectionHeader('Şikayet ve Talep Detayları', y);
    pdf.setTextColor(30, 30, 30); pdf.setFont('helvetica', 'normal'); pdf.setFontSize(9);
    const lines = pdf.splitTextToSize(s.complaint || 'Belirtilmedi', 165);
    pdf.text(lines, margin + 2, y); y += (lines.length * 5) + 20;
    pdf.setDrawColor(200, 200, 200); pdf.line(margin, y, margin + 60, y); pdf.line(margin + 110, y, margin + 170, y);
    pdf.setFontSize(8); pdf.setTextColor(100, 100, 100); pdf.text('Müşteri İmza / Kaşe', margin + 10, y + 5); pdf.text('Teknik Servis Onay', margin + 125, y + 5);
    pdf.setTextColor(180, 180, 180); pdf.setFontSize(7); pdf.text('Bu belge SOFT CRM tarafından otomatik oluşturulmuştur. | ' + new Date().toLocaleString(), margin, 215);
    pdf.save(`Servis_Formu_${s.formNo}.pdf`);
}
