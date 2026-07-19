import { useEffect, useRef, useState } from 'react';
import { JUNCTION_LAT, JUNCTION_LNG, TOMTOM_REFRESH_MS } from '../config.js';

// Baked demo data: gentle time-of-day style oscillation. Only demo state
// ever persists; live TomTom responses are fetched, parsed, rendered and
// discarded (never stored beyond current reading).
function demoReading() {
  const t = Date.now() / 1000;
  const wave = Math.sin(t / 90) * 0.5 + Math.sin(t / 23) * 0.2;
  const freeFlowSpeed = 42;
  const currentSpeed = Math.max(9, Math.round(22 + wave * 9));
  return {
    currentSpeed,
    freeFlowSpeed,
    currentTravelTime: Math.round((520 * freeFlowSpeed) / currentSpeed / 3.6),
    confidence: 0.95,
    roadClosure: false,
    demo: true,
  };
}

export function useTraffic(liveEnabled) {
  const [reading, setReading] = useState(demoReading);
  const [isDemo, setIsDemo] = useState(true);
  const timer = useRef(null);

  useEffect(() => {
    let cancelled = false;
    const key = import.meta.env.VITE_TOMTOM_KEY;

    async function tick() {
      if (!liveEnabled || !key) {
        if (!cancelled) { setReading(demoReading()); setIsDemo(true); }
        return;
      }
      try {
        const url =
          `https://api.tomtom.com/traffic/services/4/flowSegmentData/absolute/10/json` +
          `?key=${key}&point=${JUNCTION_LAT},${JUNCTION_LNG}`;
        const res = await fetch(url);
        if (!res.ok) throw new Error(`HTTP ${res.status}`);
        const json = await res.json();
        const d = json?.flowSegmentData;
        if (!d || typeof d.currentSpeed !== 'number' || typeof d.freeFlowSpeed !== 'number') {
          throw new Error('unexpected payload');
        }
        if (!cancelled) {
          setReading({
            currentSpeed: d.currentSpeed,
            freeFlowSpeed: d.freeFlowSpeed,
            currentTravelTime: typeof d.currentTravelTime === 'number' ? d.currentTravelTime : null,
            confidence: typeof d.confidence === 'number' ? d.confidence : null,
            roadClosure: d.roadClosure === true,
            demo: false,
          });
          setIsDemo(false);
        }
      } catch {
        // FALLBACK RULE: any failure -> silent demo mode. Never break the scene.
        if (!cancelled) { setReading(demoReading()); setIsDemo(true); }
      }
    }

    tick();
    timer.current = setInterval(tick, liveEnabled ? TOMTOM_REFRESH_MS : 15000);
    return () => { cancelled = true; clearInterval(timer.current); };
  }, [liveEnabled]);

  const ratio = reading.freeFlowSpeed > 0
    ? Math.min(1, Math.max(0.12, reading.currentSpeed / reading.freeFlowSpeed))
    : 1;

  return { reading, ratio, isDemo };
}
