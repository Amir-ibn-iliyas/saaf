# 05 — Costs (free plan, September 2026)

Goal: **₹0 until launch.** Pay only when users grow.

## Build and test: ₹0
| Item | Cost | Note |
|---|---|---|
| Web app on Cloudflare Pages (`saaf.pages.dev`) | ₹0 | Custom domain optional (~₹800–1,500/year) |
| Images | ₹0 | Processed on the user's device |
| Video server on Oracle Cloud Always Free | ₹0 | 2 OCPU / 12 GB ARM total since June 2026; card needed for verification; "out of capacity" errors are common, try another time or region |
| HTTPS for server | ₹0 | Caddy + free DuckDNS subdomain |
| Expo EAS builds | ₹0 | Free tier; or build locally |
| Android testing | ₹0 | Share the APK directly with testers |

## At launch
| Item | Cost |
|---|---|
| Google Play developer account | $25 one time (~₹2,200) |
| Apple Developer Program (optional, iPhone) | $99/year (~₹8,700) |

## When users grow (upgrade path)
| Trigger | Move to | Cost |
|---|---|---|
| Server slow or Oracle limits hit | Hetzner VPS + Coolify | ~€4–10/month; check current prices |
| Want a proper brand | Own domain | ~₹800–1,500/year |
| Heavy web video traffic | Task 5.5: process web videos in the browser | ₹0 |

## Free-tier cautions
- Oracle can change free limits without notice (it halved the ARM allowance in June 2026).
  Keep the server a plain Docker Compose file so moving to any VPS takes under an hour.
- Never enable paid resources on the Oracle account by accident; set a budget alert of $1.
