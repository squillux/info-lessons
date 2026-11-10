/* 정보 개념 체험관 · 실시간 투표 (Firebase Realtime Database)
   사용: liveVote(box, {act:'5-04', items:[{t:'문항', sub:'근거 HTML', opts:['👍 찬성','👎 반대']}]})
   - 학생 개인 정보는 저장하지 않는다. 서버에는 방 코드, 문항 상태, '기기 임의 번호 → 선택지 번호'만 저장된다.
   - 교사: 방을 만든 기기에만 비밀 키가 남아 그 기기에서만 투표 시작·종료·공개를 조작할 수 있다.
   - 연결이 안 되면 '손으로 세기' 모드(교사가 숫자를 누름)로 쓸 수 있다. */
const LIVE_CFG = {
  apiKey: 'AIzaSyDJV6-cIM0-UO5Rpp4VYZeUlHbWP4svXGk',
  authDomain: 'info-lessons-live-sq.firebaseapp.com',
  databaseURL: 'https://info-lessons-live-sq-default-rtdb.asia-southeast1.firebasedatabase.app',
  projectId: 'info-lessons-live-sq',
  appId: '1:918252932246:web:32def6b205181da0c7c6b7',
};
const LIVE_SDK = 'https://www.gstatic.com/firebasejs/10.12.2/';

(function(){
  const css = `.lv-bar{display:flex;flex-wrap:wrap;gap:6px;margin:6px 0 12px}
.lv-bar .btn{font-size:.9rem}
.lv-room{display:flex;flex-wrap:wrap;align-items:center;gap:12px;background:var(--brand-soft);border-radius:16px;padding:10px 16px;margin-bottom:12px}
.lv-room .code{font-family:ui-monospace,Consolas,monospace;font-size:2.2rem;font-weight:800;letter-spacing:.15em;color:var(--brand)}
.lv-item{border:2px solid var(--line);border-radius:16px;padding:12px 14px;margin:10px 0;background:#fff}
.lv-item.open{border-color:var(--mint)}
.lv-st{display:inline-block;font-size:.75rem;font-weight:800;border-radius:999px;padding:1px 9px;margin-left:6px;vertical-align:middle;background:var(--bg);color:var(--muted)}
.lv-item.open .lv-st{background:var(--mint-soft);color:#0d7d71}
.lv-ctl{display:flex;flex-wrap:wrap;gap:6px;margin-top:8px}
.lv-ctl .btn{font-size:.85rem;padding:6px 12px}
.lv-res{display:grid;gap:4px;margin-top:8px}
.lv-row{display:grid;grid-template-columns:7em 1fr 3em;gap:8px;align-items:center;font-size:.9rem}
.lv-row .tr{height:16px;background:var(--bg);border-radius:999px;overflow:hidden}
.lv-row .tr i{display:block;height:100%;width:0;background:var(--brand);transition:width .4s}
.lv-row:nth-child(2) .tr i{background:var(--pink)}
.lv-row:nth-child(3) .tr i{background:var(--on)}
.lv-msg{font-size:.9rem;color:var(--muted);margin-top:6px}`;
  const s = document.createElement('style'); s.textContent = css; document.head.appendChild(s);
})();

function liveVote(box, cfg){
  const items = cfg.items, act = cfg.act;
  const esc = s => String(s).replace(/[<>&]/g, c => ({'<':'&lt;','>':'&gt;','&':'&amp;'}[c]));
  const ls = {get(k){ try { return localStorage.getItem(k); } catch(e){ return null; } }, set(k, v){ try { localStorage.setItem(k, v); } catch(e){} }};
  const rnd = n => Array.from(crypto.getRandomValues(new Uint8Array(n)), b => 'abcdefghijklmnopqrstuvwxyz0123456789'[b % 36]).join('');
  let db = null, mode = null, code = null, key = null, pub = null, offs = [];
  const counts = items.map(it => it.opts.map(() => 0));
  const mine = {};   // 학생: 문항별 내가 고른 번호 (이번 라운드)

  box.innerHTML = `<div class="lv-bar">
      <button class="btn" data-m="teacher">🧑‍🏫 교사: 실시간 투표 열기</button>
      <button class="btn line" data-m="student">🙋 학생: 방 코드로 참여</button>
      <button class="btn line" data-m="hand">✋ 손으로 세기</button>
    </div><div class="lv-top"></div><div class="lv-items"></div>`;
  const top = box.querySelector('.lv-top'), list = box.querySelector('.lv-items');

  function loadSdk(){
    if (window.firebase?.database) return Promise.resolve();
    const add = f => new Promise((ok, no) => { const sc = document.createElement('script'); sc.src = LIVE_SDK + f; sc.onload = ok; sc.onerror = no; document.head.appendChild(sc); });
    return add('firebase-app-compat.js').then(() => add('firebase-database-compat.js'));
  }
  function connect(){
    return loadSdk().then(() => {
      if (!firebase.apps.length) firebase.initializeApp(LIVE_CFG);
      db = firebase.database();
      return Promise.race([db.ref('.info/serverTimeOffset').once('value'), new Promise((_, no) => setTimeout(() => no(new Error('timeout')), 8000))]);
    });
  }
  const fail = e => { top.innerHTML = `<p class="feedback show bad">⚠️ 실시간 서버에 연결할 수 없어요(학교 인터넷 차단 등). <b>✋ 손으로 세기</b>로 진행해 주세요.</p>`; console.warn(e); };
  const cleanup = () => { offs.forEach(f => f()); offs = []; };

  function drawRes(i, el, showPct){
    const c = counts[i], tot = c.reduce((a, b) => a + b, 0);
    el.innerHTML = items[i].opts.map((o, k) => `<div class="lv-row"><span>${esc(o)}</span><span class="tr"><i style="width:${tot ? c[k] / tot * 100 : 0}%"></i></span><b>${c[k]}</b></div>`).join('') +
      `<div class="lv-msg">참여 ${tot}명${showPct && tot ? ' · ' + summary(i) : ''}</div>`;
  }
  function summary(i){
    const c = counts[i], mx = Math.max(...c), win = c.filter(x => x === mx).length;
    return win > 1 ? '⚖️ 의견이 똑같이 나뉘었어요. 서로의 근거를 더 들어 볼까요?' : `'${items[i].opts[c.indexOf(mx)]}' 의견이 가장 많아요. 다른 의견을 고른 친구의 근거도 들어 봐요.`;
  }
  const head = (it, i) => `<p><b>${i + 1}. ${esc(it.t)}</b><span class="lv-st"></span></p>${it.sub ? `<p class="hint" style="margin:2px 0">${it.sub}</p>` : ''}`;

  /* ---------- 손으로 세기 ---------- */
  function hand(){
    cleanup(); mode = 'hand'; top.innerHTML = '<p class="hint">손을 든 학생 수만큼 선생님이 버튼을 눌러 기록해요. (저장되지 않아요.)</p>';
    list.innerHTML = items.map((it, i) => `<div class="lv-item" data-i="${i}">${head(it, i)}<div class="lv-ctl">${it.opts.map((o, k) => `<button class="opt" data-k="${k}">${esc(o)} +1</button>`).join('')}<button class="btn line" data-r>초기화</button></div><div class="lv-res"></div></div>`).join('');
    list.querySelectorAll('.lv-item').forEach(el => {
      const i = +el.dataset.i, res = el.querySelector('.lv-res');
      el.querySelector('.lv-st').textContent = '손으로 세기';
      el.querySelectorAll('[data-k]').forEach(b => b.onclick = () => { counts[i][+b.dataset.k]++; drawRes(i, res, true); });
      el.querySelector('[data-r]').onclick = () => { counts[i] = counts[i].map(() => 0); drawRes(i, res, true); };
      drawRes(i, res, true);
    });
  }

  /* ---------- 교사 ---------- */
  async function teacher(){
    cleanup(); mode = 'teacher'; top.innerHTML = '<p class="hint">실시간 서버에 연결하는 중…</p>'; list.innerHTML = '';
    try { await connect(); } catch(e){ return fail(e); }
    let last = null; try { last = JSON.parse(ls.get('live:last') || 'null'); } catch(e){}
    if (last && last.act === act && last.key){
      const snap = await db.ref('rooms/' + last.code + '/pub').once('value').catch(() => null);
      if (snap && snap.exists()){ code = last.code; key = last.key; pub = snap.val(); return teacherRoom(); }
    }
    for (let tries = 0; tries < 8; tries++){
      const c = String(1000 + Math.floor(Math.random() * 9000)), k = rnd(32);
      try { await db.ref('keys/' + c).set(k); code = c; key = k; break; } catch(e){ /* 이미 쓰는 번호 */ }
    }
    if (!code) return fail(new Error('no room'));
    ls.set('live:last', JSON.stringify({code, key, act}));
    pub = {t: 0, act, q: Object.fromEntries(items.map((_, i) => [i, {open: false, show: false, round: 1}]))};
    await save(); teacherRoom();
  }
  function save(){
    const t = Math.max(Date.now(), (pub.t || 0) + 1); pub.t = t;
    return db.ref().update({[`ctl/${code}/${key}/t`]: t, [`rooms/${code}/pub`]: pub});
  }
  function teacherRoom(){
    top.innerHTML = `<div class="lv-room"><span>방 코드</span><span class="code">${code}</span><span class="hint">학생은 이 페이지에서 <b>🙋 학생: 방 코드로 참여</b>를 누르고 이 번호를 입력해요.</span><button class="btn line" id="lvNew">새 방 만들기</button></div>`;
    top.querySelector('#lvNew').onclick = () => { ls.set('live:last', ''); code = key = null; teacher(); };
    list.innerHTML = items.map((it, i) => `<div class="lv-item" data-i="${i}">${head(it, i)}<div class="lv-ctl">
        <button class="btn" data-a="open"></button><button class="btn line" data-a="show"></button><button class="btn line" data-a="again">🔄 다시 투표</button></div><div class="lv-res"></div></div>`).join('');
    list.querySelectorAll('.lv-item').forEach(el => {
      const i = +el.dataset.i, res = el.querySelector('.lv-res');
      const paint = () => { const q = pub.q[i]; el.classList.toggle('open', q.open); el.querySelector('.lv-st').textContent = q.open ? '투표 중' : '닫힘';
        el.querySelector('[data-a=open]').textContent = q.open ? '⏹ 투표 종료' : '▶ 투표 시작';
        el.querySelector('[data-a=show]').textContent = q.show ? '🙈 학생 화면에서 결과 숨기기' : '📊 학생 화면에 결과 공개'; };
      el.querySelector('[data-a=open]').onclick = () => { pub.q[i].open = !pub.q[i].open; paint(); save(); };
      el.querySelector('[data-a=show]').onclick = () => { pub.q[i].show = !pub.q[i].show; paint(); save(); };
      el.querySelector('[data-a=again]').onclick = () => { if (!confirm('이 문항의 투표 결과를 지우고 다시 투표할까요?')) return; pub.q[i].round++; pub.q[i].open = false; pub.q[i].show = false; paint(); save(); listen(i, res); };
      paint(); listen(i, res);
    });
  }
  function listen(i, res){
    const ref = db.ref(`votes/${code}/${i}/${pub.q[i].round}`);
    const h = ref.on('value', s => {
      counts[i] = items[i].opts.map(() => 0); const v = s.val() || {};
      Object.entries(v).forEach(([d, k]) => { if (counts[i][k] !== undefined) counts[i][k]++; if (mode === 'student' && d === dev()) mine[i] = k; });
      if (mode === 'teacher') drawRes(i, res, true); else studentPaint(i);
    });
    offs.push(() => ref.off('value', h));
  }

  /* ---------- 학생 ---------- */
  const dev = () => { let d = ls.get('live:dev'); if (!d || !/^[a-z0-9]{20}$/.test(d)){ d = rnd(20); ls.set('live:dev', d); } return d; };
  function student(){
    cleanup(); mode = 'student'; list.innerHTML = '';
    top.innerHTML = `<p>선생님 화면의 <b>방 코드 4자리</b>를 입력하세요.</p><p><input class="inp" id="lvCode" inputmode="numeric" maxlength="4" style="width:140px"> <button class="btn" id="lvJoin">참여하기</button></p><div class="feedback" id="lvFb"></div>`;
    const go = async () => {
      const c = top.querySelector('#lvCode').value.trim();
      if (!/^\d{4}$/.test(c)) return feedback(top.querySelector('#lvFb'), false, '숫자 4자리를 입력하세요.');
      feedback(top.querySelector('#lvFb'), true, '연결하는 중…');
      try { await connect(); } catch(e){ return fail(e); }
      const snap = await db.ref('rooms/' + c + '/pub').once('value').catch(() => null);
      if (!snap || !snap.exists() || snap.val().act !== act) return feedback(top.querySelector('#lvFb'), false, '이 활동에 열린 방이 아니에요. 번호를 다시 확인하세요.');
      code = c; pub = snap.val(); studentRoom();
    };
    top.querySelector('#lvJoin').onclick = go;
    top.querySelector('#lvCode').onkeydown = e => { if (e.key === 'Enter') go(); };
  }
  function studentRoom(){
    top.innerHTML = `<div class="lv-room"><span>참여한 방</span><span class="code">${code}</span><span class="hint">선생님이 투표를 시작하면 버튼을 누를 수 있어요. 이름은 저장되지 않아요.</span></div>`;
    list.innerHTML = items.map((it, i) => `<div class="lv-item" data-i="${i}">${head(it, i)}<div class="lv-ctl">${it.opts.map((o, k) => `<button class="opt" data-k="${k}">${esc(o)}</button>`).join('')}</div><div class="lv-msg"></div><div class="lv-res"></div></div>`).join('');
    list.querySelectorAll('.lv-item').forEach(el => {
      const i = +el.dataset.i;
      el.querySelectorAll('[data-k]').forEach(b => b.onclick = () => {
        if (!pub.q[i].open || i in mine) return;
        const k = +b.dataset.k; mine[i] = k; studentPaint(i);
        db.ref(`votes/${code}/${i}/${pub.q[i].round}/${dev()}`).set(k).catch(() => { delete mine[i]; studentPaint(i); el.querySelector('.lv-msg').textContent = '⚠️ 투표가 닫혔거나 이미 투표했어요.'; });
      });
    });
    const ref = db.ref('rooms/' + code + '/pub'), rounds = {};
    const h = ref.on('value', s => {
      if (!s.exists()) return; pub = s.val();
      items.forEach((_, i) => { if (rounds[i] !== pub.q[i].round){ if (rounds[i] !== undefined) delete mine[i]; rounds[i] = pub.q[i].round; listenStudent(i); } studentPaint(i); });
    });
    offs.push(() => ref.off('value', h));
  }
  const sOffs = {};
  function listenStudent(i){
    if (sOffs[i]) sOffs[i]();
    const ref = db.ref(`votes/${code}/${i}/${pub.q[i].round}`);
    const h = ref.on('value', s => {
      counts[i] = items[i].opts.map(() => 0); const v = s.val() || {};
      Object.entries(v).forEach(([d, k]) => { if (counts[i][k] !== undefined) counts[i][k]++; if (d === dev()) mine[i] = k; });
      studentPaint(i);
    });
    sOffs[i] = () => ref.off('value', h); offs.push(sOffs[i]);
  }
  function studentPaint(i){
    const el = list.querySelector(`.lv-item[data-i="${i}"]`); if (!el || !pub) return;
    const q = pub.q[i], voted = i in mine;
    el.classList.toggle('open', q.open);
    el.querySelector('.lv-st').textContent = q.open ? '투표 중' : '닫힘';
    el.querySelectorAll('[data-k]').forEach(b => { b.disabled = !q.open || voted; b.classList.toggle('right', voted && +b.dataset.k === mine[i]); });
    el.querySelector('.lv-msg').textContent = voted ? '✅ 투표했어요.' : q.open ? '👆 내 생각과 같은 쪽을 눌러요.' : '⏳ 선생님이 투표를 시작하면 누를 수 있어요.';
    const res = el.querySelector('.lv-res');
    if (q.show) drawRes(i, res, true); else res.innerHTML = '';
  }

  box.querySelectorAll('.lv-bar [data-m]').forEach(b => b.onclick = () => {
    box.querySelectorAll('.lv-bar .btn').forEach(x => x.classList.toggle('line', x !== b));
    ({teacher, student, hand})[b.dataset.m]();
  });
  hand();
  box.querySelectorAll('.lv-bar .btn').forEach(x => x.classList.toggle('line', x.dataset.m !== 'hand'));
}
