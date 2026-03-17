// ── App entry point ───────────────────────────────
let currentMode = 'sort';

function switchMode(mode, btn) {
  stopAnim();
  currentMode = mode;

  document.querySelectorAll('.nav-btn').forEach(b => b.classList.remove('active'));
  if (btn) btn.classList.add('active');

  const content = document.getElementById('modeContent');
  if (mode === 'sort')      content.innerHTML = buildSortUI();
  else if (mode === 'path') content.innerHTML = buildPathUI();
  else if (mode === 'bst')  content.innerHTML = buildBSTUI();
  else                      content.innerHTML = buildGraphUI();

  if (mode === 'sort')      initSort();
  else if (mode === 'path') initPath();
  else if (mode === 'bst')  initBST();
  else                      initGraph();
}

// Boot into sorting on load
switchMode('sort', document.getElementById('navSort'));
