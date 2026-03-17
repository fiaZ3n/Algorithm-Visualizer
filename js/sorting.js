// ── Sorting module ────────────────────────────────
let sortArr   = [];
let sortAlgo  = 'bubble';
let sortState = null;

// ── UI builder ────────────────────────────────────
function buildSortUI() {
  return `
    <div class="love-card">
      <div class="card-title">🌸 Sorting Spells 🌸</div>

      <div class="pill-tabs">
        <button class="pill-tab active"  onclick="setSortAlgo('bubble',this)">💧 Bubble</button>
        <button class="pill-tab"         onclick="setSortAlgo('selection',this)">✨ Selection</button>
        <button class="pill-tab"         onclick="setSortAlgo('insertion',this)">🌷 Insertion</button>
        <button class="pill-tab"         onclick="setSortAlgo('merge',this)">💞 Merge</button>
        <button class="pill-tab"         onclick="setSortAlgo('quick',this)">🌸 Quick</button>
      </div>

      <div class="complexity-row" id="sortComplexity">
        Time <span class="badge badge-warn">O(n²)</span>
        Space <span class="badge badge-info">O(1)</span>
      </div>

      <div class="stats-row">
        <div class="stat-heart"><div class="stat-label">Comparisons</div><div class="stat-value" id="statComp">0</div></div>
        <div class="stat-heart"><div class="stat-label">Swaps</div><div class="stat-value" id="statSwap">0</div></div>
        <div class="stat-heart"><div class="stat-label">Accesses</div><div class="stat-value" id="statAccess">0</div></div>
      </div>

      <div class="controls-row">
        <button class="cute-btn play" onclick="sortPlayPause()" id="btnPlay">▶ Play!</button>
        <button class="cute-btn soft" onclick="sortStep()">Step 💫</button>
        <button class="cute-btn soft" onclick="initSort()">Shuffle 🌸</button>
        <button class="cute-btn soft" onclick="sortReset()">Reset 🔄</button>
        <span class="speed-label">Speed 💨</span>
        <input type="range" min="1" max="10" value="5" oninput="speed = 1100 - this.value * 100">
        <span class="speed-label">Size 📏</span>
        <input type="range" min="10" max="60" value="30" id="sortSize" oninput="resizeSort(this.value)">
      </div>

      <div class="status-line" id="statusLine"> Press Play or Step to begin~</div>
      <div class="canvas-wrap"><canvas id="sortCanvas" height="220"></canvas></div>
    </div>`;
}

function setSortAlgo(algo, btn) {
  sortAlgo = algo;
  document.querySelectorAll('.pill-tab').forEach(t => t.classList.remove('active'));
  btn.classList.add('active');

  const cx = {
    bubble:    ['O(n²)',         'O(1)',      'warn'],
    selection: ['O(n²)',         'O(1)',      'warn'],
    insertion: ['O(n²)',         'O(1)',      'warn'],
    merge:     ['O(n log n)',    'O(n)',      'info'],
    quick:     ['O(n log n)',    'O(log n)',  'info'],
  };
  const [t, s, tc] = cx[algo];
  const el = gc('sortComplexity');
  if (el) el.innerHTML = `Time <span class="badge badge-${tc}">${t}</span> Space <span class="badge badge-info">${s}</span>`;
  sortReset();
}

function resizeSort(n) { initSort(+n); }

function initSort(n) {
  stopAnim();
  const size = n || (+gc('sortSize')?.value || 30);
  sortArr   = Array.from({ length: size }, () => Math.floor(Math.random() * 85) + 10);
  sortState = null;
  updateStats(0, 0, 0);
  setStatus('Array shuffled~ press Play!');
  drawSort(sortArr, {});
}

function sortReset() {
  stopAnim();
  sortState = null;
  updateStats(0, 0, 0);
  setStatus('Reset~ press Play!');
  drawSort(sortArr, {});
  running = false;
  const b = gc('btnPlay');
  if (b) b.innerHTML = '▶ Play!';
}

// ── Generators ────────────────────────────────────
function* bubbleSortGen(arr) {
  const a = [...arr]; let c = 0, s = 0, ac = 0;
  for (let i = 0; i < a.length; i++) {
    for (let j = 0; j < a.length - i - 1; j++) {
      c++; ac += 2;
      yield { arr: [...a], hi: [j, j+1], sorted: Array.from({length:i}, (_,k) => a.length-1-k), msg: `Comparing a[${j}]=${a[j]} and a[${j+1}]=${a[j+1]} 🌸`, c, s, ac };
      if (a[j] > a[j+1]) { [a[j], a[j+1]] = [a[j+1], a[j]]; s++; ac += 2; }
    }
  }
  yield { arr: [...a], hi: [], sorted: Array.from({length:a.length}, (_, i) => i), msg: 'All sorted~ 💖', c, s, ac };
}

function* selectionSortGen(arr) {
  const a = [...arr]; let c = 0, s = 0, ac = 0;
  for (let i = 0; i < a.length; i++) {
    let m = i;
    for (let j = i + 1; j < a.length; j++) {
      c++; ac += 2;
      yield { arr: [...a], hi: [j, m], pivot: [i], sorted: Array.from({length:i}, (_,k) => k), msg: `Min=${a[m]} at [${m}], checking [${j}]=${a[j]} 💫`, c, s, ac };
      if (a[j] < a[m]) m = j;
    }
    if (m !== i) { [a[i], a[m]] = [a[m], a[i]]; s++; ac += 2; }
  }
  yield { arr: [...a], hi: [], sorted: Array.from({length:a.length}, (_, i) => i), msg: 'All sorted~ 💖', c, s, ac };
}

function* insertionSortGen(arr) {
  const a = [...arr]; let c = 0, s = 0, ac = 0;
  for (let i = 1; i < a.length; i++) {
    let j = i;
    while (j > 0) {
      c++; ac += 2;
      yield { arr: [...a], hi: [j, j-1], sorted: Array.from({length:i}, (_,k) => k), msg: `Inserting ${a[i]}, comparing with ${a[j-1]} ✨`, c, s, ac };
      if (a[j] < a[j-1]) { [a[j], a[j-1]] = [a[j-1], a[j]]; s++; ac += 2; j--; } else break;
    }
  }
  yield { arr: [...a], hi: [], sorted: Array.from({length:a.length}, (_, i) => i), msg: 'All sorted~ 💖', c, s, ac };
}

function* mergeSortGen(arr) {
  const a = [...arr]; let c = 0, s = 0, ac = 0;
  function* merge(l, r) {
    const mid = l + r >> 1; let i = l, j = mid + 1; const tmp = [];
    while (i <= mid && j <= r) {
      c++; ac += 2;
      yield { arr: [...a], hi: [i, j], pivot: [l, r], sorted: [], msg: `Merging [${l}..${mid}][${mid+1}..${r}]: ${a[i]} vs ${a[j]} 💕`, c, s, ac };
      if (a[i] <= a[j]) tmp.push(a[i++]); else tmp.push(a[j++]);
    }
    while (i <= mid) tmp.push(a[i++]);
    while (j <= r)   tmp.push(a[j++]);
    for (let k = 0; k < tmp.length; k++) { a[l+k] = tmp[k]; s++; ac++; }
    yield { arr: [...a], hi: [], pivot: [], sorted: [], msg: `Merged subarray [${l}..${r}] 🌷`, c, s, ac };
  }
  function* ms(l, r) {
    if (l >= r) return;
    const mid = l + r >> 1;
    yield* ms(l, mid); yield* ms(mid+1, r); yield* merge(l, r);
  }
  yield* ms(0, a.length - 1);
  yield { arr: [...a], hi: [], sorted: Array.from({length:a.length}, (_, i) => i), msg: 'All sorted~ 💖', c, s, ac };
}

function* quickSortGen(arr) {
  const a = [...arr]; let c = 0, s = 0, ac = 0;
  function* partition(l, r) {
    const pv = a[r]; let i = l - 1;
    yield { arr: [...a], hi: [r], pivot: [r], sorted: [], msg: `Pivot=${pv}, partitioning [${l}..${r}] 🌸`, c, s, ac };
    for (let j = l; j < r; j++) {
      c++; ac += 2;
      yield { arr: [...a], hi: [j, i+1], pivot: [r], sorted: [], msg: `${a[j]} vs pivot ${pv} 🏹`, c, s, ac };
      if (a[j] <= pv) { i++; [a[i], a[j]] = [a[j], a[i]]; s++; ac += 2; }
    }
    [a[i+1], a[r]] = [a[r], a[i+1]]; s++; ac += 2;
    yield { arr: [...a], hi: [i+1], pivot: [i+1], sorted: [], msg: `Pivot ${pv} placed at index ${i+1} 🌸`, c, s, ac };
  }
  function* qs(l, r) {
    if (l >= r) return;
    const gen = partition(l, r);
    while (true) { const nx = gen.next(); if (nx.done) break; yield nx.value; }
    const pv = a[r > 0 ? r : 0]; let pi = l;
    for (let k = l; k <= r; k++) if (a[k] < pv) pi++;
    yield* qs(l, pi-1); yield* qs(pi+1, r);
  }
  yield* qs(0, a.length - 1);
  yield { arr: [...a], hi: [], sorted: Array.from({length:a.length}, (_, i) => i), msg: 'All sorted~ 💖', c, s, ac };
}

function getSortGen() {
  if (sortAlgo === 'bubble')    return bubbleSortGen(sortArr);
  if (sortAlgo === 'selection') return selectionSortGen(sortArr);
  if (sortAlgo === 'insertion') return insertionSortGen(sortArr);
  if (sortAlgo === 'merge')     return mergeSortGen(sortArr);
  return quickSortGen(sortArr);
}

// ── Draw ──────────────────────────────────────────
function drawSort(arr, state) {
  const canvas = gc('sortCanvas'); if (!canvas) return;
  const ctx = canvas.getContext('2d');
  const W = canvas.offsetWidth || 800; canvas.width = W;
  const H = 220; canvas.height = H;
  drawCanvasBg(ctx, W, H);

  const { hi = [], sorted = [], pivot = [] } = state || {};
  const n = arr.length, barW = (W - 16) / n, maxV = Math.max(...arr);

  arr.forEach((v, i) => {
    const x  = 8 + i * barW;
    const bh = Math.round((v / maxV) * (H - 32));
    const y  = H - bh - 6;

    let col = C.bar;
    if (sorted.includes(i)) col = C.sorted;
    if (pivot.includes(i))  col = C.pivot;
    if (hi.includes(i))     col = sorted.includes(i) ? C.sorted : C.compare;

    const r = Math.min(6, barW / 2 - 1);
    ctx.shadowColor = col + '88'; ctx.shadowBlur = hi.includes(i) ? 12 : 4;
    const grad = ctx.createLinearGradient(x, y, x, y + bh);
    grad.addColorStop(0, col); grad.addColorStop(1, col + '88');
    ctx.fillStyle = grad;
    ctx.beginPath();
    if (ctx.roundRect) ctx.roundRect(x + 1, y, Math.max(barW - 2, 1), bh, r);
    else ctx.rect(x + 1, y, Math.max(barW - 2, 1), bh);
    ctx.fill();
    ctx.shadowBlur = 0;

    if (barW > 10) {
      ctx.fillStyle = '#fff'; ctx.globalAlpha = 0.5;
      ctx.beginPath(); ctx.arc(x + barW / 2, y + 4, Math.min(3, barW / 4), 0, Math.PI * 2); ctx.fill();
      ctx.globalAlpha = 1;
    }
    if (barW > 18) {
      ctx.fillStyle = col; ctx.font = 'bold 9px Nunito'; ctx.textAlign = 'center';
      ctx.fillText(v, x + barW / 2, y - 3);
    }
  });
}

// ── Step / play ───────────────────────────────────
function sortStep() {
  if (!sortState) sortState = getSortGen();
  const nx = sortState.next();
  if (nx.done) {
    setStatus('All sorted! Beautiful~');
    running = false;
    const b = gc('btnPlay'); if (b) b.innerHTML = '▶ Play!';
    return false;
  }
  const { arr, hi, sorted, pivot, msg, c, s, ac } = nx.value;
  drawSort(arr, { hi, sorted: sorted || [], pivot: pivot || [] });
  updateStats(c, s, ac);
  setStatus(msg);
  return true;
}

function sortPlayPause() {
  if (running) {
    stopAnim();
    const b = gc('btnPlay'); if (b) b.innerHTML = '▶ Play!';
  } else {
    running = true;
    const b = gc('btnPlay'); if (b) b.innerHTML = '⏸ Pause~';
    const loop = () => {
      if (!running) return;
      const ok = sortStep();
      if (ok) animTimer = setTimeout(loop, speed);
      else { running = false; const b = gc('btnPlay'); if (b) b.innerHTML = '▶ Play!'; }
    };
    loop();
  }
}
