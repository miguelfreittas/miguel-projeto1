const ADMIN = 'miguel', APASS = 'miguel1608';
const JSONBIN_KEY = '$2a$10$unTVgPVUNWXiEg0rl30/weY6JIscVJ5ZJWIY7nNCD7L9ejNYsZBXW';
const JSONBIN_URL = 'https://api.jsonbin.io/v3/b';

let binId = null;
let db = { users: {} };
let me = null;
let bShow = false;

async function initBin() {
  binId = localStorage.getItem('tbank-binid');
  if (binId) {
    await load();
    return;
  }

  const res = await fetch(JSONBIN_URL, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'X-Master-Key': JSONBIN_KEY,
      'X-Bin-Name': 'tbank-db',
      'X-Bin-Private': 'true'
    },
    body: JSON.stringify({ users: {} })
  });

  const data = await res.json();
  binId = data.metadata.id;
  localStorage.setItem('tbank-binid', binId);
  db = { users: {} };
}

async function load() {
  try {
    const res = await fetch(`${JSONBIN_URL}/${binId}/latest`, {
      headers: { 'X-Master-Key': JSONBIN_KEY }
    });
    const data = await res.json();
    db = data.record;
  } catch(e) {
    db = { users: {} };
  }
}

async function save() {
  await fetch(`${JSONBIN_URL}/${binId}`, {
    method: 'PUT',
    headers: {
      'Content-Type': 'application/json',
      'X-Master-Key': JSONBIN_KEY
    },
    body: JSON.stringify(db)
  });
}

async function init() {
  await initBin();
  showPage('landing');
}

function showPage(p) {
  document.querySelectorAll('.page').forEach(x => x.classList.remove('active'));
  document.getElementById('page-' + p).classList.add('active');
  clrErr();
}

function clrErr() {
  document.querySelectorAll('.ferr').forEach(e => { e.classList.remove('on'); e.textContent = ''; });
  document.querySelectorAll('.inp').forEach(i => i.classList.remove('err', 'ok'));
  document.querySelectorAll('.alert').forEach(a => { a.classList.remove('on'); a.textContent = ''; });
}

function fe(id, m) {
  const e = document.getElementById(id);
  if (e) { e.textContent = m; e.classList.add('on'); }
}

function fi(id, s) {
  const e = document.getElementById(id);
  if (e) { e.classList.remove('err', 'ok'); if (s) e.classList.add(s); }
}

function al(id, m) {
  const e = document.getElementById(id);
  if (e) { e.textContent = m; e.classList.add('on'); }
}

function fmt(v) {
  return 'R$ ' + v.toLocaleString('pt-BR', { minimumFractionDigits: 2 });
}

function now() {
  const d = new Date();
  return d.toLocaleDateString('pt-BR') + ' ' + d.toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' });
}

function toast(type, t, m) {
  const el = document.getElementById('toast');
  el.className = 'toast ' + type;
  document.getElementById('tt').textContent = t;
  document.getElementById('tm').textContent = m;
  el.classList.add('on');
  setTimeout(() => el.classList.remove('on'), 3000);
}

function sw(id, btn) {
  document.querySelectorAll('.pane').forEach(p => p.classList.remove('on'));
  document.querySelectorAll('.tab').forEach(b => b.classList.remove('on'));
  document.getElementById(id).classList.add('on');
  btn.classList.add('on');
  if (id === 'p-adm') refAdm();
}

async function cadastrar() {
  clrErr();
  await load();

  const u = document.getElementById('cu').value.trim();
  const p = document.getElementById('cp').value;
  const p2 = document.getElementById('cp2').value;
  let ok = true;

  if (!u) { fe('fe-cu', 'escolhe um usuario'); fi('cu', 'err'); ok = false; }
  else if (u.length < 3) { fe('fe-cu', 'minimo 3 letras'); fi('cu', 'err'); ok = false; }
  else if (u.toLowerCase() === ADMIN) { fe('fe-cu', 'nome nao disponivel'); fi('cu', 'err'); ok = false; }
  else if (db.users[u.toLowerCase()]) { fe('fe-cu', 'ja tem alguem com esse nome'); fi('cu', 'err'); ok = false; }
  else fi('cu', 'ok');

  if (!p) { fe('fe-cp', 'cria uma senha'); fi('cp', 'err'); ok = false; }
  else if (p.length < 6) { fe('fe-cp', 'minimo 6 caracteres'); fi('cp', 'err'); ok = false; }
  else fi('cp', 'ok');

  if (!p2) { fe('fe-cp2', 'confirma a senha'); fi('cp2', 'err'); ok = false; }
  else if (p !== p2) { fe('fe-cp2', 'senhas diferentes'); fi('cp2', 'err'); ok = false; }
  else if (p.length >= 6) fi('cp2', 'ok');

  if (!ok) return;

  db.users[u.toLowerCase()] = { name: u, pass: p, bal: 100, tx: [] };
  await save();
  al('cad-ok', 'conta criada! indo pro login...');
  setTimeout(() => { document.getElementById('lu').value = u; showPage('login'); }, 1400);
}

async function login() {
  clrErr();
  const u = document.getElementById('lu').value.trim().toLowerCase();
  const p = document.getElementById('lp').value;
  let ok = true;

  if (!u) { fe('fe-lu', 'qual o usuario?'); fi('lu', 'err'); ok = false; }
  if (!p) { fe('fe-lp', 'qual a senha?'); fi('lp', 'err'); ok = false; }
  if (!ok) return;

  if (u === ADMIN && p === APASS) {
    me = '__adm__';
    loadDash(true);
    showPage('dashboard');
    return;
  }

  await load();
  const acc = db.users[u];
  if (!acc || acc.pass !== p) {
    al('login-err', 'usuario ou senha errados');
    fi('lu', 'err');
    fi('lp', 'err');
    return;
  }

  me = u;
  loadDash(false);
  showPage('dashboard');
}

const isAdm = () => me === '__adm__';

function loadDash(adm) {
  bShow = false;

  document.querySelectorAll('.pane').forEach(p => p.classList.remove('on'));
  document.querySelectorAll('.tab').forEach(b => b.classList.remove('on'));
  document.getElementById('p-main').classList.add('on');
  document.querySelector('.tab').classList.add('on');

  if (adm) {
    document.getElementById('dn').textContent = 'miguel';
    document.getElementById('da').textContent = 'M';
    document.getElementById('bal-wrap').style.display = 'none';
    document.getElementById('adm-tab').style.display = 'block';
  } else {
    const a = db.users[me];
    document.getElementById('dn').textContent = a.name;
    document.getElementById('da').textContent = a.name[0].toUpperCase();
    document.getElementById('bal-wrap').style.display = 'flex';
    document.getElementById('adm-tab').style.display = 'none';
    renderBal();
    renderTx();
  }
}

function toggleBal() { bShow = !bShow; renderBal(); }

function renderBal() {
  if (isAdm()) return;
  const a = db.users[me];
  const el = document.getElementById('bv');
  el.textContent = fmt(a.bal);
  el.classList.toggle('blur', !bShow);
}

function mkTx(list, id, limit) {
  const el = document.getElementById(id);
  const items = limit ? [...list].reverse().slice(0, limit) : [...list].reverse();

  if (!items.length) { el.innerHTML = '<div class="empty">nada ainda</div>'; return; }

  el.innerHTML = items.map(tx => {
    const c = tx.adm ? 'adm' : tx.type;
    const lbl = tx.adm
      ? (tx.type === 'in' ? 'deposito admin' : 'remocao admin')
      : (tx.type === 'in' ? 'de ' + tx.other : 'para ' + tx.other);
    const s = tx.type === 'out' ? '−' : '+';
    return `<div class="tx-row">
      <div class="tx-l">
        <div class="tx-ic ${c}">${tx.type === 'in' ? '↓' : '↑'}</div>
        <div>
          <div class="tx-nm">${lbl}</div>
          <div class="tx-dt">${tx.date}</div>
        </div>
      </div>
      <div class="tx-am ${c}">${s} ${fmt(tx.amount)}</div>
    </div>`;
  }).join('');
}

function renderTx() {
  if (isAdm()) return;
  const a = db.users[me];
  mkTx(a.tx, 'tx5', 5);
  mkTx(a.tx, 'txall', null);
}

async function transferir() {
  if (isAdm()) return;
  await load();

  const dR = document.getElementById('td').value.trim();
  const d = dR.toLowerCase();
  const v = parseFloat(document.getElementById('tv').value);

  ['fe-td', 'fe-tv'].forEach(id => { const e = document.getElementById(id); e.classList.remove('on'); e.textContent = ''; });
  ['td', 'tv'].forEach(id => document.getElementById(id).classList.remove('err'));

  let ok = true;
  if (!d) { fe('fe-td', 'pra quem?'); document.getElementById('td').classList.add('err'); ok = false; }
  else if (d === me) { fe('fe-td', 'voce nao manda pra si mesmo kk'); document.getElementById('td').classList.add('err'); ok = false; }
  else if (d === ADMIN || !db.users[d]) { fe('fe-td', 'usuario nao encontrado'); document.getElementById('td').classList.add('err'); ok = false; }

  if (!v || isNaN(v) || v <= 0) { fe('fe-tv', 'valor invalido'); document.getElementById('tv').classList.add('err'); ok = false; }
  else if (ok && v > db.users[me].bal) { fe('fe-tv', 'sem saldo suficiente'); document.getElementById('tv').classList.add('err'); ok = false; }

  if (!ok) return;

  const n = now();
  db.users[me].bal -= v;
  db.users[me].tx.push({ type: 'out', other: db.users[d].name, amount: v, date: n });
  db.users[d].bal += v;
  db.users[d].tx.push({ type: 'in', other: db.users[me].name, amount: v, date: n });
  await save();

  document.getElementById('td').value = '';
  document.getElementById('tv').value = '';
  renderBal();
  renderTx();
  toast('ok', 'mandado!', `${fmt(v)} pra ${db.users[d].name}`);
}

async function admDep() {
  await load();

  const uR = document.getElementById('adu').value.trim().toLowerCase();
  const v = parseFloat(document.getElementById('adv').value);

  ['fe-adu', 'fe-adv'].forEach(id => { const e = document.getElementById(id); e.classList.remove('on'); e.textContent = ''; });
  ['adu', 'adv'].forEach(id => document.getElementById(id).classList.remove('err'));

  let ok = true;
  if (!uR || !db.users[uR]) { fe('fe-adu', 'usuario nao encontrado'); document.getElementById('adu').classList.add('err'); ok = false; }
  if (!v || isNaN(v) || v <= 0) { fe('fe-adv', 'valor invalido'); document.getElementById('adv').classList.add('err'); ok = false; }
  if (!ok) return;

  db.users[uR].bal += v;
  db.users[uR].tx.push({ type: 'in', adm: true, other: 'admin', amount: v, date: now() });
  await save();

  document.getElementById('adu').value = '';
  document.getElementById('adv').value = '';
  toast('ok', 'depositado!', `${fmt(v)} adicionado pra ${db.users[uR].name}`);
  refAdm();
}

async function admRem() {
  await load();

  const uR = document.getElementById('aru').value.trim().toLowerCase();
  const v = parseFloat(document.getElementById('arv').value);

  ['fe-aru', 'fe-arv'].forEach(id => { const e = document.getElementById(id); e.classList.remove('on'); e.textContent = ''; });
  ['aru', 'arv'].forEach(id => document.getElementById(id).classList.remove('err'));

  let ok = true;
  if (!uR || !db.users[uR]) { fe('fe-aru', 'usuario nao encontrado'); document.getElementById('aru').classList.add('err'); ok = false; }
  if (!v || isNaN(v) || v <= 0) { fe('fe-arv', 'valor invalido'); document.getElementById('arv').classList.add('err'); ok = false; }
  else if (db.users[uR] && v > db.users[uR].bal) { fe('fe-arv', 'saldo insuficiente'); document.getElementById('arv').classList.add('err'); ok = false; }
  if (!ok) return;

  db.users[uR].bal -= v;
  db.users[uR].tx.push({ type: 'out', adm: true, other: 'admin', amount: v, date: now() });
  await save();

  document.getElementById('aru').value = '';
  document.getElementById('arv').value = '';
  toast('ok', 'removido!', `${fmt(v)} removido de ${db.users[uR].name}`);
  refAdm();
}

async function refAdm() {
  await load();
  const all = Object.values(db.users);
  const tot = all.reduce((s, u) => s + u.bal, 0);

  document.getElementById('adm-stats').innerHTML = `
    <div class="stat"><div class="stat-l">usuarios</div><div class="stat-v">${all.length}</div></div>
    <div class="stat"><div class="stat-l">em circulacao</div><div class="stat-v">${fmt(tot)}</div></div>
  `;

  const el = document.getElementById('adm-ul');
  if (!all.length) { el.innerHTML = '<div class="empty">ninguem ainda</div>'; return; }

  el.innerHTML = all.map(u => `
    <div class="u-row">
      <div style="display:flex;align-items:center">
        <div class="u-av">${u.name[0].toUpperCase()}</div>
        <div>
          <div class="u-nm">${u.name}</div>
          <div class="u-tx">${u.tx.length} transacoes</div>
        </div>
      </div>
      <div class="u-bl">${fmt(u.bal)}</div>
    </div>
  `).join('');
}

function logout() {
  me = null;
  document.getElementById('lu').value = '';
  document.getElementById('lp').value = '';
  showPage('landing');
}

document.addEventListener('keydown', e => {
  if (e.key !== 'Enter') return;
  const a = document.querySelector('.page.active');
  if (!a) return;
  if (a.id === 'page-cadastro') cadastrar();
  else if (a.id === 'page-login') login();
});

init();