# Phase 6 — Hosting (only after Phases 0–5 work locally)

Free plan: see `docs/05-costs.md` and `progress/DECISIONS.md` (D-003).

## 6.1 Dockerize the server
- Dockerfile (python 3.12 slim + ffmpeg) that builds for arm64 AND amd64.
- `docker-compose.yml` with the API and Caddy (automatic HTTPS).
**Done when:** `docker compose up` runs the server locally and `/health` works.

## 6.2 Deploy the video server (free)
- Oracle Cloud Always Free ARM VM (Ubuntu). Open ports 80/443 in BOTH the OCI security
  list and the VM's iptables. Point a free DuckDNS subdomain at the VM.
- If Oracle is not available: run the same compose file on the owner's PC and expose it with
  a free Cloudflare Tunnel. Log which one is live in PROGRESS.md.
- Set `EXPO_PUBLIC_API_URL` to the public HTTPS URL for production builds.
**Done when:** `curl https://<name>.duckdns.org/health` works and a Veo fixture cleans
remotely in < 30 s.

## 6.3 Web release (free)
- `npx expo export -p web` → deploy to Cloudflare Pages on the free `*.pages.dev` address
  (custom domain later).
- Basic SEO: title, description, Open Graph image. Privacy policy and terms pages.
**Done when:** site loads on phone and desktop; Lighthouse performance ≥ 85 on mobile.


## 6.4 Play Store (when the owner decides to launch)
- Play Console account ($25 one time), store listing without Google brand names,
  internal testing track first.
**Done when:** the app is live on the internal testing track.
