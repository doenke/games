#!/usr/bin/env python3
"""Erzeugt das feste Spielfeld für Farbkreuz (eigener Entwurf, nicht das Originalblatt).

Regeln für das Raster:
- 15 Spalten (A–O) × 7 Zeilen, 5 Farben mit je genau 21 Feldern.
- Felder bilden zusammenhängende Farbflächen aus 1 bis 6 Feldern; benachbarte
  Flächen haben verschiedene Farben.
- Je Spalte genau ein Stern.
Fester Zufallsstartwert, damit das Ergebnis reproduzierbar ist.

Aufruf:  python3 tools/raster.py [Anzahl]  → gibt die ersten gültigen Felder aus,
die in js/app.js unter BOARDS stehen (Feld 1 = Startwert 5, wie bisher).
"""
import random
import sys

W, H, COLORS, PER = 15, 7, "gybro", 21  # grün, gelb, blau, rot, orange


def neighbors(x, y):
    for dx, dy in ((1, 0), (-1, 0), (0, 1), (0, -1)):
        nx, ny = x + dx, y + dy
        if 0 <= nx < W and 0 <= ny < H:
            yield nx, ny


def regions(rng, weights):
    """Teilt das Raster in zusammenhängende Flächen der Größe 1–6."""
    owner = [[-1] * W for _ in range(H)]
    cells = [(x, y) for y in range(H) for x in range(W)]
    rng.shuffle(cells)
    regs = []
    for x, y in cells:
        if owner[y][x] != -1:
            continue
        size = rng.choices([1, 2, 3, 4, 5, 6], weights=weights)[0]
        rid = len(regs)
        reg = [(x, y)]
        owner[y][x] = rid
        while len(reg) < size:
            frontier = [n for c in reg for n in neighbors(*c) if owner[n[1]][n[0]] == -1]
            if not frontier:
                break
            nx, ny = rng.choice(frontier)
            owner[ny][nx] = rid
            reg.append((nx, ny))
        regs.append(reg)
    return regs, owner


def color(regs, owner, rng):
    """Färbt Flächen: Nachbarn verschieden, jede Farbe genau 21 Felder (Backtracking)."""
    adj = [set() for _ in regs]
    for rid, reg in enumerate(regs):
        for c in reg:
            for nx, ny in neighbors(*c):
                o = owner[ny][nx]
                if o != rid:
                    adj[rid].add(o)
    order = sorted(range(len(regs)), key=lambda r: -len(regs[r]))
    col = [None] * len(regs)
    left = {c: PER for c in COLORS}
    steps = [0]

    def go(i):
        steps[0] += 1
        if steps[0] > 200000:
            return False
        if i == len(order):
            return True
        r = order[i]
        opts = list(COLORS)
        rng.shuffle(opts)
        opts.sort(key=lambda c: -left[c])
        for c in opts:
            if left[c] < len(regs[r]) or any(col[n] == c for n in adj[r]):
                continue
            col[r] = c
            left[c] -= len(regs[r])
            if go(i + 1):
                return True
            left[c] += len(regs[r])
            col[r] = None
        return False

    return col if go(0) else None


# Flächengrößen 1–6: Feld 1 und 2 gemischt, Feld 3 eher kleine, Feld 4 eher große Flächen
VARIANTS = [
    ("gemischt", [1, 3, 5, 5, 3, 2]),
    ("gemischt", [1, 3, 5, 5, 3, 2]),
    ("kleine Flächen", [4, 6, 5, 2, 1, 1]),
    ("große Flächen", [1, 1, 2, 4, 6, 6]),
]


def board(seed, weights):
    rng = random.Random(seed)
    regs, owner = regions(rng, weights)
    col = color(regs, owner, rng)
    if not col:
        return None
    grid = [[col[owner[y][x]] for x in range(W)] for y in range(H)]
    # Startspalte H (Index 7) soll alle Farben enthalten
    if len(set(grid[y][7] for y in range(H))) < 5:
        return None
    # je Spalte ein Stern, nicht zweimal in derselben Fläche
    stars, used = [], set()
    for x in range(W):
        ys = [y for y in range(H) if owner[y][x] not in used]
        y = rng.choice(ys)
        used.add(owner[y][x])
        stars.append(y)
    return ["".join(c.upper() if stars[x] == y else c for x, c in enumerate(grid[y])) for y in range(H)]


def main():
    count = int(sys.argv[1]) if len(sys.argv) > 1 else 1
    seed = 0
    for n, (name, weights) in enumerate(VARIANTS[:count], 1):
        while True:
            seed += 1
            if seed > 20000:
                sys.exit("kein Raster gefunden")
            rows = board(seed, weights)
            if rows:
                break
        print(f"    // Feld {n}: {name}, Startwert {seed}")
        print("    [" + ", ".join(f"'{r}'" for r in rows) + "],")


if __name__ == "__main__":
    main()
