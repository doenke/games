# Spiele

Kleine, handyoptimierte Spiele-Apps als offlinefähige PWAs – statisches
HTML/CSS/JS ohne Build und Backend. Jedes Spiel liegt in einem eigenen Ordner.

Online: <https://games.kanonenwiese.de/>

| Ordner | Spiel |
| --- | --- |
| [`neandertaler/`](neandertaler/) | Zusatzkarten, Timer und Punkte für „Poesie für Neandertaler“ |
| [`kreuzblock/`](kreuzblock/) | Ersatz-Wertungsblock für „Qwixx“ |
| [`farbkreuz/`](farbkreuz/) | Ersatzblock mit eigenem Spielfeld für „Noch mal!“, mit normalen Würfeln |

Im Wurzelverzeichnis liegen die Übersicht (`index.html`), die gemeinsame Seite
„Kontakt & Datenschutz“ (`kontakt.html`, `site.css`) sowie `.htaccess` und
`robots.txt`, die Suchmaschinen fernhalten.

Die Übersicht ist zugleich ein installierbarer **Launcher** („Spiele“,
`manifest.webmanifest`, `sw.js`, `icons/`): Unter Android bietet ein langer
Druck aufs Icon Schnellstarts in jedes Spiel. Die Spiele bleiben eigenständige
Apps mit eigenem Service Worker und lassen sich auch einzeln installieren.

## Lokal ausprobieren

```bash
python3 -m http.server 8000
```

und `http://localhost:8000/` öffnen.

## Deployment

Jeder Push auf `main` spiegelt das Repository per SFTP auf den Webspace, siehe
[DEPLOYMENT.md](DEPLOYMENT.md).

## Warteliste

Spiele, die noch gebaut werden sollen – nur mit den vorhandenen Würfeln
(2 weiß, je 1 rot, gelb, grün, blau):

- **Knister** – Ersatzblock (5×5-Raster, Würfelsummen ankreuzen); braucht nur
  die 2 weißen Würfel.
- **Ganz schön clever** – Ersatzblock; das Original hat 6 Würfel (weiß, gelb,
  blau, grün, orange, lila), Orange und Lila müssen über eine Zuordnung
  ersetzt werden.
