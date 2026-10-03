# Design — Saaf (working name)

Open `mockup.html` in a browser to see the four main screens (use its theme switch to see
light and dark). Tokens live in `tokens.json`
and must be mirrored in `apps/app/src/ui/theme.ts`.

## Idea
Saaf means "clean". The whole app is one gesture: pick a file, watch it get wiped clean.
The one memorable element is the **compare slider** — a wiper handle the user drags across
the image to see before/after. Everything else stays quiet: one column, one primary button,
no clutter.

## Principles
1. **One tap to value.** Picking a file starts cleaning immediately. No settings screen first.
2. **Thumb zone.** The primary action sits at the bottom of the screen on phones.
3. **Honest copy.** Say what happens to files (photos stay on the phone, videos are deleted
   after processing) and that the invisible SynthID mark remains.
4. **Errors give the next step.** Never "Something went wrong" alone.
5. **Same app on web.** On wide screens, content is a centered 480 px column; drag-and-drop
   works on the pick area.

## Colour: Neem green (light + dark)
Green says "clean, fresh, done" and keeps the app clearly apart from Google's blue/purple
look. The app follows the phone's light/dark setting by default, and the About screen has a
**Theme: System / Light / Dark** switch (saved on the device).

| Token | Light | Dark | Use |
|---|---|---|---|
| ink | #15241B | #E6F0EA | main text |
| muted | #56665C | #93A79B | secondary text |
| paper | #F1F6F2 | #0F1713 | screen background |
| surface | #FFFFFF | #17221C | cards, sheets, ghost buttons |
| wash | #DCEBE1 | #1F2E26 | pick area, subtle fills |
| line | #CFDDD3 | #2A3A31 | borders |
| neem | #0F7A55 | #4CC38A | primary button, slider handle, links |
| onNeem | #FFFFFF | #062A1B | text on neem buttons |
| successBg / successInk | #DDF0E5 / #0B5A3E | #173A29 / #8FE3B8 | "Watermark removed" chip |
| amber / amberBg / amberInk | #E8A317 / #FBEFD2 / #7A5206 | #F0B84A / #3A2E12 / #F6D48C | in-progress bar and chip |
| brick / brickBg | #C8412B / #FBE3DE | #F07A63 / #3B1D17 | errors |

Rules: only one neem button per screen. Never put white text on amber. Check every new
colour pair for 4.5:1 contrast in both themes.

Type: **Unbounded** (wordmark and screen titles only, 600) and **Onest** (everything else,
400/500/600). Scale: 32 / 22 / 17 / 15 / 13. Add Noto Sans Devanagari as fallback when Hindi
is added. Radius: 20 for the pick area and image frame, 14 for buttons, 999 for chips.
Spacing: 4-pt grid (4, 8, 12, 16, 24, 32).

## Screens
1. **Home** — wordmark, big pick area ("Choose photos or a video"), privacy line under it,
   small About link. Web: also "or drop files here".
2. **Result (image)** — compare slider on the image, chip "Watermark removed", buttons
   "Save to gallery" (web: "Download") and "Share", text button "Clean another". For batch:
   horizontal strip of thumbnails with a tick on each, plus "Save all".
3. **Video** — video thumbnail, progress with two stages (Uploading 0–100 %, then Cleaning),
   cancel button. When done: player preview + "Save to gallery" / "Share".
4. **About** — theme switch (System / Light / Dark), what it does, what it doesn't (SynthID stays), privacy, credits for
   open-source work, version.

## Copy
| Key | Text |
|---|---|
| home.title | Clean your AI photos and videos |
| home.pick | Choose photos or a video |
| home.formats | JPG, PNG, WebP, MP4, MOV |
| home.drop | or drop files here (web only) |
| home.button | Choose files |
| home.privacy | Photos are cleaned on your device. Videos are processed on our server and deleted right after. |
| pick.mixed | Cleaning your photos now. Pick the video on its own afterwards. |
| pick.multipleVideos | One video at a time. Cleaning the first one. |
| pick.tooMany | Up to 20 photos at a time. Cleaning the first 20. |
| state.cleaning | Cleaning… |
| state.uploading | Uploading {n}% |
| state.cleaningVideo | Cleaning video… |
| result.chip | Watermark removed |
| result.save | Save to gallery |
| result.download | Download |
| result.saveAll | Save all (batch; web: Download all) |
| result.share | Share |
| result.again | Clean another |
| toast.saved | Saved to gallery |
| err.no_watermark | No Gemini watermark found in this file. It's unchanged. |
| err.too_large | This video is over 100 MB. Export a smaller version and try again. |
| err.too_long | Videos up to 60 seconds are supported. Trim it and try again. |
| err.too_big_resolution | Videos up to 1080p are supported. Export a smaller version and try again. |
| err.rate_limited | You've cleaned 10 videos this hour. Try again later. |
| err.unsupported | This file type isn't supported. Use JPG, PNG, WebP, MP4 or MOV. |
| err.network | Can't reach the server. Check your connection and try again. |
| err.permission | Allow photo access in Settings to save files to your gallery. |
| err.pick | Couldn't open your photos. Try again. |
| err.save_failed | Couldn't save the photo. Check your storage space and try again. |
| err.save_partial | Saved {n} of {total}. Check your storage space and try again. |
| err.share_failed | Couldn't open sharing. Save the photo and share it from your gallery. |
| err.provenance_unsupported | This WebP file has Content Credentials we can't keep yet. Save it as PNG or JPG and try again. |
| slider.label / after / before | Compare before and after · After · Before |
| err.clean_failed | Couldn't clean this photo. Try again or pick another one. |
| video.keepOpen | Keep the app open. Your video is deleted from the server right after it's sent back, or within 15 minutes at most. |
| video.seconds | {n} seconds |
| err.save_video_failed | Couldn't save the video. Check your storage space and try again. |
| err.share_video_failed | Couldn't open sharing. Save the video and share it from your gallery. |
| video.uploading / cleaning / done / cancel | Uploading · Cleaning · Done · Cancel |
| err.clean_video_failed | Couldn't clean this video. Try again in a minute. |
| about.theme | Theme |
| about.theme.options | System · Light · Dark |
| about.synthid | Saaf removes only the visible logo. Google's invisible SynthID watermark stays in the file. |

## Accessibility
Minimum touch target 44 × 44. Contrast 4.5:1 for text. Slider is keyboard-operable on web
(arrow keys) and has an accessibility label "Compare before and after". Respect reduced
motion: skip the wipe animation.
