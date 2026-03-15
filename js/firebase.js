/**
 * firebase.js - Firebase Firestore Gerçek Zamanlı Senkronizasyon
 * ES Module - tüm cihazlar arası anlık veri senkronizasyonu
 */

import { initializeApp } from "https://www.gstatic.com/firebasejs/11.4.0/firebase-app.js";
import {
  getFirestore, doc, getDoc, setDoc, onSnapshot
} from "https://www.gstatic.com/firebasejs/11.4.0/firebase-firestore.js";

const firebaseConfig = {
  apiKey: "AIzaSyBCgt5x8w1V1pviDWVb-QtddS_l9leY1Gw",
  authDomain: "ysn-crm.firebaseapp.com",
  projectId: "ysn-crm",
  storageBucket: "ysn-crm.firebasestorage.app",
  messagingSenderId: "243748644966",
  appId: "1:243748644966:web:e76483bca7ea18b50925a7"
};

// Senkronize edilecek veri anahtarları
const SYNC_KEYS = [
  'crm_customer_data',
  'crm_visits',
  'crm_service_requests',
  'crm_activities',
  'crm_announcements',
  'crm_users',
  'crm_mkt_campaigns'
];

let db = null;
let _isWriting = false; // Döngü önleyici
const _origSetItem = localStorage.setItem.bind(localStorage);
const _origGetItem = localStorage.getItem.bind(localStorage);

// ─── Firebase Başlat ─────────────────────────────────────────────────────────
async function initFirebase() {
  try {
    const app = initializeApp(firebaseConfig);
    db = getFirestore(app);
    console.log('[Firebase] ✅ Bağlantı kuruldu');

    // 1. Buluttan veriyi çek ve localStorage'a yaz
    await pullFromCloud();

    // 2. localStorage.setItem'ı override et → her kayıtta buluta gönder
    localStorage.setItem = function(key, value) {
      _origSetItem(key, value); // Her zaman önce local'e yaz
      if (!_isWriting && SYNC_KEYS.includes(key)) {
        try {
          const parsed = JSON.parse(value);
          pushToCloud(key, parsed);
        } catch (e) { /* JSON değilse sadece local'de kalır */ }
      }
    };

    // 3. Gerçek zamanlı dinleyicileri başlat - diğer cihazdan gelen değişiklikler
    startRealtimeListeners();

    return true;
  } catch (e) {
    console.warn('[Firebase] ⚠️ Başlatılamadı:', e.message);
    return false;
  }
}

function setSyncStatus(visible, text = 'Senkronize ediliyor...') {
  const el = document.getElementById('sync-indicator');
  if (!el) return;
  if (visible) {
    el.innerHTML = `<i class="fa-solid fa-rotate fa-spin"></i> ${text}`;
    el.classList.add('visible');
  } else {
    setTimeout(() => el.classList.remove('visible'), 1500);
  }
}

// ─── Buluttan Çek ────────────────────────────────────────────────────────────
async function pullFromCloud() {
  if (!db) return;
  setSyncStatus(true, 'Veriler alınıyor...');
  let pulled = 0;
  for (const key of SYNC_KEYS) {
    try {
    const ref = doc(db, 'crm_data', key);
    const snap = await getDoc(ref);
    if (snap.exists()) {
      const cloudData = snap.data().value;
      const cloudTs   = snap.data().updatedAt || 0;
      const localRaw  = _origGetItem(key);
      const localTs   = parseInt(_origGetItem(key + '_ts') || '0');

      if (!localRaw || cloudTs > localTs) {
        _isWriting = true;
        _origSetItem(key, JSON.stringify(cloudData));
        _origSetItem(key + '_ts', String(cloudTs));
        _isWriting = false;
        pulled++;
      }
    }
  } catch (e) {
    console.warn(`[Firebase] ${key} çekerken hata:`, e.message);
  }
}
setSyncStatus(false);

if (pulled > 0) {
  try {
    const raw = _origGetItem('crm_customer_data');
    if (raw && typeof customerData !== 'undefined') {
      const parsed = JSON.parse(raw);
      customerData.length = 0;
      parsed.forEach(item => customerData.push(item));
    }
  } catch(e) {}
  setTimeout(() => { if (typeof refreshApp === 'function') refreshApp(); }, 100);
}
}

// ─── Buluta Gönder ───────────────────────────────────────────────────────────
async function pushToCloud(key, data) {
if (!db) return;
setSyncStatus(true, 'Değişiklikler kaydediliyor...');
try {
  const ts = Date.now();
  await setDoc(doc(db, 'crm_data', key), {
    value: data,
    updatedAt: ts,
    device: navigator.userAgent.substring(0, 50)
  });
  _origSetItem(key + '_ts', String(ts));
} catch (e) {
  console.warn(`[Firebase] ${key} gönderme hatası:`, e.message);
}
setSyncStatus(false);
}

// ─── Gerçek Zamanlı Dinleyiciler ─────────────────────────────────────────────
function startRealtimeListeners() {
if (!db) return;

SYNC_KEYS.forEach(key => {
  onSnapshot(doc(db, 'crm_data', key), (snap) => {
    if (!snap.exists()) return;

    const cloudData = snap.data().value;
    const cloudTs   = snap.data().updatedAt || 0;
    const localTs   = parseInt(_origGetItem(key + '_ts') || '0');

    if (cloudTs > localTs + 500) {
      setSyncStatus(true, 'Buluttan güncelleme...');
      _isWriting = true;
      _origSetItem(key, JSON.stringify(cloudData));
      _origSetItem(key + '_ts', String(cloudTs));
      _isWriting = false;

      if (key === 'crm_customer_data' && typeof customerData !== 'undefined') {
        try {
          customerData.length = 0;
          cloudData.forEach(item => customerData.push(item));
        } catch(e) {}
      }
      if (typeof refreshApp === 'function') refreshApp();
      setSyncStatus(false);
    }
  });
});
}


// ─── Manuel Senkronizasyon (gerekirse) ───────────────────────────────────────
async function forcePushAllToCloud() {
  if (!db) return alert('Firebase bağlantısı yok!');
  if (!confirm('Tüm yerel verilerinizi buluta yüklemek istiyor musunuz? Bu işlem buluttaki verileri ezer.')) return;

  setSyncStatus(true, 'Zorla yükleniyor...');
  let pushed = 0;
  for (const key of SYNC_KEYS) {
    try {
      const value = _origGetItem(key);
      if (value) {
        const parsed = JSON.parse(value);
        const ts = Date.now();
        await setDoc(doc(db, 'crm_data', key), {
          value: parsed,
          updatedAt: ts,
          device: navigator.userAgent.substring(0, 50) + ' (Zorla)'
        });
        _origSetItem(key + '_ts', String(ts));
        pulled++;
      }
    } catch (e) {}
  }
  setSyncStatus(false);
  alert('Tüm veriler başarıyla buluta kilitlendi!');
}

async function syncNow() {
  await pullFromCloud();
}

// Global erişim
window.initFirebase  = initFirebase;
window.syncNow       = syncNow;
window.pushToCloud   = pushToCloud;
window.forcePushAllToCloud = forcePushAllToCloud;

export { initFirebase, syncNow, pushToCloud, forcePushAllToCloud, db };
