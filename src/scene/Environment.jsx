import { useEffect, useMemo, useRef } from 'react';
import * as THREE from 'three';
import {
  PARK_RADIUS, RING_INNER, RING_MIDDLE, RING_OUTER,
  RADIAL_COUNT, RADIAL_START, RADIAL_END,
} from '../config.js';

const TAU = Math.PI * 2;
const RINGS = [RING_INNER, RING_MIDDLE, RING_OUTER];
const ROAD_HALF = 7;

// Ground, park, ring + radial asphalt, pavements, lane dashes, zebras.
export default function Environment({ night, rain, ratio, onJunctionClick }) {
  const asphaltMat = useMemo(() => new THREE.MeshPhysicalMaterial({
    color: '#2e3136', roughness: 0.9, metalness: 0.05,
  }), []);
  const grassMat = useMemo(() => new THREE.MeshStandardMaterial({
    color: '#4d7a3d', roughness: 1,
  }), []);
  const pavementMat = useMemo(() => new THREE.MeshStandardMaterial({
    color: '#b7b1a2', roughness: 0.95,
  }), []);
  const groundMat = useMemo(() => new THREE.MeshStandardMaterial({
    color: '#6f6a56', roughness: 1,
  }), []);

  // Congestion + weather + time-of-day drive the road colour.
  useEffect(() => {
    const base = new THREE.Color(night ? '#1d2026' : '#2e3136');
    base.lerp(new THREE.Color('#4d2f26'), Math.min(1, (1 - ratio) * 0.85));
    if (rain) base.multiplyScalar(0.55);
    asphaltMat.color.copy(base);
    asphaltMat.roughness = rain ? 0.32 : 0.9;
    asphaltMat.clearcoat = rain ? 0.65 : 0;
    asphaltMat.clearcoatRoughness = 0.35;
    grassMat.color.set(night ? '#1e3320' : rain ? '#3c5c33' : '#4d7a3d');
    pavementMat.color.set(night ? '#4c4a45' : rain ? '#8a867c' : '#b7b1a2');
    groundMat.color.set(night ? '#23221e' : rain ? '#565349' : '#6f6a56');
  }, [night, rain, ratio, asphaltMat, grassMat, pavementMat, groundMat]);

  // Lane dashes (instanced)
  const dashes = useMemo(() => {
    const list = [];
    for (const r of RINGS) {
      const count = Math.floor((TAU * r) / 8);
      for (let i = 0; i < count; i++) {
        const a = (i / count) * TAU;
        list.push({ x: r * Math.cos(a), z: r * Math.sin(a), rot: -a });
      }
    }
    for (let k = 0; k < RADIAL_COUNT; k++) {
      const a = (k * TAU) / RADIAL_COUNT;
      for (let rr = RADIAL_START + 6; rr < RADIAL_END - 4; rr += 8) {
        list.push({ x: rr * Math.cos(a), z: rr * Math.sin(a), rot: Math.PI / 2 - a });
      }
    }
    return list;
  }, []);

  // Zebra crossings across radials, both sides of middle + outer rings
  const zebra = useMemo(() => {
    const list = [];
    for (let k = 0; k < RADIAL_COUNT; k++) {
      const a = (k * TAU) / RADIAL_COUNT;
      for (const ringR of [RING_MIDDLE, RING_OUTER]) {
        for (const side of [-11.5, 11.5]) {
          const rr = ringR + side;
          if (rr < RADIAL_START || rr > RADIAL_END) continue;
          for (let i = -3; i <= 3; i++) {
            const lat = i * 1.7;
            list.push({
              x: rr * Math.cos(a) - lat * Math.sin(a),
              z: rr * Math.sin(a) + lat * Math.cos(a),
              rot: Math.PI / 2 - a,
            });
          }
        }
      }
    }
    return list;
  }, []);

  const dashRef = useRef();
  const zebraRef = useRef();
  useEffect(() => {
    const dummy = new THREE.Object3D();
    dashes.forEach((d, i) => {
      dummy.position.set(d.x, 0.06, d.z);
      dummy.rotation.set(0, d.rot, 0);
      dummy.updateMatrix();
      dashRef.current.setMatrixAt(i, dummy.matrix);
    });
    dashRef.current.instanceMatrix.needsUpdate = true;
    zebra.forEach((d, i) => {
      dummy.position.set(d.x, 0.07, d.z);
      dummy.rotation.set(0, d.rot, 0);
      dummy.updateMatrix();
      zebraRef.current.setMatrixAt(i, dummy.matrix);
    });
    zebraRef.current.instanceMatrix.needsUpdate = true;
  }, [dashes, zebra]);

  return (
    <group>
      {/* base ground */}
      <mesh rotation-x={-Math.PI / 2} position-y={-0.05} receiveShadow material={groundMat}>
        <planeGeometry args={[820, 820]} />
      </mesh>

      {/* central park (click target for junction panel) */}
      <mesh
        rotation-x={-Math.PI / 2} position-y={0.09} receiveShadow material={grassMat}
        onClick={(e) => { e.stopPropagation(); onJunctionClick(); }}
      >
        <circleGeometry args={[PARK_RADIUS, 64]} />
      </mesh>
      {/* park inner walkway ring */}
      <mesh rotation-x={-Math.PI / 2} position-y={0.1} receiveShadow material={pavementMat}>
        <ringGeometry args={[26, 30, 64]} />
      </mesh>

      {/* ring roads */}
      {RINGS.map((r) => (
        <mesh key={r} rotation-x={-Math.PI / 2} position-y={0.02} receiveShadow material={asphaltMat}>
          <ringGeometry args={[r - ROAD_HALF, r + ROAD_HALF, 128]} />
        </mesh>
      ))}

      {/* pavements flanking each ring */}
      {RINGS.map((r) => (
        <group key={`p${r}`}>
          <mesh rotation-x={-Math.PI / 2} position-y={0.04} receiveShadow material={pavementMat}>
            <ringGeometry args={[r - ROAD_HALF - 4, r - ROAD_HALF, 128]} />
          </mesh>
          <mesh rotation-x={-Math.PI / 2} position-y={0.04} receiveShadow material={pavementMat}>
            <ringGeometry args={[r + ROAD_HALF, r + ROAD_HALF + 4, 128]} />
          </mesh>
        </group>
      ))}

      {/* radial roads */}
      {Array.from({ length: RADIAL_COUNT }, (_, k) => {
        const a = (k * TAU) / RADIAL_COUNT;
        const mid = (RADIAL_START + RADIAL_END) / 2;
        return (
          <mesh
            key={k} position={[mid * Math.cos(a), 0.03, mid * Math.sin(a)]}
            rotation={[-Math.PI / 2, 0, -a + Math.PI / 2]}
            receiveShadow material={asphaltMat}
          >
            <planeGeometry args={[13, RADIAL_END - RADIAL_START]} />
          </mesh>
        );
      })}

      {/* lane dashes */}
      <instancedMesh ref={dashRef} args={[undefined, undefined, dashes.length]}>
        <boxGeometry args={[0.28, 0.02, 3]} />
        <meshStandardMaterial color="#d8d4c8" roughness={0.7} />
      </instancedMesh>

      {/* zebra crossings */}
      <instancedMesh ref={zebraRef} args={[undefined, undefined, zebra.length]} receiveShadow>
        <boxGeometry args={[0.75, 0.02, 3.4]} />
        <meshStandardMaterial color="#e6e2d6" roughness={0.75} />
      </instancedMesh>
    </group>
  );
}
