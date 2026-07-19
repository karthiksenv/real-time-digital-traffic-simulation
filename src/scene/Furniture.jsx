import { useEffect, useMemo, useRef } from 'react';
import { useFrame } from '@react-three/fiber';
import * as THREE from 'three';
import {
  ISLAND_RADIUS, ROTARY_R, ARM_COUNT, ARM_START, ARM_END,
} from '../config.js';
import { radialGreen } from '../sim/lanes.js';

const TAU = Math.PI * 2;

// Streetlights, arm-entry traffic signals, instanced low-poly trees,
// and a "cyber" sculpture on the rotary island.
export default function Furniture({ night, simRef }) {
  const { lights, trees } = useMemo(() => {
    let seed = 42;
    const rand = () => { seed = (seed * 16807) % 2147483647; return seed / 2147483647; };
    const lights = [];
    for (let i = 0; i < 12; i++) { // around the rotary
      const a = (i / 12) * TAU;
      lights.push({ x: (ROTARY_R + 11) * Math.cos(a), z: (ROTARY_R + 11) * Math.sin(a) });
    }
    for (let k = 0; k < ARM_COUNT; k++) { // along the arms
      const a = (k * TAU) / ARM_COUNT;
      for (let rr = ARM_START + 15; rr < ARM_END; rr += 30) {
        for (const lat of [-9.5, 9.5]) {
          lights.push({
            x: rr * Math.cos(a) - lat * Math.sin(a),
            z: rr * Math.sin(a) + lat * Math.cos(a),
          });
        }
      }
    }
    const trees = [];
    for (let i = 0; i < 20; i++) { // rotary island
      const a = rand() * TAU, r = 18 + rand() * (ISLAND_RADIUS - 22);
      trees.push({ x: r * Math.cos(a), z: r * Math.sin(a), s: 0.7 + rand() * 0.5 });
    }
    for (let i = 0; i < 110; i++) { // avenue greenery along the arms
      const k = Math.floor(rand() * ARM_COUNT);
      const a = (k * TAU) / ARM_COUNT;
      const rr = ARM_START + 12 + rand() * (ARM_END - ARM_START - 20);
      const lat = (12 + rand() * 9) * (rand() > 0.5 ? 1 : -1);
      trees.push({
        x: rr * Math.cos(a) - lat * Math.sin(a),
        z: rr * Math.sin(a) + lat * Math.cos(a),
        s: 0.6 + rand() * 0.5,
      });
    }
    return { lights, trees };
  }, []);

  const lampMat = useMemo(() => new THREE.MeshStandardMaterial({
    color: '#fff2cf', emissive: '#ffca6a', emissiveIntensity: 0.15,
  }), []);
  const orbMat = useMemo(() => new THREE.MeshStandardMaterial({
    color: '#bfe8e2', emissive: '#3fd8c8', emissiveIntensity: 0.2,
  }), []);
  useEffect(() => {
    lampMat.emissiveIntensity = night ? 3.2 : 0.15;
    orbMat.emissiveIntensity = night ? 2.4 : 0.2;
  }, [night, lampMat, orbMat]);

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

  // Signals face inbound traffic at each rotary entry
  const signalDefs = useMemo(() => {
    const defs = [];
    for (let k = 0; k < ARM_COUNT; k++) {
      const a = (k * TAU) / ARM_COUNT;
      const rr = ARM_START + 7;
      const lat = -8.8; // inbound side (left-hand traffic)
      defs.push({
        x: rr * Math.cos(a) - lat * Math.sin(a),
        z: rr * Math.sin(a) + lat * Math.cos(a),
        rot: Math.PI / 2 - a,
      });
    }
    return defs;
  }, []);
  const redMats = useRef([]);
  const greenMats = useRef([]);

  useFrame(() => {
    const t = simRef.current ? simRef.current.t : 0;
    const go = radialGreen(t); // arm phase drives these heads
    for (const m of redMats.current) if (m) m.emissiveIntensity = go ? 0.05 : 2.6;
    for (const m of greenMats.current) if (m) m.emissiveIntensity = go ? 2.6 : 0.05;
  });

  return (
    <group>
      <instancedMesh ref={poleRef} args={[undefined, undefined, lights.length]} castShadow>
        <cylinderGeometry args={[0.12, 0.18, 7.5, 6]} />
        <meshStandardMaterial color="#3b3f45" roughness={0.6} metalness={0.6} />
      </instancedMesh>
      <instancedMesh ref={lampRef} args={[undefined, undefined, lights.length]} material={lampMat}>
        <sphereGeometry args={[0.38, 10, 8]} />
      </instancedMesh>

      <instancedMesh ref={trunkRef} args={[undefined, undefined, trees.length]} castShadow>
        <cylinderGeometry args={[0.22, 0.32, 2.8, 6]} />
        <meshStandardMaterial color="#5a4632" roughness={1} />
      </instancedMesh>
      <instancedMesh ref={canopyRef} args={[undefined, undefined, trees.length]} castShadow>
        <coneGeometry args={[2.3, 5.2, 7]} />
        <meshStandardMaterial roughness={1} />
      </instancedMesh>

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

      {/* rotary island sculpture: steel arc + floating orb */}
      <group>
        <mesh position-y={1} castShadow>
          <cylinderGeometry args={[3.2, 3.8, 2, 16]} />
          <meshStandardMaterial color="#8f948c" roughness={0.8} />
        </mesh>
        <mesh position-y={2} castShadow>
          <torusGeometry args={[9, 0.7, 8, 28, Math.PI]} />
          <meshStandardMaterial color="#aab2b8" roughness={0.3} metalness={0.85} />
        </mesh>
        <mesh position-y={12.5} castShadow material={orbMat}>
          <sphereGeometry args={[2.6, 20, 16]} />
        </mesh>
      </group>
    </group>
  );
}
