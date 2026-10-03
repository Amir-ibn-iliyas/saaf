#!/usr/bin/env node
/**
 * Builds the app icon, Android adaptive icon layers, splash mark and favicon from the design
 * tokens (design/tokens.json): a lowercase "s" in Unbounded on Neem green. No brand marks of
 * other companies. Re-run after a name or colour change:  node scripts/build-icons.cjs
 */
const fs = require('fs');
const path = require('path');
const CanvasKitInit = require('canvaskit-wasm/bin/full/canvaskit.js');

const ROOT = path.join(__dirname, '..');
const OUT = path.join(ROOT, 'assets/images');
const tokens = require(path.join(ROOT, '../../design/tokens.json'));
const FONT = path.join(ROOT, 'node_modules/@expo-google-fonts/unbounded/600SemiBold/Unbounded_600SemiBold.ttf');
const LETTER = 's';

const hex = (CK, value) => CK.parseColorString(value);

CanvasKitInit().then((CK) => {
  const typeface = CK.Typeface.MakeTypefaceFromData(fs.readFileSync(FONT).buffer);
  if (!typeface) throw new Error('could not load the Unbounded font');

  /**
   * size: canvas px; bg: colour or null (transparent); fg: glyph colour;
   * glyph: glyph height as a share of the canvas; corner: rounded-rect radius share (0 = square).
   */
  function render(file, { size, bg, fg, glyph, corner = 0 }) {
    const surface = CK.MakeSurface(size, size);
    const canvas = surface.getCanvas();
    canvas.clear(CK.TRANSPARENT);
    const paint = new CK.Paint();
    paint.setAntiAlias(true);
    if (bg) {
      paint.setColor(hex(CK, bg));
      const rect = CK.XYWHRect(0, 0, size, size);
      if (corner > 0) canvas.drawRRect(CK.RRectXY(rect, size * corner, size * corner), paint);
      else canvas.drawRect(rect, paint);
    }
    // Size the font so the letter's real ink height is `glyph` of the canvas, then centre it.
    const probe = new CK.Font(typeface, 1000);
    const ids = probe.getGlyphIDs(LETTER);
    const [l, t, r, b] = probe.getGlyphBounds(ids, paint);
    const scale = (size * glyph) / (b - t);
    const font = new CK.Font(typeface, 1000 * scale);
    const x = size / 2 - ((l + r) / 2) * scale;
    const y = size / 2 - ((t + b) / 2) * scale;
    paint.setColor(hex(CK, fg));
    canvas.drawText(LETTER, x, y, paint, font);
    const image = surface.makeImageSnapshot();
    fs.writeFileSync(path.join(OUT, file), image.encodeToBytes(CK.ImageFormat.PNG, 100));
    console.log(`${file} ${size}x${size}`);
    surface.delete();
  }

  const { neem, onNeem, paper } = tokens.color.light;
  const darkNeem = tokens.color.dark.neem;

  // App icon (store / iOS): square, the OS rounds it.
  render('icon.png', { size: 1024, bg: neem, fg: onNeem, glyph: 0.46 });
  // Android adaptive icon: background layer + foreground glyph inside the 66 % safe zone.
  render('android-icon-background.png', { size: 512, bg: neem, fg: neem, glyph: 0.01 });
  render('android-icon-foreground.png', { size: 512, bg: null, fg: onNeem, glyph: 0.3 });
  render('android-icon-monochrome.png', { size: 432, bg: null, fg: '#FFFFFF', glyph: 0.36 });
  // Splash mark on the paper background (light) — Neem letter; dark splash uses the same mark.
  render('splash-icon.png', { size: 288, bg: null, fg: neem, glyph: 0.62 });
  render('splash-icon-dark.png', { size: 288, bg: null, fg: darkNeem, glyph: 0.62 });
  // Web favicon.
  render('favicon.png', { size: 48, bg: neem, fg: onNeem, glyph: 0.5, corner: 0.22 });
  console.log(`paper ${paper}, neem ${neem}`);
});
