function injectModals() {
    if (document.getElementById('modal-container')) return;
    const modalContainer = document.createElement('div');
    modalContainer.id = 'modal-container';
    modalContainer.innerHTML = `
        <!-- Add/Edit Company Modal -->
        <div id="add-modal" class="modal">
            <div class="modal-content" style="max-width: 800px;">
                <span class="close-modal" onclick="closeAddModal()">&times;</span>
                <h2 id="add-modal-title" style="margin-bottom: 1.5rem; display: flex; align-items: center; gap: 0.75rem;">
                    <i class="fa-solid fa-building-circle-plus" style="color: var(--primary);"></i>
                    Yeni Firma Oluştur
                </h2>
                <form id="add-company-form" onsubmit="handleNewCompany(event)" style="display: grid; grid-template-columns: 1fr 1fr; gap: 1rem;">
                    <input type="hidden" name="editingIndex" id="editing-index" value="-1">
                    
                    <div class="form-group">
                        <label>ŞİRKET ADI</label>
                        <input type="text" name="A" required placeholder="Firma tam adı...">
                    </div>
                    <div class="form-group">
                        <label>ŞEHİR</label>
                        <input type="text" name="B" placeholder="Şehir...">
                    </div>
                    <div class="form-group">
                        <label>FİRMA ADRESİ</label>
                        <input type="text" name="address" placeholder="Adres detayı...">
                    </div>
                    <div class="form-group">
                        <label>YETKİLİ KİŞİ</label>
                        <input type="text" name="contact" placeholder="Ad Soyad...">
                    </div>
                    <div class="form-group">
                        <label>YETKİLİ ÜNVANI</label>
                        <input type="text" name="contactTitle" placeholder="Örn: Satın Alma Müdürü">
                    </div>
                    <div class="form-group">
                        <label>E-POSTA</label>
                        <input type="email" name="email" placeholder="ornek@mail.com">
                    </div>
                    <div class="form-group">
                        <label>WEB SİTESİ</label>
                        <input type="url" name="website" placeholder="https://...">
                    </div>
                    <div class="form-group">
                        <label>LINKEDIN</label>
                        <input type="url" name="linkedin" placeholder="LinkedIn Profil URL">
                    </div>
                    <div class="form-group">
                        <label>TELEFON</label>
                        <input type="tel" name="phone" placeholder="05XX XXX XX XX">
                    </div>
                    <div class="form-group">
                        <label>MEVCUT ÜRÜN</label>
                        <input type="text" name="C" placeholder="Kullandığı rakipler/ürünler...">
                    </div>
                    <div class="form-group">
                        <label>SEKTÖR</label>
                        <input type="text" name="industry" placeholder="Örn: Otomotiv, Gıda...">
                    </div>
                    <div class="form-group">
                        <label>KAYNAK</label>
                        <select name="leadSource">
                            <option value="Web Sitesi">Web Sitesi</option>
                            <option value="Referans">Referans</option>
                            <option value="Soğuk Arama">Soğuk Arama</option>
                            <option value="Fuar">Fuar</option>
                            <option value="Sosyal Medya">Sosyal Medya</option>
                            <option value="Diğer">Diğer</option>
                        </select>
                    </div>
                    <div class="form-group">
                        <label>ÜRÜN (Satılacak)</label>
                        <input type="text" name="D" placeholder="Bizim satacağımız ürün...">
                    </div>
                    <div class="form-group">
                        <label>ADET</label>
                        <input type="number" name="E" placeholder="Planlanan miktar...">
                    </div>
                    <div class="form-group">
                        <label>POTANSİYEL GELİR ($)</label>
                        <input type="number" name="N" placeholder="Tahmin edilen ciro...">
                    </div>
                    <div class="form-group">
                        <label>KURULUM TARİH</label>
                        <input type="date" name="O">
                    </div>
                    
                    <div class="form-group" style="grid-column: span 2; background: rgba(var(--primary-rgb), 0.05); padding: 0.75rem; border-radius: 0.5rem; border: 1px solid var(--border);">
                        <label style="color: var(--primary); font-weight: 800; margin-bottom: 0.5rem; display: block; font-size: 0.75rem;">SATIŞ EVRELERİ VE TARİHLERİ</label>
                        <div style="display: grid; grid-template-columns: repeat(auto-fit, minmax(140px, 1fr)); gap: 0.5rem;">
                            <div class="stage-date-item">
                                <label style="font-size: 0.65rem;">S (Şüpheli)</label>
                                <input type="date" name="stage_F" style="padding: 0.25rem; font-size: 0.7rem;">
                            </div>
                            <div class="stage-date-item">
                                <label style="font-size: 0.65rem;">P (Potansiyel)</label>
                                <input type="date" name="stage_G" style="padding: 0.25rem; font-size: 0.7rem;">
                            </div>
                            <div class="stage-date-item">
                                <label style="font-size: 0.65rem;">A (İhtiyaç)</label>
                                <input type="date" name="stage_H" style="padding: 0.25rem; font-size: 0.7rem;">
                            </div>
                            <div class="stage-date-item">
                                <label style="font-size: 0.65rem;">D (Demo)</label>
                                <input type="date" name="stage_I" style="padding: 0.25rem; font-size: 0.7rem;">
                            </div>
                            <div class="stage-date-item">
                                <label style="font-size: 0.65rem;">A/N (Pazarlık)</label>
                                <input type="date" name="stage_J" style="padding: 0.25rem; font-size: 0.7rem;">
                            </div>
                            <div class="stage-date-item">
                                <label style="font-size: 0.65rem;">C (Kapanış)</label>
                                <input type="date" name="stage_K" style="padding: 0.25rem; font-size: 0.7rem;">
                            </div>
                            <div class="stage-date-item">
                                <label style="font-size: 0.65rem;">O (Sipariş)</label>
                                <input type="date" name="stage_L" style="padding: 0.25rem; font-size: 0.7rem;">
                            </div>
                        </div>
                        <p style="font-size: 0.6rem; color: var(--text-light); margin-top: 0.5rem;">* Tarih girilen en ileri evre, firmanın mevcut durumu kabul edilir.</p>
                    </div>

                    <div class="form-group">
                        <label>OLABİLİRLİK</label>
                        <select name="prob">
                            <option value="P">Yüksek (High)</option>
                            <option value="Q">Orta (Medium)</option>
                            <option value="R">Düşük (Low)</option>
                        </select>
                    </div>

                    <div class="form-group" style="grid-column: span 2;">
                        <label>FİRMA GÖRSELİ / LOGO</label>
                        <input type="file" id="company-logo-input" accept="image/*" style="width: 100%; padding: 0.5rem; border: 1px solid var(--border); border-radius: 0.4rem; background: var(--bg);">
                        <input type="hidden" name="logo" id="company-logo-base64">
                    </div>

                    <div class="form-group" style="grid-column: span 2;">
                        <label>NOTLAR</label>
                        <textarea name="S" rows="3" placeholder="Görüşme notları, özel detaylar..."></textarea>
                    </div>

                    <div style="grid-column: span 2; display: flex; justify-content: flex-end; gap: 1rem; margin-top: 1rem;">
                        <button type="button" class="btn btn-secondary" onclick="closeAddModal()">İptal</button>
                        <button type="submit" class="btn btn-primary">Kaydet</button>
                    </div>
                </form>
            </div>
        </div>

        <!-- Visit Note Modal -->
        <div id="visit-note-modal" class="modal">
            <div class="modal-content" style="max-width: 500px;">
                <span class="close-modal" onclick="closeVisitNoteModal()">&times;</span>
                <h2 id="visit-note-company-name" style="margin-bottom: 1.5rem;">Ziyaret Notu Ekle</h2>
                <form id="visit-note-form" onsubmit="saveVisitNote(event)">
                    <input type="hidden" id="visit-note-id">
                    <div class="form-group">
                        <label>ZİYARET NOTLARI / SONUÇ</label>
                        <textarea id="visit-note-textarea" rows="5" required placeholder="Görüşme nasıl geçti? Bir sonraki adım ne olacak?"></textarea>
                    </div>
                    <div style="display: flex; justify-content: flex-end; gap: 1rem; margin-top: 1.5rem;">
                        <button type="button" class="btn btn-secondary" onclick="closeVisitNoteModal()">İptal</button>
                        <button type="submit" class="btn btn-primary">Notu Kaydet ve Tamamla</button>
                    </div>
                </form>
            </div>
        </div>

        <!-- Announcement Modal -->
        <div id="announcement-modal" class="modal">
            <div class="modal-content" style="max-width: 600px;">
                <span class="close-modal" onclick="closeAnnouncementModal()">&times;</span>
                <h2 style="margin-bottom: 1.5rem;">Yeni Duyuru Yayınla</h2>
                <form id="announcement-form" onsubmit="handleNewAnnouncement(event)">
                    <div class="form-group">
                        <label>BAŞLIK</label>
                        <input type="text" name="title" id="ann-title" required placeholder="Duyuru başlığı...">
                    </div>
                    <div class="form-group">
                        <label>İÇERİK</label>
                        <textarea name="content" id="ann-text" rows="6" required placeholder="Duyuru detaylarını buraya yazın..."></textarea>
                    </div>
                    <div class="form-group">
                        <label>TÜR / RENK</label>
                        <select name="type" id="ann-type">
                            <option value="info">Bilgilendirme (Mavi)</option>
                            <option value="warning">Uyarı (Turuncu)</option>
                            <option value="success">Başarı (Yeşil)</option>
                            <option value="danger">Kritik (Kırmızı)</option>
                        </select>
                    </div>
                    <div style="display: flex; justify-content: flex-end; gap: 1rem; margin-top: 1.5rem;">
                        <button type="button" class="btn btn-secondary" onclick="closeAnnouncementModal()">İptal</button>
                        <button type="submit" class="btn btn-primary">Duyuruyu Paylaş</button>
                    </div>
                </form>
            </div>
        </div>

        <!-- Details Modal -->
        <div id="details-modal" class="modal">
            <div class="modal-content" style="max-width: 900px; padding: 0;">
                <div id="modal-details-content"></div>
            </div>
        </div>

        <!-- Technical Service Form Modal -->
        <div id="service-form-modal" class="modal">
            <div class="modal-content" style="max-width: 800px; max-height: 90vh; overflow-y: auto;">
                <span class="close-modal" onclick="closeServiceFormModal()">&times;</span>
                <h2 style="margin-bottom: 1.5rem; border-bottom: 2px solid var(--border); padding-bottom: 1rem; display: flex; align-items: center; gap:0.75rem;">
                    <i class="fa-solid fa-screwdriver-wrench" style="color: var(--primary);"></i>
                    Teknik Servis Formu
                </h2>
                <form id="service-form" onsubmit="handleNewServiceForm(event)" style="display: grid; grid-template-columns: 1fr 1fr; gap: 1.5rem;">
                    <div style="grid-column: 1 / -1;">
                        <h3 style="font-size: 0.9rem; color: var(--primary); margin-bottom: 1rem; font-weight: 800; text-transform: uppercase;">1. Müşteri Bilgileri</h3>
                        <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 1rem;">
                            <div class="form-group">
                                <label>ŞİRKET / MÜŞTERİ SEÇİN *</label>
                                <input type="text" id="service-company-input" list="service-companies-list" required placeholder="Firma Adı Yazın veya Seçin...">
                                <datalist id="service-companies-list"></datalist>
                            </div>
                            <div class="form-group">
                                <label>İLETİŞİM KURULACAK KİŞİ</label>
                                <input type="text" id="service-contact-person" placeholder="Ad Soyad">
                            </div>
                        </div>
                    </div>

                    <div style="grid-column: 1 / -1;">
                        <h3 style="font-size: 0.9rem; color: var(--primary); margin-bottom: 1rem; font-weight: 800; text-transform: uppercase;">2. Cihaz / Ürün Bilgileri</h3>
                        <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 1rem;">
                            <div class="form-group">
                                <label>CİHAZ / MAKİNE MODELİ *</label>
                                <input type="text" id="service-device-model" required placeholder="Örn: X1200 Baskı Makinesi">
                            </div>
                            <div class="form-group">
                                <label>SERİ NUMARASI</label>
                                <input type="text" id="service-serial-number" placeholder="Örn: SN-987654321">
                            </div>
                        </div>
                    </div>

                    <div style="grid-column: 1 / -1;">
                        <h3 style="font-size: 0.9rem; color: var(--primary); margin-bottom: 1rem; font-weight: 800; text-transform: uppercase;">3. Servis Detayları</h3>
                        <div style="display: grid; grid-template-columns: 1fr 1fr 1fr; gap: 1rem;">
                            <div class="form-group">
                                <label>SERVİS TÜRÜ *</label>
                                <select id="service-type" required>
                                    <option value="ariza">Arıza Onarımı</option>
                                    <option value="bakim">Periyodik Bakım</option>
                                    <option value="kurulum">İlk Kurulum</option>
                                    <option value="egitim">Eğitim</option>
                                </select>
                            </div>
                            <div class="form-group">
                                <label>GARANTİ DURUMU *</label>
                                <select id="service-warranty" required>
                                    <option value="garantili">Garantili (Ücretsiz)</option>
                                    <option value="ucretli">Garantisiz (Ücretli)</option>
                                    <option value="sozlesmeli">Bakım Sözleşmeli</option>
                                </select>
                            </div>
                            <div class="form-group">
                                <label>ÖNCELİK *</label>
                                <select id="service-priority" required>
                                    <option value="normal">Normal</option>
                                    <option value="yuksek">Yüksek</option>
                                    <option value="acil">Acil</option>
                                </select>
                            </div>
                            <div class="form-group">
                                <label>TARİH *</label>
                                <input type="date" id="service-date" required>
                            </div>
                        </div>
                    </div>

                    <div class="form-group" style="grid-column: 1 / -1;">
                        <label>ŞİKAYET / PROBLEM AÇIKLAMASI *</label>
                        <textarea id="service-complaint" required placeholder="Müşterinin belirttiği şikayet veya talep detaylarını yazınız..." style="min-height: 100px;"></textarea>
                    </div>

                    <div style="grid-column: 1 / -1; display: flex; justify-content: flex-end; gap: 1rem; padding-top: 1.5rem; border-top: 1px solid var(--border);">
                        <button type="button" class="btn btn-secondary" onclick="closeServiceFormModal()">İptal</button>
                        <button type="submit" class="btn btn-primary">Servis Formunu Kaydet</button>
                    </div>
                </form>
            </div>
        </div>

        <!-- Add User Modal -->
        <div id="add-user-modal" class="modal">
            <div class="modal-content" style="max-width: 400px;">
                <span class="close-modal" onclick="closeAddUserModal()">&times;</span>
                <h2 style="margin-bottom: 1.5rem; display: flex; align-items: center; gap:0.75rem;">
                    <i class="fa-solid fa-user-plus" style="color: var(--primary);"></i>
                    Yeni Kullanıcı
                </h2>
                <form onsubmit="handleAddUser(event)">
                    <div class="form-group">
                        <label>AD SOYAD</label>
                        <input type="text" id="user-name" required>
                    </div>
                    <div class="form-group">
                        <label>E-POSTA</label>
                        <input type="email" id="user-email" required>
                    </div>
                    <div class="form-group">
                        <label>ŞİFRE</label>
                        <input type="password" id="user-password" required>
                    </div>
                    <div class="form-group">
                        <label>ROL</label>
                        <select id="user-role" required>
                            <option value="user">User (Sadece kendi verileri)</option>
                            <option value="admin">Admin (Tüm veriler)</option>
                        </select>
                    </div>
                    <div style="display: flex; justify-content: flex-end; gap: 1rem; margin-top: 1.5rem;">
                        <button type="button" class="btn btn-secondary" onclick="closeAddUserModal()">İptal</button>
                        <button type="submit" class="btn btn-primary">Kullanıcı Ekle</button>
                    </div>
                </form>
            </div>
        </div>
        <!-- Visit Modal -->
        <div id="visit-modal" class="modal">
            <div class="modal-content" style="max-width: 500px;">
                <span class="close-modal" onclick="closeVisitModal()">&times;</span>
                <h2 style="margin-bottom: 1.5rem; display: flex; align-items: center; gap: 0.75rem;">
                    <i class="fa-solid fa-calendar-plus" style="color: var(--primary);"></i>
                    Yeni Ziyaret Planla
                </h2>
                <form id="visit-form" onsubmit="handleNewVisit(event)" style="display: flex; flex-direction: column; gap: 1rem;">
                    <div class="form-group">
                        <label>ŞİRKET SEÇİN</label>
                        <select name="company" id="visit-company-select" required>
                            <!-- Options injected via JS -->
                        </select>
                    </div>
                    <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 1rem;">
                        <div class="form-group">
                            <label>ZİYARET TARİHİ</label>
                            <input type="date" name="date" id="visit-date" required>
                        </div>
                        <div class="form-group">
                            <label>SAAT</label>
                            <input type="time" name="time" id="visit-time" required>
                        </div>
                    </div>
                    <div class="form-group">
                        <label>ZİYARET TÜRÜ</label>
                        <select name="visitType" id="visit-type-select">
                            <option value="Saha Ziyareti">🏢 Saha Ziyareti</option>
                            <option value="Servis Talebi">🔧 Servis Talebi</option>
                            <option value="Online Görüşme">💻 Online Görüşme</option>
                            <option value="Telefon Görüşmesi">📞 Telefon Görüşmesi</option>
                            <option value="Demo Sunumu">🎯 Demo Sunumu</option>
                            <option value="Diğer">📋 Diğer</option>
                        </select>
                    </div>
                    <div class="form-group">
                        <label>PADACO EVRESİ</label>
                        <div style="display: flex; gap: 0.5rem; flex-wrap: wrap; background: var(--bg); padding: 0.5rem; border-radius: 0.4rem; border: 1px solid var(--border);">
                            <label style="font-size: 0.7rem; display: flex; align-items: center; gap: 0.2rem;"><input type="radio" name="visitStage" value="S" checked> S</label>
                            <label style="font-size: 0.7rem; display: flex; align-items: center; gap: 0.2rem;"><input type="radio" name="visitStage" value="P"> P</label>
                            <label style="font-size: 0.7rem; display: flex; align-items: center; gap: 0.2rem;"><input type="radio" name="visitStage" value="A"> A</label>
                            <label style="font-size: 0.7rem; display: flex; align-items: center; gap: 0.2rem;"><input type="radio" name="visitStage" value="D"> D</label>
                            <label style="font-size: 0.7rem; display: flex; align-items: center; gap: 0.2rem;"><input type="radio" name="visitStage" value="A/N"> A/N</label>
                            <label style="font-size: 0.7rem; display: flex; align-items: center; gap: 0.2rem;"><input type="radio" name="visitStage" value="C"> C</label>
                            <label style="font-size: 0.7rem; display: flex; align-items: center; gap: 0.2rem;"><input type="radio" name="visitStage" value="O"> O</label>
                        </div>
                    </div>
                    <div class="form-group">
                        <label>NOTLAR / AJANDA</label>
                        <textarea name="notes" id="visit-notes" rows="3" placeholder="Ziyaret amacı, görüşülecek konular..."></textarea>
                    </div>
                    <div style="display: flex; justify-content: flex-end; gap: 1rem; margin-top: 1rem;">
                        <button type="button" class="btn btn-secondary" onclick="closeVisitModal()">İptal</button>
                        <button type="submit" class="btn btn-primary">Planla</button>
                    </div>
                </form>
            </div>
        </div>
    `;
    document.body.appendChild(modalContainer);

    // Initialize logo upload listener
    const logoInput = document.getElementById('company-logo-input');
    if (logoInput) {
        logoInput.onchange = (e) => {
            const file = e.target.files[0];
            if (file) {
                const reader = new FileReader();
                reader.onload = (event) => {
                    document.getElementById('company-logo-base64').value = event.target.result;
                };
                reader.readAsDataURL(file);
            }
        };
    }
}

// Auto-inject on load
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', injectModals);
} else {
    injectModals();
}
