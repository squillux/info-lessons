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
  h.querySelector('.ttl small').textContent = d.sub || '';
  document.body.prepend(h);
  try { if (localStorage.getItem('big')) document.body.classList.add('big'); } catch (e) {}
  $('#bigBtn').onclick = () => {
    document.body.classList.toggle('big');
    try { localStorage.setItem('big', document.body.classList.contains('big') ? '1' : ''); } catch (e) {}
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
    const list = contentsList.filter(c => !c.lesson);
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
  $('#allBtn').onclick = () => { shown = units.length; save(); render(); };
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
