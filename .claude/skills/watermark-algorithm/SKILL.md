---
name: watermark-algorithm
description: Use for any work on watermark detection or removal — src/core in the app, the video pipeline in server/, alpha masks, calibration, or test fixtures.
---
# Watermark algorithm — working notes

Full explanation: `docs/04-algorithm.md`. This file is the checklist.

## The math
Gemini blends a white logo over the picture:
`watermarked = a * 255 + (1 - a) * original`, per channel, per pixel, where `a` is the
alpha mask value (0..1). Invert it:
`original = (watermarked - a * 255) / (1 - a)`

- Clamp `a` to at most 0.99 before dividing, and clamp output to 0..255.
- Only touch pixels inside the mask box. Leave every other pixel byte-identical.
- Work on RGBA Uint8 buffers. Ignore the alpha channel of the image itself.

## Detection (never guess from resolution alone)
Gemini has shipped several logo sizes (36, 48 and 96 px) and moved margins between versions.
1. For each known template (size + margin), take the candidate box near the bottom-right.
2. Search a small window (±8 px) around it.
3. Score with normalized cross-correlation (NCC) between the mask and the brightness
   excess of the region. Pick the best score.
4. If the best score is below the threshold (0.35), report "no watermark found".
5. Refine the position ±2 px (least edge energy after removal; `core/refine.ts`).
6. Verify (`core/verify.ts`, D-015): the outline edge ratio must be ≥ 2.0 before removal and
   ≤ 1.5 after, and the box must get smoother. Otherwise return the image UNCHANGED with
   `detected: false`. Photo texture can pass the NCC threshold; these checks decide.
7. Keep provenance: copy C2PA blocks (PNG `caBX`, JPEG APP11) from the original into the
   re-encoded file (`features/image/provenance.ts`, D-014).

## Masks
- Stored as grayscale PNG or Float32 arrays in `src/core/masks/` plus a `masks.json` listing
  size, margin and version. Design masks so they can later be loaded from a remote JSON
  (Google changes the logo; we want updates without an app store release).
- If porting masks from an open-source project, confirm its license first and credit it in
  `THIRD_PARTY_NOTICES.md`.

## Calibration (when Google changes the logo)
Generate a pure black image in Gemini at each output size. For black backgrounds,
`a = pixel / 255`. Average several captures to cancel JPEG noise. Save as a new mask
version and add fixtures.

## Video (server)
- Detect on the average of the first ~30 frames, then apply the same box to every frame.
- Pipe: `ffmpeg -i in -f rawvideo -pix_fmt rgb24 -` → NumPy → `ffmpeg -f rawvideo ... -c:v
  libx264 -crf 18 -preset veryfast -c:a copy out.mp4`. Keep the original fps and size.

## Tests that must exist
- Round trip: blend a known mask onto a random image, remove it, max error ≤ 2/255.
- Real fixtures: each Gemini fixture is detected and its outline edge ratio after cleaning is
  < 1.3 ("mean excess < 3" assumes a flat background and fails on textured photos, D-013).
- Logo-free crops of the real fixtures stay unchanged; cleaned PNGs keep `caBX`.
- Non-Gemini fixtures: image returned unchanged with `detected: false`.
