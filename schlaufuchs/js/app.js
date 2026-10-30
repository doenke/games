/* Schlaufuchs – eigenes Wertungsblatt nach dem Prinzip von „Ganz schön clever“. */
(function () {
  'use strict';

  // __BUILD__ wird beim Deploy durch den Commit-SHA ersetzt.
  const BUILD = '__BUILD__';

  const KEY = 'schlaufuchs:game';
  const UNDO_LIMIT = 80;
  const $ = (id) => document.getElementById(id);

  // ---------------------------------------------------------------- Blatt

  // Boni: x = freies Kreuz in einem Bereich, n = Zahl in Rot/Lila eintragen,
  // fox = Fuchs, reroll = Neuwurf, plus = +1.
  const X = (a) => ({ t: 'x', a });
  const NUM = (a, v) => ({ t: 'n', a, v });
  const FOX = { t: 'fox' }, REROLL = { t: 'reroll' }, PLUS = { t: 'plus' };

  const AREAS = { y: 'Gelb', b: 'Blau', g: 'Grün', o: 'Rot', p: 'Lila' };

  // Gelb: 4 × 4, 0 = schon vorgekreuzt (Hauptdiagonale)
  const Y_NUM = [0, 1, 4, 6,
                 3, 0, 2, 5,
                 5, 6, 0, 1,
                 2, 4, 3, 0];
  const Y_ROW = [NUM('o', 4), X('b'), FOX, X('g')];
  const Y_COL = [10, 14, 16, 20];
  const Y_DIAG = [3, 6, 9, 12];            // Gegendiagonale
  const Y_DIAG_BONUS = PLUS;

  // Blau: Summe aus blauem und weißem Würfel, Feld 0 ist das Symbol
  const B_ROWS = [[1, 2, 3], [4, 5, 6, 7], [8, 9, 10, 11]];
  const B_COLS = [[4, 8], [1, 5, 9], [2, 6, 10], [3, 7, 11]];
  const B_ROW = [NUM('o', 5), FOX, X('y')];
  const B_COL = [PLUS, NUM('p', 6), X('g'), REROLL];
  const B_PTS = [0, 1, 2, 4, 7, 11, 16, 22, 29, 37, 46, 56];

  // Grün: von links nach rechts, Würfel mindestens so hoch wie das Feld
  const G_MIN = [1, 2, 3, 4, 5, 1, 2, 3, 4, 5, 6];
  const G_BONUS = { 3: PLUS, 5: FOX, 6: X('b'), 8: REROLL, 9: NUM('p', 6) };
  const G_PTS = [0, 1, 3, 6, 10, 15, 21, 28, 36, 45, 55, 66];

  // Rot (statt Orange): Augenzahl eintragen, manche Felder zählen mehrfach
  const O_MULT = [1, 1, 1, 2, 1, 1, 2, 1, 2, 1, 3];
  const O_BONUS = { 2: PLUS, 4: REROLL, 5: X('y'), 7: NUM('p', 6), 9: FOX };

  // Lila: jede Zahl größer als die vorige, nach einer 6 wieder alles
  const P_BONUS = { 2: PLUS, 3: X('y'), 4: REROLL, 5: X('b'), 6: FOX, 7: PLUS, 8: NUM('o', 6), 9: X('g'), 10: REROLL };

  const ROUNDS = { 1: 6, 2: 6, 3: 5, 4: 4 };
  const ROUND_BONUS = [REROLL, PLUS, REROLL];

  // ---------------------------------------------------------------- Zustand

  const fresh = (players = 2) => ({
    players,
    round: 1,
    y: Y_NUM.map((n) => n === 0),
    b: Array(12).fill(false),
    g: 0,
    o: [],
    p: [],
    reroll: 1, rerollUsed: 0,   // Runde 1 bringt einen Neuwurf
    plus: 0, plusUsed: 0,
    foxes: 0,
    queue: [],                  // offene Boni, die eine Wahl brauchen
    undo: []
  });

  let game;
  try { game = JSON.parse(localStorage.getItem(KEY)); } catch { game = null; }
  if (!game || !Array.isArray(game.y) || game.y.length !== 16) game = fresh();
  game.undo = game.undo || [];
  game.queue = game.queue || [];

  let picker = null;   // { area } solange der Zahlen-Dialog offen ist

  const save = () => { try { localStorage.setItem(KEY, JSON.stringify(game)); } catch { /* egal */ } };

  function snapshot() {
    const { undo, ...rest } = game;
    game.undo.push(JSON.stringify(rest));
    if (game.undo.length > UNDO_LIMIT) game.undo.shift();
  }

  const pLast = () => game.p[game.p.length - 1];
  const pAllowed = (v) => !game.p.length || pLast() === 6 || v > pLast();

  // ---------------------------------------------------------------- Boni

  const msgs = [];

  function grant(bonus) {
    switch (bonus.t) {
      case 'fox': game.foxes++; msgs.push('Fuchs'); break;
      case 'reroll': game.reroll++; msgs.push('Neuwurf'); break;
      case 'plus': game.plus++; msgs.push('+1'); break;
      case 'n':
        if (bonus.a === 'o') {
          if (game.o.length < 11) { msgs.push(`Rot ${bonus.v}`); writeO(bonus.v); } else msgs.push('Rot ist voll – Bonus verfällt');
        } else if (game.p.length < 11 && pAllowed(bonus.v)) { msgs.push(`Lila ${bonus.v}`); writeP(bonus.v); }
        else msgs.push('Lila passt nicht – Bonus verfällt');
        break;
      case 'x':
        if (bonus.a === 'g') {
          if (game.g < 11) { msgs.push('Grün-Kreuz'); crossG(); } else msgs.push('Grün ist voll – Bonus verfällt');
        } else if (bonus.a === 'y' ? game.y.every(Boolean) : game.b.slice(1).every(Boolean)) {
          msgs.push(`${AREAS[bonus.a]} ist voll – Bonus verfällt`);
        } else {
          game.queue.push(bonus);
          msgs.push(`${AREAS[bonus.a]}-Kreuz frei wählen`);
        }
        break;
    }
  }

  function crossY(i) {
    game.y[i] = true;
    const r = Math.floor(i / 4), c = i % 4;
    if ([0, 1, 2, 3].every((k) => game.y[r * 4 + k])) grant(Y_ROW[r]);
    if ([0, 1, 2, 3].every((k) => game.y[k * 4 + c])) msgs.push(`Gelb Spalte voll: ${Y_COL[c]} Punkte`);
    if (Y_DIAG.includes(i) && Y_DIAG.every((k) => game.y[k])) grant(Y_DIAG_BONUS);
  }

  function crossB(i) {
    game.b[i] = true;
    B_ROWS.forEach((row, r) => { if (row.includes(i) && row.every((k) => game.b[k])) grant(B_ROW[r]); });
    B_COLS.forEach((col, c) => { if (col.includes(i) && col.every((k) => game.b[k])) grant(B_COL[c]); });
  }

  function crossG() {
    const i = game.g++;
    if (G_BONUS[i]) grant(G_BONUS[i]);
  }

  function writeO(v) {
    const i = game.o.length;
    game.o.push(v);
    if (O_BONUS[i]) grant(O_BONUS[i]);
  }

  function writeP(v) {
    const i = game.p.length;
    game.p.push(v);
    if (P_BONUS[i]) grant(P_BONUS[i]);
  }

  // Eine Aktion: Zustand sichern, ausführen, Boni melden.
  function act(fn) {
    snapshot();
    msgs.length = 0;
    fn();
    save();
    render();
    if (msgs.length) { toast('Bonus: ' + msgs.join(' · ')); buzz([20, 40, 20]); } else buzz(12);
  }

  // ---------------------------------------------------------------- Punkte

  function score() {
    const y = Y_COL.reduce((s, pts, c) => s + ([0, 1, 2, 3].every((r) => game.y[r * 4 + c]) ? pts : 0), 0);
    const b = B_PTS[game.b.filter(Boolean).length];
    const g = G_PTS[game.g];
    const o = game.o.reduce((s, v, i) => s + v * O_MULT[i], 0);
    const p = game.p.reduce((s, v) => s + v, 0);
    const min = Math.min(y, b, g, o, p);
    const fox = game.foxes * min;
    return { y, b, g, o, p, min, fox, total: y + b + g + o + p + fox };
  }

  // ---------------------------------------------------------------- Aufbau

  function bonusHtml(b) {
    if (!b) return '';
    if (b.t === 'fox') return '<span class="bn bn-fox" title="Fuchs">F</span>';
    if (b.t === 'reroll') return '<span class="bn bn-re" title="Neuwurf">↻</span>';
    if (b.t === 'plus') return '<span class="bn bn-plus" title="+1">+1</span>';
    if (b.t === 'x') return `<span class="bn a-${b.a}" title="${AREAS[b.a]}-Kreuz">✕</span>`;
    return `<span class="bn a-${b.a}" title="${AREAS[b.a]} ${b.v}">${b.v}</span>`;
  }

  function build() {
    // Gelb
    let h = '';
    for (let r = 0; r < 4; r++) {
      for (let c = 0; c < 4; c++) {
        const i = r * 4 + c;
        h += `<button type="button" class="f fy${Y_NUM[i] ? '' : ' pre'}${Y_DIAG.includes(i) ? ' diag' : ''}" data-y="${i}">${Y_NUM[i] || ''}</button>`;
      }
      h += `<div class="rb">${bonusHtml(Y_ROW[r])}</div>`;
    }
    h += Y_COL.map((p) => `<div class="cb">${p}</div>`).join('') + `<div class="rb" title="Gegendiagonale">↙${bonusHtml(Y_DIAG_BONUS)}</div>`;
    $('areaY').innerHTML = h;

    // Blau
    h = '';
    for (let r = 0; r < 3; r++) {
      for (let c = 0; c < 4; c++) {
        const i = r * 4 + c;
        h += i === 0
          ? '<div class="f sym"><span class="mini a-b"></span>+<span class="mini a-w"></span></div>'
          : `<button type="button" class="f fb" data-b="${i}">${i + 1}</button>`;
      }
      h += `<div class="rb">${bonusHtml(B_ROW[r])}</div>`;
    }
    h += B_COL.map((b) => `<div class="cb">${bonusHtml(b)}</div>`).join('') + '<div></div>';
    $('areaB').innerHTML = h;
    $('trackB').innerHTML = B_PTS.slice(1).map((p, i) => `<span data-n="${i + 1}">${p}</span>`).join('');

    // Grün, Rot, Lila
    $('areaG').innerHTML = G_MIN.map((m, i) =>
      `<button type="button" class="f fg" data-g="${i}"><small>≥</small>${m}</button>`).join('') +
      G_MIN.map((_, i) => `<div class="cb">${bonusHtml(G_BONUS[i])}</div>`).join('');
    $('trackG').innerHTML = G_PTS.slice(1).map((p, i) => `<span data-n="${i + 1}">${p}</span>`).join('');
    $('areaO').innerHTML = O_MULT.map((m, i) =>
      `<button type="button" class="f fo" data-o="${i}"></button>`).join('') +
      O_MULT.map((_, i) => `<div class="cb">${bonusHtml(O_BONUS[i])}</div>`).join('');
    $('areaP').innerHTML = O_MULT.map((_, i) =>
      `<button type="button" class="f fp" data-p="${i}"></button>`).join('') +
      O_MULT.map((_, i) => `<div class="cb">${bonusHtml(P_BONUS[i])}</div>`).join('');

    // Zahlen-Dialog
    $('pickNums').innerHTML = [1, 2, 3, 4, 5, 6].map((v) =>
      `<button type="button" class="btn pick" data-v="${v}">${v}</button>`).join('');
  }

  function render() {
    const s = score();
    const choice = game.queue[0];

    // Runden
    const n = ROUNDS[game.players];
    $('rounds').innerHTML = Array.from({ length: n }, (_, i) =>
      `<button type="button" class="rd${i + 1 < game.round ? ' past' : ''}${i + 1 === game.round ? ' now' : ''}" data-round="${i + 1}">` +
      `${i + 1}${ROUND_BONUS[i] ? `<small>${ROUND_BONUS[i].t === 'plus' ? '+1' : '↻'}</small>` : ''}</button>`).join('');
    $('roundInfo').textContent = `Runde ${game.round} von ${n} · ${game.players} ${game.players === 1 ? 'Spieler' : 'Spieler'}`;

    // Vorräte
    $('cntRe').textContent = game.reroll - game.rerollUsed;
    $('cntPlus').textContent = game.plus - game.plusUsed;
    $('cntFox').textContent = game.foxes;
    $('useRe').disabled = game.reroll <= game.rerollUsed;
    $('usePlus').disabled = game.plus <= game.plusUsed;

    // Gelb
    for (const b of document.querySelectorAll('[data-y]')) {
      const i = Number(b.dataset.y);
      b.classList.toggle('x', game.y[i]);
      b.classList.toggle('choose', choice?.a === 'y' && !game.y[i]);
    }
    // Blau
    for (const b of document.querySelectorAll('[data-b]')) {
      const i = Number(b.dataset.b);
      b.classList.toggle('x', game.b[i]);
      b.classList.toggle('choose', choice?.a === 'b' && !game.b[i]);
    }
    const nb = game.b.filter(Boolean).length;
    for (const t of document.querySelectorAll('#trackB span')) t.classList.toggle('on', Number(t.dataset.n) === nb);
    // Grün
    for (const b of document.querySelectorAll('[data-g]')) {
      const i = Number(b.dataset.g);
      b.classList.toggle('x', i < game.g);
      b.classList.toggle('next', i === game.g);
    }
    for (const t of document.querySelectorAll('#trackG span')) t.classList.toggle('on', Number(t.dataset.n) === game.g);
    // Rot
    for (const b of document.querySelectorAll('[data-o]')) {
      const i = Number(b.dataset.o);
      const v = game.o[i];
      b.innerHTML = v != null ? `${v * O_MULT[i]}${O_MULT[i] > 1 ? `<small>${v}×${O_MULT[i]}</small>` : ''}`
        : (O_MULT[i] > 1 ? `<small>×${O_MULT[i]}</small>` : '');
      b.classList.toggle('x', v != null);
      b.classList.toggle('next', i === game.o.length);
    }
    // Lila
    for (const b of document.querySelectorAll('[data-p]')) {
      const i = Number(b.dataset.p);
      b.textContent = game.p[i] ?? (i === game.p.length && game.p.length ? (pLast() === 6 ? 'alle' : `>${pLast()}`) : '');
      b.classList.toggle('x', game.p[i] != null);
      b.classList.toggle('next', i === game.p.length);
    }

    $('sy').textContent = s.y; $('sb').textContent = s.b; $('sg').textContent = s.g;
    $('so').textContent = s.o; $('sp').textContent = s.p;

    // Offene Wahl
    $('choice').hidden = !choice;
    if (choice) {
      $('choiceText').textContent = `Bonus: Kreuz in ${AREAS[choice.a]} – ein freies Feld antippen.`;
      $('area' + choice.a.toUpperCase()).closest('.area').scrollIntoView({ block: 'nearest', behavior: 'smooth' });
    }
    $('total').textContent = s.total;
  }

  function renderScore() {
    const s = score();
    const row = (name, v, cls = '') => `<tr class="${cls}"><th>${name}</th><td>${v}</td></tr>`;
    $('scoreTable').innerHTML =
      row('Gelb', s.y, 'a-y-row') + row('Blau', s.b, 'a-b-row') + row('Grün', s.g, 'a-g-row') +
      row('Rot', s.o, 'a-o-row') + row('Lila', s.p, 'a-p-row') +
      row(`Füchse: ${game.foxes} × ${s.min} <small>(schwächster Bereich)</small>`, s.fox) +
      `<tr class="sc-total"><th>Gesamt</th><td>${s.total}</td></tr>`;
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
    if (!actionLabel) toastTimer = setTimeout(() => { $('toast').hidden = true; }, 3500);
  }

  // Eine offene Wahl hat Vorrang: erst erledigen oder verfallen lassen.
  function blockedBy(area) {
    const c = game.queue[0];
    if (!c || c.a === area) return false;
    toast(`Erst den Bonus einlösen: Kreuz in ${AREAS[c.a]}.`);
    return true;
  }

  // ---------------------------------------------------------------- Ereignisse

  document.querySelector('main').addEventListener('click', (e) => {
    const t = e.target.closest('button');
    if (!t) return;

    if (t.dataset.y != null) {
      const i = Number(t.dataset.y);
      if (game.y[i]) return;
      if (blockedBy('y')) return;
      act(() => { if (game.queue[0]?.a === 'y') game.queue.shift(); crossY(i); });
    } else if (t.dataset.b != null) {
      const i = Number(t.dataset.b);
      if (game.b[i]) return;
      if (blockedBy('b')) return;
      act(() => { if (game.queue[0]?.a === 'b') game.queue.shift(); crossB(i); });
    } else if (t.dataset.g != null) {
      const i = Number(t.dataset.g);
      if (blockedBy('g')) return;
      if (i < game.g) return;
      if (i > game.g) { toast('Grün wird von links nach rechts angekreuzt.'); return; }
      act(crossG);
    } else if (t.dataset.o != null || t.dataset.p != null) {
      const area = t.dataset.o != null ? 'o' : 'p';
      const i = Number(t.dataset[area]);
      if (blockedBy(area)) return;
      const len = game[area].length;
      if (i < len) return;
      if (i > len) { toast(`${AREAS[area]} wird von links nach rechts gefüllt.`); return; }
      openPicker(area);
    } else if (t.dataset.round != null) {
      const r = Number(t.dataset.round);
      if (r !== game.round + 1) { if (r > game.round) toast('Runden der Reihe nach weiterschalten.'); return; }
      act(() => {
        game.round = r;
        const b = ROUND_BONUS[r - 1];
        if (b) grant(b);
      });
    }
  });

  function openPicker(area) {
    picker = { area };
    const i = game[area].length;
    $('pickTitle').textContent = area === 'o'
      ? `Rot: Augenzahl eintragen${O_MULT[i] > 1 ? ` (zählt ×${O_MULT[i]})` : ''}`
      : `Lila: Augenzahl eintragen${game.p.length && pLast() !== 6 ? ` (größer als ${pLast()})` : ''}`;
    for (const b of document.querySelectorAll('.pick')) {
      b.disabled = area === 'p' && !pAllowed(Number(b.dataset.v));
      b.className = `btn pick a-${area}`;
    }
    $('dlgPick').showModal();
  }
  $('pickNums').addEventListener('click', (e) => {
    const b = e.target.closest('.pick');
    if (!b || !picker) return;
    const v = Number(b.dataset.v), area = picker.area;
    $('dlgPick').close();
    picker = null;
    act(() => (area === 'o' ? writeO(v) : writeP(v)));
  });

  $('choiceSkip').addEventListener('click', () => act(() => game.queue.shift()));
  $('useRe').addEventListener('click', () => act(() => { game.rerollUsed++; }));
  $('usePlus').addEventListener('click', () => act(() => { game.plusUsed++; }));

  $('btnUndo').addEventListener('click', () => {
    const raw = game.undo.pop();
    if (!raw) return;
    Object.assign(game, JSON.parse(raw));
    save(); render();
  });
  $('btnScore').addEventListener('click', () => { renderScore(); $('dlgScore').showModal(); });
  $('btnNew').addEventListener('click', () => {
    for (const r of document.querySelectorAll('input[name="players"]')) r.checked = Number(r.value) === game.players;
    $('dlgNew').showModal();
  });
  $('btnNewConfirm').addEventListener('click', () => {
    const p = Number(document.querySelector('input[name="players"]:checked')?.value || 2);
    game = fresh(p);
    save(); render(); $('dlgNew').close();
    window.scrollTo({ top: 0 });
  });
  for (const dlg of document.querySelectorAll('dialog')) {
    dlg.addEventListener('click', (e) => { if (e.target === dlg) dlg.close(); });
  }

  // ---------------------------------------------------------------- Bildschirm anlassen

  let wakeWanted = false, wakeLock = null;
  try { wakeWanted = localStorage.getItem('schlaufuchs:wake') === '1'; } catch { /* egal */ }
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
    try { localStorage.setItem('schlaufuchs:wake', wakeWanted ? '1' : '0'); } catch { /* egal */ }
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
