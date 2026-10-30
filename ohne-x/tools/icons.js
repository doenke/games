// Erzeugt die App-Icons von Ohne X (Buchstabe im Verbotsschild) per Playwright.
// Aufruf aus dem Ordner ohne-x/:  node tools/icons.js
const { chromium } = require('playwright');

function svg(size, pad) {
  const inner = size - 2 * pad, x = pad, r = inner * 0.2, c = size / 2;
  return `<svg xmlns="http://www.w3.org/2000/svg" width="${size}" height="${size}"><rect width="100%" height="100%" fill="#1e1b33"/>` +
    `<rect x="${x}" y="${x}" width="${inner}" height="${inner}" rx="${r}" fill="#ff4f9a"/>` +
    `<text x="${c}" y="${c}" dy=".36em" text-anchor="middle" font-family="DejaVu Sans, sans-serif" font-weight="bold" font-size="${inner * 0.62}" fill="#fff">X</text>` +
    `<circle cx="${c}" cy="${c}" r="${inner * 0.38}" fill="none" stroke="#1e1b33" stroke-opacity=".55" stroke-width="${inner * 0.07}"/>` +
    `<line x1="${c - inner * 0.27}" y1="${c - inner * 0.27}" x2="${c + inner * 0.27}" y2="${c + inner * 0.27}" stroke="#1e1b33" stroke-opacity=".55" stroke-width="${inner * 0.07}"/>` +
    '</svg>';
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
