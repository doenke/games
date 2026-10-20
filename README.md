# Spiele

Kleine, handyoptimierte Spiele-Apps als offlinefähige PWAs – statisches
HTML/CSS/JS ohne Build und Backend. Jedes Spiel liegt in einem eigenen Ordner.

| Ordner | Spiel |
| --- | --- |
| [`neandertaler/`](neandertaler/) | Zusatzkarten, Timer und Punkte für „Poesie für Neandertaler“ |

Im Wurzelverzeichnis liegen die Übersicht (`index.html`), die gemeinsame Seite
„Kontakt & Datenschutz“ (`kontakt.html`, `site.css`) und eine `.htaccess`, die
Suchmaschinen fernhält.

## Lokal ausprobieren

```bash
python3 -m http.server 8000
```

und `http://localhost:8000/` öffnen.

## Deployment

Jeder Push auf `main` spiegelt das Repository per SFTP auf den Webspace, siehe
[DEPLOYMENT.md](DEPLOYMENT.md).
