# Farbkreuz

Ersatzblock für **Noch mal!** auf dem Handy – mit **eigenem Spielfeld** und
spielbar mit **normalen Würfeln** (denselben sechs wie beim Kreuzblock).
Inoffizielles Fan-Tool, nicht mit dem Verlag verbunden.

Online: <https://games.kanonenwiese.de/farbkreuz/>

## Würfel

| | 1 | 2 | 3 | 4 | 5 | 6 |
| --- | --- | --- | --- | --- | --- | --- |
| Farbwürfel (rot, gelb, grün) | Grün | Gelb | Blau | Rot | Orange | Joker |
| Zahlwürfel (weiß, weiß, blau) | 1 | 2 | 3 | 4 | 5 | Joker |

## Spielfeld

15 × 7 Felder (Spalten A–O, Start in H), 5 Farben mit je 21 Feldern in
Flächen von 1 bis 6 Feldern, ein Stern pro Spalte. Das Feld ist ein eigener
Entwurf, erzeugt mit `tools/raster.py` (fester Startwert), und steht als
`BOARD` in `js/app.js`. Alle Handys zeigen dasselbe Feld.

**Achtung:** Wer das Feld ändert, macht laufende Spiele auf den Handys
ungültig (die Kreuze hängen an den Feldpositionen).

## Bedienung

- Felder antippen merkt sie vor, die Zugleiste zeigt z. B. „4 × Blau“.
  Farb-/Zahl-Joker antippen, dann **Ankreuzen**. Die App prüft: eine Farbe,
  zusammenhängend, höchstens 5 Felder, Anschluss an Spalte H oder eigene Kreuze,
  Joker übrig.
- Spalte oder Farbe hat ein Mitspieler zuerst voll: Punkte unter der Spalte
  bzw. das Farbfeld antippen – dann zählt der untere Wert.
- ↶ verwirft Vorgemerktes oder nimmt den letzten Zug zurück; **Punkte
  ausrechnen** zeigt Spalten, Farben, Joker (+1) und offene Sterne (−2).
- Hochformat: Spalten als Zeilen; Querformat: wie auf Papier.
- ☀ hält den Bildschirm an, **?** öffnet die Anleitung.

## Technik

Statisches HTML/CSS/JS, offlinefähig, installierbar. Spielstand in
`localStorage` (Schlüssel `farbkreuz:`).
