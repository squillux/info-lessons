/* 중학교 정보 개념 체험관 · 활동 페이지 공통 스크립트
   <body data-unit="2" data-title="제목" data-sub="부제"> 를 읽어 상단 막대를 만든다. */
const $ = s => document.querySelector(s);
const $$ = s => [...document.querySelectorAll(s)];
const bin = (n, w) => n.toString(2).padStart(w, '0');

/* 진도 신호: 아무것도 저장하지 않고 window에 'info:progress' 이벤트만 내보낸다.
   나중에 로그인·진도 기록 기능이 이 이벤트(또는 infoProgress.state)를 받아 저장한다.
   type: start(열림) · step(다음 단계) · done(마지막 단계 도달) · quiz(확인 미션 채점 완료)
         choice(상황 분류 완료) · mission(엔트리 점검 완료) · leave(페이지 나감, 요약 포함)
   주소에 ?pdebug 를 붙이면 콘솔에 신호가 찍힌다. */
const infoProgress = window.infoProgress = (() => {
  const parts = location.pathname.split('/').filter(Boolean);
  let file = parts[parts.length - 1] || '';
  if (!/\.html?$/.test(file) || file === 'index.html') file = (file === 'index.html' ? parts[parts.length - 2] : file) || '';
  const m = file.match(/^(\d-\d{2})/);
  const act = m ? m[1] : file.replace(/\.html?$/, '');
  const state = {act, opened: Date.now(), step: 0, total: 0, maxStep: 0, done: false, expanded: false, quiz: {}, choice: {}, mission: {}};
  const debug = /[?&]pdebug/.test(location.search);
  function emit(type, d){
    const detail = Object.assign({act, type, t: Date.now()}, d || {});
    try { dispatchEvent(new CustomEvent('info:progress', {detail})); } catch (e) {}
    if (debug) console.log('[progress]', JSON.stringify(detail));
  }
  let left = false;
  addEventListener('pagehide', () => {
    if (left) return; left = true;
    emit('leave', {sec: Math.round((Date.now() - state.opened) / 1000), summary: JSON.parse(JSON.stringify(state))});
  });
  addEventListener('pageshow', e => { if (e.persisted){ left = false; state.opened = Date.now(); emit('start', {step: state.step, total: state.total, back: true}); } });
  return {state, emit};
})();

(function header(){
  const d = document.body.dataset;
  const h = document.createElement('header');
  h.className = 'top';
  h.innerHTML = `<div class="in">
      <a class="back" href="../index.html?unit=${d.unit || ''}">◀ 목차</a>
      <div class="ttl"><b></b><small></small></div>
      <div class="tools">
        <button class="tool" id="allBtn" title="모든 활동 펼치기 (교사용 미리 보기)">☰ <span>펼치기</span></button>
        <button class="tool" id="bigBtn" title="글자 크게 (전자칠판용)">가<b>+</b> <span>크게</span></button>
        <button class="tool" id="fsBtn" title="전체 화면">⛶ <span>전체 화면</span></button>
      </div></div><div class="prog"><i></i></div>`;
  h.querySelector('.ttl b').textContent = d.title || document.title;
  let std = '';   // 관련 성취기준 표시 (contents.js의 std)
  try { const p = location.pathname; const e = (typeof contentsList !== 'undefined') && contentsList.find(c => c.href.endsWith('/') ? (p.endsWith(c.href) || p.endsWith(c.href + 'index.html')) : p.endsWith(c.href)); if (e && e.std) std = ' · [9정' + e.std + ']'; } catch (e) {}
  h.querySelector('.ttl small').textContent = (d.sub || '') + std;
  document.body.prepend(h);
  const root = document.documentElement;   // 글자 크기는 html 기준(rem)이므로 html에 적용
  try { if (localStorage.getItem('big')) root.classList.add('big'); } catch (e) {}
  const bigLabel = () => $('#bigBtn').innerHTML = root.classList.contains('big') ? '가<b>−</b> <span>보통</span>' : '가<b>+</b> <span>크게</span>';
  bigLabel();
  $('#bigBtn').onclick = () => {
    root.classList.toggle('big'); bigLabel();
    try { localStorage.setItem('big', root.classList.contains('big') ? '1' : ''); } catch (e) {}
    window.dispatchEvent(new Event('resize'));
  };
  $('#fsBtn').onclick = () => {
    if (!document.fullscreenElement) document.documentElement.requestFullscreen?.();
    else document.exitFullscreen?.();
  };
})();

/* 단계별 펼치기: 활동(카드)을 하나씩 보여 주고, 아래의 [다음] 버튼으로 다음 활동을 연다.
   .step 안의 .card 하나가 활동 1개이며, 카드 앞의 다른 요소(예: 모드 버튼)는 뒤 카드에 붙는다. */
document.addEventListener('DOMContentLoaded', () => {
  const units = [];
  $$('main .step').forEach(step => {
    let pending = [];
    [...step.children].forEach(el => {
      if (el.classList.contains('step-h')) return;
      pending.push(el);
      if (el.classList.contains('card')){ units.push({step, els: pending, card: el}); pending = []; }
    });
    if (pending.length && units.length) units[units.length - 1].els.push(...pending);
  });
  const P = infoProgress.state;
  if (units.length < 2){
    P.total = P.step = P.maxStep = 1;
    infoProgress.emit('start', {step: 1, total: 1});
    return;
  }
  const key = 'reveal:' + location.pathname;
  let shown = 1;
  try { shown = Math.max(1, Math.min(units.length, +sessionStorage.getItem(key) || 1)); } catch (e) {}
  P.total = units.length;
  infoProgress.emit('start', {step: shown, total: units.length});
  const track = () => {   // 진도 신호 (저장 없음)
    const prev = P.step;
    P.step = shown; P.maxStep = Math.max(P.maxStep, shown);
    if (prev && shown !== prev) infoProgress.emit('step', {step: shown, total: units.length, expanded: P.expanded});
    if (shown === units.length && !P.done){ P.done = true; infoProgress.emit('done', {total: units.length, expanded: P.expanded}); }
  };
  const bar = document.createElement('div');
  bar.className = 'nextbar';
  const label = u => {
    const h = u.card.querySelector('h3');
    return h ? h.textContent.replace(/심화|더 해 보기/g, '').trim() : u.step.querySelector('.step-h').textContent.replace(/^\d+/, '').trim();
  };
  const next = (() => {
    if (typeof contentsList === 'undefined') return null;
    const me = location.pathname.split('/').pop();
    const list = contentsList.filter(c => !c.lesson && String(c.unit) === String(document.body.dataset.unit));   // 같은 단원 안에서만 이어 가기
    const i = list.findIndex(c => c.href.split('/').pop() === me);
    return i >= 0 && list[i + 1] ? list[i + 1] : null;
  })();
  function render(scroll){
    units.forEach((u, i) => u.els.forEach(el => el.classList.toggle('locked', i >= shown)));
    $$('main .step').forEach(s => s.classList.toggle('locked', !units.some((u, i) => u.step === s && i < shown)));
    const last = units[shown - 1];
    last.els[last.els.length - 1].after(bar);
    if (shown < units.length){
      bar.innerHTML = `<button class="btn next-btn">다음 ▶ <span></span></button><span class="hint">${shown} / ${units.length}</span>`;
      bar.querySelector('span').textContent = label(units[shown]);
      bar.querySelector('button').onclick = () => { shown++; save(); render(true); };
    } else {
      const d = document.body.dataset;
      bar.innerHTML = `<div class="done">🎉 이 활동을 모두 마쳤어요!</div>
        <div class="ctrl" style="justify-content:center">
          <a class="btn line" href="../index.html?unit=${d.unit || ''}">◀ 목차로</a>
          ${next ? `<a class="btn" href="../${next.href}">다음 활동: <span></span> ▶</a>` : ''}
          <button class="btn ghost" id="restartBtn">처음부터 다시</button></div>`;
      if (next) bar.querySelector('a.btn:not(.line) span').textContent = next.title;
      bar.querySelector('#restartBtn').onclick = () => { shown = 1; save(); render(); window.scrollTo({top: 0, behavior: 'smooth'}); };
    }
    const p = $('header.top .prog i'); if (p) p.style.width = (shown / units.length * 100) + '%';
    track();
    window.dispatchEvent(new Event('resize'));          // 숨겨져 있던 캔버스 다시 그리기
    if (scroll){
      const u = units[shown - 1], top = u.els[0].getBoundingClientRect().top + scrollY - 80;
      window.scrollTo({top, behavior: 'smooth'});
      u.card.classList.add('pop'); setTimeout(() => u.card.classList.remove('pop'), 700);
    }
  }
  const save = () => { try { sessionStorage.setItem(key, shown); } catch (e) {} };
  let before = 0;   // 펼치기 전 진행 위치 (접기로 되돌아가기)
  const allLabel = () => $('#allBtn').innerHTML = shown === units.length && before ? '☰ <span>접기</span>' : '☰ <span>펼치기</span>';
  $('#allBtn').onclick = () => {
    if (shown === units.length && before){ shown = before; before = 0; }
    else if (shown < units.length){ before = shown; shown = units.length; P.expanded = true; }   // 펼치기로 건너뛴 것은 따로 표시
    save(); render(); allLabel();
  };
  render();
});

/* 확인 미션: 누르면 바로 채점. items = [{q, o:[...], a:정답번호, e:해설}] */
const boxId = (box, kind) => box.dataset.pid || (box.dataset.pid = box.id || kind + (boxId.n = (boxId.n || 0) + 1));   // 진도 신호용 상자 이름
function renderQuiz(box, items){
  const answered = {}, qid = boxId(box, 'quiz');
  box.innerHTML = items.map((x, i) => `<div class="q" data-q="${i}"><p>${i + 1}. ${x.q}</p>
    <div class="opts">${x.o.map((o, k) => `<button class="opt" data-k="${k}">${o}</button>`).join('')}</div>
    <div class="explain">${x.e}</div></div>`).join('') + '<div class="score"></div>';
  box.querySelectorAll('.q').forEach(qe => {
    const i = +qe.dataset.q;
    qe.querySelectorAll('.opt').forEach(btn => btn.onclick = () => {
      if (i in answered) return;
      answered[i] = +btn.dataset.k === items[i].a;
      qe.querySelectorAll('.opt')[items[i].a].classList.add('right');
      if (!answered[i]) btn.classList.add('wrong');
      qe.querySelector('.explain').classList.add('show');
      if (Object.keys(answered).length === items.length){
        const sc = Object.values(answered).filter(Boolean).length, s = box.querySelector('.score');
        s.textContent = sc === items.length ? `🎉 ${sc} / ${items.length} 모두 맞혔어요!` : `${sc} / ${items.length} · 틀린 문제의 해설을 다시 읽어 보세요.`;
        const again = document.createElement('button'); again.className = 'btn line'; again.style.marginLeft = '8px'; again.textContent = '🔄 다시 풀기'; again.onclick = () => renderQuiz(box, items); s.appendChild(again);
        s.classList.add('show');
        const rec = infoProgress.state.quiz[qid] = infoProgress.state.quiz[qid] || {tries: 0};   // 진도 신호 (저장 없음)
        rec.tries++; rec.score = sc; rec.total = items.length; rec.best = Math.max(rec.best || 0, sc);
        rec.wrong = Object.keys(answered).filter(k => !answered[k]).map(Number);
        infoProgress.emit('quiz', Object.assign({id: qid}, rec));
      }
    });
  });
}

/* 상황 카드 분류: 상황마다 보기 버튼 중 하나를 고르면 바로 채점.
   items = [{t:상황, a:정답 보기 번호, e:해설}], options = ['보기1', ...] */
function renderChoice(box, items, options, onDone){
  const done = {}, cid = boxId(box, 'choice'), miss = {};
  box.innerHTML = items.map((x, i) => `<div class="choice" data-i="${i}"><p>${x.icon ? x.icon + ' ' : ''}${x.t}</p>
    <div class="opts">${options.map((o, k) => `<button class="opt" data-k="${k}">${o}</button>`).join('')}</div>
    <div class="explain"></div></div>`).join('') + '<div class="score"></div>';
  box.querySelectorAll('.choice').forEach(ce => {
    const i = +ce.dataset.i, it = items[i];
    ce.querySelectorAll('.opt').forEach(btn => btn.onclick = () => {
      const k = +btn.dataset.k, ok = k === it.a;
      ce.querySelectorAll('.opt').forEach(b => b.classList.remove('right', 'wrong'));
      btn.classList.add(ok ? 'right' : 'wrong');
      const ex = ce.querySelector('.explain');
      ex.textContent = ok ? '⭕ ' + (it.e || '정답!') : '❌ 다시 생각해 보세요.' + (it.hint ? ' 💡 ' + it.hint : '');
      ex.classList.add('show');
      if (!ok && !(i in done)) miss[i] = (miss[i] || 0) + 1;
      if (ok && !(i in done)){
        done[i] = 1;
        if (Object.keys(done).length === items.length){
          const s = box.querySelector('.score'); s.textContent = '🎉 모두 해결했어요!'; s.classList.add('show');
          const rec = infoProgress.state.choice[cid] = {total: items.length, missed: Object.keys(miss).map(Number)};   // 진도 신호 (저장 없음)
          infoProgress.emit('choice', Object.assign({id: cid}, rec));
          onDone && onDone();
        }
      }
    });
  });
}

function feedback(el, ok, msg){ el.textContent = msg; el.className = 'feedback show ' + (ok ? 'ok' : 'bad'); }

/* 엔트리로 만들어 보기 미션 카드: entryMission(box, {title, goal, need:[], steps:[], check:[]}) */
function entryMission(box, m){
  const esc = s => String(s).replace(/[<>&]/g, c => ({'<': '&lt;', '>': '&gt;', '&': '&amp;'}[c]));
  box.innerHTML = `<h3>🧩 엔트리로 만들어 보기 <span class="tag-opt">실습 미션</span></h3>
    <p><b>${esc(m.title)}</b><br>${esc(m.goal)}</p>
    ${m.need ? `<p class="hint">필요한 것: ${m.need.map(esc).join(' · ')}</p>` : ''}
    <ol class="mission-steps">${m.steps.map(s => `<li>${esc(s)}</li>`).join('')}</ol>
    <p><a class="btn" href="https://playentry.org/ws" target="_blank" rel="noopener">엔트리 열기 ↗</a></p>
    <div class="mission-check"><b>✅ 스스로 점검</b>${m.check.map(c => `<label><input type="checkbox"> ${esc(c)}</label>`).join('')}<p class="hint"></p></div>`;
  const ins = box.querySelectorAll('.mission-check input'), msg = box.querySelector('.mission-check .hint');
  const mid = boxId(box, 'mission');
  ins.forEach(i => i.onchange = () => {
    const n = [...ins].filter(x => x.checked).length;
    msg.textContent = n === ins.length ? '🎉 미션 완료! 친구와 프로그램을 바꿔 실행해 보세요.' : `${n} / ${ins.length}`;
    if (n === ins.length && !infoProgress.state.mission[mid]){ infoProgress.state.mission[mid] = {total: n}; infoProgress.emit('mission', {id: mid, total: n}); }   // 진도 신호 (저장 없음)
  });
}

/* 프로젝트 평가 기준표(교사용): rubric(box, {std, rows:[[평가 요소, 상, 중, 하], ...]}) */
function rubric(box, r){
  const esc = s => String(s).replace(/[<>&]/g, c => ({'<': '&lt;', '>': '&gt;', '&': '&amp;'}[c]));
  box.innerHTML = `<details class="rubric"><summary>📏 평가 기준표 (교사용 · 성취기준 [9정${esc(r.std)}])</summary>
    <div class="scroll-x"><table><tr><th>평가 요소</th><th>상</th><th>중</th><th>하</th></tr>${r.rows.map(([k, a, b, c]) => `<tr><th>${esc(k)}</th><td>${esc(a)}</td><td>${esc(b)}</td><td>${esc(c)}</td></tr>`).join('')}</table></div>
    <p class="hint">성취수준(A~E)과 학교 평가 계획에 맞게 조정해 사용하세요.</p></details>`;
}

/* 내 말로 설명하기: explainIt(box, {q, words:[꼭 넣을 낱말], ex:예시 답안}) — 저장하지 않음 */
function explainIt(box, m){
  const esc = s => String(s).replace(/[<>&]/g, c => ({'<': '&lt;', '>': '&gt;', '&': '&amp;'}[c]));
  box.innerHTML = `<h3>✍️ 내 말로 설명하기</h3><p>${esc(m.q)}</p>
    <p class="hint">꼭 넣을 낱말: ${m.words.map(w => `<span class="pill" data-w="${esc(w)}">${esc(w)}</span>`).join(' ')}</p>
    <textarea rows="3" class="explain-in" placeholder="친구에게 설명하듯 2~3문장으로 써 보세요. (저장되지 않아요)"></textarea>
    <div class="ctrl"><button class="btn line" data-ex>💡 예시 답안 보기</button></div><p class="explain-ex hint" hidden>${esc(m.ex)}</p>`;
  const ta = box.querySelector('textarea');
  ta.oninput = () => box.querySelectorAll('[data-w]').forEach(p => { const ok = ta.value.includes(p.dataset.w); p.style.background = ok ? 'var(--mint-soft)' : ''; p.textContent = (ok ? '✓ ' : '') + p.dataset.w; });
  box.querySelector('[data-ex]').onclick = () => { box.querySelector('.explain-ex').hidden = false; };
}


/* 인쇄할 때 접힌 내용(평가 기준표, 안내 등)도 펼쳐서 인쇄 */
addEventListener('beforeprint', () => document.querySelectorAll('details').forEach(d => d.open = true));

/* 로그인·잠금·진도 기록(auth.js)을 함께 불러온다. 로그인 전에는 활동 내용을 가린다. */
(function loadAuth(){
  const me = document.currentScript && document.currentScript.src;
  if (!me || (typeof loginActive === 'function' && !loginActive())) return;   // 학생 로그인이 꺼져 있으면 지금처럼 바로 체험
  document.documentElement.classList.add('ga-wait');
  const s = document.createElement('script');
  s.src = me.replace(/common\.js(\?.*)?$/, 'auth.js');
  s.onerror = () => document.body.insertAdjacentHTML('afterbegin', '<p class="feedback show bad" style="margin:80px 16px">로그인 기능을 불러오지 못했어요. 인터넷 연결을 확인하고 새로고침하세요.</p>');
  document.head.appendChild(s);
})();
