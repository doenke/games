# Summenraster

Ersatzblock für **Knister** auf dem Handy. Gespielt wird mit den **2 weißen
Würfeln**. Inoffizielles Fan-Tool, nicht mit dem Verlag verbunden.

Online: <https://games.kanonenwiese.de/summenraster/>

## Bedienung

- Gewürfelte Summe (2–12) in der Leiste unten antippen, dann ein freies Feld –
  oder erst das Feld, dann die Summe.
- Am Rand laufen die Punkte jeder Reihe, Spalte und Diagonale mit; oben steht
  die Nummer des Wurfs (1–25).
- ↶ nimmt den letzten Eintrag zurück, ☀ hält den Bildschirm an, **?** öffnet
  die Anleitung. Nach dem 25. Eintrag erscheint die Abrechnung.

## Wertung

Je Linie (5 Reihen, 5 Spalten, 2 Diagonalen) die beste Kombination,
Diagonalen doppelt: Paar 1, Zwei Paare 3, Drilling 3, Vierling 6,
Full House 8, Straße mit 7 8, Straße ohne 7 12, Fünfling 10.

## Technik

Statisches HTML/CSS/JS, offlinefähig, installierbar. Spielstand in
`localStorage` (Schlüssel `summenraster:`). Icons: `node tools/icons.js`
(Playwright).
