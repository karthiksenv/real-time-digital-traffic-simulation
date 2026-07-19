import {
  EffectComposer, Bloom, N8AO, DepthOfField, Vignette, BrightnessContrast, HueSaturation,
} from '@react-three/postprocessing';
import { BLOOM_STRENGTH_DAY, BLOOM_STRENGTH_NIGHT } from '../config.js';

// The "pro look": soft AO, gentle bloom on emissives, shallow DoF pinned
// to the junction, vignette + a warm grade.
export default function Effects({ night, rain }) {
  return (
    <EffectComposer multisampling={0}>
      <N8AO aoRadius={2.2} intensity={night ? 1.6 : 1.15} distanceFalloff={1} quality="performance" />
      <Bloom
        intensity={night ? BLOOM_STRENGTH_NIGHT : BLOOM_STRENGTH_DAY}
        luminanceThreshold={night ? 0.22 : 0.82}
        luminanceSmoothing={0.3}
        mipmapBlur
      />
      <DepthOfField target={[0, 3, 0]} focalLength={0.012} bokehScale={2.2} height={480} />
      <BrightnessContrast brightness={night ? -0.02 : 0.02} contrast={0.08} />
      <HueSaturation saturation={rain ? -0.12 : 0.14} hue={0} />
      <Vignette eskil={false} offset={0.22} darkness={night ? 0.75 : 0.55} />
    </EffectComposer>
  );
}
