# 04 — Algorithm

## How the watermark is made
Gemini blends a white logo over the finished picture with a fixed transparency map:
`watermarked = a × 255 + (1 − a) × original`. Because the logo and `a` never change for a given
version, we can solve for the original exactly:
`original = (watermarked − a × 255) / (1 − a)`.
This is the same method used by several MIT-licensed open-source projects, so it is proven.

## Known facts (verify with fixtures — Google changes these)
- Logo sizes seen so far: 36 px, 48 px and 96 px, depending on model version and output size.
- Common placement: 48 px logo with 32 px margin; 96 px logo with 64 px margin, bottom-right.
- Newer large images can carry the small 48 px logo, so choosing the size from resolution
  alone is wrong. Always run template detection.
- Veo videos carry their own visible mark; handle it with its own mask, per frame.

## Reference projects (read, port carefully, credit)
- github.com/GargantuaX/gemini-watermark-remover — JavaScript, client-side, images + video,
  MIT. Masks based on AllenK's work (MIT).
- github.com/froggeric/gemini-watermark-and-synthid-remover — C++ CLI with multi-template
  detection and Veo support, MIT. Use only its VISIBLE-mark logic.
- docs.rs/gemini-watermark-removal — Rust crate with a three-stage detector
  (spatial NCC, gradient NCC, variance). Good design reference.
Confirm each license file before copying anything, then add to `THIRD_PARTY_NOTICES.md`.

## Detection details
1. Convert the candidate region to "excess brightness": `e = max(pixel) − local background`
   (estimate background from a ring just outside the box).
2. NCC between `e` and the mask for each template and each offset in a ±8 px window.
3. Best score ≥ threshold → detected. Keep threshold in `masks.json` so it can be tuned remotely.
4. Refine the position ±2 px: keep the offset whose removal leaves the least edge energy
   (a 1 px miss draws thin lines on the logo outline).
5. Required verification (D-015): the logo outline must be visible before removal (outline
   edge ratio ≥ 2.0), gone after (≤ 1.5), and the box must get smoother. Otherwise return the
   original and `detected: false`. Real photo texture reached NCC 0.65 without a logo, so the
   score alone never decides.
6. Keep provenance metadata: copy the original's C2PA blocks into the output (D-014).

## Edge cleanup
JPEG compression leaves faint fringes on the logo edge. Optional: a 1-px median on pixels
where `0.02 < a < 0.3`. Off by default; turn on only if fixtures show fringes.

## Performance targets
Only the logo box is processed (≤ 96 × 96 px), so the math is instant. The cost is decode
and encode of the full image. Target < 1.5 s for a 2528 × 1696 image on a mid-range phone.
