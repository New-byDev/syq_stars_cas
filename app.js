/* ==================================================================
   ZOMBIXUP — вся логика. Хранение: Firebase Realtime Database.
   ================================================================== */

/* СЮДА ВСТАВИТЬ КОНФИГ FIREBASE */
const firebaseConfig = {
  apiKey: "AIzaSyB9uAa0NjkxMvjK0ZrGGHBtksWWRZA2cPs",
  authDomain: "syq-site.firebaseapp.com",
  databaseURL: "https://syq-site-default-rtdb.firebaseio.com",
  projectId: "syq-site",
  storageBucket: "syq-site.firebasestorage.app",
  messagingSenderId: "309704145783",
  appId: "1:309704145783:web:3d525163e0fbb1f7723f72",
  measurementId: "G-QV7MG6M9V4"
};

const ADMIN_IDS  = [8158896250];    // список ID админов
const ADMIN_CODE = 'admin123';      // вход по коду (в настройках)
const DEPOSIT_LINK = 'https://t.me/Siqyal';

const tg = window.Telegram && window.Telegram.WebApp ? window.Telegram.WebApp : null;
const tgUser = tg && tg.initDataUnsafe && tg.initDataUnsafe.user ? tg.initDataUnsafe.user : null;
const haptic = t => { try { if (tg) tg.HapticFeedback.impactOccurred(t); } catch(e){} };

/* Вне Telegram — постоянный ID вида L1234 */
const isTG = !!tgUser;
let WEB_LID = localStorage.getItem('zxLid') || '';
if (!isTG && !WEB_LID){
  WEB_LID = 'L' + Math.floor(1000 + Math.random()*9000);
  localStorage.setItem('zxLid', WEB_LID);
}
const MY_NAME = isTG
  ? (tgUser.username ? '@' + tgUser.username : (tgUser.first_name || 'Гость'))
  : 'Игрок ' + WEB_LID;
const MY_DISPLAY_ID = isTG ? (tgUser.id || 0) : WEB_LID;

/* ---------- ТЕКСТЫ ПО УМОЛЧАНИЮ (редактируются в админке) ---------- */
const DEF_TEXTS = {
  depositBtn: 'Пополнить баланс',
  depositInfo: 'Чтобы пополнить баланс свяжитесь с @Siqyal',
  gateTitle: 'Добро пожаловать!',
  gateSub: 'Подпишитесь на каналы, чтобы продолжить:',
  upgradeFail1: 'Увы!',
  upgradeFail2: 'В следующий раз повезёт!',
  modWait: 'Ожидайте ответа!',
  privacy: 'ZombixUP. Мы храним только ваш Telegram ID, ник, игровой прогресс и обращения в поддержку. Данные не передаются третьим лицам. Напишите в поддержку для удаления аккаунта.',
  about: 'ZombixUP — кейсы, апгрейдер и баттл-пасс. Валюта — золото (G).',
  faq: '1. Как пополнить баланс? — Свяжитесь с @Siqyal.\n2. Как работает апгрейдер? — Ставите предмет, выбираете множитель. Шансы зависят от RTP.\n3. Что такое осколки? — Даётся за открытие кейсов; ими повышаются уровни баттл-пасса.\n4. Пропал предмет? — Напишите в поддержку.'
};
let TEXTS = {...DEF_TEXTS};

/* ---------- ИКОНКИ (SVG вместо эмодзи) ---------- */
const IC = {
  home:'<path d="M3 10.5 12 3l9 7.5V21h-6v-6h-6v6H3z"/>',
  case:'<path d="M21 8l-9-5-9 5v8l9 5 9-5z"/><path d="M3 8l9 5 9-5M12 13v8"/>',
  upgrade:'<circle cx="12" cy="12" r="9"/><circle cx="12" cy="12" r="4.5"/>',
  rocket:'<path d="M12 2c3 2 4 6 4 9l2 3-3-1c-1 1-2 1.5-3 1.5S10 14 9 13l-3 1 2-3c0-3 1-7 4-9z"/><circle cx="12" cy="9" r="1.6"/><path d="M9 18c-1 2-1 3-3 4 0-2 0-3.5 1-5M15 18c1 2 1 3 3 4 0-2 0-3.5-1-5"/>',
  pass:'<path d="M4 8a2 2 0 0 1 2-2h12a2 2 0 0 1 2 2v2a2 2 0 0 0 0 4v2a2 2 0 0 1-2 2H6a2 2 0 0 1-2-2v-2a2 2 0 0 0 0-4z"/>',
  profile:'<circle cx="12" cy="8" r="4"/><path d="M4 21c0-4 3.6-6.5 8-6.5s8 2.5 8 6.5"/>',
  support:'<path d="M4 13a8 8 0 0 1 16 0"/><rect x="3" y="13" width="4" height="6" rx="2"/><rect x="17" y="13" width="4" height="6" rx="2"/>',
  gear:'<circle cx="12" cy="12" r="3.2"/><path d="M12 2.8v3M12 18.2v3M4.1 7l2.6 1.5M17.3 15.5l2.6 1.5M4.1 17l2.6-1.5M17.3 8.5l2.6-1.5"/>',
  admin:'<path d="M12 3l7 3v6c0 4.5-3 7.5-7 9-4-1.5-7-4.5-7-9V6z"/>',
  gold:'<circle cx="12" cy="12" r="8" fill="currentColor" stroke="none"/>',
  gem:'<path d="M7 3h10l4 6-9 12L3 9z" fill="currentColor" stroke="none"/>',
  box:'<rect x="4" y="8" width="16" height="12" rx="2"/><path d="M4 12h16M12 8v12M8 8l2-4h4l2 4"/>',
  gift:'<rect x="3" y="9" width="18" height="12" rx="2"/><path d="M12 9v12M3 13h18M7 9a3 3 0 0 1 5-2 3 3 0 0 1 5 2"/>',
  star:'<path d="M12 3l2.7 5.7 6.3.8-4.6 4.3 1.2 6.2L12 17l-5.6 3 1.2-6.2L3 9.5l6.3-.8z" fill="currentColor" stroke="none"/>',
  trophy:'<path d="M8 21h8M12 17v4M7 4h10v6a5 5 0 0 1-10 0zM17 5h3v2a3 3 0 0 1-3 3M7 5H4v2a3 3 0 0 0 3 3"/>',
  chart:'<path d="M4 20h16M7 16v-5M12 16V7M17 16v-8"/>',
  chat:'<path d="M21 12a8 8 0 0 1-8 8H4l2-3a8 8 0 1 1 15-5z"/>',
  user:'<circle cx="12" cy="8" r="4"/><path d="M4 21c0-4 3.6-6.5 8-6.5s8 2.5 8 6.5"/>',
  users:'<circle cx="9" cy="8" r="4"/><path d="M2 21c0-4 3.2-6.5 7-6.5s7 2.5 7 6.5M17 8a4 4 0 0 1 0 8M22 21c0-3.5-2.5-5.8-5.5-6.4"/>',
  check:'<path d="M4 12.5 9.5 18 20 6"/>',
  download:'<path d="M12 3v12M7 10l5 5 5-5M4 21h16"/>',
  copy:'<rect x="8" y="8" width="12" height="12" rx="2"/><path d="M4 16V4h12"/>',
  clock:'<circle cx="12" cy="12" r="9"/><path d="M12 7v5l3.5 2"/>',
  megaphone:'<path d="M3 10v4l4 1 10 5V4L7 9z"/><path d="M19 9a4 4 0 0 1 0 6"/>',
  ban:'<circle cx="12" cy="12" r="9"/><path d="M5.6 5.6l12.8 12.8"/>',
  edit:'<path d="M4 20h4L20 8l-4-4L4 16zM14 6l4 4"/>',
  trash:'<path d="M4 7h16M9 7V4h6v3M6 7l1 13h10l1-13"/>',
  link:'<path d="M9 15l6-6M8.5 10.5 6 13a4 4 0 0 0 5.5 5.5l2-2M15.5 13.5 18 11a4 4 0 0 0-5.5-5.5l-2 2"/>',
  info:'<circle cx="12" cy="12" r="9"/><path d="M12 11v5M12 8h.01"/>',
  sparkles:'<path d="M12 3l1.8 4.7L18.5 9.5l-4.7 1.8L12 16l-1.8-4.7L5.5 9.5l4.7-1.8zM19 15l.9 2.1L22 18l-2.1.9L19 21l-.9-2.1L16 18l2.1-.9z" fill="currentColor" stroke="none"/>',
  coins:'<circle cx="8" cy="12" r="5"/><path d="M14.5 7.5A5 5 0 1 1 16 17M8 10v4M6 12h4"/>',
  wallet:'<rect x="3" y="6" width="18" height="14" rx="2"/><path d="M3 10h18M16 15h2"/>'
};
const ic = (name, cls) => '<span class="' + (cls || 'ic-svg') + '"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">' + (IC[name] || '') + '</svg></span>';
function hydrateIcons(root){
  (root || document).querySelectorAll('[data-ic]').forEach(el => {
    if (el.dataset.icDone) return;
    el.innerHTML = ic(el.dataset.ic) + (el.dataset.keep ? el.innerHTML : '');
    el.dataset.icDone = '1';
  });
}
const EMO_MAP = {'⭐':'star','🏆':'trophy','🎁':'gift','📦':'box','💰':'coins','🎫':'ticket','💎':'gem','🔥':'fire','⏰':'clock','⏳':'clock','✅':'check','⛔':'ban','📢':'megaphone','👤':'user','🎨':'palette','🍀':'sparkles'};
function textIcons(str){
  return String(str || '').replace(/[\u2B00-\u2BFF\u2600-\u27BF]\uFE0F?/g, ch =>
    EMO_MAP[ch] ? ic(EMO_MAP[ch]) : ch);
}

/* ---------- СОСТОЯНИЕ ---------- */
const DEF = {
  theme:'light', accent:'', admin:false, gold:0, items:[], cases:[],
  lastFree:{}, hidden:false, fx:true, notif:true, invCat:'prize',
  gatePassed:false, welcomeDone:false, zxId:'',
  pass:{level:1, shards:0, claimed:{}, plus:false, questsDay:'', quests:[]},
  stats:{opens:0, spends:0, upgradeWins:0, itemsGot:0},
  refs:{count:0, tickets:0}, refCode:''
};
let S = {...DEF, pass:{...DEF.pass, claimed:{}}, stats:{...DEF.stats}, refs:{...DEF.refs}};
try {
  const ui = JSON.parse(localStorage.getItem('zxUI') || '{}');
  if (ui.theme) S.theme = ui.theme;
  if (ui.accent) S.accent = ui.accent;
  if (ui.fx !== undefined) S.fx = ui.fx;
} catch(e){}
const saveUI = () => localStorage.setItem('zxUI', JSON.stringify({theme:S.theme, accent:S.accent, fx:S.fx}));

let USER_REF = null, MY_KEY = '', MY_TG_ID = isTG ? tgUser.id : 0, MY_UID = '';
let cloudReady = false, spinning = false, refTracked = false, wdChatId = null;
let curLogDay = null, curCase = null, openCount = 1, fastOpen = false;
let upgStakes = [], upgMult = null, upgRunning = false;
let annIdx = 0, annTimer = null, annTouchX = 0;
const UPG_MULTS = [2, 4, 8, 10];

const $ = id => document.getElementById(id);
const esc = s => String(s ?? '').replace(/[&<>"]/g, c => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;'}[c]));
const fmtLeft = ms => {
  const s = Math.max(0, Math.ceil(ms/1000));
  if (s >= 3600) return Math.floor(s/3600) + 'ч ' + Math.floor(s%3600/60) + 'м';
  if (s >= 60) return Math.floor(s/60) + 'м';
  return s + ' с';
};
const nowHM = () => new Date().toLocaleTimeString('ru-RU', {hour:'2-digit', minute:'2-digit', second:'2-digit'});
const nowDay = () => new Date().toISOString().slice(0,10);
function toast(msg){
  const t = document.createElement('div');
  t.className = 'toast'; t.textContent = msg;
  $('toasts').appendChild(t);
  setTimeout(() => t.remove(), 4000);
}
function saveFile(name, content){
  const blob = new Blob([content], {type:'text/plain;charset=utf-8'});
  const a = document.createElement('a');
  a.href = URL.createObjectURL(blob);
  a.download = name;
  a.click();
  URL.revokeObjectURL(a.href);
  logAction('admin', 'Скачан файл ' + name);
}

/* ---------- ЖУРНАЛ ДЕЙСТВИЙ ---------- */
function logAction(type, text){
  const rec = {type, text, ts: Date.now(), time: nowHM()};
  try {
    const key = 'zxlogs_' + nowDay();
    const arr = JSON.parse(localStorage.getItem(key) || '[]');
    arr.push(rec);
    localStorage.setItem(key, JSON.stringify(arr.slice(-500)));
  } catch(e){}
  if (cloudReady) db.ref('logs/' + nowDay()).push(rec).catch(()=>{});
}

/* ---------- RTP-БАНК: расход не превышает доход ---------- */
const RTP = () => Math.min(100, Math.max(0, Number(S.economy && S.economy.rtp) || 95));
function bankBudget(){
  const e = S.economy || {rtp:95, paidIn:0, paidOut:0};
  return (Number(e.paidIn) || 0) * RTP() / 100 - (Number(e.paidOut) || 0);
}
async function bankPayIn(amount){
  if (!cloudReady) return;
  try { await db.ref('economy/paidIn').transaction(v => (Number(v) || 0) + amount); } catch(e){}
}
async function bankPayOut(amount){
  if (!cloudReady || !amount) return;
  try { await db.ref('economy/paidOut').transaction(v => (Number(v) || 0) + amount); } catch(e){}
}
function prizeValue(p){
  if (!p) return 0;
  if (p.type === 'stars' || p.type === 'gold') return Number(p.value) || 0;
  if (p.type === 'item'){
    const it = findItem(p.value);
    return it ? (Number(it.value) || 0) : 0;
  }
  return 0;
}
function souvenirPrize(){
  const pool = (S.itemDB || []).filter(i => i.type === 'souvenir');
  if (pool.length){
    const it = pool[Math.floor(Math.random()*pool.length)];
    return {name: it.name, type:'item', value: it.id};
  }
  return {name:'Сувенир', type:'souvenir'};
}
function pickPrize(c){
  const budget = bankBudget();
  const pool = (c.prizes || []).filter(p => prizeValue(p) <= Math.max(budget, 1));
  if (!pool.length) return souvenirPrize();
  const total = pool.reduce((a,p) => a + (Number(p.chance)||0), 0);
  let r = Math.random() * total;
  for (const p of pool){ r -= (Number(p.chance)||0); if (r <= 0) return p; }
  return pool[pool.length-1];
}
/* честные шансы апгрейдера из RTP */
function chanceFor(mult){ return Math.min(99, RTP() / mult); }

/* ---------- PUSH В FIREBASE ---------- */
function pushUser(){
  if (!USER_REF) return;
  USER_REF.set({
    name: MY_NAME, tgId: MY_DISPLAY_ID, uid: MY_UID,
    username: tgUser && tgUser.username ? tgUser.username : '',
    photo: tgUser && tgUser.photo_url ? tgUser.photo_url : '',
    gold: S.gold, items: S.items, lastFree: S.lastFree,
    hidden: !!S.hidden, totalSpent: Number(S.totalSpent) || 0,
    gatePassed: !!S.gatePassed, welcomeDone: !!S.welcomeDone,
    zxId: S.zxId || '', refCode: S.refCode || '', refs: S.refs || {},
    pass: S.pass, stats: S.stats,
    online: true, onlineAt: Date.now()
  }).catch(e => setCloudStatus('Ошибка записи: ' + (e.code || e.message)));
  if (MY_UID) db.ref('online/' + MY_UID).set({at: Date.now()}).catch(()=>{});
}
setInterval(() => { if (cloudReady && MY_UID) db.ref('online/' + MY_UID).set({at: Date.now()}).catch(()=>{}); }, 30000);
function setCloudStatus(t){
  const el = $('cloudStatus'); if (el) el.textContent = t;
  const lt = $('ldText'); if (lt) lt.textContent = t;
}

/* ---------- ИНИЦИАЛИЗАЦИЯ FIREBASE ---------- */
async function initCloud(){
  try{
    await firebase.auth().signInAnonymously();
    const uid = firebase.auth().currentUser.uid;
    MY_UID = uid;
    /* ключ аккаунта: в Telegram — tg<id>, вне — webL<число> */
    MY_KEY = isTG ? 'tg' + tgUser.id : 'web' + WEB_LID;
    USER_REF = db.ref('users/' + MY_KEY);

    const snap = await USER_REF.get();
    if (snap.exists()){
      const d = snap.val();
      S.gold = Number(d.gold) || 0;
      S.items = Array.isArray(d.items) ? d.items : [];
      S.lastFree = d.lastFree || {};
      S.hidden = !!d.hidden;
      S.totalSpent = Number(d.totalSpent) || 0;
      S.gatePassed = !!d.gatePassed;
      S.welcomeDone = !!d.welcomeDone;
      S.zxId = d.zxId || '';
      S.refCode = d.refCode || '';
      S.refs = d.refs || {count:0, tickets:0};
      S.pass = {level:1, shards:0, claimed:{}, plus:false, questsDay:'', quests:[], ...(d.pass||{})};
      S.stats = {...DEF.stats, ...(d.stats||{})};
      /* админка восстанавливается после перезахода */
      if (d.admin || localStorage.getItem('zxAdmin') === '1' || (isTG && ADMIN_IDS.includes(tgUser.id))) S.admin = true;
      if (d.banned){
        $('bannedScreen').style.display = 'flex';
        $('banReason').textContent = d.banReason || '';
        return;
      }
      logAction('auth', 'Вход пользователя ' + MY_NAME);
    } else {
      const p = new URLSearchParams(location.search);
      const ref = p.get('ref');
      if (ref) S.refCode = ref;
      S.zxId = isTG ? String(tgUser.id) : WEB_LID;   /* ID по умолчанию */
      if (!S.refCode) S.refCode = makeRefCode();
      pushUser();
      logAction('auth', 'Новый пользователь ' + MY_NAME);
      /* счёт рефереру: +1 реф, +1 билет */
      if (S.refCode){
        try {
          const all = await db.ref('users').get();
          const users = all.exists() ? all.val() : {};
          for (const [k, u] of Object.entries(users)){
            if (u.refCode === S.refCode && k !== MY_KEY){
              db.ref('users/' + k + '/refs/count').transaction(v => (Number(v)||0) + 1);
              db.ref('users/' + k + '/refs/tickets').transaction(v => (Number(v)||0) + 1);
              break;
            }
          }
        } catch(e){}
      }
    }
    refTracked = !!S.refCode;
    saveUI();

    const cs = await db.ref('cases').get();
    if (cs.exists() && cs.val()) S.cases = Object.values(cs.val());
    const it = await db.ref('items').get();
    S.itemDB = it.exists() ? Object.values(it.val()) : [];
    const tx = await db.ref('texts').get();
    if (tx.exists()) TEXTS = {...DEF_TEXTS, ...tx.val()};
    const pc = await db.ref('passConfig').get();
    S.passCfg = pc.exists() ? pc.val() : {};
    S.economy = (await db.ref('economy').get()).val() || {rtp:95, paidIn:0, paidOut:0, shardRate:10};
    cloudReady = true;
    setCloudStatus('Данные синхронизированы');

    /* подписки */
    db.ref('cases').on('value', s => { S.cases = s.exists() ? Object.values(s.val()) : []; renderCases(); });
    db.ref('caseStock').on('value', s => { S.stockLive = s.val() || {}; renderCases(); });
    db.ref('items').on('value', s => { S.itemDB = s.exists() ? Object.values(s.val()) : []; renderAll(); });
    db.ref('texts').on('value', s => { TEXTS = {...DEF_TEXTS, ...(s.val()||{})}; applyTexts(); });
    db.ref('passConfig').on('value', s => { S.passCfg = s.val() || {}; renderPass(); });
    db.ref('economy').on('value', s => { S.economy = s.val() || {rtp:95, paidIn:0, paidOut:0, shardRate:10}; });
    db.ref('feed').on('value', s => { S.feed = s.val() || {}; renderFeed(); });
    db.ref('users').on('value', s => { S.usersAll = s.val() || {}; renderTop(); renderProfile(); });
    db.ref('announcements').on('value', s => { S.annSlides = s.exists() ? Object.values(s.val()) : []; renderAnn(); });
    db.ref('channels').on('value', s => { S.channels = s.exists() ? Object.values(s.val()).map((v,k)=>({...v,_k:k})) : []; renderGate(); });
    db.ref('gateEnabled').on('value', s => { S.gateEnabled = !!s.val(); renderGate(); });
    db.ref('modCalls').on('value', s => { S.modCalls = s.exists() ? Object.entries(s.val()).map(([k,v])=>({...v,_id:k})) : []; renderAdmin(); });
    db.ref('withdrawChats').on('value', s => { S.withdrawChats = s.val() || {}; renderWithdraw(); });
    db.ref('tickets').on('value', s => {
      const v = s.val() || {};
      S.tickets = Object.entries(v).map(([k, t]) => ({...t, _id: k}));
      checkSupportNotif(); renderTickets(); renderAdmin();
    });
    db.ref('online').on('value', s => { S.onlineRaw = s.val() || {}; renderOnline(); });
    USER_REF.on('value', s => {
      if (!s.exists()) return;
      const d = s.val();
      S.gold = Number(d.gold) || 0;
      S.items = Array.isArray(d.items) ? d.items : [];
      S.lastFree = d.lastFree || {};
      S.hidden = !!d.hidden;
      S.totalSpent = Number(d.totalSpent) || 0;
      S.zxId = d.zxId || '';
      S.refs = d.refs || {count:0, tickets:0};
      S.pass = {level:1, shards:0, claimed:{}, plus:false, questsDay:'', quests:[], ...(d.pass||{})};
      S.stats = {...DEF.stats, ...(d.stats||{})};
      renderAll();
    });

    if (isTG && ADMIN_IDS.includes(tgUser.id)){
      S.admin = true;
      $('adminMenuItem').style.display = '';
    }
    initDots();
    logAction('cloud', 'Подключение к Firebase установлено');
  } catch(e){
    setCloudStatus('Firebase недоступен: ' + (e.code || e.message));
    logAction('error', 'Firebase недоступен: ' + (e.code || e.message));
  }
  const ld = $('loader'); if (ld) ld.remove();
  renderAll();
}

/* ---------- НАВИГАЦИЯ ---------- */
document.getElementById('menuBtn').addEventListener('click', () => {
  document.body.classList.toggle('menu-open'); haptic('light');
});
function goPage(p){
  document.querySelectorAll('.page').forEach(pg => pg.classList.toggle('on', pg.id === 'page-' + p));
  document.querySelectorAll('.menu-item').forEach(b => b.classList.toggle('active', b.dataset.page === p));
  document.body.classList.remove('menu-open');
  window.scrollTo({top:0, behavior:'smooth'});
  renderAll();
}
document.querySelectorAll('.menu-item').forEach(btn => btn.addEventListener('click', () => goPage(btn.dataset.page)));
document.addEventListener('keydown', e => { if (e.key === 'Escape') document.body.classList.remove('menu-open'); });

function applyTexts(){
  $('depositBtn').textContent = TEXTS.depositBtn;
  $('gateTitle').textContent = TEXTS.gateTitle;
  $('gateSub').textContent = TEXTS.gateSub;
  $('faqBox').textContent = TEXTS.faq;
  $('info-privacy').textContent = TEXTS.privacy;
  $('info-about').textContent = TEXTS.about;
}

/* ---------- ЧИПЫ В ШАПКЕ: БАЛАНС И ОНЛАЙН ---------- */
function ensureHeaderChips(){
  const h = $('appHeader'); if (!h) return;
  if (!$('goldChip')){
    const s = document.createElement('span');
    s.className = 'gold-chip'; s.id = 'goldChip';
    s.innerHTML = ic('gold') + '<b id="goldChipVal">0</b>';
    h.appendChild(s);
  }
  if (!$('onlineChip')){
    const o = document.createElement('span');
    o.className = 'online-chip'; o.id = 'onlineChip';
    o.innerHTML = '<span class="on-dot"></span><span id="onlineChipVal">…</span>';
    h.insertBefore(o, $('menuBtn'));
  }
}
function renderHeaderChips(){
  ensureHeaderChips();
  const gv = $('goldChipVal'); if (gv) gv.textContent = S.gold || 0;
}
function renderOnline(){
  const raw = Object.values(S.onlineRaw || {}).filter(u => Date.now() - (u.at||0) < 90000).length;
  const shown = Math.max(1, raw * 2 + Math.floor(Math.random()*11));
  const el = $('onlineCounter');
  if (el) el.innerHTML = '<div class="online-big">' + ic('users') + ' ' + shown + ' онлайн</div><div class="online-note">игроков сейчас в приложении</div>';
  const chip = $('onlineChipVal'); if (chip) chip.textContent = shown;
}

/* ---------- ГЕЙТ ПОДПИСОК ---------- */
function renderGate(){
  if (!cloudReady || S.gatePassed || !S.gateEnabled || isTG === false && !S.gateEnabled){ $('gateOverlay').style.display = 'none'; return; }
  if (!S.gateEnabled){ $('gateOverlay').style.display = 'none'; return; }
  if (S.gatePassed){ $('gateOverlay').style.display = 'none'; return; }
  $('gateChannels').innerHTML = (S.channels || []).map(ch =>
    '<a class="a-btn" href="' + esc(ch.url) + '" target="_blank">' + ic('megaphone') + ' ' + esc(ch.name) + '</a>'
  ).join('') || '<p class="muted">Каналы ещё не заданы.</p>';
  $('gateOverlay').style.display = 'flex';
}
$('gateGo').addEventListener('click', () => {
  S.gatePassed = true; pushUser(); renderGate();
});

/* ---------- ПОПОЛНЕНИЕ ---------- */
function openDeposit(){
  alert(TEXTS.depositInfo);
  if (tg && tg.openTelegramLink) tg.openTelegramLink(DEPOSIT_LINK);
  else window.open(DEPOSIT_LINK, '_blank');
  logAction('deposit', 'Открыто окно пополнения');
}

/* ---------- ФОН: ПАДАЮЩИЕ ТОЧКИ СО СТРЕЙФОМ ---------- */
function initDots(){
  const cv = $('bgFx'); if (!cv) return;
  const ctx = cv.getContext('2d');
  let W, H, dots = [];
  const resize = () => { W = cv.width = innerWidth; H = cv.height = innerHeight; };
  resize(); addEventListener('resize', resize);
  const N = 40;
  for (let i = 0; i < N; i++) dots.push({
    x: Math.random()*W, y: Math.random()*H,
    r: Math.random()*2 + 1,
    vy: Math.random()*1.2 + .4,
    vx: (Math.random()-.5)*1.2,
    drift: Math.random()*2*Math.PI,
    a: Math.random()*.5 + .2
  });
  let t = 0;
  (function loop(){
    if (S.fx){
      ctx.clearRect(0,0,W,H);
      const col = getComputedStyle(document.body).getPropertyValue('--muted').trim() || '#999';
      t += .01;
      dots.forEach(d => {
        d.y += d.vy;
        d.x += d.vx + Math.sin(t + d.drift)*.4;   /* стрейф */
        if (d.y > H+10){ d.y = -10; d.x = Math.random()*W; }
        if (d.x < -10) d.x = W+10; if (d.x > W+10) d.x = -10;
        ctx.globalAlpha = d.a;
        ctx.fillStyle = col;
        ctx.beginPath(); ctx.arc(d.x, d.y, d.r, 0, 7); ctx.fill();
      });
      ctx.globalAlpha = 1;
    }
    requestAnimationFrame(loop);
  })();
}

/* ---------- КАРТОЧКА РЕДКОСТИ ПО ШАНСУ ---------- */
function rarityOf(ch){
  if (ch <= 2)  return 'mith';
  if (ch <= 10) return 'legend';
  if (ch <= 25) return 'epic';
  if (ch <= 50) return 'rare';
  return 'common';
}

/* ---------- ГЛАВНАЯ: КЕЙСЫ ---------- */
function renderCases(){
  const grid = $('casesGrid');
  if (!grid) return;
  grid.innerHTML = S.cases.map(c => {
    const ended = c.endsAt && Date.now() > c.endsAt;
    const stock = S.stockLive ? S.stockLive[c.id] : undefined;
    const needRef = Number(c.minRefs) || 0;
    return '<div class="tile">' +
      '<div class="tile-img">' + (c.photo ? '<img src="' + esc(c.photo) + '" alt="">' : ic('gift')) +
        (stock !== undefined && stock !== null ? '<span class="badge-stock">Осталось ' + stock + '</span>' : '') +
        (c.endsAt && !ended ? '<span class="badge-time">' + ic('clock') + '</span>' : '') +
      '</div>' +
      '<div class="tile-name">' + esc(c.name) + '</div>' +
      (needRef ? '<div class="tile-status">Нужно рефералов: ' + needRef + '</div>' : '') +
      '<div class="tile-status" id="cd-' + c.id + '"></div>' +
      '<button class="btn" onclick="openCase(' + c.id + ')" ' + (ended ? 'disabled' : '') + '>Открыть</button>' +
    '</div>';
  }).join('') || '<p class="muted" style="text-align:center;padding:20px">Кейсы скоро появятся</p>';
  tickFree();
}
function tickFree(){
  S.cases.forEach(c => {
    const el = $('cd-' + c.id); if (!el) return;
    if (c.endsAt && Date.now() > c.endsAt){ el.textContent = 'Время вышло'; return; }
    const left = (S.lastFree[c.id] || 0) + (c.cd || 0) * 1000 - Date.now();
    el.textContent = left > 0 ? 'Через ' + fmtLeft(left)
      : (c.endsAt ? 'Закроется через ' + fmtLeft(c.endsAt - Date.now()) : 'Доступен');
  });
  setTimeout(tickFree, 500);
}

/* ---------- КАРУСЕЛЬ ОБЪЯВЛЕНИЙ ---------- */
function renderAnn(){
  const slot = $('annSlot'); if (!slot) return;
  const arr = S.annSlides || [];
  if (!arr.length){ slot.innerHTML = ''; return; }
  slot.innerHTML = '<div class="ann-carousel" id="annCar"><div class="ann-track" id="annTrack">' +
    arr.map(s =>
      '<div class="ann-slide">' +
      (s.title ? '<b>' + esc(s.title) + '</b>' : '') +
      (s.photo ? '<img src="' + esc(s.photo) + '" alt="">' : '') +
      (s.text ? '<p>' + esc(s.text) + '</p>' : '') +
      ((s.buttons && s.buttons.length)
        ? '<div class="ann-buttons">' + s.buttons.filter(b => b && b.label).map(b =>
            '<a href="' + esc(b.url || '#') + '" target="_blank">' + esc(b.label) + '</a>').join('') + '</div>' : '') +
      '</div>'
    ).join('') +
    '</div><div class="ann-dots">' + arr.map((_,i) =>
      '<span class="ann-dot' + (i===annIdx?' on':'') + '" onclick="annGo(' + i + ')"></span>').join('') + '</div></div>';
  annGo(annIdx, true);
  const car = $('annCar');
  car.addEventListener('touchstart', e => { annTouchX = e.touches[0].clientX; }, {passive:true});
  car.addEventListener('touchend', e => {
    const dx = e.changedTouches[0].clientX - annTouchX;
    if (Math.abs(dx) > 40) annGo(annIdx + (dx < 0 ? 1 : -1));
  }, {passive:true});
}
function annGo(i, silent){
  const track = $('annTrack'); if (!track) return;
  const n = (S.annSlides || []).length; if (!n) return;
  annIdx = ((i % n) + n) % n;
  track.style.transform = 'translateX(-' + annIdx * 100 + '%)';
  document.querySelectorAll('.ann-dot').forEach((d, k) => d.classList.toggle('on', k === annIdx));
  if (silent) return;
  clearInterval(annTimer);
  annTimer = setInterval(() => annGo(annIdx + 1, true), 5000);
}

/* ---------- ЛАЙВБОРД ---------- */
function renderFeed(){
  const arr = Object.values(S.feed || {}).sort((a,b) => (b.ts||0) - (a.ts||0)).slice(0, 15);
  $('feedList').innerHTML = arr.length ? arr.map(f =>
    '<div class="feed-line"><span class="f-ico">' + (f.photo
      ? '<img class="top-ava" src="' + esc(f.photo) + '" alt="">'
      : ic('star')) + '</span>' +
    '<span class="f-text"><b>' + esc(f.name || 'Гость') + '</b> — ' + esc(f.prize || '') +
    ' <span class="muted">в «' + esc(f.caseName || '') + '»</span></span>' +
    '<span class="f-time">' + esc(f.time || '') + '</span></div>'
  ).join('') : '<p class="muted">Пока никто не выигрывал — будьте первым!</p>';
}
function pushFeed(prize, c){
  if (!cloudReady) return;
  db.ref('feed').push({
    name: MY_NAME, photo: tgUser && tgUser.photo_url ? tgUser.photo_url : '',
    prize: prize.name, caseName: c.name, ts: Date.now(), time: nowHM()
  }).then(() => db.ref('feed').limitToLast(30).once('value', s => {
    const keep = s.val() || {};
    if (Object.keys(keep).length > 30) db.ref('feed/' + Object.keys(keep)[0]).remove();
  }));
}

/* ---------- МОДАЛКА КЕЙСА: ТАБЛИЦА ПРИЗОВ + МУЛЬТИ-ОТКРЫТИЕ ---------- */
function openCase(id){
  curCase = S.cases.find(c => String(c.id) === String(id));
  if (!curCase) return;
  const need = Number(curCase.minRefs) || 0;
  if (need && (Number(S.refs.count) || 0) < need){
    toast('Нужно ' + need + ' рефералов для этого кейса');
    return;
  }
  openCount = 1;
  $('modalTitle').textContent = curCase.name;
  $('modalDesc').textContent = curCase.desc || '';
  const prizes = curCase.prizes || [];
  const total = prizes.reduce((a,p) => a + (Number(p.chance)||0), 0) || 1;
  $('prizeList').innerHTML = prizes.map(p => {
    const ch = Math.round((Number(p.chance)||0) / total * 1000) / 10;
    const r = rarityOf(Number(p.chance)||0);
    const item = p.type === 'item' ? findItem(p.value) : null;
    return '<div class="pt-cell" data-r="' + r + '">' +
      '<div class="pt-ico">' + (item && item.photo
        ? '<img src="' + esc(item.photo) + '" alt="">'
        : (item ? ic(EMO_MAP[item.ico] || 'box') : ic('coins'))) + '</div>' +
      '<div class="pt-name">' + esc(p.name) + '</div>' +
      '<div class="pt-chance">' + ch + '%</div>' +
    '</div>';
  }).join('') +
  '<div class="pt-legend">' +
    '<span><i style="background:var(--border)"></i>частый</span>' +
    '<span><i style="background:#4aa3ff"></i>редкий</span>' +
    '<span><i style="background:#a86bff"></i>эпик</span>' +
    '<span><i style="background:#ffb64d"></i>легенда</span>' +
    '<span><i style="background:#ff5f7a"></i>миф</span>' +
  '</div>' +
  '<div class="cnt-row"><span>Количество:</span>' +
    [1,2,3,4,5].map(n => '<button class="cnt-btn' + (n===1?' sel':'') + '" onclick="setCnt(' + n + ', this)">' + n + '</button>').join('') +
    '<span class="cnt-price" id="cntPrice"></span></div>' +
  '<div class="row"><span>Быстрое открытие</span><label class="switch"><input type="checkbox" id="fastToggle"><span class="slider"></span></label></div>';
  updateCntPrice();
  $('overlay').classList.add('on');
  $('caseMenu').style.display = '';
  $('caseSpin').style.display = 'none';
}
function setCnt(n, btn){
  openCount = n;
  document.querySelectorAll('.cnt-btn').forEach(b => b.classList.remove('sel'));
  btn.classList.add('sel');
  updateCntPrice();
}
function updateCntPrice(){
  const maxCnt = Math.min(5, Number(S.economy && S.economy.maxCount) || 5);
  openCount = Math.min(openCount, maxCnt);
  const free = Date.now() - (S.lastFree[curCase.id] || 0) >= (curCase.cd || 0) * 1000;
  const freeSlots = free ? 1 : 0;
  const price = (Number(curCase.price) || 0) * Math.max(0, openCount - freeSlots);
  $('cntPrice').innerHTML = price ? (price + ' G ' + ic('gold')) : 'Бесплатно';
}
$('openBtn').addEventListener('click', () => {
  if (spinning) return;
  const ft = $('fastToggle');
  fastOpen = ft ? ft.checked : false;
  startSpin();
});
$('closeMenuBtn').addEventListener('click', () => $('overlay').classList.remove('on'));
$('closeSpinBtn').addEventListener('click', () => $('overlay').classList.remove('on'));

async function startSpin(){
  const c = curCase; if (!c) return;
  const maxCnt = Math.min(5, Number(S.economy && S.economy.maxCount) || 5);
  openCount = Math.min(openCount, maxCnt);
  const free = Date.now() - (S.lastFree[c.id] || 0) >= (c.cd || 0) * 1000;
  const freeSlots = free ? 1 : 0;
  const price = (Number(c.price) || 0) * Math.max(0, openCount - freeSlots);
  if (S.gold < price){ toast('Недостаточно золота'); return; }
  if (price){
    S.gold -= price;
    S.totalSpent = (Number(S.totalSpent) || 0) + price;
    await bankPayIn(price);
    trackRefSpend(price);
  }
  if (free) S.lastFree[c.id] = Date.now();
  S.stats.spends = (Number(S.stats.spends) || 0) + price;
  const shardRate = Number(S.economy && S.economy.shardRate) || 10;
  S.pass.shards = (Number(S.pass.shards) || 0) + openCount * shardRate;
  pushUser();

  spinning = true;
  $('caseMenu').style.display = 'none';
  $('caseSpin').style.display = '';
  $('closeSpinBtn').style.display = 'none';
  logAction('case', 'Открытие кейса «' + c.name + '» ×' + openCount + (price ? ' за ' + price + ' G' : ' бесплатно'));

  const results = [];
  for (let i = 0; i < openCount; i++){
    const prize = pickPrize(c);
    await applyPrize(prize, c);
    results.push(prize);
  }

  if (fastOpen){
    $('spinResult').innerHTML = results.map(r => textIcons('• ' + esc(r.name))).join('<br>');
    finishSpin(results, c);
  } else {
    let i = 0;
    const next = () => {
      if (i >= results.length){ finishSpin(results, c); return; }
      $('spinResult').innerHTML = textIcons('Выпало: <b>' + esc(results[i].name) + '</b>');
      buildStrip(c, () => { i++; next(); });
    };
    next();
  }
}
function finishSpin(results, c){
  spinning = false;
  $('closeSpinBtn').style.display = '';
  results.forEach(r => {
    pushFeed(r, c);
    logAction('prize', 'Приз из «' + c.name + '»: ' + r.name + (r.type === 'stars' ? ' (' + r.value + ' G)' : ''));
  });
}
async function applyPrize(prize, c){
  S.stats.opens = (Number(S.stats.opens) || 0) + 1;
  if (prize.type === 'stars' || prize.type === 'gold'){
    S.gold = (Number(S.gold) || 0) + (Number(prize.value) || 0);
    await bankPayOut(Number(prize.value) || 0);
  } else if (prize.type === 'item'){
    S.items.push({id: prize.value, name: prize.name, ts: Date.now()});
    const it = findItem(prize.value);
    const v = it ? (Number(it.value) || 0) : 0;
    if (v) await bankPayOut(v);
    S.stats.itemsGot = (Number(S.stats.itemsGot) || 0) + 1;
  } else if (prize.type === 'souvenir'){
    S.items.push({id: 'souv:' + Date.now(), name: prize.name, type:'souvenir', ts: Date.now()});
  }
  pushUser();
}
function buildStrip(c, done){
  const strip = $('strip');
  const cellHTML = p => {
    const item = p.type === 'item' ? findItem(p.value) : null;
    return '<div class="prize-cell">' +
      (item && item.photo ? '<img class="p-photo" src="' + esc(item.photo) + '" alt="">'
        : '<span class="p-ico">' + (item ? ic(EMO_MAP[item.ico] || 'box') : ic('coins')) + '</span>') +
      esc(p.name) + '</div>';
  };
  const items = [];
  for (let i = 0; i < 40; i++) items.push(cellHTML(pickPrize(c)));
  items.push('<div class="prize-cell hl">' + cellHTML(curPrizeHold).replace(/^<div class="prize-cell">|<\/div>$/g,'') + '</div>');
  for (let i = 0; i < 10; i++) items.push(cellHTML(pickPrize(c)));
  strip.innerHTML = items.join('');
  const cell = 96 + 8;
  const target = (items.length - 11) * cell + 48 - strip.parentElement.offsetWidth/2 + cell/2;
  strip.style.transition = 'none';
  strip.style.transform = 'translateX(0)';
  requestAnimationFrame(() => requestAnimationFrame(() => {
    strip.style.transition = 'transform 2.2s cubic-bezier(.2,.8,.3,1)';
    strip.style.transform = 'translateX(-' + target + 'px)';
  }));
  haptic('medium');
  setTimeout(done, 2300);
}
let curPrizeHold = null;

/* ---------- ИНВЕНТАРЬ ---------- */
function setInvCat(cat, btn){
  S.invCat = cat;
  document.querySelectorAll('.cat-btn').forEach(b => b.classList.remove('active'));
  btn.classList.add('active');
  renderInv();
}
function findItem(id){
  return (S.itemDB || []).find(i => String(i.id) === String(id));
}
function renderInv(){
  const arr = (S.items || []).filter(i => S.invCat === 'souvenir' ? (i.type === 'souvenir') : (i.type !== 'souvenir'));
  const defCat = S.invCat || 'prize';
  $('invGrid').innerHTML = arr.map((it, idx) => {
    const item = it.id && !String(it.id).startsWith('souv:') ? findItem(it.id) : null;
    return '<div class="inv-card">' +
      (item && item.photo ? '<img class="p-photo" src="' + esc(item.photo) + '" alt="">'
        : '<div class="p-ico">' + (item ? ic(EMO_MAP[item.ico] || 'box') : ic('gift')) + '</div>') +
      '<b>' + esc(it.name) + '</b>' +
      (item && item.value ? '<div class="muted">' + item.value + ' G</div>' : '') +
      (defCat === 'prize'
        ? '<button class="sell-btn" onclick="sellItem(' + idx + ')">Продать' + (item && item.value ? ' за ' + Math.floor(item.value*.7) + ' G' : '') + '</button>' +
          '<button class="upg-btn' + (upgStakes.includes(idx) ? ' sel' : '') + '" onclick="toggleStake(' + idx + ', this)">В апгрейдер</button>'
        : '') +
    '</div>';
  }).join('');
  $('invEmpty').style.display = arr.length ? 'none' : '';
}
async function sellItem(idx){
  const it = S.items[idx]; if (!it) return;
  const item = it.id && !String(it.id).startsWith('souv:') ? findItem(it.id) : null;
  const v = item ? Math.floor((Number(item.value) || 0) * .7) : 0;
  S.items.splice(idx, 1);
  S.gold = (Number(S.gold) || 0) + v;
  pushUser();
  logAction('sell', 'Продажа предмета «' + it.name + '» за ' + v + ' G');
  toast(v ? 'Продано за ' + v + ' G' : 'Продано');
  renderInv();
}

/* ---------- АПГРЕЙДЕР: РАКЕТА ПО ТАНГЕНСОИДЕ ---------- */
function toggleStake(idx, btn){
  const i = upgStakes.indexOf(idx);
  if (i >= 0) upgStakes.splice(i, 1);
  else {
    if (upgStakes.length >= 6){ toast('Максимум 6 предметов'); return; }
    upgStakes.push(idx);
  }
  btn && btn.classList.toggle('sel');
  renderUpg();
}
function renderUpg(){
  const stakeList = $('upgStakes');
  const arr = (S.items || []).filter(i => i.type !== 'souvenir');
  stakeList.innerHTML = arr.map((it, idx) => {
    const item = it.id && !String(it.id).startsWith('souv:') ? findItem(it.id) : null;
    const v = item ? (Number(item.value) || 0) : 0;
    return '<div class="stake-line' + (upgStakes.includes(idx) ? ' sel' : '') + '">' +
      (item && item.photo ? '<img src="' + esc(item.photo) + '" alt="">' : '') +
      '<span>' + esc(it.name) + '</span>' +
      '<span class="st-val">' + v + ' G ' + ic('gold') + '</span>' +
      '<button class="btn' + (upgStakes.includes(idx) ? '' : ' ghost') + '" style="width:auto;padding:7px 14px;margin:0;font-size:13px" onclick="toggleStake(' + idx + ', this)">' +
      (upgStakes.includes(idx) ? 'Убрать' : 'Выбрать') + '</button>' +
    '</div>';
  }).join('') || '<p class="muted">Нет предметов — откройте кейс.</p>';

  const sum = upgStakes.reduce((a, i) => {
    const it = S.items[i];
    const item = it ? findItem(it.id) : null;
    return a + (item ? (Number(item.value) || 0) : 0);
  }, 0);

  if (upgStakes.length){
    $('upgMultCard').style.display = '';
    $('upgMults').innerHTML = UPG_MULTS.map(m =>
      '<button class="cat-btn' + (upgMult === m ? ' active' : '') + '" onclick="setUpgMult(' + m + ')">' + m + 'x — ' + chanceFor(m).toFixed(1) + '%</button>'
    ).join('');
    if (upgMult){
      const win = sum * upgMult;
      const targets = (S.itemDB || []).filter(i => (Number(i.value) || 0) <= win && (Number(i.value) || 0) > sum);
      $('upgTargets').innerHTML = '<div class="stat"><span>Сумма ставки</span><b>' + sum + ' G</b></div>' +
        '<div class="stat"><span>Потенциальный выигрыш</span><b>' + win + ' G</b></div>' +
        (targets.length
          ? '<div class="a-label">Цели</div>' + targets.slice(0,6).map(t =>
              '<div class="stake-line"><span>' + (t.photo ? '<img src="' + esc(t.photo) + '" alt="">' : '') + esc(t.name) + '</span><span class="st-val">' + t.value + ' G ' + ic('gold') + '</span></div>'
            ).join('')
          : '<p class="muted">Нет подходящих предметов — выигрыш придёт золотом.</p>');
      $('upgRunCard').style.display = '';
      $('upgInfo').textContent = 'Шанс победы: ' + chanceFor(upgMult).toFixed(1) + '% • Мистери (x5) появляется раз в ~10 прокрутов';
    }
  } else {
    $('upgMultCard').style.display = 'none';
    $('upgRunCard').style.display = 'none';
  }
}
function setUpgMult(m){ upgMult = m; renderUpg(); }

/* математика тангенсоиды: y(p) = 140 − 120·tan(kp)/tan(k), k = 0.42π */
const TRAJ_K = Math.PI * .42;
function trajY(p){ return 140 - 120 * Math.tan(TRAJ_K * p) / Math.tan(TRAJ_K); }
function multAt(p, M){ return 1 + (M - 1) * Math.tan(TRAJ_K * p) / Math.tan(TRAJ_K); }

function buildRocketStage(){
  $('upgRocketWrap').innerHTML =
    '<div class="upg-rocket-stage" id="upgStage">' +
      '<span id="upgMultLabel">1.00x</span>' +
      '<svg viewBox="0 0 300 170" preserveAspectRatio="xMidYMax meet">' +
        '<path class="traj-path" id="trajPath" d=""/>' +
        '<g id="rocketG" transform="translate(10,140)">' +
          '<g id="rocketBody">' +
            '<path class="rocket-body" d="M0,-6 L14,-3 Q22,0 14,3 L0,6 Q3,0 0,-6z"/>' +
            '<path class="rocket-fin" d="M0,-6 L-6,-11 L-2,-4z"/>' +
            '<path class="rocket-fin" d="M0,6 L-6,11 L-2,4z"/>' +
            '<circle class="rocket-window" cx="8" cy="0" r="2.6"/>' +
            '<path class="rocket-flame" d="M-2,-3 Q-10,0 -2,3 Q-5,0 -2,-3z"/>' +
          '</g>' +
        '</g>' +
      '</svg>' +
    '</div>';
  let d = '';
  for (let i = 0; i <= 20; i++){
    const p = i/20;
    d += (i ? 'L' : 'M') + (10 + p * 270).toFixed(1) + ',' + trajY(p).toFixed(1);
  }
  const tp = $('trajPath'); if (tp) tp.setAttribute('d', d);
}
function rocketPose(p, stage){
  const g = $('rocketG'); if (!g) return;
  const x = 10 + p * 270, y = trajY(p);
  const dy = 120 * (TRAJ_K / Math.tan(TRAJ_K)) * (1 / Math.pow(Math.cos(TRAJ_K*p), 2));
  const dx = 270 / 20;
  const ang = Math.max(-60, Math.min(60, Math.atan2(-dy, dx) * 180/Math.PI));
  g.setAttribute('transform', 'translate(' + x.toFixed(1) + ',' + y.toFixed(1) + ') rotate(' + (stage === 'crash' ? ang + p*720 : ang) + ')');
  const lbl = $('upgMultLabel');
  if (lbl && upgMult) lbl.textContent = multAt(p, upgMult).toFixed(2) + 'x';
}
async function runUpgrade(){
  if (upgRunning || !upgStakes.length || !upgMult) return;
  const sum = upgStakes.reduce((a, i) => {
    const it = S.items[i];
    const item = it ? findItem(it.id) : null;
    return a + (item ? (Number(item.value) || 0) : 0);
  }, 0);
  if (!sum){ toast('Ставка пуста'); return; }
  upgRunning = true;
  $('upgGoBtn').disabled = true;
  $('upgResult').textContent = '';
  buildRocketStage();
  await bankPayIn(sum);
  S.totalSpent = (Number(S.totalSpent) || 0) + sum;
  S.stats.spends = (Number(S.stats.spends) || 0) + sum;
  trackRefSpend(sum);
  logAction('upgrade', 'Ставка апгрейдера: ' + upgStakes.length + ' предмет(ов) на ' + sum + ' G, множитель x' + upgMult);

  const chance = chanceFor(upgMult) / 100;
  const mystery = Math.random() < 0.01;
  const win = mystery ? true : Math.random() < chance;

  const dur = 3200;
  const t0 = performance.now();
  const crashed = !win;
  const stopAt = crashed ? (0.35 + Math.random()*0.5) : 1;
  await new Promise(res => {
    (function frame(now){
      const p = Math.min(1, (now - t0) / dur);
      if (crashed && p >= stopAt){
        rocketPose(stopAt, 'crash');
        $('upgStage').classList.add('crashed');
        setTimeout(res, 600);
        return;
      }
      rocketPose(Math.min(p, 1), 'fly');
      if (p < 1) requestAnimationFrame(frame);
      else res();
    })(t0);
  });

  if (win){
    const payout = mystery ? sum * 5 : sum * upgMult;
    S.gold = (Number(S.gold) || 0) + payout;
    await bankPayOut(payout);
    S.stats.upgradeWins = (Number(S.stats.upgradeWins) || 0) + 1;
    upgStakes.sort((a,b) => b - a).forEach(i => S.items.splice(i, 1));
    upgStakes = [];
    pushUser();
    $('upgResult').innerHTML = textIcons('Победа! +' + payout + ' G' + (mystery ? ' (Мистери x5!)' : ''));
    logAction('upgrade', 'ПОБЕДА: +' + payout + ' G' + (mystery ? ', Мистери x5' : ''));
  } else {
    upgStakes.sort((a,b) => b - a).forEach(i => S.items.splice(i, 1));
    upgStakes = [];
    pushUser();
    $('upgResult').innerHTML = textIcons(TEXTS.upgradeFail1 + ' ' + TEXTS.upgradeFail2);
    logAction('upgrade', 'Крах: потеряно ' + sum + ' G');
  }
  haptic(win ? 'heavy' : 'light');
  upgMult = null;
  upgRunning = false;
  $('upgGoBtn').disabled = false;
  renderUpg(); renderInv();
}

/* ---------- БАТТЛ-ПАС: ПОЛНОСТЬЮ НАСТРАИВАЕМЫЙ ---------- */
function passCfg(){ return S.passCfg || {}; }
function passMax(){ return Math.min(100, Number(passCfg().maxLevel) || 30); }
function levelPrice(lvl){
  const cfg = passCfg().levelPrices || [];
  for (const r of cfg) if (lvl <= (Number(r.to) || 0)) return Number(r.price) || 0;
  return 500;
}
function questTemplates(){
  return (passCfg().questTemplates && passCfg().questTemplates.length) ? passCfg().questTemplates : [
    {metric:'opens', title:'Открыть {t} кейсов', base:5, perLvl:2, shards:40},
    {metric:'spends', title:'Потратить {t} золота', base:300, perLvl:100, shards:60},
    {metric:'upgradeWins', title:'Победить в апгрейдере {t} раз', base:1, perLvl:.4, shards:80},
    {metric:'itemsGot', title:'Получить {t} предметов', base:2, perLvl:1, shards:40}
  ];
}
function refreshQuests(){
  const today = nowDay();
  if (S.pass.questsDay === today && (S.pass.quests || []).length) return;
  const lvl = Number(S.pass.level) || 1;
  const pool = questTemplates();
  const count = Math.min(pool.length, Number(passCfg().questCount) || 3);
  const shuffled = pool.slice().sort(() => Math.random() - .5).slice(0, count);
  S.pass.quests = shuffled.map((tpl, i) => {
    const target = Math.max(1, Math.round((Number(tpl.base) || 1) + (Number(tpl.perLvl) || 0) * (lvl - 1)));
    return {
      id: today + '_' + i,
      title: (tpl.title || 'Задание').replace('{t}', target),
      metric: tpl.metric, target, shards: Math.round((Number(tpl.shards) || 40) * (1 + (lvl-1) * .05)),
      progress: 0, done: false, claimed: false
    };
  });
  S.pass.questsDay = today;
  pushUser();
  logAction('pass', 'Новые ежедневные квесты (уровень ' + lvl + ')');
}
function levelReward(lvl){
  const arr = passCfg().levelRewards;
  if (Array.isArray(arr) && arr[lvl - 1]) return arr[lvl - 1];
  return Math.round(50 * (1 + (lvl - 1) * .15));
}
function renderPass(){
  refreshQuests();
  const p = S.pass;
  const need = levelReward(p.level);
  $('passLevel').textContent = (p.level || 1) + ' / ' + passMax();
  $('passShards').textContent = p.shards || 0;
  $('passNeed').textContent = p.level >= passMax() ? 'Максимум' : need + ' осколков';
  $('passUpBtn').disabled = p.level >= passMax();

  const plusPrice = Number(passCfg().plusPrice) || 1000;
  $('passPlusBox').innerHTML = p.plus
    ? '<span class="passplus-badge">' + ic('sparkles') + ' Пасс+ активен</span><p class="muted" style="margin-top:6px">Награды уровней удваиваются.</p>'
    : '<span class="passplus-badge">' + ic('sparkles') + ' Баттл-пасс+</span><p class="muted" style="margin-top:6px">Откройте Пасс+ за ' + plusPrice + ' G — награды уровней удвоятся.</p>' +
      '<button class="btn" onclick="buyPassPlus()">Открыть за ' + plusPrice + ' G</button>';

  const st = S.stats;
  const prog = m => ({opens: st.opens, spends: st.spends, upgradeWins: st.upgradeWins, itemsGot: st.itemsGot}[m] || 0);
  $('questList').innerHTML = (p.quests || []).map(q => {
    const done = (prog(q.metric) || 0) >= q.target;
    return '<div class="pass-row' + (done ? ' quest-done' : '') + '">' +
      '<span class="q-chip' + (done ? ' done' : '') + '">' + (done ? 'Готово' : 'В процессе') + '</span>' +
      '<span style="flex:1">' + esc(q.title) + '</span>' +
      '<span class="pv">+' + q.shards + ' ' + ic('gem') + '</span>' +
    '</div><div class="q-bar"><div class="q-fill" style="width:' + Math.min(100, (prog(q.metric)||0)/q.target*100) + '%"></div></div>';
  }).join('');

  const dbl = p.plus ? 2 : 1;
  $('passRewards').innerHTML = Array.from({length: passMax()}, (_, i) => i + 1).map(lvl2 => {
    const r = levelReward(lvl2) * dbl;
    const got = (p.claimed && p.claimed[lvl2]);
    return '<div class="pass-row' + (got ? ' quest-done' : '') + '">' +
      '<span>Уровень ' + lvl2 + '</span>' +
      '<span class="pv">+' + r + ' G ' + ic('gold') + '</span>' +
      (got ? '<span class="q-chip done">Получено</span>' : '') +
    '</div>';
  }).join('');
}
async function passLevelUp(){
  const p = S.pass;
  if (p.level >= passMax()) return;
  const need = levelReward(p.level);
  if ((Number(p.shards) || 0) < need){ toast('Нужно ещё ' + (need - p.shards) + ' осколков'); return; }
  p.shards -= need;
  p.level += 1;
  p.claimed = p.claimed || {};
  const dbl = p.plus ? 2 : 1;
  const reward = levelReward(p.level) * dbl;
  S.gold = (Number(S.gold) || 0) + reward;
  await bankPayOut(reward);
  pushUser();
  logAction('pass', 'Уровень пасса повышен до ' + p.level + ', награда ' + reward + ' G');
  toast('Уровень ' + p.level + '! +' + reward + ' G');
  renderPass();
}
async function buyPassPlus(){
  const price = Number(passCfg().plusPrice) || 1000;
  if (S.pass.plus) return;
  if (S.gold < price){ toast('Недостаточно золота'); return; }
  S.gold -= price;
  S.totalSpent = (Number(S.totalSpent) || 0) + price;
  S.pass.plus = true;
  await bankPayIn(price);
  trackRefSpend(price);
  pushUser();
  logAction('pass', 'Куплен Баттл-пасс+ за ' + price + ' G');
  toast('Пасс+ активен!');
  renderPass();
}
async function buyLevel(){
  const p = S.pass;
  if (p.level >= passMax()) return;
  const price = levelPrice(p.level);
  if (S.gold < price){ toast('Недостаточно золота: нужно ' + price + ' G'); return; }
  S.gold -= price;
  S.totalSpent = (Number(S.totalSpent) || 0) + price;
  await bankPayIn(price);
  trackRefSpend(price);
  p.level += 1;
  p.claimed = p.claimed || {};
  const dbl = p.plus ? 2 : 1;
  const reward = levelReward(p.level) * dbl;
  S.gold = (Number(S.gold) || 0) + reward;
  await bankPayOut(reward);
  pushUser();
  logAction('pass', 'Уровень куплен за ' + price + ' G, выдано ' + reward + ' G');
  toast('Уровень ' + p.level + '!');
  renderPass();
}

/* ---------- РЕФЕРАЛЫ: БИЛЕТЫ ---------- */
function makeRefCode(){
  return 'ZX' + Math.random().toString(36).slice(2, 8).toUpperCase();
}
function trackRefSpend(amount){
  if (!refTracked || !S.refCode || !cloudReady) return;
  db.ref('refSpend').push({code: S.refCode, amount, ts: Date.now()}).catch(()=>{});
  /* +1 билет рефероводу за каждые 100 G трат реферала */
  const users = S.usersAll || {};
  for (const [k, u] of Object.entries(users)){
    if (u.refCode === S.refCode && k !== MY_KEY){
      const tickets = Math.floor(amount / 100);
      if (tickets > 0) db.ref('users/' + k + '/refs/tickets').transaction(v => (Number(v)||0) + tickets).catch(()=>{});
      break;
    }
  }
}

/* ---------- ВЫВОД СРЕДСТВ: ЧАТ С МОДЕРАТОРОМ ---------- */
function openWithdraw(){
  if (!cloudReady){ toast('Нет соединения'); return; }
  if (!S.zxId){ toast('Сначала укажите Zombix ID в профиле'); goPage('profile'); return; }
  const mine = Object.entries(S.withdrawChats || {}).find(([,c]) => c.userKey === MY_KEY);
  if (mine){
    wdChatId = mine[0];
    renderWithdraw();
    goPage('profile');
    return;
  }
  const ref = db.ref('withdrawChats').push();
  ref.set({
    userKey: MY_KEY, name: MY_NAME, tgId: MY_DISPLAY_ID, zxId: S.zxId,
    status: 'open', created: Date.now(),
    messages: [{from:'user', text:'Заявка на вывод. Zombix ID: ' + S.zxId + '. Баланс: ' + S.gold + ' G', ts: Date.now()}]
  }).then(() => { wdChatId = ref.key; renderWithdraw(); });
  logAction('withdraw', 'Создана заявка на вывод, Zombix ID: ' + S.zxId);
}
function renderWithdraw(){
  const box = $('withdrawBox'); if (!box) return;
  const chat = wdChatId ? (S.withdrawChats || {})[wdChatId] : null;
  if (!chat){ box.innerHTML = ''; return; }
  box.innerHTML = '<div class="ticket"><div class="t-head"><b>Чат вывода</b><span class="t-badge ' + (chat.status === 'closed' ? 'closed' : 'open') + '">' + (chat.status === 'closed' ? 'Закрыт' : 'Активен') + '</span></div>' +
    '<div class="chat" id="wdMsgs">' + (chat.messages || []).map(m =>
      '<div class="msg ' + (m.from === 'user' ? 'user' : 'admin') + '">' +
      '<div class="m-head"><span>' + (m.from === 'user' ? 'Вы' : 'Модератор') + '</span>' +
      '<span class="m-date">' + new Date(m.ts).toLocaleString('ru-RU') + '</span></div>' +
      '<div class="m-text">' + esc(m.text) + '</div></div>'
    ).join('') + '</div>' +
    (chat.status !== 'closed'
      ? '<div class="chat-input"><input class="a-input" id="wdInput" placeholder="Сообщение...">' +
        '<button class="a-btn" onclick="wdSend()">Отправить</button></div>'
      : '');
  const ch = $('wdMsgs'); if (ch) ch.scrollTop = ch.scrollHeight;
}
function wdSend(){
  const inp = $('wdInput'); if (!inp || !wdChatId) return;
  const text = inp.value.trim(); if (!text) return;
  db.ref('withdrawChats/' + wdChatId + '/messages').push({from:'user', text, ts: Date.now()});
  inp.value = '';
}

/* ---------- ПОДДЕРЖКА ---------- */
function toggleFaq(){
  const b = $('faqBox');
  b.style.display = b.style.display === 'none' ? '' : 'none';
}
function callModerator(){
  if (!cloudReady){ toast('Нет соединения'); return; }
  db.ref('modCalls').push({name: MY_NAME, tgId: MY_DISPLAY_ID, ts: Date.now(), status:'new'});
  $('modWait').style.display = '';
  logAction('support', 'Вызван модератор');
  toast('Модератор вызван!');
}
function createTicket(){
  if (!cloudReady){ toast('Нет соединения'); return; }
  const subject = prompt('Тема обращения:');
  if (!subject) return;
  const text = prompt('Опишите проблему:');
  if (!text) return;
  db.ref('tickets').push({
    userKey: MY_KEY, name: MY_NAME, tgId: MY_DISPLAY_ID,
    subject, text, status: 'open', ts: Date.now()
  });
  logAction('support', 'Создано обращение: ' + subject);
  toast('Обращение отправлено — ответ появится в разделе');
}
function renderTickets(){
  const mine = (S.tickets || []).filter(t => t.userKey === MY_KEY);
  $('ticketPanel').innerHTML = mine.length ? mine.map(t =>
    '<div class="ticket"><div class="t-head"><b>' + esc(t.subject || 'Обращение') + '</b>' +
    '<span class="t-badge ' + (t.status === 'closed' ? 'closed' : 'open') + '">' + (t.status === 'closed' ? 'Закрыт' : 'Открыт') + '</span></div>' +
    '<p>' + esc(t.text || '') + '</p>' +
    (t.reply ? '<p style="margin-top:6px"><b>Ответ:</b> ' + esc(t.reply) + '</p>' : '') +
    '</div>'
  ).join('') : '<p class="muted">Обращений нет.</p>';
}
function checkSupportNotif(){
  if (!S.notif) return;
  const mine = (S.tickets || []).filter(t => t.userKey === MY_KEY && t.reply && !t.seenByUser);
  if (mine.length){
    toast('Модератор ответил на ваше обращение!');
    mine.forEach(t => db.ref('tickets/' + t._id + '/seenByUser').set(true).catch(()=>{}));
  }
}

/* ---------- ПРОФИЛЬ: АВАТАР, ID, РЕФЕРАЛЫ, ОФОРМЛЕНИЕ ---------- */
function saveZxId(){
  const v = ($('zxIdInput') && $('zxIdInput').value.trim()) || ($('zxIdInput2') && $('zxIdInput2').value.trim()) || '';
  if (!v){ toast('Введите ID'); return; }
  S.zxId = v;
  pushUser();
  logAction('profile', 'Обновлён Zombix ID: ' + v);
  toast('ID сохранён');
}
function copyRef(){
  const code = S.refCode || '—';
  navigator.clipboard.writeText(location.origin + location.pathname + '?ref=' + code)
    .then(() => toast('Ссылка скопирована'))
    .catch(() => toast('Код: ' + code));
}
const ACCENTS = ['', '#4aa3ff', '#a86bff', '#4cd964', '#ffb64d', '#ff5f7a', '#00c9b7'];
function applyAccent(){
  if (S.accent) document.documentElement.style.setProperty('--accent', S.accent);
  else document.documentElement.style.removeProperty('--accent');
}
function renderProfile(){
  $('profName').textContent = MY_NAME;
  $('profUsername').textContent = tgUser && tgUser.username ? '@' + tgUser.username : '';
  $('profTgId').textContent = isTG ? 'Telegram ID: ' + MY_TG_ID : 'ID: ' + WEB_LID;
  const ava = $('profAvatar');
  if (tgUser && tgUser.photo_url){
    ava.src = tgUser.photo_url; ava.style.display = ''; ava.className = 'prof-ava';
  } else {
    ava.style.display = 'none';
    if (!ava.nextElementSibling || !ava.nextElementSibling.classList.contains('prof-ava-ph')){
      const ph = document.createElement('div');
      ph.className = 'prof-ava prof-ava-ph';
      ph.innerHTML = ic('user');
      ava.after(ph);
    }
  }
  const users = Object.values(S.usersAll || {}).filter(u => !u.hidden);
  users.sort((a,b) => (Number(b.gold)||0) - (Number(a.gold)||0));
  const rank = users.findIndex(u => u.tgId === MY_DISPLAY_ID) + 1;
  $('profRank').textContent = rank ? '#' + rank : '—';
  $('profSpent').textContent = (S.totalSpent || 0) + ' G';
  $('statGold').textContent = S.gold || 0;
  $('statShards').textContent = S.pass.shards || 0;
  $('statTickets').textContent = S.refs.tickets || 0;
  $('statItems').textContent = (S.items || []).length;
  $('refCodeOut').textContent = S.refCode || '—';
  $('refCount').textContent = S.refs.count || 0;
  $('refTickets').textContent = S.refs.tickets || 0;
  $('zxIdInput').value = S.zxId || '';
  $('zxIdInput2').value = S.zxId || '';
  $('profThemeToggle').checked = S.theme === 'dark';
  $('profFxToggle').checked = !!S.fx;
  $('accRow').innerHTML = ACCENTS.map(c =>
    '<button class="swatch' + (S.accent === c ? ' sel' : '') + '" style="--sw:' + (c || 'var(--accent)') + '" onclick="setAccent(\'' + c + '\')"></button>'
  ).join('');
  $('hideToggle').checked = !!S.hidden;
  renderWithdraw();
}
function setAccent(c){
  S.accent = c; saveUI(); applyAccent(); renderProfile();
}
$('profThemeToggle').addEventListener('change', e => { S.theme = e.target.checked ? 'dark' : 'light'; applyTheme(); saveUI(); });
$('profFxToggle').addEventListener('change', e => { S.fx = e.target.checked; document.body.classList.toggle('no-fx', !S.fx); saveUI(); });
$('hideToggle').addEventListener('change', e => { S.hidden = e.target.checked; pushUser(); });
function applyTheme(){
  document.body.dataset.theme = S.theme;
  $('themeToggle').checked = S.theme === 'dark';
}
$('themeToggle').addEventListener('change', e => { S.theme = e.target.checked ? 'dark' : 'light'; applyTheme(); saveUI(); });
$('fxToggle').addEventListener('change', e => { S.fx = e.target.checked; document.body.classList.toggle('no-fx', !S.fx); saveUI(); });
$('notifToggle').addEventListener('change', e => { S.notif = e.target.checked; });

/* ---------- ТОП ИГРОКОВ ---------- */
function renderTop(){
  const users = Object.values(S.usersAll || {}).filter(u => !u.hidden);
  users.sort((a,b) => (Number(b.gold)||0) - (Number(a.gold)||0));
  $('topList').innerHTML = users.slice(0, 10).map((u, i) =>
    '<div class="top-line">' +
    '<span class="t-rank">#' + (i+1) + '</span>' +
    (u.photo ? '<img class="top-ava" src="' + esc(u.photo) + '" alt="">' : '<span class="top-ava ph">' + ic('user') + '</span>') +
    '<span class="t-name">' + esc(u.name || 'Гость') + '</span>' +
    (u.zxId ? '<span class="t-id">ID: ' + esc(u.zxId) + '</span>' : '') +
    '<span class="t-val">' + (Number(u.gold) || 0) + ' G</span>' +
    '</div>'
  ).join('') || '<p class="muted">Пока никого.</p>';
}

/* ---------- ПРИВЕТСТВЕННАЯ ПРОКРУТКА (первый вход, 100% сувенир) ---------- */
function maybeWelcome(){
  if (S.welcomeDone || !cloudReady) return;
  if (S.gateEnabled && !S.gatePassed) return;
  const pool = (S.itemDB || []).filter(i => i.type === 'souvenir');
  const pick = pool.length ? pool[Math.floor(Math.random()*pool.length)] : null;
  const prizeName = pick ? pick.name : 'Сувенир новичка';
  S.welcomeDone = true;
  S.items.push(pick ? {id: pick.id, name: pick.name, type:'souvenir', ts: Date.now()}
                    : {id: 'souv:' + Date.now(), name: prizeName, type:'souvenir', ts: Date.now()});
  pushUser();
  toast('Подарок новичка: ' + prizeName + '!');
  logAction('welcome', 'Приветственный сувенир: ' + prizeName);
}

/* ---------- ИНФО И СБРОС ---------- */
function toggleInfo(which){
  const el = $('info-' + which);
  el.style.display = el.style.display === 'none' ? '' : 'none';
}
$('resetBtn').addEventListener('click', () => {
  if (!confirm('Сбросить весь прогресс?')) return;
  S.gold = 0; S.items = []; S.lastFree = {};
  S.pass = {level:1, shards:0, claimed:{}, plus:false, questsDay:'', quests:[]};
  S.stats = {...DEF.stats};
  S.welcomeDone = false;
  pushUser();
  logAction('reset', 'Сброс прогресса пользователем');
  toast('Прогресс сброшен');
  renderAll();
});

/* ---------- АДМИН-ПАНЕЛЬ ---------- */
function tryAdminUnlock(){
  const inp = $('adminCodeInput');
  const v = inp ? inp.value : '';
  if (v === ADMIN_CODE){
    S.admin = true;
    localStorage.setItem('zxAdmin', '1');
    if (USER_REF) db.ref('users/' + MY_KEY + '/admin').set(true).catch(()=>{});
    $('adminMenuItem').style.display = '';
    logAction('admin', 'Вход в админку по коду');
    toast('Админка открыта');
    goPage('admin');
  } else {
    toast('Неверный код');
    logAction('admin', 'Неверная попытка входа по коду');
  }
}
function renderAdmin(){
  const panel = $('adminPanel'); if (!panel) return;
  if (!S.admin){
    panel.innerHTML = '<div class="card"><b>Админ-панель</b><p class="muted">Нет доступа. Активируйте админку по коду в настройках.</p></div>';
    return;
  }
  const e = S.economy || {rtp:95, paidIn:0, paidOut:0, shardRate:10};
  const budget = (Number(e.paidIn) || 0) * RTP()/100 - (Number(e.paidOut) || 0);
  panel.innerHTML =
  '<details class="a-sec" open><summary>' + ic('chart') + ' Экономика</summary>' +
    '<div class="stat"><span>RTP %</span><b>' + RTP() + '%</b></div>' +
    '<div class="stat"><span>Доход (взносы)</span><b>' + (Number(e.paidIn)||0).toFixed(1) + ' G</b></div>' +
    '<div class="stat"><span>Расход (выплаты)</span><b>' + (Number(e.paidOut)||0).toFixed(1) + ' G</b></div>' +
    '<div class="stat"><span>Бюджет выплат</span><b>' + budget.toFixed(1) + ' G</b></div>' +
    '<label class="a-label">RTP (макс 100)</label><input class="a-input" id="eRtp" type="number" value="' + RTP() + '" min="0" max="100">' +
    '<label class="a-label">Осколков за кейс</label><input class="a-input" id="eShard" type="number" value="' + (Number(e.shardRate)||10) + '">' +
    '<label class="a-label">Макс. кейсов за раз (1-5)</label><input class="a-input" id="eMaxCnt" type="number" value="' + (Number(e.maxCount)||5) + '" min="1" max="5">' +
    '<button class="a-btn" onclick="saveEconomy()">Сохранить</button>' +
  '</details>' +

  '<details class="a-sec"><summary>' + ic('megaphone') + ' Объявления (карусель)</summary>' +
    '<p class="a-hint">Каждый слайд с новой строки. Формат: Заголовок | текст | фото URL | кнопка: Подпись | URL. Слайды разделяются строкой ===</p>' +
    '<textarea class="a-input" id="annEditor" placeholder="Заголовок | Текст | https://фото | кнопка: Перейти | https://ссылка"></textarea>' +
    '<button class="a-btn" onclick="saveAnnouncements()">Сохранить</button>' +
  '</details>' +

  '<details class="a-sec"><summary>' + ic('pass') + ' Баттл-пасс (полная настройка)</summary>' +
    '<label class="a-label">Макс. уровень</label><input class="a-input" id="pcMaxLevel" type="number" value="' + (Number(passCfg().maxLevel)||30) + '">' +
    '<label class="a-label">Цена Пасс+ (G)</label><input class="a-input" id="pcPlusPrice" type="number" value="' + (Number(passCfg().plusPrice)||1000) + '">' +
    '<label class="a-label">Квестов в день (1-5)</label><input class="a-input" id="pcQuestCount" type="number" value="' + (Number(passCfg().questCount)||3) + '" min="1" max="5">' +
    '<label class="a-label">Цены уровней (до_уровня:цена, через запятую)</label>' +
    '<input class="a-input" id="pcLevelPrices" value="' + esc((passCfg().levelPrices||[]).map(r => r.to + ':' + r.price).join(', ')) + '" placeholder="5:100, 15:250, 30:500">' +
    '<label class="a-label">Награды уровней (через запятую, G)</label>' +
    '<textarea class="a-input" id="pcLevelRewards" placeholder="50, 60, 70, ...">' + (Array.isArray(passCfg().levelRewards) ? passCfg().levelRewards.join(', ') : '') + '</textarea>' +
    '<label class="a-label">Шаблоны квестов (metric | base | perLvl | shards | title, каждый с новой строки)</label>' +
    '<textarea class="a-input" id="pcQuests">' + questTemplates().map(q => q.metric + ' | ' + q.base + ' | ' + (q.perLvl||0) + ' | ' + q.shards + ' | ' + q.title).join('\n') + '</textarea>' +
    '<p class="a-hint">metric — один из: opens, spends, upgradeWins, itemsGot. {t} в названии заменится на цель.</p>' +
    '<button class="a-btn" onclick="savePassCfg()">Сохранить</button>' +
  '</details>' +

  '<details class="a-sec"><summary>' + ic('gift') + ' Кейсы</summary>' +
    (S.cases || []).map(c => '<div class="a-case"><div class="a-info"><b>' + esc(c.name) + '</b><div class="a-sub">' + (c.prizes||[]).length + ' призов, цена ' + (c.price||0) + ' G' + (Number(c.minRefs) ? ', рефералов: ' + c.minRefs : '') + '</div></div>' +
      '<span class="a-actions"><button class="a-btn" onclick="editCase(\'' + c.id + '\')">' + ic('edit') + '</button>' +
      '<button class="a-btn del" onclick="delCase(\'' + c.id + '\')">' + ic('trash') + '</button></span></div>').join('') +
    '<button class="a-btn" onclick="editCase(null)">+ Новый кейс</button>' +
  '</details>' +

  '<details class="a-sec"><summary>' + ic('box') + ' Предметы</summary>' +
    (S.itemDB || []).map((it, i) => '<div class="a-case"><div class="a-info"><b>' + esc(it.name) + '</b><div class="a-sub">' + (it.value||0) + ' G, ' + (it.type||'prize') + '</div></div>' +
      '<span class="a-actions"><button class="a-btn del" onclick="delItem(' + i + ')">' + ic('trash') + '</button></span></div>').join('') +
    '<label class="a-label">ID | Название | Стоимость | тип(prize/souvenir) | фото URL</label>' +
    '<input class="a-input" id="newItemLine" placeholder="n1 | Кожаный кошелёк | 300 | prize | ">' +
    '<button class="a-btn" onclick="addItem()">+ Добавить</button>' +
  '</details>' +

  '<details class="a-sec"><summary>' + ic('chat') + ' Обращения</summary>' +
    (S.tickets || []).map(t => '<div class="ticket"><div class="t-head"><b>' + esc(t.name||'') + '</b><span class="t-badge ' + (t.status === 'closed' ? 'closed' : 'open') + '">' + (t.status === 'closed' ? 'Закрыт' : 'Открыт') + '</span></div>' +
      '<p>' + esc(t.text||'') + '</p>' +
      (t.status !== 'closed' ? '<div class="chat-input"><input class="a-input" id="rep-' + t._id + '" placeholder="Ответ...">' +
        '<button class="a-btn" onclick="replyTicket(\'' + t._id + '\')">Ответить</button></div>' : '') +
      '</div>').join('') || '<p class="muted">Пусто.</p>' +
  '</details>' +

  '<details class="a-sec"><summary>' + ic('users') + ' Заявки вывода</summary>' +
    Object.entries(S.withdrawChats || {}).map(([id, c]) => '<div class="ticket"><div class="t-head"><b>' + esc(c.name||'') + ' — Zombix ID: ' + esc(c.zxId||'') + '</b>' +
      '<span class="t-badge ' + (c.status === 'closed' ? 'closed' : 'open') + '">' + (c.status === 'closed' ? 'Закрыт' : 'Активен') + '</span></div>' +
      '<div class="chat">' + (c.messages || []).map(m => '<div class="msg ' + (m.from === 'user' ? 'admin' : 'user') + '"><div class="m-text">' + esc(m.text) + '</div></div>').join('') + '</div>' +
      '<div class="chat-input"><input class="a-input" id="awd-' + id + '" placeholder="Ответ...">' +
      '<button class="a-btn" onclick="adminWdReply(\'' + id + '\')">Отправить</button>' +
      '<button class="a-btn del" onclick="adminWdClose(\'' + id + '\')">Закрыть</button></div></div>').join('') || '<p class="muted">Пусто.</p>' +
  '</details>' +

  '<details class="a-sec"><summary>' + ic('info') + ' Вызовы модератора</summary>' +
    (S.modCalls || []).filter(m => m.status === 'new').map(m => '<div class="a-case"><div class="a-info"><b>' + esc(m.name) + '</b><div class="a-sub">' + esc(m.time||'') + '</div></div>' +
      '<button class="a-btn" onclick="resolveCall(\'' + m._id + '\')">Принять</button></div>').join('') || '<p class="muted">Активных вызовов нет.</p>' +
  '</details>' +

  '<details class="a-sec"><summary>' + ic('users') + ' Пользователи</summary>' +
    Object.entries(S.usersAll || {}).map(([k, u]) => '<div class="a-case"><div class="a-info"><b>' + esc(u.name||'') + '</b><div class="a-sub">' + (Number(u.gold)||0) + ' G' + (u.banned ? ' • БАН' : '') + '</div></div>' +
      '<span class="a-actions"><button class="a-btn" onclick="giveGold(\'' + k + '\')">+G</button>' +
      '<button class="a-btn del" onclick="toggleBan(\'' + k + '\')">' + (u.banned ? 'Разбан' : 'Бан') + '</button></span></div>').join('') +
  '</details>' +

  '<details class="a-sec"><summary>' + ic('link') + ' Каналы гейта</summary>' +
    (S.channels || []).map(ch => '<div class="a-case"><div class="a-info"><b>' + esc(ch.name) + '</b><div class="a-sub">' + esc(ch.url) + '</div></div>' +
      '<button class="a-btn del" onclick="delChannel(\'' + ch._k + '\')">' + ic('trash') + '</button></div>').join('') +
    '<div class="chat-input"><input class="a-input" id="chName" placeholder="Название">' +
    '<input class="a-input" id="chUrl" placeholder="https://t.me/...">' +
    '<button class="a-btn" onclick="addChannel()">+</button></div>' +
    '<div class="row"><span>Гейт включён</span><label class="switch"><input type="checkbox" id="gateToggle" ' + (S.gateEnabled ? 'checked' : '') + '><span class="slider"></span></label></div>' +
  '</details>' +

  '<details class="a-sec"><summary>' + ic('edit') + ' Тексты</summary>' +
    '<label class="a-label">Кнопка пополнения</label><input class="a-input" id="txDepositBtn" value="' + esc(TEXTS.depositBtn) + '">' +
    '<label class="a-label">Инфо пополнения</label><input class="a-input" id="txDepositInfo" value="' + esc(TEXTS.depositInfo) + '">' +
    '<label class="a-label">Приветствие гейта</label><input class="a-input" id="txGateTitle" value="' + esc(TEXTS.gateTitle) + '">' +
    '<label class="a-label">Подзаголовок гейта</label><input class="a-input" id="txGateSub" value="' + esc(TEXTS.gateSub) + '">' +
    '<label class="a-label">FAQ</label><textarea class="a-input" id="txFaq">' + esc(TEXTS.faq) + '</textarea>' +
    '<label class="a-label">Политика</label><textarea class="a-input" id="txPrivacy">' + esc(TEXTS.privacy) + '</textarea>' +
    '<label class="a-label">О приложении</label><textarea class="a-input" id="txAbout">' + esc(TEXTS.about) + '</textarea>' +
    '<button class="a-btn" onclick="saveTexts()">Сохранить</button>' +
  '</details>' +

  '<details class="a-sec" open><summary>' + ic('clock') + ' Журнал действий</summary>' +
    '<button class="a-btn" onclick="refreshLogDays()">Обновить дни</button>' +
    '<div class="log-days" id="logDays"></div>' +
    '<div class="log-list" id="logList"><p class="muted">Выберите день.</p></div>' +
    '<button class="a-btn" onclick="downloadLog()">Скачать день .txt</button>' +
    '<button class="a-btn" onclick="downloadLogAll()">Скачать всё .txt</button>' +
    '<button class="a-btn" onclick="showLogForBot()">Вывести в бота списком</button>' +
    '<textarea class="a-input" id="logBotOut" style="display:none"></textarea>' +
    '<button class="a-btn" id="logCopyBtn" style="display:none" onclick="copyLogBot()">Копировать</button>' +
  '</details>' +

  '<details class="a-sec"><summary>' + ic('wallet') + ' Сброс банка</summary>' +
    '<p class="a-hint">Обнуляет paidIn/paidOut (осторожно).</p>' +
    '<button class="a-btn del" onclick="resetBank()">Сбросить банк</button>' +
  '</details>';
  hydrateIcons(panel);
  const ae = $('annEditor');
  if (ae && !ae.value && (S.annSlides||[]).length){
    ae.value = S.annSlides.map(s =>
      [s.title, s.text, s.photo ? 'фото:' + s.photo : '',
       (s.buttons||[]).map(b => 'кнопка: ' + b.label + ' | ' + (b.url||'')).join('\n')]
      .filter(Boolean).join('\n')).join('\n===\n');
  }
}
document.addEventListener('change', e => {
  if (e.target.id === 'gateToggle' && cloudReady) db.ref('gateEnabled').set(e.target.checked);
});
async function saveEconomy(){
  const rtp = Math.min(100, Math.max(0, Number($('eRtp').value) || 95));
  await db.ref('economy').update({rtp, shardRate: Number($('eShard').value) || 10, maxCount: Math.min(5, Math.max(1, Number($('eMaxCnt').value) || 5))});
  logAction('admin', 'Сохранена экономика: RTP ' + rtp + '%');
  toast('Сохранено');
}
async function saveAnnouncements(){
  const raw = $('annEditor').value;
  const slides = raw.split('===').map(b => {
    const lines = b.split('\n').map(l => l.trim()).filter(Boolean);
    const slide = {text:'', title:'', photo:'', buttons:[]};
    lines.forEach(l => {
      if (l.startsWith('фото:')) slide.photo = l.slice(5).trim();
      else if (l.startsWith('кнопка:')){
        const [label, url] = l.slice(7).split('|').map(s => s.trim());
        slide.buttons.push({label, url: url || '#'});
      }
      else if (!slide.title) slide.title = l;
      else slide.text += (slide.text ? '\n' : '') + l;
    });
    return slide;
  }).filter(s => s.title || s.text || s.photo);
  await db.ref('announcements').set(slides);
  logAction('admin', 'Сохранены объявления (' + slides.length + ' слайдов)');
  toast('Объявления сохранены');
}
async function savePassCfg(){
  const maxLevel = Math.min(100, Math.max(1, Number($('pcMaxLevel').value) || 30));
  const plusPrice = Number($('pcPlusPrice').value) || 1000;
  const questCount = Math.min(5, Math.max(1, Number($('pcQuestCount').value) || 3));
  const levelPrices = $('pcLevelPrices').value.split(',').map(s => {
    const [to, price] = s.split(':').map(x => Number(x.trim()));
    return (to && price) ? {to, price} : null;
  }).filter(Boolean);
  const rewRaw = $('pcLevelRewards').value.split(',').map(n => Number(n.trim())).filter(n => n > 0);
  const quests = $('pcQuests').value.split('\n').map(l => {
    const [metric, base, perLvl, shards, ...title] = l.split('|').map(s => s.trim());
    if (!metric) return null;
    return {metric, base: Number(base)||1, perLvl: Number(perLvl)||0, shards: Number(shards)||40, title: title.join('|')};
  }).filter(Boolean);
  await db.ref('passConfig').set({maxLevel, plusPrice, questCount, levelPrices, levelRewards: rewRaw, questTemplates: quests});
  logAction('admin', 'Сохранён конфиг баттл-пасса');
  toast('Сохранено');
}
function editCase(id){
  const c = id ? S.cases.find(x => String(x.id) === String(id)) : null;
  const name = prompt('Название кейса:', c ? c.name : 'Новый кейс');
  if (name === null) return;
  const desc = prompt('Описание:', c ? (c.desc || '') : '') || '';
  const price = Number(prompt('Цена (G):', c ? (c.price || 0) : 0)) || 0;
  const cd = Number(prompt('Кулдаун бесплатного открытия (сек):', c ? (c.cd || 60) : 60)) || 60;
  const minRefs = Number(prompt('Сколько рефералов нужно для открытия (0 — всем):', c ? (c.minRefs || 0) : 0)) || 0;
  const prizesRaw = prompt('Призы (каждый с новой строки: Название | шанс | тип(stars/item) | значение):',
    c ? (c.prizes || []).map(p => p.name + ' | ' + p.chance + ' | ' + p.type + ' | ' + (p.value||'')).join('\n') : '') || '';
  const prizes = prizesRaw.split('\n').map(l => {
    const [n, ch, tp, val] = l.split('|').map(s => s.trim());
    if (!n) return null;
    return {name: n, chance: Number(ch)||0, type: tp || 'stars', value: tp === 'item' ? val : Number(val)||0};
  }).filter(Boolean);
  const cid = id || Date.now();
  db.ref('cases/' + cid).set({id: cid, name, desc, price, cd, minRefs, prizes});
  logAction('admin', 'Сохранён кейс «' + name + '»');
  toast('Кейс сохранён');
}
function delCase(id){
  if (!confirm('Удалить кейс?')) return;
  db.ref('cases/' + id).remove();
  logAction('admin', 'Удалён кейс #' + id);
}
function addItem(){
  const [id, name, value, type, photo] = $('newItemLine').value.split('|').map(s => s.trim());
  if (!id || !name){ toast('Заполните строку'); return; }
  db.ref('items/' + id).set({id, name, value: Number(value)||0, type: type || 'prize', photo: photo || '', ico: '📦'});
  logAction('admin', 'Добавлен предмет ' + name);
  toast('Добавлено');
}
function delItem(i){
  const it = S.itemDB[i]; if (!it) return;
  db.ref('items/' + it.id).remove();
  logAction('admin', 'Удалён предмет ' + it.name);
}
function replyTicket(id){
  const rep = $('rep-' + id).value.trim(); if (!rep) return;
  db.ref('tickets/' + id).update({reply: rep, status:'closed', seenByUser:false});
  logAction('admin', 'Ответ на обращение ' + id);
  toast('Ответ отправлен');
}
function adminWdReply(id){
  const inp = $('awd-' + id); if (!inp) return;
  const text = inp.value.trim(); if (!text) return;
  db.ref('withdrawChats/' + id + '/messages').push({from:'admin', text, ts: Date.now()});
  inp.value = '';
  logAction('admin', 'Ответ в чате вывода ' + id);
}
function adminWdClose(id){
  db.ref('withdrawChats/' + id).update({status:'closed'});
  logAction('admin', 'Чат вывода закрыт: ' + id);
}
function resolveCall(id){
  db.ref('modCalls/' + id).update({status:'done'});
  logAction('admin', 'Вызов модератора принят');
}
function giveGold(key){
  const amt = Number(prompt('Сколько золота начислить?')); if (!amt) return;
  db.ref('users/' + key + '/gold').transaction(v => (Number(v)||0) + amt);
  logAction('admin', 'Начислено ' + amt + ' G пользователю ' + key);
  toast('Начислено');
}
function toggleBan(key){
  const u = S.usersAll[key]; if (!u) return;
  db.ref('users/' + key + '/banned').set(!u.banned);
  db.ref('users/' + key + '/banReason').set(u.banned ? '' : 'Нарушение правил');
  logAction('admin', (u.banned ? 'Разбан' : 'Бан') + ' пользователя ' + (u.name||key));
}
function delChannel(key){
  db.ref('channels/' + key).remove();
  logAction('admin', 'Удалён канал из гейта');
}
function addChannel(){
  const name = $('chName').value.trim(), url = $('chUrl').value.trim();
  if (!name || !url){ toast('Заполните поля'); return; }
  db.ref('channels').push({name, url});
  $('chName').value = ''; $('chUrl').value = '';
  logAction('admin', 'Добавлен канал в гейт: ' + name);
}
async function saveTexts(){
  await db.ref('texts').set({
    depositBtn: $('txDepositBtn').value,
    depositInfo: $('txDepositInfo').value,
    gateTitle: $('txGateTitle').value,
    gateSub: $('txGateSub').value,
    faq: $('txFaq').value,
    privacy: $('txPrivacy').value,
    about: $('txAbout').value
  });
  logAction('admin', 'Сохранены тексты интерфейса');
  toast('Сохранено');
}
async function resetBank(){
  if (!confirm('Обнулить банк (paidIn/paidOut)?')) return;
  await db.ref('economy').update({paidIn:0, paidOut:0});
  logAction('admin', 'Банк обнулён');
  toast('Банк сброшен');
}

/* ---------- ЖУРНАЛ: ПРОСМОТР, TXT, БОТ ---------- */
async function refreshLogDays(){
  const box = $('logDays');
  box.innerHTML = '<span class="muted">Загрузка...</span>';
  let days = [];
  try {
    const snap = await db.ref('logs').get();
    days = snap.exists() ? Object.keys(snap.val()).sort().reverse() : [];
  } catch(e){}
  box.innerHTML = days.length ? days.map(d =>
    '<button class="a-btn' + (d === curLogDay ? ' on' : '') + '" onclick="showLogDay(\'' + d + '\')">' + d + '</button>'
  ).join('') : '<span class="muted">Логов пока нет.</span>';
}
async function showLogDay(day){
  curLogDay = day;
  const list = $('logList');
  list.innerHTML = '<span class="muted">Загрузка...</span>';
  try {
    const snap = await db.ref('logs/' + day).get();
    const arr = snap.exists() ? Object.values(snap.val()).sort((a,b) => a.ts - b.ts) : [];
    list.innerHTML = arr.length ? arr.map(l =>
      '<div class="log-line"><span class="l-time">' + esc(l.time || '') + '</span>' + esc(l.text || '') + '</div>'
    ).join('') : '<p class="muted">За этот день записей нет.</p>';
  } catch(e){
    list.innerHTML = '<p class="muted">Ошибка загрузки.</p>';
  }
}
function collectLog(day){
  try { return JSON.parse(localStorage.getItem('zxlogs_' + day) || '[]'); } catch(e){ return []; }
}
function downloadLog(){
  if (!curLogDay){ toast('Выберите день'); return; }
  const lines = collectLog(curLogDay).map(l => l.time + ' — ' + l.text);
  saveFile('zombixup_log_' + curLogDay + '.txt', 'ZombixUP — журнал за ' + curLogDay + '\n\n' + lines.join('\n'));
}
async function downloadLogAll(){
  const all = [];
  try {
    const snap = await db.ref('logs').get();
    const days = snap.exists() ? Object.keys(snap.val()).sort() : [];
    for (const d of days){
      all.push('=== ' + d + ' ===');
      const dsnap = await db.ref('logs/' + d).get();
      const arr = dsnap.exists() ? Object.values(dsnap.val()).sort((a,b) => a.ts - b.ts) : [];
      arr.forEach(l => all.push(l.time + ' — ' + l.text));
    }
  } catch(e){}
  saveFile('zombixup_logs_all.txt', 'ZombixUP — журнал действий\n\n' + all.join('\n'));
}
function showLogForBot(){
  if (!curLogDay){ toast('Выберите день'); return; }
  const lines = collectLog(curLogDay).map(l => l.time + ' — ' + l.text);
  const out = $('logBotOut');
  out.style.display = '';
  out.value = lines.join('\n');
  $('logCopyBtn').style.display = '';
}
function copyLogBot(){
  navigator.clipboard.writeText($('logBotOut').value).then(() => toast('Скопировано — вставьте боту'));
}

/* ---------- РЕНДЕР ВСЕГО ---------- */
function renderAll(){
  renderHeaderChips();
  renderCases(); renderFeed(); renderInv(); renderUpg();
  renderPass(); renderProfile(); renderTop(); renderAdmin();
  renderAnn(); renderGate(); applyTexts(); renderOnline();
  hydrateIcons();
  maybeWelcome();
}

/* ---------- СТАРТ ---------- */
applyTheme();
applyAccent();
if (!S.fx) document.body.classList.add('no-fx');
ensureHeaderChips();
$('adminMenuItem').style.display = S.admin ? '' : 'none';
initCloud();
logAction('app', 'Приложение запущено');
