/* DIAW DESIGN DÉCO — Réalisations : galerie filtrée (accueil) et album d'une pharmacie (realisation.html)
   Données : data/realisations.json (modifiable depuis /admin) */
(async () => {
  'use strict';

  const PAGE_SIZE = 10;
  const $ = (sel, ctx = document) => ctx.querySelector(sel);
  const $$ = (sel, ctx = document) => [...ctx.querySelectorAll(sel)];
  const grid = $('[data-projects]');
  const album = $('[data-album]');
  if (!grid && !album) return;

  const el = (tag, cls, text) => {
    const n = document.createElement(tag);
    if (cls) n.className = cls;
    if (text != null) n.textContent = text;
    return n;
  };
  const plural = (n, w) => `${n} ${w}${n > 1 ? 's' : ''}`;
  const albumUrl = (r) => `realisation.html?ref=${encodeURIComponent(r.slug)}`;

  let DATA = [];
  try {
    DATA = ((await window.DDD.load('data/realisations.json')).realisations || [])
      .filter((r) => r && r.slug && r.nom && Array.isArray(r.photos) && r.photos.length);
  } catch (e) {
    const msg = el('li', 'projects__empty', 'Les réalisations sont momentanément indisponibles.');
    if (grid) grid.replaceChildren(msg);
    if (album) $('[data-album-title]').textContent = 'Album indisponible';
    return;
  }

  const card = (r, i = 0) => {
    const li = el('li', 'project is-entering');
    li.style.setProperty('--d', `${Math.min(i, 9) * 0.04}s`);
    const a = el('a', 'project__link');
    a.href = albumUrl(r);
    const article = el('article');

    const fig = el('figure', 'project__media');
    const cover = r.photos[0];
    fig.append(window.DDD.image(cover.image, cover.legende || r.nom));
    if (r.ville) {
      const tag = el('span', 'project__tag');
      tag.append(el('span', 'lozenge'), document.createTextNode(r.ville));
      fig.append(tag);
    }
    fig.append(el('span', 'project__count', plural(r.photos.length, 'photo')));

    const body = el('div', 'project__body');
    body.append(el('h3', '', r.nom));
    if (r.prestations && r.prestations.length) body.append(el('p', '', r.prestations.join(' · ')));
    const more = el('span', 'project__open', "Voir l'album");
    more.insertAdjacentHTML('beforeend', '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M5 12h14M13 6l6 6-6 6"/></svg>');
    body.append(more);

    article.append(fig, body);
    a.append(article);
    li.append(a);
    return li;
  };

  /* ==================== Accueil : galerie filtrée ==================== */
  if (grid) {
    const buttons = $$('[data-filter]');
    const moreBtn = $('[data-projects-more]');
    const live = $('[data-project-count]');
    let filter = 'all';
    let limit = PAGE_SIZE;

    // Masque les filtres sans aucune réalisation
    buttons.forEach((b) => {
      const f = b.dataset.filter;
      b.hidden = f !== 'all' && !DATA.some((r) => (r.categories || []).includes(f));
    });

    const render = () => {
      const list = filter === 'all' ? DATA : DATA.filter((r) => (r.categories || []).includes(filter));
      const shown = list.slice(0, limit);
      grid.replaceChildren(...shown.map(card));
      if (!list.length) grid.append(el('li', 'projects__empty', 'Aucune réalisation dans cette catégorie pour le moment.'));
      moreBtn.hidden = list.length <= limit;
      moreBtn.textContent = `Voir plus de réalisations (${list.length - shown.length})`;
      if (live) live.textContent = `${plural(shown.length, 'réalisation')} affichée${shown.length > 1 ? 's' : ''} sur ${list.length}`;
    };

    buttons.forEach((b) => b.addEventListener('click', () => {
      filter = b.dataset.filter;
      limit = PAGE_SIZE;
      buttons.forEach((x) => x.setAttribute('aria-pressed', String(x === b)));
      render();
    }));
    moreBtn.addEventListener('click', () => { limit += PAGE_SIZE; render(); });
    render();
  }

  /* ==================== Album d'une pharmacie ==================== */
  if (!album) return;

  const ref = new URLSearchParams(location.search).get('ref');
  const r = DATA.find((x) => x.slug === ref);
  if (!r) {
    $('[data-album-title]').textContent = 'Réalisation introuvable';
    $('[data-album-desc]').textContent = 'Cette réalisation n\'existe pas ou a été retirée.';
    return;
  }

  document.title = `${r.nom} — Réalisations Diaw Design Déco`;
  $('[data-album-title]').textContent = r.nom;
  $('[data-album-crumb]').textContent = r.nom;
  $('[data-album-desc]').textContent = r.description || '';
  const meta = $('[data-album-meta]');
  if (r.ville) meta.append(el('li', '', r.ville));
  if (r.annee) meta.append(el('li', '', `Livrée en ${r.annee}`));
  meta.append(el('li', '', plural(r.photos.length, 'photo')));
  const tags = $('[data-album-tags]');
  (r.prestations || []).forEach((p) => tags.append(el('li', '', p)));

  // Devis prérempli « projet similaire »
  $('[data-album-quote]').href = `index.html?${new URLSearchParams({ reference: r.nom })}#contact`;

  // Grille de photos
  const photosWrap = $('[data-album-photos]');
  r.photos.forEach((p, i) => {
    const b = el('button', 'album__photo');
    b.type = 'button';
    b.setAttribute('aria-label', `Agrandir la photo ${i + 1} : ${p.legende || r.nom}`);
    b.append(window.DDD.image(p.image, p.legende || r.nom, { eager: i < 2, sizes: '(min-width: 1024px) 50vw, 100vw' }));
    if (p.legende) b.append(el('span', 'album__caption', p.legende));
    b.addEventListener('click', () => openBox(i));
    photosWrap.append(b);
  });
  if (r.photos.length === 1) photosWrap.classList.add('album__photos--single');

  // Autres réalisations : d'abord celles qui partagent une catégorie
  const others = DATA.filter((x) => x !== r)
    .map((x) => ({ x, score: (x.categories || []).filter((c) => (r.categories || []).includes(c)).length }))
    .sort((a, b) => b.score - a.score)
    .slice(0, 3)
    .map((o) => o.x);
  $('[data-album-others]').replaceChildren(...others.map(card));

  /* ---------- Visionneuse ---------- */
  const box = $('[data-lightbox]');
  const boxImg = $('img', box);
  const boxCap = $('[data-lightbox-caption]', box);
  const boxCount = $('[data-lightbox-count]', box);
  let current = 0;
  let lastFocus = null;

  const show = (i) => {
    current = (i + r.photos.length) % r.photos.length;
    const p = r.photos[current];
    const s = window.DDD.sources(p.image);
    boxImg.onerror = s.original ? () => { boxImg.onerror = null; boxImg.src = s.original; } : null;
    boxImg.src = s.large || s.src;
    boxImg.alt = p.legende || r.nom;
    boxCap.textContent = p.legende || '';
    boxCount.textContent = `${current + 1} / ${r.photos.length}`;
  };
  const openBox = (i) => {
    lastFocus = document.activeElement;
    show(i);
    box.hidden = false;
    document.body.classList.add('menu-open');
    $('[data-lightbox-close]', box).focus();
  };
  const closeBox = () => {
    box.hidden = true;
    document.body.classList.remove('menu-open');
    if (lastFocus) lastFocus.focus();
  };
  const multi = r.photos.length > 1;
  $$('[data-lightbox-prev], [data-lightbox-next]', box).forEach((b) => { b.hidden = !multi; });
  $('[data-lightbox-prev]', box).addEventListener('click', () => show(current - 1));
  $('[data-lightbox-next]', box).addEventListener('click', () => show(current + 1));
  $('[data-lightbox-close]', box).addEventListener('click', closeBox);
  box.addEventListener('click', (e) => { if (e.target === box) closeBox(); });
  document.addEventListener('keydown', (e) => {
    if (box.hidden) return;
    if (e.key === 'Escape') closeBox();
    if (e.key === 'ArrowLeft' && multi) show(current - 1);
    if (e.key === 'ArrowRight' && multi) show(current + 1);
  });
  // Balayage sur mobile
  let x0 = null;
  box.addEventListener('touchstart', (e) => { x0 = e.touches[0].clientX; }, { passive: true });
  box.addEventListener('touchend', (e) => {
    if (x0 === null || !multi) return;
    const dx = e.changedTouches[0].clientX - x0;
    if (Math.abs(dx) > 50) show(current + (dx < 0 ? 1 : -1));
    x0 = null;
  });
})();
