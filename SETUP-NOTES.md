# Setup notes — Manual Itinerante

Simple record of how this project was set up locally (Jul 15, 2026).

## Project location

`/home/johan/Projects/Itinerante/manual-itinerante`

Started from `ManualItinerante.zip` (Starlight + Astro).

## What was wrong

1. **`sh: astro: Permission denied`** — `node_modules` from the zip (Windows) had no execute bits on `.bin` scripts.
2. **`ERESOLVE` on `npm install`** — `package.json` had `@astrojs/vercel@^8.0.4` (Astro 5 only) while the app uses **Astro 7**. Also installed with system Node 18 instead of nvm.

## What we fixed

- Changed `@astrojs/vercel` from `^8.0.4` → `^11.0.0`
- Deleted `node_modules` + `package-lock.json`
- Reinstalled with **nvm Node 22** (`v22.17.1`, npm 11)
- Confirmed `npm run dev` → http://localhost:4321/

## How to run next time

```bash
cd /home/johan/Projects/Itinerante/manual-itinerante
source ~/.nvm/nvm.sh
nvm use 22
npm install   # only if node_modules is missing
npm run dev
```

Open: http://localhost:4321/

## Useful commands

| Command | Purpose |
|---------|---------|
| `npm run dev` | Local dev server |
| `npm run build` | Production build |
| `npm run preview` | Preview the build |

## Notes

- Keep using **nvm** (`nvm use 22` or `24`), not system `/usr/bin/node` (v18).
- `.env` has `AI_PROVIDER` and `GROQ_API_KEY` for the ask widget — update if keys stop working.
- Original zip is still here: `ManualItinerante.zip` (safe to keep or delete after setup).
