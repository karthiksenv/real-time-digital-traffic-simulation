// ═══ CUSTOMIZE THESE ═══
export const CITY = 'New Delhi';
export const JUNCTION_NAME = 'Connaught Place';
export const JUNCTION_LAT = 28.6315;
export const JUNCTION_LNG = 77.2167;

// ═══ LOOK TUNING (named constants, easy to tweak) ═══
export const BLOOM_STRENGTH_DAY = 0.35;
export const BLOOM_STRENGTH_NIGHT = 0.9;
export const SUN_ELEVATION_DEG = 14;   // golden hour
export const SUN_AZIMUTH_DEG = 255;
export const FOG_DENSITY_DAY = 0.0028;
export const FOG_DENSITY_NIGHT = 0.0042;
export const FOG_DENSITY_RAIN = 0.006;

// ═══ SIMULATION ═══
export const VEHICLE_DENSITY = 0.1;    // vehicles per metre of lane (~1300 total)
export const RAIN_COUNT = 5000;
export const TOMTOM_REFRESH_MS = 60000;

// ═══ GEOMETRY (Connaught Place: concentric circles) ═══
export const PARK_RADIUS = 58;
export const RING_INNER = 72;    // Inner Circle road centreline
export const RING_MIDDLE = 132;  // Middle Circle
export const RING_OUTER = 192;   // Outer Circle (Connaught Circus)
export const RADIAL_COUNT = 8;
export const RADIAL_START = 66;
export const RADIAL_END = 262;
export const SIGNAL_CYCLE = 26;  // seconds: rings green 0-14, radials 16-24
