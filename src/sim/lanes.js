import {
  RING_INNER, RING_MIDDLE, RING_OUTER,
  RADIAL_COUNT, RADIAL_START, RADIAL_END, SIGNAL_CYCLE,
} from '../config.js';

const TAU = Math.PI * 2;

// ── Signal phases (shared by sim + visual signal heads) ──────────────
export function ringGreen(t) {
  const c = t % SIGNAL_CYCLE;
  return c < 15; // rings flow 0-15s
}
export function radialGreen(t) {
  const c = t % SIGNAL_CYCLE;
  return c >= 16 && c < 25; // radials flow 16-25s, ~1s all-red buffers
}

// ── Lane construction ────────────────────────────────────────────────
// Ring lane: circle radius r, direction dir (+1 ccw / -1 cw around +Y).
// Radial lane: straight segment along spoke angle a with sideways offset.
export function buildLanes() {
  const lanes = [];
  const ringDefs = [
    { base: RING_INNER, dir: 1 },
    { base: RING_MIDDLE, dir: -1 },
    { base: RING_OUTER, dir: 1 },
  ];
  for (const rd of ringDefs) {
    for (const off of [-4, 0, 4]) {
      const r = rd.base + off;
      const L = TAU * r;
      const stops = [];
      for (let k = 0; k < RADIAL_COUNT; k++) {
        // stop line ~8m before each radial crossing (in travel direction)
        const angStop = (k * TAU) / RADIAL_COUNT - rd.dir * (8 / r);
        let s = rd.dir * angStop * r;
        s = ((s % L) + L) % L;
        stops.push(s);
      }
      stops.sort((a, b) => a - b);
      lanes.push({
        kind: 'ring', r, dir: rd.dir, length: L,
        stops, green: ringGreen, vehicles: [],
      });
    }
  }
  const L = RADIAL_END - RADIAL_START;
  for (let k = 0; k < RADIAL_COUNT; k++) {
    const a = (k * TAU) / RADIAL_COUNT;
    for (const offset of [1.9, 5.1]) { // outbound: centre -> edge
      lanes.push({
        kind: 'radial', a, offset, dirOut: true, length: L,
        stops: [RING_MIDDLE - RADIAL_START - 8, RING_OUTER - RADIAL_START - 8],
        green: radialGreen, vehicles: [],
      });
    }
    for (const offset of [-1.9, -5.1]) { // inbound: edge -> centre
      lanes.push({
        kind: 'radial', a, offset, dirOut: false, length: L,
        stops: [RADIAL_END - RING_OUTER - 8, RADIAL_END - RING_MIDDLE - 8],
        green: radialGreen, vehicles: [],
      });
    }
  }
  for (const l of lanes) l.stops.sort((a, b) => a - b);
  return lanes;
}

// Writes x, z, heading (rotation about +Y; models face +Z after rotY=h)
export function posAt(lane, s, out) {
  if (lane.kind === 'ring') {
    const ang = (lane.dir * s) / lane.r;
    out.x = lane.r * Math.cos(ang);
    out.z = lane.r * Math.sin(ang);
    // travel tangent in XZ: heading = atan2(dx, dz)
    const tx = -Math.sin(ang) * lane.dir;
    const tz = Math.cos(ang) * lane.dir;
    out.h = Math.atan2(tx, tz);
  } else {
    const rr = lane.dirOut ? RADIAL_START + s : RADIAL_END - s;
    const ca = Math.cos(lane.a), sa = Math.sin(lane.a);
    out.x = rr * ca - lane.offset * sa;
    out.z = rr * sa + lane.offset * ca;
    const dirSign = lane.dirOut ? 1 : -1;
    out.h = Math.atan2(ca * dirSign, sa * dirSign);
  }
  return out;
}
