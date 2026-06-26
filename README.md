# Red, White & Boomtown

**Build the Fourth. Feed the crowd. Keep the sky from suing you.**

Red, White & Boomtown is a static browser game about building a one-day Fourth
of July festival in Liberty Park. Place paths, vendors, services, parade pieces,
and abstract fireworks infrastructure while trying to keep the crowd happy, the
budget alive, and the fire marshal from developing a facial twitch.

## Independence Engines

Red, White & Boomtown is an Independence Engine because a public celebration is
a tiny civic machine: vendors, routes, safety, bathrooms, trash, traffic, parade
timing, and fireworks all have to work together before a crowd can feel free to
celebrate. The player builds the engine underneath the Fourth.

## Run Locally

```sh
npm install
npm run dev
```

Then open the local Vite URL shown in the terminal.

## Play Online

Once GitHub Pages finishes deploying, Red, White & Boomtown will be playable at:

https://bluntforceriot.github.io/freedom-engine/

Repository:

https://github.com/BluntforceRiot/freedom-engine

This is a static browser demo. Players do not need to download the repository
for normal play.

## Build

```sh
npm run build
```

Optional static preview:

```sh
npm run preview
```

Browser smoke test:

```sh
npm run playtest
```

## GitHub Pages

This repo includes `.github/workflows/deploy.yml`. In GitHub repository
settings, set Pages to deploy from GitHub Actions, then push to `main` or run
the workflow manually.

## How To Play

- Press **START THE FOURTH** from the title screen.
- Pick a build category, then choose an item card.
- Click the festival grid to place the item.
- Use paths to connect vendors, services, viewing areas, and parade pieces.
- Use bathrooms, trash service, safety, parking, and fire support to keep the
  civic machine from collapsing politely.
- Advance through Morning Setup, Afternoon Crowd Surge, Parade Hour, Evening
  Rush, Fireworks Finale, and Endgame Recap.
- Use **Copy Recap** on the final scorecard to grab a shareable text summary.

## Main Systems

- **Crowd flow**: animated crowd dots and aggregate flow calculations respond to
  paths, routes, bottlenecks, parking, and crowd scale.
- **Demand and capacity**: food, restroom capacity, trash, viewing zones, and
  attractions are compared against crowd demand each phase.
- **Policies**: budget, fireworks enforcement, vendor mix, parade ambition,
  security style, and service level modify the sim.
- **Events**: local-radio and Gazette blurbs apply effects such as heat waves,
  stockouts, fire marshal warnings, parking gridlock, and parade detours.
- **Finale scoring**: spectacle, readiness, viewing, safety, fire marshal
  confidence, fire risk, permit pressure, weather, and chaos determine the
  fireworks result. The final headline uses an Overall Festival Grade that also
  weighs joy, flow, cleanliness, bathroom pressure, money, civic pride, and
  chaos.

## Competition Submission Blurb

Build the Fourth from the ground up. Red, White & Boomtown is a one-day
festival-management sim where players place vendors, paths, parade pieces, civic
services, and fireworks infrastructure while trying to keep the crowd happy, the
budget alive, and the fire marshal from developing a facial twitch. It is an
Independence Engine because celebration itself depends on infrastructure:
routes, safety, services, trust, and enough bathrooms to keep liberty from
collapsing.

## Privacy / Hosting Notes

- Static browser app only.
- No backend.
- No accounts.
- No analytics or telemetry.
- Save/load uses local browser storage only.
- Fireworks are abstract game objects only; the game intentionally avoids
  practical fireworks construction or misuse instructions.

## Attribution

The original plan suggested using an existing MIT-licensed Three.js grid scaffold
if it was present locally. That scaffold was not present in this workspace when
this build was created, so this version is a clean Vite + Three.js + TypeScript
implementation.

No code or art assets from that external scaffold were copied into this build.
If a future pass imports a third-party scaffold, preserve its license
attribution and notices.

## Franchise Notice

Red, White & Boomtown is an original festival management game prototype. It is
not affiliated with, endorsed by, or derived from any commercial city-builder,
theme-park, fireworks, or simulation game franchise, publisher, or trademark
owner.

## Current Scope

- Visuals use procedural symbolic festival models, category halos, and small
  object details. Final custom art is intentionally left for a future asset pass.
- Crowd movement is a stylized agent layer over aggregate festival math, tuned
  for readable public-demo feedback rather than full individual pathfinding.
- The layout includes desktop and compact mobile/tablet breakpoints for preview
  and playtest screenshots.
- There is no backend, online leaderboard, multiplayer, telemetry, or remote
  deployment in this package.
