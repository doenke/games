# Farbkreuz

Ersatzblock für **Noch mal!** auf dem Handy – mit **eigenem Spielfeld** und
gespielt mit den **Würfeln aus „Noch mal!“**.
Inoffizielles Fan-Tool, nicht mit dem Verlag verbunden.

Online: <https://games.kanonenwiese.de/farbkreuz/>

## Würfel

Die Originalwürfel: 3 Farbwürfel (5 Farben + Joker), 3 Zahlwürfel (1–5 + Joker).

## Spielfelder

15 × 7 Felder (Spalten A–O, Start in H), 5 Farben mit je 21 Feldern in
Flächen von 1 bis 6 Feldern, ein Stern pro Spalte. Vier eigene Entwürfe,
erzeugt mit `python3 tools/raster.py 4` (feste Startwerte): Feld 1 und 2
gemischt, Feld 3 kleine Flächen, Feld 4 große Flächen. Sie stehen als `BOARDS`
in `js/app.js`; gewählt wird bei „Neu“, alle Mitspieler nehmen dasselbe Feld.

**Achtung:** Reihenfolge und Inhalt der Felder nicht ändern – laufende Spiele
merken sich die Nummer, die Kreuze hängen an den Feldpositionen. Neue Felder
hinten anhängen.

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
