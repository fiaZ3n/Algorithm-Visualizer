// ── BST module ────────────────────────────────────
class BSTNode {
  constructor(v) { this.val = v; this.left = null; this.right = null; }
}

let bstRoot = null;
let bstComp = 0;

// ── UI builder ────────────────────────────────────
function buildBSTUI() {
  return `
    <div class="love-card">
      <div class="card-title">🌺 Binary Search Tree 🌺</div>

      <div class="complexity-row">
        Time <span class="badge badge-info">O(log n) avg</span>
        Space <span class="badge badge-info">O(n)</span>
      </div>

      <div class="stats-row">
        <div class="stat-heart"><div class="stat-label">Comparisons</div><div class="stat-value" id="statComp">0</div></div>
        <div class="stat-heart"><div class="stat-label">Nodes</div><div class="stat-value" id="statSwap">0</div></div>
        <div class="stat-heart"><div class="stat-label">Height</div><div class="stat-value" id="statAccess">0</div></div>
      </div>

      <div class="controls-row">
        <input class="cute-input" type="number" id="bstInput" placeholder="1–99 💕" min="1" max="99"
               onkeydown="if(event.key==='Enter') bstInsert()">
        <button class="cute-btn play" onclick="bstInsert()">Insert 🌸</button>
        <button class="cute-btn soft" onclick="bstSearch()">Search 🔍</button>
        <button class="cute-btn soft" onclick="bstDelete()">Delete 💔</button>
        <button class="cute-btn soft" onclick="bstRandom()">Random 🎀</button>
        <button class="cute-btn soft" onclick="bstClear()">Clear ✨</button>
      </div>

      <div class="status-line" id="statusLine"> Enter a number and click Insert!</div>
      <div class="canvas-wrap"><canvas id="bstCanvas" height="340"></canvas></div>
    </div>`;
}

// ── Tree helpers ──────────────────────────────────
function bstIns(root, v) {
  if (!root) return new BSTNode(v);
  if (v < root.val) root.left  = bstIns(root.left,  v);
  else if (v > root.val) root.right = bstIns(root.right, v);
  return root;
}
function bstCnt(n)    { return n ? 1 + bstCnt(n.left)  + bstCnt(n.right)  : 0; }
function bstHt(n)     { return n ? 1 + Math.max(bstHt(n.left), bstHt(n.right)) : 0; }
function bstLayout(node, l, r, depth) {
  if (!node) return;
  node.x = (l + r) / 2;
  node.y = depth * 66 + 48;
  bstLayout(node.left,  l,       (l+r)/2, depth + 1);
  bstLayout(node.right, (l+r)/2, r,       depth + 1);
}

// ── Operations ────────────────────────────────────
function bstInsert() {
  const v = +gc('bstInput').value;
  if (!v || v < 1 || v > 99) { setStatus('Please enter 1–99 sweetie~'); return; }
  const steps = [];
  function ins(node, v) {
    if (!node) { steps.push({ hl: null, msg: `Planting ${v} as a new blossom 🌸` }); return new BSTNode(v); }
    bstComp++;
    if (v < node.val) { steps.push({ hl: node.val, msg: `${v} < ${node.val}, blooming left 🌷` });  node.left  = ins(node.left,  v); }
    else if (v > node.val) { steps.push({ hl: node.val, msg: `${v} > ${node.val}, blooming right 🌷` }); node.right = ins(node.right, v); }
    else steps.push({ hl: node.val, dup: true, msg: `${v} already blooms here 💕` });
    return node;
  }
  bstRoot = ins(bstRoot, v);
  gc('bstInput').value = '';
  updateBSTStats(); animateBST(steps);
}

function bstSearch() {
  const v = +gc('bstInput').value;
  if (!v) { setStatus('Enter a number to find~'); return; }
  const steps = [];
  function srch(node) {
    if (!node) { steps.push({ hl: null, msg: `${v} not found in the garden 🥺` }); return; }
    bstComp++;
    if (v === node.val) { steps.push({ hl: node.val, found: true, msg: `Found ${v}! 💖` }); return; }
    if (v < node.val)   { steps.push({ hl: node.val, msg: `${v} < ${node.val}, going left 🌷` });  srch(node.left); }
    else                { steps.push({ hl: node.val, msg: `${v} > ${node.val}, going right 🌷` }); srch(node.right); }
  }
  srch(bstRoot); updateBSTStats(); animateBST(steps);
}

function bstDelete() {
  const v = +gc('bstInput').value;
  if (!v) { setStatus('Enter a number to remove~'); return; }
  function fMin(n) { while (n.left) n = n.left; return n; }
  function del(n, v) {
    if (!n) return null; bstComp++;
    if (v < n.val) n.left  = del(n.left,  v);
    else if (v > n.val) n.right = del(n.right, v);
    else {
      if (!n.left)  return n.right;
      if (!n.right) return n.left;
      const m = fMin(n.right); n.val = m.val; n.right = del(n.right, m.val);
    }
    return n;
  }
  bstRoot = del(bstRoot, v);
  gc('bstInput').value = '';
  setStatus(`${v} gently removed~`);
  updateBSTStats(); drawBST(null, null);
}

function animateBST(steps) {
  let i = 0;
  const next = () => {
    if (i >= steps.length) { drawBST(null, null); return; }
    const s = steps[i++];
    drawBST(s.hl, s.found ? 'found' : s.dup ? 'dup' : 'cmp');
    setStatus(s.msg);
    setTimeout(next, 450);
  };
  next();
}

function updateBSTStats() {
  gc('statComp').textContent    = bstComp;
  gc('statSwap').textContent    = bstCnt(bstRoot);
  gc('statAccess').textContent  = bstHt(bstRoot);
}

// ── Draw ──────────────────────────────────────────
function drawBST(hlVal, hlType) {
  const canvas = gc('bstCanvas'); if (!canvas) return;
  const ctx = canvas.getContext('2d');
  const W = canvas.offsetWidth || 800; canvas.width = W; canvas.height = 340;
  drawCanvasBg(ctx, W, 340, true);

  if (!bstRoot) {
    ctx.fillStyle = '#c48fa8'; ctx.font = '600 13px Nunito'; ctx.textAlign = 'center';
    ctx.fillText('🌸 Plant some numbers to grow your tree! 🌸', W / 2, 170);
    return;
  }

  bstLayout(bstRoot, 0, 1, 0);

  function drawEdges(node) {
    if (!node) return;
    const nx = node.x * W, ny = node.y;
    if (node.left) {
      ctx.strokeStyle = 'rgba(244,135,158,0.4)'; ctx.lineWidth = 2; ctx.setLineDash([6, 4]);
      ctx.beginPath(); ctx.moveTo(nx, ny); ctx.lineTo(node.left.x * W, node.left.y); ctx.stroke();
      ctx.setLineDash([]); drawEdges(node.left);
    }
    if (node.right) {
      ctx.strokeStyle = 'rgba(244,135,158,0.4)'; ctx.lineWidth = 2; ctx.setLineDash([6, 4]);
      ctx.beginPath(); ctx.moveTo(nx, ny); ctx.lineTo(node.right.x * W, node.right.y); ctx.stroke();
      ctx.setLineDash([]); drawEdges(node.right);
    }
  }

  function drawNodes(node) {
    if (!node) return;
    const nx = node.x * W, ny = node.y, isHL = node.val === hlVal;
    let col = '#c86dd4', bg2 = '#f0d8f8';
    if (isHL) {
      if (hlType === 'found') { col = '#26de81'; bg2 = '#d0f8e4'; }
      else if (hlType === 'dup')  { col = '#ff9f43'; bg2 = '#fff0d8'; }
      else                        { col = '#e85d8a'; bg2 = '#fde8ef'; }
    }
    ctx.shadowColor = col + '66'; ctx.shadowBlur = isHL ? 16 : 8;
    ctx.fillStyle = bg2; ctx.beginPath(); ctx.arc(nx, ny, 20, 0, Math.PI*2); ctx.fill();
    ctx.strokeStyle = col; ctx.lineWidth = 2.5; ctx.stroke();
    ctx.shadowBlur = 0;
    ctx.fillStyle = col + '44'; ctx.beginPath(); ctx.arc(nx, ny, 14, 0, Math.PI*2); ctx.fill();
    ctx.fillStyle = col; ctx.font = 'bold 11px Nunito'; ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
    ctx.fillText(node.val, nx, ny);
    drawNodes(node.left); drawNodes(node.right);
  }

  drawEdges(bstRoot);
  drawNodes(bstRoot);
}

function bstRandom() {
  bstRoot = null; bstComp = 0;
  const vals = new Set();
  while (vals.size < 10) vals.add(Math.floor(Math.random() * 85) + 5);
  vals.forEach(v => { bstRoot = bstIns(bstRoot, v); });
  updateBSTStats(); drawBST(null, null);
  setStatus('Random garden planted~ 10 blooms!');
}
function bstClear() {
  bstRoot = null; bstComp = 0;
  updateBSTStats(); drawBST(null, null);
  setStatus('Garden cleared~ so fresh!');
}
function initBST() { bstRoot = null; bstComp = 0; bstRandom(); }
