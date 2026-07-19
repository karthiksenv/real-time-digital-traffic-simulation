import { useEffect, useMemo, useRef } from 'react';
import { useFrame } from '@react-three/fiber';
import * as THREE from 'three';
import { mergeGeometries } from 'three/examples/jsm/utils/BufferGeometryUtils.js';
import { advance, posAt } from '../sim/simulation.js';

// One InstancedMesh per vehicle archetype (car / auto-rickshaw / bus /
// two-wheeler) so 1,000+ vehicles stay at 60fps. Instance colours vary
// per type. A single extra instanced mesh renders headlights at night.

function box(w, h, d, x, y, z) {
  const g = new THREE.BoxGeometry(w, h, d);
  g.translate(x, y, z);
  return g;
}

function buildGeometries() {
  return {
    car: mergeGeometries([
      box(1.75, 0.95, 4.2, 0, 0.75, 0),
      box(1.6, 0.7, 2.1, 0, 1.55, -0.25),
    ]),
    auto: mergeGeometries([
      box(1.35, 1.15, 2.7, 0, 0.85, 0),
      box(1.45, 0.1, 2.85, 0, 1.62, 0),
      box(0.9, 0.5, 0.5, 0, 0.65, 1.45),
    ]),
    bus: mergeGeometries([
      box(2.45, 2.7, 10.5, 0, 1.75, 0),
      box(2.3, 0.25, 10.2, 0, 3.2, 0),
    ]),
    bike: mergeGeometries([
      box(0.5, 0.75, 2.0, 0, 0.7, 0),
      box(0.55, 0.9, 0.55, 0, 1.5, -0.2),
    ]),
  };
}

const PALETTES = {
  car: ['#e8e8e8', '#d5d8dc', '#b8bcc2', '#f5f5f2', '#8f959c', '#2f3338', '#7a1f1f', '#1d3a5f', '#c8c2b4'],
  auto: ['#f2c81e', '#e9c528', '#f5cf2a'], // yellow bodies, green hoods drawn via second palette mix
  bus: ['#e2711d', '#d95f18', '#3f7d3a', '#c23b22'],
  bike: ['#22262b', '#3a3f45', '#5c1f1f', '#1f3a5c', '#666c73'],
};

export default function Vehicles({ sim, night, simSpeed }) {
  const geos = useMemo(buildGeometries, []);
  const refs = { car: useRef(), auto: useRef(), bus: useRef(), bike: useRef() };
  const lightRef = useRef();
  const dummy = useMemo(() => new THREE.Object3D(), []);
  const out = useMemo(() => ({ x: 0, y: 0, z: 0, h: 0 }), []);

  // per-instance colours, once
  useEffect(() => {
    const col = new THREE.Color();
    const counters = { car: 0, auto: 0, bus: 0, bike: 0 };
    for (const v of sim.vehicles) {
      const mesh = refs[v.type].current;
      const pal = PALETTES[v.type];
      const i = v.slot ?? counters[v.type]++;
      col.set(pal[Math.floor(Math.random() * pal.length)]);
      if (v.type === 'auto' && Math.random() < 0.4) col.set('#3f8a2f'); // CNG green hoods
      mesh.setColorAt(i, col);
    }
    for (const k of Object.keys(refs)) {
      if (refs[k].current.instanceColor) refs[k].current.instanceColor.needsUpdate = true;
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [sim]);

  useFrame((_, delta) => {
    const dt = Math.min(delta, 0.05);
    advance(sim, dt * simSpeed);

    const lightMesh = lightRef.current;
    let li = 0;
    for (const v of sim.vehicles) {
      posAt(v.lane, v.s, out);
      dummy.position.set(out.x, 0.05 + out.y, out.z);
      dummy.rotation.set(0, out.h, 0);
      dummy.scale.set(1, 1, 1);
      dummy.updateMatrix();
      refs[v.type].current.setMatrixAt(v.slot, dummy.matrix);

      if (night && lightMesh) {
        const sh = Math.sin(out.h), ch = Math.cos(out.h);
        const fx = out.x + sh * (v.len / 2);
        const fz = out.z + ch * (v.len / 2);
        const lx = ch * 0.55, lz = -sh * 0.55;
        dummy.rotation.set(0, 0, 0);
        dummy.position.set(fx + lx, 0.75 + out.y, fz + lz);
        dummy.updateMatrix();
        lightMesh.setMatrixAt(li++, dummy.matrix);
        if (v.type !== 'bike') {
          dummy.position.set(fx - lx, 0.75 + out.y, fz - lz);
          dummy.updateMatrix();
          lightMesh.setMatrixAt(li++, dummy.matrix);
        }
      }
    }
    for (const k of Object.keys(refs)) refs[k].current.instanceMatrix.needsUpdate = true;
    if (night && lightMesh) {
      lightMesh.count = li;
      lightMesh.instanceMatrix.needsUpdate = true;
    }
  });

  const maxLights = sim.vehicles.length * 2;
  return (
    <group>
      <instancedMesh ref={refs.car} args={[geos.car, undefined, sim.counts.car]} frustumCulled={false}>
        <meshStandardMaterial roughness={0.35} metalness={0.55} />
      </instancedMesh>
      <instancedMesh ref={refs.auto} args={[geos.auto, undefined, sim.counts.auto]} frustumCulled={false}>
        <meshStandardMaterial roughness={0.6} metalness={0.2} />
      </instancedMesh>
      <instancedMesh ref={refs.bus} args={[geos.bus, undefined, sim.counts.bus]} frustumCulled={false}>
        <meshStandardMaterial roughness={0.5} metalness={0.35} />
      </instancedMesh>
      <instancedMesh ref={refs.bike} args={[geos.bike, undefined, sim.counts.bike]} frustumCulled={false}>
        <meshStandardMaterial roughness={0.7} metalness={0.15} />
      </instancedMesh>
      <instancedMesh ref={lightRef} args={[undefined, undefined, maxLights]} visible={night} frustumCulled={false}>
        <sphereGeometry args={[0.11, 6, 6]} />
        <meshBasicMaterial color="#ffedb8" toneMapped={false} />
      </instancedMesh>
    </group>
  );
}
