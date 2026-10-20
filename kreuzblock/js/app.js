/* Kreuzblock – Ersatz-Wertungsblock und Würfel für Qwixx. */
(function () {
  'use strict';

  // __BUILD__ wird beim Deploy durch den Commit-SHA ersetzt.
  const BUILD = '__BUILD__';

  const KEY = 'kreuzblock:game';
  const UNDO_LIMIT = 60;
  const MIN_FOR_LAST = 5;      // Kreuze, die vor dem letzten Feld einer Reihe nötig sind
  const MAX_PENALTIES = 4;
  const PENALTY = 5;

  const ROWS = [
    { id: 'red',    name: 'Rot',  numbers: [2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12] },
    { id: 'yellow', name: 'Gelb', numbers: [2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12] },
    { id: 'green',  name: 'Grün', numbers: [12, 11, 10, 9, 8, 7, 6, 5, 4, 3, 2] },
    { id: 'blue',   name: 'Blau', numbers: [12, 11, 10, 9, 8, 7, 6, 5, 4, 3, 2] }
  ];
  const LAST = 10; // Index des letzten Zahlenfelds

  const $ = (id) => document.getElementById(id);

  const load = () => {
    try { const v = localStorage.getItem(KEY); return v ? JSON.parse(v) : null; } catch { return null; }
  };
  const save = () => {
    try { localStorage.setItem(KEY, JSON.stringify(game)); } catch { /* ohne Speicher weiter */ }
  };

  const fresh = () => ({
    rows: ROWS.map(() => ({ crossed: [], locked: null })), // locked: null | 'me' | 'other'
    penalties: 0,
    dice: null,
    undo: []
  });

  let game = load();
  if (!game || !Array.isArray(game.rows) || game.rows.length !== 4) game = fresh();
  game.undo = game.undo || [];

  // ---------------------------------------------------------------- Regeln

  const lastCrossed = (row) => (row.crossed.length ? Math.max(...row.crossed) : -1);

  function canCross(r, i) {
    const row = game.rows[r];
    if (row.locked || gameOver()) return false;
    if (i <= lastCrossed(row)) return false;
    if (i === LAST && row.crossed.length < MIN_FOR_LAST) return false;
    return true;
  }

  /** Kreuze einer Reihe für die Wertung; das selbst abgeschlossene Schloss zählt mit. */
  const crossCount = (row) => row.crossed.length + (row.locked === 'me' ? 1 : 0);
  const points = (n) => (n * (n + 1)) / 2;

  const lockedRows = () => game.rows.filter((row) => row.locked).length;
  const gameOver = () => lockedRows() >= 2 || game.penalties >= MAX_PENALTIES;

  function snapshot() {
    game.undo.push(JSON.stringify({ rows: game.rows, penalties: game.penalties }));
    if (game.undo.length > UNDO_LIMIT) game.undo.shift();
  }

  function undo() {
    const raw = game.undo.pop();
    if (!raw) { toast('Nichts rückgängig zu machen.'); return; }
    Object.assign(game, JSON.parse(raw));
    save();
    render();
  }

  function cross(r, i) {
    const row = game.rows[r];
    // Das zuletzt gesetzte Kreuz einer Reihe lässt sich per Tippen wieder entfernen.
    if (row.crossed.includes(i)) {
      if (i !== lastCrossed(row) || row.locked === 'other') return;
      snapshot();
      row.crossed = row.crossed.filter((x) => x !== i);
      if (row.locked === 'me') row.locked = null;
      save(); render();
      return;
    }
    if (!canCross(r, i)) {
      if (i === LAST && row.crossed.length < MIN_FOR_LAST && !row.locked) {
        toast(`Für das letzte Feld brauchst du ${MIN_FOR_LAST} Kreuze in der Reihe.`);
      }
      buzz(30);
      return;
    }
    const skipped = i - lastCrossed(row) - 1;
    snapshot();
    row.crossed.push(i);
    if (i === LAST) {
      row.locked = 'me';
      toast(`${ROWS[r].name} abgeschlossen – das Schloss zählt als Kreuz.`);
    } else if (skipped > 0) {
      toast(skipped === 1 ? '1 Feld übersprungen.' : `${skipped} Felder übersprungen.`);
    }
    buzz(15);
    save(); render();
  }

  function lockByOther(r) {
    snapshot();
    game.rows[r].locked = 'other';
    save(); render();
  }

  function togglePenalty(i) {
    if (i < game.penalties) {
      if (i !== game.penalties - 1) return; // nur den letzten Fehlwurf zurücknehmen
      snapshot(); game.penalties -= 1;
    } else {
      if (gameOver()) return;
      snapshot(); game.penalties = i + 1;
    }
    buzz(15);
    save(); render();
  }

  // ---------------------------------------------------------------- Block darstellen

  function buildRows() {
    const box = $('rows');
    box.replaceChildren(...ROWS.map((def, r) => {
      const row = document.createElement('div');
      row.className = `row row-${def.id}`;
      row.setAttribute('role', 'group');
      row.setAttribute('aria-label', `Reihe ${def.name}`);
      def.numbers.forEach((n, i) => {
        const b = document.createElement('button');
        b.type = 'button';
        b.className = 'cell' + (i === LAST ? ' cell-last' : '');
        b.dataset.r = r; b.dataset.i = i;
        b.innerHTML = `<span class="num">${n}</span>`;
        b.setAttribute('aria-label', `${def.name} ${n}`);
        row.append(b);
      });
      const lock = document.createElement('button');
      lock.type = 'button';
      lock.className = 'cell cell-lock';
      lock.dataset.r = r; lock.dataset.lock = '1';
      lock.innerHTML = '<span class="num">🔒</span>';
      lock.setAttribute('aria-label', `${def.name} Schloss`);
      row.append(lock);
      return row;
    }));

    $('penalties').replaceChildren(...Array.from({ length: MAX_PENALTIES }, (_, i) => {
      const b = document.createElement('button');
      b.type = 'button';
      b.className = 'penalty';
      b.dataset.p = i;
      b.setAttribute('aria-label', `Fehlwurf ${i + 1}`);
      return b;
    }));
  }

  function render() {
    game.rows.forEach((row, r) => {
      const el = $('rows').children[r];
      el.classList.toggle('locked', !!row.locked);
      const last = lastCrossed(row);
      [...el.querySelectorAll('.cell')].forEach((c) => {
        if (c.dataset.lock) {
          c.classList.toggle('crossed', row.locked === 'me');
          c.classList.toggle('closed', row.locked === 'other');
          return;
        }
        const i = Number(c.dataset.i);
        const crossed = row.crossed.includes(i);
        c.classList.toggle('crossed', crossed);
        c.classList.toggle('dead', !crossed && (i < last || !!row.locked));
        c.classList.toggle('blocked', !crossed && i === LAST && !row.locked && row.crossed.length < MIN_FOR_LAST);
        c.setAttribute('aria-pressed', String(crossed));
      });
    });
    [...$('penalties').children].forEach((b, i) => b.classList.toggle('crossed', i < game.penalties));

    const notice = $('notice');
    if (gameOver()) {
      notice.hidden = false;
      notice.textContent = game.penalties >= MAX_PENALTIES
        ? 'Vierter Fehlwurf – das Spiel ist zu Ende.'
        : 'Zwei Reihen sind geschlossen – das Spiel ist zu Ende.';
    } else {
      notice.hidden = true;
    }
    $('btnUndo').disabled = !game.undo.length;
    renderDice();
  }

  function renderScore() {
    const rowsHtml = ROWS.map((def, r) => {
      const n = crossCount(game.rows[r]);
      return `<tr class="sc-${def.id}"><th>${def.name}</th><td>${n} ✕</td><td>${points(n)}</td></tr>`;
    }).join('');
    const pen = game.penalties * PENALTY;
    const total = game.rows.reduce((s, row) => s + points(crossCount(row)), 0) - pen;
    $('scoreTable').innerHTML = rowsHtml +
      `<tr class="sc-pen"><th>Fehlwürfe</th><td>${game.penalties} ✕</td><td>${pen ? '−' + pen : 0}</td></tr>` +
      `<tr class="sc-total"><th>Gesamt</th><td></td><td>${total}</td></tr>`;
  }

  // ---------------------------------------------------------------- Würfel

  const DICE = [
    { id: 'white', name: 'Weiß' }, { id: 'white', name: 'Weiß' },
    { id: 'red', name: 'Rot', row: 0 }, { id: 'yellow', name: 'Gelb', row: 1 },
    { id: 'green', name: 'Grün', row: 2 }, { id: 'blue', name: 'Blau', row: 3 }
  ];

  const roll1 = () => {
    const a = new Uint32Array(1);
    crypto.getRandomValues(a);
    return (a[0] % 6) + 1;
  };

  function buildDice() {
    $('dice').replaceChildren(...DICE.map((d) => {
      const el = document.createElement('div');
      el.className = `die die-${d.id}`;
      el.setAttribute('role', 'img');
      for (let k = 0; k < 9; k++) el.append(document.createElement('i'));
      return el;
    }));
  }

  // Augen als 3×3-Raster: welche der neun Positionen leuchten.
  const PIPS = { 1: [4], 2: [0, 8], 3: [0, 4, 8], 4: [0, 2, 6, 8], 5: [0, 2, 4, 6, 8], 6: [0, 2, 3, 5, 6, 8] };

  function showDie(el, d, value) {
    const out = d.row !== undefined && game.rows[d.row].locked;
    el.classList.toggle('out', !!out);
    [...el.children].forEach((p, k) => p.classList.toggle('on', !!value && PIPS[value].includes(k)));
    el.setAttribute('aria-label', out ? `${d.name}: aus dem Spiel` : `${d.name}: ${value || '–'}`);
  }

  function renderDice() {
    const els = $('dice').children;
    DICE.forEach((d, k) => showDie(els[k], d, game.dice ? game.dice[k] : 0));
    $('whiteSum').textContent = game.dice ? `Weiß zusammen: ${game.dice[0] + game.dice[1]}` : 'Weiß zusammen: –';
  }

  let rolling = false;
  function roll() {
    if (rolling) return;
    rolling = true;
    const els = $('dice').children;
    let steps = 0;
    buzz(40);
    const timer = setInterval(() => {
      DICE.forEach((d, k) => showDie(els[k], d, roll1()));
      if (++steps >= 8) {
        clearInterval(timer);
        game.dice = DICE.map(() => roll1());
        save();
        renderDice();
        rolling = false;
      }
    }, 55);
  }

  // ---------------------------------------------------------------- Kleinkram

  function buzz(ms) { if (navigator.vibrate) navigator.vibrate(ms); }

  let toastTimer = 0;
  function toast(text) {
    $('toastText').textContent = text;
    $('toastAction').hidden = true;
    $('toast').hidden = false;
    clearTimeout(toastTimer);
    toastTimer = setTimeout(() => { $('toast').hidden = true; }, 2600);
  }

  function showView(name) {
    $('viewBlock').hidden = name !== 'Block';
    $('viewDice').hidden = name !== 'Dice';
    for (const t of document.querySelectorAll('.tab')) t.classList.toggle('active', t.dataset.view === name);
    try { localStorage.setItem('kreuzblock:view', name); } catch { /* egal */ }
  }

  // ---------------------------------------------------------------- Ereignisse

  let lockRow = 0;
  $('rows').addEventListener('click', (e) => {
    const c = e.target.closest('.cell');
    if (!c) return;
    const r = Number(c.dataset.r);
    if (c.dataset.lock) {
      if (game.rows[r].locked || gameOver()) return;
      lockRow = r;
      $('dlgLockTitle').textContent = `${ROWS[r].name} schließen?`;
      $('dlgLock').showModal();
      return;
    }
    cross(r, Number(c.dataset.i));
  });
  $('btnLockConfirm').addEventListener('click', () => { lockByOther(lockRow); $('dlgLock').close(); });

  $('penalties').addEventListener('click', (e) => {
    const b = e.target.closest('.penalty');
    if (b) togglePenalty(Number(b.dataset.p));
  });

  $('btnScore').addEventListener('click', () => { renderScore(); $('dlgScore').showModal(); });
  $('btnUndo').addEventListener('click', undo);
  $('btnNew').addEventListener('click', () => $('dlgNew').showModal());
  $('btnNewConfirm').addEventListener('click', () => {
    game = fresh(); save(); render(); $('dlgNew').close(); showView('Block');
  });
  $('btnRoll').addEventListener('click', roll);
  for (const t of document.querySelectorAll('.tab')) t.addEventListener('click', () => showView(t.dataset.view));
  for (const dlg of document.querySelectorAll('dialog')) {
    dlg.addEventListener('click', (e) => { if (e.target === dlg) dlg.close(); });
  }

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
      if (!hadController) return;
      $('toastText').textContent = 'Neue Version verfügbar.';
      const a = $('toastAction');
      a.hidden = false; a.textContent = 'Neu laden'; a.onclick = () => location.reload();
      $('toast').hidden = false;
    });
  }

  // ---------------------------------------------------------------- Start

  buildRows();
  buildDice();
  render();
  let view = 'Block';
  try { view = localStorage.getItem('kreuzblock:view') || 'Block'; } catch { /* egal */ }
  showView(view === 'Dice' ? 'Dice' : 'Block');
  document.documentElement.dataset.build = BUILD;
})();
