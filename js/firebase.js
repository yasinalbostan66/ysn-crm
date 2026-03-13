/**
 * firebase.js - Firebase Firestore Cloud Sync
 * Tüm CRM verilerini buluta kaydeder, cihazlar arası senkronizasyon sağlar.
 */

import { initializeApp } from "https://www.gstatic.com/firebasejs/11.4.0/firebase-app.js";
import { getFirestore, doc, getDoc, setDoc, onSnapshot, collection, getDocs, writeBatch } from "https://www.gstatic.com/firebasejs/11.4.0/firebase-firestore.js";

const firebaseConfig = {
  apiKey: "AIzaSyBCgt5x8w1V1pviDWVb-QtddS_l9leY1Gw",
  authDomain: "ysn-crm.firebaseapp.com",
  projectId: "ysn-crm",
  storageBucket: "ysn-crm.firebasestorage.app",
  messagingSenderId: "243748644966",
  appId: "1:243748644966:web:e76483bca7ea18b50925a7"
};

const app = initializeApp(firebaseConfig);
const db = getFirestore(app);

/**
 * CRM veri anahtarları ve Firestore koleksiyon adları eşleşmesi
 */
const DATA_KEYS = {
  crm_customer_data: 'customers',
  crm_visits: 'visits',
  crm_service_requests: 'service_requests',
  crm_activities: 'activities',
  crm_announcements: 'announcements',
  crm_users: 'users'
};

/**
 * Firestore'a veri yaz (tek doküman olarak)
 */
async function cloudSet(key, data) {
  try {
    const ref = doc(db, 'crm_data', key);
    await setDoc(ref, { value: data, updatedAt: Date.now() });
  } catch (e) {
    console.warn('[Firebase] cloudSet hatası:', e.message);
  }
}

/**
 * Firestore'dan veri oku
 */
async function cloudGet(key) {
  try {
    const ref = doc(db, 'crm_data', key);
    const snap = await getDoc(ref);
    if (snap.exists()) {
      return snap.data().value;
    }
  } catch (e) {
    console.warn('[Firebase] cloudGet hatası:', e.message);
  }
  return null;
}

/**
 * localStorage.setItem'ı firebase ile senkronize eden wrapper
 */
const _origSetItem = localStorage.setItem.bind(localStorage);
const _origGetItem = localStorage.getItem.bind(localStorage);

function hybridSetItem(key, value) {
  // Her zaman localStorage'a yaz (offline destek)
  _origSetItem(key, value);
  
  // Sadece CRM veri anahtarları için buluta da yaz
  if (DATA_KEYS[key]) {
    try {
      const parsed = JSON.parse(value);
      cloudSet(key, parsed);
    } catch (e) {
      // JSON parse hatası - sadece localStorage'da kalır
    }
  }
}

/**
 * Buluttan yerel depolamaya senkronizasyon
 */
async function syncFromCloud() {
  console.log('[Firebase] Buluttan senkronizasyon başlıyor...');
  let synced = 0;
  
  for (const key of Object.keys(DATA_KEYS)) {
    try {
      const cloudData = await cloudGet(key);
      if (cloudData !== null && Array.isArray(cloudData) && cloudData.length > 0) {
        const localData = JSON.parse(_origGetItem(key) || '[]');
        
        // Bulut verisi daha güncel veya yerel veri boşsa, bulutu kullan
        if (cloudData.length >= localData.length) {
          _origSetItem(key, JSON.stringify(cloudData));
          console.log(`[Firebase] ${key}: ${cloudData.length} kayıt buluttan alındı`);
          synced++;
        }
      }
    } catch (e) {
      console.warn(`[Firebase] ${key} senkronizasyon hatası:`, e.message);
    }
  }
  
  console.log(`[Firebase] Senkronizasyon tamamlandı: ${synced} anahtar güncellendi`);
  return synced;
}

/**
 * Gerçek zamanlı değişiklik dinleyicisi
 */
function listenForChanges(onUpdate) {
  const ref = doc(db, 'crm_data', 'crm_customer_data');
  return onSnapshot(ref, (snap) => {
    if (snap.exists()) {
      const cloudData = snap.data().value;
      const localData = JSON.parse(_origGetItem('crm_customer_data') || '[]');
      
      // Sadece değer değiştiyse güncelle
      if (JSON.stringify(cloudData) !== JSON.stringify(localData)) {
        _origSetItem('crm_customer_data', JSON.stringify(cloudData));
        if (typeof onUpdate === 'function') onUpdate('crm_customer_data');
      }
    }
  });
}

/**
 * localStorage.setItem'ı override et
 */
localStorage.setItem = hybridSetItem;

/**
 * Başlatıcı - uygulama yüklendiğinde çalışır
 */
async function initFirebase() {
  // Önce buluttan senkronize et
  const syncedCount = await syncFromCloud();
  
  // Gerçek zamanlı dinleyiciyi başlat
  listenForChanges((key) => {
    console.log(`[Firebase] Gerçek zamanlı güncelleme: ${key}`);
    // Sayfayı yenile (hafif refresh)
    if (typeof refreshApp === 'function') {
      refreshApp();
    }
  });
  
  // Diğer veri anahtarları için de dinleyici ekle
  const keysToWatch = ['crm_visits', 'crm_service_requests', 'crm_activities', 'crm_announcements'];
  keysToWatch.forEach(key => {
    const ref = doc(db, 'crm_data', key);
    onSnapshot(ref, (snap) => {
      if (snap.exists()) {
        const cloudData = snap.data().value;
        const localData = JSON.parse(_origGetItem(key) || '[]');
        if (JSON.stringify(cloudData) !== JSON.stringify(localData)) {
          _origSetItem(key, JSON.stringify(cloudData));
          if (typeof refreshApp === 'function') refreshApp();
        }
      }
    });
  });

  return syncedCount;
}

// Global erişim için dışa aktar
window.initFirebase = initFirebase;
window.cloudSet = cloudSet;
window.cloudGet = cloudGet;
window.syncFromCloud = syncFromCloud;

export { initFirebase, cloudSet, cloudGet, syncFromCloud, db };
