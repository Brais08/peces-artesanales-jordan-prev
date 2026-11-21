/* Panel de administración · Poteras artesanales Jordan Nito
   Inicio de sesión con Supabase Auth y gestión del catálogo.
   La seguridad real está en la base de datos (RLS): aunque alguien manipule
   esta página, Supabase solo acepta cambios del usuario administrador. */
(() => {
  'use strict';
  const CFG = window.JN_CONFIG;
  const { lureSVG, escapeHTML, HEX } = window.JNLure;
  const SB = CFG.supabaseUrl, KEY = CFG.supabaseKey, BUCKET = CFG.photoBucket || 'product-photos';

  const $ = (s, el = document) => el.querySelector(s);
  const $$ = (s, el = document) => [...el.querySelectorAll(s)];
  const SESSION_KEY = 'jn_admin_session';   // sessionStorage: se borra al cerrar la pestaña
  const SIZES_CM = ['5,5', '6', '7', '8', '9', '10', '11'];
  const CATS = { calamar: 'Calamar', chipiron: 'Chipirón', sepia: 'Sepia' };
  const ID_RE = /^[a-z0-9]+(-[a-z0-9]+)*$/;
  const MAX_UPLOAD_SOURCE = 15 * 1024 * 1024;  // foto original: hasta 15 MB
  const MAX_UPLOAD = 2 * 1024 * 1024;          // foto ya reducida: hasta 2 MB (límite del almacenamiento)
  const PHOTO_TYPES = ['image/jpeg', 'image/png', 'image/webp'];

  let session = null, products = [], editing = null, pendingPhoto = null, pendingURL = null, removePhoto = false, busy = false;

  /* ------------------------------------------------------------
     Utilidades
     ------------------------------------------------------------ */
  const clean = (v, max) => String(v ?? '')
    .normalize('NFC')
    .replace(/[\u0000-\u001F\u007F-\u009F\u200B-\u200F\u2028-\u202E\u2060-\u206F\uFEFF]/g, ' ')
    .replace(/[<>]/g, '')
    .replace(/\s+/g, ' ')
    .trim()
    .slice(0, max);
  const safeHex = (v, d) => (typeof v === 'string' && HEX.test(v) ? v : d);
  const photoUrl = path => (path ? `${SB}/storage/v1/object/public/${BUCKET}/${path.split('/').map(encodeURIComponent).join('/')}` : null);

  let toastTimer;
  function toast(text) {
    const t = $('#toast');
    t.textContent = text;
    t.classList.add('is-show');
    clearTimeout(toastTimer);
    toastTimer = setTimeout(() => t.classList.remove('is-show'), 3200);
  }

  /* ------------------------------------------------------------
     Sesión (Supabase Auth)
     ------------------------------------------------------------ */
  function loadSession() { try { session = JSON.parse(sessionStorage.getItem(SESSION_KEY) || 'null'); } catch { session = null; } }
  function saveSession(s) {
    session = s;
    try { s ? sessionStorage.setItem(SESSION_KEY, JSON.stringify(s)) : sessionStorage.removeItem(SESSION_KEY); } catch { /* nada */ }
  }
  const fromAuth = d => ({ access: d.access_token, refresh: d.refresh_token, exp: Date.now() + (d.expires_in || 3600) * 1000, email: (d.user && d.user.email) || '' });

  const authPost = (path, body, bearer) => fetch(SB + path, {
    method: 'POST',
    headers: { apikey: KEY, 'Content-Type': 'application/json', ...(bearer ? { Authorization: 'Bearer ' + bearer } : {}) },
    body: JSON.stringify(body || {}),
    cache: 'no-store'
  });

  async function token() {
    if (!session) throw Object.assign(new Error('auth'), { auth: true });
    if (Date.now() > session.exp - 60000) {
      const r = await authPost('/auth/v1/token?grant_type=refresh_token', { refresh_token: session.refresh });
      if (!r.ok) { saveSession(null); throw Object.assign(new Error('auth'), { auth: true }); }
      saveSession({ ...fromAuth(await r.json()), email: session.email });
    }
    return session.access;
  }

  async function api(path, { method = 'GET', body, headers = {}, raw = false } = {}) {
    const t = await token();
    const r = await fetch(SB + path, {
      method,
      headers: { apikey: KEY, Authorization: 'Bearer ' + t, ...(body && !raw ? { 'Content-Type': 'application/json' } : {}), ...headers },
      body: raw ? body : body ? JSON.stringify(body) : undefined,
      cache: 'no-store'
    });
    if (r.status === 401) {
      saveSession(null);
      showLogin('La sesión ha caducado. Vuelve a entrar.');
      throw Object.assign(new Error('auth'), { auth: true });
    }
    if (!r.ok) {
      let msg = '';
      try { const j = await r.json(); msg = j.message || j.error || ''; } catch { /* sin detalle */ }
      throw Object.assign(new Error(msg || 'Error ' + r.status), { status: r.status });
    }
    if (r.status === 204) return null;
    return (r.headers.get('content-type') || '').includes('json') ? r.json() : null;
  }

  async function logout(silent) {
    const t = session && session.access;
    saveSession(null);
    if (t) { try { await authPost('/auth/v1/logout', {}, t); } catch { /* da igual: la sesión local ya no existe */ } }
    if (!silent) showLogin('Has cerrado la sesión.');
  }

  /* ------------------------------------------------------------
     Pantallas
     ------------------------------------------------------------ */
  function showLogin(message = '') {
    $('#panel').hidden = true;
    $('#topRight').hidden = true;
    $('#login').hidden = false;
    $('#loginMsg').textContent = message;
    if ($('#editor').open) $('#editor').close();
    setTimeout(() => $('#email').focus(), 50);
  }

  async function enterPanel() {
    $('#login').hidden = true;
    $('#panel').hidden = false;
    $('#topRight').hidden = false;
    $('#who').textContent = session.email;
    await loadProducts();
  }

  let fails = 0, lockUntil = 0;
  $('#loginForm').addEventListener('submit', async e => {
    e.preventDefault();
    const msg = $('#loginMsg');
    if (Date.now() < lockUntil) { msg.textContent = 'Demasiados intentos seguidos. Espera unos segundos.'; return; }
    const email = $('#email').value.trim().slice(0, 254), password = $('#password').value;
    if (!email || !password) { msg.textContent = 'Escribe tu correo y tu contraseña.'; return; }
    const btn = $('#loginBtn');
    btn.disabled = true; msg.textContent = '';
    try {
      const r = await authPost('/auth/v1/token?grant_type=password', { email, password });
      if (!r.ok) {
        if (++fails >= 5) { fails = 0; lockUntil = Date.now() + 30000; }
        throw new Error('cred');
      }
      fails = 0;
      saveSession(fromAuth(await r.json()));
      $('#password').value = '';
      const rows = await api('/rest/v1/admins?select=user_id');
      if (!Array.isArray(rows) || !rows.length) {
        await logout(true);
        msg.textContent = 'Esta cuenta no tiene permisos de administración.';
        return;
      }
      await enterPanel();
    } catch (err) {
      msg.textContent = err.message === 'cred' ? 'Correo o contraseña incorrectos.' : 'No se pudo conectar. Inténtalo de nuevo.';
    } finally { btn.disabled = false; }
  });

  $('#logoutBtn').addEventListener('click', () => logout(false));

  /* ------------------------------------------------------------
     Listado
     ------------------------------------------------------------ */
  async function loadProducts() {
    try {
      products = await api('/rest/v1/products?select=*&order=sort.asc,created_at.asc') || [];
      render();
    } catch (err) {
      if (!err.auth) $('#list').innerHTML = '<p class="empty">No se pudo cargar el catálogo. Recarga la página.</p>';
    }
  }

  function thumbHTML(p) {
    const u = photoUrl(p.photo_path);
    return u ? `<img src="${escapeHTML(u)}" alt="" loading="lazy">` : lureSVG({ shape: p.shape, back: p.back, body: p.body, pattern: p.pattern });
  }

  function render() {
    const visibles = products.filter(p => p.visible).length;
    $('#count').textContent = `${products.length} poteras · ${visibles} visibles en la web`;
    $('#list').innerHTML = products.length ? products.map((p, i) => `
      <article class="row${p.visible ? '' : ' is-hidden'}" data-id="${escapeHTML(p.id)}">
        <div class="row__thumb" style="background:linear-gradient(160deg,${safeHex(p.bg1, '#12345E')},${safeHex(p.bg2, '#0A1A2F')})">${thumbHTML(p)}</div>
        <div class="row__info">
          <strong>${escapeHTML(p.name)}</strong>
          <span>${CATS[p.cat] || ''} · stock ${Number(p.stock) || 0}${p.badge ? ` · «${escapeHTML(p.badge)}»` : ''}${p.photo_path ? ' · con foto' : ''}</span>
          ${p.visible ? '' : '<em>Oculta en la web</em>'}
        </div>
        <div class="row__actions">
          <button type="button" class="icon-btn" data-act="up" aria-label="Subir" ${i === 0 ? 'disabled' : ''}>↑</button>
          <button type="button" class="icon-btn" data-act="down" aria-label="Bajar" ${i === products.length - 1 ? 'disabled' : ''}>↓</button>
          <button type="button" class="btn btn--ghost-dark btn--sm" data-act="toggle">${p.visible ? 'Ocultar' : 'Mostrar'}</button>
          <button type="button" class="btn btn--navy btn--sm" data-act="edit">Editar</button>
          <button type="button" class="btn btn--danger btn--sm" data-act="delete">Borrar</button>
        </div>
      </article>`).join('') : '<p class="empty">Aún no hay poteras. Pulsa «+ Nueva potera».</p>';
  }

  $('#list').addEventListener('click', async e => {
    const btn = e.target.closest('[data-act]');
    if (!btn || busy) return;
    const id = btn.closest('.row').dataset.id;
    const idx = products.findIndex(p => p.id === id);
    if (idx < 0) return;
    const p = products[idx];
    const act = btn.dataset.act;
    if (act === 'edit') return openEditor(p);
    busy = true;
    try {
      if (act === 'toggle') {
        await patch(p.id, { visible: !p.visible });
        toast(p.visible ? 'Oculta: ya no aparece en la web.' : 'Visible: ya aparece en la web.');
      } else if (act === 'up' || act === 'down') {
        const j = act === 'up' ? idx - 1 : idx + 1;
        const order = products.slice();
        [order[idx], order[j]] = [order[j], order[idx]];
        // Se renumera el orden solo en las fichas que cambian
        for (let k = 0; k < order.length; k++) {
          const want = (k + 1) * 10;
          if (order[k].sort !== want) await patch(order[k].id, { sort: want });
        }
      } else if (act === 'delete') {
        if (!confirm(`¿Borrar «${p.name}» definitivamente?\nEsta acción no se puede deshacer. Si solo quieres quitarla de la web, usa «Ocultar».`)) return;
        const done = await api(`/rest/v1/products?id=eq.${encodeURIComponent(p.id)}`, { method: 'DELETE', headers: { Prefer: 'return=representation' } });
        if (!Array.isArray(done) || !done.length) throw new Error('No tienes permiso para borrar.');
        if (p.photo_path) await deletePhoto(p.photo_path);
        toast('Potera borrada.');
      }
      await loadProducts();
    } catch (err) {
      if (!err.auth) toast('No se pudo guardar: ' + err.message);
    } finally { busy = false; }
  });

  async function patch(id, fields) {
    const done = await api(`/rest/v1/products?id=eq.${encodeURIComponent(id)}`, { method: 'PATCH', body: fields, headers: { Prefer: 'return=representation' } });
    if (!Array.isArray(done) || !done.length) throw new Error('No tienes permiso para modificar.');
    return done[0];
  }

  async function deletePhoto(path) {
    try { await api(`/storage/v1/object/${BUCKET}/${path.split('/').map(encodeURIComponent).join('/')}`, { method: 'DELETE' }); } catch { /* foto huérfana: no bloquea */ }
  }

  $('#exportBtn').addEventListener('click', () => {
    const blob = new Blob([JSON.stringify(products, null, 2)], { type: 'application/json' });
    const a = document.createElement('a');
    a.href = URL.createObjectURL(blob);
    a.download = `catalogo-poteras-${new Date().toISOString().slice(0, 10)}.json`;
    document.body.appendChild(a); a.click(); a.remove();
    setTimeout(() => URL.revokeObjectURL(a.href), 2000);
    toast('Copia del catálogo descargada.');
  });

  /* ------------------------------------------------------------
     Editor de ficha
     ------------------------------------------------------------ */
  const form = $('#editForm'), dialog = $('#editor');
  form.elements.def_size.innerHTML = SIZES_CM.map((s, i) => `<option value="${i}">${s} cm</option>`).join('');

  const DEFAULTS = { name: '', cat: 'calamar', description: '', def_size: 4, extra: 0, sink: '', stock: 0, badge: '', badge_style: '', serial: '',
    shape: 'calamar', back: '#C2662D', body: '#F4D9B8', pattern: 'scales', bg1: '#12345E', bg2: '#0A1A2F', visible: true, variants: [], photo_path: null };

  function variantRow(v = ['', '#C2662D', '#F4D9B8']) {
    const row = document.createElement('div');
    row.className = 'variant';
    row.innerHTML = `
      <input type="text" maxlength="24" placeholder="Nombre del color" aria-label="Nombre del color">
      <input type="color" aria-label="Color del lomo" title="Lomo">
      <input type="color" aria-label="Color del cuerpo" title="Cuerpo">
      <button type="button" class="icon-btn" aria-label="Quitar este color">✕</button>`;
    const [name, back, body] = row.querySelectorAll('input');
    name.value = String(v[0] || '').slice(0, 24);
    back.value = safeHex(v[1], '#C2662D').toLowerCase();
    body.value = safeHex(v[2], '#F4D9B8').toLowerCase();
    row.querySelector('button').addEventListener('click', () => { row.remove(); updateAddVariant(); });
    return row;
  }
  function updateAddVariant() { $('#addVariant').disabled = $$('#variants .variant').length >= 6; }
  $('#addVariant').addEventListener('click', () => {
    if ($$('#variants .variant').length >= 6) return;
    const f = form.elements;
    $('#variants').appendChild(variantRow(['', f.back.value, f.body.value]));
    updateAddVariant();
  });

  function setPending(blob) {
    if (pendingURL) URL.revokeObjectURL(pendingURL);
    pendingPhoto = blob;
    pendingURL = blob ? URL.createObjectURL(blob) : null;
  }

  function openEditor(p) {
    editing = p || null;
    const d = { ...DEFAULTS, ...(p || {}) };
    const f = form.elements;
    $('#editorTitle').textContent = p ? `Editar «${p.name}»` : 'Nueva potera';
    for (const k of ['name', 'cat', 'description', 'def_size', 'extra', 'sink', 'stock', 'badge', 'badge_style', 'serial', 'shape', 'pattern']) f[k].value = d[k] ?? '';
    for (const k of ['back', 'body', 'bg1', 'bg2']) f[k].value = safeHex(d[k], DEFAULTS[k]).toLowerCase();
    f.visible.checked = !!d.visible;
    $('#variants').replaceChildren(...(Array.isArray(d.variants) ? d.variants : []).slice(0, 6).map(variantRow));
    updateAddVariant();
    setPending(null);
    removePhoto = false;
    $('#photoInput').value = '';
    $('#formMsg').textContent = '';
    $('#descCount').textContent = f.description.value.length;
    updatePreview();
    dialog.showModal();
    f.name.focus();
  }

  function closeEditor() { dialog.close(); setPending(null); editing = null; }
  $('#newBtn').addEventListener('click', () => openEditor(null));
  $('#closeEditor').addEventListener('click', closeEditor);
  $('#cancelEdit').addEventListener('click', closeEditor);
  dialog.addEventListener('close', () => setPending(null));

  function currentPhotoURL() {
    if (pendingURL) return pendingURL;
    if (removePhoto || !editing) return null;
    return photoUrl(editing.photo_path);
  }

  function updatePreview() {
    const f = form.elements;
    const box = $('#preview');
    box.style.background = `linear-gradient(160deg, ${safeHex(f.bg1.value, '#12345E')}, ${safeHex(f.bg2.value, '#0A1A2F')})`;
    const url = currentPhotoURL();
    box.innerHTML = url
      ? `<img src="${escapeHTML(url)}" alt="Foto de la potera">`
      : lureSVG({ shape: f.shape.value, back: f.back.value, body: f.body.value, pattern: f.pattern.value });
    $('#removePhoto').hidden = !url;
  }
  form.addEventListener('input', e => {
    if (e.target.name === 'description') $('#descCount').textContent = e.target.value.length;
    if (['shape', 'pattern', 'back', 'body', 'bg1', 'bg2'].includes(e.target.name)) updatePreview();
  });

  // Foto: se valida y se reduce en el navegador (máx. 1400 px, WebP) antes de subirla
  $('#photoInput').addEventListener('change', async e => {
    const file = e.target.files && e.target.files[0];
    if (!file) return;
    const msg = $('#formMsg');
    if (!PHOTO_TYPES.includes(file.type)) { msg.textContent = 'La foto debe ser JPG, PNG o WebP.'; e.target.value = ''; return; }
    if (file.size > MAX_UPLOAD_SOURCE) { msg.textContent = 'La foto es demasiado grande (máximo 15 MB).'; e.target.value = ''; return; }
    msg.textContent = 'Preparando la foto…';
    try {
      const blob = await shrink(file);
      setPending(blob);
      removePhoto = false;
      msg.textContent = '';
      updatePreview();
    } catch {
      msg.textContent = 'No se pudo leer la foto. Prueba con otra.';
    }
  });

  async function shrink(file) {
    const bmp = await createImageBitmap(file);
    const scale = Math.min(1, 1400 / Math.max(bmp.width, bmp.height));
    const w = Math.round(bmp.width * scale), h = Math.round(bmp.height * scale);
    const canvas = document.createElement('canvas');
    canvas.width = w; canvas.height = h;
    canvas.getContext('2d').drawImage(bmp, 0, 0, w, h);
    bmp.close && bmp.close();
    for (const q of [0.86, 0.75, 0.6]) {
      const blob = await new Promise(res => canvas.toBlob(res, 'image/webp', q));
      if (blob && blob.type === 'image/webp' && blob.size <= MAX_UPLOAD) return blob;
    }
    throw new Error('demasiado grande');
  }

  $('#removePhoto').addEventListener('click', () => {
    setPending(null);
    removePhoto = true;
    $('#photoInput').value = '';
    updatePreview();
  });

  function slugId(name) {
    const base = name.normalize('NFD').replace(/[\u0300-\u036f]/g, '').toLowerCase()
      .replace(/[^a-z0-9]+/g, '-').replace(/^-+|-+$/g, '').slice(0, 30).replace(/-+$/, '') || 'potera';
    const rnd = new Uint32Array(1); crypto.getRandomValues(rnd);
    return `${base}-${rnd[0].toString(36).slice(0, 4)}`;
  }

  // Recoge y valida el formulario (la base de datos vuelve a validarlo todo)
  function collect() {
    const f = form.elements;
    const num = (v, min, max, dec) => { const n = Number(v); return Number.isFinite(n) && n >= min && n <= max ? (dec ? Math.round(n * 100) / 100 : Math.trunc(n)) : null; };
    const data = {
      name: clean(f.name.value, 60),
      cat: CATS[f.cat.value] ? f.cat.value : null,
      description: clean(f.description.value, 280),
      def_size: num(f.def_size.value, 0, 6),
      extra: num(f.extra.value || 0, -20, 200, true),
      sink: clean(f.sink.value, 20),
      stock: num(f.stock.value || 0, 0, 9999),
      badge: clean(f.badge.value, 24),
      badge_style: ['', 'new', 'limited'].includes(f.badge_style.value) ? f.badge_style.value : '',
      serial: clean(f.serial.value, 20),
      shape: ['calamar', 'chipiron', 'sepia'].includes(f.shape.value) ? f.shape.value : 'calamar',
      pattern: ['scales', 'stripes', 'dots', 'none'].includes(f.pattern.value) ? f.pattern.value : 'scales',
      back: safeHex(f.back.value, null), body: safeHex(f.body.value, null),
      bg1: safeHex(f.bg1.value, null), bg2: safeHex(f.bg2.value, null),
      visible: f.visible.checked,
      variants: $$('#variants .variant').map(r => {
        const [n, b, c] = r.querySelectorAll('input');
        return [clean(n.value, 24), safeHex(b.value, null), safeHex(c.value, null)];
      }).filter(v => v[0] && v[1] && v[2]).slice(0, 6)
    };
    if (data.name.length < 2) return { error: 'Escribe un nombre (mínimo 2 letras).' };
    if (!data.cat) return { error: 'Elige la especie.' };
    if (data.def_size === null) return { error: 'Elige la talla por defecto.' };
    if (data.extra === null) return { error: 'El recargo debe estar entre -20 y 200 €.' };
    if (data.stock === null) return { error: 'El stock debe ser un número entre 0 y 9999.' };
    if (!data.back || !data.body || !data.bg1 || !data.bg2) return { error: 'Revisa los colores.' };
    return { data };
  }

  form.addEventListener('submit', async e => {
    e.preventDefault();
    if (busy) return;
    const msg = $('#formMsg');
    const { data, error } = collect();
    if (error) { msg.textContent = error; return; }
    busy = true;
    const saveBtn = $('#saveBtn');
    saveBtn.disabled = true; msg.textContent = 'Guardando…';
    const isNew = !editing;
    const id = isNew ? slugId(data.name) : editing.id;
    if (!ID_RE.test(id)) { msg.textContent = 'Nombre no válido.'; busy = false; saveBtn.disabled = false; return; }
    let photo_path = isNew ? null : editing.photo_path, uploaded = null, oldPath = null;
    try {
      if (pendingPhoto) {
        const path = `${id}/${Date.now().toString(36)}.webp`;
        await api(`/storage/v1/object/${BUCKET}/${path}`, {
          method: 'POST', body: pendingPhoto, raw: true,
          headers: { 'Content-Type': 'image/webp', 'x-upsert': 'false', 'cache-control': '31536000' }
        });
        uploaded = path; oldPath = photo_path; photo_path = path;
      } else if (removePhoto) {
        oldPath = photo_path; photo_path = null;
      }
      const row = { ...data, photo_path };
      if (isNew) {
        const maxSort = products.reduce((m, p) => Math.max(m, p.sort || 0), 0);
        await api('/rest/v1/products', { method: 'POST', body: { ...row, id, sort: maxSort + 10 }, headers: { Prefer: 'return=minimal' } });
      } else {
        await patch(id, row);
      }
      if (oldPath && oldPath !== photo_path) await deletePhoto(oldPath);
      closeEditor();
      toast(isNew ? 'Potera creada. Ya aparece en la web.' : 'Cambios guardados. Ya se ven en la web.');
      await loadProducts();
    } catch (err) {
      if (uploaded) await deletePhoto(uploaded);  // no dejar fotos sueltas si falla el guardado
      if (!err.auth) msg.textContent = 'No se pudo guardar: ' + (err.status === 403 ? 'sin permisos.' : err.message);
    } finally {
      busy = false; saveBtn.disabled = false;
    }
  });

  /* ------------------------------------------------------------
     Arranque
     ------------------------------------------------------------ */
  (async () => {
    loadSession();
    if (!session) return showLogin();
    try {
      const rows = await api('/rest/v1/admins?select=user_id');
      if (Array.isArray(rows) && rows.length) await enterPanel();
      else { await logout(true); showLogin('Esta cuenta no tiene permisos de administración.'); }
    } catch (err) { if (!err.auth) showLogin('No se pudo conectar. Inténtalo de nuevo.'); }
  })();
})();
