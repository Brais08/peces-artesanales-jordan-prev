/* Escaparate espacial · Poteras artesanales Jordan Nito
   Arco 3D de tarjetas de cristal, escaneo sonar y tarjeta de compra. */
(() => {
  'use strict';
  const sec = document.getElementById('inicio');
  if (!sec || !window.JN) return;
  const { lureSVG, photoImg, PRODUCTS, SIZES, variantsOf, priceFor, addToCart, openCart, eur, escapeHTML } = window.JN;
  window.JN.ready.then(() => { if (PRODUCTS.length) init(); });

  function init() {

  const $ = (s, el = sec) => el.querySelector(s);
  const $$ = (s, el = sec) => [...el.querySelectorAll(s)];
  const mod = (a, n) => ((a % n) + n) % n;
  const RM = matchMedia('(prefers-reduced-motion: reduce)').matches;
  const ROLL_EASE = 'cubic-bezier(.2,.8,.2,1)';
  const SCAN_EASE = 'cubic-bezier(.65,0,.35,1)';


  const N = PRODUCTS.length, NC = N * 2; // dos copias para que el arco sea un bucle
  const arc = $('#spArc'), stage = $('#spStage');
  const mCur = $('#mCur'), mNext = $('#mNext'), grid = $('.sp__grid'), scan = $('.sp__scan');
  const sea = $('.sp__sea'), ghost = $('.sp__ghost'), letters = $$('.sp__ghost span');
  const cursor = $('#spCursor');

  /* ---------- Tarjetas ---------- */
  const seeds = [];
  const cards = Array.from({ length: NC }, (_, i) => {
    const p = PRODUCTS[i % N];
    const el = document.createElement('div');
    el.className = 'sp__card glass';
    el.dataset.i = i;
    el.innerHTML = `<div class="sp__g">${p.photo ? photoImg(p.photo, p.name) : lureSVG(p.lure)}</div><span class="sp__cn">${escapeHTML(p.name)}</span><span class="sp__cp">${eur(priceFor(p, p.def))}</span><i class="sp__sheen"></i>`;
    if (!RM) el.addEventListener('pointerenter', () => { el.classList.remove('shine'); void el.offsetWidth; el.classList.add('shine'); });
    arc.appendChild(el);
    seeds.push(Math.random() * Math.PI * 2);
    return el;
  });

  /* ---------- Estado ---------- */
  let pos = 0, target = 0, intro = RM ? 1 : 0, ie = RM ? 1 : 0;
  let px = 0, py = 0, sx = 0, sy = 0;           // puntero normalizado y suavizado
  let mx = -100, my = -100, cx = -100, cy = -100; // cursor
  let dragging = false, x0 = 0, p0 = 0, lastX = 0, lastT = 0, vel = 0, moved = 0, downCard = null;
  let W = 0, H = 0, XS = [];
  let shown = -1, colorIdx = 0, sizeIdx = 0, anims = [];
  let visible = true;

  function layout() {
    W = sec.clientWidth; H = sec.clientHeight;
    const phone = innerWidth < 768;
    XS = (phone ? [0, .42, .54, .6, .63, .65] : [0, .27, .39, .46, .51, .54]).map(v => v * W);
    const CW = phone ? Math.min(innerWidth * .30, 170) : Math.min(innerWidth * .148, innerHeight * .33);
    sec.style.setProperty('--CW', CW + 'px');
    placePill();
  }
  function xAt(a) {
    if (a >= 5) return XS[5];
    const i = Math.floor(a), f = a - i;
    return XS[i] + (XS[i + 1] - XS[i]) * f;
  }

  /* ---------- Bucle de animación ---------- */
  // Suavizado independiente de los fps: k es el factor por fotograma a 60 fps
  let lastNow = 0, f60 = 1;
  const ease = k => 1 - Math.pow(1 - k, f60);

  function frame(now) {
    requestAnimationFrame(frame);
    if (!visible) { lastNow = 0; return; }
    f60 = lastNow ? Math.min(6, (now - lastNow) / (1000 / 60)) : 1;
    lastNow = now;
    const t = now / 1000;

    if (!dragging) pos += (target - pos) * (RM ? 1 : ease(.11));
    if (intro < 1) { intro = Math.min(1, intro + .012 * f60); ie = 1 - Math.pow(1 - intro, 3); }
    sx += (px - sx) * ease(.06); sy += (py - sy) * ease(.06);

    for (let i = 0; i < NC; i++) {
      const el = cards[i];
      const u = mod(i - pos + N, NC) - N, a = Math.abs(u), sg = Math.sign(u);
      let s, z, op, ry, blur = 0;
      if (a < 1) { s = .55 + .45 * a; z = -260 * (1 - a); op = a; ry = -sg * 16 * a; }
      else {
        s = 1 / (1 + .3 * Math.pow(a - 1, 1.15)); z = -110 * (a - 1); op = 1;
        ry = -sg * (16 + 9 * Math.min(2, a - 1)); blur = Math.max(0, a - 1.6) * 2.4;
      }
      if (a > 3.4) op = Math.max(0, 1 - (a - 3.4) / .8);
      op *= ie;
      if (op < .01) { if (el.style.visibility !== 'hidden') el.style.visibility = 'hidden'; continue; }
      const bob = RM ? 0 : Math.sin(t * 1.1 + seeds[i]) * H * .006 * Math.min(1, a);
      const x = sg * xAt(a) * ie;
      const y = bob - (1 - s) * H * .04;
      ry += sx * 10;
      el.style.visibility = 'visible';
      el.style.opacity = op;
      el.style.zIndex = a < 1 ? 1 : Math.round(100 - 10 * a);
      el.style.filter = blur > .05 ? `blur(${blur.toFixed(2)}px)` : '';
      el.style.transform = `translate(${x}px,${y}px) perspective(1300px) translateZ(${z}px) rotateY(${ry}deg) rotateX(${-sy * 6}deg) scale(${s * (.6 + .4 * ie)})`;
    }

    // Paralaje
    sea.style.transform = `translate3d(${-sx * 22}px,${-sy * 14}px,0) scale(${1.08 - .03 * ie})`;
    ghost.style.transform = `translate(calc(-50% - ${sx * 40}px), calc(-50% - ${sy * 16}px))`;
    letters.forEach((l, i) => { l.style.transform = `translateY(${(1 - ie) * (60 + 30 * i)}px)`; });

    // Cursor
    const kc = RM ? 1 : ease(.22);
    cx += (mx - cx) * kc; cy += (my - cy) * kc;
    cursor.style.transform = `translate(${cx}px,${cy}px)`;

    // Cuando el arco se asienta, se "prueba" el señuelo del centro
    if (!dragging && Math.abs(target - pos) < .02) {
      const k = mod(Math.round(target), N);
      if (k !== shown) { colorIdx = 0; sizeIdx = PRODUCTS[k].def; show(k); }
    }
  }

  /* ---------- Escaneo sonar ---------- */
  // Centro y miniatura: la foto si la hay; si no, la ilustración con el color elegido
  const centerHTML = k => (PRODUCTS[k].photo ? photoImg(PRODUCTS[k].photo, PRODUCTS[k].name) : lureSVG(lureFor(k)));
  const lureFor = k => {
    const p = PRODUCTS[k], v = variantsOf(p)[colorIdx];
    return { ...p.lure, back: v[1], body: v[2] };
  };

  function scanTo(html) {
    anims.forEach(a => a.cancel());
    mNext.innerHTML = html;
    if (RM) { mCur.innerHTML = html; mNext.innerHTML = ''; return; }
    const o = { duration: 950, easing: SCAN_EASE, fill: 'forwards' };
    const a1 = mNext.animate([{ clipPath: 'inset(0 100% 0 0)' }, { clipPath: 'inset(0 0% 0 0)' }], o);
    const a2 = grid.animate([{ clipPath: 'inset(0 100% 0 0)' }, { clipPath: 'inset(0 0 0 0)', offset: .5 }, { clipPath: 'inset(0 0 0 100%)' }], { ...o, duration: 1092 });
    const a3 = scan.animate([
      { left: '0%', transform: 'scaleY(.2)', opacity: 0 },
      { left: '6%', transform: 'scaleY(1)', opacity: 1, offset: .08 },
      { left: '94%', transform: 'scaleY(1)', opacity: 1, offset: .92 },
      { left: '100%', transform: 'scaleY(.2)', opacity: 0 }
    ], o);
    const a4 = mNext.animate([{ transform: 'scale(1.012)' }, { transform: 'scale(1)' }], { duration: 1250, easing: 'ease-out' });
    anims = [a1, a2, a3, a4];
    a1.onfinish = () => { mCur.innerHTML = mNext.innerHTML; anims.forEach(a => a.cancel()); anims = []; };
  }

  function show(k) {
    shown = k;
    updateBuy(true);
    updateTabs();
    updateSpecs();
    scanTo(centerHTML(k));
  }

  /* ---------- Tarjeta de compra ---------- */
  const bName = $('#bName'), bPrice = $('#bPrice'), bColor = $('#bColor');
  const bThumb = $('#bThumb'), bSizes = $('#bSizes'), bDots = $('#bDots');

  function roll(ln, text) {
    if (ln.dataset.v === text) return;
    ln.dataset.v = text;
    // Si se cambia rápido (p. ej. varias tallas seguidas) quedan textos de animaciones
    // interrumpidas: se eliminan para que nunca haya más de dos (el que sale y el que entra).
    const spans = [...ln.children];
    const old = spans.pop();
    spans.forEach(s => s.remove());
    const nw = document.createElement('span');
    nw.textContent = text;
    ln.appendChild(nw);
    if (!old) return;
    if (RM) { old.remove(); return; }
    old.getAnimations().forEach(a => a.cancel());
    const o = { duration: 620, easing: ROLL_EASE };
    old.animate([{ transform: 'translateY(0)' }, { transform: 'translateY(-110%)' }], { ...o, fill: 'forwards' }).onfinish = () => old.remove();
    setTimeout(() => old.remove(), o.duration + 80); // respaldo si el navegador retrasa el evento
    nw.animate([{ transform: 'translateY(110%)' }, { transform: 'translateY(0)' }], o);
  }

  const priceNow = () => priceFor(PRODUCTS[shown], sizeIdx);

  function updateThumb() {
    bThumb.innerHTML = centerHTML(shown);
    if (!RM) bThumb.animate([{ transform: 'translateY(70%) scale(.8)', opacity: 0 }, { transform: 'none', opacity: 1 }], { duration: 650, easing: ROLL_EASE });
  }

  function updateBuy(itemChanged) {
    const p = PRODUCTS[shown], v = variantsOf(p);
    roll(bName, p.name);
    roll(bPrice, eur(priceNow()));
    roll(bColor, `Color · ${v[colorIdx][0]}`);
    if (!itemChanged) return;
    updateThumb();
    bSizes.innerHTML = SIZES.map((s, i) => `<button type="button" class="${i === sizeIdx ? 'is-active' : ''}" data-s="${i}" aria-label="${s.cm} centímetros">${s.cm}</button>`).join('');
    bDots.innerHTML = v.map((c, i) => `<button type="button" class="sp__dotc ${i === colorIdx ? 'is-active' : ''}" data-c="${i}" style="--a:${c[1]};--b:${c[2]}" aria-label="Color ${escapeHTML(c[0])}"></button>`).join('');
  }

  bSizes.addEventListener('click', e => {
    const b = e.target.closest('[data-s]'); if (!b) return;
    sizeIdx = +b.dataset.s;
    $$('button', bSizes).forEach(x => x.classList.toggle('is-active', x === b));
    roll(bPrice, eur(priceNow()));
  });

  bDots.addEventListener('click', e => {
    const b = e.target.closest('[data-c]'); if (!b || +b.dataset.c === colorIdx) return;
    colorIdx = +b.dataset.c;
    $$('button', bDots).forEach(x => x.classList.toggle('is-active', x === b));
    roll(bColor, `Color · ${variantsOf(PRODUCTS[shown])[colorIdx][0]}`);
    updateThumb();
    scanTo(centerHTML(shown)); // el sonar vuelve a "pintar" el señuelo
  });

  $('#bAdd').addEventListener('click', () => {
    // Solo se envía qué producto, talla y color: el precio lo calcula siempre el catálogo
    addToCart({ kind: 'cat', id: PRODUCTS[shown].id, size: sizeIdx, color: colorIdx });
  });

  /* ---------- Etiquetas técnicas ---------- */
  const spNado = $('#spNado'), spSerie = $('#spSerie');
  function updateSpecs() {
    const p = PRODUCTS[shown];
    [[spNado, p.sink], [spSerie, `Nº ${p.serial}`]].forEach(([el, txt]) => {
      el.textContent = txt;
      if (!RM) el.parentElement.animate([{ opacity: 0, transform: 'translateY(8px)' }, { opacity: 1, transform: 'none' }], { duration: 500, delay: 300, easing: ROLL_EASE, fill: 'backwards' });
    });
  }

  /* ---------- Pestañas ---------- */
  const tabs = $$('.sp__tab'), pill = $('.sp__pill');
  function placePill() {
    const a = tabs.find(t => t.classList.contains('is-active'));
    if (!a) { pill.style.opacity = 0; return; }
    pill.style.opacity = 1;
    pill.style.width = a.offsetWidth + 'px';
    pill.style.transform = `translateX(${a.offsetLeft}px)`;
  }
  function updateTabs() {
    const cat = PRODUCTS[shown].cat;
    tabs.forEach(t => t.classList.toggle('is-active', t.dataset.cat === cat));
    placePill();
  }
  tabs.forEach(t => t.addEventListener('click', () => {
    const cat = t.dataset.cat; if (!cat) return;
    const from = mod(Math.round(target), N);
    for (let d = 1; d <= N; d++) {
      if (PRODUCTS[mod(from + d, N)].cat === cat) { target += d; break; }
    }
  }));

  /* ---------- Entrada: arrastre, clic, rueda, teclado ---------- */
  function cursorState(el) {
    let s = '';
    if (dragging) s = 'drag';
    else if (el.closest('.sp__card')) s = 'try';
    else if (el.closest('button, a, input')) s = 'btn';
    else if (el.closest('#spStage')) s = 'drag';
    cursor.dataset.state = s;
  }

  sec.addEventListener('pointerenter', e => { if (e.pointerType === 'mouse') { cx = mx = e.clientX; cy = my = e.clientY; cursor.classList.add('is-on'); } });
  sec.addEventListener('pointerleave', () => cursor.classList.remove('is-on'));
  sec.addEventListener('pointermove', e => {
    mx = e.clientX; my = e.clientY;
    const r = sec.getBoundingClientRect();
    px = (e.clientX - r.left) / r.width - .5;
    py = (e.clientY - r.top) / r.height - .5;
    if (dragging) {
      const dx = e.clientX - x0;
      moved = Math.max(moved, Math.abs(dx));
      pos = p0 - dx / XS[1];
      const nowT = performance.now(), dt = Math.max(1, nowT - lastT);
      vel = vel * .6 + ((e.clientX - lastX) / dt) * .4;
      lastX = e.clientX; lastT = nowT;
    }
    cursorState(e.target);
  });

  stage.addEventListener('pointerdown', e => {
    if (e.button !== 0) return;
    dragging = true; moved = 0; vel = 0; p0 = pos;
    x0 = lastX = e.clientX; lastT = performance.now();
    downCard = e.target.closest('.sp__card');
    stage.setPointerCapture(e.pointerId);
    cursor.classList.add('is-down');
    cursor.dataset.state = 'drag';
  });
  function endDrag() {
    if (!dragging) return;
    dragging = false;
    cursor.classList.remove('is-down');
    if (moved < 6) {
      if (downCard) {
        const u = mod(+downCard.dataset.i - pos + N, NC) - N;
        target = Math.round(pos + u);
      } else target = Math.round(pos);
    } else {
      if (performance.now() - lastT > 80) vel = 0;
      target = Math.round(pos - vel * 3.2);
    }
  }
  stage.addEventListener('pointerup', endDrag);
  stage.addEventListener('pointercancel', endDrag);

  // Rueda: solo desplazamiento horizontal (o Mayús + rueda) para no bloquear el scroll de la página
  let wAcc = 0, wLast = 0;
  sec.addEventListener('wheel', e => {
    const d = Math.abs(e.deltaX) > Math.abs(e.deltaY) ? e.deltaX : (e.shiftKey ? e.deltaY : 0);
    if (!d) return;
    e.preventDefault();
    wAcc += d;
    const nowT = performance.now();
    if (Math.abs(wAcc) > 60 && nowT - wLast > 260) { target += Math.sign(wAcc); wAcc = 0; wLast = nowT; }
  }, { passive: false });

  addEventListener('keydown', e => {
    if (!visible || e.target.closest('input, textarea')) return;
    if (document.getElementById('drawer').classList.contains('is-open')) return;
    if (e.key === 'ArrowRight') target++;
    else if (e.key === 'ArrowLeft') target--;
  });
  $('#spPrev').addEventListener('click', () => target--);
  $('#spNext').addEventListener('click', () => target++);
  $('[data-open-cart]').addEventListener('click', openCart);

  /* ---------- Arranque ---------- */
  if ('IntersectionObserver' in window) {
    new IntersectionObserver(([en]) => {
      visible = en.isIntersecting;
      document.body.classList.toggle('in-hero', en.intersectionRatio > .35);
    }, { threshold: [0, .35, .6] }).observe(sec);
  }
  addEventListener('resize', layout);
  if (document.fonts) document.fonts.ready.then(placePill);
  layout();
  // Se rellena la tarjeta de compra desde el arranque (no depende de la animación)
  sizeIdx = PRODUCTS[0].def;
  show(0);
  requestAnimationFrame(frame);
  }
})();
