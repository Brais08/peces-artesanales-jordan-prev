/* Peces artesanales Jordan Nito — interacción de la tienda */
(() => {
  'use strict';

  const $ = (s, el = document) => el.querySelector(s);
  const $$ = (s, el = document) => [...el.querySelectorAll(s)];
  const eur = n => n.toLocaleString('es-ES', { style: 'currency', currency: 'EUR' });
  let uid = 0;

  /* ------------------------------------------------------------
     Generador SVG de señuelos (todas las ilustraciones son código)
     ------------------------------------------------------------ */
  /* Jibioneras: clásica para calamar, estilizada para chipirón y robusta para sepia */
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

  // Corona de púas de acero (el "paraguas" característico de las jibioneras)
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
    return `<svg viewBox="0 0 262 112" xmlns="http://www.w3.org/2000/svg" role="img" aria-label="Ilustración de la jibionera">
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
        <rect width="262" height="112" fill="url(#${id}w)"/>
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

  /* ------------------------------------------------------------
     Catálogo · todas las jibioneras se hacen en todas las tallas
     (precios y pesos orientativos: cámbialos por los reales)
     ------------------------------------------------------------ */
  const SIZES = [
    { cm: '5,5', g: 4, eur: 9.90 }, { cm: '6', g: 5, eur: 10.50 }, { cm: '7', g: 7, eur: 11.50 },
    { cm: '8', g: 9, eur: 12.50 }, { cm: '9', g: 12, eur: 13.90 }, { cm: '10', g: 15, eur: 14.90 },
    { cm: '11', g: 19, eur: 15.90 }
  ];
  const priceFor = (p, i) => SIZES[i].eur + (p.extra || 0);
  const CATS = { calamar: 'Calamar', chipiron: 'Chipirón', sepia: 'Sepia' };

  const PRODUCTS = [
    { id: 'rias', name: 'Jibionera Rías', cat: 'calamar', def: 4, sink: '3,5 s/m', stock: 12, badge: ['Más vendida', ''], serial: '037/150',
      lure: { shape: 'calamar', back: '#C2662D', body: '#F4D9B8', pattern: 'scales' }, bg: ['#12345E', '#0A1A2F'] },
    { id: 'chipi-noche', name: 'Chipi Noche', cat: 'chipiron', def: 1, sink: '4 s/m', stock: 4, badge: ['Nuevo', 'new'], serial: '012/100',
      lure: { shape: 'chipiron', back: '#0A1A2F', body: '#9CC9E6', pattern: 'none' }, bg: ['#1D5FA8', '#12345E'] },
    { id: 'sepiera-arena', name: 'Sepiera Arena', cat: 'sepia', def: 3, sink: '2 s/m', stock: 9, serial: '088/150',
      lure: { shape: 'sepia', back: '#B08A55', body: '#EFE6D6', pattern: 'dots' }, bg: ['#0F3B45', '#0A1A2F'] },
    { id: 'fluor', name: 'Calamar Flúor', cat: 'calamar', def: 5, sink: '3,5 s/m', stock: 15, serial: '054/150',
      lure: { shape: 'calamar', back: '#FF6B4A', body: '#FFC21A', pattern: 'stripes' }, bg: ['#12345E', '#0A1A2F'] },
    { id: 'chipi-sardina', name: 'Chipi Sardina', cat: 'chipiron', def: 0, sink: '4 s/m', stock: 7, serial: '061/150',
      lure: { shape: 'chipiron', back: '#1D5FA8', body: '#C9D6E3', pattern: 'scales' }, bg: ['#9CC9E6', '#1D5FA8'] },
    { id: 'sepiera-tigre', name: 'Sepiera Tigre', cat: 'sepia', def: 4, sink: '2 s/m', stock: 3, extra: 2, badge: ['Serie limitada', 'limited'], serial: '007/050',
      lure: { shape: 'sepia', back: '#2F7D6D', body: '#FFC21A', pattern: 'stripes' }, bg: ['#1D5FA8', '#0A1A2F'] },
    { id: 'nacar', name: 'Calamar Nácar', cat: 'calamar', def: 6, sink: '3,5 s/m', stock: 2, badge: ['Últimas', ''], serial: '143/150',
      lure: { shape: 'calamar', back: '#D9577A', body: '#FFD9E2', pattern: 'none' }, bg: ['#FFC21A', '#E3A300'] },
    { id: 'chipi-limon', name: 'Chipi Limón', cat: 'chipiron', def: 2, sink: '4 s/m', stock: 10, serial: '029/150',
      lure: { shape: 'chipiron', back: '#E3A300', body: '#FFF1B8', pattern: 'dots' }, bg: ['#12345E', '#0A1A2F'] }
  ];

  /* Variantes de color por modelo: [nombre, lomo, cuerpo] */
  const VARIANTS = {
    'rias':          [['Camarón', '#C2662D', '#F4D9B8'], ['Gamba roja', '#B3261E', '#F6C9B8'], ['Natural', '#7A6A55', '#E9DFCC'], ['Flúor', '#FFC21A', '#FFF1B8']],
    'chipi-noche':   [['Noche', '#0A1A2F', '#9CC9E6'], ['Lumo', '#2F7D6D', '#D9F2E6'], ['Morado', '#5B3A8C', '#D9CCF0'], ['Plata', '#5E6878', '#E4E8EC']],
    'sepiera-arena': [['Arena', '#B08A55', '#EFE6D6'], ['Alga', '#2F7D6D', '#D8E6D2'], ['Oliva', '#717556', '#E6E1C9'], ['Naranja', '#FF6B4A', '#FFD1BF']],
    'fluor':         [['Flúor', '#FF6B4A', '#FFC21A'], ['Limón', '#E3A300', '#FFF1B8'], ['Rosa', '#D9577A', '#FFC21A'], ['Verde', '#7BB342', '#F4F7C8']],
    'chipi-sardina': [['Sardina', '#1D5FA8', '#C9D6E3'], ['Plata', '#5E6878', '#E4E8EC'], ['Verde', '#2F7D6D', '#D8E6D2'], ['Rosa', '#D9577A', '#FFD9E2']],
    'sepiera-tigre': [['Tigre', '#2F7D6D', '#FFC21A'], ['Fuego', '#FF6B4A', '#FFC21A'], ['Noche', '#0A1A2F', '#4E6E91'], ['Camarón', '#C2662D', '#F4D9B8']],
    'nacar':         [['Nácar', '#D9577A', '#FFD9E2'], ['Perla', '#9CA9B8', '#F6F3EC'], ['Malva', '#8E5BA8', '#EBDDF3'], ['Coral', '#FF6B4A', '#FFD1BF']],
    'chipi-limon':   [['Limón', '#E3A300', '#FFF1B8'], ['Lima', '#7BB342', '#E8F3C9'], ['Naranja', '#FF6B4A', '#FFE7A0'], ['Blanco', '#9CC9E6', '#F6F3EC']]
  };

  /* Opciones del configurador "A medida" (listas cerradas: no se acepta nada fuera de ellas) */
  const BACKS = ['#C2662D', '#0A1A2F', '#1D5FA8', '#2F7D6D', '#FFC21A', '#FF6B4A', '#D9577A'];
  const BODIES = ['#F4D9B8', '#C9D6E3', '#FFE7A0', '#E6E1C9', '#9CC9E6', '#FFD1BF', '#F6F3EC'];
  const CUSTOM_FEE = 3;   // recargo por pieza a medida
  const ENGRAVE_FEE = 3;  // recargo por grabado
  const NAMES = { calamar: 'calamar', chipiron: 'chipirón', sepia: 'sepia' };
  const PATTERN_NAMES = { scales: 'escamas', stripes: 'rayas', dots: 'moteado', none: 'liso' };
  const COLOR_NAMES = {
    '#0A1A2F': 'azul noche', '#1D5FA8': 'azul atlántico', '#2F7D6D': 'verde alga', '#FFC21A': 'amarillo',
    '#FF6B4A': 'coral', '#C9D6E3': 'plata', '#FFE7A0': 'amarillo crema', '#E6E1C9': 'hueso',
    '#9CC9E6': 'azul cielo', '#FFD1BF': 'salmón', '#F6F3EC': 'blanco perla',
    '#C2662D': 'camarón', '#D9577A': 'rosa', '#F4D9B8': 'carne'
  };

  /* ------------------------------------------------------------
     Seguridad: validación y limpieza de toda entrada de datos
     ------------------------------------------------------------ */
  const has = (obj, k) => typeof k === 'string' && Object.prototype.hasOwnProperty.call(obj, k);
  const isIndex = (n, len) => Number.isInteger(n) && n >= 0 && n < len;

  // Texto libre del cliente: quita caracteres de control, saltos de línea, caracteres
  // invisibles/bidireccionales y los símbolos de formato de WhatsApp (* _ ~ `), y recorta.
  function cleanText(v, max) {
    return String(v ?? '')
      .normalize('NFC')
      .replace(/[\u0000-\u001F\u007F-\u009F\u200B-\u200F\u2028-\u202E\u2060-\u206F\uFEFF]/g, ' ')
      .replace(/[*_~`<>]/g, '')
      .replace(/\s+/g, ' ')
      .trim()
      .slice(0, max);
  }
  // Grabado: solo letras, números, espacios y puntuación básica
  const cleanEngrave = v => cleanText(v, 40).replace(/[^\p{L}\p{N} .,'!¡¿?&-]/gu, '').trim().slice(0, 16);

  // Convierte una referencia (lo único que se guarda) en una línea de carrito con
  // precio calculado desde el catálogo. Cualquier dato manipulado devuelve null.
  function resolveItem(ref) {
    if (!ref || typeof ref !== 'object') return null;
    const k = ref.size;
    if (!isIndex(k, SIZES.length)) return null;
    const size = SIZES[k];

    if (ref.kind === 'cat') {
      const p = PRODUCTS.find(x => x.id === ref.id);
      if (!p) return null;
      if (ref.color === undefined) {
        return { ref: { kind: 'cat', id: p.id, size: k }, key: `cat:${p.id}:${k}`, name: p.name,
          meta: `${size.cm} cm · ${size.g} g`, price: priceFor(p, k), lure: p.lure };
      }
      const vs = VARIANTS[p.id] || [];
      if (!isIndex(ref.color, vs.length)) return null;
      const [vName, back, body] = vs[ref.color];
      return { ref: { kind: 'cat', id: p.id, size: k, color: ref.color }, key: `cat:${p.id}:${k}:${ref.color}`, name: p.name,
        meta: `${size.cm} cm · ${vName}`, price: priceFor(p, k), lure: { ...p.lure, back, body } };
    }

    if (ref.kind === 'custom') {
      if (!has(NAMES, ref.shape) || !has(PATTERN_NAMES, ref.pattern) || !BACKS.includes(ref.back) || !BODIES.includes(ref.body)) return null;
      const engrave = cleanEngrave(ref.engrave);
      const clean = { kind: 'custom', shape: ref.shape, back: ref.back, body: ref.body, pattern: ref.pattern, size: k, engrave };
      return {
        ref: clean, key: 'custom:' + [clean.shape, clean.back, clean.body, clean.pattern, k, engrave].join('|'),
        name: `Jibionera a medida (${NAMES[clean.shape]})`,
        meta: `${size.cm} cm${engrave ? ` · “${engrave}”` : ''}`,
        price: size.eur + CUSTOM_FEE + (engrave ? ENGRAVE_FEE : 0),
        lure: { shape: clean.shape, back: clean.back, body: clean.body, pattern: clean.pattern, engrave },
        details: `Lomo ${COLOR_NAMES[clean.back]}, cuerpo ${COLOR_NAMES[clean.body]}, patrón ${PATTERN_NAMES[clean.pattern]}`
      };
    }
    return null;
  }

  const grid = $('#productGrid');
  function renderProducts(filter = 'todos') {
    const list = PRODUCTS.filter(p => filter === 'todos' || p.cat === filter);
    grid.innerHTML = list.map((p, i) => `
      <article class="card" style="animation-delay:${i * 60}ms">
        <div class="card__media" style="background:linear-gradient(160deg, ${p.bg[0]}, ${p.bg[1]})">
          ${p.badge ? `<span class="card__badge ${p.badge[1] ? 'card__badge--' + p.badge[1] : ''}">${escapeHTML(p.badge[0])}</span>` : ''}
          <span class="card__serial">Nº ${escapeHTML(p.serial)}</span>
          ${lureSVG(p.lure)}
        </div>
        <div class="card__body">
          <div class="card__title"><h3>${escapeHTML(p.name)}</h3><span class="card__price" data-price>${eur(priceFor(p, p.def))}</span></div>
          <dl class="card__specs">
            <div><dt>Especie</dt><dd>${CATS[p.cat]}</dd></div>
            <div><dt>Peso</dt><dd data-weight>${SIZES[p.def].g} g</dd></div>
            <div><dt>Hundim.</dt><dd>${escapeHTML(p.sink)}</dd></div>
          </dl>
          <span class="stock ${p.stock <= 4 ? 'stock--low' : ''}">${p.stock <= 4 ? `Solo quedan ${p.stock}` : 'En stock'}</span>
          <div class="card__foot">
            <label class="size-sel"><span class="sr-only">Talla</span>
              <select data-size="${p.id}">${SIZES.map((s, k) => `<option value="${k}"${k === p.def ? ' selected' : ''}>${s.cm} cm</option>`).join('')}</select>
            </label>
            <button class="add-btn" data-add="${p.id}">Añadir</button>
          </div>
        </div>
      </article>`).join('');
  }

  $$('.chip').forEach(chip => chip.addEventListener('click', () => {
    if (chip.dataset.filter !== 'todos' && !has(CATS, chip.dataset.filter)) return;
    $$('.chip').forEach(c => c.classList.remove('is-active'));
    chip.classList.add('is-active');
    renderProducts(chip.dataset.filter);
  }));

  grid.addEventListener('change', e => {
    const sel = e.target.closest('select[data-size]');
    if (!sel) return;
    const p = PRODUCTS.find(x => x.id === sel.dataset.size), k = +sel.value;
    if (!p || !isIndex(k, SIZES.length)) return;
    const card = sel.closest('.card');
    $('[data-price]', card).textContent = eur(priceFor(p, k));
    $('[data-weight]', card).textContent = SIZES[k].g + ' g';
  });

  grid.addEventListener('click', e => {
    const btn = e.target.closest('[data-add]');
    if (!btn) return;
    addToCart({ kind: 'cat', id: btn.dataset.add, size: +$('select', btn.closest('.card')).value });
  });

  /* ------------------------------------------------------------
     Carrito: solo guarda referencias {producto, talla, color, cantidad}.
     Los precios se recalculan siempre desde el catálogo, así que editar
     el almacenamiento del navegador no cambia lo que se cobra.
     ------------------------------------------------------------ */
  const FREE_SHIP = 50;
  const MAX_QTY = 20;     // unidades máximas por línea
  const MAX_LINES = 30;   // líneas máximas en el carrito
  const CART_KEY = 'jn_cart_v2';
  let cart = loadCart();  // [{ ref, qty }]
  let sending = false;    // bloqueo temporal tras enviar un pedido

  function loadCart() {
    let raw = [];
    try {
      localStorage.removeItem('jn_cart'); // formato antiguo (guardaba precios): se descarta
      raw = JSON.parse(localStorage.getItem(CART_KEY) || '[]');
    } catch { raw = []; }
    if (!Array.isArray(raw)) return [];
    const out = [], seen = new Set();
    for (const row of raw.slice(0, MAX_LINES)) {
      const it = resolveItem(row && row.ref);
      const qty = row && row.qty;
      if (!it || !Number.isInteger(qty) || qty < 1 || seen.has(it.key)) continue;
      seen.add(it.key);
      out.push({ ref: it.ref, qty: Math.min(qty, MAX_QTY) });
    }
    return out;
  }
  const save = () => { try { localStorage.setItem(CART_KEY, JSON.stringify(cart)); } catch { /* sin almacenamiento */ } };
  save(); // sustituye lo guardado por la versión validada (borra datos manipulados)
  const lines = () => cart.map(c => ({ ...resolveItem(c.ref), qty: c.qty }));

  function addToCart(ref) {
    const it = resolveItem(ref);
    if (!it) return;
    const found = cart.find(c => resolveItem(c.ref).key === it.key);
    if (found) {
      if (found.qty >= MAX_QTY) { toast(`Máximo ${MAX_QTY} unidades por modelo`); return; }
      found.qty++;
    } else {
      if (cart.length >= MAX_LINES) { toast('Has llegado al máximo de productos del carrito'); return; }
      cart.push({ ref: it.ref, qty: 1 });
    }
    save(); renderCart();
    const c = $('#cartCount'); c.classList.remove('bump'); void c.offsetWidth; c.classList.add('bump');
    toast('añadido al carrito', it.name);
  }

  function renderCart() {
    const items = lines();
    const count = items.reduce((a, i) => a + i.qty, 0);
    const total = items.reduce((a, i) => a + i.qty * i.price, 0);
    $('#cartCount').textContent = count;
    $('#cartTotal').textContent = eur(total);
    const body = $('#cartItems');
    if (!items.length) {
      body.innerHTML = `<div class="drawer__empty">${lureSVG({ shape: 'calamar', back: '#5E6878', body: '#C9D1DA', pattern: 'none' })}<p>Tu carrito está vacío.<br>El agua te espera.</p></div>`;
    } else {
      body.innerHTML = items.map((i, idx) => `
        <div class="line">
          <div class="line__thumb">${lureSVG(i.lure)}</div>
          <div>
            <div class="line__name">${escapeHTML(i.name)}</div>
            <div class="line__meta">${escapeHTML(i.meta)}</div>
            <div class="qty"><button data-qty="-1" data-i="${idx}" aria-label="Quitar uno">−</button><span>${i.qty}</span><button data-qty="1" data-i="${idx}" aria-label="Añadir uno">+</button></div>
          </div>
          <div><div class="line__price">${eur(i.price * i.qty)}</div><button class="line__remove" data-remove="${idx}">Eliminar</button></div>
        </div>`).join('');
    }
    const left = FREE_SHIP - total;
    $('#shipMsg').innerHTML = total === 0 ? `Envío gratis a partir de ${FREE_SHIP} €`
      : left > 0 ? `Te faltan <strong>${eur(left)}</strong> para el envío gratis<div class="ship__bar"><span style="width:${(total / FREE_SHIP) * 100}%"></span></div>`
      : `<strong style="color:var(--kelp)">¡Tienes envío gratis!</strong><div class="ship__bar"><span style="width:100%"></span></div>`;
    $('#checkout').disabled = !items.length || sending;
  }

  $('#cartItems').addEventListener('click', e => {
    const q = e.target.closest('[data-qty]');
    const r = e.target.closest('[data-remove]');
    if (!q && !r) return;
    const idx = Number(q ? q.dataset.i : r.dataset.remove);
    if (!isIndex(idx, cart.length)) return;
    if (q) {
      const step = q.dataset.qty === '1' ? 1 : -1;
      const item = cart[idx];
      if (step > 0 && item.qty >= MAX_QTY) { toast(`Máximo ${MAX_QTY} unidades por modelo`); return; }
      item.qty += step;
      if (item.qty <= 0) cart.splice(idx, 1);
    } else {
      cart.splice(idx, 1);
    }
    save(); renderCart();
  });

  // Si el carrito cambia en otra pestaña, se vuelve a cargar y validar
  addEventListener('storage', e => { if (e.key === CART_KEY) { cart = loadCart(); renderCart(); } });

  const drawer = $('#drawer'), overlay = $('#overlay');
  const openCart = () => { drawer.classList.add('is-open'); overlay.classList.add('is-open'); drawer.setAttribute('aria-hidden', 'false'); };
  const closeCart = () => { drawer.classList.remove('is-open'); overlay.classList.remove('is-open'); drawer.setAttribute('aria-hidden', 'true'); };
  $('#cartOpen').addEventListener('click', openCart);
  $('#cartClose').addEventListener('click', closeCart);
  overlay.addEventListener('click', closeCart);
  document.addEventListener('keydown', e => { if (e.key === 'Escape') closeCart(); });

  /* ------------------------------------------------------------
     Pedido por WhatsApp
     ------------------------------------------------------------ */
  const WHATSAPP_NUMBER = '34683673381'; // +34 683 67 33 81 (sin +, espacios ni guiones)
  const LIMITS = { name: 60, city: 60, notes: 300 };
  const SEND_COOLDOWN = 8000; // ms entre envíos, evita pedidos duplicados por doble clic

  // Referencia de pedido aleatoria para que puedas identificar cada pedido
  function orderRef() {
    const a = new Uint32Array(1);
    (window.crypto || {}).getRandomValues ? crypto.getRandomValues(a) : (a[0] = Math.random() * 2 ** 32);
    return 'JN-' + a[0].toString(36).toUpperCase().padStart(6, '0').slice(-6);
  }

  function buildOrderMessage({ name, city, notes }) {
    const items = lines();
    const total = items.reduce((a, i) => a + i.qty * i.price, 0);
    const out = [
      '🎣 *NUEVO PEDIDO — Peces artesanales Jordan Nito*',
      `🔖 *Ref.:* ${orderRef()}`,
      '',
      `👤 *Cliente:* ${name}`,
      city ? `📍 *Localidad:* ${city}` : null,
      '',
      '*Productos:*'
    ];
    items.forEach(i => {
      out.push(`• ${i.qty} × ${i.name} (${i.meta}) — ${eur(i.price * i.qty)}`);
      if (i.details) out.push(`   ↳ ${i.details}`);
    });
    out.push('', `💶 *Total:* ${eur(total)}`);
    out.push(total >= FREE_SHIP ? '🚚 Envío gratis' : '🚚 Envío: a confirmar');
    if (notes) out.push('', `📝 *Notas del cliente:* ${notes}`);
    return out.filter(l => l !== null).join('\n');
  }

  const orderForm = $('#orderForm');
  orderForm.addEventListener('submit', e => {
    e.preventDefault();
    if (sending || !cart.length) return;
    // Campo trampa invisible: las personas no lo ven ni lo rellenan; los robots sí
    if ($('#orderWebsite').value) return;
    const nameEl = $('#orderName');
    const data = {
      // Nombre: solo letras, espacios, apóstrofos, puntos y guiones. Localidad: además números y paréntesis.
      name: cleanText(nameEl.value, LIMITS.name).replace(/[^\p{L}\p{M} .'-]/gu, '').replace(/\s+/g, ' ').trim(),
      city: cleanText($('#orderCity').value, LIMITS.city).replace(/[^\p{L}\p{M}\p{N} .,'()-]/gu, '').replace(/\s+/g, ' ').trim(),
      notes: cleanText($('#orderNotes').value, LIMITS.notes)
    };
    if ((data.name.match(/\p{L}/gu) || []).length < 2) {
      nameEl.classList.add('is-invalid'); nameEl.focus();
      toast('Escribe tu nombre para enviar el pedido');
      return;
    }
    nameEl.classList.remove('is-invalid');
    const url = `https://wa.me/${WHATSAPP_NUMBER}?text=${encodeURIComponent(buildOrderMessage(data))}`;
    window.open(url, '_blank', 'noopener,noreferrer');
    toast('Abriendo WhatsApp con tu pedido…');
    sending = true; renderCart();
    setTimeout(() => { sending = false; renderCart(); }, SEND_COOLDOWN);
  });
  $('#orderName').addEventListener('input', e => e.target.classList.remove('is-invalid'));

  /* ------------------------------------------------------------
     Configurador "A medida"
     ------------------------------------------------------------ */
  const cfg = { shape: 'calamar', back: BACKS[0], body: BODIES[0], pattern: 'scales', size: 4, engrave: '' };
  const CFG_ALLOWED = {
    shape: v => has(NAMES, v), pattern: v => has(PATTERN_NAMES, v),
    back: v => BACKS.includes(v), body: v => BODIES.includes(v), size: v => isIndex(v, SIZES.length)
  };
  function setCfg(key, value) {
    if (key === 'size') value = Number(value);
    if (!CFG_ALLOWED[key] || !CFG_ALLOWED[key](value)) return false;
    cfg[key] = value;
    return true;
  }

  function buildSwatches(key, colors) {
    const wrap = $(`.swatches[data-key="${key}"]`);
    wrap.innerHTML = colors.map(c => `<button type="button" class="swatch ${c === cfg[key] ? 'is-active' : ''}" style="background:${c}" data-value="${c}" aria-label="Color ${escapeHTML(COLOR_NAMES[c] || c)}"></button>`).join('');
    wrap.addEventListener('click', e => {
      const b = e.target.closest('.swatch'); if (!b || !setCfg(key, b.dataset.value)) return;
      $$('.swatch', wrap).forEach(s => s.classList.toggle('is-active', s === b));
      updateBuilder();
    });
  }
  buildSwatches('back', BACKS);
  buildSwatches('body', BODIES);

  $$('.seg').forEach(seg => seg.addEventListener('click', e => {
    const b = e.target.closest('button'); if (!b || !setCfg(seg.dataset.key, b.dataset.value)) return;
    $$('button', seg).forEach(x => x.classList.toggle('is-active', x === b));
    updateBuilder();
  }));
  $('#engrave').addEventListener('input', e => { cfg.engrave = cleanEngrave(e.target.value); updateBuilder(); });
  $('#builderForm').addEventListener('submit', e => e.preventDefault());

  const builderPrice = () => SIZES[cfg.size].eur + CUSTOM_FEE + (cfg.engrave ? ENGRAVE_FEE : 0);
  function updateBuilder() {
    const el = $('#builderLure');
    el.innerHTML = lureSVG(cfg);
    el.style.width = `${60 + cfg.size * 6}%`;
    $('#builderName').textContent = `Para ${NAMES[cfg.shape]} · ${SIZES[cfg.size].cm} cm`;
    $('#builderPrice').textContent = eur(builderPrice());
  }
  updateBuilder();

  $('#builderAdd').addEventListener('click', () => addToCart({ kind: 'custom', ...cfg }));

  /* ------------------------------------------------------------
     Hero, burbujas, profundidad, menú y animaciones
     ------------------------------------------------------------ */
  const bubbles = $('#bubbles');
  for (let i = 0; i < 18; i++) {
    const b = document.createElement('span');
    const size = 4 + Math.random() * 14;
    Object.assign(b.style, {
      width: size + 'px', height: size + 'px', left: Math.random() * 100 + '%',
      animationDuration: 8 + Math.random() * 10 + 's', animationDelay: -Math.random() * 15 + 's'
    });
    b.style.setProperty('--dx', (Math.random() * 60 - 30) + 'px');
    bubbles.appendChild(b);
  }

  const nav = $('.nav'), marker = $('.depth__marker'), depthVal = $('.depth__value');
  function onScroll() {
    nav.classList.toggle('is-scrolled', scrollY > 40);
    const max = document.documentElement.scrollHeight - innerHeight;
    const pct = max > 0 ? Math.min(1, scrollY / max) : 0;
    marker.style.top = `calc(${pct * 100}% - 5px)`;
    depthVal.textContent = Math.round(pct * 120) + ' m';
  }
  addEventListener('scroll', onScroll, { passive: true });
  onScroll();

  const burger = $('#burger'), links = $('#navLinks');
  burger.addEventListener('click', () => {
    const open = burger.getAttribute('aria-expanded') !== 'true';
    burger.setAttribute('aria-expanded', open);
    links.classList.toggle('is-open', open);
    nav.classList.toggle('menu-open', open);
  });
  $$('a', links).forEach(a => a.addEventListener('click', () => {
    burger.setAttribute('aria-expanded', 'false'); links.classList.remove('is-open'); nav.classList.remove('menu-open');
  }));

  if ('IntersectionObserver' in window) {
    const io = new IntersectionObserver(entries => entries.forEach(en => {
      if (en.isIntersecting) { en.target.classList.add('is-in'); io.unobserve(en.target); }
    }), { threshold: .08 });
    $$('.reveal').forEach(el => io.observe(el));
  } else {
    $$('.reveal').forEach(el => el.classList.add('is-in'));
  }

  let toastTimer;
  function toast(message, strong = '') {
    const t = $('#toast');
    t.replaceChildren();
    if (strong) { const b = document.createElement('b'); b.textContent = strong; t.append(b, ' '); }
    t.append(message);
    t.classList.add('is-show');
    clearTimeout(toastTimer); toastTimer = setTimeout(() => t.classList.remove('is-show'), 2600);
  }

  $('#year').textContent = new Date().getFullYear();
  renderProducts();
  renderCart();

  // Utilidades compartidas con el escaparate espacial (spatial.js)
  window.JN = Object.freeze({ lureSVG, PRODUCTS, SIZES, VARIANTS, priceFor, addToCart, openCart, eur, escapeHTML });
})();
