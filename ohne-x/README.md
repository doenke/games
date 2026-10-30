# Ohne X

Ersatz für Karten und Timer von **Nix da!**: Begriffe erklären, ohne einen
verbotenen Buchstaben zu benutzen. Zwei Teams, Punkte zählt die App.
Inoffizielles Fan-Tool mit eigenen Begriffen, nicht mit dem Verlag verbunden.

Online: <https://games.kanonenwiese.de/ohne-x/>

## Ablauf

- Start: Teamnamen (beginnendes Team zuerst), Zeit (45/60/90 s), Runden pro
  Team (3/5/7, Original: 5).
- Runde: „3, 2, 1 – Los!“, dann Begriff plus verbotener Buchstabe.
  ✓ Erraten = Punkt fürs aktive Team; ✕ Verboten! und Überspringen = Karte an die
  Gegner, es geht weiter. ↶ nimmt den letzten Knopfdruck zurück.
- Zeit um: angefangene Karte zählt nicht. Auswertung mit allen Begriffen;
  Antippen dreht „erraten“ ↔ „Gegner“ um.
- Ende nach allen Runden; bei Gleichstand eine Entscheidungsrunde je Team.

## Begriffe

`js/words.js` wird aus den Neandertaler-Karten erzeugt (beide Spalten, ohne
Dubletten, rund 3600 Begriffe):

```bash
python3 tools/build-words.py
```

Verbotene Buchstaben: A I O U N S T R L H M D G B (kein E – kaum spielbar).
Die gemischte Reihenfolge wird gespeichert, Begriffe wiederholen sich erst,
wenn alle dran waren.

## Technik

Statisches HTML/CSS/JS, offlinefähig, installierbar. Spielstand, Einstellungen
und Stapel in `localStorage` (Schlüssel `ohne-x:`). Icons: `node tools/icons.js`.
