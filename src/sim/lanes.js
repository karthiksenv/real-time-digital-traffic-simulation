import {
  ROTARY_R, ARM_COUNT, ARM_START, ARM_END,
  FLYOVER_HALF, FLYOVER_H, SIGNAL_CYCLE,
} from '../config.js';

const TAU = Math.PI * 2;

// ── Signal phases (shared by sim + visual signal heads) ──────────────
export function ringGreen(t) {
  const c = t % SIGNAL_CYCLE;
  return c < 15; // rotary flows 0-15s
}
export function radialGreen(t) {
  const c = t % SIGNAL_CYCLE;
  return c >= 16 && c < 25; // arms flow 16-25s, ~1s all-red buffers
}
const alwaysGreen = () => true;

// ── Lane construction ────────────────────────────────────────────────
// ring   : rotary circle radius r, ccw, signal stops at each arm entry
// radial : straight approach arm along angle a with sideways offset
// fly    : elevated E-W flyover, free-flowing (no signals)
export function buildLanes() {
  const lanes = [];
  for (const off of [-6, 0, 6]) { // three rotary lanes
    const r = ROTARY_R + off;
    const L = TAU * r;
    const stops = [];
    for (let k = 0; k < ARM_COUNT; k++) {
      const angStop = (k * TAU) / ARM_COUNT - 8 / r; // 8m before each arm
      let s = angStop * r;
      s = ((s % L) + L) % L;
      stops.push(s);
    }
    stops.sort((a, b) => a - b);
    lanes.push({ kind: 'ring', r, dir: 1, length: L, stops, green: ringGreen, vehicles: [] });
  }

  const L = ARM_END - ARM_START;
  for (let k = 0; k < ARM_COUNT; k++) {
    const a = (k * TAU) / ARM_COUNT;
    for (const offset of [1.9, 5.1]) { // outbound: rotary -> edge, free
      lanes.push({
        kind: 'radial', a, offset, dirOut: true, length: L,
        stops: [], green: alwaysGreen, vehicles: [],
      });
    }
    for (const offset of [-1.9, -5.1]) { // inbound: edge -> rotary, signalised
      lanes.push({
        kind: 'radial', a, offset, dirOut: false, length: L,
        stops: [L - 8], green: radialGreen, vehicles: [],
      });
    }
  }

  const FL = 2 * FLYOVER_HALF;
  for (const dirSign of [1, -1]) {
    for (const off of [2.2, 5.4]) { // left-hand traffic: keep left of centre
      lanes.push({
        kind: 'fly', dirSign, offset: dirSign * off, length: FL,
        stops: [], green: alwaysGreen, vehicles: [],
      });
    }
  }

  for (const l of lanes) l.stops.sort((a, b) => a - b);
  return lanes;
}

// Deck elevation profile along |x|
export function flyElevation(ax) {
  if (ax <= 80) return FLYOVER_H;
  if (ax >= 190) return 0;
  const u = (ax - 80) / 110;
  return FLYOVER_H * (1 - u * u * (3 - 2 * u)); // smoothstep down
}

// Writes x, y, z, heading (rotation about +Y; models face +Z after rotY=h)
export function posAt(lane, s, out) {
  if (lane.kind === 'ring') {
    const ang = s / lane.r;
    out.x = lane.r * Math.cos(ang);
    out.z = lane.r * Math.sin(ang);
    out.y = 0;
    out.h = Math.atan2(-Math.sin(ang), Math.cos(ang));
  } else if (lane.kind === 'radial') {
    const rr = lane.dirOut ? ARM_START + s : ARM_END - s;
    const ca = Math.cos(lane.a), sa = Math.sin(lane.a);
    out.x = rr * ca - lane.offset * sa;
    out.z = rr * sa + lane.offset * ca;
    out.y = 0;
    const dirSign = lane.dirOut ? 1 : -1;
    out.h = Math.atan2(ca * dirSign, sa * dirSign);
  } else { // fly
    const x = lane.dirSign > 0 ? s - FLYOVER_HALF : FLYOVER_HALF - s;
    out.x = x;
    out.z = lane.offset;
    out.y = flyElevation(Math.abs(x));
    out.h = lane.dirSign > 0 ? Math.PI / 2 : -Math.PI / 2;
  }
  return out;
}
