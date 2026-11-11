/* 정보 개념 체험관 · 학생 로그인, 활동 잠금, 진도·접속·출석 기록
   - 학생: 학번 + 개인 코드(교사가 발급) → Firebase 익명 로그인 + claims 로 학번 연결. 이름은 교사 명단에서만 가져옴.
   - 교사: 구글 로그인 → admins/{uid} 이면 교사 모드(잠금 없음, 기록 안 함).
   - 로그인하지 않으면 활동을 열 수 없음. 잠긴 활동은 🔒 안내만 보임.
   - 진도는 common.js 의 'info:progress' 신호를 받아 저장. 데이터 구조는 firebase/database.rules.json 참고. */
(() => {
  if (typeof loginActive === 'function' && !loginActive()) return;   // 학생 로그인 꺼짐(contents.js의 LOGIN_ON)
  const CFG = {
    apiKey: 'AIzaSyDJV6-cIM0-UO5Rpp4VYZeUlHbWP4svXGk',
    authDomain: 'info-lessons-live-sq.firebaseapp.com',
    databaseURL: 'https://info-lessons-live-sq-default-rtdb.asia-southeast1.firebasedatabase.app',
    projectId: 'info-lessons-live-sq',
    appId: '1:918252932246:web:32def6b205181da0c7c6b7',
  };
  const SDK = 'https://www.gstatic.com/firebasejs/10.12.2/';
  const local = /^(localhost|127\.0\.0\.1)$/.test(location.hostname);
  const EMU = local && /[?&]emu\b/.test(location.search) || (local && (() => { try { return sessionStorage.getItem('emu') === '1'; } catch (e) { return false; } })());
  if (EMU) try { sessionStorage.setItem('emu', '1'); } catch (e) {}

  const isIndex = typeof window.infoProgress === 'undefined';   // 목차 화면(common.js 없음)
  const act = isIndex ? null : infoProgress.state.act;
  const esc = s => String(s == null ? '' : s).replace(/[<>&"]/g, c => ({'<': '&lt;', '>': '&gt;', '&': '&amp;', '"': '&quot;'}[c]));
  const pad = n => String(n).padStart(2, '0');
  const today = () => { const d = new Date(Date.now() + (S.off || 0)); return d.getFullYear() + '-' + pad(d.getMonth() + 1) + '-' + pad(d.getDate()); };
  const hm = t => { const d = new Date(t); return pad(d.getHours()) + ':' + pad(d.getMinutes()); };
  const S = {mode: 'loading', off: 0};   // mode: loading | login | student | teacher | error
  window.infoAuth = S;

  /* ---------- 화면 ---------- */
  const css = `html.ga-wait main,html.ga-wait .nextbar{visibility:hidden}
.ga-over{position:fixed;inset:0;z-index:200;background:rgba(246,248,252,.97);display:flex;align-items:center;justify-content:center;padding:16px;overflow:auto}
.ga-box{background:#fff;border:2px solid var(--line,#e3e8f2);border-radius:20px;padding:22px;max-width:380px;width:100%;box-shadow:0 6px 0 #eef1f7}
.ga-box h2{margin:0 0 6px;font-size:1.3rem}
.ga-box label{display:block;margin:10px 0 0;font-weight:700}
.ga-box input[type=text],.ga-box input[type=password]{display:block;width:100%;font:inherit;font-size:1.2rem;letter-spacing:.08em;padding:8px 10px;margin-top:4px;border:2px solid var(--line,#e3e8f2);border-radius:12px;box-sizing:border-box}
.ga-box .ga-chk{font-weight:400;font-size:.9rem}
.ga-box .btn{width:100%;margin-top:14px;font-size:1.05rem}
.ga-link{background:none;border:0;color:var(--muted,#667);font:inherit;font-size:.85rem;text-decoration:underline;cursor:pointer;margin-top:12px;padding:4px}
.ga-chip{position:fixed;left:10px;bottom:10px;z-index:150;display:flex;flex-wrap:wrap;align-items:center;gap:6px;background:#fff;border:2px solid var(--line,#e3e8f2);border-radius:999px;padding:4px 6px 4px 12px;font-size:.85rem;box-shadow:0 3px 10px rgba(30,40,80,.12);max-width:calc(100vw - 20px)}
.ga-chip button{border:0;border-radius:999px;padding:5px 10px;font:inherit;font-weight:700;cursor:pointer;background:var(--brand-soft,#e9efff);color:var(--brand,#3b6cf6)}
.ga-chip .ga-att{background:var(--pink,#ff6fa5);color:#fff;animation:gaPulse 1.2s infinite}
.ga-chip .ga-ok{color:#0d7d71;font-weight:700}
.ga-chip input{width:5.5em;font:inherit;padding:4px 8px;border:2px solid var(--line,#e3e8f2);border-radius:10px;letter-spacing:.1em}
@keyframes gaPulse{50%{transform:scale(1.06)}}
a.card.ga-locked{opacity:.55;filter:grayscale(.6);cursor:not-allowed}
a.card.ga-locked:hover{transform:none}
.ga-lockt{display:inline-block;font-size:.75rem;font-weight:800;border-radius:999px;padding:1px 8px;margin-left:4px;background:var(--bg,#f3f5fa);color:var(--muted,#667)}
.ga-donet{display:inline-block;font-size:.75rem;font-weight:800;border-radius:999px;padding:1px 8px;margin-left:4px;background:var(--mint-soft,#e2f7f4);color:#0d7d71}
.ga-today{background:var(--yellow-soft,#fff8e1);border:2px solid #f7dd8f;border-radius:16px;padding:12px 16px;margin:0 0 16px}
.ga-today a{display:inline-block;margin:4px 6px 0 0;padding:4px 10px;border-radius:999px;background:#fff;border:1px solid #f0d27a;color:inherit;text-decoration:none;font-weight:700;font-size:.9rem}
.ga-toast{position:fixed;left:50%;bottom:70px;transform:translateX(-50%);z-index:210;background:#333;color:#fff;border-radius:12px;padding:10px 16px;font-size:.9rem;max-width:90vw}
body{padding-bottom:56px}
@media print{.ga-chip,.ga-over,.ga-toast{display:none!important}}`;
  const st = document.createElement('style'); st.textContent = css; document.head.appendChild(st);
  document.documentElement.classList.add('ga-wait');

  let over = null;
  function overlay(html){
    if (!over){ over = document.createElement('div'); over.className = 'ga-over'; document.body.appendChild(over); }
    over.innerHTML = `<div class="ga-box">${html}</div>`;
    return over;
  }
  function closeOverlay(){ if (over){ over.remove(); over = null; } document.documentElement.classList.remove('ga-wait'); }
  function toast(msg){ const t = document.createElement('div'); t.className = 'ga-toast'; t.textContent = msg; document.body.appendChild(t); setTimeout(() => t.remove(), 2600); }
  const back = isIndex ? '' : `<a class="btn line" href="../index.html" style="display:block;text-align:center;margin-top:12px">◀ 목차로</a>`;

  function showLoading(msg){ overlay(`<h2>🔐 정보 개념 체험관</h2><p class="hint">${esc(msg || '연결하는 중…')}</p>`); }
  function showError(msg){
    S.mode = 'error';
    overlay(`<h2>⚠️ 연결이 안 돼요</h2><p>${esc(msg)}</p><button class="btn" id="gaRetry">다시 시도</button>`);
    $id('gaRetry').onclick = () => location.reload();
  }
  const $id = id => document.getElementById(id);

  function showLogin(msg, ok){
    S.mode = 'login';
    let shared = false; try { shared = localStorage.getItem('ga:shared') === '1'; } catch (e) {}
    overlay(`<h2>🔐 정보 개념 체험관</h2>
      <p class="hint">학번과 선생님께 받은 <b>개인 코드</b>를 입력하세요. 개인 코드는 비밀번호예요. 친구에게 알려 주지 마세요.</p>
      <label>학번 <input type="text" id="gaSid" inputmode="numeric" maxlength="5" placeholder="예: 10305 (1학년 3반 5번)" autocomplete="username"></label>
      <label>개인 코드 <input type="password" id="gaPin" maxlength="6" placeholder="6자리" autocomplete="current-password" autocapitalize="characters" spellcheck="false"></label>
      <label class="ga-chk"><input type="checkbox" id="gaShared"${shared ? ' checked' : ''}> 여러 사람이 쓰는 컴퓨터예요 (창을 닫으면 로그아웃)</label>
      <button class="btn" id="gaGo">로그인</button>
      <div class="feedback${msg ? ' show ' + (ok ? 'ok' : 'bad') : ''}" id="gaFb">${esc(msg || '')}</div>
      <div style="text-align:center"><button class="ga-link" id="gaT">👩‍🏫 교사 로그인 (구글)</button></div>`);
    const sid = $id('gaSid'), pin = $id('gaPin'), go = $id('gaGo');
    sid.oninput = () => { sid.value = sid.value.replace(/\D/g, '').slice(0, 5); if (sid.value.length === 5) pin.focus(); };
    pin.oninput = () => { pin.value = pin.value.toUpperCase().replace(/[^A-Z0-9]/g, '').slice(0, 6); };
    [sid, pin].forEach(i => i.onkeydown = e => { if (e.key === 'Enter') go.click(); });
    go.onclick = () => studentLogin(sid.value, pin.value, $id('gaShared').checked);
    $id('gaT').onclick = teacherLogin;
    setTimeout(() => sid.focus(), 50);
  }
  const fbMsg = (m, ok) => { const f = $id('gaFb'); if (f){ f.textContent = m; f.className = 'feedback show ' + (ok ? 'ok' : 'bad'); } };

  /* ---------- Firebase ---------- */
  function fbLoad(files){
    const R = window.__fbScripts = window.__fbScripts || {};
    return files.reduce((p, f) => p.then(() => R[f] = R[f] || new Promise((ok, no) => {
      const s = document.createElement('script'); s.src = SDK + f; s.onload = ok;
      s.onerror = () => { delete R[f]; no(new Error('sdk')); }; document.head.appendChild(s);
    })), Promise.resolve());
  }
  let auth, db;
  const ref = p => db.ref(p);
  const TS = () => firebase.database.ServerValue.TIMESTAMP;

  async function studentLogin(sid, pin, shared){
    if (!/^1(0[1-9]|1[0-2])(0[1-9]|[1-5][0-9])$/.test(sid)) return fbMsg('학번 5자리를 확인하세요. (예: 1학년 3반 5번 → 10305)');
    if (!/^[A-Z0-9]{6}$/.test(pin)) return fbMsg('개인 코드 6자리를 입력하세요.');
    const go = $id('gaGo'); go.disabled = true; fbMsg('확인하는 중…', true);
    try {
      try { localStorage.setItem('ga:shared', shared ? '1' : ''); } catch (e) {}
      let u = auth.currentUser;
      if (u && !u.isAnonymous){ await auth.signOut(); u = null; }
      if (!u){
        await auth.setPersistence(shared ? firebase.auth.Auth.Persistence.SESSION : firebase.auth.Auth.Persistence.LOCAL);
        u = (await auth.signInAnonymously()).user;
      }
      try { await ref('tries/' + u.uid).set({at: TS(), sid, pin}); }
      catch (e){ go.disabled = false; return fbMsg('잠시 후(3초) 다시 눌러 주세요.'); }
      try { await ref('claims/' + u.uid).set({sid, pin, at: TS()}); }
      catch (e){ go.disabled = false; return fbMsg('학번 또는 개인 코드가 맞지 않아요. 다시 확인하세요.'); }
      await enterStudent(u);
    } catch (e){
      go.disabled = false;
      fbMsg(/admin-restricted|operation-not-allowed|ADMIN_ONLY/.test(String(e.code || e.message)) ? '학생 로그인이 아직 준비되지 않았어요. 선생님께 알려 주세요.' : '로그인하지 못했어요. 인터넷 연결을 확인하세요.');
    }
  }

  async function teacherLogin(){
    try {
      const prov = new firebase.auth.GoogleAuthProvider(); prov.setCustomParameters({prompt: 'select_account'});
      const cur = auth.currentUser;
      if (cur && cur.isAnonymous){ await ref('claims/' + cur.uid).remove().catch(() => {}); await auth.signOut(); }
      await auth.setPersistence(firebase.auth.Auth.Persistence.LOCAL);
      if (EMU){
        const em = new URLSearchParams(location.search).get('temail') || prompt('에뮬레이터 교사 이메일', 'teacher@test.kr'); if (!em) return;
        await auth.signInWithCredential(firebase.auth.GoogleAuthProvider.credential(JSON.stringify({sub: 'g-' + em, email: em, email_verified: true})));
      } else await auth.signInWithPopup(prov);
    } catch (e){ fbMsg(e.code === 'auth/popup-blocked' ? '팝업이 막혔어요. 팝업을 허용해 주세요.' : e.code === 'auth/popup-closed-by-user' ? '로그인 창을 닫았어요.' : '교사 로그인을 하지 못했어요. (' + (e.code || '') + ')'); }
  }

  async function logout(){
    const u = auth.currentUser;
    try {
      if (u && u.isAnonymous){ await ref('claims/' + u.uid).remove().catch(() => {}); await u.delete().catch(() => auth.signOut()); }
      else await auth.signOut();
    } catch (e){}
    location.reload();
  }

  /* ---------- 학생 ---------- */
  let offs = [];
  const listen = (p, cb) => { const r = ref(p); r.on('value', cb, () => {}); offs.push(() => r.off('value', cb)); };

  async function enterStudent(u){
    const cl = (await ref('claims/' + u.uid).once('value')).val();
    if (!cl) return showLogin();
    let ro;
    try { ro = (await ref('roster/' + cl.sid).once('value')).val(); }
    catch (e){ await ref('claims/' + u.uid).remove().catch(() => {}); return showLogin('개인 코드가 바뀌었어요. 선생님께 받은 새 코드로 다시 로그인하세요.'); }
    if (!ro) return showLogin('명단에 없는 학번이에요. 선생님께 등록을 요청하세요.');
    Object.assign(S, {mode: 'student', uid: u.uid, sid: cl.sid, c: ro.c, name: ro.n, no: ro.no});
    chip();
    visit();
    attendWatch();
    listen('today/' + S.c, s => { S.today = s.val() || {}; decorate(); });
    if (isIndex){
      watchCards();
      ref('progress/' + S.c + '/' + S.sid).once('value').then(s => { S.prog = s.val() || {}; decorate(); }).catch(() => {});
      listen('open/' + S.c, s => { S.open = s.val() || {}; decorate(); closeOverlay(); });
    } else {
      ref('progress/' + S.c + '/' + S.sid + '/' + act).once('value').then(s => { rec = s.val() || null; track(); }).catch(() => {});
      listen('open/' + S.c + '/' + act, s => {
        if (s.val()) closeOverlay();
        else overlay(`<h2>🔒 아직 열리지 않은 활동이에요</h2><p>선생님이 이 활동을 열어 주시면 바로 시작할 수 있어요. 이 화면은 열리는 순간 자동으로 바뀌어요.</p>${back}`);
      });
    }
  }

  function chip(){
    let c = $id('gaChip');
    if (!c){ c = document.createElement('div'); c.id = 'gaChip'; c.className = 'ga-chip'; document.body.appendChild(c); }
    const who = S.mode === 'teacher' ? '👩‍🏫 교사 모드 · 기록 안 함' : `👤 ${+S.sid.slice(1, 3)}반 ${S.no}번 ${esc(S.name)}`;
    c.innerHTML = `<span>${who}</span><span id="gaAtt"></span><button id="gaOut">로그아웃</button>`;
    $id('gaOut').onclick = () => { if (confirm('로그아웃할까요?')) logout(); };
    if (S.mode === 'student') attendDraw();
  }

  async function visit(){
    const p = `visits/${S.c}/${today()}/${S.sid}`;
    try {
      const v = (await ref(p).once('value')).val();
      if (v) await ref(p).update({l: TS(), n: firebase.database.ServerValue.increment(1)});
      else await ref(p).set({f: TS(), l: TS(), n: 1});
    } catch (e){}
  }

  /* 출석: 교사가 연 동안 [✋ 출석] → 칠판의 출석 코드 4자리 입력 */
  let attOpen = null, attDone = null;
  function attendWatch(){
    listen('attendOpen/' + S.c, s => { attOpen = s.val(); attendCheck(); });
    ref('.info/serverTimeOffset').on('value', s => { S.off = s.val() || 0; });
  }
  let attRef = null;
  function attendCheck(){
    if (attRef){ attRef.off(); attRef = null; }
    const d = attOpen && attOpen.d;
    if (!d){ attDone = null; return attendDraw(); }
    attRef = ref(`attend/${S.c}/${d}/${S.sid}`);
    attRef.on('value', s => { attDone = s.val(); attendDraw(); }, () => {});
  }
  let attTimer = 0;
  function attendDraw(){
    const box = $id('gaAtt'); if (!box) return;
    clearTimeout(attTimer);
    const now = Date.now() + S.off, open = attOpen && attOpen.until > now && attOpen.d === today();
    if (attDone && attOpen && attOpen.d === today()) box.innerHTML = `<span class="ga-ok">✅ 출석 ${hm(attDone.t)}</span>`;
    else if (open){
      if (!box.querySelector('input')) box.innerHTML = `<button class="ga-att">✋ 출석</button>`;
      const b = box.querySelector('.ga-att');
      if (b) b.onclick = () => {
        box.innerHTML = `<input id="gaK" inputmode="numeric" maxlength="4" placeholder="출석 코드"><button id="gaKgo">확인</button>`;
        const k = $id('gaK'); k.focus();
        k.oninput = () => { k.value = k.value.replace(/\D/g, '').slice(0, 4); };
        k.onkeydown = e => { if (e.key === 'Enter') $id('gaKgo').click(); };
        $id('gaKgo').onclick = () => ref(`attend/${S.c}/${attOpen.d}/${S.sid}`).set({t: TS(), k: k.value})
          .then(() => toast('✅ 출석했어요!'))
          .catch(() => { toast('출석 코드가 맞지 않거나 출석 시간이 끝났어요.'); box.innerHTML = ''; attendDraw(); });
      };
      attTimer = setTimeout(attendDraw, Math.min(30000, attOpen.until - now + 500));
    } else box.innerHTML = '';
  }

  /* 진도 저장: 활동을 마치거나 단계가 늘어날 때, 나갈 때 */
  let rec = null, saving = Promise.resolve();
  function save(patch){
    if (S.mode !== 'student' || !act) return;
    const p = `progress/${S.c}/${S.sid}/${act}`;
    saving = saving.then(() => ref(p).update(Object.assign({at: TS()}, patch))).catch(() => {});
  }
  function track(){   // 열었을 때 / 단계 이동
    const P = infoProgress.state; if (!P.total) return;
    const s = Math.max(P.maxStep, rec && rec.s || 0);
    if (!rec || s > (rec.s || 0)){ rec = Object.assign(rec || {}, {s, t: P.total}); save({s, t: P.total}); }
  }
  addEventListener('info:progress', e => {
    if (S.mode !== 'student') return;
    const d = e.detail, P = infoProgress.state;
    if (d.type === 'start' || d.type === 'step') track();
    else if (d.type === 'done'){
      track();
      if (d.expanded){ if (!(rec && rec.d)){ rec.x = true; save({x: true}); } }
      else { rec.d = true; save({d: true}); }
    } else if (d.type === 'quiz'){
      const id = String(d.id).replace(/[^A-Za-z0-9_-]/g, '').slice(0, 20) || 'quiz';
      const old = (rec && rec.q && rec.q[id]) || {};
      const q = {b: Math.max(old.b || 0, d.score), s: d.score, t: d.total, n: (old.n || 0) + 1, w: d.wrong.join(',').slice(0, 100)};
      rec = rec || {}; rec.q = Object.assign(rec.q || {}, {[id]: q});
      save({['q/' + id]: q});
    } else if (d.type === 'mission'){
      const id = String(d.id).replace(/[^A-Za-z0-9_-]/g, '').slice(0, 20) || 'm';
      save({['m/' + id]: true});
    } else if (d.type === 'leave'){
      const sec = Math.min(3600, d.sec || 0);
      if (sec > 2){ rec = rec || {}; rec.sec = Math.min(864000, (rec.sec || 0) + sec); save({sec: rec.sec}); }
    }
  });

  /* 목차 화면: 잠금 표시, 완료 표시, 오늘의 활동 */
  const actOf = href => { const f = String(href).split('/').filter(Boolean).pop() || ''; const m = f.match(/^(\d-\d{2})/); return m ? m[1] : null; };
  function decorate(){
    if (!isIndex) return;
    const teacher = S.mode === 'teacher';
    document.querySelectorAll('a.card').forEach(a => {
      const id = actOf(a.getAttribute('href')); if (!id) return;
      const locked = !teacher && !(S.open && S.open[id]);
      a.classList.toggle('ga-locked', locked);
      const h = a.querySelector('h2') || a;
      h.querySelectorAll('.ga-lockt,.ga-donet').forEach(x => x.remove());
      const pr = S.prog && S.prog[id];
      if (locked) h.insertAdjacentHTML('beforeend', '<span class="ga-lockt">🔒 잠김</span>');
      else if (pr && pr.d) h.insertAdjacentHTML('beforeend', '<span class="ga-donet">✅ 완료</span>');
      else if (pr && pr.s) h.insertAdjacentHTML('beforeend', `<span class="ga-lockt">${pr.s}/${pr.t}</span>`);
    });
    let box = $id('gaToday');
    const td = S.today && S.today.d === today() ? Object.keys(S.today.a || {}) : [];
    if (teacher || typeof contentsList === 'undefined'){ if (box) box.remove(); return; }
    if (!box){ box = document.createElement('div'); box.id = 'gaToday'; box.className = 'ga-today'; const m = document.querySelector('main'); m && m.prepend(box); }
    const items = td.map(id => contentsList.find(c => actOf(c.href) === id)).filter(Boolean);
    const ids = contentsList.map(c => actOf(c.href)).filter(Boolean), op = ids.filter(id => S.open && S.open[id]), pg = S.prog || {};
    const nd = ids.filter(id => pg[id] && pg[id].d).length, ning = ids.filter(id => pg[id] && !pg[id].d).length;
    const mine = `<div style="margin-top:${items.length ? 8 : 0}px"><b>📈 나의 학습</b> · 열린 활동 ${op.length}개 · ✅ 완료 ${nd}개 · 진행 중 ${ning}개${op.length && op.every(id => pg[id] && pg[id].d) ? ' · 🎉 열린 활동을 모두 끝냈어요!' : ''}</div>`;
    box.innerHTML = (items.length ? '<b>📌 오늘의 활동</b><br>' : '') + items.map(c => `<a href="${esc(c.href)}">${esc(c.icon || '')} ${esc(c.title)}${S.prog && S.prog[actOf(c.href)] && S.prog[actOf(c.href)].d ? ' ✅' : ''}</a>`).join('') + mine;
  }
  let mo = null;   // 단원 버튼으로 카드가 다시 그려지면 표시를 다시 붙임
  function watchCards(){
    if (!isIndex || mo) return;
    const opt = {childList: true, subtree: true};
    mo = new MutationObserver(() => { mo.disconnect(); decorate(); mo.observe(document.body, opt); });
    mo.observe(document.body, opt);
  }
  if (isIndex) document.addEventListener('click', e => { const a = e.target.closest && e.target.closest('a.card.ga-locked'); if (a){ e.preventDefault(); toast('🔒 아직 열리지 않은 활동이에요. 선생님이 열어 주시면 할 수 있어요.'); } }, true);

  /* ---------- 시작 ---------- */
  showLoading();
  const fail = setTimeout(() => { if (S.mode === 'loading') showError('체험관 서버에 연결하지 못했어요. 인터넷 연결을 확인하고 다시 시도하세요.'); }, 15000);
  fbLoad(['firebase-app-compat.js', 'firebase-auth-compat.js', 'firebase-database-compat.js']).then(() => {
    if (!firebase.apps.length) firebase.initializeApp(CFG);
    auth = firebase.auth(); db = firebase.database();
    if (EMU){ auth.useEmulator('http://127.0.0.1:9099', {disableWarnings: true}); db.useEmulator('127.0.0.1', 9000); }
    let first = true;
    auth.onAuthStateChanged(async u => {
      if (!first){   // 교사 구글 로그인 직후에는 새로 읽어 교사 모드로 시작
        if (u && !u.isAnonymous && S.mode === 'login') location.reload();
        return;
      }
      first = false;
      clearTimeout(fail);
      try {
        if (!u) return showLogin();
        if (u.isAnonymous) return await enterStudent(u);
        const ad = await ref('admins/' + u.uid).once('value').then(s => s.val(), () => null);
        if (ad === true){
          S.mode = 'teacher'; S.uid = u.uid; chip(); closeOverlay();
          if (isIndex){ decorate(); watchCards(); }
        } else { await auth.signOut(); showLogin('교사로 등록된 계정이 아니에요. 학생은 학번과 개인 코드로 로그인하세요.'); }
      } catch (e){ showError('정보를 불러오지 못했어요. 다시 시도해 주세요.'); }
    });
  }).catch(() => { clearTimeout(fail); showError('로그인 기능을 불러오지 못했어요. 인터넷 연결을 확인하세요.'); });
})();
