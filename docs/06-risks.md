# 06 — Risks and rules

| Risk | What to do |
|---|---|
| Google changes the logo, size or position | Multi-template detection, masks in `masks.json` served from `/v1/masks`, fixtures for each version, calibration steps in `04-algorithm.md`. |
| Brand / trademark complaints | App name, icon and store title must not use "Gemini", "Google" or "Veo". Descriptions can plainly say what files it works with. |
| App store rejection | Store listing must describe a photo/video cleanup tool honestly; no claims of removing AI detection. Launch web + Android first. |
| Users think the image is no longer "AI-detectable" | App copy states the invisible SynthID watermark remains. We never target it. |
| Misuse (deepfakes, passing off AI images as real) | Terms of use: users are responsible for following platform rules and local AI-labelling laws. |
| Server abuse / cost spike | Size and duration limits, per-IP rate limit, delete files immediately. |
| Free hosting disappears or shrinks | Server is one Docker Compose file; documented move to Hetzner in `05-costs.md`. Budget alert on Oracle. |
| Legal questions | This is not legal advice. Get a short review before charging money or running ads. |
