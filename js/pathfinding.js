// ── Pathfinding module ────────────────────────────
const COLS = 28, ROWS = 16;
let grid       = [];
let pathSteps  = [], pathIdx = 0, pathRunning = false;
let pathStart  = [2, 7], pathEnd = [25, 7];
let drawing    = false, drawType = 'wall', pathAlgo = 'astar';

// ── UI builder ────────────────────────────────────
function buildPathUI() {
  return `
    <div class="love-card">
      <div class="card-title">🗺️ Pathfinding Potion 🗺️</div>

      <div class="pill-tabs">
        <button class="pill-tab active" onclick="setPathAlgo('astar',this)">⭐ A* Star</button>
        <button class="pill-tab"        onclick="setPathAlgo('dijkstra',this)">🌊 Dijkstra</button>
        <button class="pill-tab"        onclick="setPathAlgo('bfs',this)">🌸 BFS</button>
      </div>

      <div class="complexity-row" id="pathComplexity">
        Time <span class="badge badge-info">O(E log V)</span>
        Optimal <span class="badge badge-ok">Yes 💕</span>
      </div>

      <div class="stats-row">
        <div class="stat-heart"><div class="stat-label">Explored</div><div class="stat-value" id="statComp">0</div></div>
        <div class="stat-heart"><div class="stat-label">Path Len</div><div class="stat-value" id="statSwap">~</div></div>
        <div class="stat-heart"><div class="stat-label">Steps</div><div class="stat-value" id="statAccess">0</div></div>
      </div>

      <div class="controls-row">
        <button class="cute-btn play" onclick="pathPlayPause()" id="btnPlay">▶ Find Path!</button>
        <button class="cute-btn soft" onclick="pathStep()">Step 💫</button>
        <button class="cute-btn soft" onclick="initPath()">Clear 🧹</button>
        <button class="cute-btn soft" onclick="mazeGenerate()">Maze 🌷</button>
        <span class="speed-label">Speed 💨</span>
        <input type="range" min="1" max="10" value="7" oninput="speed = 1100 - this.value * 100">
      </div>

      <div class="status-line" id="statusLine"> Draw walls, drag 💚 and ❤️ to move!</div>
      <div class="canvas-wrap">
        <canvas id="pathCanvas" height="288"
          onmousedown="pathMouseDown(event)" onmousemove="pathMouseMove(event)"
          onmouseup="drawing=false" onmouseleave="drawing=false"
          ontouchstart="pathTouchStart(event)" ontouchmove="pathTouchMove(event)"
          ontouchend="drawing=false" style="cursor:crosshair">
        </canvas>
      </div>
    </div>`;
}

function setPathAlgo(algo, btn) {
  pathAlgo = algo;
  document.querySelectorAll('.pill-tab').forEach(t => t.classList.remove('active'));
  btn.classList.add('active');
  const info = {
    astar:    ['O(E log V)', 'Yes 💕'],
    dijkstra: ['O(E log V)', 'Yes 💕'],
    bfs:      ['O(V+E)',     'Yes 💕'],
  };
  const [t, o] = info[algo];
  const el = gc('pathComplexity');
  if (el) el.innerHTML = `Time <span class="badge badge-info">${t}</span> Optimal <span class="badge badge-ok">${o}</span>`;
  initPath();
}

function initPath() {
  stopAnim(); pathRunning = false;
  grid = Array.from({ length: ROWS }, () => Array(COLS).fill(0));
  pathSteps = []; pathIdx = 0;
  ['statComp', 'statAccess'].forEach(id => { const e = gc(id); if (e) e.textContent = '0'; });
  const sw = gc('statSwap'); if (sw) sw.textContent = '~';
  setStatus('Draw walls~ drag 💚/❤️ to move!');
  drawPath();
  const b = gc('btnPlay'); if (b) b.innerHTML = '▶ Find Path!';
}

function mazeGenerate() {
  stopAnim(); pathRunning = false;
  grid = Array.from({ length: ROWS }, (_, r) =>
    Array.from({ length: COLS }, (__, c) =>
      (r % 2 === 1 && c % 2 === 1) ? 0 : (Math.random() < 0.35 ? 1 : 0)
    )
  );
  grid[pathStart[1]][pathStart[0]] = 0;
  grid[pathEnd[1]][pathEnd[0]]     = 0;
  pathSteps = []; pathIdx = 0;
  drawPath();
  setStatus('Maze conjured~ Press Find Path!');
  const b = gc('btnPlay'); if (b) b.innerHTML = '▶ Find Path!';
}

// ── Mouse / touch ─────────────────────────────────
function cellFromEvent(e, canvas) {
  const r = canvas.getBoundingClientRect();
  return [
    Math.max(0, Math.min(COLS - 1, Math.floor((e.clientX - r.left) * COLS / r.width))),
    Math.max(0, Math.min(ROWS - 1, Math.floor((e.clientY - r.top)  * ROWS / r.height))),
  ];
}
function pathMouseDown(e) {
  const [cx, cy] = cellFromEvent(e, gc('pathCanvas'));
  if (cx === pathStart[0] && cy === pathStart[1]) { drawing = true; drawType = 'start'; return; }
  if (cx === pathEnd[0]   && cy === pathEnd[1])   { drawing = true; drawType = 'end';   return; }
  drawType = grid[cy][cx] === 1 ? 'erase' : 'wall';
  drawing  = true; applyDraw(cx, cy);
}
function pathMouseMove(e) { if (!drawing) return; applyDraw(...cellFromEvent(e, gc('pathCanvas'))); }
function pathTouchStart(e) { e.preventDefault(); pathMouseDown(e.touches[0]); }
function pathTouchMove(e)  { e.preventDefault(); pathMouseMove(e.touches[0]); }
function applyDraw(cx, cy) {
  if (drawType === 'start') { pathStart = [cx, cy]; grid[cy][cx] = 0; }
  else if (drawType === 'end') { pathEnd = [cx, cy]; grid[cy][cx] = 0; }
  else if ((cx === pathStart[0] && cy === pathStart[1]) || (cx === pathEnd[0] && cy === pathEnd[1])) return;
  else grid[cy][cx] = drawType === 'wall' ? 1 : 0;
  drawPath();
}

// ── Algorithm ─────────────────────────────────────
function heuristic([x1, y1], [x2, y2]) { return Math.abs(x1 - x2) + Math.abs(y1 - y2); }

function generatePathSteps() {
  const steps   = [];
  const visited = Array.from({ length: ROWS }, () => Array(COLS).fill(false));
  const prev    = Array.from({ length: ROWS }, () => Array(COLS).fill(null));
  const [sx, sy] = pathStart, [ex, ey] = pathEnd;
  const dirs = [[0,1],[0,-1],[1,0],[-1,0]];

  if (pathAlgo === 'bfs') {
    const queue = [[sx, sy]]; visited[sy][sx] = true;
    while (queue.length) {
      const [x, y] = queue.shift();
      steps.push({ type: 'visit', x, y, explored: getVisited(visited) });
      if (x === ex && y === ey) break;
      for (const [dx, dy] of dirs) {
        const nx = x+dx, ny = y+dy;
        if (nx < 0 || ny < 0 || nx >= COLS || ny >= ROWS || visited[ny][nx] || grid[ny][nx]) continue;
        visited[ny][nx] = true; prev[ny][nx] = [x, y]; queue.push([nx, ny]);
      }
    }
  } else {
    const open   = [[0, sx, sy]];
    const gScore = Array.from({ length: ROWS }, () => Array(COLS).fill(Infinity));
    gScore[sy][sx] = 0;
    while (open.length) {
      open.sort((a, b) => a[0] - b[0]);
      const [, x, y] = open.shift();
      if (visited[y][x]) continue;
      visited[y][x] = true;
      steps.push({ type: 'visit', x, y, explored: getVisited(visited) });
      if (x === ex && y === ey) break;
      for (const [dx, dy] of dirs) {
        const nx = x+dx, ny = y+dy;
        if (nx < 0 || ny < 0 || nx >= COLS || ny >= ROWS || visited[ny][nx] || grid[ny][nx]) continue;
        const ng = gScore[y][x] + 1;
        if (ng < gScore[ny][nx]) {
          gScore[ny][nx] = ng; prev[ny][nx] = [x, y];
          const h = pathAlgo === 'dijkstra' ? 0 : heuristic([nx, ny], [ex, ey]);
          open.push([ng + h, nx, ny]);
        }
      }
    }
  }

  const path = []; let cur = [ex, ey];
  while (cur && !(cur[0] === sx && cur[1] === sy)) { path.unshift(cur); cur = prev[cur[1]][cur[0]]; }
  path.unshift([sx, sy]);
  if (path.length > 1) steps.push({ type: 'path', path, explored: getVisited(visited) });
  return steps;
}

function getVisited(v) {
  const r = [];
  for (let row = 0; row < ROWS; row++)
    for (let c = 0; c < COLS; c++)
      if (v[row][c]) r.push([c, row]);
  return r;
}

// ── Draw ──────────────────────────────────────────
function drawPath(visitedCells, pathCells) {
  const canvas = gc('pathCanvas'); if (!canvas) return;
  const ctx = canvas.getContext('2d');
  const W = canvas.offsetWidth || 800; canvas.width = W;
  const H = Math.round(ROWS * (W / COLS)); canvas.height = H;
  const cw = W / COLS, ch = H / ROWS;

  drawCanvasBg(ctx, W, H);

  for (let r = 0; r < ROWS; r++) {
    for (let c = 0; c < COLS; c++) {
      const x = c * cw, y = r * ch, p = 3;
      const isSt    = c === pathStart[0] && r === pathStart[1];
      const isEn    = c === pathEnd[0]   && r === pathEnd[1];
      const isWall  = grid[r][c] === 1;
      const isPath  = pathCells?.some(([pc, pr]) => pc === c && pr === r);
      const isVisit = visitedCells?.some(([vc, vr]) => vc === c && vr === r);

      if (isWall) {
        ctx.fillStyle = '#e8b0c8'; ctx.fillRect(x+p, y+p, cw-p*2, ch-p*2);
        ctx.fillStyle = '#d4a0b8'; ctx.fillRect(x+p, y+p, cw-p*2, 2);
      } else if (isSt) {
        ctx.shadowColor = C.start; ctx.shadowBlur = 8;
        ctx.fillStyle = C.start;
        ctx.beginPath(); ctx.arc(x+cw/2, y+ch/2, Math.min(cw,ch)/2-2, 0, Math.PI*2); ctx.fill();
        ctx.shadowBlur = 0;
        ctx.fillStyle = '#fff'; ctx.font = `bold ${Math.floor(ch*0.45)}px Nunito`;
        ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
        ctx.fillText('💚', x+cw/2, y+ch/2);
      } else if (isEn) {
        ctx.shadowColor = C.end; ctx.shadowBlur = 8;
        ctx.fillStyle = C.end;
        ctx.beginPath(); ctx.arc(x+cw/2, y+ch/2, Math.min(cw,ch)/2-2, 0, Math.PI*2); ctx.fill();
        ctx.shadowBlur = 0;
        ctx.fillStyle = '#fff'; ctx.font = `bold ${Math.floor(ch*0.45)}px Nunito`;
        ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
        ctx.fillText('❤️', x+cw/2, y+ch/2);
      } else if (isPath) {
        ctx.fillStyle = '#ffd166';
        ctx.beginPath(); ctx.arc(x+cw/2, y+ch/2, Math.min(cw,ch)/2-2, 0, Math.PI*2); ctx.fill();
        ctx.fillStyle = '#ffaa00';
        ctx.beginPath(); ctx.arc(x+cw/2, y+ch/2, Math.min(cw,ch)/2-4, 0, Math.PI*2); ctx.fill();
      } else if (isVisit) {
        ctx.fillStyle = 'rgba(232,213,245,0.7)';
        ctx.beginPath(); ctx.arc(x+cw/2, y+ch/2, Math.min(cw,ch)/2-3, 0, Math.PI*2); ctx.fill();
      }
    }
  }
  // dot grid
  ctx.fillStyle = 'rgba(244,135,158,0.2)';
  for (let r = 0; r <= ROWS; r++)
    for (let c = 0; c <= COLS; c++) {
      ctx.beginPath(); ctx.arc(c*cw, r*ch, 1, 0, Math.PI*2); ctx.fill();
    }
}

// ── Step / play ───────────────────────────────────
function pathStep() {
  if (!pathSteps.length) pathSteps = generatePathSteps();
  if (pathIdx >= pathSteps.length) { setStatus('Done!'); return false; }
  const step   = pathSteps[pathIdx++];
  const isPath = step.type === 'path';
  drawPath(step.explored, isPath ? step.path : null);
  gc('statComp').textContent    = pathIdx;
  gc('statAccess').textContent  = pathIdx;
  if (isPath) {
    gc('statSwap').textContent = step.path.length;
    setStatus(`Path found! ${step.path.length} steps~`);
    return false;
  }
  setStatus(`Exploring (${step.x}, ${step.y})~`);
  return pathIdx < pathSteps.length;
}

function pathPlayPause() {
  if (pathRunning) {
    stopAnim(); pathRunning = false;
    const b = gc('btnPlay'); if (b) b.innerHTML = '▶ Find Path!';
    return;
  }
  if (!pathSteps.length || pathIdx === 0) pathSteps = generatePathSteps();
  pathRunning = true;
  const b = gc('btnPlay'); if (b) b.innerHTML = '⏸ Pause~';
  const loop = () => {
    if (!pathRunning) return;
    const ok = pathStep();
    if (ok) animTimer = setTimeout(loop, speed);
    else { pathRunning = false; const b = gc('btnPlay'); if (b) b.innerHTML = '▶ Find Path!'; }
  };
  loop();
}
