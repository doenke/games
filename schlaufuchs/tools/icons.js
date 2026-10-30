// Erzeugt die App-Icons von Schlaufuchs (sechs Würfelfarben) per Playwright.
// Aufruf aus dem Ordner schlaufuchs/:  node tools/icons.js
const { chromium } = require('playwright');

const FARBEN = ['#f2c230', '#3a7bd5', '#3aa655', '#e0453a', '#8e5bd0', '#f4f4f0'];

function svg(size, pad) {
  const inner = size - 2 * pad, gap = inner * 0.07, cell = (inner - 2 * gap) / 3;
  const rows = 2, top = pad + (inner - (rows * cell + gap)) / 2;
  let s = `<svg xmlns="http://www.w3.org/2000/svg" width="${size}" height="${size}"><rect width="100%" height="100%" fill="#221d2b"/>`;
  FARBEN.forEach((f, i) => {
    const x = pad + (i % 3) * (cell + gap), y = top + Math.floor(i / 3) * (cell + gap);
    s += `<rect x="${x}" y="${y}" width="${cell}" height="${cell}" rx="${cell * 0.18}" fill="${f}"/>`;
    if (i === 2) {  // Kreuz auf Grün
      const m = cell * 0.25;
      s += `<path d="M${x + m} ${y + m}L${x + cell - m} ${y + cell - m}M${x + cell - m} ${y + m}L${x + m} ${y + cell - m}" stroke="#221d2b" stroke-width="${cell * 0.12}" stroke-linecap="round"/>`;
    }
    if (i === 4) s += `<text x="${x + cell / 2}" y="${y + cell / 2}" dy=".36em" text-anchor="middle" font-family="DejaVu Sans, sans-serif" font-weight="bold" font-size="${cell * 0.55}" fill="#fff">6</text>`;
  });
  return s + '</svg>';
}

(async () => {
  const b = await chromium.launch();
  const p = await b.newPage();
  for (const [file, size, pad] of [['icon-192', 192, 22], ['icon-512', 512, 58], ['icon-maskable-512', 512, 110], ['apple-touch-icon', 180, 20]]) {
    await p.setViewportSize({ width: size, height: size });
    await p.setContent(`<body style="margin:0">${svg(size, pad)}</body>`);
    await p.screenshot({ path: `icons/${file}.png` });
  }
  await b.close();
})();
