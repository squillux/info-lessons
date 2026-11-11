/* 정보 개념 체험관 · 거북이(연필) 그리기 무대
   const t = new Turtle(canvas); t.run([['fd',50],['rt',90], ...], {delay}) — 엔트리의 '이동 방향으로 ○ 만큼 움직이기', '방향을 ○도 회전하기'와 같은 동작
   명령: fd(앞으로), rt(오른쪽 회전), lt(왼쪽 회전), pu(그리기 멈추기), pd(그리기 시작), color, go(x,y 위치로) */
class Turtle {
  constructor(cv){ this.cv = cv; this.ctx = cv.getContext('2d'); this.reset(); }
  reset(){
    const c = this.ctx, W = this.cv.width, H = this.cv.height;
    c.clearRect(0, 0, W, H); c.fillStyle = '#fff'; c.fillRect(0, 0, W, H);
    c.strokeStyle = '#eef1f8'; c.lineWidth = 1;
    for (let x = 0; x <= W; x += 20){ c.beginPath(); c.moveTo(x, 0); c.lineTo(x, H); c.stroke(); }
    for (let y = 0; y <= H; y += 20){ c.beginPath(); c.moveTo(0, y); c.lineTo(W, y); c.stroke(); }
    this.x = W / 2; this.y = H / 2; this.a = 0; this.pen = true; this.col = '#3b6cf6'; this.lines = 0; this.stop = true;
  }
  step([op, v, w]){
    const c = this.ctx;
    if (op === 'fd'){ const r = this.a * Math.PI / 180, nx = this.x + Math.cos(r) * v, ny = this.y + Math.sin(r) * v;
      if (this.pen){ c.strokeStyle = this.col; c.lineWidth = 3; c.lineCap = 'round'; c.beginPath(); c.moveTo(this.x, this.y); c.lineTo(nx, ny); c.stroke(); this.lines++; }
      this.x = nx; this.y = ny; }
    else if (op === 'rt') this.a += v; else if (op === 'lt') this.a -= v;
    else if (op === 'pu') this.pen = false; else if (op === 'pd') this.pen = true;
    else if (op === 'color') this.col = v;
    else if (op === 'go'){ this.x = this.cv.width / 2 + v; this.y = this.cv.height / 2 - w; }
  }
  /* cmds를 차례로 실행. delay(ms)가 0이면 한 번에 그림 */
  run(cmds, {delay = 0, onDone} = {}){
    this.reset(); this.stop = false;
    if (!delay){ cmds.forEach(s => this.step(s)); this.mark(); onDone && onDone(); return; }
    let i = 0, per = Math.max(1, Math.ceil(cmds.length / 240));
    const tick = () => { if (this.stop) return; for (let k = 0; k < per && i < cmds.length; k++) this.step(cmds[i++]);
      if (i < cmds.length) setTimeout(tick, delay); else { this.mark(); onDone && onDone(); } };
    tick();
  }
  /* 연필 위치 표시(화면에만, 다음 그리기 전에 지워지지 않도록 별도 겹쳐 그리기는 하지 않음) */
  mark(){ const c = this.ctx; c.fillStyle = '#ff7aa2'; c.beginPath(); c.arc(this.x, this.y, 4, 0, 7); c.fill(); }
}
