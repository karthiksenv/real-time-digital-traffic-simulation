import { useEffect, useMemo, useRef } from 'react';
import * as THREE from 'three';

const TAU = Math.PI * 2;

// Hitech City skyline: the cylindrical Cyber Towers landmark, a long
// Cyber Gateway-style slab, and an instanced field of glass IT towers
// with warm window glows at night.
export default function Buildings({ night }) {
  const { towers, windows } = useMemo(() => {
    const towers = [];
    const windows = [];
    let seed = 11;
    const rand = () => { seed = (seed * 16807) % 2147483647; return seed / 2147483647; };
    const palette = ['#6fa8cc', '#7fb4d6', '#5c88a8', '#8fb0b8', '#9aa8b0', '#b0b8be'];

    for (let i = 0; i < 78; i++) {
      const a = rand() * TAU;
      const r = 135 + rand() * 200;
      const x = r * Math.cos(a), z = r * Math.sin(a);
      // keep both road axes + flyover corridor clear
      if (Math.abs(x) < 28 || Math.abs(z) < 28) continue;
      // leave the Cyber Towers / Gateway plots free
      if (Math.hypot(x - 115, z + 115) < 70 || Math.hypot(x + 170, z - 90) < 110) continue;
      const h = 22 + rand() * rand() * 75;
      const ang = Math.atan2(z, x); // towers face the junction
      const rad = Math.hypot(x, z);
      const b = {
        x, z, rot: -ang,
        w: 14 + rand() * 20, d: 14 + rand() * 18, h,
        color: palette[Math.floor(rand() * palette.length)],
      };
      towers.push(b);
      const rows = Math.min(20, Math.floor(h / 3.6));
      const ca = Math.cos(ang), sa = Math.sin(ang);
      for (let ry = 0; ry < rows; ry++) {
        for (let c = -1; c <= 2; c++) {
          if (rand() < 0.3) continue;
          const fr = rad - b.d / 2 - 0.15; // centre-facing facade
          const lat = (c - 0.5) * (b.w / 4.5);
          windows.push({
            x: fr * ca - lat * sa,
            z: fr * sa + lat * ca,
            y: 2.2 + ry * 3.6, rot: -ang,
          });
        }
      }
    }
    return { towers, windows };
  }, []);

  const towerRef = useRef();
  const winRef = useRef();
  const winMat = useMemo(() => new THREE.MeshBasicMaterial({ color: '#ffb45e' }), []);
  const glassMat = useMemo(() => new THREE.MeshStandardMaterial({
    color: '#7fb4d6', roughness: 0.16, metalness: 0.72,
    emissive: '#9fd0ff', emissiveIntensity: 0,
  }), []);

  useEffect(() => {
    winMat.color.set(night ? '#ffb45e' : '#33414d');
    glassMat.emissiveIntensity = night ? 0.28 : 0;
  }, [night, winMat, glassMat]);

  useEffect(() => {
    const dummy = new THREE.Object3D();
    const col = new THREE.Color();
    towers.forEach((b, i) => {
      dummy.position.set(b.x, b.h / 2, b.z);
      dummy.rotation.set(0, b.rot, 0);
      dummy.scale.set(b.d, b.h, b.w);
      dummy.updateMatrix();
      towerRef.current.setMatrixAt(i, dummy.matrix);
      towerRef.current.setColorAt(i, col.set(b.color));
    });
    towerRef.current.instanceMatrix.needsUpdate = true;
    if (towerRef.current.instanceColor) towerRef.current.instanceColor.needsUpdate = true;

    windows.forEach((w, i) => {
      dummy.position.set(w.x, w.y, w.z);
      dummy.rotation.set(0, w.rot, 0);
      dummy.scale.set(1, 1, 1);
      dummy.updateMatrix();
      winRef.current.setMatrixAt(i, dummy.matrix);
    });
    winRef.current.instanceMatrix.needsUpdate = true;
  }, [towers, windows]);

  return (
    <group>
      {/* instanced glass IT towers */}
      <instancedMesh ref={towerRef} args={[undefined, undefined, towers.length]} castShadow receiveShadow>
        <boxGeometry args={[1, 1, 1]} />
        <meshStandardMaterial roughness={0.25} metalness={0.6} />
      </instancedMesh>
      {/* warm window glows */}
      <instancedMesh ref={winRef} args={[undefined, undefined, windows.length]} material={winMat}>
        <boxGeometry args={[0.25, 1.5, 2.4]} />
      </instancedMesh>

      {/* ── Cyber Towers: the cylindrical landmark, NE plot ── */}
      <group position={[115, 0, -115]}>
        <mesh position-y={23} castShadow receiveShadow material={glassMat}>
          <cylinderGeometry args={[32, 32, 46, 28]} />
        </mesh>
        {/* four white fins marking the quadrant blocks */}
        {[0, 1, 2, 3].map((q) => {
          const a = (q * TAU) / 4 + TAU / 8;
          return (
            <mesh
              key={q}
              position={[Math.cos(a) * 30, 23, Math.sin(a) * 30]}
              rotation-y={-a}
              castShadow
            >
              <boxGeometry args={[6, 47, 2.6]} />
              <meshStandardMaterial color="#e9e6dc" roughness={0.8} />
            </mesh>
          );
        })}
        {/* core + crown */}
        <mesh position-y={26} castShadow>
          <cylinderGeometry args={[9, 9, 54, 16]} />
          <meshStandardMaterial color="#dcd8cc" roughness={0.75} />
        </mesh>
        <mesh position-y={47.5}>
          <torusGeometry args={[32, 0.8, 8, 40]} />
          <meshStandardMaterial color="#c8c4b8" roughness={0.5} metalness={0.6} />
        </mesh>
      </group>

      {/* ── Cyber Gateway-style long glass slab, NW plot ── */}
      <group position={[-170, 0, 90]} rotation-y={0.35}>
        <mesh position-y={17} castShadow receiveShadow material={glassMat}>
          <boxGeometry args={[150, 34, 38]} />
        </mesh>
        <mesh position-y={35.5} castShadow>
          <boxGeometry args={[152, 1.4, 40]} />
          <meshStandardMaterial color="#e9e6dc" roughness={0.8} />
        </mesh>
      </group>
    </group>
  );
}
