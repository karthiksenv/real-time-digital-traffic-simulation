# Real-Time Digital Traffic Simulation

A 3D digital twin of Connaught Place, New Delhi, running in the browser. I built
it to explore what a "living" traffic dashboard could look like: instead of a
top-down map with colored lines, you get a cinematic street-level view of CP's
concentric ring roads and white colonnaded arcades, with about 1,350 simulated
vehicles — cars, auto-rickshaws, buses, two-wheelers — queuing at signals and
flowing on green. Live congestion data from the TomTom Traffic API drives how
fast the network moves and how red the roads look.

Stack: Vite + React + Three.js (`three`, `@react-three/fiber`,
`@react-three/drei`, `@react-three/postprocessing`).

## Running it

```bash
npm install
npm run dev
```

Open the printed URL (usually http://localhost:5173). With no API key it runs in
demo mode with baked traffic data and a small banner saying so — nothing is
broken, it's just not live.

For live data, get a free key from https://developer.tomtom.com/ (Traffic Flow
API), copy `.env.example` to `.env`, set `VITE_TOMTOM_KEY`, and restart the dev
server. The app then fetches flow data for the junction every 60 seconds and
uses the current-speed / free-flow ratio to drive vehicle speeds and road
color. Any fetch failure silently falls back to demo mode; live readings are
fetched, rendered, and discarded, never stored.

## What you can do

Drag to orbit and scroll to zoom (the camera never goes top-down). Toggle
Cinematic for a slow automatic orbit, Night for streetlights, headlights and
window glows, Rain for particle rain and wet reflective roads. Sim speed runs
at 1×, 10×, or 60×. Clicking the central park opens a panel comparing live
speed against free-flow speed alongside the simulation's own stats. The HUD
shows network health, junction flow, average delay, and idling CO₂/fuel.

## Honest caveats

The geometry is stylized, not surveyed — radii, block heights, and signal
placement are eyeballed from maps and photos of CP. The traffic model is a
simple car-following model with fixed signal cycles, good enough to make
congestion look and behave plausibly, not for engineering conclusions. The
CO₂ and fuel figures are modelled estimates (0.75 L/hr per idling vehicle,
2.31 kg CO₂ per litre), and TomTom's flow segment covers one road segment
near the junction point, which I apply to the whole network. Treat everything
quantitative as illustrative.

## Adapting it to another junction

`src/config.js` holds the city, junction name, and coordinates (the TomTom
feed follows the coordinates automatically), plus all the visual tunables:
bloom strength, sun angle, fog density, vehicle density, ring radii, signal
cycle. The lane network lives in `src/sim/lanes.js` and the scenery in
`src/scene/` — CP's ring-and-spoke layout is baked in there, so a different
road layout means rewriting those two places.

## Layout

```
src/
  config.js            # all tunables
  sim/lanes.js         # ring/radial lane geometry + signal phases
  sim/simulation.js    # car-following traffic model (substepped, 60x-stable)
  data/useTraffic.js   # TomTom fetch + demo fallback (never blocks the UI)
  scene/               # roads, arcades, furniture, vehicles, rain, post-fx
  ui/HUD.jsx           # docked monospace HUD
```

## License

MIT — see [LICENSE](LICENSE).
