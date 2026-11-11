/* 중학교 정보 개념 체험관 · 활동 페이지 공통 스크립트
   <body data-unit="2" data-title="제목" data-sub="부제"> 를 읽어 상단 막대를 만든다. */
const $ = s => document.querySelector(s);
const $$ = s => [...document.querySelectorAll(s)];
const bin = (n, w) => n.toString(2).padStart(w, '0');

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
  if (units.length < 2) return;
  const key = 'reveal:' + location.pathname;
  let shown = 1;
  try { shown = Math.max(1, Math.min(units.length, +sessionStorage.getItem(key) || 1)); } catch (e) {}
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
    else if (shown < units.length){ before = shown; shown = units.length; }
    save(); render(); allLabel();
  };
  render();
});

/* 확인 미션: 누르면 바로 채점. items = [{q, o:[...], a:정답번호, e:해설}] */
function renderQuiz(box, items){
  const answered = {};
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
      }
    });
  });
}

/* 상황 카드 분류: 상황마다 보기 버튼 중 하나를 고르면 바로 채점.
   items = [{t:상황, a:정답 보기 번호, e:해설}], options = ['보기1', ...] */
function renderChoice(box, items, options, onDone){
  const done = {};
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
      if (ok && !(i in done)){
        done[i] = 1;
        if (Object.keys(done).length === items.length){
          const s = box.querySelector('.score'); s.textContent = '🎉 모두 해결했어요!'; s.classList.add('show');
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
  ins.forEach(i => i.onchange = () => { const n = [...ins].filter(x => x.checked).length; msg.textContent = n === ins.length ? '🎉 미션 완료! 친구와 프로그램을 바꿔 실행해 보세요.' : `${n} / ${ins.length}`; });
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

/* 🔊 읽어 주기: 지금 열린 마지막 활동 카드의 글을 소리로 읽음 (브라우저 음성 합성, 인터넷·저장 필요 없음) */
(function speakTool(){
  if (!('speechSynthesis' in window)) return;
  const tools = document.querySelector('header.top .tools'); if (!tools) return;
  const b = document.createElement('button'); b.className = 'tool'; b.title = '지금 활동의 글을 소리로 읽어 줘요'; b.innerHTML = '🔊 <span>읽어 주기</span>';
  b.onclick = () => {
    if (speechSynthesis.speaking){ speechSynthesis.cancel(); b.innerHTML = '🔊 <span>읽어 주기</span>'; return; }
    const cards = [...document.querySelectorAll('main .card')].filter(c => !c.closest('.locked') && c.offsetParent !== null);
    const vis = cards.filter(c => { const r = c.getBoundingClientRect(); return r.bottom > 80 && r.top < innerHeight; });
    const target = vis[0] || cards[cards.length - 1]; if (!target) return;
    const text = [...target.querySelectorAll('h3, p, li, .choice > p, .q > p')].map(e => e.innerText.trim()).filter(Boolean).join('. ').slice(0, 1200);
    const u = new SpeechSynthesisUtterance(text); u.lang = 'ko-KR'; u.rate = .95;
    u.onend = u.onerror = () => b.innerHTML = '🔊 <span>읽어 주기</span>';
    target.classList.add('pop'); setTimeout(() => target.classList.remove('pop'), 700);
    speechSynthesis.speak(u); b.innerHTML = '⏹ <span>멈추기</span>';
  };
  tools.prepend(b);
})();
