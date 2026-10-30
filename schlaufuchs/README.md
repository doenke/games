# Schlaufuchs

Eigenes Wertungsblatt nach dem Prinzip von **Ganz schön clever** – gleiche
Mechanik (fünf Farbbereiche, Weiß als Joker, Silbertablett, Neuwurf, +1,
Füchse), aber eigene Zahlen- und Bonusverteilung. Inoffizielles Fan-Tool,
nicht mit dem Verlag verbunden.

Online: <https://games.kanonenwiese.de/schlaufuchs/>

## Würfel

Sechs Würfel in den Originalfarben: weiß (Joker), gelb, blau, grün, orange, lila.

## Blätter

Drei eigene Blätter, Auswahl bei „Neu“: Blatt 1, Blatt 2 (andere Zahlen in
Gelb, andere Boni und Multiplikatoren) und Blatt 3 „Fuchsjagd“ (mehr Füchse).
Alle Werte stehen in `SHEETS` in `js/app.js`. Reihenfolge nicht ändern,
laufende Spiele merken sich die Nummer; neue Blätter hinten anhängen.

## Bedienung

- Gelb, Blau, Grün: Feld antippen. Orange, Lila: nächstes Feld antippen, Augenzahl
  wählen (Lila sperrt unzulässige Zahlen).
- Boni bucht die App selbst, auch in Ketten. Freie Kreuze in Gelb/Blau blinken,
  bis ein Feld gewählt ist (oder „Verfallen lassen“).
- Neuwurf/+1 oben antippen, wenn benutzt; nächste Runde über die Rundenleiste
  (Rundenboni: 1 Neuwurf, 2 +1, 3 Neuwurf). Spielerzahl bei „Neu“.
- ↶ nimmt jeden Schritt zurück, ☀ hält den Bildschirm an.

## Technik

Statisches HTML/CSS/JS, offlinefähig, installierbar. Spielstand in
`localStorage` (Schlüssel `schlaufuchs:`). Icons: `node tools/icons.js`
(Playwright).
