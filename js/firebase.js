/**
 * firebase.js - Firebase Firestore Gerçek Zamanlı Senkronizasyon
 * ES Module - tüm cihazlar arası anlık veri senkronizasyonu
 */

import { initializeApp } from "https://www.gstatic.com/firebasejs/10.7.1/firebase-app.js";
import { getFirestore, doc, getDoc, setDoc, onSnapshot } from "https://www.gstatic.com/firebasejs/10.7.1/firebase-firestore.js";
import { getAuth, signInWithPopup, signInWithRedirect, getRedirectResult, GoogleAuthProvider } from "https://www.gstatic.com/firebasejs/10.7.1/firebase-auth.js";

const firebaseConfig = {
  apiKey: "AIzaSyBCgt5x8w1V1pviDWVb-QtddS_l9leY1Gw",
  authDomain: "ysn-crm.firebaseapp.com",
  projectId: "ysn-crm",
  storageBucket: "ysn-crm.firebasestorage.app",
  messagingSenderId: "243748644966",
  appId: "1:243748644966:web:e76483bca7ea18b50925a7"
};

const SYNC_KEYS = [
  'crm_customer_data', 'crm_visits', 'crm_service_requests',
  'crm_activities', 'crm_announcements', 'crm_users', 'crm_mkt_campaigns', 'crm_quotes'
];

let db = null;
let auth = null;
let _isWriting = false;
const _origSetItem = localStorage.setItem.bind(localStorage);
const _origGetItem = localStorage.getItem.bind(localStorage);

// ─── Firebase Başlat ─────────────────────────────────────────────────────────
async function initFirebase() {
  try {
    const app = initializeApp(firebaseConfig);
    db = getFirestore(app);
    auth = getAuth(app);
    console.log('[Firebase] ✅ Bağlantı kuruldu');

    auth.onAuthStateChanged(async (user) => {
      if (user) {
        console.log('[Firebase] 👤 Kullanıcı bağlandı:', user.email);
        
        const currentSession = sessionStorage.getItem('crm_user_session');
        // Oturum yoksa eşle ve yenile (Dashboard'u otomatik açar)
        if (!currentSession) {
          sessionStorage.setItem('crm_user_session', JSON.stringify({
            email: user.email,
            name: user.displayName || 'Google Kullanıcı',
            role: 'admin',
            picture: user.photoURL
          }));
          window.location.reload();
          return;
        }

        // Yetkilendirme sağlandıktan hemen sonra verileri çek!
        await pullFromCloud();
        startRealtimeListeners();
      } else {
        console.log('[Firebase] 👤 Kullanıcı oturum açmadı.');
      }
    });

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
async function pullFromCloud(force = false) {
  if (!db) return;
  setSyncStatus(true, force ? 'Buluttan zorla çekiliyor...' : 'Veriler alınıyor...');
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

        // force = true ise tarih kontrolü yapmadan üzerine yazar
        if (force || !localRaw || cloudTs > localTs) {
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
    if (force) alert('Tüm veriler buluttan başarıyla çekildi ve güncellendi!');
  } else if (force) {
    alert('Zaten tüm verileriniz güncel gözüküyor.');
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
      _isWriting = true;
      _origSetItem(key, JSON.stringify(cloudData));
      _origSetItem(key + '_ts', String(cloudTs));
      _isWriting = false;

      const activeEl = document.activeElement;
      const isTyping = activeEl && (activeEl.tagName === 'INPUT' || activeEl.tagName === 'TEXTAREA' || activeEl.isContentEditable);

      if (!isTyping) {
        // Kullanıcı yazı yazmıyorsa otomatik canlandır (Sonsuz döngü olmaz çünkü _ts güncel)
        window.location.reload();
      } else {
        setSyncStatus(true, 'Yeni veri alındı, yazmayı bitirince yenilenecek.');
        setTimeout(() => setSyncStatus(false), 2000);
      }
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
  // Manuel tıklandığında force = true yaparak zorunlu çekeriz
  await pullFromCloud(true);
  
  // Tablolardaki (in-memory) eski verilerin tamamen yenilenebilmesi için sayfayı reload et
  window.location.reload();
}

async function loginWithGoogle() {
  const provider = new GoogleAuthProvider();
  const isMobile = /iPhone|iPad|iPod|Android/i.test(navigator.userAgent);
  
  try {
    if (isMobile) {
      // Mobil cihazlarda popup engellemeyi aşmak için yönlendirme kullan
      await signInWithRedirect(auth, provider);
    } else {
      const result = await signInWithPopup(auth, provider);
      const user = result.user;
      
      sessionStorage.setItem('crm_user_session', JSON.stringify({
        email: user.email,
        name: user.displayName || 'Kullanıcı',
        role: 'admin',
        picture: user.photoURL
      }));

      alert(`Hoşgeldiniz, ${user.displayName}!`);
      window.location.reload(); 
    }
  } catch (error) {
    console.error('[Google Auth] Hata:', error.message);
    alert('Google ile giriş başarısız. Lütfen tekrar deneyin.');
  }
}

// Global erişim
window.initFirebase  = initFirebase;
window.syncNow       = syncNow;
window.pushToCloud   = pushToCloud;
window.forcePushAllToCloud = forcePushAllToCloud;
window.loginWithGoogle = loginWithGoogle;

export { initFirebase, syncNow, pushToCloud, forcePushAllToCloud, db };
