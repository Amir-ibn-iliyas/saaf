# Phase 1 — Core algorithm (pure TypeScript)

Use the `watermark-algorithm` skill. Everything lives in `apps/app/src/core/`. No React
Native, Expo or DOM imports. Types: `type RGBA = { width: number; height: number; data: Uint8ClampedArray }`.

## 1.1 Masks and masks.json
- Obtain alpha masks for each known logo template (36, 48, 96 px) — port from an MIT project
  after checking its license, or calibrate from black fixtures.
- `masks.json`: `{ version, threshold, templates: [{ id, size, marginRight, marginBottom, file }] }`.
- Credit the source in `THIRD_PARTY_NOTICES.md`.
**Done when:** masks load in a Node test and values are in 0..1.

## 1.2 remove(img, template, x, y)
- Reverse alpha blend inside the box only; clamp alpha ≤ 0.99; clamp output.
**Done when:** round-trip test (blend random image with mask, then remove) has max error
≤ 2/255; pixels outside the box are byte-identical.

## 1.3 detect(img) → { detected, templateId, x, y, score }
- NCC search per template in a ±8 px window around the expected position.
**Done when:** synthetic tests find the right template and position; a plain image returns
`detected: false`.

## 1.4 Tests on real fixtures
- Node test that decodes fixtures (use `sharp` or `pngjs` as a dev dependency only),
  runs detect + remove, and checks the cleaned box.
**Done when:** all Gemini fixtures detected and cleaned (outline edge ratio after < 1.3, see
D-013/D-015); all non-Gemini fixtures and logo-free crops unchanged; cleaned PNGs keep their
C2PA `caBX` chunk. Tune limits in masks.json if needed and log it.
