import { useMemo, useRef } from 'react';
import { useFrame } from '@react-three/fiber';
import { RAIN_COUNT } from '../config.js';

const AREA = 560;
const TOP = 110;

export default function Rain() {
  const ref = useRef();
  const positions = useMemo(() => {
    const p = new Float32Array(RAIN_COUNT * 3);
    for (let i = 0; i < RAIN_COUNT; i++) {
      p[i * 3] = (Math.random() - 0.5) * AREA;
      p[i * 3 + 1] = Math.random() * TOP;
      p[i * 3 + 2] = (Math.random() - 0.5) * AREA;
    }
    return p;
  }, []);

  useFrame((_, delta) => {
    const arr = ref.current.geometry.attributes.position.array;
    const fall = 58 * Math.min(delta, 0.05);
    for (let i = 0; i < RAIN_COUNT; i++) {
      arr[i * 3 + 1] -= fall * (0.8 + (i % 5) * 0.1);
      if (arr[i * 3 + 1] < 0.2) arr[i * 3 + 1] = TOP;
    }
    ref.current.geometry.attributes.position.needsUpdate = true;
  });

  return (
    <points ref={ref} frustumCulled={false}>
      <bufferGeometry>
        <bufferAttribute attach="attributes-position" args={[positions, 3]} />
      </bufferGeometry>
      <pointsMaterial
        color="#aeb9c6" size={0.32} sizeAttenuation transparent opacity={0.55} depthWrite={false}
      />
    </points>
  );
}
