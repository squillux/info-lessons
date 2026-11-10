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
        <button class="tool" id="bigBtn" title="글자 크게 (전자칠판용)">가<b>+</b> <span>크게</span></button>
        <button class="tool" id="fsBtn" title="전체 화면">⛶ <span>전체 화면</span></button>
      </div></div>`;
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

function feedback(el, ok, msg){ el.textContent = msg; el.className = 'feedback show ' + (ok ? 'ok' : 'bad'); }
