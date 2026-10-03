# Third-party notices

List every open-source project whose code or watermark masks are used, with its license text.

| Project | What we used | License | Link |
|---|---|---|---|
| Expo default template (`expo-template-default@sdk-57`) | Starter app files in `apps/app` | MIT, (c) 650 Industries, Inc. — see `apps/app/LICENSE` | https://github.com/expo/expo/tree/main/templates/expo-template-default |
| gemini-watermark-remover (GargantuaX), masks originally by AllenK (Kwyshell) / GeminiWatermarkTool | Calibrated alpha mask PNGs `bg_48.png`, `bg_96.png`, `bg_96_20260520.png` (copied to `apps/app/src/core/masks/source/`, converted to JSON; the derived `alpha-36`, `alpha-veo-48` and `alpha-veo-72` masks are scaled from them); logo sizes and margins, video logo geometry | MIT — Copyright (c) 2025 Jad; Copyright (c) 2024 AllenK (Kwyshell). Full text: `apps/app/src/core/masks/source/LICENSE-gemini-watermark-remover` | https://github.com/GargantuaX/gemini-watermark-remover (commit 9b93e0a for `bg_96_20260520.png`), https://github.com/allenk/GeminiWatermarkTool |
| Unbounded font (via @expo-google-fonts/unbounded) | Font files bundled in the app | SIL Open Font License 1.1 — Copyright 2022 The Unbounded Project Authors | https://github.com/googlefonts/unbounded |
| Onest font (via @expo-google-fonts/onest) | Font files bundled in the app | SIL Open Font License 1.1 — Copyright 2021 The Onest Project Authors | https://github.com/googlefonts/onest |
