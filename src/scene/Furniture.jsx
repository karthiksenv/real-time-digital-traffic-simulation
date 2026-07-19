import { useEffect, useMemo, useRef } from 'react';
import { useFrame } from '@react-three/fiber';
import * as THREE from 'three';
import {
  PARK_RADIUS, RING_INNER, RING_MIDDLE, RING_OUTER, RADIAL_COUNT,
} from '../config.js';
import { ringGreen, radialGreen } from '../sim/lanes.js';

const TAU = Math.PI * 2;

// Streetlights, traffic signals, instanced low-poly trees, the CP flag.
export default function Furniture({ night, simRef }) {
  // ── static placement ────────────────────────────────────────────────
  const { lights, trees } = useMemo(() => {
    let seed = 42;
    const rand = () => { seed = (seed * 16807) % 2147483647; return seed / 2147483647; };
    const lights = [];
    for (const [r, n] of [[RING_INNER, 22], [RING_MIDDLE, 36], [RING_OUTER, 48]]) {
      for (const side of [-9.5, 9.5]) {
        for (let i = 0; i < n; i++) {
          const a = (i / n) * TAU + (side > 0 ? TAU / n / 2 : 0);
          lights.push({ x: (r + side) * Math.cos(a), z: (r + side) * Math.sin(a) });
        }
      }
    }
    const trees = [];
    for (let i = 0; i < 70; i++) { // central park
      const a = rand() * TAU, r = 8 + rand() * (PARK_RADIUS - 12);
      if (r > 24 && r < 32) continue; // keep walkway clear
      trees.push({ x: r * Math.cos(a), z: r * Math.sin(a), s: 0.8 + rand() * 0.7 });
    }
    for (let i = 0; i < 140; i++) { // greenery along pavements
      const ring = [RING_INNER, RING_MIDDLE, RING_OUTER][Math.floor(rand() * 3)];
      const a = rand() * TAU;
      const spoke = Math.round((a / TAU) * RADIAL_COUNT) * (TAU / RADIAL_COUNT);
      const r = ring + (rand() > 0.5 ? 12.5 : -12.5);
      if (Math.abs(Math.atan2(Math.sin(a - spoke), Math.cos(a - spoke))) < 10 / r) continue;
      trees.push({ x: r * Math.cos(a), z: r * Math.sin(a), s: 0.6 + rand() * 0.5 });
    }
    return { lights, trees };
  }, []);

  // ── materials we mutate on mode change ──────────────────────────────
  const lampMat = useMemo(() => new THREE.MeshStandardMaterial({
    color: '#fff2cf', emissive: '#ffca6a', emissiveIntensity: 0.15,
  }), []);
  useEffect(() => { lampMat.emissiveIntensity = night ? 3.2 : 0.15; }, [night, lampMat]);

  const poleRef = useRef();
  const lampRef = useRef();
  const trunkRef = useRef();
  const canopyRef = useRef();

  useEffect(() => {
    const dummy = new THREE.Object3D();
    lights.forEach((l, i) => {
      dummy.position.set(l.x, 3.75, l.z); dummy.scale.set(1, 1, 1);
      dummy.rotation.set(0, 0, 0); dummy.updateMatrix();
      poleRef.current.setMatrixAt(i, dummy.matrix);
      dummy.position.y = 7.6; dummy.updateMatrix();
      lampRef.current.setMatrixAt(i, dummy.matrix);
    });
    poleRef.current.instanceMatrix.needsUpdate = true;
    lampRef.current.instanceMatrix.needsUpdate = true;

    const col = new THREE.Color();
    trees.forEach((t, i) => {
      dummy.position.set(t.x, 1.4 * t.s, t.z);
      dummy.scale.set(t.s, t.s, t.s); dummy.updateMatrix();
      trunkRef.current.setMatrixAt(i, dummy.matrix);
      dummy.position.y = (2.8 + 2.4) * t.s; dummy.updateMatrix();
      canopyRef.current.setMatrixAt(i, dummy.matrix);
      canopyRef.current.setColorAt(i, col.setHSL(0.29 + (i % 7) * 0.008, 0.45, 0.28 + (i % 5) * 0.02));
    });
    trunkRef.current.instanceMatrix.needsUpdate = true;
    canopyRef.current.instanceMatrix.needsUpdate = true;
    if (canopyRef.current.instanceColor) canopyRef.current.instanceColor.needsUpdate = true;
  }, [lights, trees]);

  // ── traffic signals at radial crossings of Middle + Outer circles ───
  const signalDefs = useMemo(() => {
    const defs = [];
    for (let k = 0; k < RADIAL_COUNT; k++) {
      const a = (k * TAU) / RADIAL_COUNT;
      for (const r of [RING_MIDDLE, RING_OUTER]) {
        defs.push({
          x: (r - 10) * Math.cos(a) - 8.5 * Math.sin(a),
          z: (r - 10) * Math.sin(a) + 8.5 * Math.cos(a),
          rot: -a,
        });
      }
    }
    return defs;
  }, []);
  const redMats = useRef([]);
  const greenMats = useRef([]);

  useFrame(() => {
    const t = simRef.current ? simRef.current.t : 0;
    const rg = ringGreen(t); // ring phase drives the heads we show
    for (const m of redMats.current) if (m) m.emissiveIntensity = rg ? 0.05 : 2.6;
    for (const m of greenMats.current) if (m) m.emissiveIntensity = rg ? 2.6 : 0.05;
  });

  return (
    <group>
      {/* streetlight poles + emissive heads */}
      <instancedMesh ref={poleRef} args={[undefined, undefined, lights.length]} castShadow>
        <cylinderGeometry args={[0.12, 0.18, 7.5, 6]} />
        <meshStandardMaterial color="#3b3f45" roughness={0.6} metalness={0.6} />
      </instancedMesh>
      <instancedMesh ref={lampRef} args={[undefined, undefined, lights.length]} material={lampMat}>
        <sphereGeometry args={[0.38, 10, 8]} />
      </instancedMesh>

      {/* trees */}
      <instancedMesh ref={trunkRef} args={[undefined, undefined, trees.length]} castShadow>
        <cylinderGeometry args={[0.22, 0.32, 2.8, 6]} />
        <meshStandardMaterial color="#5a4632" roughness={1} />
      </instancedMesh>
      <instancedMesh ref={canopyRef} args={[undefined, undefined, trees.length]} castShadow>
        <coneGeometry args={[2.3, 5.2, 7]} />
        <meshStandardMaterial roughness={1} />
      </instancedMesh>

      {/* traffic signal heads */}
      {signalDefs.map((s, i) => (
        <group key={i} position={[s.x, 0, s.z]} rotation-y={s.rot}>
          <mesh position={[0, 2.6, 0]} castShadow>
            <cylinderGeometry args={[0.1, 0.14, 5.2, 6]} />
            <meshStandardMaterial color="#2c2f33" metalness={0.5} roughness={0.5} />
          </mesh>
          <mesh position={[0, 5.4, 0]}>
            <boxGeometry args={[0.55, 1.5, 0.55]} />
            <meshStandardMaterial color="#17181a" roughness={0.6} />
          </mesh>
          <mesh position={[0, 5.85, 0.3]}>
            <sphereGeometry args={[0.17, 8, 8]} />
            <meshStandardMaterial
              ref={(m) => (redMats.current[i] = m)}
              color="#5a0f0f" emissive="#ff2a1a" emissiveIntensity={0.05}
            />
          </mesh>
          <mesh position={[0, 4.95, 0.3]}>
            <sphereGeometry args={[0.17, 8, 8]} />
            <meshStandardMaterial
              ref={(m) => (greenMats.current[i] = m)}
              color="#0d3a12" emissive="#2aff5e" emissiveIntensity={0.05}
            />
          </mesh>
        </group>
      ))}

      {/* the giant CP tricolour in Central Park */}
      <group position={[0, 0, 0]}>
        <mesh position={[0, 19, 0]} castShadow>
          <cylinderGeometry args={[0.25, 0.45, 38, 8]} />
          <meshStandardMaterial color="#9aa0a8" metalness={0.7} roughness={0.35} />
        </mesh>
        {['#ff9933', '#f4f4f0', '#138808'].map((c, i) => (
          <mesh key={c} position={[4.5, 36 - i * 2, 0]} castShadow>
            <boxGeometry args={[9, 2, 0.12]} />
            <meshStandardMaterial color={c} roughness={0.9} side={THREE.DoubleSide} />
          </mesh>
        ))}
      </group>
    </group>
  );
}
