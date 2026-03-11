/* 
 * visits.js - Calendar management, visit planning, and routing 
 */

function setCalendarMode(mode) {
    calendarMode = mode;
    document.querySelectorAll('[id^="btn-mode-"]').forEach(btn => {
        btn.style.background = 'transparent';
        btn.style.color = 'var(--text-light)';
    });
    const btn = document.getElementById('btn-mode-' + mode);
    if (btn) {
        btn.style.background = 'var(--primary)';
        btn.style.color = 'white';
    }
    loadVisitsTable();
}

function navigateCalendar(dir) {
    const date = new Date(calendarRefDate);
    if (calendarMode === 'day') date.setDate(date.getDate() + dir);
    else if (calendarMode === 'week') date.setDate(date.getDate() + (dir * 7));
    else if (calendarMode === 'month') date.setMonth(date.getMonth() + dir);
    else if (calendarMode === 'year') date.setFullYear(date.getFullYear() + dir);
    calendarRefDate = date;
    loadVisitsTable();
}

function todayCalendar() {
    calendarRefDate = new Date();
    loadVisitsTable();
}

function loadVisitsTable() {
    let visits = [];
    try { visits = JSON.parse(localStorage.getItem('crm_visits') || '[]'); } catch (e) { visits = []; }
    let services = [];
    try { services = JSON.parse(localStorage.getItem('crm_service_requests') || '[]'); } catch (e) { services = []; }

    const calendarEvents = [
        ...visits.map(v => ({ ...v, calType: 'visit', calColor: 'var(--primary)' })),
        ...services.map(s => ({
            ...s,
            calType: 'service',
            calColor: 'var(--warning)',
            company: s.company,
            time: '09:00',
            date: s.date.split('T')[0]
        }))
    ];

    const body = document.getElementById('visits-table-body');
    const calendarContainer = document.getElementById('weekly-calendar-grid');
    const titleEl = document.getElementById('calendar-title');

    if (body) body.innerHTML = '';

    const realToday = new Date();
    const todayStr = realToday.toISOString().split('T')[0];
    const startOfRealWeek = new Date(realToday);
    const realDayNum = startOfRealWeek.getDay() || 7;
    startOfRealWeek.setDate(startOfRealWeek.getDate() - (realDayNum - 1));
    startOfRealWeek.setHours(0, 0, 0, 0);
    const endOfRealWeek = new Date(startOfRealWeek);
    endOfRealWeek.setDate(endOfRealWeek.getDate() + 6);

    const todayCountEl = document.getElementById('visits-count-today');
    const weekCountEl = document.getElementById('visits-count-week');
    const monthCountEl = document.getElementById('visits-count-month');

    if (todayCountEl) {
        const todayCount = visits.filter(v => v.date === todayStr).length;
        todayCountEl.innerText = todayCount;
        const todayCard = todayCountEl.closest('.stat-card');
        if (todayCard && !todayCard.dataset.clickable) {
            todayCard.dataset.clickable = '1';
            todayCard.style.cursor = 'pointer';
            todayCard.onclick = () => { window._visitDateFilter = todayStr; loadVisitsTable(); };
        }
    }
    if (weekCountEl) {
        weekCountEl.innerText = visits.filter(v => {
            const d = new Date(v.date);
            return d >= startOfRealWeek && d <= endOfRealWeek;
        }).length;
    }
    if (monthCountEl) monthCountEl.innerText = visits.filter(v => new Date(v.date).getMonth() === realToday.getMonth()).length;

    if (calendarContainer) {
        calendarContainer.innerHTML = '';
        const baseDate = new Date(calendarRefDate);
        if (calendarMode === 'day') renderDayView(calendarContainer, baseDate, calendarEvents, titleEl);
        else if (calendarMode === 'week') renderWeekView(calendarContainer, baseDate, calendarEvents, titleEl);
        else if (calendarMode === 'month') renderMonthView(calendarContainer, baseDate, calendarEvents, titleEl);
        else if (calendarMode === 'year') renderYearView(calendarContainer, baseDate, calendarEvents, titleEl);
    }

    if (body) {
        let tableList = [...visits].sort((a, b) => new Date(`${a.date} ${a.time}`) - new Date(`${b.date} ${b.time}`));
        if (window._visitDateFilter) tableList = tableList.filter(v => v.date === window._visitDateFilter);
        tableList = tableList.slice(0, 100);

        if (tableList.length === 0) {
            body.innerHTML = window._visitDateFilter
                ? `<tr><td colspan="7" style="text-align:center;color:var(--text-light);padding:2rem;">Bu tarihe ait ziyaret bulunamadı. <button onclick="window._visitDateFilter=null;loadVisitsTable()" style="color:var(--primary);background:none;border:none;cursor:pointer;font-weight:700;text-decoration:underline;">Tümünü Göster</button></td></tr>`
                : `<tr><td colspan="7" style="text-align:center;color:var(--text-light);padding:3rem;">Henüz planlanmış bir ziyaret yok.</td></tr>`;
        } else {
            if (window._visitDateFilter) {
                const tr = document.createElement('tr');
                tr.innerHTML = `<td colspan="7" style="background:rgba(37,99,235,0.08);padding:0.5rem 1.25rem;font-size:0.75rem;font-weight:700;color:var(--primary);">📅 ${new Date(window._visitDateFilter).toLocaleDateString('tr-TR', { day: 'numeric', month: 'long', year: 'numeric' })} tarihli ziyaretler gösteriliyor. <button onclick="window._visitDateFilter=null;loadVisitsTable()" style="color:var(--danger);background:none;border:none;cursor:pointer;font-weight:700;text-decoration:underline;">✕ Filtreyi Kaldır</button></td>`;
                body.appendChild(tr);
            }
            const vtColors = { 'Saha Ziyareti': '#3b82f6', 'Online Görüşme': '#8b5cf6', 'Telefon Görüşmesi': '#10b981', 'Demo Sunumu': '#f59e0b', 'Diğer': '#94a3b8' };
            tableList.forEach(v => {
                const tr = document.createElement('tr');
                const isPast = new Date(`${v.date} ${v.time}`) < new Date();
                const cust = customerData.find(c => c.A === v.company);
                const status = cust ? getStatus(cust) : { code: v.stage || '-', class: 'badge-primary' };
                const vTypeColor = vtColors[v.visitType] || '#94a3b8';
                tr.innerHTML = `
                    <td style="padding: 0.75rem 1.25rem;">
                        <div style="font-weight:800;color:${isPast ? 'var(--text-light)' : 'var(--text)'};font-size:0.8rem;">${new Date(v.date).toLocaleDateString('tr-TR', { day: 'numeric', month: 'short' })}</div>
                        <div style="font-size:0.65rem;color:var(--primary);font-weight:800;">${v.time}</div>
                    </td>
                    <td style="padding:0.75rem 1.25rem;"><div style="font-weight:700;color:var(--text);font-size:0.9rem;">${v.company}</div></td>
                    <td style="padding:0.75rem 1.25rem;"><span style="font-size:0.7rem;font-weight:700;color:var(--text-light);">${v.user}</span></td>
                    <td style="padding:0.75rem 1.25rem;"><span style="background:${vTypeColor};color:white;font-size:0.65rem;font-weight:800;padding:0.2rem 0.5rem;border-radius:4px;">${v.visitType || 'Saha Ziyareti'}</span></td>
                    <td style="padding:0.75rem 1.25rem;">
                        <div style="display:flex;flex-direction:column;gap:0.3rem;">
                            <div style="display:flex;align-items:center;gap:0.5rem;">
                                <span class="badge ${status.class}" style="font-size:0.65rem;min-width:32px;display:inline-block;text-align:center;">${status.code}</span>
                                <span style="font-size:0.7rem;font-weight:800;color:var(--text-light);">${status.text}</span>
                            </div>
                            <div style="font-size:0.75rem;max-width:280px;white-space:nowrap;overflow:hidden;text-overflow:ellipsis;" title="${v.notes || '-'}">${v.notes || '-'}</div>
                        </div>
                    </td>
                    <td style="padding:0.75rem 1.25rem;"><div style="display:flex;gap:0.4rem;">
                        ${canModifyVisit(v) ? `<button onclick="showVisitNoteModal('${v.id}')" style="background:var(--primary);color:white;border:none;padding:0.25rem 0.6rem;border-radius:0.3rem;cursor:pointer;font-size:0.6rem;font-weight:700;">Not Ekle</button>` : ''}
                        ${canModifyVisit(v) ? `<button onclick="deleteVisitById('${v.id}')" style="background:transparent;border:1px solid var(--border);color:var(--danger);padding:0.25rem 0.6rem;border-radius:0.3rem;">İptal</button>` : '-'}
                    </div></td>`;
                body.appendChild(tr);
            });
        }
    }
}

function showTodayCalendar() {
    window._visitDateFilter = new Date().toISOString().split('T')[0];
    if (typeof showView === 'function') showView('visits');
    calendarMode = 'day';
    calendarRefDate = new Date();
    loadVisitsTable();
}

/* Calendar Views */
function renderDayView(container, date, events, titleEl) {
    titleEl.innerText = date.toLocaleDateString('tr-TR', { day: 'numeric', month: 'long', year: 'numeric' });
    container.style.display = 'grid';
    container.style.gridTemplateColumns = '1fr 300px';
    container.style.gap = '2rem';

    const timeColumn = document.createElement('div');
    timeColumn.style.borderRight = '1px solid var(--border)';
    for (let i = 8; i < 20; i++) {
        const hourStr = i.toString().padStart(2, '0') + ':00';
        const row = document.createElement('div');
        row.style.cssText = 'height: 60px; border-bottom: 1px solid var(--border); display: flex; align-items: flex-start; padding: 0.5rem 0; cursor: pointer;';
        row.onclick = () => openQuickAddModal(date, hourStr);
        row.innerHTML = `<span style="font-size: 0.75rem; color: var(--text-light); width: 60px; font-weight: 800;">${hourStr}</span><div id="hour-slot-${i}" style="flex: 1; position: relative;"></div>`;
        timeColumn.appendChild(row);
    }

    const dateStr = date.toISOString().split('T')[0];
    events.filter(e => e.date === dateStr).forEach(v => {
        const h = parseInt(v.time.split(':')[0]);
        const slot = timeColumn.querySelector(`#hour-slot-${h}`);
        if (slot) {
            const ev = document.createElement('div');
            ev.className = `calendar-event ${v.calType === 'service' ? 'warning' : 'primary'}`;
            ev.style.padding = '0.5rem'; ev.style.borderRadius = '4px'; ev.style.fontSize = '0.75rem'; ev.style.fontWeight = '800';
            ev.innerText = `${v.time} - [${v.calType.toUpperCase()}] ${v.company}`;
            ev.onclick = (e) => { e.stopPropagation(); if (v.calType === 'service') window.location.href = 'technical-service.html'; else if (typeof showDetailsByName === 'function') showDetailsByName(v.company); };
            slot.appendChild(ev);
        }
    });

    const sidebar = document.createElement('div');
    sidebar.innerHTML = `<div class="stat-card" style="padding: 1.25rem;"><h4 style="font-size: 0.8rem; margin-bottom: 1rem; color: var(--primary); font-weight: 800;">MİNİ TAKVİM</h4><div id="mini-calendar" style="display:grid; grid-template-columns: repeat(7,1fr); gap:4px; text-align:center; font-size:0.7rem;"></div></div>`;
    container.appendChild(timeColumn);
    container.appendChild(sidebar);
    renderMiniCalendar(date);
}

function renderMiniCalendar(refDate) {
    const miniCal = document.getElementById('mini-calendar');
    if (!miniCal) return;
    miniCal.innerHTML = '';
    ['Pt', 'Sa', 'Çr', 'Pr', 'Cu', 'Ct', 'Pz'].forEach(d => { miniCal.innerHTML += `<div style="font-weight:800; color:var(--text-light); font-size:0.6rem;">${d}</div>`; });
    const year = refDate.getFullYear(), month = refDate.getMonth();
    let firstDay = new Date(year, month, 1).getDay();
    if (firstDay === 0) firstDay = 7;
    const daysInMonth = new Date(year, month + 1, 0).getDate();
    for (let i = 1; i < firstDay; i++) miniCal.appendChild(document.createElement('div'));
    let visits = []; try { visits = JSON.parse(localStorage.getItem('crm_visits') || '[]'); } catch (e) { }
    let services = []; try { services = JSON.parse(localStorage.getItem('crm_service_requests') || '[]'); } catch (e) { }
    const allEvents = [...visits, ...services];
    for (let d = 1; d <= daysInMonth; d++) {
        const dDate = new Date(year, month, d), dStr = dDate.toISOString().split('T')[0];
        const dayEl = document.createElement('div');
        dayEl.innerText = d; dayEl.style.cssText = 'padding:5px 0; border-radius:4px; cursor:pointer;';
        if (allEvents.some(e => e.date === dStr)) { dayEl.style.color = 'var(--primary)'; dayEl.style.fontWeight = '800'; dayEl.style.background = 'rgba(56,189,248,0.1)'; }
        if (d === refDate.getDate()) { dayEl.style.background = 'var(--primary)'; dayEl.style.color = 'white'; }
        dayEl.onclick = () => { calendarRefDate = new Date(year, month, d); loadVisitsTable(); };
        miniCal.appendChild(dayEl);
    }
}

function renderWeekView(container, date, events, titleEl) {
    const dayNum = date.getDay() || 7;
    const startOfWeek = new Date(date);
    startOfWeek.setDate(startOfWeek.getDate() - (dayNum - 1));
    titleEl.innerHTML = `<div style="display:flex; align-items:center; gap:1rem;"><span>Haftalık Plan (${startOfWeek.toLocaleDateString('tr-TR', { day: 'numeric', month: 'short' })} - ${new Date(new Date(startOfWeek).setDate(startOfWeek.getDate() + 6)).toLocaleDateString('tr-TR', { day: 'numeric', month: 'short', year: 'numeric' })})</span><button onclick="if(typeof openServiceFormModal === 'function') openServiceFormModal()" style="background: var(--warning); color:white; border:none; padding:0.4rem 0.8rem; border-radius:0.4rem; font-size:0.7rem; font-weight:800; cursor:pointer;">+ SERVİS TALEBİ</button></div>`;
    container.style.cssText = 'display:grid; grid-template-columns: 60px repeat(7, 1fr); gap:1px; background: var(--border); border: 1px solid var(--border); border-radius: 0.5rem; overflow:hidden;';
    container.innerHTML = '<div style="background:var(--bg); height:40px;"></div>';
    const subLabels = ['Pzt', 'Sal', 'Çar', 'Per', 'Cum', 'Cmt', 'Paz'];
    for (let i = 0; i < 7; i++) {
        const d = new Date(startOfWeek); d.setDate(d.getDate() + i);
        const isToday = d.toDateString() === new Date().toDateString();
        container.innerHTML += `<div style="background:${isToday ? 'rgba(var(--primary-rgb),0.1)' : 'var(--bg)'}; padding:0.75rem; text-align:center; font-weight:800; font-size:0.75rem; color:${isToday ? 'var(--primary)' : 'var(--text)'};">${subLabels[i]} ${d.getDate()}</div>`;
    }
    for (let h = 8; h < 20; h++) {
        const hStr = h.toString().padStart(2, '0') + ':00';
        container.innerHTML += `<div style="background:var(--bg); padding:0.5rem; font-size:0.7rem; font-weight:800; color:var(--text-light); text-align:center; border-top:1px solid var(--border);">${hStr}</div>`;
        for (let d = 0; d < 7; d++) {
            const cur = new Date(startOfWeek); cur.setDate(cur.getDate() + d);
            const dStr = cur.toISOString().split('T')[0];
            container.innerHTML += `<div id="slot-${dStr}-${h}" onclick="openQuickAddModal(new Date('${dStr}'), '${hStr}')" style="background:var(--card-bg); min-height:50px; border-top:1px solid var(--border); border-left:1px solid var(--border); padding:2px; position:relative; cursor:cell;"></div>`;
        }
    }
    events.forEach(v => {
        const h = parseInt(v.time.split(':')[0]);
        const slot = container.querySelector(`#slot-${v.date}-${h}`);
        if (slot) {
            const ev = document.createElement('div');
            ev.className = `calendar-event ${v.calType === 'service' ? 'warning' : 'primary'}`;
            ev.style.cssText = `padding:0.25rem; font-size:0.65rem; border-left:3px solid ${v.calColor}; background:${v.calColor}22; color:${v.calColor}; font-weight:900; cursor:pointer;`;
            ev.innerText = v.company; ev.title = `${v.time} - ${v.company}`;
            ev.onclick = (e) => { e.stopPropagation(); if (v.calType === 'service') window.location.href = 'technical-service.html'; else if (typeof showDetailsByName === 'function') showDetailsByName(v.company); };
            slot.appendChild(ev);
        }
    });
}

function renderMonthView(container, date, events, titleEl) {
    container.style.cssText = 'display:grid; grid-template-columns: repeat(7, 1fr); gap:0.5rem;';
    const month = date.getMonth(), year = date.getFullYear();
    titleEl.innerText = date.toLocaleDateString('tr-TR', { month: 'long', year: 'numeric' });
    const first = new Date(year, month, 1), last = new Date(year, month + 1, 0), prevLast = new Date(year, month, 0);
    const offset = (first.getDay() || 7) - 1;
    ['Pzt', 'Sal', 'Çar', 'Per', 'Cum', 'Cmt', 'Paz'].forEach(d => { container.innerHTML += `<div style="text-align:center; font-weight:900; font-size:0.75rem; color:var(--text-light); padding:0.75rem;">${d}</div>`; });
    for (let i = offset - 1; i >= 0; i--) renderDayBox(container, new Date(year, month - 1, prevLast.getDate() - i), events, null, 'monthly');
    for (let d = 1; d <= last.getDate(); d++) renderDayBox(container, new Date(year, month, d), events, null, 'monthly');
    const remaining = 42 - (offset + last.getDate());
    for (let i = 1; i <= remaining; i++) renderDayBox(container, new Date(year, month + 1, i), events, null, 'monthly');
}

function renderYearView(container, date, events, titleEl) {
    const year = date.getFullYear(); titleEl.innerText = year + ' Yılı Genel Bakış';
    container.style.cssText = 'display:grid; grid-template-columns: repeat(auto-fit, minmax(280px, 1fr)); gap:1.5rem;';
    const monthNames = ['Ocak', 'Şubat', 'Mart', 'Nisan', 'Mayıs', 'Haziran', 'Temmuz', 'Ağustos', 'Eylül', 'Ekim', 'Kasım', 'Aralık'];
    for (let m = 0; m < 12; m++) {
        const first = new Date(year, m, 1).getDay(), days = new Date(year, m + 1, 0).getDate();
        const startOffset = (first === 0 ? 6 : first - 1);
        const monthEvents = events.filter(e => { const d = new Date(e.date); return d.getFullYear() === year && d.getMonth() === m; });
        const card = document.createElement('div'); card.className = 'stat-card'; card.style.padding = '1.25rem';
        card.innerHTML = `<div style="font-weight:800; color:var(--primary); display:flex; justify-content:space-between; border-bottom:2px solid var(--border); padding-bottom:0.5rem; margin-bottom:0.75rem;"><span>${monthNames[m]}</span><span style="font-size:0.6rem; background:var(--primary); color:white; padding:2px 8px; border-radius:20px;">${monthEvents.length} Kayıt</span></div><div style="display:grid; grid-template-columns: repeat(7, 1fr); gap:2px; text-align:center;">${['Pt', 'Sa', 'Ça', 'Pe', 'Cu', 'Ct', 'Pz'].map(d => `<span style="font-size:0.6rem; color:var(--text-light); font-weight:800;">${d}</span>`).join('')}${Array(startOffset).fill('<div></div>').join('')}${Array.from({ length: days }, (_, i) => i + 1).map(d => {
            const dStr = `${year}-${(m + 1).toString().padStart(2, '0')}-${d.toString().padStart(2, '0')}`;
            const hasEv = events.some(e => e.date === dStr), isToday = new Date().toISOString().split('T')[0] === dStr;
            return `<div onclick="calendarRefDate=new Date(${year},${m},${d}); setCalendarMode('day');" style="font-size:0.7rem; padding:5px 0; border-radius:4px; cursor:pointer; ${hasEv ? 'background:rgba(59,130,246,0.15); color:var(--primary); font-weight:900;' : ''} ${isToday ? 'border:1px solid var(--primary);' : ''}">${d}</div>`;
        }).join('')}</div>`;
        container.appendChild(card);
    }
}

function renderDayBox(container, date, events, label, type) {
    const dStr = date.toISOString().split('T')[0], dayEv = events.filter(e => e.date === dStr);
    const isToday = date.toDateString() === new Date().toDateString();
    const box = document.createElement('div'); box.className = 'stat-card'; box.style.cssText = `padding:0.5rem; min-height:${type === 'monthly' ? '90px' : '150px'}; display:flex; flex-direction:column; gap:0.5rem; border:${isToday ? '1.5px solid var(--primary)' : '1px solid var(--border)'}; border-radius:0.6rem; cursor:pointer;`;
    if (type === 'monthly' && date.getMonth() !== calendarRefDate.getMonth()) box.style.opacity = '0.35';
    box.innerHTML = `<div style="display:flex; justify-content:space-between;"><div style="display:flex; flex-direction:column;"><span style="font-weight:800; font-size:0.55rem; color:var(--text-light); text-transform:uppercase;">${label || ''}</span><span style="font-size:0.95rem; font-weight:900;">${date.getDate()}</span></div>${dayEv.length ? `<div style="background:var(--primary); color:white; width:16px; height:16px; border-radius:50%; font-size:0.6rem; display:flex; align-items:center; justify-content:center;">${dayEv.length}</div>` : ''}</div><div style="display:flex; flex-direction:column; gap:0.3rem;">${dayEv.map(dv => `<div onclick="event.stopPropagation(); if(dv.calType==='service') showServiceRequestDetails(dv.id); else if(typeof showDetailsByName === 'function') showDetailsByName(dv.company);" style="font-size:0.65rem; font-weight:700; border-left:3px solid ${dv.calColor}; background:${dv.calColor}15; padding:2px 4px; border-radius:4px; overflow:hidden; text-overflow:ellipsis; white-space:nowrap;">${dv.company}</div>`).join('')}</div>`;
    box.onclick = () => openQuickAddModal(date, "09:00");
    container.appendChild(box); return box;
}

/* Visit Actions */
function openQuickAddModal(date, hour) {
    const dateStr = date.toISOString().split('T')[0];
    openVisitModal();
    const dIn = document.getElementById('visit-date'), tIn = document.getElementById('visit-time');
    if (dIn) dIn.value = dateStr; if (tIn) tIn.value = hour;
}

function openVisitModal() {
    const select = document.getElementById('visit-company-select');
    if (!select) return;
    if (customerData.length === 0) select.innerHTML = '<option value="" disabled selected>Önce bir müşteri/firma kaydı oluşturmalısınız.</option>';
    else {
        const user = currentUser ? (currentUser.role === 'admin' ? 'admin' : currentUser.name) : 'guest';
        const filtered = customerData.filter(c => user === 'admin' || c.createdBy === user || c.createdBy === 'Sistem Yöneticisi');
        select.innerHTML = '<option value="" disabled selected>Firma Seçiniz...</option>' + filtered.map(c => `<option value="${c.A}">${c.A} (${c.B})</option>`).join('');
    }
    const modal = document.getElementById('visit-modal');
    if (modal) modal.style.display = 'flex';
}

function closeVisitModal() {
    const modal = document.getElementById('visit-modal');
    if (modal) modal.style.display = 'none';
}

function handleNewVisit(event) {
    event.preventDefault();
    const formData = new FormData(event.target);
    let visits = []; try { visits = JSON.parse(localStorage.getItem('crm_visits') || '[]'); } catch (e) { }
    const newVisit = {
        company: formData.get('company'),
        date: formData.get('date'),
        time: formData.get('time'),
        notes: formData.get('notes'),
        visitType: formData.get('visitType') || 'Saha Ziyareti',
        stage: formData.get('visitStage'),
        user: currentUser.name,
        id: Date.now()
    };
    visits.push(newVisit);
    localStorage.setItem('crm_visits', JSON.stringify(visits));

    // Mirror to Technical Service if it's a Service Request
    if (newVisit.visitType === 'Servis Talebi') {
        let services = [];
        try { services = JSON.parse(localStorage.getItem('crm_service_requests') || '[]'); } catch (e) { services = []; }
        const newService = {
            id: 'SRV_VISIT_' + newVisit.id,
            formNo: 'SRV-' + Math.floor(Math.random() * 90000 + 10000),
            company: newVisit.company,
            contact: '-',
            deviceModel: 'Ziyaretten Oluşturuldu',
            serialNumber: '-',
            type: 'ariza',
            warranty: 'garantili',
            priority: 'normal',
            complaint: newVisit.notes || 'Ziyaret planından otomatik servis kaydı.',
            date: new Date(newVisit.date).toISOString(),
            status: 'Açık'
        };
        services.push(newService);
        localStorage.setItem('crm_service_requests', JSON.stringify(services));
    }

    logActivity('yeni bir ziyaret planladı:', newVisit.company);
    if (typeof refreshApp === 'function') refreshApp();
    closeVisitModal(); event.target.reset();
}

function deleteVisitById(visitId) {
    let visits = []; try { visits = JSON.parse(localStorage.getItem('crm_visits') || '[]'); } catch (e) { }
    const target = visits.find(v => v.id == visitId);
    if (!target) return;
    if (!canModifyVisit(target)) return alert('Bu ziyareti silme yetkiniz yok.');
    if (confirm('Bu ziyaret planını silmek istediğinize emin misiniz?')) {
        visits = visits.filter(v => v.id != visitId);
        localStorage.setItem('crm_visits', JSON.stringify(visits));
        logActivity('ziyaret planını iptal etti:', target.company);
        if (typeof refreshApp === 'function') refreshApp();
    }
}

function showVisitNoteModal(visitId) {
    let visits = []; try { visits = JSON.parse(localStorage.getItem('crm_visits') || '[]'); } catch (e) { }
    const visit = visits.find(v => v.id == visitId);
    if (!visit) return;
    if (!canModifyVisit(visit)) return alert('Bu ziyaret notunu düzenleme yetkiniz yok.');
    document.getElementById('visit-note-id').value = visitId;
    document.getElementById('visit-note-company-name').innerText = visit.company + " - Ziyaret Tamamlama";
    document.getElementById('visit-note-textarea').value = visit.notes || "";
    document.getElementById('visit-note-modal').style.display = 'flex';
}

function closeVisitNoteModal() { document.getElementById('visit-note-modal').style.display = 'none'; }

function saveVisitNote(event) {
    event.preventDefault();
    const id = document.getElementById('visit-note-id').value, note = document.getElementById('visit-note-textarea').value;
    let vArr = []; try { vArr = JSON.parse(localStorage.getItem('crm_visits') || '[]'); } catch (e) { }
    const idx = vArr.findIndex(v => v.id == id);
    if (idx !== -1) {
        if (!canModifyVisit(vArr[idx])) return alert('Bu notu kaydetme yetkiniz yok.');
        vArr[idx].notes = note; localStorage.setItem('crm_visits', JSON.stringify(vArr));
        logActivity('ziyaret notunu güncelledi:', vArr[idx].company);
        if (typeof refreshApp === 'function') refreshApp();
        closeVisitNoteModal();
    }
}

function showDayRoute() {
    let visits = []; try { visits = JSON.parse(localStorage.getItem('crm_visits') || '[]'); } catch (e) { }
    const todayStr = new Date().toISOString().split('T')[0];
    const todayVisits = visits.filter(v => v.date === todayStr).sort((a, b) => a.time.localeCompare(b.time));
    if (todayVisits.length === 0) return alert("Bugün için planlanmış bir ziyaret bulunmamaktadır.");
    const locations = todayVisits.map(v => {
        const c = customerData.find(cd => cd.A === v.company);
        return encodeURIComponent(v.company + (c && c.C ? ' ' + c.C : ''));
    });
    const url = locations.length === 1 ? `https://www.google.com/maps/search/?api=1&query=${locations[0]}` : `https://www.google.com/maps/dir/?api=1&origin=${locations[0]}&destination=${locations[locations.length - 1]}&waypoints=${locations.slice(1, -1).join('|')}&travelmode=driving`;
    window.open(url, '_blank');
}

/* Exports */
async function exportCalendarToPDF() {
    let visits = []; try { visits = JSON.parse(localStorage.getItem('crm_visits') || '[]'); } catch (e) { }
    const { jsPDF } = window.jspdf;
    const pdf = new jsPDF(); pdf.setFontSize(14); pdf.text('LİNKUP CRM — Ziyaret Planı Raporu', 15, 14);
    let y = 32; pdf.setFontSize(10); pdf.text('Toplam Ziyaret: ' + visits.length, 15, y); y += 10;
    const sorted = [...visits].sort((a, b) => new Date(`${a.date} ${a.time}`) - new Date(`${b.date} ${b.time}`));
    sorted.forEach(v => {
        if (y > 270) { pdf.addPage(); y = 20; }
        pdf.text(`${v.date} ${v.time} - ${v.company} (${v.user})`, 15, y); y += 7;
    });
    pdf.save('Ziyaret_Plani.pdf');
}

function exportCalendarToExcel() {
    let visits = []; try { visits = JSON.parse(localStorage.getItem('crm_visits') || '[]'); } catch (e) { }
    const rows = [...visits].sort((a, b) => new Date(`${a.date} ${a.time}`) - new Date(`${b.date} ${b.time}`)).map(v => ({ 'Tarih': v.date, 'Saat': v.time, 'Şirket': v.company, 'Kullanıcı': v.user, 'Notlar': v.notes }));
    const ws = XLSX.utils.json_to_sheet(rows);
    const wb = XLSX.utils.book_new(); XLSX.utils.book_append_sheet(wb, ws, 'Ziyaretler');
    XLSX.writeFile(wb, 'Ziyaret_Plani.xlsx');
}
