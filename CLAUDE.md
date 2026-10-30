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

- `index.html` – Übersicht aller Spiele; neues Spiel dort als Karte eintragen.
- Spielmaterial: Liste `GAMES`/`ITEMS` im Skript von `index.html` – jedes neue
  Spiel mit seinem Material eintragen (Pflicht und optional, was die App
  ersetzt, Handys). Daraus entstehen Packliste und Übersicht pro Spiel.
  Ziel: In den Urlaub sollen möglichst nur Würfel mit. Würfel in den
  Originalfarben des Spiels verwenden – lieber mehr Würfel einpacken als
  Farben umdeuten (Wunsch des Nutzers).
- Launcher: Die Übersicht ist selbst eine installierbare PWA
  (`manifest.webmanifest`, `sw.js`, `icons/`). Jedes neue Spiel zusätzlich als
  Eintrag unter `shortcuts` im Manifest anlegen. Der Service Worker der
  Übersicht ist für `/` registriert, bedient aber nur die eigenen Dateien
  (`SHELL_FILES`, `icons/`) – neue Dateien der Übersicht dort eintragen,
  Spiele-Dateien nie.
- `kontakt.html` – Kontakt & Datenschutz für alle Spiele; jedes Spiel verlinkt
  dezent auf `../kontakt.html`. Speichert ein neues Spiel etwas Neues oder
  bindet es etwas Externes ein, den Datenschutztext anpassen.
- `site.css`, `favicon.svg` – eigenes Design von Übersicht und Kontaktseite
  (Spieltisch: grüner Filz, Spiele als weiße Karten, Gold als Akzent),
  unabhängig vom Look der einzelnen Spiele.
- `.htaccess`, `robots.txt` – halten Suchmaschinen von allen Seiten fern.

## Neues Spiel

- Eigener Ordner mit `index.html`, `manifest.webmanifest` (`start_url` und
  `scope` `./`), eigenem `sw.js` und Icons. Nichts von fremden Servern laden.
- Service Worker: Cache-Name mit dem Spielnamen als Präfix und dem Platzhalter
  `__BUILD__` als Version (`const VERSION = '__BUILD__'`); der Deploy stempelt
  ihn. Alte Caches nur mit dem eigenen Präfix löschen.
- Service Worker holt **alles Netz zuerst** (Cache nur offline oder nach 4 s
  Timeout), wie in `neandertaler/sw.js`. Kein „Cache zuerst“ für JS/CSS: sonst
  laufen nach einem Deploy neues HTML und altes Skript zusammen und die Seite
  bricht.
- `localStorage`-Schlüssel immer mit Präfix `spielname:` – alle Spiele teilen
  sich eine Domain und damit einen Speicher.
- Dateien, die nicht auf den Webspace gehören (Quellen, Skripte), in `tools/`
  des Spiels; `README.md`, `CLAUDE.md` und `tools/` werden nicht hochgeladen.
- Unten auf dem Startbildschirm: Hinweis „inoffizielles Fan-Tool“, falls es
  ein bestehendes Spiel ergänzt, und der Link „Kontakt & Datenschutz“.
