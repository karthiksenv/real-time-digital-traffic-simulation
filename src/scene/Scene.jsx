import { useMemo } from 'react';
import { OrbitControls, Sky, Stars } from '@react-three/drei';
import Environment from './Environment.jsx';
import Buildings from './Buildings.jsx';
import Furniture from './Furniture.jsx';
import Vehicles from './Vehicles.jsx';
import Rain from './Rain.jsx';
import Effects from './Effects.jsx';
import {
  SUN_ELEVATION_DEG, SUN_AZIMUTH_DEG,
  FOG_DENSITY_DAY, FOG_DENSITY_NIGHT, FOG_DENSITY_RAIN,
} from '../config.js';

export default function Scene({ sim, simRef, night, rain, cinematic, simSpeed, ratio, onJunctionClick }) {
  const sunPos = useMemo(() => {
    const el = ((rain ? 38 : SUN_ELEVATION_DEG) * Math.PI) / 180;
    const az = (SUN_AZIMUTH_DEG * Math.PI) / 180;
    return [
      Math.cos(el) * Math.cos(az) * 320,
      Math.sin(el) * 320,
      Math.cos(el) * Math.sin(az) * 320,
    ];
  }, [rain]);

  const fogDensity = night ? FOG_DENSITY_NIGHT : rain ? FOG_DENSITY_RAIN : FOG_DENSITY_DAY;
  const fogColor = night ? '#080c16' : rain ? '#8e99a3' : '#e9c497';
  const bg = night ? '#05070f' : rain ? '#7f8a94' : '#dcb488';

  return (
    <>
      <color attach="background" args={[bg]} />
      <fogExp2 attach="fog" args={[fogColor, fogDensity]} />

      {/* sky */}
      {!night && !rain && (
        <Sky sunPosition={sunPos} turbidity={7} rayleigh={2.6} mieCoefficient={0.02} mieDirectionalG={0.85} />
      )}
      {night && <Stars radius={380} depth={60} count={2600} factor={5} fade speed={0.6} />}

      {/* golden-hour sun / moon / overcast key light */}
      <directionalLight
        position={night ? [120, 180, -80] : sunPos}
        intensity={night ? 0.28 : rain ? 0.85 : 2.3}
        color={night ? '#5d7290' : rain ? '#aeb9c2' : '#ffb763'}
        castShadow
        shadow-mapSize={[2048, 2048]}
        shadow-camera-left={-260}
        shadow-camera-right={260}
        shadow-camera-top={260}
        shadow-camera-bottom={-260}
        shadow-camera-far={800}
        shadow-bias={-0.0004}
      />
      {/* warm-ground / cool-sky ambient */}
      <hemisphereLight
        args={night ? ['#1c2740', '#0c0f14', 0.35] : rain ? ['#9fb0bd', '#4c4a42', 0.6] : ['#7fa8d4', '#a8743c', 0.55]}
      />
      <ambientLight intensity={night ? 0.06 : 0.12} />

      <Environment night={night} rain={rain} ratio={ratio} onJunctionClick={onJunctionClick} />
      <Buildings night={night} />
      <Furniture night={night} simRef={simRef} />
      <Vehicles sim={sim} night={night} simSpeed={simSpeed} />
      {rain && <Rain />}

      <Effects night={night} rain={rain} />

      {/* cinematic street-level / low-aerial orbit — never top-down */}
      <OrbitControls
        makeDefault
        target={[0, 4, 0]}
        enableDamping
        dampingFactor={0.07}
        minDistance={35}
        maxDistance={430}
        minPolarAngle={0.55}
        maxPolarAngle={1.5}
        autoRotate={cinematic}
        autoRotateSpeed={0.45}
      />
    </>
  );
}
