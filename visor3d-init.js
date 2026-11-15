/* Recorrido 3D del taller: calcula el avance del scroll y carga el 3D
   solo cuando el cliente se acerca a la sección (carga diferida). */
(() => {
  'use strict';
  const story = document.getElementById('visor3d');
  if (!story) return;
  const stage = document.getElementById('viewerStage');
  const sticky = story.querySelector('.story__sticky');
  const steps = [...story.querySelectorAll('.story__step')];
  const loading = document.getElementById('viewerLoading');
  const colors = document.getElementById('viewerColors');
  const numEl = document.getElementById('storyNum'), nameEl = document.getElementById('storyName');
  const RM = matchMedia('(prefers-reduced-motion: reduce)').matches;
  const FREE_FROM = 3.5;   // igual que en visor3d.js
  let viewer = null;

  if (RM) story.classList.add('is-rm');

  // Burbujas del paso "Prueba en agua"
  const bubbles = story.querySelector('.story__bubbles');
  for (let i = 0; i < 12; i++) {
    const b = document.createElement('span');
    const size = 3 + Math.random() * 9;
    Object.assign(b.style, { width: size + 'px', height: size + 'px', left: 10 + Math.random() * 80 + '%',
      animationDuration: 4 + Math.random() * 5 + 's', animationDelay: -Math.random() * 6 + 's' });
    b.style.setProperty('--dx', (Math.random() * 40 - 20) + 'px');
    bubbles.appendChild(b);
  }

  /* Avance: 0 al empezar el paso 1 … 4 al terminar el paso 4.
     La "línea de lectura" es el centro de la zona visible de los pasos. */
  function progress() {
    const mobile = innerWidth <= 900;
    const line = mobile ? (sticky.getBoundingClientRect().bottom + innerHeight) / 2 : innerHeight / 2;
    for (let i = 0; i < steps.length; i++) {
      const r = steps[i].getBoundingClientRect();
      if (line < r.bottom) return i + Math.min(1, Math.max(0, (line - r.top) / r.height));
    }
    return steps.length;
  }

  let lastStep = -1, lastWater = null, lastFree = null, ticking = false;
  function update() {
    ticking = false;
    const t = RM ? 4 : progress();
    const idx = Math.min(3, Math.floor(t));
    if (idx !== lastStep) {
      lastStep = idx;
      steps.forEach((s, i) => s.classList.toggle('is-active', i === idx));
      numEl.textContent = '0' + (idx + 1);
      nameEl.textContent = steps[idx].querySelector('h3').textContent;
    }
    const water = t >= 2.95;
    if (water !== lastWater) { lastWater = water; story.classList.toggle('is-water', water); }
    const free = t >= FREE_FROM;
    if (free !== lastFree) { lastFree = free; story.classList.toggle('is-free', free); }
    if (viewer) viewer.setProgress(t);
  }
  const onScroll = () => { if (!ticking) { ticking = true; requestAnimationFrame(update); } };
  addEventListener('scroll', onScroll, { passive: true });
  addEventListener('resize', onScroll);
  update();

  // Si el navegador no puede mostrar 3D: pasos normales e ilustración fija
  function fallback() {
    story.classList.add('is-static');
    story.classList.remove('is-free', 'is-water');
    loading.textContent = '';
    if (window.JN && !stage.querySelector('.viewer__fallback')) {
      const div = document.createElement('div');
      div.className = 'viewer__fallback';
      div.innerHTML = window.JN.lureSVG({ shape: 'calamar' });
      stage.appendChild(div);
    }
  }

  function start() {
    import('./visor3d.js').then(({ mountViewer, FINISHES }) => {
      viewer = mountViewer(stage, { onReady: () => story.classList.add('is-ready'), onError: fallback, reducedMotion: RM });
      if (!viewer) return;
      update();
      FINISHES.forEach((f, i) => {
        const b = document.createElement('button');
        b.type = 'button';
        b.className = 'viewer__color' + (i === 0 ? ' is-active' : '');
        b.style.setProperty('--c', f.swatch || f.color);
        b.setAttribute('aria-label', 'Ver en color ' + f.name);
        b.title = f.name;
        b.addEventListener('click', () => {
          colors.querySelectorAll('.viewer__color').forEach(x => x.classList.toggle('is-active', x === b));
          viewer.setColor(f.color);
        });
        colors.appendChild(b);
      });
    }).catch(fallback);
  }

  if (!('IntersectionObserver' in window)) { start(); return; }
  const io = new IntersectionObserver(([en]) => {
    if (en.isIntersecting) { io.disconnect(); start(); }
  }, { rootMargin: '600px 0px' });
  io.observe(story);
})();
