import { useEffect, useMemo, useRef } from 'react';
import * as THREE from 'three';
import {
  ISLAND_RADIUS, ROTARY_R, ARM_COUNT, ARM_START, ARM_END, FLYOVER_HALF,
} from '../config.js';
import { flyElevation } from '../sim/lanes.js';

const TAU = Math.PI * 2;
const ROAD_HALF = 8;

// Ground, rotary, 4 arms, elevated flyover, pavements, markings, zebras.
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
  const concreteMat = useMemo(() => new THREE.MeshStandardMaterial({
    color: '#9a958a', roughness: 0.9,
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
    concreteMat.color.set(night ? '#3f3d38' : '#9a958a');
  }, [night, rain, ratio, asphaltMat, grassMat, pavementMat, groundMat, concreteMat]);

  // Flyover deck segments (follow the elevation profile)
  const deck = useMemo(() => {
    const segs = [];
    for (let x = -190; x < 190; x += 10) {
      const mid = x + 5;
      const e = flyElevation(Math.abs(mid));
      segs.push({ x: mid, e });
    }
    return segs;
  }, []);

  // Lane dashes
  const dashes = useMemo(() => {
    const list = [];
    for (const r of [37, 43]) { // rotary lane separators
      const count = Math.floor((TAU * r) / 7);
      for (let i = 0; i < count; i++) {
        const a = (i / count) * TAU;
        list.push({ x: r * Math.cos(a), y: 0.06, z: r * Math.sin(a), rot: -a });
      }
    }
    for (let k = 0; k < ARM_COUNT; k++) { // arm lane separators
      const a = (k * TAU) / ARM_COUNT;
      for (const lat of [-3.5, 3.5]) {
        for (let rr = ARM_START + 8; rr < ARM_END - 4; rr += 8) {
          list.push({
            x: rr * Math.cos(a) - lat * Math.sin(a),
            y: 0.06,
            z: rr * Math.sin(a) + lat * Math.cos(a),
            rot: Math.PI / 2 - a,
          });
        }
      }
    }
    for (const z of [-3.8, 3.8]) { // flyover deck separators
      for (let x = -180; x < 180; x += 8) {
        list.push({ x, y: flyElevation(Math.abs(x)) + 0.06, z, rot: Math.PI / 2 });
      }
    }
    return list;
  }, []);

  // Zebra crossings across each arm, just before the rotary
  const zebra = useMemo(() => {
    const list = [];
    for (let k = 0; k < ARM_COUNT; k++) {
      const a = (k * TAU) / ARM_COUNT;
      const rr = ARM_START + 13;
      for (let i = -3; i <= 3; i++) {
        const lat = i * 1.9;
        list.push({
          x: rr * Math.cos(a) - lat * Math.sin(a),
          z: rr * Math.sin(a) + lat * Math.cos(a),
          rot: Math.PI / 2 - a,
        });
      }
    }
    return list;
  }, []);

  const dashRef = useRef();
  const zebraRef = useRef();
  useEffect(() => {
    const dummy = new THREE.Object3D();
    dashes.forEach((d, i) => {
      dummy.position.set(d.x, d.y, d.z);
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
        <planeGeometry args={[860, 860]} />
      </mesh>

      {/* rotary island (click target for junction panel) */}
      <mesh
        rotation-x={-Math.PI / 2} position-y={0.09} receiveShadow material={grassMat}
        onClick={(e) => { e.stopPropagation(); onJunctionClick(); }}
      >
        <circleGeometry args={[ISLAND_RADIUS, 48]} />
      </mesh>
      <mesh rotation-x={-Math.PI / 2} position-y={0.1} receiveShadow material={pavementMat}>
        <ringGeometry args={[12, 16, 48]} />
      </mesh>

      {/* rotary carriageway + outer pavement */}
      <mesh rotation-x={-Math.PI / 2} position-y={0.02} receiveShadow material={asphaltMat}>
        <ringGeometry args={[ROTARY_R - ROAD_HALF, ROTARY_R + ROAD_HALF, 96]} />
      </mesh>
      <mesh rotation-x={-Math.PI / 2} position-y={0.04} receiveShadow material={pavementMat}>
        <ringGeometry args={[ROTARY_R + ROAD_HALF, ROTARY_R + ROAD_HALF + 4, 96]} />
      </mesh>

      {/* the four arms */}
      {Array.from({ length: ARM_COUNT }, (_, k) => {
        const a = (k * TAU) / ARM_COUNT;
        const mid = (ARM_START + ARM_END) / 2;
        return (
          <group key={k}>
            <mesh
              position={[mid * Math.cos(a), 0.03, mid * Math.sin(a)]}
              rotation={[-Math.PI / 2, 0, -a + Math.PI / 2]}
              receiveShadow material={asphaltMat}
            >
              <planeGeometry args={[15, ARM_END - ARM_START]} />
            </mesh>
            {/* raised centre median */}
            <mesh
              position={[((ARM_START + 18 + ARM_END) / 2) * Math.cos(a), 0.18,
                         ((ARM_START + 18 + ARM_END) / 2) * Math.sin(a)]}
              rotation-y={Math.PI / 2 - a}
              castShadow material={concreteMat}
            >
              <boxGeometry args={[0.6, 0.36, ARM_END - ARM_START - 22]} />
            </mesh>
          </group>
        );
      })}

      {/* flyover: deck, railings, median, pillars */}
      {deck.map((s, i) => (
        <group key={i} position={[s.x, 0, 0]}>
          <mesh position-y={s.e - 0.35} castShadow receiveShadow material={asphaltMat}>
            <boxGeometry args={[10.4, 0.7, 12.4]} />
          </mesh>
          <mesh position={[0, s.e + 0.45, 6.1]} castShadow material={concreteMat}>
            <boxGeometry args={[10.4, 0.9, 0.3]} />
          </mesh>
          <mesh position={[0, s.e + 0.45, -6.1]} castShadow material={concreteMat}>
            <boxGeometry args={[10.4, 0.9, 0.3]} />
          </mesh>
          <mesh position={[0, s.e + 0.25, 0]} material={concreteMat}>
            <boxGeometry args={[10.4, 0.5, 0.3]} />
          </mesh>
          {s.e > 1.4 && i % 2 === 0 && (
            <mesh position-y={(s.e - 0.7) / 2} castShadow material={concreteMat}>
              <cylinderGeometry args={[1.2, 1.4, s.e - 0.7, 10]} />
            </mesh>
          )}
        </group>
      ))}

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
