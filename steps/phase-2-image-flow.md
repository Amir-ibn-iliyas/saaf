# Phase 2 — Image flow in the app

Follow `design/DESIGN.md` and `design/mockup.html` for layout, tokens and copy.

## 2.1 Theme and base components
- `src/ui/theme.ts` from `design/tokens.json` (Neem green) with light and dark themes.
- Theme preference System / Light / Dark: default System (`useColorScheme`), override saved
  on device (AsyncStorage) and applied instantly without restart.
- Load fonts Unbounded and Onest with expo-font.
- Components: Button (primary/ghost), Chip, Toast, Screen (max width 480 on web).
**Done when:** a sample screen shows all components in light and dark; switching the
preference changes the theme instantly and survives an app restart.

## 2.2 Home screen and file picking
- `expo-image-picker` for photos and videos (multiple photos, max 20). Web: add drag and drop
  on the pick area.
- Route: images → image flow; one video → video flow; mixed → clean the images and tell the
  user to pick the video separately.
**Done when:** picking works on web and Android and routes correctly.

## 2.3 Image cleaning with Skia
- `features/image/skiaIO.ts`: decode → RGBA → `core.detect` → `core.remove` → encode (keep
  PNG as PNG; JPEG/WebP → JPEG quality 95).
- Show "Cleaning…" state; handle `no_watermark` with the copy from DESIGN.md.
**Done when:** fixtures cleaned on web and Android; non-Gemini shows the right message.

## 2.4 Result screen with compare slider
- `CompareSlider`: after on the left, before on the right, draggable handle, keyboard arrows
  on web, accessibility label.
**Done when:** matches the mockup; drag is smooth on Android.

## 2.5 Save, download and share
- Android/iOS: `expo-media-library` save + `expo-sharing`. Web: download link with the
  original filename + `-clean`.
- Handle permission denial with the copy from DESIGN.md.
**Done when:** saved file opens in the gallery / downloads on web with correct name.

## 2.6 Batch images
- Process sequentially with a progress count; thumbnail strip on the result screen; "Save all".
**Done when:** 10 images process without freezing the UI and all save.
