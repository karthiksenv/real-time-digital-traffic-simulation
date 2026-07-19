import { buildLanes, posAt } from './lanes.js';
import { VEHICLE_DENSITY } from '../config.js';

// Vehicle archetypes: [key, length, baseSpeed m/s, share]
export const VEHICLE_TYPES = [
  { key: 'car', len: 4.2, speed: 11.5, share: 0.42 },
  { key: 'auto', len: 2.7, speed: 9.0, share: 0.22 },
  { key: 'bus', len: 10.5, speed: 8.0, share: 0.06 },
  { key: 'bike', len: 2.0, speed: 13.0, share: 0.30 },
];

const ACCEL = 3.2;   // m/s^2
const DECEL = 7.5;   // m/s^2
const MIN_GAP = 2.2; // m standstill gap
const HEADWAY = 0.9; // s time headway

export function createSim() {
  const lanes = buildLanes();
  const vehicles = [];
  const counts = { car: 0, auto: 0, bus: 0, bike: 0 };

  // Populate lanes proportional to length, evenly spaced, sorted by s.
  let id = 0;
  for (const lane of lanes) {
    const n = Math.max(1, Math.floor(lane.length * VEHICLE_DENSITY));
    const spacing = lane.length / n;
    for (let i = 0; i < n; i++) {
      const roll = Math.random();
      let acc = 0, type = VEHICLE_TYPES[0];
      for (const t of VEHICLE_TYPES) { acc += t.share; if (roll <= acc) { type = t; break; } }
      const v = {
        id: id++, type: type.key, len: type.len,
        base: type.speed * (0.85 + Math.random() * 0.3),
        s: i * spacing + Math.random() * spacing * 0.3,
        speed: 2 + Math.random() * 6,
        lane,
      };
      v.slot = counts[type.key]++; // stable index into that type's InstancedMesh
      lane.vehicles.push(v);
      vehicles.push(v);
    }
    lane.vehicles.sort((a, b) => a.s - b.s);
    // Flow cross-sections: inbound arms at their rotary entry + the
    // flyover deck = "vehicles/hour passing the junction".
    lane.marker = -1;
    if (lane.kind === 'radial' && !lane.dirOut) lane.marker = lane.stops[0] + 4;
    if (lane.kind === 'fly') lane.marker = lane.length * 0.5;
  }

  const sim = {
    lanes, vehicles, counts,
    t: 0,               // sim clock (s) - also drives signal phases
    globalMul: 1,       // from live/demo speed ratio
    stats: { avgSpeedRatio: 1, idling: 0, crossings: 0, flowVph: 0, delaySec: 0 },
  };
  return sim;
}

// One physics step. dt already includes sim-speed multiplier; caller substeps.
function step(sim, dt) {
  sim.t += dt;
  const t = sim.t;
  let ratioSum = 0, idling = 0;

  for (const lane of sim.lanes) {
    const vs = lane.vehicles;
    const n = vs.length;
    if (n === 0) continue;
    const green = lane.green(t);

    for (let i = 0; i < n; i++) {
      const v = vs[i];
      const leader = vs[(i + 1) % n];
      let gap = leader.s - v.s - leader.len;
      if (i === n - 1) gap += lane.length; // wrap
      if (gap < 0) gap = 0;

      // Red signal ahead -> virtual obstacle at stop line
      if (!green) {
        for (let k = 0; k < lane.stops.length; k++) {
          let d = lane.stops[k] - v.s;
          if (d < -1) d += lane.length;
          if (d >= -1 && d < 34) { if (d < gap) gap = Math.max(d, 0); break; }
        }
      }

      const desired = v.base * sim.globalMul;
      const safe = Math.max(0, (gap - MIN_GAP) / HEADWAY);
      const target = Math.min(desired, safe);
      if (v.speed < target) v.speed = Math.min(target, v.speed + ACCEL * dt);
      else v.speed = Math.max(target, v.speed - DECEL * dt);

      ratioSum += desired > 0 ? v.speed / desired : 1;
      if (v.speed < 0.4) idling++;
    }
    // Integrate + flow counting (after speeds settle)
    for (let i = 0; i < n; i++) {
      const v = vs[i];
      const s0 = v.s;
      v.s += v.speed * dt;
      if (lane.marker >= 0 && s0 < lane.marker && v.s >= lane.marker) sim.stats.crossings++;
      if (v.s >= lane.length) v.s -= lane.length;
    }
    // Wrap breaks sort order by at most a rotation; cheap re-sort keeps it exact
    vs.sort((a, b) => a.s - b.s);
  }

  const N = sim.vehicles.length;
  const r = N ? ratioSum / N : 1;
  sim.stats.avgSpeedRatio = sim.stats.avgSpeedRatio * 0.95 + r * 0.05;
  sim.stats.idling = idling;
}

// Advance sim by dtSim seconds using bounded substeps (stable at 60x).
export function advance(sim, dtSim) {
  const MAX_STEP = 0.06;
  let remaining = Math.min(dtSim, 3); // hard cap per frame
  const before = sim.stats.crossings;
  const t0 = sim.t;
  while (remaining > 1e-6) {
    const h = Math.min(MAX_STEP, remaining);
    step(sim, h);
    remaining -= h;
  }
  const elapsed = sim.t - t0;
  if (elapsed > 0) {
    const inst = ((sim.stats.crossings - before) / elapsed) * 3600;
    sim.stats.flowVph = sim.stats.flowVph * 0.9 + inst * 0.1;
  }
  // Modelled average delay per vehicle through the junction
  sim.stats.delaySec = (1 - sim.stats.avgSpeedRatio) * 110;
}

export { posAt };
