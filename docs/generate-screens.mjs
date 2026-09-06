// Generates the README preview screens (docs/screens/*.svg).
// These are illustrative SVG mockups drawn from the app's actual palette,
// HUD layout and scene composition — not captures of a live run.
// Regenerate with: node docs/generate-screens.mjs
import { writeFileSync, mkdirSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

const OUT = join(dirname(fileURLToPath(import.meta.url)), 'screens');
mkdirSync(OUT, { recursive: true });

const PAL = {
  day: {
    sky: ['#e8b06a', '#f2c98e', '#f7d8a4'], ground: '#8a7c64', lip: '#9b8d74',
    asphalt: '#3a3b41', tintOp: 0.32, grass: '#4d7a3d', pave: '#b7b1a2',
    tA: '#7fb4d6', tB: '#a8ccdf', tC: '#6aa2c4', warm: '#e8c493', fin: '#efece1', cap: '#cfe0ea',
    gw: '#85b2cf', gwLine: '#6d9cbb', gwTop: '#e9e6dc',
    m1: '#8ba3b8', m2: '#93a8b5', m3: '#a3b3bd', far: ['#c9a884', '#c2a281', '#b89877'],
    dash: '#d8d4c8', treeA: '#4d7a3d', treeB: '#3f6631', lamp: '#ffe9b8',
    vig: 0.5, health: 47, healthW: 100, flow: '10,031', delay: 92, co2: '244.4', fuel: '105.8',
  },
  night: {
    sky: ['#04070f', '#0a1120', '#101b30'], ground: '#17181d', lip: '#1d2126',
    asphalt: '#1d2026', tintOp: 0.12, grass: '#1e3320', pave: '#4c4a45',
    tA: '#22384c', tB: '#2c4258', tC: '#182a3a', warm: '#22384c', fin: '#383e46', cap: '#2c3946',
    gw: '#1e3143', gwLine: '#16273a', gwTop: '#4c4a45',
    m1: '#1b2733', m2: '#202c38', m3: '#242f3a', far: ['#131c28', '#16202c', '#101823'],
    dash: '#8e8b80', treeA: '#24401f', treeB: '#1c3319', lamp: '#fff2cf',
    vig: 0.68, health: 52, healthW: 110, flow: '11,480', delay: 78, co2: '189.2', fuel: '81.9',
  },
  rain: {
    sky: ['#6d7883', '#7f8a94', '#8b95a0'], ground: '#565349', lip: '#5f5c50',
    asphalt: '#1f2226', tintOp: 0.15, grass: '#3c5c33', pave: '#8a867c',
    tA: '#5c7484', tB: '#6c8492', tC: '#4c6474', warm: '#5c7484', fin: '#b8b4aa', cap: '#90a4b0',
    gw: '#4f6b80', gwLine: '#405a6e', gwTop: '#c8c4ba',
    m1: '#6e7f8b', m2: '#76858f', m3: '#7e8b94', far: ['#7e8b96', '#75828d', '#6d7a85'],
    dash: '#c8c4ba', treeA: '#3c5c33', treeB: '#31502b', lamp: '#ffe9b8',
    vig: 0.55, health: 38, healthW: 81, flow: '8,214', delay: 104, co2: '297.5', fuel: '128.8',
  },
};

const stars = () => {
  let s = '', x = 37;
  for (let i = 0; i < 90; i++) {
    x = (x * 1103515245 + 12345) % 2147483647;
    const px = x % 1280, py = (x >> 8) % 260, r = 0.6 + ((x >> 16) % 10) / 10;
    s += `<circle cx="${px}" cy="${py}" r="${r.toFixed(1)}" fill="#cfd8e8" opacity="${(0.3 + ((x >> 4) % 50) / 100).toFixed(2)}"/>`;
  }
  return s;
};

const windowGrid = (x0, y0, x1, y1, step, op) => {
  let s = '';
  for (let y = y0; y < y1; y += step)
    for (let x = x0; x < x1; x += step * 1.6)
      if (((x * 7 + y * 13) % 11) > 3)
        s += `<rect x="${x}" y="${y}" width="${step * 0.8}" height="${step * 0.55}" fill="#ffb45e" opacity="${op}"/>`;
  return s;
};

const glow = (cx, cy, c = '#fff2cf') =>
  `<circle cx="${cx}" cy="${cy}" r="18" fill="${c}" opacity="0.12"/>` +
  `<circle cx="${cx}" cy="${cy}" r="10" fill="${c}" opacity="0.28"/>` +
  `<circle cx="${cx}" cy="${cy}" r="5" fill="${c}"/>`;

function scene(mode) {
  const P = PAL[mode];
  const night = mode === 'night', rain = mode === 'rain';
  const btn = (x, y, w, label, on) =>
    `<rect x="${x}" y="${y}" width="${w}" height="${w > 60 ? 26 : 24}" rx="6" fill="${on ? '#3c2a08' : '#0d1118'}" opacity="0.88" stroke="${on ? '#ffbe5a' : '#8caad2'}" stroke-opacity="${on ? 0.6 : 0.25}"/>` +
    `<text x="${x + w / 2}" y="${y + (w > 60 ? 17 : 16)}" fill="${on ? '#ffd98a' : '#cfd6de'}" text-anchor="middle">${label}</text>`;
  const metric = (y, label, val, unit) =>
    `<text x="34" y="${y}" font-size="8" fill="#7d8896" letter-spacing="1">${label}</text>` +
    `<text x="34" y="${y + 18}" font-size="16" fill="#ffd98a">${val}<tspan font-size="10" fill="#9aa4af"> ${unit}</tspan></text>`;

  return `<svg viewBox="0 0 1280 720" xmlns="http://www.w3.org/2000/svg" font-family="ui-monospace, 'Cascadia Mono', Consolas, monospace">
<defs>
  <linearGradient id="sky" x1="0" y1="0" x2="0" y2="1">
    <stop offset="0" stop-color="${P.sky[0]}"/><stop offset="0.7" stop-color="${P.sky[1]}"/><stop offset="1" stop-color="${P.sky[2]}"/>
  </linearGradient>
  <radialGradient id="vig" cx="0.5" cy="0.52" r="0.75">
    <stop offset="0.55" stop-color="#000" stop-opacity="0"/><stop offset="1" stop-color="${night ? '#000208' : '#1a0e06'}" stop-opacity="${P.vig}"/>
  </radialGradient>
  <linearGradient id="hbar" x1="0" y1="0" x2="1" y2="0">
    <stop offset="0" stop-color="#d9534f"/><stop offset="0.6" stop-color="#f0ad4e"/><stop offset="1" stop-color="#7bc47f"/>
  </linearGradient>
  <pattern id="rainp" width="26" height="34" patternUnits="userSpaceOnUse" patternTransform="rotate(12)">
    <line x1="4" y1="0" x2="4" y2="20" stroke="#cfd8e2" stroke-width="1.2"/>
    <line x1="17" y1="12" x2="17" y2="30" stroke="#cfd8e2" stroke-width="1"/>
  </pattern>
</defs>

<rect width="1280" height="300" fill="url(#sky)"/>
${night ? stars() : ''}
${!night && !rain ? '<circle cx="230" cy="288" r="200" fill="#ffd9a0" opacity="0.5"/><circle cx="230" cy="288" r="60" fill="#ffe9c4" opacity="0.9"/>' : ''}
${rain ? '<ellipse cx="300" cy="70" rx="260" ry="46" fill="#6d7883" opacity="0.8"/><ellipse cx="800" cy="40" rx="300" ry="52" fill="#65707b" opacity="0.7"/><ellipse cx="1150" cy="90" rx="220" ry="40" fill="#6d7883" opacity="0.75"/>' : ''}

<g opacity="0.85">
  <rect x="20" y="242" width="46" height="58" fill="${P.far[0]}"/>
  <rect x="430" y="252" width="60" height="48" fill="${P.far[1]}"/>
  <rect x="512" y="238" width="34" height="62" fill="${P.far[2]}"/>
  <rect x="700" y="248" width="52" height="52" fill="${P.far[0]}"/>
  <rect x="1130" y="236" width="44" height="64" fill="${P.far[2]}"/>
  <rect x="1196" y="256" width="60" height="44" fill="${P.far[1]}"/>
  ${night ? windowGrid(24, 250, 62, 296, 8, 0.5) + windowGrid(1134, 244, 1170, 296, 8, 0.5) : ''}
</g>

<rect y="300" width="1280" height="420" fill="${P.ground}"/>
<rect y="300" width="1280" height="26" fill="${P.lip}"/>
${rain ? '<rect y="286" width="1280" height="36" fill="#9aa4ad" opacity="0.5"/>' : ''}

<rect x="380" y="258" width="72" height="180" fill="${P.m1}"/>
<rect x="700" y="248" width="92" height="196" fill="${P.m2}"/>
<rect x="806" y="278" width="64" height="166" fill="${P.m3}"/>
${night ? windowGrid(704, 256, 788, 440, 11, 0.55) + windowGrid(384, 266, 448, 434, 11, 0.45) : ''}

<rect x="55" y="335" width="300" height="130" fill="${P.gw}"/>
<g stroke="${P.gwLine}" stroke-width="1.5">
  ${[352, 368, 384, 400, 416, 432, 448].map((y) => `<line x1="55" y1="${y}" x2="355" y2="${y}"/>`).join('')}
</g>
${!night && !rain ? '<rect x="72" y="340" width="30" height="120" fill="#f0c890" opacity="0.45"/>' : ''}
${night ? windowGrid(60, 340, 350, 462, 12, 0.6) : ''}
<rect x="50" y="327" width="310" height="10" fill="${P.gwTop}"/>

<g>
  <rect x="915" y="190" width="190" height="265" fill="${P.tA}"/>
  ${!night && !rain ? `<rect x="930" y="190" width="26" height="265" fill="${P.warm}" opacity="0.55"/>` : ''}
  <rect x="968" y="190" width="20" height="265" fill="${P.tB}"/>
  <rect x="1032" y="190" width="18" height="265" fill="${P.tC}"/>
  <rect x="1064" y="190" width="22" height="265" fill="${P.tB}"/>
  ${night ? windowGrid(920, 196, 1100, 450, 12, 0.6) : ''}
  <rect x="940" y="185" width="14" height="270" fill="${P.fin}"/>
  <rect x="1003" y="185" width="14" height="270" fill="${P.fin}"/>
  <rect x="1066" y="185" width="14" height="270" fill="${P.fin}"/>
  <ellipse cx="1010" cy="190" rx="95" ry="26" fill="${P.cap}"/>
  <ellipse cx="1010" cy="190" rx="95" ry="26" fill="none" stroke="#c8c4b8" stroke-width="3" opacity="${night ? 0.4 : 1}"/>
  <rect x="995" y="148" width="30" height="44" fill="${night ? '#3a4048' : '#e5e1d4'}"/>
</g>

<polygon points="0,486 1280,486 1280,540 0,540" fill="${P.asphalt}"/>
<polygon points="0,486 1280,486 1280,540 0,540" fill="#4d2f26" opacity="${P.tintOp}"/>

<ellipse cx="620" cy="520" rx="340" ry="120" fill="${P.asphalt}"/>
<ellipse cx="620" cy="520" rx="340" ry="120" fill="#4d2f26" opacity="${P.tintOp * 0.9}"/>
<ellipse cx="620" cy="520" rx="305" ry="107" fill="none" stroke="${P.dash}" stroke-width="2" stroke-dasharray="14 18" opacity="0.7"/>
<ellipse cx="620" cy="520" rx="255" ry="90" fill="none" stroke="${P.dash}" stroke-width="2" stroke-dasharray="14 18" opacity="0.7"/>
<ellipse cx="620" cy="514" rx="176" ry="64" fill="${P.pave}"/>
<ellipse cx="620" cy="510" rx="170" ry="60" fill="${P.grass}"/>
<ellipse cx="620" cy="512" rx="75" ry="26" fill="${P.pave}" opacity="0.9"/>

<path d="M 585 505 A 35 30 0 0 1 655 505" fill="none" stroke="#aab2b8" stroke-width="7"/>
${night ? '<circle cx="620" cy="468" r="16" fill="#3fd8c8" opacity="0.2"/><circle cx="620" cy="468" r="8" fill="#7fe8dc"/>' : '<circle cx="620" cy="468" r="8" fill="#bfe8e2"/>'}
<g fill="${P.treeB}">
  <ellipse cx="512" cy="492" rx="16" ry="12"/><ellipse cx="540" cy="502" rx="12" ry="9"/>
  <ellipse cx="712" cy="490" rx="15" ry="11"/><ellipse cx="736" cy="500" rx="11" ry="9"/>
  <ellipse cx="620" cy="548" rx="14" ry="10"/>
</g>

<polygon points="598,318 642,318 668,462 572,462" fill="${P.asphalt}"/>
<line x1="620" y1="330" x2="620" y2="450" stroke="${P.dash}" stroke-width="2" stroke-dasharray="8 12" opacity="0.6"/>

<polygon points="500,632 740,632 880,720 360,720" fill="${P.asphalt}"/>
<polygon points="500,632 740,632 880,720 360,720" fill="#4d2f26" opacity="${P.tintOp}"/>
<line x1="620" y1="640" x2="620" y2="720" stroke="#e6e2d6" stroke-width="4" opacity="${night ? 0.6 : 1}"/>
<g fill="#e6e2d6" opacity="${night ? 0.55 : 0.9}">
  <rect x="522" y="614" width="196" height="5"/>
  <rect x="516" y="622" width="208" height="5"/>
  <rect x="510" y="630" width="220" height="5"/>
</g>

<path d="M -10 456 Q 640 388 1290 456 L 1290 432 Q 640 364 -10 432 Z" fill="${night ? '#232529' : '#2e2f35'}"/>
<path d="M -10 432 Q 640 364 1290 432" fill="none" stroke="${night ? '#5c584e' : '#b8b4a8'}" stroke-width="3"/>
<path d="M -10 438 Q 640 370 1290 438" fill="none" stroke="${P.dash}" stroke-width="1.5" stroke-dasharray="10 14" opacity="0.7"/>
<g fill="${night ? '#4a463e' : '#8f8a80'}">
  <polygon points="176,446 204,446 208,558 172,558"/>
  <polygon points="356,432 384,432 388,548 352,548"/>
  <polygon points="876,432 904,432 908,548 872,548"/>
  <polygon points="1056,446 1084,446 1088,558 1052,558"/>
</g>

<g>
  <rect x="120" y="414" width="26" height="9" rx="2" fill="#e8e8ea"/>
  <rect x="300" y="402" width="26" height="9" rx="2" fill="#b8bcc2"/>
  <rect x="470" y="386" width="38" height="10" rx="2" fill="#e2711d"/>
  <rect x="660" y="382" width="26" height="9" rx="2" fill="#f2c81e"/>
  <rect x="850" y="394" width="26" height="9" rx="2" fill="#e8e8ea"/>
  <rect x="1030" y="408" width="26" height="9" rx="2" fill="#2f3338"/>
  ${night ? '<circle cx="148" cy="418" r="2.5" fill="#fff6d8"/><circle cx="328" cy="406" r="2.5" fill="#fff6d8"/><circle cx="119" cy="418" r="2" fill="#ff5a4a"/><circle cx="847" cy="398" r="2" fill="#ff5a4a"/><circle cx="1058" cy="412" r="2.5" fill="#fff6d8"/>' : ''}
</g>

<g>
  <rect x="318" y="540" width="30" height="12" rx="2" fill="#e8e8ea" transform="rotate(-18 333 546)"/>
  <rect x="398" y="572" width="30" height="12" rx="2" fill="#f2c81e" transform="rotate(-10 413 578)"/>
  <rect x="488" y="596" width="30" height="12" rx="2" fill="#d5d8dc" transform="rotate(-5 503 602)"/>
  <rect x="742" y="594" width="30" height="12" rx="2" fill="#3f8a2f" transform="rotate(6 757 600)"/>
  <rect x="838" y="570" width="44" height="13" rx="2" fill="#e2711d" transform="rotate(14 860 576)"/>
  <rect x="908" y="540" width="30" height="12" rx="2" fill="#e8e8ea" transform="rotate(22 923 546)"/>
  <rect x="500" y="428" width="22" height="8" rx="2" fill="#b8bcc2"/>
  <rect x="742" y="426" width="22" height="8" rx="2" fill="#e8e8ea"/>
</g>

<g>
  <rect x="556" y="648" width="34" height="13" rx="2" fill="#e8e8ea"/>
  <rect x="552" y="664" width="36" height="14" rx="2" fill="#f2c81e"/>
  <rect x="548" y="681" width="38" height="15" rx="3" fill="#d5d8dc"/>
  <rect x="543" y="699" width="41" height="17" rx="3" fill="#7a1f1f"/>
  <rect x="596" y="655" width="10" height="12" rx="2" fill="#2f3338"/>
  <rect x="598" y="674" width="11" height="13" rx="2" fill="#3a3f45"/>
  <rect x="648" y="660" width="38" height="15" rx="3" fill="#e8e8ea"/>
  <rect x="668" y="700" width="46" height="18" rx="3" fill="#3f7d3a"/>
  ${night ? '<circle cx="654" cy="676" r="3" fill="#fff6d8"/><circle cx="680" cy="676" r="3" fill="#fff6d8"/><polygon points="652,678 682,678 694,720 640,720" fill="#fff2cf" opacity="0.14"/><circle cx="560" cy="646" r="2.5" fill="#ff5a4a"/><circle cx="586" cy="646" r="2.5" fill="#ff5a4a"/>' : ''}
</g>

<g stroke="#3b3f45" stroke-width="3">
  <line x1="395" y1="652" x2="395" y2="596"/><line x1="845" y1="652" x2="845" y2="596"/>
  <line x1="292" y1="546" x2="292" y2="498"/><line x1="948" y1="546" x2="948" y2="498"/>
</g>
${night
  ? glow(395, 594) + glow(845, 594) + glow(292, 496) + glow(948, 496) +
    '<ellipse cx="395" cy="650" rx="34" ry="10" fill="#ffca6a" opacity="0.12"/><ellipse cx="845" cy="650" rx="34" ry="10" fill="#ffca6a" opacity="0.12"/>'
  : `<g fill="${P.lamp}"><circle cx="395" cy="594" r="5"/><circle cx="845" cy="594" r="5"/><circle cx="292" cy="496" r="4"/><circle cx="948" cy="496" r="4"/></g>`}
${rain ? '<rect x="388" y="600" width="14" height="52" fill="#fff2cf" opacity="0.1"/><rect x="838" y="600" width="14" height="52" fill="#fff2cf" opacity="0.1"/><rect x="546" y="666" width="90" height="50" fill="#cfd8e2" opacity="0.07"/>' : ''}

<line x1="722" y1="640" x2="722" y2="592" stroke="#2c2f33" stroke-width="4"/>
<rect x="715" y="576" width="14" height="22" rx="3" fill="#17181a"/>
${night ? '<circle cx="722" cy="583" r="9" fill="#ff2a1a" opacity="0.3"/>' : ''}
<circle cx="722" cy="583" r="4" fill="#ff2a1a"/>
<circle cx="722" cy="592" r="4" fill="#123a16"/>

<g>
  <rect x="418" y="620" width="5" height="16" fill="#5a4632"/><ellipse cx="420" cy="610" rx="17" ry="14" fill="${P.treeA}"/>
  <rect x="836" y="622" width="5" height="16" fill="#5a4632"/><ellipse cx="838" cy="612" rx="16" ry="13" fill="${P.treeB}"/>
  <rect x="240" y="552" width="4" height="12" fill="#5a4632"/><ellipse cx="242" cy="544" rx="12" ry="10" fill="${P.treeA}"/>
  <rect x="1010" y="552" width="4" height="12" fill="#5a4632"/><ellipse cx="1012" cy="544" rx="12" ry="10" fill="${P.treeB}"/>
</g>

${rain ? '<rect width="1280" height="720" fill="url(#rainp)" opacity="0.4"/><rect width="1280" height="720" fill="#8b95a0" opacity="0.1"/>' : ''}
${!night && !rain ? '<rect width="1280" height="720" fill="#ff9c4d" opacity="0.07"/>' : ''}
${night ? '<rect width="1280" height="720" fill="#0a1020" opacity="0.18"/>' : ''}
<rect width="1280" height="720" fill="url(#vig)"/>

<g>
  <rect x="20" y="18" width="240" height="248" rx="10" fill="#080b12" opacity="0.85"/>
  <rect x="20" y="18" width="240" height="248" rx="10" fill="none" stroke="#8caad2" stroke-opacity="0.25"/>
  <text x="34" y="40" font-size="12" font-weight="bold" fill="#f0e6d2">HITECH CITY · CYBER TOWERS JN</text>
  <text x="34" y="54" font-size="8" fill="#7d8896" letter-spacing="1.5">DIGITAL TWIN — DEMO DATA</text>
  <text x="34" y="76" font-size="8" fill="#7d8896" letter-spacing="1">NETWORK HEALTH</text>
  <text x="34" y="94" font-size="16" fill="#ffd98a">${P.health}<tspan font-size="10" fill="#9aa4af">/100</tspan></text>
  <rect x="34" y="100" width="212" height="4" rx="2" fill="#2a2f38"/>
  <rect x="34" y="100" width="${P.healthW}" height="4" rx="2" fill="url(#hbar)"/>
  ${metric(122, 'AVG JUNCTION FLOW', P.flow, 'veh/hr')}
  ${metric(162, 'AVG DELAY / VEHICLE', P.delay, 's')}
  ${metric(202, 'IDLING CO2', P.co2, 'kg/hr')}
  <text x="34" y="231" font-size="7" font-style="italic" fill="#5f6a76">modelled estimate</text>
  <text x="34" y="248" font-size="8" fill="#7d8896" letter-spacing="1">IDLING FUEL</text>
  <text x="140" y="248" font-size="12" fill="#ffd98a">${P.fuel}<tspan font-size="9" fill="#9aa4af"> L/hr</tspan></text>
</g>

<g font-size="10" letter-spacing="1">
  ${btn(1112, 18, 148, 'DEMO', true)}
  ${btn(1112, 50, 148, 'NIGHT', night)}
  ${btn(1112, 82, 148, 'RAIN', rain)}
  ${btn(1112, 114, 148, 'CINEMATIC', false)}
  ${btn(1112, 146, 46, '1×', true)}
  ${btn(1163, 146, 46, '10×', false)}
  ${btn(1214, 146, 46, '60×', false)}
</g>

<rect x="430" y="676" width="420" height="26" rx="6" fill="#3c2a08" opacity="0.9" stroke="#ffbe5a" stroke-opacity="0.4"/>
<text x="640" y="693" font-size="10" text-anchor="middle" fill="#ffd98a">Showing demo data — add your TomTom key for live traffic</text>
<text x="24" y="706" font-size="8" fill="#9aa4af" opacity="0.85">drag to orbit · scroll to zoom · click the rotary island for junction stats</text>
</svg>`;
}

function hero() {
  const P = PAL.night;
  return `<svg viewBox="0 0 1280 400" xmlns="http://www.w3.org/2000/svg" font-family="ui-monospace, 'Cascadia Mono', Consolas, monospace">
<defs>
  <linearGradient id="hsky" x1="0" y1="0" x2="0" y2="1">
    <stop offset="0" stop-color="#04070f"/><stop offset="0.75" stop-color="#0c1424"/><stop offset="1" stop-color="#152238"/>
  </linearGradient>
</defs>
<rect width="1280" height="400" fill="url(#hsky)"/>
${stars()}
<g opacity="0.9">
  <rect x="40" y="252" width="70" height="118" fill="#131c28"/>
  <rect x="150" y="282" width="52" height="88" fill="#16202c"/>
  <rect x="1080" y="262" width="60" height="108" fill="#131c28"/>
  <rect x="1170" y="292" width="70" height="78" fill="#16202c"/>
  ${windowGrid(46, 260, 106, 366, 9, 0.5)}${windowGrid(1086, 270, 1136, 366, 9, 0.5)}
</g>
<g>
  <rect x="880" y="180" width="150" height="190" fill="#22384c"/>
  ${windowGrid(886, 188, 1026, 366, 11, 0.55)}
  <rect x="900" y="176" width="11" height="194" fill="#383e46"/>
  <rect x="950" y="176" width="11" height="194" fill="#383e46"/>
  <rect x="1000" y="176" width="11" height="194" fill="#383e46"/>
  <ellipse cx="955" cy="180" rx="75" ry="20" fill="#2c3946"/>
</g>
<g>
  <rect x="210" y="230" width="200" height="140" fill="#1e3143"/>
  ${windowGrid(216, 238, 406, 366, 11, 0.55)}
  <rect x="206" y="224" width="208" height="8" fill="#4c4a45"/>
</g>
<path d="M -10 356 Q 640 268 1290 356 L 1290 330 Q 640 242 -10 330 Z" fill="#232529"/>
<path d="M -10 330 Q 640 242 1290 330" fill="none" stroke="#5c584e" stroke-width="3"/>
<g>
  <circle cx="300" cy="308" r="3" fill="#fff6d8"/><circle cx="330" cy="304" r="3" fill="#fff6d8"/>
  <circle cx="560" cy="282" r="3" fill="#fff6d8"/><circle cx="590" cy="279" r="3" fill="#fff6d8"/>
  <circle cx="820" cy="288" r="3" fill="#ff5a4a"/><circle cx="850" cy="292" r="3" fill="#ff5a4a"/>
  <circle cx="1060" cy="310" r="3" fill="#ff5a4a"/>
  <rect x="270" y="300" width="34" height="10" rx="2" fill="#b8bcc2"/>
  <rect x="530" y="274" width="34" height="10" rx="2" fill="#e8e8ea"/>
  <rect x="826" y="282" width="46" height="11" rx="2" fill="#e2711d"/>
  <rect x="1035" y="302" width="30" height="10" rx="2" fill="#f2c81e"/>
</g>
${glow(180, 250)}${glow(480, 226)}${glow(780, 232)}${glow(1100, 258)}
<rect width="1280" height="400" fill="#0a1020" opacity="0.15"/>
<text x="640" y="120" font-size="36" font-weight="bold" text-anchor="middle" fill="#f0e6d2" letter-spacing="1">REAL-TIME DIGITAL TRAFFIC SIMULATION</text>
<text x="640" y="156" font-size="15" text-anchor="middle" fill="#ffd98a" letter-spacing="2">A living digital twin of Cyber Towers Junction · Hitech City, Hyderabad</text>
<text x="640" y="184" font-size="11" text-anchor="middle" fill="#7d8896" letter-spacing="1.5">three.js · react-three-fiber · ~1,000 instanced vehicles · TomTom live traffic</text>
</svg>`;
}

for (const mode of ['day', 'night', 'rain']) {
  writeFileSync(join(OUT, `${mode}.svg`), scene(mode));
  console.log(`wrote screens/${mode}.svg`);
}
writeFileSync(join(OUT, 'hero.svg'), hero());
console.log('wrote screens/hero.svg');
