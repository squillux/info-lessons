/* 정보 개념 체험관 · 교사용 관리 화면
   구글 로그인 → admins/{uid} 확인 → 반별 열기·잠금, 출석·접속, 진도표, 누가기록, 명단·개인 코드, 내보내기·정리 */
(() => {
  const CFG = {
    apiKey: 'AIzaSyDJV6-cIM0-UO5Rpp4VYZeUlHbWP4svXGk',
    authDomain: 'info-lessons-live-sq.firebaseapp.com',
    databaseURL: 'https://info-lessons-live-sq-default-rtdb.asia-southeast1.firebasedatabase.app',
    projectId: 'info-lessons-live-sq',
    appId: '1:918252932246:web:32def6b205181da0c7c6b7',
  };
  const SDK = 'https://www.gstatic.com/firebasejs/10.12.2/';
  const local = /^(localhost|127\.0\.0\.1)$/.test(location.hostname);
  const EMU = local && (/[?&]emu\b/.test(location.search) || (() => { try { return sessionStorage.getItem('emu') === '1'; } catch (e) { return false; } })());
  if (EMU) try { sessionStorage.setItem('emu', '1'); } catch (e) {}

  const $ = s => document.querySelector(s), $$ = s => [...document.querySelectorAll(s)];
  const esc = s => String(s == null ? '' : s).replace(/[<>&"]/g, c => ({'<': '&lt;', '>': '&gt;', '&': '&amp;', '"': '&quot;'}[c]));
  const pad = n => String(n).padStart(2, '0');
  let off = 0;
  const now = () => Date.now() + off;
  const dstr = t => { const d = new Date(t); return d.getFullYear() + '-' + pad(d.getMonth() + 1) + '-' + pad(d.getDate()); };
  const today = () => dstr(now());
  const hm = t => t ? (d => pad(d.getHours()) + ':' + pad(d.getMinutes()))(new Date(t)) : '';
  const ls = {get(k, d){ try { return localStorage.getItem(k) || d; } catch (e){ return d; } }, set(k, v){ try { localStorage.setItem(k, v); } catch (e){} }};
  const CLASSES = Array.from({length: 12}, (_, i) => '1-' + pad(i + 1));
  const cname = c => '1학년 ' + (+c.slice(2)) + '반';
  const actOf = href => { const f = String(href).split('/').filter(Boolean).pop() || ''; const m = f.match(/^(\d-\d{2})/); return m ? m[1] : null; };
  const ACTS = contentsList.filter(c => !c.lesson && actOf(c.href)).map(c => ({id: actOf(c.href), unit: c.unit, title: c.title, icon: c.icon || '', core: c.core !== false}));
  const ROMAN = ['', 'Ⅰ', 'Ⅱ', 'Ⅲ', 'Ⅳ', 'Ⅴ'];
  const PIN_CH = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
  const genPin = () => Array.from(crypto.getRandomValues(new Uint8Array(6)), b => PIN_CH[b % 32]).join('');
  const msg = (el, ok, m) => { el.textContent = m; el.className = 'feedback show ' + (ok ? 'ok' : 'bad'); };
  function csv(name, rows){
    const t = '﻿' + rows.map(r => r.map(v => { v = String(v == null ? '' : v); return /[",\n]/.test(v) ? '"' + v.replace(/"/g, '""') + '"' : v; }).join(',')).join('\r\n');
    const a = document.createElement('a'); a.href = URL.createObjectURL(new Blob([t], {type: 'text/csv;charset=utf-8'})); a.download = name; document.body.appendChild(a); a.click(); setTimeout(() => { URL.revokeObjectURL(a.href); a.remove(); }, 1000);
  }

  let auth, db;
  const ref = p => db.ref(p);
  const TS = () => firebase.database.ServerValue.TIMESTAMP;
  const T = {c: ls.get('tc:class', '1-01'), tab: ls.get('tc:tab', 'open'), unit: +ls.get('tc:unit', '1'), roster: {}, pins: {}};
  let offs = [];
  const listen = (p, cb) => { const r = ref(p); const f = s => cb(s.val()); r.on('value', f, e => console.warn(p, e.code)); offs.push(() => r.off('value', f)); };
  const clearListen = () => { offs.forEach(f => f()); offs = []; };

  function fbLoad(files){
    const R = window.__fbScripts = window.__fbScripts || {};
    return files.reduce((p, f) => p.then(() => R[f] = R[f] || new Promise((ok, no) => {
      const s = document.createElement('script'); s.src = SDK + f; s.onload = ok;
      s.onerror = () => { delete R[f]; no(new Error('sdk')); }; document.head.appendChild(s);
    })), Promise.resolve());
  }

  /* ---------- 로그인 ---------- */
  function loginView(m){
    $('#view').innerHTML = `<div class="card" style="max-width:460px;margin:30px auto">
      <h3>🔐 교사 로그인</h3><p>등록된 선생님 구글 계정으로 로그인하세요.</p>
      <button class="btn" id="gIn">G 구글 계정으로 로그인</button><div class="feedback${m ? ' show bad' : ''}" id="lfb">${esc(m || '')}</div></div>`;
    $('#gIn').onclick = async () => {
      try {
        if (EMU){
          const em = new URLSearchParams(location.search).get('temail') || prompt('에뮬레이터 교사 이메일', 'teacher@test.kr'); if (!em) return;
          await auth.signInWithCredential(firebase.auth.GoogleAuthProvider.credential(JSON.stringify({sub: 'g-' + em, email: em, email_verified: true})));
        } else { const p = new firebase.auth.GoogleAuthProvider(); p.setCustomParameters({prompt: 'select_account'}); await auth.signInWithPopup(p); }
      } catch (e){ msg($('#lfb'), false, e.code === 'auth/popup-blocked' ? '팝업이 막혔어요. 팝업을 허용해 주세요.' : '로그인하지 못했어요. (' + (e.code || '') + ')'); }
    };
  }
  function notAdmin(u){
    $('#view').innerHTML = `<div class="card" style="max-width:520px;margin:30px auto"><h3>⛔ 교사로 등록되지 않은 계정이에요</h3>
      <p>처음 쓰는 선생님 계정이면 관리자에게 아래 <b>사용자 번호</b>를 알려 교사로 등록해 달라고 하세요.</p>
      <p><code style="font-size:1rem;word-break:break-all">${esc(u.uid)}</code></p><button class="btn line" id="lo">로그아웃</button></div>`;
    $('#lo').onclick = () => auth.signOut().then(() => location.reload());
  }

  async function start(u){
    $('#who').innerHTML = `${esc(u.email || '')} · <a href="#" id="lo2">로그아웃</a>`;
    $('#lo2').onclick = e => { e.preventDefault(); auth.signOut().then(() => location.reload()); };
    const sel = $('#cls');
    sel.innerHTML = CLASSES.map(c => `<option value="${c}">${cname(c)}</option>`).join('');
    sel.value = CLASSES.includes(T.c) ? T.c : '1-01'; T.c = sel.value; sel.hidden = false;
    sel.onchange = () => { T.c = sel.value; ls.set('tc:class', T.c); render(); };
    $('#tabs').hidden = false;
    $$('#tabs button').forEach(b => b.onclick = () => { T.tab = b.dataset.t; ls.set('tc:tab', T.tab); render(); });
    ref('.info/serverTimeOffset').on('value', s => { off = s.val() || 0; });
    // 명단·코드는 늘 최신으로 (모든 반)
    ref('roster').on('value', s => { T.roster = s.val() || {}; if (['attend', 'prog', 'notes', 'roster'].includes(T.tab)) softRender(); });
    ref('pins').on('value', s => { T.pins = s.val() || {}; if (T.tab === 'roster') softRender(); });
    render();
  }
  const students = c => Object.entries(T.roster).filter(([, r]) => r.c === c).map(([sid, r]) => Object.assign({sid}, r)).sort((a, b) => a.sid.localeCompare(b.sid));

  /* ---------- 화면 전환 ---------- */
  let soft = null;   // 같은 탭 안에서 데이터만 바뀌었을 때 다시 그리는 함수
  function softRender(){ if (soft) soft(); }
  function render(){
    clearListen(); soft = null;
    $$('#tabs button').forEach(b => b.classList.toggle('on', b.dataset.t === T.tab));
    const v = $('#view'); v.innerHTML = '';
    ({open: vOpen, live: vLive, attend: vAttend, prog: vProg, notes: vNotes, roster: vRoster, data: vData}[T.tab] || vOpen)(v);
  }

  /* ---------- 📡 실시간 활동 실행 ---------- */
  function vLive(v){
    const L = contentsList.filter(c => c.live && actOf(c.href));
    v.insertAdjacentHTML('beforeend', `<div class="card"><h3>📡 실시간 활동 실행</h3>
      <p class="hint">[▶ 실행]을 누르면 새 탭에서 활동이 <b>교사 모드</b>로 열리고, 방 코드와 QR 코드가 바로 만들어져요. 그 탭을 전자칠판에 띄우세요. 학생 화면에는 <b>방 코드 입력 칸</b>만 보여요.
      로그인한 <b>${cname(T.c)}</b> 학생 화면에는 [참여하기] 알림이 함께 떠서 코드를 입력하지 않아도 돼요. (반은 위쪽에서 바꿀 수 있어요)</p>
      <div id="lnow"></div>
      <div class="acts">${[1, 2, 3, 4, 5].map(u => { const g = L.filter(c => c.unit === u); return g.length ? `<p style="margin:10px 0 0"><b>${ROMAN[u]} ${esc((unitList.find(x => x.unit === u) || {}).name || '')}</b></p>` + g.map(c => { const id = actOf(c.href);
        return `<div class="act"><span class="nm"><b>${esc(c.icon || '')} ${esc(c.title)}</b><small>${ROMAN[u]}-${+id.slice(2)}</small></span><a class="btn" style="padding:6px 14px" target="_blank" href="../${esc(c.href)}?host=1${EMU ? '&emu' : ''}">▶ 실행</a></div>`; }).join('') : ''; }).join('')}</div></div>`);
    listen('liveNow/' + T.c, x => {
      const el = $('#lnow'); if (!el) return;
      const c = x && contentsList.find(a => actOf(a.href) === x.act);
      el.innerHTML = x && x.until > now() ? `<div class="att-box"><div>📢 지금 ${cname(T.c)} 학생 화면에 알림 중<br><b>${esc(c ? c.title : x.act)}</b> · 방 코드 <b style="font-family:ui-monospace,Consolas,monospace;font-size:1.3rem">${esc(x.code)}</b></div><button class="btn line" id="lOff">알림 끄기</button></div>` : '';
      const b = $('#lOff'); if (b) b.onclick = () => ref('liveNow/' + T.c).remove();
    });
  }
  const unitSeg = (v, cb) => {
    const d = document.createElement('div'); d.className = 'seg';
    d.innerHTML = [1, 2, 3, 4, 5].map(u => `<button data-u="${u}" class="${T.unit === u ? 'on' : ''}">${ROMAN[u]} ${esc((unitList.find(x => x.unit === u) || {}).name || '')}</button>`).join('');
    d.querySelectorAll('button').forEach(b => b.onclick = () => { T.unit = +b.dataset.u; ls.set('tc:unit', T.unit); d.querySelectorAll('button').forEach(x => x.classList.toggle('on', x === b)); cb(); });
    v.appendChild(d);
  };

  /* ---------- 🔓 열기·잠금 + 오늘의 활동 ---------- */
  function vOpen(v){
    v.insertAdjacentHTML('beforeend', `<div class="card"><h3>🔓 ${cname(T.c)} 활동 열기·잠금</h3>
      <p class="hint">처음에는 모든 활동이 잠겨 있어요. 스위치를 켠 활동만 학생이 할 수 있고, 학생 화면에 바로 반영돼요. <b>📌 오늘</b>을 누르면 학생 목차 맨 위에 '오늘의 활동'으로 보이고, 그 활동도 함께 열려요.</p><div id="useg"></div>
      ${typeof LOGIN_ON !== 'undefined' && !LOGIN_ON ? `<p class="feedback show bad">⚠️ 지금은 <b>학생 로그인이 꺼져 있어서</b> 학생들은 로그인 없이 모든 활동을 할 수 있고, 잠금과 기록이 적용되지 않아요. 명단 등록과 개인 코드 준비는 미리 해 둘 수 있어요. (켜기: assets/contents.js의 LOGIN_ON) <a href="../index.html?login" target="_blank">🔐 로그인을 켠 체험관 미리 보기 ↗</a> (이 기기에서는 교사 모드로 열려요. 학생 화면은 학번·개인 코드로 확인)</p>` : ''}
      <div class="row"><button class="btn ghost" id="allOn">이 단원 모두 열기</button><button class="btn line" id="allOff">이 단원 모두 잠그기</button><button class="btn line" id="clrToday">오늘의 활동 비우기</button></div>
      <div class="acts" id="acts"></div>
      <details class="noprint" style="margin-top:14px"><summary><b>📋 이 반의 열림 설정을 다른 반에 복사</b></summary>
        <div class="row" id="cpy">${CLASSES.filter(c => c !== T.c).map(c => `<label><input type="checkbox" value="${c}"> ${+c.slice(2)}반</label>`).join(' ')}</div>
        <div class="row"><button class="btn line" id="cpAll">모두 선택</button><button class="btn" id="cpGo">복사하기</button></div><div class="feedback" id="cpFb"></div></details></div>`);
    let open = {}, td = {};
    const draw = () => {
      const isT = td.d === today() ? (td.a || {}) : {};
      $('#acts').innerHTML = ACTS.filter(a => a.unit === T.unit).map(a => `<div class="act${open[a.id] ? ' open' : ''}">
        <button class="sw${open[a.id] ? ' on' : ''}" data-a="${a.id}" aria-label="${esc(a.title)} 열기"></button>
        <span class="nm"><b>${esc(a.icon)} ${esc(a.title)}</b><small>${ROMAN[a.unit]}-${+a.id.slice(2)} · ${a.core ? '★ 핵심' : '☆ 선택'} · ${open[a.id] ? '열림' : '🔒 잠김'}</small></span>
        <button class="pin-btn${isT[a.id] ? ' on' : ''}" data-p="${a.id}">📌 오늘</button></div>`).join('');
      $$('#acts .sw').forEach(b => b.onclick = () => ref(`open/${T.c}/${b.dataset.a}`).set(open[b.dataset.a] ? null : true));
      $$('#acts .pin-btn').forEach(b => b.onclick = () => {
        const id = b.dataset.p, a = Object.assign({}, isT);
        if (a[id]) delete a[id]; else a[id] = true;
        const up = {[`today/${T.c}`]: Object.keys(a).length ? {d: today(), a} : null};
        if (a[id]) up[`open/${T.c}/${id}`] = true;
        ref().update(up);
      });
    };
    unitSeg($('#useg'), draw);
    const setUnit = val => { const up = {}; ACTS.filter(a => a.unit === T.unit).forEach(a => up[`open/${T.c}/${a.id}`] = val || null); ref().update(up); };
    $('#allOn').onclick = () => setUnit(true);
    $('#allOff').onclick = () => setUnit(false);
    $('#clrToday').onclick = () => ref('today/' + T.c).remove();
    $('#cpAll').onclick = () => $$('#cpy input').forEach(i => i.checked = true);
    $('#cpGo').onclick = () => {
      const to = $$('#cpy input:checked').map(i => i.value);
      if (!to.length) return msg($('#cpFb'), false, '복사할 반을 고르세요.');
      if (!confirm(`${cname(T.c)}의 열림 설정을 ${to.length}개 반에 똑같이 덮어쓸까요?`)) return;
      const up = {}; to.forEach(c => up['open/' + c] = Object.keys(open).length ? open : null);
      ref().update(up).then(() => msg($('#cpFb'), true, `✅ ${to.map(c => +c.slice(2) + '반').join(', ')}에 복사했어요.`)).catch(() => msg($('#cpFb'), false, '복사하지 못했어요.'));
    };
    listen('open/' + T.c, x => { open = x || {}; draw(); });
    listen('today/' + T.c, x => { td = x || {}; draw(); });
  }

  /* ---------- ✋ 출석·접속 ---------- */
  function vAttend(v){
    const d0 = ls.get('tc:adate', '') && ls.get('tc:adate') === today() ? today() : today();
    v.insertAdjacentHTML('beforeend', `<div class="card"><h3>✋ ${cname(T.c)} 출석·접속 기록</h3>
      <div class="row"><label>날짜 <input type="date" class="in" id="ad" value="${d0}"></label><span class="sp"></span></div>
      <div id="attCtl"></div><div class="scroll-x"><table class="t" id="attT"></table></div>
      <p class="hint">출석은 학생이 [✋ 출석]을 누르고 칠판의 출석 코드를 입력한 기록이에요. 접속은 학생이 로그인해 체험관을 연 기록이에요(자동). 표의 출석 칸을 누르면 직접 출석 처리·취소할 수 있어요.</p></div>`);
    let ao = null, att = {}, vis = {}, tick = 0;
    const d = () => $('#ad').value || today();
    const ctl = () => {
      clearTimeout(tick);
      const box = $('#attCtl'); if (!box) return;
      if (d() !== today()){ box.innerHTML = '<p class="hint">지난 날짜의 기록을 보고 있어요.</p>'; return; }
      const openNow = ao && ao.d === today() && ao.until > now();
      if (openNow){
        const left = Math.max(0, Math.round((ao.until - now()) / 1000));
        box.innerHTML = `<div class="att-box"><div>출석 코드<div class="big-code" id="kc">${esc(T.key || '····')}</div></div>
          <div><b>남은 시간 ${Math.floor(left / 60)}:${pad(left % 60)}</b><div class="row"><button class="btn" id="aBig">🔍 크게 보기</button><button class="btn line" id="aMore">5분 연장</button><button class="btn line" id="aEnd">출석 마감</button></div></div></div>`;
        $('#aBig').onclick = () => { const o = document.createElement('div'); o.className = 'over'; o.innerHTML = `<div>출석 코드 (화면을 누르면 닫혀요)</div><div class="big-code">${esc(T.key || '')}</div><div>학생 화면 왼쪽 아래 [✋ 출석]을 누르고 입력하세요</div>`; o.onclick = () => o.remove(); document.body.appendChild(o); };
        $('#aMore').onclick = () => ref(`attendOpen/${T.c}/until`).set(ao.until + 300000);
        $('#aEnd').onclick = () => ref(`attendOpen/${T.c}/until`).set(now() - 1000);
        tick = setTimeout(ctl, 1000);
      } else {
        box.innerHTML = `<div class="row"><button class="btn" id="aGo">✋ 출석 시작 (10분)</button><span class="hint">누르면 4자리 출석 코드가 만들어져요. 전자칠판에 띄워 주세요.</span></div>`;
        $('#aGo').onclick = () => {
          const k = String(crypto.getRandomValues(new Uint16Array(1))[0] % 10000).padStart(4, '0');
          T.key = k;
          ref().update({[`attendKey/${T.c}`]: k, [`attendOpen/${T.c}`]: {d: today(), until: now() + 600000}}).catch(e => alert('출석을 시작하지 못했어요. ' + e.code));
        };
      }
    };
    const table = () => {
      const st = students(T.c), t = $('#attT'); if (!t) return;
      if (!st.length){ t.innerHTML = '<tr><td>명단이 없어요. [👥 명단·코드]에서 먼저 등록하세요.</td></tr>'; return; }
      const nA = st.filter(s => att[s.sid]).length, nV = st.filter(s => vis[s.sid]).length;
      t.innerHTML = `<tr><th>번호</th><th class="l">이름</th><th>출석 (${nA}/${st.length})</th><th>첫 접속</th><th>마지막 접속</th><th>접속 횟수 (${nV}명)</th></tr>` + st.map(s => {
        const a = att[s.sid], x = vis[s.sid];
        return `<tr><td>${s.no}</td><td class="l">${esc(s.n)}</td><td class="click ${a ? 'ok' : 'no'}" data-s="${s.sid}">${a ? '✅ ' + hm(a.t) + (a.k === 'T' ? ' (교사)' : '') : '미출석'}</td><td>${x ? hm(x.f) : ''}</td><td>${x ? hm(x.l) : ''}</td><td>${x ? x.n : ''}</td></tr>`;
      }).join('');
      t.querySelectorAll('td[data-s]').forEach(td => td.onclick = () => {
        const sid = td.dataset.s, p = `attend/${T.c}/${d()}/${sid}`, nm = (T.roster[sid] || {}).n;
        if (att[sid]){ if (confirm(`${nm} 학생의 출석을 취소할까요?`)) ref(p).remove(); }
        else if (confirm(`${nm} 학생을 출석으로 처리할까요?`)) ref(p).set({t: TS(), k: 'T'});
      });
    };
    soft = table;
    const sub = () => {
      clearListen();
      listen('attendOpen/' + T.c, x => { ao = x; ctl(); });
      listen('attendKey/' + T.c, x => { T.key = x; ctl(); });
      listen(`attend/${T.c}/${d()}`, x => { att = x || {}; table(); });
      listen(`visits/${T.c}/${d()}`, x => { vis = x || {}; table(); });
    };
    $('#ad').onchange = () => { ctl(); sub(); };
    sub();
  }

  /* ---------- 📊 진도표 ---------- */
  function vProg(v){
    v.insertAdjacentHTML('beforeend', `<div class="card"><h3>📊 ${cname(T.c)} 진도표</h3><div id="useg"></div>
      <p class="mini">✅ 완료 · <span style="background:var(--yellow-soft);padding:0 4px">3/7</span> 진행 중(도달 단계) · ⏭ 펼치기로 건너뜀 · 칸 아래 숫자는 확인 미션 최고 점수. <b>활동 이름</b>을 누르면 문항별 오답 통계, <b>학생 이름</b>을 누르면 학생별 기록과 누가기록을 볼 수 있어요.</p>
      <div class="scroll-x"><table class="t" id="pT"></table></div><div id="pd"></div></div>`);
    let P = {}, N = {};
    const cell = r => {
      if (!r) return ['', ''];
      const q = r.q ? Object.values(r.q) : [];
      const qs = q.length ? `<div class="mini">${q.map(x => x.b + '/' + x.t).join(' ')}</div>` : '';
      if (r.d) return ['done', '✅' + qs];
      if (r.x) return ['skip', '⏭' + qs];
      return ['part', (r.s || 0) + '/' + (r.t || '?') + qs];
    };
    const draw = () => {
      const st = students(T.c), acts = ACTS.filter(a => a.unit === T.unit), t = $('#pT'); if (!t) return;
      if (!st.length){ t.innerHTML = '<tr><td>명단이 없어요. [👥 명단·코드]에서 먼저 등록하세요.</td></tr>'; return; }
      const head = `<tr><th>번호</th><th class="l">이름</th>${acts.map(a => `<th class="click" data-a="${a.id}" title="${esc(a.title)}">${ROMAN[a.unit]}-${+a.id.slice(2)}<div class="mini">${esc(a.title.slice(0, 7))}</div></th>`).join('')}<th>완료</th></tr>`;
      const rows = st.map(s => {
        const pr = P[s.sid] || {}; let n = 0;
        const tds = acts.map(a => { const [k, h] = cell(pr[a.id]); if (k === 'done') n++; return `<td class="${k}">${h}</td>`; }).join('');
        return `<tr><td>${s.no}</td><td class="l click" data-s="${s.sid}">${esc(s.n)}</td>${tds}<td><b>${n}</b>/${acts.length}</td></tr>`;
      }).join('');
      const foot = `<tr><th></th><th class="l">완료한 학생</th>${acts.map(a => `<th>${st.filter(s => (P[s.sid] || {})[a.id] && P[s.sid][a.id].d).length}</th>`).join('')}<th></th></tr>`;
      t.innerHTML = head + rows + foot;
      t.querySelectorAll('th[data-a]').forEach(h => h.onclick = () => stats(h.dataset.a));
      t.querySelectorAll('td[data-s]').forEach(h => h.onclick = () => detail(h.dataset.s));
    };
    const stats = id => {
      const a = ACTS.find(x => x.id === id), st = students(T.c), by = {};
      st.forEach(s => { const r = (P[s.sid] || {})[id]; if (r && r.q) Object.entries(r.q).forEach(([qid, q]) => { const b = by[qid] = by[qid] || {n: 0, sum: 0, t: q.t, wrong: {}}; b.n++; b.sum += q.b; (q.w ? q.w.split(',') : []).forEach(w => { if (w !== '') b.wrong[w] = (b.wrong[w] || 0) + 1; }); }); });
      const done = st.filter(s => ((P[s.sid] || {})[id] || {}).d).length, started = st.filter(s => (P[s.sid] || {})[id]).length;
      $('#pd').innerHTML = `<div class="panel"><h3>${esc(a.icon)} ${esc(a.title)} · 반 통계</h3><p>시작 ${started}명 · 완료 ${done}명 / ${st.length}명</p>${Object.keys(by).length ? Object.entries(by).map(([qid, b]) => `<p><b>${Object.keys(by).length > 1 ? '확인 미션 ' + esc(qid.replace(/^quiz/, '') || '1') : '확인 미션'}</b> · 푼 학생 ${b.n}명 · 평균 최고 점수 ${(b.sum / b.n).toFixed(1)} / ${b.t}</p>
        <table class="t"><tr><th>문항</th><th class="l">마지막 풀이에서 틀린 학생 수</th></tr>${Array.from({length: b.t}, (_, i) => { const w = b.wrong[i] || 0; return `<tr><td>${i + 1}번</td><td class="l"><span class="bar" style="width:${Math.round(w / b.n * 160)}px"></span> ${w}명</td></tr>`; }).join('')}</table>`).join('') : '<p class="hint">아직 확인 미션을 푼 학생이 없어요.</p>'}</div>`;
      $('#pd').scrollIntoView({behavior: 'smooth', block: 'nearest'});
    };
    const detail = sid => {
      const s = T.roster[sid], pr = P[sid] || {};
      const rows = ACTS.filter(a => pr[a.id]).map(a => { const r = pr[a.id], [k, h] = cell(r); return `<tr><td class="l">${ROMAN[a.unit]}-${+a.id.slice(2)} ${esc(a.title)}</td><td class="${k}">${h}</td><td>${r.sec ? Math.round(r.sec / 60) + '분' : ''}</td><td>${r.at ? dstr(r.at).slice(5) + ' ' + hm(r.at) : ''}</td></tr>`; }).join('');
      const ns = Object.entries(N[sid] || {}).sort((a, b) => b[1].t - a[1].t);
      $('#pd').innerHTML = `<div class="panel"><h3>👤 ${+sid.slice(1, 3)}반 ${s.no}번 ${esc(s.n)}</h3>
        <div class="scroll-x"><table class="t"><tr><th class="l">활동</th><th>상태</th><th>머문 시간</th><th>마지막 기록</th></tr>${rows || '<tr><td colspan="4">아직 기록이 없어요.</td></tr>'}</table></div>
        <h3 style="margin-top:14px">📝 누가기록</h3>
        <div class="row"><select class="in" id="nAct"><option value="">(활동 선택 안 함)</option>${ACTS.map(a => `<option value="${a.id}">${ROMAN[a.unit]}-${+a.id.slice(2)} ${esc(a.title)}</option>`).join('')}</select></div>
        <textarea class="in" id="nTx" rows="2" maxlength="500" placeholder="관찰 내용 (예: 이진수 변환 원리를 친구에게 정확히 설명함)"></textarea>
        <div class="row"><button class="btn" id="nGo">기록 추가</button></div>
        ${ns.map(([k, n]) => `<div class="note"><small>${dstr(n.t)}${n.a ? ' · ' + esc(n.a) : ''}</small> ${esc(n.x)}</div>`).join('') || '<p class="hint">아직 누가기록이 없어요.</p>'}</div>`;
      $('#nGo').onclick = () => { const x = $('#nTx').value.trim(); if (!x) return; const o = {t: TS(), x}; if ($('#nAct').value) o.a = $('#nAct').value; ref(`notes/${T.c}/${sid}`).push(o).then(() => detail(sid)); };
      $('#pd').scrollIntoView({behavior: 'smooth', block: 'nearest'});
    };
    unitSeg($('#useg'), draw);
    soft = draw;
    listen('progress/' + T.c, x => { P = x || {}; draw(); });
    listen('notes/' + T.c, x => { N = x || {}; });
  }

  /* ---------- 📝 누가기록 ---------- */
  function vNotes(v){
    v.insertAdjacentHTML('beforeend', `<div class="card"><h3>📝 ${cname(T.c)} 누가기록</h3>
      <div class="row"><select class="in" id="nSt"></select><select class="in" id="nAct"><option value="">(활동 선택 안 함)</option>${ACTS.map(a => `<option value="${a.id}">${ROMAN[a.unit]}-${+a.id.slice(2)} ${esc(a.title)}</option>`).join('')}</select></div>
      <textarea class="in" id="nTx" rows="2" maxlength="500" placeholder="관찰 내용"></textarea>
      <div class="row"><button class="btn" id="nGo">기록 추가</button><button class="btn line" id="nCsv">CSV 내려받기</button></div><div class="feedback" id="nFb"></div>
      <div id="nList"></div></div>`);
    let N = {};
    const draw = () => {
      const st = students(T.c), sel = $('#nSt'); if (!sel) return;
      const keep = sel.value;
      sel.innerHTML = st.length ? st.map(s => `<option value="${s.sid}">${s.no}번 ${esc(s.n)}</option>`).join('') : '<option value="">명단 없음</option>';
      if (keep) sel.value = keep;
      const all = [];
      Object.entries(N).forEach(([sid, ns]) => Object.entries(ns || {}).forEach(([k, n]) => all.push(Object.assign({sid, k}, n))));
      all.sort((a, b) => b.t - a.t);
      $('#nList').innerHTML = all.length ? all.map(n => { const s = T.roster[n.sid] || {}; return `<div class="note"><small>${dstr(n.t)} · ${s.no || ''}번 ${esc(s.n || n.sid)}${n.a ? ' · ' + esc(n.a) : ''}</small> ${esc(n.x)} <button class="pin-btn" data-del="${n.sid}/${n.k}">삭제</button></div>`; }).join('') : '<p class="hint">아직 누가기록이 없어요. 진도표에서 학생 이름을 눌러도 기록할 수 있어요.</p>';
      $$('#nList [data-del]').forEach(b => b.onclick = () => { if (confirm('이 기록을 지울까요?')) ref(`notes/${T.c}/${b.dataset.del}`).remove(); });
    };
    $('#nGo').onclick = () => {
      const sid = $('#nSt').value, x = $('#nTx').value.trim();
      if (!sid || !x) return msg($('#nFb'), false, '학생과 내용을 입력하세요.');
      const o = {t: TS(), x}; if ($('#nAct').value) o.a = $('#nAct').value;
      ref(`notes/${T.c}/${sid}`).push(o).then(() => { $('#nTx').value = ''; msg($('#nFb'), true, '✅ 저장했어요.'); }).catch(() => msg($('#nFb'), false, '저장하지 못했어요.'));
    };
    $('#nCsv').onclick = () => {
      const rows = [['날짜', '학번', '번호', '이름', '활동', '내용']];
      Object.entries(N).forEach(([sid, ns]) => Object.values(ns || {}).sort((a, b) => a.t - b.t).forEach(n => { const s = T.roster[sid] || {}; const a = ACTS.find(x => x.id === n.a); rows.push([dstr(n.t), sid, s.no || '', s.n || '', a ? a.id + ' ' + a.title : '', n.x]); }));
      csv(`누가기록_${cname(T.c)}_${today()}.csv`, rows);
    };
    soft = draw;
    listen('notes/' + T.c, x => { N = x || {}; draw(); });
  }

  /* ---------- 👥 명단·코드 ---------- */
  function vRoster(v){
    v.insertAdjacentHTML('beforeend', `<div class="card"><h3>👥 명단 등록</h3>
      <p class="hint">엑셀에서 <b>학번, 이름</b> 두 칸(또는 <b>반, 번호, 이름</b> 세 칸)을 복사해 붙여 넣으세요. 여러 반을 한 번에 넣어도 돼요. 새 학생에게는 개인 코드가 자동으로 만들어져요. 이미 있는 학번은 이름만 바뀌어요.</p>
      <textarea class="in" id="rIn" rows="6" placeholder="10301	김하늘&#10;10302	이바다&#10;또는&#10;3	1	김하늘"></textarea>
      <div class="row"><button class="btn line" id="rChk">미리 보기</button><button class="btn" id="rGo" disabled>등록하기</button></div><div class="feedback" id="rFb"></div><div id="rPrev"></div></div>
      <div class="card"><h3>${cname(T.c)} 명단과 개인 코드</h3>
      <div class="row"><button class="btn line" id="rShow">👁 코드 보기</button><button class="btn" id="rPrint">🖨 코드 쪽지 인쇄</button></div>
      <div class="scroll-x"><table class="t" id="rT"></table></div>
      <p class="hint">개인 코드는 학생의 비밀번호예요. 잃어버렸거나 친구에게 알려졌으면 [재발급]을 누르세요. 예전 코드로 로그인한 기기는 바로 기록이 막혀요.</p></div>`);
    let parsed = [], showPin = false;
    const parse = txt => {
      const out = [], bad = [];
      txt.split(/\r?\n/).map(l => l.trim()).filter(Boolean).forEach(l => {
        const t = l.split(/\t|,|\s{2,}|\s(?=\S)/).map(x => x.trim()).filter(Boolean);
        let sid, n;
        if (/^1\d{4}$/.test(t[0])){ sid = t[0]; n = t.slice(1).join(' '); }
        else if (/^\d{1,2}$/.test(t[0]) && /^\d{1,2}$/.test(t[1] || '')){ sid = '1' + pad(+t[0]) + pad(+t[1]); n = t.slice(2).join(' '); }
        if (sid && /^1(0[1-9]|1[0-2])(0[1-9]|[1-5][0-9])$/.test(sid) && n && n.length <= 20 && !/^(이름|성명)$/.test(n)) out.push({sid, n});
        else if (!/학번|이름|성명|번호/.test(l)) bad.push(l);
      });
      return {out, bad};
    };
    $('#rChk').onclick = () => {
      const {out, bad} = parse($('#rIn').value); parsed = out;
      $('#rGo').disabled = !out.length;
      $('#rPrev').innerHTML = (out.length ? `<p><b>${out.length}명</b>을 등록할 수 있어요.${out.some(o => T.roster[o.sid]) ? ' (이미 있는 학번은 이름만 바뀌어요)' : ''}</p><div class="scroll-x"><table class="t"><tr><th>학번</th><th>반</th><th>번호</th><th class="l">이름</th><th></th></tr>${out.map(o => `<tr><td>${o.sid}</td><td>${+o.sid.slice(1, 3)}</td><td>${+o.sid.slice(3)}</td><td class="l">${esc(o.n)}</td><td>${T.roster[o.sid] ? '기존' : '새 학생'}</td></tr>`).join('')}</table></div>` : '')
        + (bad.length ? `<p class="feedback show bad">읽지 못한 줄 ${bad.length}개: ${bad.slice(0, 5).map(esc).join(' / ')}</p>` : '');
    };
    $('#rGo').onclick = () => {
      if (!parsed.length) return;
      const up = {};
      parsed.forEach(o => { up['roster/' + o.sid] = {n: o.n, c: '1-' + o.sid.slice(1, 3), no: +o.sid.slice(3)}; if (!T.pins[o.sid]) up['pins/' + o.sid] = genPin(); });
      ref().update(up).then(() => { msg($('#rFb'), true, `✅ ${parsed.length}명을 등록했어요.`); parsed = []; $('#rGo').disabled = true; $('#rIn').value = ''; $('#rPrev').innerHTML = ''; })
        .catch(e => msg($('#rFb'), false, '등록하지 못했어요. (' + e.code + ')'));
    };
    const draw = () => {
      const st = students(T.c), t = $('#rT'); if (!t) return;
      t.innerHTML = st.length ? `<tr><th>번호</th><th>학번</th><th class="l">이름</th><th>개인 코드</th><th></th></tr>` + st.map(s => `<tr><td>${s.no}</td><td>${s.sid}</td><td class="l">${esc(s.n)}</td><td style="font-family:ui-monospace,Consolas,monospace">${T.pins[s.sid] ? (showPin ? esc(T.pins[s.sid]) : '••••••') : '없음'}</td>
        <td><button class="pin-btn" data-re="${s.sid}">재발급</button> <button class="pin-btn" data-rm="${s.sid}">삭제</button></td></tr>`).join('') : '<tr><td>이 반에는 아직 등록된 학생이 없어요.</td></tr>';
      t.querySelectorAll('[data-re]').forEach(b => b.onclick = () => { const s = T.roster[b.dataset.re]; if (confirm(`${s.n} 학생의 개인 코드를 새로 만들까요? 예전 코드는 더 이상 쓸 수 없어요.`)) ref('pins/' + b.dataset.re).set(genPin()).then(() => { showPin = true; draw(); }); });
      t.querySelectorAll('[data-rm]').forEach(b => b.onclick = () => { const s = T.roster[b.dataset.rm]; if (confirm(`${s.n} 학생을 명단에서 지울까요? (진도·출석 기록은 학년 말 정리 때 함께 지워져요)`)) ref().update({['roster/' + b.dataset.rm]: null, ['pins/' + b.dataset.rm]: null}); });
    };
    $('#rShow').onclick = () => { showPin = !showPin; $('#rShow').textContent = showPin ? '🙈 코드 가리기' : '👁 코드 보기'; draw(); };
    $('#rPrint').onclick = () => {
      const st = students(T.c); if (!st.length) return alert('명단이 없어요.');
      const url = location.href.replace(/teacher\/.*$/, '');
      // 팝업 차단을 피하려고 화면 안의 보이지 않는 틀(iframe)에서 인쇄
      let fr = $('#slipFrame'); if (fr) fr.remove();
      fr = document.createElement('iframe'); fr.id = 'slipFrame'; fr.title = '개인 코드 쪽지';
      fr.style.cssText = 'position:fixed;right:0;bottom:0;width:0;height:0;border:0;visibility:hidden';
      document.body.appendChild(fr);
      const d = fr.contentDocument;
      d.open();
      d.write(`<!doctype html><meta charset="utf-8"><title>개인 코드 쪽지 ${cname(T.c)}</title><style>body{font-family:sans-serif;margin:10mm}.g{display:grid;grid-template-columns:1fr 1fr;gap:4mm}.s{border:1px dashed #888;border-radius:6px;padding:4mm;page-break-inside:avoid;font-size:12pt}.s b{font-size:15pt}.c{font-family:Consolas,monospace;font-size:20pt;letter-spacing:3px;font-weight:bold}.u{font-size:9pt;color:#555}</style>
        <div class="g">${st.map(s => `<div class="s">정보 개념 체험관 · ${cname(T.c)} ${s.no}번 <b>${esc(s.n)}</b><br>학번 <b>${s.sid}</b> &nbsp; 개인 코드 <span class="c">${esc(T.pins[s.sid] || '')}</span><div class="u">${esc(url)} · 개인 코드는 비밀번호예요. 친구에게 알려 주지 마세요.</div></div>`).join('')}</div>`);
      d.close();
      setTimeout(() => { try { fr.contentWindow.focus(); fr.contentWindow.print(); } catch (e){ alert('인쇄 창을 열지 못했어요.'); } }, 300);
    };
    soft = draw; draw();
  }

  /* ---------- 💾 내보내기·정리 ---------- */
  function vData(v){
    v.insertAdjacentHTML('beforeend', `<div class="card"><h3>💾 ${cname(T.c)} 기록 내보내기</h3>
      <div class="row"><button class="btn" id="eProg">📊 진도 CSV</button><button class="btn" id="eAtt">✋ 출석·접속 CSV</button><button class="btn line" id="eAllProg">📊 모든 반 진도 CSV</button></div>
      <p class="hint">진도 CSV 칸: 완료 / 건너뜀 / 도달 단계(예: 3/7), 확인 미션 최고 점수. 출석·접속 CSV는 날짜별로 한 줄씩 나와요.</p><div class="feedback" id="eFb"></div></div>
      <div class="card"><h3>🧹 학년 말 정리</h3>
      <p>모든 반의 <b>명단, 개인 코드, 진도, 접속·출석, 누가기록, 열림 설정</b>을 지워요. 지우기 전에 위에서 CSV를 꼭 내려받으세요. 되돌릴 수 없어요.</p>
      <div class="row"><input class="in" id="wipeTx" placeholder="'전체 삭제'라고 입력"><button class="btn danger" id="wipe">전체 삭제</button></div><div class="feedback" id="wFb"></div>
      <p class="hint">📡 실시간 활동(투표·모으기) 기록은 따로 관리되며 30일이 지나면 자동으로 지워져요.</p></div>`);
    const progRows = async cs => {
      const rows = [['반', '학번', '번호', '이름', ...ACTS.map(a => a.id + ' ' + a.title), '완료 수']];
      for (const c of cs){
        const P = (await ref('progress/' + c).once('value')).val() || {};
        students(c).forEach(s => { const pr = P[s.sid] || {}; let n = 0;
          rows.push([cname(c), s.sid, s.no, s.n, ...ACTS.map(a => { const r = pr[a.id]; if (!r) return ''; if (r.d) n++; const q = r.q ? ' (' + Object.values(r.q).map(x => x.b + '/' + x.t).join(' ') + ')' : ''; return (r.d ? '완료' : r.x ? '건너뜀' : (r.s || 0) + '/' + (r.t || '')) + q; }), n]); });
      }
      return rows;
    };
    $('#eProg').onclick = async () => { try { csv(`진도_${cname(T.c)}_${today()}.csv`, await progRows([T.c])); } catch (e){ msg($('#eFb'), false, '내려받지 못했어요.'); } };
    $('#eAllProg').onclick = async () => { try { csv(`진도_모든반_${today()}.csv`, await progRows(CLASSES)); } catch (e){ msg($('#eFb'), false, '내려받지 못했어요.'); } };
    $('#eAtt').onclick = async () => {
      try {
        const A = (await ref('attend/' + T.c).once('value')).val() || {}, V = (await ref('visits/' + T.c).once('value')).val() || {};
        const days = [...new Set([...Object.keys(A), ...Object.keys(V)])].sort();
        const rows = [['날짜', '학번', '번호', '이름', '출석', '출석 시각', '첫 접속', '마지막 접속', '접속 횟수']];
        days.forEach(d => students(T.c).forEach(s => { const a = (A[d] || {})[s.sid], x = (V[d] || {})[s.sid]; rows.push([d, s.sid, s.no, s.n, a ? (a.k === 'T' ? '출석(교사)' : '출석') : '', a ? hm(a.t) : '', x ? hm(x.f) : '', x ? hm(x.l) : '', x ? x.n : '']); }));
        csv(`출석접속_${cname(T.c)}_${today()}.csv`, rows);
      } catch (e){ msg($('#eFb'), false, '내려받지 못했어요.'); }
    };
    $('#wipe').onclick = () => {
      if ($('#wipeTx').value.trim() !== '전체 삭제') return msg($('#wFb'), false, "'전체 삭제'라고 정확히 입력하세요.");
      if (!confirm('정말 모든 반의 학습 기록과 명단을 지울까요? 되돌릴 수 없어요.')) return;
      const up = {}; ['progress', 'visits', 'attend', 'attendOpen', 'attendKey', 'notes', 'claims', 'tries', 'roster', 'pins', 'open', 'today', 'liveNow'].forEach(k => up[k] = null);
      ref().update(up).then(() => msg($('#wFb'), true, '✅ 모두 지웠어요.')).catch(e => msg($('#wFb'), false, '지우지 못했어요. (' + e.code + ')'));
    };
  }

  /* ---------- 시작 ---------- */
  fbLoad(['firebase-app-compat.js', 'firebase-auth-compat.js', 'firebase-database-compat.js']).then(() => {
    if (!firebase.apps.length) firebase.initializeApp(CFG);
    auth = firebase.auth(); db = firebase.database();
    if (EMU){ auth.useEmulator('http://127.0.0.1:9099', {disableWarnings: true}); db.useEmulator('127.0.0.1', 9000); }
    auth.onAuthStateChanged(async u => {
      if (!u || u.isAnonymous) return loginView(u ? '학생 계정으로 로그인되어 있어요. 교사 구글 계정으로 로그인하세요.' : '');
      const ad = await ref('admins/' + u.uid).once('value').then(s => s.val(), () => null);
      if (ad === true) start(u); else notAdmin(u);
    });
  }).catch(() => { $('#view').innerHTML = '<div class="card"><p class="feedback show bad">불러오지 못했어요. 인터넷 연결을 확인하고 새로고침하세요.</p></div>'; });
})();
