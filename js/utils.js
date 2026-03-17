// ── Shared state ──────────────────────────────────
let animTimer = null;
let running   = false;
let speed     = 600;

// ── Helpers ───────────────────────────────────────
function gc(id) { return document.getElementById(id); }

function stopAnim() {
  running = false;
  clearTimeout(animTimer);
  animTimer = null;
}

function setStatus(msg) {
  const el = gc('statusLine');
  if (el) el.innerHTML = '💌 ' + msg;
}

function updateStats(c, s, a) {
  ['statComp', 'statSwap', 'statAccess'].forEach((id, i) => {
    const el = gc(id);
    if (el) el.textContent = [c, s, a][i];
  });
}

// Shared canvas background + polka-dot grid
function drawCanvasBg(ctx, W, H, dots = false) {
  const bg = ctx.createLinearGradient(0, 0, 0, H);
  bg.addColorStop(0, '#fff8fc');
  bg.addColorStop(1, '#fde8ef');
  ctx.fillStyle = bg;
  ctx.fillRect(0, 0, W, H);

  if (dots) {
    ctx.fillStyle = 'rgba(244,135,158,0.08)';
    for (let x = 20; x < W; x += 40)
      for (let y = 20; y < H; y += 40) {
        ctx.beginPath();
        ctx.arc(x, y, 3, 0, Math.PI * 2);
        ctx.fill();
      }
  } else {
    ctx.strokeStyle = 'rgba(244,135,158,0.1)';
    ctx.lineWidth = 1;
    for (let x = 0; x < W; x += 40) { ctx.beginPath(); ctx.moveTo(x, 0); ctx.lineTo(x, H); ctx.stroke(); }
    for (let y = 0; y < H; y += 30) { ctx.beginPath(); ctx.moveTo(0, y); ctx.lineTo(W, y); ctx.stroke(); }
  }
}
