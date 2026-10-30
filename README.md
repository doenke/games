# Spiele

Kleine, handyoptimierte Spiele-Apps als offlinefähige PWAs – statisches
HTML/CSS/JS ohne Build und Backend. Jedes Spiel liegt in einem eigenen Ordner.

Online: <https://games.kanonenwiese.de/>

| Ordner | Spiel |
| --- | --- |
| [`neandertaler/`](neandertaler/) | Zusatzkarten, Timer und Punkte für „Poesie für Neandertaler“ |
| [`kreuzblock/`](kreuzblock/) | Ersatz-Wertungsblock für „Qwixx“ |
| [`farbkreuz/`](farbkreuz/) | Ersatzblock mit eigenem Spielfeld für „Noch mal!“ (Originalwürfel) |
| [`summenraster/`](summenraster/) | Ersatzblock für „Knister“, mit den 2 weißen Würfeln |
| [`schlaufuchs/`](schlaufuchs/) | Eigenes Wertungsblatt nach „Ganz schön clever“ (Würfel in Originalfarben) |
| [`ohne-x/`](ohne-x/) | Erklären ohne verbotenen Buchstaben – Karten, Timer und Punkte für „Nix da!“ |

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

Spiele, die noch gebaut werden sollen.

- **Musik-Zeitstrahl** (eigenes Spiel in der Art von Hitster, kein Nachbau) –
  zurückgestellt. Stand der Überlegungen:
  - Song läuft verdeckt, man legt ihn in seine Zeitleiste, dann wird das Jahr
    aufgedeckt. Eigene Regeln (z. B. 10 Karten zum Sieg, Bonus für Interpret
    und Titel, Joker). Zeitleiste auf dem Handy oder mit Zetteln.
  - Abspielen über die Spotify Web API (Fernsteuerung der Spotify-App, „Start
    Playback“), damit Titel und Interpret verborgen bleiben. Spotify-Links
    öffnen würde den Titel sofort anzeigen.
  - Voraussetzungen: Spotify Premium; eigene, kostenlose App auf
    developer.spotify.com mit Weiterleitung auf games.kanonenwiese.de;
    Anmeldung per OAuth mit PKCE direkt im Browser, ohne Server; im
    Entwicklermodus nur freigeschaltete Konten (bis zu 25); Spotify muss auf
    dem Handy einmal geöffnet sein.
  - Vorher klären: Spotifys Entwicklerregeln zu Spielen/Quiz prüfen.
  - Songliste mit Erscheinungsjahr selbst pflegen (Spotify nennt bei Remastern
    oft das falsche Jahr); die App sucht die Titel zur Laufzeit über die API.
  - Offen: Premium und Entwickler-App vorhanden? Welche Musik (Charts 60er bis
    heute, deutsche Hits, gemischt)? Datenschutztext muss Spotify erwähnen.
