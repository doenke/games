/* Summenraster – Ersatzblock für „Knister“. */
(function () {
  'use strict';

  // __BUILD__ wird beim Deploy durch den Commit-SHA ersetzt.
  const BUILD = '__BUILD__';

  const N = 5;                       // 5 × 5 Felder
  const KEY = 'summenraster:game';
  const UNDO_LIMIT = 60;
  const $ = (id) => document.getElementById(id);

  // Alle 12 Wertungslinien: 5 Reihen, 5 Spalten, 2 Diagonalen (doppelt).
  const LINES = [];
  for (let r = 0; r < N; r++) LINES.push({ id: 'r' + r, name: `Reihe ${r + 1}`, cells: [...Array(N)].map((_, c) => r * N + c), factor: 1 });
  for (let c = 0; c < N; c++) LINES.push({ id: 'c' + c, name: `Spalte ${'ABCDE'[c]}`, cells: [...Array(N)].map((_, r) => r * N + c), factor: 1 });
  LINES.push({ id: 'd1', name: 'Diagonale ↘', cells: [...Array(N)].map((_, i) => i * N + i), factor: 2 });
  LINES.push({ id: 'd2', name: 'Diagonale ↙', cells: [...Array(N)].map((_, i) => i * N + (N - 1 - i)), factor: 2 });

  // Kombination einer Linie. Unvollständige Linien zeigen, was schon sicher ist.
  function combo(values) {
    const v = values.filter((x) => x != null);
    const counts = Object.values(v.reduce((m, x) => ((m[x] = (m[x] || 0) + 1), m), {})).sort((a, b) => b - a);
    const [a = 0, b = 0] = counts;
    if (a === 5) return { name: 'Fünfling', short: '5er', pts: 10 };
    if (a === 4) return { name: 'Vierling', short: '4er', pts: 6 };
    if (a === 3 && b === 2) return { name: 'Full House', short: 'FH', pts: 8 };
    if (v.length === 5 && a === 1 && Math.max(...v) - Math.min(...v) === 4) {
      return v.includes(7)
        ? { name: 'Straße mit 7', short: 'Str', pts: 8 }
        : { name: 'Straße ohne 7', short: 'Str', pts: 12 };
    }
    if (a === 3) return { name: 'Drilling', short: '3er', pts: 3 };
    if (a === 2 && b === 2) return { name: 'Zwei Paare', short: '2P', pts: 3 };
    if (a === 2) return { name: 'Paar', short: 'P', pts: 1 };
    return { name: '–', short: '', pts: 0 };
  }

  // ---------------------------------------------------------------- Zustand

  const fresh = () => ({ cells: Array(N * N).fill(null), undo: [] });

  let game;
  try { game = JSON.parse(localStorage.getItem(KEY)); } catch { game = null; }
  if (!game || !Array.isArray(game.cells) || game.cells.length !== N * N) game = fresh();
  game.undo = game.undo || [];

  let number = null;   // angetippte Summe, wartet auf ein Feld
  let cell = null;     // angetipptes Feld, wartet auf eine Summe

  const save = () => { try { localStorage.setItem(KEY, JSON.stringify(game)); } catch { /* egal */ } };
  const filled = () => game.cells.filter((x) => x != null).length;

  function place(k, n) {
    game.undo.push(JSON.stringify({ cells: game.cells }));
    if (game.undo.length > UNDO_LIMIT) game.undo.shift();
    game.cells[k] = n;
    number = cell = null;
    save();
    buzz(15);
    if (filled() === N * N) {
      render();
      toast('Alle Felder voll – Punkte ausrechnen!');
      setTimeout(() => { renderScore(); $('dlgScore').showModal(); }, 600);
      return;
    }
    render();
  }

  function score() {
    const lines = LINES.map((l) => {
      const c = combo(l.cells.map((k) => game.cells[k]));
      return { ...l, combo: c, pts: c.pts * l.factor };
    });
    return { lines, total: lines.reduce((s, l) => s + l.pts, 0) };
  }

  // ---------------------------------------------------------------- Aufbau

  // Raster 6 × 7: oben rechts Diagonale ↙, rechts Reihenpunkte, unten
  // Spaltenpunkte, unten rechts Diagonale ↘ – wie auf dem Papier.
  function build() {
    const g = $('grid');
    const add = (el, row, col) => { el.style.gridRow = row; el.style.gridColumn = col; g.appendChild(el); return el; };
    add(lineBox('d2'), 1, 6);
    for (let r = 0; r < N; r++) {
      for (let c = 0; c < N; c++) {
        const b = document.createElement('button');
        b.type = 'button';
        b.className = 'cell';
        b.dataset.k = r * N + c;
        b.setAttribute('aria-label', `Reihe ${r + 1}, Spalte ${'ABCDE'[c]}`);
        add(b, r + 2, c + 1);
      }
      add(lineBox('r' + r), r + 2, 6);
    }
    for (let c = 0; c < N; c++) add(lineBox('c' + c), 7, c + 1);
    add(lineBox('d1'), 7, 6);

    const pad = $('pad');
    for (let n = 2; n <= 12; n++) {
      const b = document.createElement('button');
      b.type = 'button';
      b.className = 'num';
      b.dataset.n = n;
      b.textContent = n;
      pad.appendChild(b);
    }
  }

  function lineBox(id) {
    const d = document.createElement('div');
    d.className = 'line' + (id[0] === 'd' ? ' diag' : '');
    d.dataset.line = id;
    d.innerHTML = '<b></b><small></small>';
    return d;
  }

  function render() {
    for (const b of document.querySelectorAll('.cell')) {
      const k = Number(b.dataset.k);
      const v = game.cells[k];
      b.textContent = v ?? '';
      b.classList.toggle('filled', v != null);
      b.classList.toggle('sel', cell === k);
      b.classList.toggle('target', v == null && number != null);
    }
    const s = score();
    for (const l of s.lines) {
      const el = document.querySelector(`.line[data-line="${l.id}"]`);
      const done = l.cells.every((k) => game.cells[k] != null);
      el.querySelector('b').textContent = l.pts || (done ? '0' : '');
      el.querySelector('small').textContent = l.id[0] === 'd' ? (l.id === 'd1' ? '↘×2' : '↙×2') : l.combo.short;
      el.classList.toggle('done', done);
      el.classList.toggle('scores', l.pts > 0);
    }
    for (const b of document.querySelectorAll('.num')) b.classList.toggle('on', Number(b.dataset.n) === number);

    const f = filled();
    $('status').innerHTML = f === N * N
      ? `Fertig · <strong>${s.total} Punkte</strong>`
      : `Wurf <strong>${f + 1}</strong> von 25 · bisher ${s.total} Punkte`;
    $('pad').hidden = f === N * N;
  }

  function renderScore() {
    const s = score();
    $('scoreTable').innerHTML = s.lines.map((l) =>
      `<tr><th>${l.name}${l.factor > 1 ? ' <small>×2</small>' : ''}</th>` +
      `<td class="sc-combo">${l.combo.name}</td><td>${l.pts}</td></tr>`).join('') +
      `<tr class="sc-total"><th>Gesamt</th><td></td><td>${s.total}</td></tr>`;
  }

  // ---------------------------------------------------------------- Kleinkram

  function buzz(ms) { if (navigator.vibrate) navigator.vibrate(ms); }

  let toastTimer = 0;
  function toast(text, actionLabel, action) {
    $('toastText').textContent = text;
    const a = $('toastAction');
    a.hidden = !actionLabel; a.textContent = actionLabel || ''; a.onclick = action || null;
    $('toast').hidden = false;
    clearTimeout(toastTimer);
    if (!actionLabel) toastTimer = setTimeout(() => { $('toast').hidden = true; }, 3000);
  }

  // ---------------------------------------------------------------- Ereignisse

  // Reihenfolge egal: erst Summe, dann Feld – oder erst Feld, dann Summe.
  $('grid').addEventListener('click', (e) => {
    const b = e.target.closest('.cell');
    if (!b) return;
    const k = Number(b.dataset.k);
    if (game.cells[k] != null) { toast('Feld ist schon belegt – ↶ nimmt den letzten Eintrag zurück.'); return; }
    if (number != null) { place(k, number); return; }
    cell = cell === k ? null : k;
    render();
  });

  $('pad').addEventListener('click', (e) => {
    const b = e.target.closest('.num');
    if (!b) return;
    const n = Number(b.dataset.n);
    if (cell != null) { place(cell, n); return; }
    number = number === n ? null : n;
    render();
  });

  $('btnUndo').addEventListener('click', () => {
    if (number != null || cell != null) { number = cell = null; render(); return; }
    const raw = game.undo.pop();
    if (!raw) return;
    Object.assign(game, JSON.parse(raw));
    save(); render();
  });
  $('btnScore').addEventListener('click', () => { renderScore(); $('dlgScore').showModal(); });
  $('btnNew').addEventListener('click', () => $('dlgNew').showModal());
  $('btnNewConfirm').addEventListener('click', () => {
    game = fresh(); number = cell = null;
    save(); render(); $('dlgNew').close();
  });
  for (const dlg of document.querySelectorAll('dialog')) {
    dlg.addEventListener('click', (e) => { if (e.target === dlg) dlg.close(); });
  }

  // ---------------------------------------------------------------- Bildschirm anlassen

  let wakeWanted = false, wakeLock = null;
  try { wakeWanted = localStorage.getItem('summenraster:wake') === '1'; } catch { /* egal */ }
  async function applyWake() {
    if (!('wakeLock' in navigator)) return renderWake();
    try {
      if (wakeWanted && !wakeLock && document.visibilityState === 'visible') {
        wakeLock = await navigator.wakeLock.request('screen');
        wakeLock.addEventListener('release', () => { wakeLock = null; renderWake(); });
      } else if (!wakeWanted && wakeLock) { await wakeLock.release(); wakeLock = null; }
    } catch { wakeLock = null; }
    renderWake();
  }
  function renderWake() {
    const on = wakeWanted && !!wakeLock;
    $('btnWake').classList.toggle('active', on);
    $('btnWake').setAttribute('aria-pressed', String(on));
  }
  $('btnWake').addEventListener('click', async () => {
    if (!('wakeLock' in navigator)) { toast('Dieser Browser kann den Bildschirm nicht wachhalten.'); return; }
    wakeWanted = !wakeWanted;
    try { localStorage.setItem('summenraster:wake', wakeWanted ? '1' : '0'); } catch { /* egal */ }
    await applyWake();
    toast(wakeWanted ? 'Bildschirm bleibt an.' : 'Bildschirm darf wieder ausgehen.');
  });
  document.addEventListener('visibilitychange', () => { if (document.visibilityState === 'visible') applyWake(); });

  // ---------------------------------------------------------------- Service Worker

  if ('serviceWorker' in navigator) {
    const hadController = !!navigator.serviceWorker.controller;
    window.addEventListener('load', () => {
      navigator.serviceWorker.register('sw.js').then((reg) => {
        document.addEventListener('visibilitychange', () => {
          if (document.visibilityState === 'visible') reg.update().catch(() => {});
        });
      }).catch(() => {});
    });
    navigator.serviceWorker.addEventListener('controllerchange', () => {
      if (hadController) toast('Neue Version verfügbar.', 'Neu laden', () => location.reload());
    });
  }

  // ---------------------------------------------------------------- Start

  build();
  render();
  applyWake();
  document.documentElement.dataset.build = BUILD;
})();
