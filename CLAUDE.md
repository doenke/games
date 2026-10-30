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
  Kniffligere Spiele bekommen `class="more"` an der Karte und `more: true` in
  `GAMES` – sie erscheinen erst mit dem Schalter „Mehr Spiele“ (Standard aus,
  gemerkt unter `uebersicht:mehr`), auch in Packliste und Materialliste.
- Spielmaterial: Liste `GAMES`/`ITEMS` im Skript von `index.html` – jedes neue
  Spiel mit seinem Material eintragen (Pflicht und optional, was die App
  ersetzt, Handys). Daraus entstehen Packliste und Übersicht pro Spiel.
  Ziel: In den Urlaub sollen möglichst nur Würfel mit. Würfel in den
  Originalfarben des Spiels verwenden – lieber mehr Würfel einpacken als
  Farben umdeuten (Wunsch des Nutzers).
- **Eine PWA für alles** (Wunsch des Nutzers: keine Einzel-Apps, keine
  Update-Meldungen). `manifest.webmanifest` und `sw.js` liegen nur im
  Wurzelverzeichnis; Spiele verlinken `../manifest.webmanifest` und
  registrieren `../sw.js` mit `scope: '../'`. Jedes Spiel zusätzlich als
  Eintrag unter `shortcuts` im Manifest anlegen.
- `sw.js`: Cache `spiele-<Version>`, Version `__BUILD__` stempelt der Deploy,
  die Vorlade-Liste `/*__FILES__*/` füllt der Deploy mit allen hochgeladenen
  Dateien. Neue Dateien also nirgends von Hand eintragen. Updates laufen still –
  keine „Neue Version“-Meldung einbauen.
- `<spiel>/sw.js` sind Abschalt-Stubs für früher installierte Einzel-Apps
  (räumen auf und melden sich ab). Nicht registrieren, nicht löschen; neue
  Spiele bekommen keinen.
- `kontakt.html` – Kontakt & Datenschutz für alle Spiele; jedes Spiel verlinkt
  dezent auf `../kontakt.html`. Speichert ein neues Spiel etwas Neues oder
  bindet es etwas Externes ein, den Datenschutztext anpassen.
- `site.css`, `favicon.svg` – eigenes Design von Übersicht und Kontaktseite
  (Spieltisch: grüner Filz, Spiele als weiße Karten, Gold als Akzent),
  unabhängig vom Look der einzelnen Spiele.
- `.htaccess`, `robots.txt` – halten Suchmaschinen von allen Seiten fern.

## Neues Spiel

- Eigener Ordner mit `index.html` und Icons (`icons/icon-192.png` für Übersicht
  und Shortcut), Manifest-Link `../manifest.webmanifest`, Service Worker per
  `navigator.serviceWorker.register('../sw.js', { scope: '../' })`. Kein eigenes
  Manifest, kein eigener Service Worker. Nichts von fremden Servern laden.
- Der gemeinsame Service Worker holt **alles Netz zuerst** (Cache nur offline
  oder nach 4 s Timeout). Kein „Cache zuerst“ für JS/CSS: sonst laufen nach
  einem Deploy neues HTML und altes Skript zusammen und die Seite bricht.
- `localStorage`-Schlüssel immer mit Präfix `spielname:` – alle Spiele teilen
  sich eine Domain und damit einen Speicher.
- Dateien, die nicht auf den Webspace gehören (Quellen, Skripte), in `tools/`
  des Spiels; `README.md`, `CLAUDE.md` und `tools/` werden nicht hochgeladen.
- Unten auf dem Startbildschirm: Hinweis „inoffizielles Fan-Tool“, falls es
  ein bestehendes Spiel ergänzt, und der Link „Kontakt & Datenschutz“.
