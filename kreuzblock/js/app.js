/* Kreuzblock – Ersatz-Wertungsblock für Qwixx. */
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

  /** Reihe als „von Mitspieler gesperrt“ markieren oder wieder öffnen. */
  function toggleOtherLock(r) {
    const row = game.rows[r];
    const name = ROWS[r].name;
    if (row.locked === 'me') {
      toast(`${name} hast du selbst abgeschlossen – zum Öffnen das letzte Kreuz antippen.`);
      return;
    }
    snapshot();
    if (row.locked === 'other') {
      row.locked = null;
      toast(`${name} ist wieder offen.`);
    } else {
      row.locked = 'other';
      toast(`${name} gesperrt – ↶ oder erneut tippen macht es rückgängig.`);
    }
    buzz(20);
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
      el.classList.toggle('locked-other', row.locked === 'other');
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


  // ---------------------------------------------------------------- Ereignisse

  $('rows').addEventListener('click', (e) => {
    const c = e.target.closest('.cell');
    if (!c) return;
    const r = Number(c.dataset.r);
    if (c.dataset.lock) { toggleOtherLock(r); return; }
    cross(r, Number(c.dataset.i));
  });

  $('penalties').addEventListener('click', (e) => {
    const b = e.target.closest('.penalty');
    if (b) togglePenalty(Number(b.dataset.p));
  });

  $('btnScore').addEventListener('click', () => { renderScore(); $('dlgScore').showModal(); });
  $('btnUndo').addEventListener('click', undo);
  $('btnNew').addEventListener('click', () => $('dlgNew').showModal());
  $('btnNewConfirm').addEventListener('click', () => {
    game = fresh(); save(); render(); $('dlgNew').close();
  });
  for (const dlg of document.querySelectorAll('dialog')) {
    dlg.addEventListener('click', (e) => { if (e.target === dlg) dlg.close(); });
  }

  // ---------------------------------------------------------------- Bildschirm anlassen

  // Wunsch wird gespeichert; die Sperre selbst gibt der Browser beim Wechsel in den
  // Hintergrund frei, deshalb beim Zurückkommen neu anfordern.
  let wakeWanted = false;
  let wakeLock = null;
  try { wakeWanted = localStorage.getItem('kreuzblock:wake') === '1'; } catch { /* egal */ }

  async function applyWake() {
    const btn = $('btnWake');
    if (!('wakeLock' in navigator)) {
      btn.classList.remove('active');
      btn.setAttribute('aria-pressed', 'false');
      return;
    }
    try {
      if (wakeWanted && !wakeLock && document.visibilityState === 'visible') {
        wakeLock = await navigator.wakeLock.request('screen');
        wakeLock.addEventListener('release', () => { wakeLock = null; renderWake(); });
      } else if (!wakeWanted && wakeLock) {
        await wakeLock.release();
        wakeLock = null;
      }
    } catch { wakeLock = null; }
    renderWake();
  }

  function renderWake() {
    const on = wakeWanted && !!wakeLock;
    $('btnWake').classList.toggle('active', on);
    $('btnWake').setAttribute('aria-pressed', String(on));
  }

  $('btnWake').addEventListener('click', async () => {
    if (!('wakeLock' in navigator)) {
      toast('Dieser Browser kann den Bildschirm nicht wachhalten.');
      return;
    }
    wakeWanted = !wakeWanted;
    try { localStorage.setItem('kreuzblock:wake', wakeWanted ? '1' : '0'); } catch { /* egal */ }
    await applyWake();
    if (wakeWanted && !wakeLock) toast('Bildschirm-Sperre ließ sich nicht verhindern.');
    else toast(wakeWanted ? 'Bildschirm bleibt an.' : 'Bildschirm darf wieder ausgehen.');
  });

  document.addEventListener('visibilitychange', () => {
    if (document.visibilityState === 'visible') applyWake();
  });

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
  render();
  try { localStorage.removeItem('kreuzblock:view'); } catch { /* egal */ }
  applyWake();
  document.documentElement.dataset.build = BUILD;
})();
