import { useEffect, useMemo, useRef, useState } from 'react';
import { Canvas } from '@react-three/fiber';
import * as THREE from 'three';
import Scene from './scene/Scene.jsx';
import HUD from './ui/HUD.jsx';
import { createSim } from './sim/simulation.js';
import { useTraffic } from './data/useTraffic.js';

export default function App() {
  const [night, setNight] = useState(false);
  const [rain, setRain] = useState(false);
  const [cinematic, setCinematic] = useState(false);
  const [simSpeed, setSimSpeed] = useState(1);
  const [liveEnabled, setLiveEnabled] = useState(true);
  const [selected, setSelected] = useState(false);

  const { reading, ratio, isDemo } = useTraffic(liveEnabled);

  const sim = useMemo(() => createSim(), []);
  const simRef = useRef(sim);

  // live/demo speed ratio drives the whole network's vehicle speeds
  useEffect(() => {
    sim.globalMul = 0.25 + 0.75 * ratio;
  }, [ratio, sim]);

  // HUD stats sampled from the running sim (UI never blocks the loop)
  const [stats, setStats] = useState({
    health: 100, flow: 0, delay: 0, co2: '0.0', fuel: '0.0',
    vehicles: sim.vehicles.length, idling: 0, simRatio: 100,
  });
  useEffect(() => {
    const iv = setInterval(() => {
      const s = sim.stats;
      const fuel = s.idling * 0.75;             // L/hr, modelled idling burn
      setStats({
        health: Math.round(100 * (0.55 * ratio + 0.45 * s.avgSpeedRatio)),
        flow: Math.round(s.flowVph), // single junction: total counted throughput
        delay: Math.round(s.delaySec),
        co2: (fuel * 2.31).toFixed(1),          // kg CO2 per litre petrol ~ 2.31
        fuel: fuel.toFixed(1),
        vehicles: sim.vehicles.length,
        idling: s.idling,
        simRatio: Math.round(s.avgSpeedRatio * 100),
      });
    }, 600);
    return () => clearInterval(iv);
  }, [sim, ratio]);

  return (
    <div className="app">
      <Canvas
        shadows
        dpr={[1, 1.75]}
        camera={{ position: [155, 58, 170], fov: 48, near: 0.5, far: 1600 }}
        gl={{ antialias: true, preserveDrawingBuffer: true }}
        onCreated={({ gl }) => {
          gl.toneMapping = THREE.ACESFilmicToneMapping;
          gl.toneMappingExposure = 1.05;
          gl.outputColorSpace = THREE.SRGBColorSpace;
          gl.shadowMap.type = THREE.PCFSoftShadowMap;
        }}
      >
        <Scene
          sim={sim}
          simRef={simRef}
          night={night}
          rain={rain}
          cinematic={cinematic}
          simSpeed={simSpeed}
          ratio={ratio}
          onJunctionClick={() => setSelected(true)}
        />
      </Canvas>
      <HUD
        stats={stats}
        reading={reading}
        isDemo={isDemo}
        liveEnabled={liveEnabled} setLiveEnabled={setLiveEnabled}
        night={night} setNight={setNight}
        rain={rain} setRain={setRain}
        cinematic={cinematic} setCinematic={setCinematic}
        simSpeed={simSpeed} setSimSpeed={setSimSpeed}
        selected={selected} setSelected={setSelected}
      />
    </div>
  );
}
