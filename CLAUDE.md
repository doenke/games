# Spiele – Hinweise für Claude

Sammlung kleiner, handyoptimierter Spiele-Apps (PWA, statisches HTML/CSS/JS,
kein Build, kein Backend), online unter https://games.kanonenwiese.de/. Jedes Spiel liegt in einem eigenen Unterordner und
hat dort ein eigenes `README.md` und ggf. `CLAUDE.md` mit seinen Regeln.

## Arbeitsweise

- Sprache in Code-Kommentaren, Texten und Commits: Deutsch.
- Es gibt nur den Branch `main`. Jeder Push auf `main` spiegelt das ganze
  Repository per SFTP auf den Webspace (`.github/workflows/deploy.yml`,
  Details in `DEPLOYMENT.md`) – mit Löschen. Vor dem Push prüfen, dass alles läuft.

## Aufbau

- `index.html` – Übersicht aller Spiele; neues Spiel dort eintragen.
- `kontakt.html` – Kontakt & Datenschutz für alle Spiele; jedes Spiel verlinkt
  dezent auf `../kontakt.html`. Speichert ein neues Spiel etwas Neues oder
  bindet es etwas Externes ein, den Datenschutztext anpassen.
- `site.css` – Gestaltung von Übersicht und Kontaktseite.
- `.htaccess`, `robots.txt` – halten Suchmaschinen von allen Seiten fern.

## Neues Spiel

- Eigener Ordner mit `index.html`, `manifest.webmanifest` (`start_url` und
  `scope` `./`), eigenem `sw.js` und Icons. Nichts von fremden Servern laden.
- Service Worker: Cache-Name mit dem Spielnamen als Präfix und dem Platzhalter
  `__BUILD__` als Version (`const VERSION = '__BUILD__'`); der Deploy stempelt
  ihn. Alte Caches nur mit dem eigenen Präfix löschen.
- `localStorage`-Schlüssel immer mit Präfix `spielname:` – alle Spiele teilen
  sich eine Domain und damit einen Speicher.
- Dateien, die nicht auf den Webspace gehören (Quellen, Skripte), in `tools/`
  des Spiels; `README.md`, `CLAUDE.md` und `tools/` werden nicht hochgeladen.
- Unten auf dem Startbildschirm: Hinweis „inoffizielles Fan-Tool“, falls es
  ein bestehendes Spiel ergänzt, und der Link „Kontakt & Datenschutz“.
