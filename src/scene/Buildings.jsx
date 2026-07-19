import { useEffect, useMemo, useRef } from 'react';
import * as THREE from 'three';
import { RADIAL_COUNT } from '../config.js';

const TAU = Math.PI * 2;
const GAP = 0.11; // rad gap at each radial for the spoke roads

// CP's signature white colonnaded Georgian arcades: two annular blocks
// (between Inner-Middle and Middle-Outer circles) built from arc-segment
// boxes + instanced columns, plus a taller varied skyline beyond.
export default function Buildings({ night }) {
  const { blocks, columns, outer, windows } = useMemo(() => {
    const blocks = [];
    const columns = [];
    const outer = [];
    const windows = [];

    const annuli = [
      { r0: 84, r1: 118, h: 13 },   // inner blocks
      { r0: 142, r1: 182, h: 13 },  // middle blocks
    ];
    for (const an of annuli) {
      const mid = (an.r0 + an.r1) / 2;
      const depth = an.r1 - an.r0;
      for (let k = 0; k < RADIAL_COUNT; k++) {
        const a0 = (k * TAU) / RADIAL_COUNT + GAP;
        const a1 = ((k + 1) * TAU) / RADIAL_COUNT - GAP;
        const step = 4.6 / mid; // ~4.6 m facade segments
        for (let a = a0; a < a1; a += step) {
          const w = Math.min(step, a1 - a) * mid + 0.35;
          const ang = a + step / 2;
          blocks.push({
            x: mid * Math.cos(ang), z: mid * Math.sin(ang),
            rot: -ang, w, d: depth, h: an.h,
          });
        }
        // colonnade columns on both curved facades
        for (const face of [an.r0 - 2.2, an.r1 + 2.2]) {
          const cstep = 3.4 / face;
          for (let a = a0 + cstep; a < a1; a += cstep) {
            columns.push({ x: face * Math.cos(a), z: face * Math.sin(a) });
          }
        }
        // arcade canopy slab over the colonnade walkways
        blocks.push(...[an.r0 - 2.2, an.r1 + 2.2].map((face) => {
          const ang = (a0 + a1) / 2;
          return {
            x: face * Math.cos(ang), z: face * Math.sin(ang),
            rot: -ang, w: (a1 - a0) * face, d: 4.6, h: 0.8, y: 7.6, arc: true,
          };
        }));
      }
    }
    // canopy slabs built as arcs would look faceted as one box; split them
    const finalBlocks = [];
    for (const b of blocks) {
      if (!b.arc) { finalBlocks.push(b); continue; }
      const r = Math.hypot(b.x, b.z);
      const angMid = Math.atan2(b.z, b.x);
      const halfArc = b.w / r / 2;
      const step = 4.6 / r;
      for (let a = angMid - halfArc; a < angMid + halfArc; a += step) {
        const ang = a + step / 2;
        finalBlocks.push({
          x: r * Math.cos(ang), z: r * Math.sin(ang), rot: -ang,
          w: step * r + 0.3, d: 4.6, h: 0.8, y: 7.6,
        });
      }
    }

    // outer skyline: varied mid-rise Delhi blocks beyond the Outer Circle
    let seed = 7;
    const rand = () => { seed = (seed * 16807) % 2147483647; return seed / 2147483647; };
    const palette = ['#c9bfae', '#b8a892', '#d3cbb9', '#9e9484', '#c2b49b', '#a89b8a'];
    for (let i = 0; i < 130; i++) {
      const a = rand() * TAU;
      const r = 215 + rand() * 115;
      // keep the radial avenues clear
      const spoke = Math.round((a / TAU) * RADIAL_COUNT) * (TAU / RADIAL_COUNT);
      if (Math.abs(Math.atan2(Math.sin(a - spoke), Math.cos(a - spoke))) < 12 / r && r < 275) continue;
      const h = 12 + rand() * rand() * 38;
      const b = {
        x: r * Math.cos(a), z: r * Math.sin(a), rot: -a,
        w: 10 + rand() * 16, d: 10 + rand() * 14, h,
        color: palette[Math.floor(rand() * palette.length)],
      };
      outer.push(b);
      // warm window quads on the centre-facing facade (glow at night)
      const rows = Math.floor(h / 4);
      for (let ry = 0; ry < rows; ry++) {
        for (let c = -1; c <= 1; c++) {
          if (rand() < 0.35) continue;
          windows.push({
            x: (r - b.d / 2 - 0.15) * Math.cos(a) + c * (b.w / 3.2) * -Math.sin(a),
            z: (r - b.d / 2 - 0.15) * Math.sin(a) + c * (b.w / 3.2) * Math.cos(a),
            y: 2.5 + ry * 4, rot: -a,
          });
        }
      }
    }
    return { blocks: finalBlocks, columns, outer, windows };
  }, []);

  const blockRef = useRef();
  const colRef = useRef();
  const outerRef = useRef();
  const winRef = useRef();
  const winMat = useMemo(() => new THREE.MeshBasicMaterial({ color: '#ffb45e' }), []);

  useEffect(() => {
    winMat.color.set(night ? '#ffb45e' : '#3a3f4a');
  }, [night, winMat]);

  useEffect(() => {
    const dummy = new THREE.Object3D();
    blocks.forEach((b, i) => {
      dummy.position.set(b.x, (b.y ?? 0) + b.h / 2, b.z);
      dummy.rotation.set(0, b.rot, 0);
      dummy.scale.set(b.d, b.h, b.w); // depth along local x (radial), width along z (tangent)
      dummy.updateMatrix();
      blockRef.current.setMatrixAt(i, dummy.matrix);
    });
    blockRef.current.instanceMatrix.needsUpdate = true;

    columns.forEach((c, i) => {
      dummy.position.set(c.x, 3.8, c.z);
      dummy.rotation.set(0, 0, 0);
      dummy.scale.set(1, 1, 1);
      dummy.updateMatrix();
      colRef.current.setMatrixAt(i, dummy.matrix);
    });
    colRef.current.instanceMatrix.needsUpdate = true;

    const col = new THREE.Color();
    outer.forEach((b, i) => {
      dummy.position.set(b.x, b.h / 2, b.z);
      dummy.rotation.set(0, b.rot, 0);
      dummy.scale.set(b.d, b.h, b.w);
      dummy.updateMatrix();
      outerRef.current.setMatrixAt(i, dummy.matrix);
      outerRef.current.setColorAt(i, col.set(b.color));
    });
    outerRef.current.instanceMatrix.needsUpdate = true;
    if (outerRef.current.instanceColor) outerRef.current.instanceColor.needsUpdate = true;

    windows.forEach((w, i) => {
      dummy.position.set(w.x, w.y, w.z);
      dummy.rotation.set(0, w.rot, 0);
      dummy.scale.set(1, 1, 1);
      dummy.updateMatrix();
      winRef.current.setMatrixAt(i, dummy.matrix);
    });
    winRef.current.instanceMatrix.needsUpdate = true;
  }, [blocks, columns, outer, windows]);

  return (
    <group>
      {/* white Georgian arcade blocks */}
      <instancedMesh ref={blockRef} args={[undefined, undefined, blocks.length]} castShadow receiveShadow>
        <boxGeometry args={[1, 1, 1]} />
        <meshStandardMaterial color="#f2ecdd" roughness={0.85} />
      </instancedMesh>
      {/* colonnade columns */}
      <instancedMesh ref={colRef} args={[undefined, undefined, columns.length]} castShadow>
        <cylinderGeometry args={[0.5, 0.55, 7.6, 8]} />
        <meshStandardMaterial color="#f7f2e6" roughness={0.8} />
      </instancedMesh>
      {/* outer skyline */}
      <instancedMesh ref={outerRef} args={[undefined, undefined, outer.length]} castShadow receiveShadow>
        <boxGeometry args={[1, 1, 1]} />
        <meshStandardMaterial roughness={0.95} />
      </instancedMesh>
      {/* warm window glows */}
      <instancedMesh ref={winRef} args={[undefined, undefined, windows.length]} material={winMat}>
        <boxGeometry args={[0.25, 1.6, 2.2]} />
      </instancedMesh>
    </group>
  );
}
