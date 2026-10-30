# Schlaufuchs

Eigenes Wertungsblatt nach dem Prinzip von **Ganz schön clever** – gleiche
Mechanik (fünf Farbbereiche, Weiß als Joker, Silbertablett, Neuwurf, +1,
Füchse), aber eigene Zahlen- und Bonusverteilung. Inoffizielles Fan-Tool,
nicht mit dem Verlag verbunden.

Online: <https://games.kanonenwiese.de/schlaufuchs/>

## Würfel

Dieselben sechs wie bei Kreuzblock und Farbkreuz:

| Würfel | Bereich |
| --- | --- |
| Weiß | Joker |
| Weiß mit Punkt (markieren!) | Lila |
| Rot | Rot (im Original Orange) |
| Gelb, Grün, Blau | wie die Farbe |

## Blatt

Alle Werte stehen als Tabellen oben in `js/app.js` (`Y_NUM`, `Y_ROW`, `B_ROW`,
`G_BONUS`, `O_BONUS`, `P_BONUS`, …). Ändern macht laufende Spiele nicht kaputt,
verschiebt aber deren Boni.

## Bedienung

- Gelb, Blau, Grün: Feld antippen. Rot, Lila: nächstes Feld antippen, Augenzahl
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
