// ── Graph module ──────────────────────────────────
let graphNodes   = [], graphEdges = [];
let graphSteps   = [], graphIdx = 0;
let graphAlgo    = 'bfs';
let graphStart   = 0, graphRunning = false;

// ── UI builder ────────────────────────────────────
function buildGraphUI() {
  return `
    <div class="love-card">
      <div class="card-title">💞 Graph Traversal 💞</div>

      <div class="pill-tabs">
        <button class="pill-tab active" onclick="setGraphAlgo('bfs',this)">💗 BFS</button>
        <button class="pill-tab"        onclick="setGraphAlgo('dfs',this)">💜 DFS</button>
      </div>

      <div class="complexity-row" id="graphComplexity">
        Time <span class="badge badge-info">O(V+E)</span>
        Strategy <span class="badge badge-warn">Level by level</span>
      </div>

      <div class="stats-row">
        <div class="stat-heart"><div class="stat-label">Visited</div><div class="stat-value" id="statComp">0</div></div>
        <div class="stat-heart"><div class="stat-label">Edges</div><div class="stat-value" id="statSwap">0</div></div>
        <div class="stat-heart"><div class="stat-label">Step</div><div class="stat-value" id="statAccess">0</div></div>
      </div>

      <div class="controls-row">
        <button class="cute-btn play" onclick="graphPlayPause()" id="btnPlay">▶ Traverse!</button>
        <button class="cute-btn soft" onclick="graphStep()">Step 💫</button>
        <button class="cute-btn soft" onclick="initGraph()">New 🎀</button>
        <span class="speed-label">Start 💚</span>
        <input type="range" min="0" max="11" value="0" style="width:70px" id="startSlider"
               oninput="graphStart=+this.value; initGraphSteps(); drawGraph([])">
        <span class="speed-label">Speed 💨</span>
        <input type="range" min="1" max="10" value="5"
               oninput="speed = 1100 - this.value * 100">
      </div>

      <div class="status-line" id="statusLine"> Pick a start node~ then Traverse!</div>
      <div class="canvas-wrap"><canvas id="graphCanvas" height="310"></canvas></div>
    </div>`;
}

function setGraphAlgo(algo, btn) {
  graphAlgo = algo;
  document.querySelectorAll('.pill-tab').forEach(t => t.classList.remove('active'));
  btn.classList.add('active');
  const info = {
    bfs: ['O(V+E)', 'Level by level', 'warn'],
    dfs: ['O(V+E)', 'Depth first',    'info'],
  };
  const [t, s, sc] = info[algo];
  const el = gc('graphComplexity');
  if (el) el.innerHTML = `Time <span class="badge badge-info">${t}</span> Strategy <span class="badge badge-${sc}">${s}</span>`;
  initGraphSteps(); drawGraph([]);
  setStatus(`${algo.toUpperCase()} ready~ press Traverse!`);
  const b = gc('btnPlay'); if (b) b.innerHTML = '▶ Traverse!';
}

function initGraph() {
  stopAnim();
  const N = 12, W = 700, H = 260, cx = W / 2, cy = H / 2;
  graphNodes = Array.from({ length: N }, (_, i) => {
    const angle = (i / N) * Math.PI * 2;
    const r     = i < 6 ? 115 : 58;
    const off   = i < 6 ? 0   : Math.PI / N;
    return { x: cx + Math.cos(angle + off) * r, y: cy + Math.sin(angle + off) * r, id: i };
  });
  graphEdges = [];
  for (let i = 1; i < N; i++) graphEdges.push([i-1, i]);
  graphEdges.push([0, N-1]);
  for (let k = 0; k < 8; k++) {
    const a = Math.floor(Math.random() * N), b = Math.floor(Math.random() * N);
    if (a !== b && !graphEdges.some(([x, y]) => (x===a&&y===b)||(x===b&&y===a)))
      graphEdges.push([a, b]);
  }
  graphStart = 0; initGraphSteps(); drawGraph([]);
  setStatus('New graph! Press Traverse~');
  const b = gc('btnPlay'); if (b) b.innerHTML = '▶ Traverse!';
}

function initGraphSteps() {
  graphSteps = []; graphIdx = 0;
  const N   = graphNodes.length;
  const adj = Array.from({ length: N }, () => []);
  graphEdges.forEach(([a, b]) => { adj[a].push(b); adj[b].push(a); });
  const visited = Array(N).fill(false);

  if (graphAlgo === 'bfs') {
    const queue = [graphStart]; visited[graphStart] = true;
    while (queue.length) {
      const u = queue.shift();
      graphSteps.push({ visiting: u, visited: [...visited], msg: `BFS: visiting node ${u} 💕` });
      for (const v of adj[u]) {
        if (!visited[v]) {
          visited[v] = true; queue.push(v);
          graphSteps.push({ visiting: u, next: v, visited: [...visited], msg: `BFS: ${u} → queuing ${v} 🌸` });
        }
      }
    }
  } else {
    function dfs(u) {
      visited[u] = true;
      graphSteps.push({ visiting: u, visited: [...visited], msg: `DFS: entering node ${u} 🌷` });
      for (const v of adj[u]) {
        if (!visited[v]) {
          graphSteps.push({ visiting: u, next: v, visited: [...visited], msg: `DFS: ${u} → diving to ${v} 💜` });
          dfs(v);
        }
      }
      graphSteps.push({ visiting: u, backtrack: true, visited: [...visited], msg: `DFS: back from ${u} 🌸` });
    }
    dfs(graphStart);
  }
}

// ── Draw ──────────────────────────────────────────
function drawGraph(visitedArr, currentNode, nextNode) {
  const canvas = gc('graphCanvas'); if (!canvas) return;
  const ctx = canvas.getContext('2d');
  const W = canvas.offsetWidth || 800; canvas.width = W;
  const H = 310; canvas.height = H;
  const sx = W / 700, sy = H / 280;
  drawCanvasBg(ctx, W, H, true);

  // Edges
  graphEdges.forEach(([a, b]) => {
    const na = graphNodes[a], nb = graphNodes[b];
    const av = visitedArr && visitedArr[a] && visitedArr[b];
    ctx.strokeStyle = av ? 'rgba(200,109,212,0.4)' : 'rgba(244,135,158,0.25)';
    ctx.lineWidth   = av ? 2 : 1.5;
    ctx.beginPath(); ctx.moveTo(na.x * sx, na.y * sy); ctx.lineTo(nb.x * sx, nb.y * sy); ctx.stroke();
  });

  // Nodes
  graphNodes.forEach((n, i) => {
    const x = n.x * sx, y = n.y * sy;
    const isSt  = i === graphStart;
    const isCur = i === currentNode;
    const isNx  = i === nextNode;
    const isVis = visitedArr && visitedArr[i];

    let col = '#c86dd4', bgCol = '#f0d8f8';
    if (isVis) { col = '#f4879e'; bgCol = '#fde8ef'; }
    if (isCur) { col = '#ff9f43'; bgCol = '#fff0d8'; }
    if (isNx)  { col = '#26de81'; bgCol = '#d0f8e4'; }
    if (isSt && !isCur && !isVis) { col = '#26de81'; bgCol = '#d0f8e4'; }

    ctx.shadowColor = col + '66'; ctx.shadowBlur = (isCur || isNx) ? 16 : 8;
    ctx.fillStyle = bgCol; ctx.beginPath(); ctx.arc(x, y, 18, 0, Math.PI*2); ctx.fill();
    ctx.strokeStyle = col; ctx.lineWidth = 2.5; ctx.stroke();
    ctx.shadowBlur = 0;
    ctx.fillStyle = col + '55'; ctx.beginPath(); ctx.arc(x, y, 12, 0, Math.PI*2); ctx.fill();
    ctx.fillStyle = col; ctx.font = 'bold 10px Nunito'; ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
    ctx.fillText(i, x, y);
  });

  // Legend
  const items = [['Node','#c86dd4'], ['Start','#26de81'], ['Visiting','#ff9f43'], ['Visited','#f4879e']];
  let lx = 10, ly = H - 22;
  ctx.font = '600 10px Nunito';
  items.forEach(([lbl, col]) => {
    ctx.fillStyle = col + '33'; ctx.strokeStyle = col; ctx.lineWidth = 1.5;
    ctx.beginPath(); ctx.arc(lx+7, ly, 7, 0, Math.PI*2); ctx.fill(); ctx.stroke();
    ctx.fillStyle = '#c48fa8'; ctx.textAlign = 'left'; ctx.fillText(lbl, lx+18, ly+4);
    lx += lbl.length * 5.5 + 28;
  });
}

// ── Step / play ───────────────────────────────────
function graphStep() {
  if (!graphSteps.length) initGraphSteps();
  if (graphIdx >= graphSteps.length) { setStatus('All nodes visited~ beautiful!'); return false; }
  const s = graphSteps[graphIdx++];
  drawGraph(s.visited, s.visiting, s.next);
  gc('statComp').textContent   = s.visited ? s.visited.filter(Boolean).length : 0;
  gc('statSwap').textContent   = graphIdx;
  gc('statAccess').textContent = graphIdx;
  setStatus(s.msg);
  return graphIdx < graphSteps.length;
}

function graphPlayPause() {
  if (graphRunning) {
    stopAnim(); graphRunning = false;
    const b = gc('btnPlay'); if (b) b.innerHTML = '▶ Traverse!';
    return;
  }
  if (graphIdx === 0 || graphIdx >= graphSteps.length) initGraphSteps();
  graphRunning = true;
  const b = gc('btnPlay'); if (b) b.innerHTML = '⏸ Pause~';
  const loop = () => {
    if (!graphRunning) return;
    const ok = graphStep();
    if (ok) animTimer = setTimeout(loop, speed);
    else { graphRunning = false; const b = gc('btnPlay'); if (b) b.innerHTML = '▶ Traverse!'; }
  };
  loop();
}
