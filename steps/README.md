# Steps — build order

Work top to bottom. One task at a time. Each task lists acceptance criteria; a task is done
only when all of them pass. Use `/next` in Claude Code to run the loop.

| Phase | File | Goal | Rough time with an agent |
|---|---|---|---|
| 0 | phase-0-setup.md | App + server skeletons, prove Skia can edit pixels on web and Android | 2–4 h |
| 1 | phase-1-core.md | Pure TS detection + removal with tests | 3–5 h |
| 2 | phase-2-image-flow.md | Pick → clean → compare → save, on web and Android | 4–6 h |
| 3 | phase-3-video-server.md | FastAPI video cleaning, running locally | 3–5 h |
| 4 | phase-4-video-flow.md | Video upload/download in the app | 2–3 h |
| 5 | phase-5-release.md | Polish, remote masks, Android test APK | 3–4 h |
| 6 | phase-6-hosting.md | Docker, free server, web release, Play Store (LATER) | 3–5 h |

Everything runs on your own computer until Phase 6. Hosting is the free plan (see
`docs/05-costs.md`).

Realistic total: **images on web + Android in 1–2 days; video and release in another 2–3
days.** Store review time is extra.
