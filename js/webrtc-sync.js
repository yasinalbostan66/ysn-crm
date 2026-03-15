/* 
 * webrtc-sync.js - WebRTC P2P Direct Device Sync with PeerJS
 */

let peer = null;
let conn = null;
let myCode = '';
const PREFIX = 'YSNCRT-';

// Load PeerJS dynamically if not available
function loadPeerJS() {
  return new Promise((resolve, reject) => {
    if (typeof Peer !== 'undefined') return resolve();
    const script = document.createElement('script');
    script.src = 'https://unpkg.com/peerjs@1.5.2/dist/peerjs.min.js';
    script.onload = resolve;
    script.onerror = reject;
    document.head.appendChild(script);
  });
}

async function initWebRTC() {
  await loadPeerJS();
  
  // 4 Haneli rastgele kod üret
  const random = Math.floor(1000 + Math.random() * 9000);
  myCode = String(random);
  const peerId = PREFIX + myCode;

  peer = new Peer(peerId, {
    host: '0.peerjs.com',
    port: 443,
    secure: true,
    debug: 1
  });

  peer.on('open', (id) => {
    console.log('[WebRTC] 📡 Cihaz Kimliği:', id);
    const codeEl = document.getElementById('my-pair-code');
    if (codeEl) codeEl.innerText = myCode;
  });

  peer.on('connection', (connection) => {
    conn = connection;
    setupConnection();
  });

  peer.on('error', (err) => {
    console.warn('[WebRTC] ⚠️ Hata:', err.message);
  });
}

function connectToPeer() {
  const input = document.getElementById('target-pair-code');
  if (!input || !input.value) return alert('Lütfen kod girin!');
  const targetId = PREFIX + input.value.trim();

  if (!peer) return alert('Sistem başlatılamadı!');
  
  console.log('[WebRTC] 🔗 Bağlanılıyor:', targetId);
  conn = peer.connect(targetId);
  setupConnection();
}

function setupConnection() {
  if (!conn) return;

  conn.on('open', () => {
    console.log('[WebRTC] 🟢 Bağlantı Kuruldu!');
    alert('Cihazlar Birbirine Bağlandı! Veriler anlık akacak.');
    const modal = document.getElementById('pair-modal');
    if (modal) modal.style.display = 'none';

    // Bağlantı kurulduğu an tüm mevcut verileri birbirine gönder
    setTimeout(() => pushAllLocalToPeer(), 1000);
  });

  conn.on('data', (data) => {
    try {
      if (data.type === 'SYNC_ITEM') {
        _isWriting = true; // Loop preventer bypass
        localStorage.setItem(data.key, JSON.stringify(data.value));
        localStorage.setItem(data.key + '_ts', String(Date.now()));
        _isWriting = false;
        
        console.log(`[WebRTC] ⬇️ Alındı: ${data.key}`);
        if (typeof refreshApp === 'function') refreshApp();
      }
      if (data.type === 'SYNC_ALL') {
        const payload = data.data;
        Object.keys(payload).forEach(key => {
          localStorage.setItem(key, JSON.stringify(payload[key]));
          localStorage.setItem(key + '_ts', String(Date.now()));
        });
        if (typeof refreshApp === 'function') refreshApp();
      }
    } catch (e) { }
  });

  conn.on('close', () => {
    console.log('[WebRTC] 🔴 Bağlantı Kesildi');
  });
}

function pushAllLocalToPeer() {
  if (!conn || !conn.open) return;
  const SYNC_KEYS = [
    'crm_customer_data', 'crm_visits', 'crm_service_requests', 
    'crm_activities', 'crm_announcements', 'crm_users', 'crm_mkt_campaigns', 'crm_quotes'
  ];
  const payload = {};
  SYNC_KEYS.forEach(key => {
    const value = localStorage.getItem(key);
    if (value) {
      try { payload[key] = JSON.parse(value); } catch (e) { }
    }
  });
  conn.send({ type: 'SYNC_ALL', data: payload });
  console.log('[WebRTC] ⬆️ Tüm veriler eşlendi');
}

// Override SetItem wrapper to also stream WebRTC if connection open
const _origWebrtcSetItem = localStorage.setItem;
localStorage.setItem = function(key, value) {
  _origWebrtcSetItem.apply(this, arguments);
  
  const SYNC_KEYS = [
    'crm_customer_data', 'crm_visits', 'crm_service_requests', 
    'crm_activities', 'crm_announcements', 'crm_users', 'crm_mkt_campaigns', 'crm_quotes'
  ];

  // If connection is open, stream update immediately!
  if (conn && conn.open && SYNC_KEYS.includes(key) && !_isWriting) {
    try {
       const parsed = JSON.parse(value);
       conn.send({ type: 'SYNC_ITEM', key: key, value: parsed });
       console.log(`[WebRTC] ⬆️ Gönderildi: ${key}`);
    } catch(e){}
  }
};

window.connectToPeer = connectToPeer;
window.initWebRTC    = initWebRTC;
