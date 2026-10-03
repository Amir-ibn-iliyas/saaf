# Saaf — project planning kit

Planning folder for a Gemini watermark remover (images + videos) built with Expo (web +
Android + iOS) and a small Python video server. Drop this folder into an empty repo and open
it with Claude Code.

## How to start
Read **START-HERE.md** (Hinglish, step by step).

## What is inside
| Path | Purpose |
|---|---|
| `START-HERE.md` | Your first steps and the first message to send Claude |
| `docs/00-setup-guide.md` | How to install Git, Node, Python, FFmpeg, Android Studio |
| `CLAUDE.md` | Main instructions Claude Code reads every session |
| `.claude/settings.json` | What the agent may run without asking; blocks `.env` reads and `git push` |
| `.claude/commands/` | `/next`, `/verify`, `/decision` |
| `.claude/agents/reviewer.md` | Reviewer subagent that checks each task before it's ticked |
| `.claude/skills/watermark-algorithm/` | Algorithm checklist the agent loads for core/server work |
| `docs/` | Product brief, stack decision, architecture, algorithm, costs, risks |
| `design/` | Design guide, tokens, and `mockup.html` (open in a browser) |
| `steps/` | Phases and tasks with acceptance criteria |
| `progress/` | Progress board and decision log (the agent keeps these updated) |
| `fixtures/` | Your sample images/videos for tests |
