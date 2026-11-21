/* Poteras artesanales Jordan Nito — interacción de la tienda */
(() => {
  'use strict';

  const $ = (s, el = document) => el.querySelector(s);
  const $$ = (s, el = document) => [...el.querySelectorAll(s)];
  const eur = n => n.toLocaleString('es-ES', { style: 'currency', currency: 'EUR' });

  /* Generador de dibujos y escape de HTML: lure.js */
  const { lureSVG, escapeHTML, hex, HEX } = window.JNLure;

  /* ------------------------------------------------------------
     Catálogo · todas las poteras se hacen en todas las tallas
     (precios y pesos orientativos: cámbialos por los reales)
     ------------------------------------------------------------ */
  const SIZES = [
    { cm: '5,5', g: 4, eur: 9.90 }, { cm: '6', g: 5, eur: 10.50 }, { cm: '7', g: 7, eur: 11.50 },
    { cm: '8', g: 9, eur: 12.50 }, { cm: '9', g: 12, eur: 13.90 }, { cm: '10', g: 15, eur: 14.90 },
    { cm: '11', g: 19, eur: 15.90 }
  ];
  const priceFor = (p, i) => SIZES[i].eur + (p.extra || 0);
  const CATS = { calamar: 'Calamar', chipiron: 'Chipirón', sepia: 'Sepia' };

  /* Catálogo de respaldo: se usa si Supabase no responde y este navegador no tiene
     una copia guardada. Mismo formato que la tabla "products" de Supabase. */
  const FALLBACK_ROWS = [
    {"id": "rias", "name": "Potera Rías", "cat": "calamar", "def_size": 4, "extra": 0, "sink": "3,5 s/m", "stock": 12, "badge": "Más vendida", "badge_style": "", "serial": "037/150", "shape": "calamar", "back": "#C2662D", "body": "#F4D9B8", "pattern": "scales", "bg1": "#12345E", "bg2": "#0A1A2F", "variants": [["Camarón", "#C2662D", "#F4D9B8"], ["Gamba roja", "#B3261E", "#F6C9B8"], ["Natural", "#7A6A55", "#E9DFCC"], ["Flúor", "#FFC21A", "#FFF1B8"]]},
    {"id": "chipi-noche", "name": "Chipi Noche", "cat": "chipiron", "def_size": 1, "extra": 0, "sink": "4 s/m", "stock": 4, "badge": "Nuevo", "badge_style": "new", "serial": "012/100", "shape": "chipiron", "back": "#0A1A2F", "body": "#9CC9E6", "pattern": "none", "bg1": "#1D5FA8", "bg2": "#12345E", "variants": [["Noche", "#0A1A2F", "#9CC9E6"], ["Lumo", "#2F7D6D", "#D9F2E6"], ["Morado", "#5B3A8C", "#D9CCF0"], ["Plata", "#5E6878", "#E4E8EC"]]},
    {"id": "sepiera-arena", "name": "Sepiera Arena", "cat": "sepia", "def_size": 3, "extra": 0, "sink": "2 s/m", "stock": 9, "badge": "", "badge_style": "", "serial": "088/150", "shape": "sepia", "back": "#B08A55", "body": "#EFE6D6", "pattern": "dots", "bg1": "#0F3B45", "bg2": "#0A1A2F", "variants": [["Arena", "#B08A55", "#EFE6D6"], ["Alga", "#2F7D6D", "#D8E6D2"], ["Oliva", "#717556", "#E6E1C9"], ["Naranja", "#FF6B4A", "#FFD1BF"]]},
    {"id": "fluor", "name": "Calamar Flúor", "cat": "calamar", "def_size": 5, "extra": 0, "sink": "3,5 s/m", "stock": 15, "badge": "", "badge_style": "", "serial": "054/150", "shape": "calamar", "back": "#FF6B4A", "body": "#FFC21A", "pattern": "stripes", "bg1": "#12345E", "bg2": "#0A1A2F", "variants": [["Flúor", "#FF6B4A", "#FFC21A"], ["Limón", "#E3A300", "#FFF1B8"], ["Rosa", "#D9577A", "#FFC21A"], ["Verde", "#7BB342", "#F4F7C8"]]},
    {"id": "chipi-sardina", "name": "Chipi Sardina", "cat": "chipiron", "def_size": 0, "extra": 0, "sink": "4 s/m", "stock": 7, "badge": "", "badge_style": "", "serial": "061/150", "shape": "chipiron", "back": "#1D5FA8", "body": "#C9D6E3", "pattern": "scales", "bg1": "#9CC9E6", "bg2": "#1D5FA8", "variants": [["Sardina", "#1D5FA8", "#C9D6E3"], ["Plata", "#5E6878", "#E4E8EC"], ["Verde", "#2F7D6D", "#D8E6D2"], ["Rosa", "#D9577A", "#FFD9E2"]]},
    {"id": "sepiera-tigre", "name": "Sepiera Tigre", "cat": "sepia", "def_size": 4, "extra": 2, "sink": "2 s/m", "stock": 3, "badge": "Serie limitada", "badge_style": "limited", "serial": "007/050", "shape": "sepia", "back": "#2F7D6D", "body": "#FFC21A", "pattern": "stripes", "bg1": "#1D5FA8", "bg2": "#0A1A2F", "variants": [["Tigre", "#2F7D6D", "#FFC21A"], ["Fuego", "#FF6B4A", "#FFC21A"], ["Noche", "#0A1A2F", "#4E6E91"], ["Camarón", "#C2662D", "#F4D9B8"]]},
    {"id": "nacar", "name": "Calamar Nácar", "cat": "calamar", "def_size": 6, "extra": 0, "sink": "3,5 s/m", "stock": 2, "badge": "Últimas", "badge_style": "", "serial": "143/150", "shape": "calamar", "back": "#D9577A", "body": "#FFD9E2", "pattern": "none", "bg1": "#FFC21A", "bg2": "#E3A300", "variants": [["Nácar", "#D9577A", "#FFD9E2"], ["Perla", "#9CA9B8", "#F6F3EC"], ["Malva", "#8E5BA8", "#EBDDF3"], ["Coral", "#FF6B4A", "#FFD1BF"]]},
    {"id": "chipi-limon", "name": "Chipi Limón", "cat": "chipiron", "def_size": 2, "extra": 0, "sink": "4 s/m", "stock": 10, "badge": "", "badge_style": "", "serial": "029/150", "shape": "chipiron", "back": "#E3A300", "body": "#FFF1B8", "pattern": "dots", "bg1": "#12345E", "bg2": "#0A1A2F", "variants": [["Limón", "#E3A300", "#FFF1B8"], ["Lima", "#7BB342", "#E8F3C9"], ["Naranja", "#FF6B4A", "#FFE7A0"], ["Blanco", "#9CC9E6", "#F6F3EC"]]}
  ];

  const PRODUCTS = [];  // se rellena al cargar el catálogo (spatial.js usa esta misma lista)
  const variantsOf = p => (p.variants && p.variants.length ? p.variants : [['Original', p.lure.back, p.lure.body]]);
  const photoImg = (url, alt) => `<img class="pimg" src="${escapeHTML(url)}" alt="${escapeHTML(alt)}" loading="lazy" decoding="async">`;

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
          meta: `${size.cm} cm · ${size.g} g`, price: priceFor(p, k), lure: p.lure, photo: p.photo };
      }
      const vs = variantsOf(p);
      if (!isIndex(ref.color, vs.length)) return null;
      const [vName, back, body] = vs[ref.color];
      return { ref: { kind: 'cat', id: p.id, size: k, color: ref.color }, key: `cat:${p.id}:${k}:${ref.color}`, name: p.name,
        meta: `${size.cm} cm · ${vName}`, price: priceFor(p, k), lure: { ...p.lure, back, body }, photo: p.photo };
    }

    if (ref.kind === 'custom') {
      if (!has(NAMES, ref.shape) || !has(PATTERN_NAMES, ref.pattern) || !BACKS.includes(ref.back) || !BODIES.includes(ref.body)) return null;
      const engrave = cleanEngrave(ref.engrave);
      const clean = { kind: 'custom', shape: ref.shape, back: ref.back, body: ref.body, pattern: ref.pattern, size: k, engrave };
      return {
        ref: clean, key: 'custom:' + [clean.shape, clean.back, clean.body, clean.pattern, k, engrave].join('|'),
        name: `Potera a medida (${NAMES[clean.shape]})`,
        meta: `${size.cm} cm${engrave ? ` · “${engrave}”` : ''}`,
        price: size.eur + CUSTOM_FEE + (engrave ? ENGRAVE_FEE : 0),
        lure: { shape: clean.shape, back: clean.back, body: clean.body, pattern: clean.pattern, engrave },
        details: `Lomo ${COLOR_NAMES[clean.back]}, cuerpo ${COLOR_NAMES[clean.body]}, patrón ${PATTERN_NAMES[clean.pattern]}`
      };
    }
    return null;
  }

  /* ------------------------------------------------------------
     Carga del catálogo: Supabase → copia guardada en este navegador → respaldo.
     Todo lo que llega de fuera se valida antes de usarse.
     ------------------------------------------------------------ */
  const CFG = window.JN_CONFIG || {};
  const PHOTO_BASE = CFG.supabaseUrl ? `${CFG.supabaseUrl}/storage/v1/object/public/${CFG.photoBucket || 'product-photos'}/` : '';
  const CATALOG_CACHE = 'jn_catalog_v1';
  const ID_RE = /^[a-z0-9]+(-[a-z0-9]+)*$/;
  const PATH_RE = /^[a-z0-9][a-z0-9/_.-]{0,120}\.(webp|jpg|jpeg|png)$/;
  const SHAPE_KEYS = ['calamar', 'chipiron', 'sepia'];
  const PATTERN_KEYS = ['scales', 'stripes', 'dots', 'none'];
  const str = (v, max) => (typeof v === 'string' ? v : '').slice(0, max).trim();

  function normalizeRow(r) {
    if (!r || typeof r !== 'object') return null;
    const id = typeof r.id === 'string' ? r.id : '';
    const name = str(r.name, 60);
    if (!ID_RE.test(id) || id.length > 40 || name.length < 2 || !has(CATS, r.cat)) return null;
    const extra = Number(r.extra);
    const badge = str(r.badge, 24);
    const variants = (Array.isArray(r.variants) ? r.variants : [])
      .filter(v => Array.isArray(v) && v.length === 3 && str(v[0], 24) && HEX.test(v[1]) && HEX.test(v[2]))
      .slice(0, 6).map(v => [str(v[0], 24), v[1], v[2]]);
    const path = typeof r.photo_path === 'string' && PATH_RE.test(r.photo_path) && !r.photo_path.includes('..') ? r.photo_path : null;
    return {
      id, name, cat: r.cat,
      description: str(r.description, 280),
      def: isIndex(r.def_size, SIZES.length) ? r.def_size : 4,
      extra: Number.isFinite(extra) && extra >= -20 && extra <= 200 ? Math.round(extra * 100) / 100 : 0,
      sink: str(r.sink, 20),
      stock: Number.isInteger(r.stock) && r.stock >= 0 ? r.stock : 0,
      badge: badge ? [badge, ['new', 'limited'].includes(r.badge_style) ? r.badge_style : ''] : null,
      serial: str(r.serial, 20),
      lure: {
        shape: SHAPE_KEYS.includes(r.shape) ? r.shape : 'calamar',
        back: hex(r.back, '#C2662D'), body: hex(r.body, '#F4D9B8'),
        pattern: PATTERN_KEYS.includes(r.pattern) ? r.pattern : 'scales'
      },
      bg: [hex(r.bg1, '#12345E'), hex(r.bg2, '#0A1A2F')],
      photo: path && PHOTO_BASE ? PHOTO_BASE + path.split('/').map(encodeURIComponent).join('/') : null,
      variants
    };
  }

  async function fetchCatalog() {
    if (!CFG.supabaseUrl || !CFG.supabaseKey) return null;
    const ctrl = new AbortController();
    const timer = setTimeout(() => ctrl.abort(), 6000);
    try {
      const res = await fetch(`${CFG.supabaseUrl}/rest/v1/products?select=*&visible=eq.true&order=sort.asc,created_at.asc`, {
        headers: { apikey: CFG.supabaseKey }, signal: ctrl.signal, cache: 'no-store'
      });
      if (!res.ok) return null;
      const data = await res.json();
      return Array.isArray(data) ? data : null;
    } catch { return null; } finally { clearTimeout(timer); }
  }

  async function loadCatalog() {
    let rows = await fetchCatalog(), source = 'supabase';
    if (rows && rows.length) {
      try { localStorage.setItem(CATALOG_CACHE, JSON.stringify({ t: Date.now(), rows })); } catch { /* sin almacenamiento */ }
    } else {
      rows = null;
      try {
        const c = JSON.parse(localStorage.getItem(CATALOG_CACHE) || 'null');
        if (c && Array.isArray(c.rows)) { rows = c.rows; source = 'cache'; }
      } catch { /* nada guardado */ }
    }
    const seen = new Set();
    let list = (rows || []).map(normalizeRow).filter(p => p && !seen.has(p.id) && seen.add(p.id)).slice(0, 60);
    if (!list.length) { list = FALLBACK_ROWS.map(normalizeRow).filter(Boolean); source = 'respaldo'; }
    PRODUCTS.splice(0, PRODUCTS.length, ...list);
    return source;
  }

  const grid = $('#productGrid');
  function renderProducts(filter = 'todos') {
    const list = PRODUCTS.filter(p => filter === 'todos' || p.cat === filter);
    grid.innerHTML = list.map((p, i) => `
      <article class="card" style="animation-delay:${i * 60}ms">
        <div class="card__media" style="background:linear-gradient(160deg, ${p.bg[0]}, ${p.bg[1]})">
          ${p.badge ? `<span class="card__badge ${p.badge[1] ? 'card__badge--' + p.badge[1] : ''}">${escapeHTML(p.badge[0])}</span>` : ''}
          <span class="card__serial">Nº ${escapeHTML(p.serial)}</span>
          ${p.photo ? photoImg(p.photo, p.name) : lureSVG(p.lure)}
        </div>
        <div class="card__body">
          <div class="card__title"><h3>${escapeHTML(p.name)}</h3><span class="card__price" data-price>${eur(priceFor(p, p.def))}</span></div>
          ${p.description ? `<p class="card__desc">${escapeHTML(p.description)}</p>` : ''}
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
  let cart = [];         // [{ ref, qty }] · se carga cuando el catálogo está listo
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
    toast('se ha añadido al carrito', it.name);
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
          <div class="line__thumb">${i.photo ? photoImg(i.photo, i.name) : lureSVG(i.lure)}</div>
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
      '🎣 *NUEVO PEDIDO — Poteras artesanales Jordan Nito*',
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
  // Arranque: primero el catálogo; después el carrito (que se valida contra él)
  const ready = loadCatalog().then(source => {
    cart = loadCart();
    save(); // sustituye lo guardado por la versión validada (borra datos manipulados)
    renderProducts();
    renderCart();
    document.documentElement.dataset.catalog = source;
    return source;
  });

  // Utilidades compartidas con el escaparate espacial (spatial.js)
  window.JN = Object.freeze({ lureSVG, photoImg, PRODUCTS, SIZES, variantsOf, priceFor, addToCart, openCart, eur, escapeHTML, ready });
})();
