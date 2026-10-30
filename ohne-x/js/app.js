/* Ohne X – Begriffe erklären ohne verbotenen Buchstaben; Timer und Punkte für zwei Teams. */
(function () {
  'use strict';

  // __BUILD__ wird beim Deploy durch den Commit-SHA ersetzt.
  const BUILD = '__BUILD__';

  const KEY_SETTINGS = 'ohne-x:settings';
  const KEY_GAME = 'ohne-x:game';
  const KEY_DECK = 'ohne-x:deck';
  const WORDS = window.OHNE_X_WORDS || [];
  // Verbotene Buchstaben: häufige, aber kein E – das wäre kaum spielbar.
  const LETTERS = 'AIOUNSTRLHMDGB';
  // Die sechs Farben der Karten, in der Reihenfolge der Streifen
  const COLORS = [
    { id: 'blue', name: 'Blau' }, { id: 'yellow', name: 'Gelb' }, { id: 'orange', name: 'Orange' },
    { id: 'pink', name: 'Pink' }, { id: 'purple', name: 'Lila' }, { id: 'green', name: 'Grün' }
  ];
  const RESULT = {
    ok:   { label: 'erraten', mark: '✓' },
    bad:  { label: 'verboten', mark: '✕' },
    skip: { label: 'übersprungen', mark: '→' }
  };

  const $ = (id) => document.getElementById(id);
  const load = (key, fallback) => {
    try { const v = localStorage.getItem(key); return v ? JSON.parse(v) : fallback; } catch { return fallback; }
  };
  const store = (key, value) => { try { localStorage.setItem(key, JSON.stringify(value)); } catch { /* egal */ } };

  const settings = Object.assign({ timer: 60, rounds: 5, sound: true, names: ['Team A', 'Team B'] }, load(KEY_SETTINGS, {}));
  let game = load(KEY_GAME, null);
  // Spielstände aus der ersten Version (ein Begriff pro Karte) weiterspielen
  if (game && game.card && !game.card.terms) game.card = null;
  const saveGame = () => store(KEY_GAME, game);

  // ---------------------------------------------------------------- Stapel

  // Gemischte Reihenfolge bleibt über Spiele hinweg erhalten: Begriffe kommen
  // erst wieder, wenn alle einmal dran waren.
  let deck = load(KEY_DECK, null);
  if (!deck || !Array.isArray(deck.order) || deck.order.length !== WORDS.length) deck = shuffled();
  function shuffled() {
    const order = WORDS.map((_, i) => i);
    for (let i = order.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [order[i], order[j]] = [order[j], order[i]];
    }
    return { order, pos: 0 };
  }
  /** Eine Karte: sechs Begriffe in sechs Farben, dazu Schild mit Farbe und Buchstabe. */
  function draw() {
    const terms = [];
    while (terms.length < COLORS.length) {
      if (deck.pos >= deck.order.length) deck = shuffled();
      terms.push(WORDS[deck.order[deck.pos++]]);
    }
    store(KEY_DECK, deck);
    return {
      terms,
      color: Math.floor(Math.random() * COLORS.length),
      letter: LETTERS[Math.floor(Math.random() * LETTERS.length)]
    };
  }

  // ---------------------------------------------------------------- Spielstand

  const activeTeam = (turn = game.turn) => turn % 2;

  /** Punkte aus dem Protokoll: Erratenes für das aktive Team, alles andere für die Gegner. */
  function scores() {
    const s = [0, 0];
    for (const e of game.log) {
      const t = activeTeam(e.turn);
      s[e.res === 'ok' ? t : 1 - t]++;
    }
    return s;
  }

  function newGame() {
    game = {
      names: settings.names.slice(),
      rounds: settings.rounds,   // reguläre Runden pro Team
      turns: settings.rounds * 2,
      turn: 0,
      phase: 'ready',
      log: [],
      card: null,
      endsAt: 0
    };
    saveGame();
  }

  // ---------------------------------------------------------------- Ansichten

  const VIEWS = ['viewSetup', 'viewReady', 'viewPlay', 'viewSummary', 'viewEnd'];
  function show(id) { for (const v of VIEWS) $(v).hidden = v !== id; window.scrollTo({ top: 0 }); }

  function scoreHtml() {
    const s = scores();
    return game.names.map((n, i) =>
      `<div class="sc${game.phase !== 'end' && activeTeam() === i ? ' on' : ''}"><span>${esc(n)}</span><b>${s[i]}</b></div>`).join('');
  }
  const esc = (t) => String(t).replace(/[&<>"]/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' })[c]);

  function render() {
    if (!game) {
      $('name0').value = settings.names[0];
      $('name1').value = settings.names[1];
      for (const b of $('segTimer').children) b.classList.toggle('on', Number(b.dataset.v) === settings.timer);
      for (const b of $('segRounds').children) b.classList.toggle('on', Number(b.dataset.v) === settings.rounds);
      $('optSound').checked = settings.sound;
      show('viewSetup');
      return;
    }
    if (game.phase === 'ready') {
      $('scoreReady').innerHTML = scoreHtml();
      const round = Math.floor(game.turn / 2) + 1, of = game.rounds;
      $('roundReady').textContent = round > of ? 'Entscheidungsrunde' : `Runde ${round} von ${of}`;
      $('teamReady').textContent = `${game.names[activeTeam()]} ist dran`;
      $('btnGo').hidden = false; $('countdown').hidden = true;
      show('viewReady');
    } else if (game.phase === 'play') {
      $('playTeam').textContent = game.names[activeTeam()];
      renderCard();
      show('viewPlay');
      tick();
    } else if (game.phase === 'summary') {
      renderSummary();
      show('viewSummary');
    } else {
      renderEnd();
      show('viewEnd');
    }
  }

  function renderCard() {
    if (!game.card) game.card = draw();
    const c = game.card;
    const col = COLORS[c.color];
    $('back').className = `back c-${col.id}`;
    $('back').setAttribute('aria-label', `Farbe ${col.name}, verboten: ${c.letter}`);
    $('letter').textContent = c.letter;
    $('front').innerHTML = c.terms.map((t, i) =>
      `<li class="c-${COLORS[i].id}"><span>${esc(t)}</span></li>`).join('');
    const mine = game.log.filter((e) => e.turn === game.turn);
    $('playPts').textContent = `✓ ${mine.filter((e) => e.res === 'ok').length}`;
    $('btnUndo').disabled = !mine.length;
  }

  function renderSummary() {
    const mine = game.log.filter((e) => e.turn === game.turn);
    const ok = mine.filter((e) => e.res === 'ok').length;
    $('sumTitle').textContent = `${game.names[activeTeam()]}: ${ok} erraten, ${mine.length - ok} für die Gegner`;
    $('scoreSum').innerHTML = scoreHtml();
    $('log').innerHTML = mine.length
      ? mine.map((e) => `<li><button type="button" class="res-${e.res}" data-i="${game.log.indexOf(e)}">` +
        `<span class="mk">${RESULT[e.res].mark}</span><span class="t">${e.card ? `<i class="dot c-${COLORS[e.card.color].id}"></i>` : ''}${esc(e.term)}</span>` +
        `<small>ohne ${e.letter} · ${RESULT[e.res].label}</small></button></li>`).join('')
      : '<li class="empty">Kein Begriff in dieser Runde.</li>';
    const last = game.turn + 1 >= game.turns;
    $('btnNext').textContent = last ? 'Zum Ergebnis' : `Weiter: ${game.names[activeTeam(game.turn + 1)]}`;
  }

  function renderEnd() {
    $('scoreEnd').innerHTML = scoreHtml();
    const s = scores();
    const tie = s[0] === s[1];
    $('winner').textContent = tie ? 'Gleichstand!' : `${game.names[s[0] > s[1] ? 0 : 1]} gewinnt!`;
    $('btnTie').hidden = !tie;
  }

  // ---------------------------------------------------------------- Ablauf

  function startTurn() {
    unlockAudio();
    $('btnGo').hidden = true;
    const cd = $('countdown');
    cd.hidden = false;
    let n = 3;
    cd.textContent = n;
    beep(660, .12);
    const step = setInterval(() => {
      n--;
      if (n > 0) { cd.textContent = n; beep(660, .12); return; }
      clearInterval(step);
      beep(990, .25);
      buzz(60);
      game.phase = 'play';
      game.card = draw();
      game.endsAt = Date.now() + settings.timer * 1000;
      game.duration = settings.timer;
      saveGame();
      render();
    }, 800);
  }

  function answer(res) {
    if (game.phase !== 'play') return;
    const c = game.card;
    game.log.push({ turn: game.turn, term: c.terms[c.color], letter: c.letter, res, card: c });
    game.card = draw();
    saveGame();
    buzz(res === 'ok' ? 25 : [40, 40, 40]);
    if (res === 'ok') beep(880, .08);
    renderCard();
    const card = $('card');
    card.classList.remove('flash-ok', 'flash-bad');
    void card.offsetWidth;
    card.classList.add(res === 'ok' ? 'flash-ok' : 'flash-bad');
  }

  function undoAnswer() {
    const e = game.log[game.log.length - 1];
    if (!e || e.turn !== game.turn) return;
    game.log.pop();
    deck.pos = Math.max(0, deck.pos - COLORS.length);   // aktuelle Karte zurück auf den Stapel
    store(KEY_DECK, deck);
    game.card = e.card;
    saveGame();
    renderCard();
  }

  function endTurn(byTimer) {
    if (game.phase !== 'play') return;
    // Angefangene Karte kommt unter den Stapel: zählt für niemanden.
    game.card = null;
    game.phase = 'summary';
    saveGame();
    if (byTimer) { alarm(); }
    render();
  }

  let tickHandle = 0;
  function tick() {
    cancelAnimationFrame(tickHandle);
    if (!game || game.phase !== 'play') return;
    const left = Math.max(0, game.endsAt - Date.now());
    const sec = Math.ceil(left / 1000);
    $('timer').textContent = sec;
    $('timer').classList.toggle('low', sec <= 10);
    $('timebar').style.width = `${(left / ((game.duration || settings.timer) * 1000)) * 100}%`;
    if (sec !== tick.last) {
      if (sec <= 5 && sec > 0) beep(520, .06, .15);
      tick.last = sec;
    }
    if (left <= 0) { endTurn(true); return; }
    tickHandle = requestAnimationFrame(tick);
  }

  // ---------------------------------------------------------------- Ton

  let audio = null;
  function unlockAudio() {
    if (!settings.sound) return;
    try {
      audio = audio || new (window.AudioContext || window.webkitAudioContext)();
      if (audio.state === 'suspended') audio.resume();
    } catch { audio = null; }
  }
  function beep(freq, dur, vol = 0.25, when = 0) {
    if (!settings.sound || !audio) return;
    try {
      const t = audio.currentTime + when;
      const osc = audio.createOscillator(), gain = audio.createGain();
      osc.type = 'square';
      osc.frequency.value = freq;
      gain.gain.setValueAtTime(vol, t);
      gain.gain.exponentialRampToValueAtTime(0.001, t + dur);
      osc.connect(gain).connect(audio.destination);
      osc.start(t); osc.stop(t + dur);
    } catch { /* kein Ton */ }
  }
  function buzz(pattern) { if (settings.sound && navigator.vibrate) navigator.vibrate(pattern); }
  function alarm() {
    beep(440, .25, .3); beep(330, .25, .3, .3); beep(220, .5, .3, .6);
    buzz([200, 100, 200, 100, 400]);
  }

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

  function seg(id, key) {
    $(id).addEventListener('click', (e) => {
      const b = e.target.closest('button');
      if (!b) return;
      settings[key] = Number(b.dataset.v);
      store(KEY_SETTINGS, settings);
      render();
    });
  }
  // Namen sofort merken, damit ein Neuzeichnen sie nicht überschreibt
  for (const i of [0, 1]) {
    $('name' + i).addEventListener('input', (e) => {
      settings.names[i] = e.target.value.trim() || ['Team A', 'Team B'][i];
      store(KEY_SETTINGS, settings);
    });
  }
  seg('segTimer', 'timer');
  seg('segRounds', 'rounds');
  $('optSound').addEventListener('change', (e) => { settings.sound = e.target.checked; store(KEY_SETTINGS, settings); });

  $('btnStart').addEventListener('click', () => {
    settings.names = [$('name0').value.trim() || 'Team A', $('name1').value.trim() || 'Team B'];
    store(KEY_SETTINGS, settings);
    unlockAudio();
    newGame();
    render();
  });
  $('btnGo').addEventListener('click', startTurn);
  $('btnOk').addEventListener('click', () => answer('ok'));
  $('btnBad').addEventListener('click', () => answer('bad'));
  $('btnSkip').addEventListener('click', () => answer('skip'));
  $('btnUndo').addEventListener('click', undoAnswer);
  $('btnStop').addEventListener('click', () => endTurn(false));

  $('log').addEventListener('click', (e) => {
    const b = e.target.closest('button[data-i]');
    if (!b) return;
    const entry = game.log[Number(b.dataset.i)];
    entry.res = entry.res === 'ok' ? 'bad' : 'ok';
    saveGame();
    renderSummary();
  });

  $('btnNext').addEventListener('click', () => {
    game.turn++;
    game.phase = game.turn >= game.turns ? 'end' : 'ready';
    saveGame();
    render();
  });
  $('btnTie').addEventListener('click', () => {
    game.turns += 2;          // je Team noch eine Runde
    game.phase = 'ready';
    saveGame();
    render();
  });
  $('btnAgain').addEventListener('click', () => {
    game = null;
    try { localStorage.removeItem(KEY_GAME); } catch { /* egal */ }
    render();
  });

  $('btnNew').addEventListener('click', () => { if (game) $('dlgNew').showModal(); });
  $('btnNewConfirm').addEventListener('click', () => {
    cancelAnimationFrame(tickHandle);
    game = null;
    try { localStorage.removeItem(KEY_GAME); } catch { /* egal */ }
    $('dlgNew').close();
    render();
  });
  for (const dlg of document.querySelectorAll('dialog')) {
    dlg.addEventListener('click', (e) => { if (e.target === dlg) dlg.close(); });
  }

  // ---------------------------------------------------------------- Bildschirm anlassen

  let wakeWanted = false, wakeLock = null;
  try { wakeWanted = localStorage.getItem('ohne-x:wake') === '1'; } catch { /* egal */ }
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
    try { localStorage.setItem('ohne-x:wake', wakeWanted ? '1' : '0'); } catch { /* egal */ }
    await applyWake();
    toast(wakeWanted ? 'Bildschirm bleibt an.' : 'Bildschirm darf wieder ausgehen.');
  });
  document.addEventListener('visibilitychange', () => {
    if (document.visibilityState !== 'visible') return;
    applyWake();
    tick();   // nach dem Zurückkommen Restzeit neu berechnen
  });

  // ---------------------------------------------------------------- Service Worker

  // Ein Service Worker für alle Spiele (/sw.js). Er hält sie offline bereit
  // und aktualisiert still – keine Meldung bei neuen Versionen.
  if ('serviceWorker' in navigator) {
    window.addEventListener('load', () => {
      navigator.serviceWorker.register('../sw.js', { scope: '../' }).catch(() => {});
    });
  }

  // ---------------------------------------------------------------- Start

  render();
  applyWake();
  document.documentElement.dataset.build = BUILD;
})();
