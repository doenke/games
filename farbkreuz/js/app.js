/* Farbkreuz – Ersatzblock für „Noch mal!“ mit eigenem Spielfeld. */
(function () {
  'use strict';

  // __BUILD__ wird beim Deploy durch den Commit-SHA ersetzt.
  const BUILD = '__BUILD__';

  // Spielfeld aus tools/raster.py (Startwert 5). Buchstabe = Farbe, groß = Stern.
  const BOARD = [
    'ogggBrRgggrBbgy',
    'ogybbrryyrRobgy',
    'ObYybbrryyyoory',
    'gbyBgrybBbooorg',
    'obgggrryyYygRrg',
    'ooyrooyoybbbbGg',
    'oRrroOyOorboggB'
  ];
  const W = 15, H = 7, START = 7; // Spalte H
  const LETTERS = 'ABCDEFGHIJKLMNO';
  const COLS_HIGH = [5, 3, 3, 3, 2, 2, 2, 1, 2, 2, 2, 3, 3, 3, 5];
  const COLS_LOW  = [3, 2, 2, 2, 1, 1, 1, 0, 1, 1, 1, 2, 2, 2, 3];
  const COLORS = [
    { id: 'g', name: 'Grün' }, { id: 'y', name: 'Gelb' }, { id: 'b', name: 'Blau' },
    { id: 'r', name: 'Rot' }, { id: 'o', name: 'Orange' }
  ];
  const COLOR_HIGH = 5, COLOR_LOW = 3;
  const JOKERS = 8, STAR_PENALTY = 2, MAX_PER_TURN = 5;

  const KEY = 'farbkreuz:game';
  const UNDO_LIMIT = 60;
  const $ = (id) => document.getElementById(id);

  const colorAt = (x, y) => BOARD[y][x].toLowerCase();
  const starAt = (x, y) => BOARD[y][x] !== BOARD[y][x].toLowerCase();
  const key = (x, y) => y * W + x;
  const xy = (k) => [k % W, Math.floor(k / W)];
  const colorName = (c) => COLORS.find((k) => k.id === c).name;

  // ---------------------------------------------------------------- Zustand

  const fresh = () => ({
    crossed: [],                 // Schlüssel angekreuzter Felder
    jokers: 0,                   // verbrauchte Joker
    colsOther: Array(W).fill(false),      // Spalte hat jemand anderes zuerst voll
    colorsOther: Array(5).fill(false),    // Farbe hat jemand anderes zuerst voll
    undo: []
  });

  let game;
  try { game = JSON.parse(localStorage.getItem(KEY)); } catch { game = null; }
  if (!game || !Array.isArray(game.crossed)) game = fresh();
  game.undo = game.undo || [];

  let pending = [];              // im laufenden Zug angetippt, noch nicht bestätigt
  let jokerColor = false, jokerNumber = false;

  const save = () => { try { localStorage.setItem(KEY, JSON.stringify(game)); } catch { /* egal */ } };
  const isCrossed = (k) => game.crossed.includes(k);

  function snapshot() {
    const { undo, ...rest } = game;
    game.undo.push(JSON.stringify(rest));
    if (game.undo.length > UNDO_LIMIT) game.undo.shift();
  }

  // ---------------------------------------------------------------- Regeln

  const colDone = (x) => { for (let y = 0; y < H; y++) if (!isCrossed(key(x, y))) return false; return true; };
  const colorCount = (c) => game.crossed.filter((k) => colorAt(...xy(k)) === c).length;
  const colorDone = (c) => colorCount(c) === 21;
  const doneColors = () => COLORS.filter((c) => colorDone(c.id)).length;

  /** Prüft den angetippten Zug. Gibt eine Fehlermeldung oder null zurück. */
  function checkTurn(cells) {
    if (!cells.length) return 'Erst Felder antippen.';
    if (cells.length > MAX_PER_TURN) return `Höchstens ${MAX_PER_TURN} Felder pro Zug.`;
    const c = colorAt(...xy(cells[0]));
    if (cells.some((k) => colorAt(...xy(k)) !== c)) return 'Alle Felder eines Zugs müssen dieselbe Farbe haben.';
    // zusammenhängend
    const set = new Set(cells), seen = new Set([cells[0]]), stack = [cells[0]];
    while (stack.length) {
      const [x, y] = xy(stack.pop());
      for (const [nx, ny] of [[x + 1, y], [x - 1, y], [x, y + 1], [x, y - 1]]) {
        const k = key(nx, ny);
        if (nx >= 0 && nx < W && ny >= 0 && ny < H && set.has(k) && !seen.has(k)) { seen.add(k); stack.push(k); }
      }
    }
    if (seen.size !== cells.length) return 'Die Felder müssen zusammenhängen.';
    // Anschluss an Spalte H oder an schon Angekreuztes
    const anchored = cells.some((k) => {
      const [x, y] = xy(k);
      if (x === START) return true;
      return [[x + 1, y], [x - 1, y], [x, y + 1], [x, y - 1]].some(([nx, ny]) =>
        nx >= 0 && nx < W && ny >= 0 && ny < H && isCrossed(key(nx, ny)));
    });
    if (!anchored) return 'Der Zug muss an Spalte H oder an deine Kreuze anschließen.';
    const need = (jokerColor ? 1 : 0) + (jokerNumber ? 1 : 0);
    if (game.jokers + need > JOKERS) return 'Keine Joker mehr übrig.';
    return null;
  }

  function confirmTurn() {
    const err = checkTurn(pending);
    if (err) { toast(err); buzz(40); return; }
    snapshot();
    const before = { cols: [...Array(W).keys()].filter(colDone), colors: COLORS.filter((c) => colorDone(c.id)).map((c) => c.id) };
    game.crossed.push(...pending);
    game.jokers += (jokerColor ? 1 : 0) + (jokerNumber ? 1 : 0);
    const n = pending.length, c = colorAt(...xy(pending[0]));
    pending = []; jokerColor = jokerNumber = false;
    // Neu fertig gewordene Spalten und Farben ansagen
    const newCols = [...Array(W).keys()].filter((x) => colDone(x) && !before.cols.includes(x));
    const newColors = COLORS.filter((k) => colorDone(k.id) && !before.colors.includes(k.id));
    const msgs = [];
    newCols.forEach((x) => msgs.push(`Spalte ${LETTERS[x]} voll: ${game.colsOther[x] ? COLS_LOW[x] : COLS_HIGH[x]} P.`));
    newColors.forEach((k) => msgs.push(`${k.name} komplett: ${game.colorsOther[COLORS.indexOf(k)] ? COLOR_LOW : COLOR_HIGH} P.`));
    toast(msgs.length ? msgs.join(' · ') + ' – ansagen!' : `${n} × ${colorName(c)} angekreuzt.`);
    buzz(20);
    save(); render();
  }

  function score() {
    let cols = 0, colors = 0;
    for (let x = 0; x < W; x++) if (colDone(x)) cols += game.colsOther[x] ? COLS_LOW[x] : COLS_HIGH[x];
    COLORS.forEach((c, i) => { if (colorDone(c.id)) colors += game.colorsOther[i] ? COLOR_LOW : COLOR_HIGH; });
    const jokers = JOKERS - game.jokers;
    let stars = 0;
    for (let y = 0; y < H; y++) for (let x = 0; x < W; x++) if (starAt(x, y) && !isCrossed(key(x, y))) stars++;
    return { cols, colors, jokers, stars: -stars * STAR_PENALTY, starsOpen: stars, total: cols + colors + jokers - stars * STAR_PENALTY };
  }

  // ---------------------------------------------------------------- Darstellung

  function build() {
    const board = $('board');
    const parts = [];
    for (let x = 0; x < W; x++) {
      const head = document.createElement('div');
      head.className = 'hd' + (x === START ? ' start' : '');
      head.style.setProperty('--gx', x); head.style.setProperty('--gy', 0);
      head.textContent = LETTERS[x];
      parts.push(head);
      for (let y = 0; y < H; y++) {
        const b = document.createElement('button');
        b.type = 'button';
        b.className = `cell c-${colorAt(x, y)}` + (starAt(x, y) ? ' star' : '') + (x === START ? ' start' : '');
        b.dataset.k = key(x, y);
        b.style.setProperty('--gx', x); b.style.setProperty('--gy', y + 1);
        b.setAttribute('aria-label', `${LETTERS[x]}${y + 1} ${colorName(colorAt(x, y))}${starAt(x, y) ? ' Stern' : ''}`);
        parts.push(b);
      }
      const pts = document.createElement('button');
      pts.type = 'button';
      pts.className = 'pts';
      pts.dataset.col = x;
      pts.style.setProperty('--gx', x); pts.style.setProperty('--gy', H + 1);
      pts.innerHTML = `<span class="hi">${COLS_HIGH[x]}</span><span class="lo">${COLS_LOW[x]}</span>`;
      pts.setAttribute('aria-label', `Spalte ${LETTERS[x]}: ${COLS_HIGH[x]} Punkte für den Ersten, sonst ${COLS_LOW[x]}`);
      parts.push(pts);
    }
    board.replaceChildren(...parts);

    $('colors').replaceChildren(...COLORS.map((c, i) => {
      const b = document.createElement('button');
      b.type = 'button';
      b.className = `bonus c-${c.id}`;
      b.dataset.color = i;
      b.innerHTML = `<span class="hi">${COLOR_HIGH}</span><span class="lo">${COLOR_LOW}</span><small></small>`;
      b.setAttribute('aria-label', `${c.name}: ${COLOR_HIGH} Punkte für den Ersten, sonst ${COLOR_LOW}`);
      return b;
    }));

    $('jokers').replaceChildren(...Array.from({ length: JOKERS }, () => {
      const s = document.createElement('span');
      s.className = 'joker';
      s.textContent = '!';
      return s;
    }));
  }

  function render() {
    for (const b of $('board').querySelectorAll('.cell')) {
      const k = Number(b.dataset.k);
      b.classList.toggle('crossed', isCrossed(k));
      b.classList.toggle('pending', pending.includes(k));
    }
    for (const p of $('board').querySelectorAll('.pts')) {
      const x = Number(p.dataset.col);
      p.classList.toggle('other', game.colsOther[x]);
      p.classList.toggle('done', colDone(x));
    }
    for (const b of $('colors').children) {
      const i = Number(b.dataset.color), c = COLORS[i].id;
      b.classList.toggle('other', game.colorsOther[i]);
      b.classList.toggle('done', colorDone(c));
      b.querySelector('small').textContent = `${colorCount(c)}/21`;
    }
    [...$('jokers').children].forEach((s, i) => s.classList.toggle('used', i < game.jokers));

    // Zugleiste
    const bar = $('turn');
    bar.hidden = !pending.length;
    if (pending.length) {
      const c = colorAt(...xy(pending[0]));
      const same = pending.every((k) => colorAt(...xy(k)) === c);
      $('turnText').textContent = same ? `${pending.length} × ${colorName(c)}` : `${pending.length} Felder, gemischt`;
      $('jkColor').classList.toggle('on', jokerColor);
      $('jkNumber').classList.toggle('on', jokerNumber);
      $('jkColor').setAttribute('aria-pressed', String(jokerColor));
      $('jkNumber').setAttribute('aria-pressed', String(jokerNumber));
    }

    const notice = $('notice');
    notice.hidden = doneColors() < 2;
    notice.textContent = 'Zwei Farben komplett – das Spiel endet nach diesem Zug.';
    $('btnUndo').disabled = !game.undo.length && !pending.length;
  }

  function renderScore() {
    const s = score();
    $('scoreTable').innerHTML =
      `<tr><th>Spalten</th><td>${s.cols}</td></tr>` +
      `<tr><th>Farben</th><td>${s.colors}</td></tr>` +
      `<tr><th>Joker übrig (je +1)</th><td>${s.jokers}</td></tr>` +
      `<tr><th>Sterne offen (je −${STAR_PENALTY})</th><td>${s.stars ? '−' + Math.abs(s.stars) : 0}</td></tr>` +
      `<tr class="sc-total"><th>Gesamt</th><td>${String(s.total).replace('-', '−')}</td></tr>`;
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

  $('board').addEventListener('click', (e) => {
    const cell = e.target.closest('.cell');
    if (cell) {
      const k = Number(cell.dataset.k);
      if (isCrossed(k)) { toast('Schon angekreuzt – ↶ nimmt den letzten Zug zurück.'); return; }
      pending = pending.includes(k) ? pending.filter((x) => x !== k) : [...pending, k];
      if (!pending.length) jokerColor = jokerNumber = false;
      buzz(10);
      render();
      return;
    }
    const pts = e.target.closest('.pts');
    if (pts) {
      const x = Number(pts.dataset.col);
      snapshot();
      game.colsOther[x] = !game.colsOther[x];
      toast(game.colsOther[x]
        ? `Spalte ${LETTERS[x]}: ein Mitspieler war zuerst – für dich zählen ${COLS_LOW[x]}.`
        : `Spalte ${LETTERS[x]}: wieder ${COLS_HIGH[x]} für den Ersten.`);
      save(); render();
    }
  });

  $('colors').addEventListener('click', (e) => {
    const b = e.target.closest('.bonus');
    if (!b) return;
    const i = Number(b.dataset.color);
    snapshot();
    game.colorsOther[i] = !game.colorsOther[i];
    toast(game.colorsOther[i]
      ? `${COLORS[i].name}: ein Mitspieler war zuerst – für dich zählen ${COLOR_LOW}.`
      : `${COLORS[i].name}: wieder ${COLOR_HIGH} für den Ersten.`);
    save(); render();
  });

  $('jkColor').addEventListener('click', () => { jokerColor = !jokerColor; render(); });
  $('jkNumber').addEventListener('click', () => { jokerNumber = !jokerNumber; render(); });
  $('btnConfirm').addEventListener('click', confirmTurn);
  $('btnDiscard').addEventListener('click', () => { pending = []; jokerColor = jokerNumber = false; render(); });

  $('btnUndo').addEventListener('click', () => {
    if (pending.length) { pending = []; jokerColor = jokerNumber = false; render(); return; }
    const raw = game.undo.pop();
    if (!raw) return;
    Object.assign(game, JSON.parse(raw));
    save(); render();
  });
  $('btnScore').addEventListener('click', () => { renderScore(); $('dlgScore').showModal(); });
  $('btnNew').addEventListener('click', () => $('dlgNew').showModal());
  $('btnNewConfirm').addEventListener('click', () => {
    game = fresh(); pending = []; jokerColor = jokerNumber = false;
    save(); render(); $('dlgNew').close();
  });
  for (const dlg of document.querySelectorAll('dialog')) {
    dlg.addEventListener('click', (e) => { if (e.target === dlg) dlg.close(); });
  }

  // ---------------------------------------------------------------- Bildschirm anlassen

  let wakeWanted = false, wakeLock = null;
  try { wakeWanted = localStorage.getItem('farbkreuz:wake') === '1'; } catch { /* egal */ }
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
    try { localStorage.setItem('farbkreuz:wake', wakeWanted ? '1' : '0'); } catch { /* egal */ }
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
