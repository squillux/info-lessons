/* 정보 개념 체험관 · 실시간 기능 (Firebase Realtime Database)
   1) liveVote(box, {act, items:[{t, sub, opts:[...]}]})        : 문항별 실시간 투표
   2) liveBoard(box, {act, title, limit, conf, input, render, text}): 학생 제출물 모으기(낱말·평점·응답·작품)
   - 학생 개인 정보는 저장하지 않는다. 서버에는 방 코드, 상태, '기기 임의 번호 → 제출 값'만 저장된다.
   - 교사: 방을 만든 기기에만 비밀 키가 남아 그 기기에서만 시작·마감·공개·숨기기를 조작할 수 있다.
   - 연결이 안 되면 각 활동의 기존(혼자 하기) 기능으로 수업한다. */
const LIVE_CFG = {
  apiKey: 'AIzaSyDJV6-cIM0-UO5Rpp4VYZeUlHbWP4svXGk',
  authDomain: 'info-lessons-live-sq.firebaseapp.com',
  databaseURL: 'https://info-lessons-live-sq-default-rtdb.asia-southeast1.firebasedatabase.app',
  projectId: 'info-lessons-live-sq',
  appId: '1:918252932246:web:32def6b205181da0c7c6b7',
};
const LIVE_SDK = 'https://www.gstatic.com/firebasejs/10.12.2/';

const LIVE = (() => {
  const css = `.lv-bar{display:flex;flex-wrap:wrap;gap:6px;margin:6px 0 12px}
.lv-bar .btn{font-size:.9rem}
.lv-room{display:flex;flex-wrap:wrap;align-items:center;gap:12px;background:var(--brand-soft);border-radius:16px;padding:10px 16px;margin-bottom:12px}
.lv-room .code{font-family:ui-monospace,Consolas,monospace;font-size:2.2rem;font-weight:800;letter-spacing:.15em;color:var(--brand)}
.lv-item{border:2px solid var(--line);border-radius:16px;padding:12px 14px;margin:10px 0;background:#fff}
.lv-item.open{border-color:var(--mint)}
.lv-st{display:inline-block;font-size:.75rem;font-weight:800;border-radius:999px;padding:1px 9px;margin-left:6px;vertical-align:middle;background:var(--bg);color:var(--muted)}
.lv-item.open .lv-st,.lv-st.on{background:var(--mint-soft);color:#0d7d71}
.lv-ctl{display:flex;flex-wrap:wrap;gap:6px;margin-top:8px}
.lv-ctl .btn{font-size:.85rem;padding:6px 12px}
.lv-res{display:grid;gap:4px;margin-top:8px}
.lv-row{display:grid;grid-template-columns:7em 1fr 3em;gap:8px;align-items:center;font-size:.9rem}
.lv-row .tr{height:16px;background:var(--bg);border-radius:999px;overflow:hidden}
.lv-row .tr i{display:block;height:100%;width:0;background:var(--brand);transition:width .4s}
.lv-row:nth-child(2) .tr i{background:var(--pink)}
.lv-row:nth-child(3) .tr i{background:var(--on)}
.lv-msg{font-size:.9rem;color:var(--muted);margin-top:6px}
.lv-mod{display:flex;flex-wrap:wrap;gap:6px;margin-top:8px;max-height:220px;overflow:auto}
.lv-mod button{border:1px solid var(--line);background:#fff;border-radius:10px;padding:3px 8px;font-size:.85rem;color:var(--ink)}
.lv-mod button.hid{text-decoration:line-through;opacity:.45}
.lv-out{margin-top:10px}
.lv-keep{display:flex;flex-wrap:wrap;gap:6px;align-items:center;border:2px dashed var(--line);border-radius:14px;padding:8px 10px;margin:-4px 0 12px}
.lv-keep .btn{font-size:.85rem;padding:5px 10px}
.lv-keep .hint{flex-basis:100%;margin:0}
.lv-room .qr{background:#fff;padding:6px;border-radius:10px;line-height:0}
.lv-room .qr img,.lv-room .qr canvas{width:120px;height:120px}
.lv-url{font-size:.85rem;word-break:break-all}
.lv-bar[hidden]{display:none}
.lv-ann{flex-basis:100%;display:flex;flex-wrap:wrap;gap:6px;align-items:center;border-top:1px dashed #b9c8f5;padding-top:8px}
.lv-ann select{font:inherit;padding:5px 8px;border:2px solid var(--line);border-radius:10px;background:#fff}
.lv-ann .hint{flex-basis:100%;margin:0}
.lv-tch{align-self:center;font-size:.8rem;font-weight:800;color:#0d7d71;background:var(--mint-soft);border-radius:999px;padding:2px 10px}
.lv-over{position:fixed;inset:0;z-index:100;background:rgba(15,20,35,.75);display:flex;align-items:center;justify-content:center;padding:16px}
.lv-over-in{background:#fff;border-radius:20px;padding:20px;text-align:center;max-width:95vw}
.lv-over-in b{font-family:ui-monospace,Consolas,monospace;font-size:2.4rem;letter-spacing:.15em;color:var(--brand)}
.qr-big{display:inline-block;line-height:0}
.qr-big img,.qr-big canvas{max-width:80vw;height:auto}`;
  const s = document.createElement('style'); s.textContent = css; document.head.appendChild(s);

  const ls = {get(k){ try { return localStorage.getItem(k); } catch(e){ return null; } }, set(k, v){ try { localStorage.setItem(k, v); } catch(e){} }};
  const rnd = n => Array.from(crypto.getRandomValues(new Uint8Array(n)), b => 'abcdefghijklmnopqrstuvwxyz0123456789'[b % 36]).join('');
  const esc = s => String(s).replace(/[<>&"]/g, c => ({'<':'&lt;','>':'&gt;','&':'&amp;','"':'&quot;'}[c]));
  const dev = () => { let d = ls.get('live:dev'); if (!d || !/^[a-z0-9]{20}$/.test(d)){ d = rnd(20); ls.set('live:dev', d); } return d; };
  let db = null;
  function loadSdk(){
    // auth.js와 같은 SDK 파일을 한 번만 불러오도록 함께 쓰는 목록(__fbScripts)을 사용
    const R = window.__fbScripts = window.__fbScripts || {};
    const add = f => R[f] = R[f] || new Promise((ok, no) => { const sc = document.createElement('script'); sc.src = LIVE_SDK + f; sc.onload = ok; sc.onerror = () => { delete R[f]; no(new Error('sdk')); }; document.head.appendChild(sc); });
    return add('firebase-app-compat.js').then(() => add('firebase-auth-compat.js')).then(() => add('firebase-database-compat.js'));
  }
  const local = /^(localhost|127\.0\.0\.1)$/.test(location.hostname);
  const EMU = local && (/[?&]emu\b/.test(location.search) || (() => { try { return sessionStorage.getItem('emu') === '1'; } catch(e){ return false; } })());
  function init(){
    if (!firebase.apps.length) firebase.initializeApp(LIVE_CFG);
    if (EMU && !window.__fbEmuSet){ window.__fbEmuSet = true; try { firebase.auth().useEmulator('http://127.0.0.1:9099', {disableWarnings: true}); firebase.database().useEmulator('127.0.0.1', 9000); } catch(e){} }
  }
  /* 이 기기가 교사 구글 계정(admins 등록)으로 로그인되어 있으면 교사 버튼을 보여 준다. 학생 화면에는 방 코드 입력만. */
  let teacherP = null;
  function isTeacher(){
    return teacherP = teacherP || loadSdk().then(() => { init(); const auth = firebase.auth();
      return new Promise(res => { const off = auth.onAuthStateChanged(u => { off();
        if (!u || u.isAnonymous) return res(false);
        firebase.database().ref('admins/' + u.uid).once('value').then(s => res(s.val() === true), () => res(false)); }); });
    }).catch(() => false);
  }
  function connect(){
    return loadSdk().then(() => {
      init();
      db = firebase.database();
      return Promise.race([db.ref('.info/serverTimeOffset').once('value'), new Promise((_, no) => setTimeout(() => no(new Error('timeout')), 15000))]);
    }).then(() => db);
  }
  /* 교사 방: 같은 활동의 이전 방이 있으면 이어서, 없으면 새로 만든다 */
  /* 보관 기간(KEEP_DAYS일)이 지난 방은 교사가 새 방을 열 때 자동으로 지움 (무료 요금제에서는 서버 예약 삭제를 쓸 수 없어서) */
  const KEEP_DAYS = 30;
  async function prune(){
    try {
      const s = await db.ref('idx').once('value'), cut = Date.now() - KEEP_DAYS * 86400000, old = Object.entries(s.val() || {}).filter(([, t]) => t < cut).slice(0, 15);
      for (const [c] of old) await db.ref().update({[`rooms/${c}`]: null, [`votes/${c}`]: null, [`posts/${c}`]: null, [`keys/${c}`]: null, [`ctl/${c}`]: null, [`idx/${c}`]: null}).catch(() => {});
    } catch(e){}
  }
  /* 결과를 스프레드시트로: CSV 내려받기(엑셀·구글 시트에서 열림), 표 복사(붙여넣기) */
  const stamp = () => { const d = new Date(), p = n => String(n).padStart(2, '0'); return `${d.getFullYear()}${p(d.getMonth() + 1)}${p(d.getDate())}_${p(d.getHours())}${p(d.getMinutes())}`; };
  function download(name, rows){
    const csv = '﻿' + rows.map(r => r.map(v => '"' + String(v ?? '').replace(/"/g, '""') + '"').join(',')).join('\r\n');
    const a = document.createElement('a'); a.href = URL.createObjectURL(new Blob([csv], {type: 'text/csv;charset=utf-8'})); a.download = `${name}_${stamp()}.csv`; document.body.appendChild(a); a.click(); setTimeout(() => { URL.revokeObjectURL(a.href); a.remove(); }, 500);
  }
  const copyTSV = rows => navigator.clipboard?.writeText(rows.map(r => r.map(v => String(v ?? '').replace(/[\t\n]/g, ' ')).join('\t')).join('\n'));
  function keepBar(name, getRows, room, after){
    const d = document.createElement('div'); d.className = 'lv-keep';
    d.innerHTML = '<b>💾 기록 남기기</b><button class="btn line" data-k="csv">📥 결과 내려받기(CSV)</button><button class="btn line" data-k="copy">📋 표 복사</button><button class="btn line" data-k="del">🗑 수업 끝 · 기록 지우기</button><span class="hint">내려받은 파일은 엑셀·구글 시트에서 열려요. 표 복사 후 시트에 붙여 넣어도 돼요. 기록은 ' + KEEP_DAYS + '일이 지나면 자동으로 지워져요.</span>';
    d.querySelector('[data-k=csv]').onclick = () => download(name, getRows());
    d.querySelector('[data-k=copy]').onclick = e => { const p = copyTSV(getRows()); p && p.then(() => e.target.textContent = '✅ 복사했어요').catch(() => {}); };
    d.querySelector('[data-k=del]').onclick = async () => { if (!confirm('이 방의 모든 투표·제출 기록을 서버에서 지울까요? 지운 기록은 되살릴 수 없어요. (먼저 결과를 내려받으세요)')) return; await room.erase().catch(() => alert('지우지 못했어요. 인터넷 연결을 확인해 주세요.')); after(); };
    return d;
  }
  async function teacherRoom(act, init, fresh){
    await connect();
    let last = null; try { last = JSON.parse(ls.get('live:last:' + act) || 'null'); } catch(e){}
    let room = null;
    if (!fresh && last && last.key){
      const snap = await db.ref('rooms/' + last.code + '/pub').once('value').catch(() => null);
      if (snap && snap.exists() && snap.val().act === act) room = {code: last.code, key: last.key, pub: snap.val()};
    }
    if (!room){
      for (let tries = 0; tries < 8 && !room; tries++){
        const c = String(1000 + Math.floor(Math.random() * 9000)), k = rnd(32);
        try { await db.ref('keys/' + c).set(k); room = {code: c, key: k, pub: Object.assign({t: 0, act}, init)}; } catch(e){}
      }
      if (!room) throw new Error('방을 만들 수 없어요');
      ls.set('live:last:' + act, JSON.stringify({code: room.code, key: room.key}));
      room.fresh = true;
    }
    room.save = () => { const t = Math.max(Date.now(), (room.pub.t || 0) + 1); room.pub.t = t; return db.ref().update({[`ctl/${room.code}/${room.key}/t`]: t, [`rooms/${room.code}/pub`]: room.pub}).then(() => db.ref(`idx/${room.code}`).set(t).catch(() => {})); };
    /* 수업 끝: 이 방의 모든 기록 지우기 (비밀 키가 있는 기기만 가능) */
    room.erase = () => { ls.set('live:last:' + act, ''); unannounce(room.code); return db.ref().update({[`rooms/${room.code}`]: null, [`votes/${room.code}`]: null, [`posts/${room.code}`]: null, [`idx/${room.code}`]: null, [`keys/${room.code}`]: null, [`ctl/${room.code}/${room.key}`]: null}); };
    prune();
    if (room.fresh) await room.save();
    return room;
  }
  const joinParam = (new URLSearchParams(location.search).get('join') || '').match(/^[0-9]{4}$/)?.[0] || null;
  const hostParam = /[?&]host\b/.test(location.search);   // 교사용 관리 화면의 [▶ 실행]으로 열었을 때
  /* 반 학생 화면에 알리기: liveNow/{반} = {act, code, path, t, until}. 학생 로그인을 쓰는 학생 화면에 [참여하기]가 뜬다. */
  const CLASSES = Array.from({length: 12}, (_, i) => '1-' + String(i + 1).padStart(2, '0'));
  let ann = null, annAuto = hostParam;
  const actId = () => (window.infoProgress && infoProgress.state.act) || '';
  function announce(c, code){
    if (!CLASSES.includes(c) || !/^[1-5]-\d\d$/.test(actId())) return Promise.reject(new Error('bad'));
    const t = Date.now(), prev = ann;
    return db.ref('liveNow/' + c).set({act: actId(), code, path: location.pathname, t, until: t + 2 * 3600000}).then(() => {
      if (prev && prev.c !== c) db.ref('liveNow/' + prev.c).remove().catch(() => {});
      ann = {c, code}; ls.set('tc:class', c);
    });
  }
  function unannounce(code){
    const c = ann ? ann.c : ls.get('tc:class'); ann = null;
    if (!c || !db) return Promise.resolve();
    return db.ref('liveNow/' + c).once('value').then(s => { const v = s.val(); if (v && (!code || v.code === code)) return db.ref('liveNow/' + c).remove(); }).catch(() => {});
  }
  function annBar(code){
    const an = document.createElement('div'); an.className = 'lv-ann';
    const cur = ls.get('tc:class') || '1-01';
    an.innerHTML = `<b>📢 반 학생 화면에 알리기</b><select class="inp">${CLASSES.map(c => `<option value="${c}"${c === cur ? ' selected' : ''}>1학년 ${+c.slice(2)}반</option>`).join('')}</select><button class="btn line" data-an>알리기</button><button class="btn line" data-off hidden>알림 끄기</button><span class="hint" data-as></span>`;
    const sel = an.querySelector('select'), st = an.querySelector('[data-as]'), on = an.querySelector('[data-an]'), offB = an.querySelector('[data-off]');
    const show = v => { offB.hidden = !v; on.textContent = v ? '다시 알리기' : '알리기'; st.textContent = v ? `✅ ${+sel.value.slice(2)}반 학생 화면에 [참여하기] 알림이 떠 있어요.` : '로그인한 학생 화면에 [참여하기] 버튼이 떠서 코드를 입력하지 않아도 돼요.'; };
    on.onclick = () => announce(sel.value, code).then(() => show(true)).catch(() => { st.textContent = '⚠️ 알리지 못했어요. 교사 계정으로 로그인했는지 확인하세요.'; });
    offB.onclick = () => unannounce().then(() => show(false));
    show(false);
    if (ann || annAuto){ annAuto = false; if (ann) sel.value = ann.c; on.click(); }
    return an;
  }
  /* 교사 화면: 방 코드 + 학생용 주소(QR) */
  const roomBar = (code, onNew) => { const d = document.createElement('div'); d.className = 'lv-room';
    const url = location.origin + location.pathname + '?join=' + code;
    d.innerHTML = `<div class="qr" title="학생용 주소 QR"></div><div><span>방 코드</span> <span class="code">${code}</span>
      <p class="hint" style="margin:4px 0">학생은 <b>방 코드 4자리를 입력</b>하거나, <b>QR 코드를 찍거나</b> 아래 주소로 들어오면 바로 참여해요.</p>
      <p style="margin:4px 0"><code class="lv-url">${url.replace(/^https?:[/][/]/, '')}</code></p>
      <div class="lv-ctl"><button class="btn line" data-big>🔍 QR 크게 보기</button><button class="btn line" data-c>🔗 학생용 주소 복사</button><button class="btn line" data-n>새 방 만들기</button></div></div>`;
    d.querySelector('[data-n]').onclick = onNew;
    d.querySelector('[data-c]').onclick = e => { navigator.clipboard?.writeText(url).then(() => e.target.textContent = '✅ 복사했어요').catch(() => {}); };
    d.querySelector('[data-big]').onclick = () => {
      const ov = document.createElement('div'); ov.className = 'lv-over';
      ov.innerHTML = `<div class="lv-over-in"><div class="qr-big"></div><p>방 코드 <b>${code}</b></p><p class="hint">휴대폰·태블릿 카메라로 QR 코드를 찍으면 바로 참여해요.</p><button class="btn">닫기</button></div>`;
      ov.onclick = e => { if (e.target === ov || e.target.tagName === 'BUTTON') ov.remove(); };
      document.body.appendChild(ov);
      const s = Math.min(innerWidth, innerHeight) * .62;
      try { new QRCode(ov.querySelector('.qr-big'), {text: url, width: s, height: s, correctLevel: QRCode.CorrectLevel.M}); } catch(e){ ov.querySelector('.qr-big').textContent = url; }
    };
    const qrEl = d.querySelector('.qr');
    const draw = () => { try { new QRCode(qrEl, {text: url, width: 120, height: 120, correctLevel: QRCode.CorrectLevel.M}); } catch(e){ qrEl.remove(); } };
    if (window.QRCode) draw(); else { const sc = document.createElement('script'); sc.src = 'https://cdnjs.cloudflare.com/ajax/libs/qrcodejs/1.0.0/qrcode.min.js'; sc.onload = draw; sc.onerror = () => qrEl.remove(); document.head.appendChild(sc); }
    d.appendChild(annBar(code));
    return d; };
  const failBox = el => { el.innerHTML = `<p class="feedback show bad">⚠️ 실시간 서버에 연결할 수 없어요(학교 인터넷 차단 등). 이 활동의 기본 기능으로 진행해 주세요.</p><button class="btn line" onclick="location.reload()">🔄 다시 연결하기</button>`; };
  function joinForm(el, act, onJoin){
    el.innerHTML = `<p>선생님 화면의 <b>방 코드 4자리</b>를 입력하세요.</p><p><input class="inp" inputmode="numeric" maxlength="4" style="width:140px"> <button class="btn">참여하기</button></p><div class="feedback"></div>`;
    const inp = el.querySelector('input'), fb = el.querySelector('.feedback');
    const go = async () => {
      const c = inp.value.trim();
      if (!/^\d{4}$/.test(c)) return feedback(fb, false, '숫자 4자리를 입력하세요.');
      feedback(fb, true, '연결하는 중…');
      try { await connect(); } catch(e){ return failBox(el); }
      const snap = await db.ref('rooms/' + c + '/pub').once('value').catch(() => null);
      if (!snap || !snap.exists() || snap.val().act !== act) return feedback(fb, false, '이 활동에 열린 방이 아니에요. 번호를 다시 확인하세요.');
      onJoin(c, snap.val());
    };
    el.querySelector('button').onclick = go; inp.onkeydown = e => { if (e.key === 'Enter') go(); };
    if (joinParam){ inp.value = joinParam; go(); }
  }
  /* 모드 버튼: 학생 화면에는 '방 코드로 참여'(+ 혼자 하기)만, 교사 계정으로 로그인한 기기에는 교사 버튼까지 */
  const TEACHER_ONLY = ['teacher', 'hand'];
  const goCard = box => setTimeout(() => { const all = document.getElementById('allBtn'); if (all && document.querySelector('main .locked')) all.click(); box.scrollIntoView({block: 'start'}); window.scrollBy(0, -80); }, 300);
  function bar(box, modes, onPick, start){
    const b = document.createElement('div'); b.className = 'lv-bar';
    box.prepend(b);
    let cur = null, teacherOn = false;
    const paint = () => b.querySelectorAll('.btn').forEach(x => x.classList.toggle('line', x.dataset.m !== cur));
    const pick = m => { cur = m; paint(); onPick(m); };
    const draw = list => {
      b.innerHTML = (teacherOn ? '<span class="lv-tch">👩‍🏫 교사 기기</span>' : '') + list.map(([m, label]) => `<button class="btn line" data-m="${m}">${label}</button>`).join('');
      b.querySelectorAll('.btn').forEach(x => x.onclick = () => pick(x.dataset.m));
      b.hidden = list.length < 2; paint();
    };
    const sm = modes.filter(m => !TEACHER_ONLY.includes(m[0]));
    draw(sm);
    if (joinParam && sm.some(m => m[0] === 'student')){ pick('student'); goCard(box); }   // 학생용 주소(?join=코드): 펼치고 이 카드로 이동해 바로 참여
    else pick(sm.some(m => m[0] === start) ? start : 'student');
    isTeacher().then(t => {
      if (!t) return;
      teacherOn = true; draw(modes);
      if (hostParam && box === document.querySelector('.lv-bar')?.parentElement){ pick('teacher'); goCard(box); }   // 교사용 관리 화면에서 [▶ 실행]
      else if (!joinParam && cur === 'student' && start && start !== 'student') pick(start);
    });
  }
  /* 실시간 카드가 있는 페이지: 상단에 바로 가기 버튼 */
  setTimeout(() => {
    const tools = document.querySelector('header.top .tools'), first = document.querySelector('.lv-bar');
    if (!tools || !first || document.getElementById('liveBtn')) return;
    const b = document.createElement('button'); b.className = 'tool'; b.id = 'liveBtn'; b.title = '실시간 투표·모으기로 바로 가기'; b.innerHTML = '📡 <span>실시간</span>';
    b.onclick = () => { if (document.querySelector('main .locked')) document.getElementById('allBtn')?.click(); setTimeout(() => { first.parentElement.scrollIntoView({block: "start"}); scrollBy(0, -80); }, 50); };
    tools.prepend(b);
  }, 0);
  /* 흔한 비속어·욕설이 들어 있으면 보내지 않음 (완벽하지 않으므로 교사 숨기기 기능과 함께 사용) */
  const BAD = ['씨발','시발','씨바','ㅅㅂ','ㅆㅂ','병신','ㅂㅅ','븅신','개새','개색','좆','존나','졸라','지랄','ㅈㄹ','닥쳐','꺼져','미친놈','미친년','니애미','느금','엠창','fuck','shit'];
  const bad = v => { const s = String(v).toLowerCase().replace(/[\s._*~!?,-]/g, '').replace(/시발(점|역)/g, ''); return BAD.some(w => s.includes(w)); };   // '시발점' 같은 바른 낱말은 허용
  return {bad, ls, rnd, esc, dev, connect, teacherRoom, keepBar, roomBar, failBox, joinForm, bar, isTeacher, get db(){ return db; }};
})();

/* ============ 1) 실시간 투표 ============ */
function liveVote(box, cfg){
  const items = cfg.items, act = cfg.act, esc = LIVE.esc;
  let mode = null, room = null, code = null, pub = null, offs = [];
  const counts = items.map(it => it.opts.map(() => 0));
  const mine = {};
  box.innerHTML = `<div class="lv-top"></div><div class="lv-items"></div>`;
  const top = box.querySelector('.lv-top'), list = box.querySelector('.lv-items');
  const cleanup = () => { offs.forEach(f => f()); offs = []; };

  function drawRes(i, el){
    const c = counts[i], tot = c.reduce((a, b) => a + b, 0);
    el.innerHTML = items[i].opts.map((o, k) => `<div class="lv-row"><span>${esc(o)}</span><span class="tr"><i style="width:${tot ? c[k] / tot * 100 : 0}%"></i></span><b>${c[k]}</b></div>`).join('') +
      `<div class="lv-msg">참여 ${tot}명${tot ? ' · ' + summary(i) : ''}</div>`;
  }
  function summary(i){
    const c = counts[i], mx = Math.max(...c), win = c.filter(x => x === mx).length;
    return win > 1 ? '⚖️ 의견이 똑같이 나뉘었어요. 서로의 근거를 더 들어 볼까요?' : `'${items[i].opts[c.indexOf(mx)]}' 의견이 가장 많아요. 다른 의견을 고른 친구의 근거도 들어 봐요.`;
  }
  const head = (it, i) => `<p><b>${i + 1}. ${esc(it.t)}</b><span class="lv-st"></span></p>${it.sub ? `<p class="hint" style="margin:2px 0">${it.sub}</p>` : ''}`;

  function hand(){
    cleanup(); mode = 'hand'; top.innerHTML = '<p class="hint">손을 든 학생 수만큼 선생님이 버튼을 눌러 기록해요. (저장되지 않아요.)</p>';
    list.innerHTML = items.map((it, i) => `<div class="lv-item" data-i="${i}">${head(it, i)}<div class="lv-ctl">${it.opts.map((o, k) => `<button class="opt" data-k="${k}">${esc(o)} +1</button>`).join('')}<button class="btn line" data-r>초기화</button></div><div class="lv-res"></div></div>`).join('');
    list.querySelectorAll('.lv-item').forEach(el => {
      const i = +el.dataset.i, res = el.querySelector('.lv-res');
      el.querySelector('.lv-st').textContent = '손으로 세기';
      el.querySelectorAll('[data-k]').forEach(b => b.onclick = () => { counts[i][+b.dataset.k]++; drawRes(i, res); });
      el.querySelector('[data-r]').onclick = () => { counts[i] = counts[i].map(() => 0); drawRes(i, res); };
      drawRes(i, res);
    });
  }
  async function teacher(fresh){
    cleanup(); mode = 'teacher'; top.innerHTML = '<p class="hint">실시간 서버에 연결하는 중…</p>'; list.innerHTML = '';
    try { room = await LIVE.teacherRoom(act, {q: Object.fromEntries(items.map((_, i) => [i, {open: false, show: false, round: 1}]))}, fresh); } catch(e){ return LIVE.failBox(top); }
    code = room.code; pub = room.pub;
    top.innerHTML = ''; top.appendChild(LIVE.roomBar(code, () => teacher(true)));
    top.appendChild(LIVE.keepBar('투표결과_' + act, () => [['문항', '선택지', '표 수', '참여 수']].concat(...items.map((it, i) => it.opts.map((o, k) => [it.t, o, counts[i][k], counts[i].reduce((a, b) => a + b, 0)]))), room, () => { cleanup(); top.innerHTML = '<p class="feedback show ok">🗑 기록을 모두 지웠어요. 새 수업을 하려면 위의 [교사] 버튼을 다시 누르세요.</p>'; list.innerHTML = ''; }));
    list.innerHTML = items.map((it, i) => `<div class="lv-item" data-i="${i}">${head(it, i)}<div class="lv-ctl">
        <button class="btn" data-a="open"></button><button class="btn line" data-a="show"></button><button class="btn line" data-a="again">🔄 다시 투표</button></div><div class="lv-res"></div></div>`).join('');
    list.querySelectorAll('.lv-item').forEach(el => {
      const i = +el.dataset.i, res = el.querySelector('.lv-res');
      const paint = () => { const q = pub.q[i]; el.classList.toggle('open', q.open); el.querySelector('.lv-st').textContent = q.open ? '투표 중' : '닫힘';
        el.querySelector('[data-a=open]').textContent = q.open ? '⏹ 투표 종료' : '▶ 투표 시작';
        el.querySelector('[data-a=show]').textContent = q.show ? '🙈 학생 화면에서 결과 숨기기' : '📊 학생 화면에 결과 공개'; };
      el.querySelector('[data-a=open]').onclick = () => { pub.q[i].open = !pub.q[i].open; paint(); room.save(); };
      el.querySelector('[data-a=show]').onclick = () => { pub.q[i].show = !pub.q[i].show; paint(); room.save(); };
      el.querySelector('[data-a=again]').onclick = () => { if (!confirm('이 문항의 투표 결과를 지우고 다시 투표할까요?')) return; pub.q[i].round++; pub.q[i].open = false; pub.q[i].show = false; paint(); room.save(); listen(i, () => drawRes(i, res)); };
      paint(); listen(i, () => drawRes(i, res));
    });
  }
  const lOffs = {};
  function listen(i, after){
    if (lOffs[i]) lOffs[i]();
    const ref = LIVE.db.ref(`votes/${code}/${i}/${pub.q[i].round}`);
    const h = ref.on('value', s => {
      counts[i] = items[i].opts.map(() => 0); const v = s.val() || {};
      Object.entries(v).forEach(([d, k]) => { if (counts[i][k] !== undefined) counts[i][k]++; if (d === LIVE.dev()) mine[i] = k; });
      after();
    });
    lOffs[i] = () => ref.off('value', h); offs.push(lOffs[i]);
  }
  function student(){
    cleanup(); mode = 'student'; list.innerHTML = '';
    LIVE.joinForm(top, act, (c, p) => { code = c; pub = p; studentRoom(); });
  }
  function studentRoom(){
    top.innerHTML = `<div class="lv-room"><span>참여한 방</span><span class="code">${code}</span><span class="hint">선생님이 투표를 시작하면 버튼을 누를 수 있어요. 이름은 저장되지 않아요.</span></div>`;
    list.innerHTML = items.map((it, i) => `<div class="lv-item" data-i="${i}">${head(it, i)}<div class="lv-ctl">${it.opts.map((o, k) => `<button class="opt" data-k="${k}">${esc(o)}</button>`).join('')}</div><div class="lv-msg"></div><div class="lv-res"></div></div>`).join('');
    list.querySelectorAll('.lv-item').forEach(el => {
      const i = +el.dataset.i;
      el.querySelectorAll('[data-k]').forEach(b => b.onclick = () => {
        if (!pub.q[i].open || i in mine) return;
        const k = +b.dataset.k; mine[i] = k; paintS(i);
        LIVE.db.ref(`votes/${code}/${i}/${pub.q[i].round}/${LIVE.dev()}`).set(k).catch(() => { delete mine[i]; paintS(i); el.querySelector('.lv-msg').textContent = '⚠️ 투표가 닫혔거나 이미 투표했어요.'; });
      });
    });
    const ref = LIVE.db.ref('rooms/' + code + '/pub'), rounds = {};
    const h = ref.on('value', s => {
      if (!s.exists()) return; pub = s.val();
      items.forEach((_, i) => { if (rounds[i] !== pub.q[i].round){ if (rounds[i] !== undefined) delete mine[i]; rounds[i] = pub.q[i].round; listen(i, () => paintS(i)); } paintS(i); });
    });
    offs.push(() => ref.off('value', h));
  }
  function paintS(i){
    const el = list.querySelector(`.lv-item[data-i="${i}"]`); if (!el || !pub) return;
    const q = pub.q[i], voted = i in mine;
    el.classList.toggle('open', q.open);
    el.querySelector('.lv-st').textContent = q.open ? '투표 중' : '닫힘';
    el.querySelectorAll('[data-k]').forEach(b => { b.disabled = !q.open || voted; b.classList.toggle('right', voted && +b.dataset.k === mine[i]); });
    el.querySelector('.lv-msg').textContent = voted ? '✅ 투표했어요.' : q.open ? '👆 내 생각과 같은 쪽을 눌러요.' : '⏳ 선생님이 투표를 시작하면 누를 수 있어요.';
    const res = el.querySelector('.lv-res');
    if (q.show) drawRes(i, res); else res.innerHTML = '';
  }
  LIVE.bar(box, [['teacher', '🧑‍🏫 교사: 실시간 투표 열기'], ['student', '🙋 방 코드로 참여'], ['hand', '✋ 손으로 세기']], m => ({teacher: () => teacher(false), student, hand})[m](), 'hand');
}

/* ============ 2) 실시간 모으기 판 ============
   cfg = {act, title, limit(기기당 제출 수, 기본 3),
          conf()           : (교사) 학생에게 보낼 설정 문자열 — 없으면 생략
          input(el, send, conf, role) : 학생 입력 화면을 el에 만든다. send(문자열) → Promise
          render(posts, el, role, conf): 모은 값 보여 주기. posts = [{id, v}] (숨긴 것 제외)
          text(v)          : 교사 숨기기 목록에 보일 짧은 글 (기본: v 앞 40자)} */
function liveBoard(box, cfg){
  const act = cfg.act, limit = cfg.limit || 3, esc = LIVE.esc;
  const text = cfg.text || (v => String(v).slice(0, 40));
  let room = null, code = null, pub = null, offs = [], posts = {}, sent = 0, lastConf = null;
  box.innerHTML = `<div class="lv-top"></div><div class="lv-body"></div>`;
  const top = box.querySelector('.lv-top'), body = box.querySelector('.lv-body');
  const cleanup = () => { offs.forEach(f => f()); offs = []; posts = {}; };
  const visible = () => Object.entries(posts).filter(([id]) => !(pub.hide || {})[id]).map(([id, v]) => ({id, v}));
  function listenPosts(after){
    const ref = LIVE.db.ref(`posts/${code}/${pub.round}`);
    const h = ref.on('value', s => {
      posts = {}; const v = s.val() || {};
      Object.entries(v).forEach(([d, arr]) => Object.entries(arr || {}).forEach(([n, val]) => posts[d + '_' + n] = val));
      after();
    });
    offs.push(() => ref.off('value', h));
  }
  function off(){ cleanup(); top.innerHTML = '<p class="hint">💻 수업 시간에 선생님이 방 코드를 보여 주면 <b>🙋 방 코드로 참여</b>를 누르고 코드를 입력하세요. 반 친구들의 생각이 한 화면에 모여요. 이름은 저장되지 않아요.</p>'; body.innerHTML = ''; }

  async function teacher(fresh){
    cleanup(); top.innerHTML = '<p class="hint">실시간 서버에 연결하는 중…</p>'; body.innerHTML = '';
    try { room = await LIVE.teacherRoom(act, {open: false, show: false, round: 1, cfg: cfg.conf ? cfg.conf() : ''}, fresh); } catch(e){ return LIVE.failBox(top); }
    code = room.code; pub = room.pub; pub.hide = pub.hide || {};
    top.innerHTML = ''; top.appendChild(LIVE.roomBar(code, () => teacher(true)));
    const flat = v => { try { const o = JSON.parse(v); return o && typeof o === 'object' ? Object.values(o).map(x => Array.isArray(x) ? x.map(y => typeof y === 'object' ? Object.values(y).join(' ') : y).join(' / ') : x).join(' | ') : String(v); } catch(e){ return String(v); } };
    top.appendChild(LIVE.keepBar('제출기록_' + act, () => [['번호', '제출 내용', '숨김']].concat(Object.entries(posts).map(([id, v], i) => [i + 1, flat(v), (pub.hide || {})[id] ? '숨김' : ''])), room, () => { cleanup(); top.innerHTML = '<p class="feedback show ok">🗑 기록을 모두 지웠어요. 새 수업을 하려면 위의 [교사] 버튼을 다시 누르세요.</p>'; body.innerHTML = ''; }));
    body.innerHTML = `<div class="lv-item"><p><b>${esc(cfg.title || '실시간 모으기')}</b><span class="lv-st"></span></p>
      <div class="lv-ctl"><button class="btn" data-a="open"></button><button class="btn line" data-a="show"></button>${cfg.conf ? '<button class="btn line" data-a="conf">📤 지금 설정을 학생에게 보내기</button>' : ''}<button class="btn line" data-a="again">🔄 모두 지우고 새로 받기</button></div>
      <div class="lv-msg"></div><details style="margin-top:6px"><summary class="hint">🙈 부적절한 제출물 숨기기 (눌러서 펼치기)</summary><div class="lv-mod"></div></details></div><div class="lv-out"></div>`;
    const it = body.querySelector('.lv-item'), out = body.querySelector('.lv-out');
    const paint = () => { it.classList.toggle('open', pub.open); it.querySelector('.lv-st').textContent = pub.open ? '받는 중' : '닫힘';
      it.querySelector('[data-a=open]').textContent = pub.open ? '⏹ 받기 마감' : '▶ 받기 시작';
      it.querySelector('[data-a=show]').textContent = pub.show ? '🙈 학생 화면에서 결과 숨기기' : '📊 학생 화면에 결과 공개'; };
    const draw = () => {
      const all = Object.entries(posts);
      it.querySelector('.lv-msg').textContent = `제출 ${all.length}개 · 참여 기기 ${new Set(all.map(([id]) => id.split('_')[0])).size}대`;
      it.querySelector('.lv-mod').innerHTML = all.map(([id, v]) => `<button data-id="${id}" class="${pub.hide[id] ? 'hid' : ''}" title="눌러서 숨기기/보이기">${esc(text(v))}</button>`).join('') || '<span class="hint">아직 제출물이 없어요.</span>';
      it.querySelectorAll('.lv-mod [data-id]').forEach(b => b.onclick = () => { const id = b.dataset.id; if (pub.hide[id]) delete pub.hide[id]; else pub.hide[id] = true; room.save(); draw(); });
      cfg.render(visible(), out, 'teacher', pub.cfg);
    };
    it.querySelector('[data-a=open]').onclick = () => { pub.open = !pub.open; paint(); room.save(); };
    it.querySelector('[data-a=show]').onclick = () => { pub.show = !pub.show; paint(); room.save(); };
    if (cfg.conf) it.querySelector('[data-a=conf]').onclick = () => { pub.cfg = cfg.conf(); room.save(); feedback(it.querySelector('.lv-msg'), true, '📤 설정을 보냈어요.'); };
    it.querySelector('[data-a=again]').onclick = () => { if (!confirm('지금까지 받은 제출물을 모두 지우고 새로 받을까요?')) return; pub.round++; pub.hide = {}; pub.open = false; pub.show = false; paint(); room.save(); cleanupPosts(); listenPosts(draw); draw(); };
    const cleanupPosts = () => { offs.forEach(f => f()); offs = []; posts = {}; };
    paint(); listenPosts(draw); draw();
  }
  function student(){
    cleanup(); body.innerHTML = '';
    LIVE.joinForm(top, act, (c, p) => { code = c; pub = p; studentRoom(); });
  }
  function studentRoom(){
    top.innerHTML = `<div class="lv-room"><span>참여한 방</span><span class="code">${code}</span><span class="hint">이름은 저장되지 않아요. 친구를 존중하는 말만 보내요.</span></div>`;
    body.innerHTML = `<div class="lv-item"><p><b>${esc(cfg.title || '실시간 모으기')}</b><span class="lv-st"></span></p><div class="lv-in"></div><div class="lv-msg"></div></div><div class="lv-out"></div>`;
    const it = body.querySelector('.lv-item'), inEl = body.querySelector('.lv-in'), out = body.querySelector('.lv-out');
    let round = null, warn = '';
    const mineCount = () => Object.keys(posts).filter(id => id.startsWith(LIVE.dev() + '_')).length;
    const send = v => {
      if (!pub.open) return Promise.reject(new Error('closed'));
      if (LIVE.bad(v)){ warn = '⚠️ 친구를 존중하는 말로 다시 써 주세요. 바르지 않은 말은 보낼 수 없어요. · '; paint(); return Promise.reject(new Error('bad')); }
      warn = '';
      const n = mineCount(); if (n >= limit) return Promise.reject(new Error('limit'));
      return LIVE.db.ref(`posts/${code}/${pub.round}/${LIVE.dev()}/${n}`).set(String(v).slice(0, 1500)).catch(e => { throw e; });
    };
    const paint = () => {
      it.classList.toggle('open', pub.open); it.querySelector('.lv-st').textContent = pub.open ? '받는 중' : '닫힘';
      const n = mineCount();
      it.querySelector('.lv-msg').textContent = warn + (!pub.open ? '⏳ 선생님이 받기를 시작하면 보낼 수 있어요.' : n >= limit ? `✅ ${limit}개를 모두 보냈어요.` : `보낸 개수 ${n} / ${limit}`);
      inEl.querySelectorAll('button,input,textarea,select').forEach(x => x.disabled = !pub.open || n >= limit);
      if (pub.show) cfg.render(visible(), out, 'student', pub.cfg); else out.innerHTML = '';
    };
    const ref = LIVE.db.ref('rooms/' + code + '/pub');
    const h = ref.on('value', s => {
      if (!s.exists()) return; pub = s.val(); pub.hide = pub.hide || {};
      if (pub.cfg !== lastConf || !inEl.childElementCount){ lastConf = pub.cfg; inEl.innerHTML = ''; cfg.input(inEl, v => send(v).then(paint), pub.cfg, 'student'); }
      if (round !== pub.round){ round = pub.round; offs.filter((_, k) => k > 0).forEach(f => f()); offs = offs.slice(0, 1); listenPosts(paint); }
      paint();
    });
    offs.push(() => ref.off('value', h));
  }
  LIVE.bar(box, [['teacher', '🧑‍🏫 교사: 실시간으로 모으기'], ['student', '🙋 방 코드로 참여'], ['off', '혼자 하기']], m => ({teacher: () => teacher(false), student, off})[m](), 'off');
}
