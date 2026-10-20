# Kreuzblock

Ersatz-Wertungsblock und Würfel für **Qwixx** auf dem Handy – für den Fall, dass
der Block leer ist oder die Würfel zu Hause liegen. Inoffizielles Fan-Tool,
nicht mit dem Verlag verbunden.

Online: <https://games.kanonenwiese.de/kreuzblock/>

## Block

- Vier Reihen wie im Original: Rot und Gelb von 2 bis 12, Grün und Blau von 12
  bis 2. Antippen setzt ein Kreuz.
- Es geht nur von links nach rechts; übersprungene Felder werden ausgegraut und
  lassen sich nicht mehr ankreuzen.
- Das letzte Feld (gestrichelt) geht erst ab 5 Kreuzen in der Reihe. Wer es
  ankreuzt, schließt die Reihe ab; das Schloss zählt als zusätzliches Kreuz.
- Hat ein Mitspieler eine Reihe abgeschlossen: unter dem Block bei „Von
  Mitspieler gesperrt“ die Farbe antippen (oder das Schloss am Reihenende).
  Die Reihe wird gestreift als „gesperrt“ markiert, das Schloss zählt nicht
  für dich. Erneutes Tippen öffnet sie wieder.
- Vier Fehlwurf-Kästchen zu je −5 Punkten.
- Das zuletzt gesetzte Kreuz einer Reihe lässt sich durch erneutes Antippen
  entfernen; ↶ nimmt jede Aktion zurück.
- Bei zwei geschlossenen Reihen oder vier Fehlwürfen zeigt der Block das
  Spielende an.
- „Punkte ausrechnen“ zeigt je Reihe Kreuze und Punkte
  (1, 3, 6, 10, 15, 21, 28, 36, 45, 55, 66, 78), die Fehlwürfe und die Summe.

- ☀ oben hält den Bildschirm an, solange die App offen ist (Screen Wake
  Lock; die Einstellung wird gemerkt).

## Würfel

Zwei weiße und je ein roter, gelber, grüner und blauer Würfel. Würfel von
geschlossenen Reihen werden ausgeblendet; die Summe der weißen steht darunter.

## Technik

Statisches HTML/CSS/JS, offlinefähig per Service Worker, installierbar.
Der Spielstand liegt in `localStorage` (Schlüssel `kreuzblock:`) und übersteht
Neuladen und Appwechsel. Funktioniert im Hoch- und Querformat.
