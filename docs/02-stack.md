# 02 — Stack decision

## Chosen stack
Development is fully local until Phase 6; hosting rows below apply only then.

| Part | Choice | Why |
|---|---|---|
| App framework | Expo (latest stable SDK), Expo Router, TypeScript | One codebase for web + Android + iOS. Web works through react-native-web. EAS builds the store apps. |
| Image decode/encode | `@shopify/react-native-skia` | Gives raw RGBA pixels on Android, iOS AND web (CanvasKit), so the same code path runs everywhere. |
| Removal math | Pure TypeScript in `src/core/` | Testable in Node with Jest, shared by every platform, easy to port from existing MIT code. |
| Video processing | Python 3.12 + FastAPI + NumPy + FFmpeg | On-device FFmpeg for React Native is no longer a safe choice (ffmpeg-kit was retired and its binaries removed). Python + NumPy makes per-frame math one line. |
| Web hosting | Cloudflare Pages, free `*.pages.dev` address | Free, fast, no bandwidth bill for static files. Own domain optional. |
| Server hosting | Oracle Cloud Always Free ARM VM + Docker Compose + Caddy (HTTPS) + DuckDNS free subdomain | ₹0. Since June 2026 the free ARM allowance is 2 OCPU / 12 GB RAM total, which is plenty for short clips. Card needed for signup verification. |
| Backup server for testing | Your own PC + Docker, exposed with a free Cloudflare Tunnel | If Oracle shows "out of capacity" or signup fails, keep building; move to Oracle later. |
| Styling | React Native `StyleSheet` + tokens in `src/ui/theme.ts` | Fewer moving parts than a CSS-in-JS/Tailwind layer. NativeWind can be added later. |
| Tests | Jest (app core), pytest (server) | Standard, fast. |

## Why images run on the device (not the server)
- Free: no server CPU or bandwidth per image.
- Fast: no upload wait.
- Privacy: "your photos never leave your phone" is a real selling point.
- The server keeps an `/image` endpoint only as a fallback if Skia on some platform fails.

## Alternatives considered
| Option | Verdict |
|---|---|
| Flutter | Good, but you chose React Native; no reason to switch. |
| Everything on server (images too) | Simpler app, but costs money per image, slower, weaker privacy story. Keep as fallback only. |
| Video on device (native modules) | Possible later on iOS with AVFoundation-based modules, but Android + web parity is hard. Not for v1. |
| Video in browser (WebCodecs) | Works on web; open-source tools already do it. Planned as an optional task (5.5) to take web video load off the free server. |
| Node.js server instead of Python | Fine, but per-frame pixel math is much easier and faster with NumPy. |
| Hugging Face Spaces | Docker/Gradio Spaces now need a paid PRO plan; only static Spaces are free. Not free for our server. |
| Render free tier | Sleeps when idle and has a small bandwidth allowance; too tight for video. |
| Railway / Hetzner | Good paid options (~₹500–1,000/month) once users grow. Hetzner is the planned upgrade path. |
| Queue + object storage (Redis, R2) | Not needed while clips are short (Veo clips are ~8 s). Add when traffic grows. |

## Versions
Always use the latest stable Expo SDK at project start (check https://expo.dev/changelog).
New projects use the `src/app` folder layout from SDK 55 onward. Record the exact SDK and
library versions in `progress/DECISIONS.md` on day one.

## Spike to run first (Phase 0)
Prove `@shopify/react-native-skia` can: decode a JPEG/PNG → read RGBA pixels → write pixels
→ encode PNG/JPEG, on web AND Android, for a 2528 × 1696 image in under 1.5 s.
If it fails on one platform, fall back to the server `/image` endpoint for that platform and
log the decision.
