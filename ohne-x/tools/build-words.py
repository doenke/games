#!/usr/bin/env python3
"""Baut die Begriffsliste für „Ohne X“ aus den Neandertaler-Karten.

Beide Spalten (1-Punkt-Wort und 3-Punkt-Begriff) werden zu Begriffen,
Dubletten fliegen raus. Ergebnis: js/words.js

Aufruf aus dem Ordner ohne-x/:  python3 tools/build-words.py
"""
from pathlib import Path

SRC = Path(__file__).resolve().parents[2] / "neandertaler" / "tools" / "cards.txt"
OUT = Path(__file__).resolve().parents[1] / "js" / "words.js"

words, seen = [], set()
for line in SRC.read_text(encoding="utf-8").splitlines():
    line = line.strip()
    if not line or line.startswith("#") or "|" not in line:
        continue
    for w in (p.strip() for p in line.split("|")):
        key = w.casefold()
        if w and len(w) <= 22 and key not in seen:
            seen.add(key)
            words.append(w)

body = ",\n".join("  " + ", ".join(repr(w).replace("'", '"') for w in words[i:i + 8])
                  for i in range(0, len(words), 8))
OUT.write_text("/* Erzeugt mit tools/build-words.py – nicht von Hand bearbeiten. */\n"
               "window.OHNE_X_WORDS = [\n" + body + "\n];\n", encoding="utf-8")
print(f"{len(words)} Begriffe → {OUT}")
