# Freedom Engine

**Freedom Engine** is a browser-playable Fourth of July festival management sim about turning Liberty Park into a one-day civic celebration machine.

Build the Fourth. Survive the Fourth.

## Current Status

This is a complete local prototype with a playable loop:

- place festival infrastructure on a 3D grid
- manage budget, vendors, parade ambition, security, services, and fireworks policy
- advance through Morning Setup, Afternoon Crowd Surge, Parade Hour, Evening Rush, Fireworks Finale, and Endgame Recap
- watch animated crowd dots move through the grounds
- read local radio/newspaper bulletins
- balance money, crowd, joy, safety, fire risk, flow, trash, bathrooms, spectacle, and chaos
- resolve an abstract fireworks finale and receive a newspaper-style scorecard

The implementation uses simple procedural Three.js shapes and labels. It does not include final art or copyrighted third-party game assets.

## Run Locally

```sh
npm install
npm run dev
```

Then open the local Vite URL shown in the terminal.

## Build

```sh
npm run build
```

Optional static preview:

```sh
npm run preview
```

## Controls

- Click a build category, then click a build item.
- Click a tile on the festival ground to place it.
- Use the Bulldoze tool to remove placed objects for a partial refund.
- Use **Advance Phase** to move through the festival day.
- Use **Save** and **Load** for local browser storage only.

## Core Gameplay

The player starts with limited money, a few entrance/parking/path tiles, and an empty Liberty Park. Every object pushes the festival machine in multiple directions:

- Vendors generate money and joy, but increase trash, lines, and supply pressure.
- Rides create joy and spectacle, but require power and safety coverage.
- Parade pieces increase civic pride and spectacle, but can hurt flow during Parade Hour.
- Bathrooms and trash service are unglamorous, but failing them can sink the day.
- Fireworks infrastructure increases spectacle and finale readiness, but raises fire risk and permit pressure.
- Fire marshal, fire crew, first aid, security, service lanes, and barriers make the finale safer.

## Festival Phases

1. **Morning Setup**: lower crowd, cheaper building, best time for logistics.
2. **Afternoon Crowd Surge**: families arrive; food, shade, trash, and bathrooms matter.
3. **Parade Hour**: civic pride rises, but parade routes can block flow.
4. **Evening Rush**: peak crowd pressure, vendor supply, safety, and fire risk intensify.
5. **Fireworks Finale**: free building stops and the finale resolves.
6. **Endgame Recap**: score, awards, ending archetype, and newspaper article.

## Main Systems

- **Crowd flow**: animated crowd dots and aggregate flow calculations respond to paths, routes, bottlenecks, parking, and crowd scale.
- **Demand and capacity**: food, bathrooms, trash, viewing zones, and attractions are compared against crowd demand each phase.
- **Policies**: budget, fireworks enforcement, vendor mix, parade ambition, security style, and service level modify the sim.
- **Events**: triggered local-radio bulletins apply effects such as heat waves, stockouts, fire marshal warnings, parking gridlock, and parade detours.
- **Finale scoring**: spectacle, readiness, viewing, safety, fire marshal approval, fire risk, permit pressure, weather, and chaos determine the final outcome.

## Attribution

The original plan suggested using an existing MIT-licensed Three.js grid scaffold if it was present locally. That scaffold was not present in this workspace when this build was created, so this version is a clean Vite + Three.js + TypeScript implementation.

No code or art assets from that external scaffold were copied into this build. If a future pass imports a third-party scaffold, preserve its license attribution and notices.

## Franchise Notice

Freedom Engine is an original festival management game prototype. It is not affiliated with, endorsed by, or derived from any commercial city-builder, theme-park, fireworks, or simulation game franchise, publisher, or trademark owner.

## Competition Note

Built as a friendly Summer AI competition artifact. The newspaper/radio text is procedural/template-driven local game copy, not runtime AI output. Fireworks are abstract game objects only; the game intentionally avoids practical fireworks construction or misuse instructions.

## Known Limitations

- Crowd movement is simplified and stylized; the simulation uses aggregate pressure math plus animated crowd dots.
- Buildings are one-tile placeholder shapes with text labels.
- No backend, online leaderboard, multiplayer, or remote deployment is included.
- The base scaffold mentioned in the instructions was not found locally, so no third-party scaffold attribution is required for this clean build.
