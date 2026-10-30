// Erzeugt die App-Icons von Summenraster (Raster mit Würfelsummen) per Playwright.
// Aufruf aus dem Ordner summenraster/:  node tools/icons.js
const { chromium } = require('playwright');

const ZAHLEN = [[7, 4, 7], [9, 7, 2], [7, 11, 6]];

function svg(size, pad) {
  const inner = size - 2 * pad, gap = inner * 0.06, cell = (inner - 2 * gap) / 3;
  let s = `<svg xmlns="http://www.w3.org/2000/svg" width="${size}" height="${size}"><rect width="100%" height="100%" fill="#1d2730"/>`;
  for (let r = 0; r < 3; r++) for (let c = 0; c < 3; c++) {
    const x = pad + c * (cell + gap), y = pad + r * (cell + gap);
    s += `<rect x="${x}" y="${y}" width="${cell}" height="${cell}" rx="${cell * 0.16}" fill="${r === c ? '#3cc8b4' : '#f6f3ea'}"/>` +
      `<text x="${x + cell / 2}" y="${y + cell / 2}" dy=".36em" text-anchor="middle" font-family="DejaVu Sans, sans-serif" font-weight="bold" font-size="${cell * 0.55}" fill="#1d2730">${ZAHLEN[r][c]}</text>`;
  }
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
