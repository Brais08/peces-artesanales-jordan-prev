/* Generador de ilustraciones de poteras (compartido por la tienda y el panel de administración) */
(() => {
  'use strict';
  let uid = 0;

  /* ------------------------------------------------------------
     Generador SVG de poteras (todas las ilustraciones son código)
     ------------------------------------------------------------ */
  /* Poteras: clásica para calamar, estilizada para chipirón y robusta para sepia */
  const SHAPES = {
    calamar: {
      body: 'M44,54 C62,40 140,33 198,38 C214,40 223,47 225,54 C223,61 214,67 198,69 C140,74 62,68 44,58 Z',
      keel: 'M168,66 Q196,84 221,61 Z', eye: [207, 49, 7], fin: 146, tail: 44, top: 37, mid: 54, gill: 'M188,40 Q181,54 188,67'
    },
    chipiron: {
      body: 'M52,54 C72,45 146,40 202,42 C216,43 224,49 226,54 C224,59 216,64 202,65 C146,68 72,63 52,57 Z',
      keel: 'M178,63 Q200,76 222,59 Z', eye: [209, 50, 5.5], fin: 152, tail: 52, top: 42, mid: 54, gill: 'M192,43 Q186,54 192,64'
    },
    sepia: {
      body: 'M40,55 C56,34 130,27 192,33 C212,36 222,45 224,55 C222,64 212,72 192,75 C130,80 56,73 40,59 Z',
      keel: 'M158,71 Q192,94 221,64 Z', eye: [205, 48, 7.5], fin: 140, tail: 40, top: 31, mid: 55, gill: 'M184,36 Q176,55 184,73'
    }
  };

  // Corona de púas de acero (el "paraguas" característico de las poteras)
  function crown(x, y) {
    let back = '', front = '';
    for (let i = -5; i <= 5; i++) {
      back += `M${x - 8},${y + i * .7}L${x - 26},${y + i * 4.2}l2.5,${i < 0 ? -2.6 : 2.6}`;
      if (i < 5) {
        const k = i + .5;
        front += `M${x - 6},${y + k * .6}L${x - 19},${y + k * 3.2}l2.2,${k < 0 ? -2.2 : 2.2}`;
      }
    }
    return `<g fill="none" stroke-linecap="round" stroke-linejoin="round">
      <path d="${back}" stroke="#AEB8C3" stroke-width="1.2"/>
      <path d="${front}" stroke="#DCE2E8" stroke-width="1.2"/>
      <rect x="${x - 10}" y="${y - 3.2}" width="13" height="6.4" rx="2" fill="#8E99A6" stroke="none"/>
    </g>`;
  }

  const HEX = /^#[0-9A-Fa-f]{6}$/;
  const hex = (c, fallback) => (typeof c === 'string' && HEX.test(c) ? c : fallback);

  function lureSVG(opts = {}) {
    // Todo valor que acaba dentro del SVG se valida: colores hexadecimales, forma y
    // patrón de listas cerradas y el grabado escapado (protección contra inyección HTML).
    const o = opts && typeof opts === 'object' ? opts : {};
    const back = hex(o.back, '#C2662D'), body = hex(o.body, '#F4D9B8'), belly = hex(o.belly, '#F6F3EC');
    const pattern = ['scales', 'stripes', 'dots', 'none'].includes(o.pattern) ? o.pattern : 'scales';
    const engrave = typeof o.engrave === 'string' ? o.engrave.slice(0, 16) : '';
    const s = Object.prototype.hasOwnProperty.call(SHAPES, o.shape) ? SHAPES[o.shape] : SHAPES.calamar;
    const id = 'l' + (++uid);
    const m = s.mid, f = s.fin, t = s.top;
    let pat = '';
    if (pattern === 'scales') {
      pat = `<rect width="262" height="112" fill="url(#${id}p)"/>`;
    } else if (pattern === 'stripes') {
      for (let x = s.tail + 22; x < 196; x += 17) {
        const d = `M${x},${t - 4} q7,12 1,${m - t}`;
        pat += `<path d="${d}" stroke="${back}" stroke-width="5.5" stroke-linecap="round" fill="none" opacity=".85"/>`
             + `<path d="${d}" stroke="rgba(0,0,0,.22)" stroke-width="5.5" stroke-linecap="round" fill="none"/>`;
      }
    } else if (pattern === 'dots') {
      [[70, 44], [92, 40], [108, 50], [130, 40], [150, 48], [172, 42], [84, 54], [188, 50], [120, 56], [64, 58], [160, 58], [100, 62]]
        .forEach(([x, y], i) => { pat += `<circle cx="${x}" cy="${y}" r="${2.4 + (i % 3)}" fill="${back}" stroke="rgba(0,0,0,.3)" stroke-width="1.4"/>`; });
    }
    const mir = y => 2 * m - y;
    const finTop = `M${f},${t + 5} Q${f - 12},${t - 14} ${f - 30},${t - 12} Q${f - 16},${t - 3} ${f - 16},${t + 7} Z`;
    const finBot = `M${f},${mir(t + 5)} Q${f - 12},${mir(t - 14)} ${f - 30},${mir(t - 12)} Q${f - 16},${mir(t - 3)} ${f - 16},${mir(t + 7)} Z`;
    const text = engrave ? `<text x="122" y="${m + 9}" font-family="Fraunces, serif" font-style="italic" font-size="9" fill="rgba(0,0,0,.45)" text-anchor="middle">${escapeHTML(engrave)}</text>` : '';
    const [ex, ey, er] = s.eye;
    return `<svg viewBox="0 0 262 112" xmlns="http://www.w3.org/2000/svg" role="img" aria-label="Ilustración de la potera">
      <defs>
        <linearGradient id="${id}g" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" stop-color="${back}"/><stop offset=".32" stop-color="${back}"/>
          <stop offset=".58" stop-color="${body}"/><stop offset="1" stop-color="${belly}"/>
        </linearGradient>
        <pattern id="${id}p" width="10" height="8" patternUnits="userSpaceOnUse">
          <path d="M0,8 Q5,0 10,8" fill="none" stroke="rgba(255,255,255,.35)" stroke-width="1"/>
        </pattern>
        <pattern id="${id}w" width="4" height="4" patternUnits="userSpaceOnUse">
          <path d="M0,4L4,0" stroke="rgba(255,255,255,.16)" stroke-width=".8"/><path d="M0,0L4,4" stroke="rgba(0,0,0,.07)" stroke-width=".8"/>
        </pattern>
        <clipPath id="${id}c"><path d="${s.body}"/></clipPath>
      </defs>
      ${crown(s.tail, m)}
      <path d="${finTop}" fill="${back}" opacity=".9" stroke="rgba(0,0,0,.18)"/>
      <path d="${finBot}" fill="${back}" opacity=".9" stroke="rgba(0,0,0,.18)"/>
      <path d="${s.body}" fill="url(#${id}g)"/>
      <g clip-path="url(#${id}c)">
        ${pat}
        <path d="M${s.tail},${m} Q130,${m - 5} 224,${m - 1}" stroke="rgba(255,255,255,.3)" stroke-width="1.3" fill="none"/>
        <ellipse cx="130" cy="${t + 6}" rx="86" ry="5" fill="#fff" opacity=".22"/>
        ${text}
      </g>
      <path d="${s.keel}" fill="#A9B3BE" stroke="rgba(0,0,0,.25)" stroke-width="1"/>
      <path d="${s.gill}" stroke="rgba(0,0,0,.25)" stroke-width="1.6" fill="none"/>
      <circle cx="230" cy="${m}" r="3.2" fill="none" stroke="#AEB8C3" stroke-width="1.6"/>
      <circle cx="${ex}" cy="${ey}" r="${er}" fill="#FFC21A" stroke="#0A1A2F" stroke-width="1"/>
      <circle cx="${ex + 1}" cy="${ey}" r="${er * .55}" fill="#0A1A2F"/>
      <circle cx="${ex - er * .3}" cy="${ey - er * .35}" r="${er * .22}" fill="#fff"/>
    </svg>`;
  }

  function escapeHTML(str) {
    return String(str).replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
  }

  window.JNLure = Object.freeze({ lureSVG, escapeHTML, hex, HEX, SHAPES: Object.keys(SHAPES) });
})();
