// ═══ CUSTOMIZE THESE ═══
export const CITY = 'Hyderabad';
export const JUNCTION_NAME = 'Hitech City · Cyber Towers Jn';
export const JUNCTION_LAT = 17.4504;
export const JUNCTION_LNG = 78.3809;

// ═══ LOOK TUNING (named constants, easy to tweak) ═══
export const BLOOM_STRENGTH_DAY = 0.35;
export const BLOOM_STRENGTH_NIGHT = 0.9;
export const SUN_ELEVATION_DEG = 14;   // golden hour
export const SUN_AZIMUTH_DEG = 255;
export const FOG_DENSITY_DAY = 0.0028;
export const FOG_DENSITY_NIGHT = 0.0042;
export const FOG_DENSITY_RAIN = 0.006;

// ═══ SIMULATION ═══
export const VEHICLE_DENSITY = 0.13;   // vehicles per metre of lane (~1000 total)
export const RAIN_COUNT = 5000;
export const TOMTOM_REFRESH_MS = 60000;

// ═══ GEOMETRY (Cyber Towers junction: rotary + 4 arms + E-W flyover) ═══
export const ISLAND_RADIUS = 30;   // central rotary island
export const ROTARY_R = 40;        // rotary centreline
export const ARM_COUNT = 4;        // N/S/E/W approach arms
export const ARM_START = 50;
export const ARM_END = 320;
export const FLYOVER_HALF = 320;   // flyover extent along the E-W axis
export const FLYOVER_H = 8.5;      // deck height
export const SIGNAL_CYCLE = 26;    // seconds: rotary green 0-15, arms 16-25
