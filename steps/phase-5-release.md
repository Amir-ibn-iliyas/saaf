# Phase 5 — Polish and test build

## 5.1 Errors, empty states, About page
- Every error code mapped to DESIGN.md copy. About page per mockup, including the SynthID
  note and credits from THIRD_PARTY_NOTICES.md.
**Done when:** each error can be triggered in a manual test and shows the right message.

## 5.2 Remote masks
- App fetches `/v1/masks` from the (local) server on start (with timeout), caches it, falls back to bundled masks.
**Done when:** changing masks.json on the server changes app behavior without a rebuild.

## 5.3 Android test APK (free)
- EAS build (free tier) or local build → APK. App icon and splash from design tokens
  (neem on paper, both themes).
- Share the APK with testers directly. Play Store ($25) only when the owner decides to launch.
- App title and icon must not use Google brand names.
- Until Phase 6, video only works when the phone is on the same Wi-Fi as the PC running
  the server (build with `EXPO_PUBLIC_API_URL=http://<PC local IP>:8000`).
**Done when:** the APK installs on a real phone and cleans an image; video works on the same
Wi-Fi.

## 5.4 (optional) Web video in the browser
- On web only, process videos locally with WebCodecs plus an MP4 muxer library, reusing the
  TS core per frame. Fall back to the server if the browser lacks WebCodecs.
**Done when:** a Veo fixture cleans in Chrome without any server request; Safari falls back
to the server correctly.
