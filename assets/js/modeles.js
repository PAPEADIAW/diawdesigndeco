/* DIAW DESIGN DÉCO — page « Nos modèles » : affiche le pôle demandé (#croix, #enseignes…)
   Données : data/modeles.json (modifiable depuis /admin) */
(async () => {
  'use strict';

  const $ = (sel, ctx = document) => ctx.querySelector(sel);
  const list = $('[data-models]');
  if (!list) return;

  let data;
  try {
    data = await window.DDD.load('data/modeles.json');
  } catch (e) {
    list.innerHTML = '<li class="projects__empty">Le catalogue est momentanément indisponible. Appelez-nous au +221 77 749 49 34.</li>';
    return;
  }
  const poles = Object.keys(data).filter((k) => data[k] && Array.isArray(data[k].modeles));
  if (!poles.length) return;

  const titleEl = $('[data-pole-title]');
  const introEl = $('[data-pole-intro]');
  const countEl = $('[data-pole-count]');
  const tabs = [...document.querySelectorAll('[data-pole-tabs] a')];
  const plural = (n, word) => `${n} ${word}${n > 1 ? 's' : ''}`;

  // Compteurs sur les onglets
  poles.forEach((key) => {
    const node = $(`[data-count-for="${key}"]`);
    if (node) node.textContent = data[key].modeles.length;
  });

  // Construction d'une carte sans innerHTML (le texte saisi dans l'admin reste du texte)
  const el = (tag, cls, text) => {
    const node = document.createElement(tag);
    if (cls) node.className = cls;
    if (text) node.textContent = text;
    return node;
  };

  const card = (m, poleKey, i) => {
    const li = el('li', 'model');
    li.style.setProperty('--d', `${Math.min(i, 6) * 0.06}s`);
    const article = el('article');

    const figure = el('figure', 'model__media');
    const img = window.DDD.image(m.image, m.provisoire ? `Photo provisoire : ${m.nom}` : m.nom, { eager: i < 3 });
    if (m.cadrage) { img.style.objectPosition = m.cadrage; img.style.setProperty('--focus', m.cadrage); }
    if (m.zoom && Number(m.zoom) > 1) img.style.setProperty('--zoom', m.zoom);
    figure.append(img);
    if (m.nouveau) figure.append(el('span', 'model__badge model__badge--new', 'Nouveau'));
    if (m.provisoire) figure.append(el('span', 'model__badge model__badge--ph', 'Photo provisoire'));

    const body = el('div', 'model__body');
    body.append(el('h3', '', m.nom));
    if (m.description) body.append(el('p', '', m.description));
    if (m.options && m.options.length) {
      const ul = el('ul', 'model__tags');
      m.options.forEach((o) => ul.append(el('li', '', o)));
      body.append(ul);
    }
    const link = el('a', 'model__link', 'Demander ce modèle');
    link.href = `index.html?${new URLSearchParams({ modele: m.nom, pole: poleKey })}#contact`;
    link.insertAdjacentHTML('beforeend', '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M5 12h14M13 6l6 6-6 6"/></svg>');
    body.append(link);

    article.append(figure, body);
    li.append(article);
    return li;
  };

  // Anciennes adresses (avant la fusion des pôles) : redirigées vers « Mobilier & rayonnage »
  const ALIASES = { comptoirs: 'mobilier', rayonnage: 'mobilier' };
  const hashKey = () => {
    const h = location.hash.slice(1);
    return ALIASES[h] || h;
  };

  const render = () => {
    const key = poles.includes(hashKey()) ? hashKey() : poles[0];
    const pole = data[key];
    titleEl.textContent = pole.titre;
    introEl.textContent = pole.intro || '';
    countEl.textContent = plural(pole.modeles.length, 'modèle');
    tabs.forEach((t) => {
      if (t.dataset.pole === key) t.setAttribute('aria-current', 'true');
      else t.removeAttribute('aria-current');
    });
    // Nouveautés en premier
    const items = [...pole.modeles].sort((a, b) => Number(!!b.nouveau) - Number(!!a.nouveau));
    list.replaceChildren(...items.map((m, i) => card(m, key, i)));
    if (!items.length) list.append(el('li', 'projects__empty', 'Aucun modèle pour le moment dans ce pôle.'));
    document.title = `${pole.titre} — Modèles Diaw Design Déco`;
  };

  window.addEventListener('hashchange', () => {
    render();
    $('.catalog').scrollIntoView({ behavior: 'smooth', block: 'start' });
  });
  render();

  // Arrivée depuis un bouton du site (modeles.html#croix…) : on amène les onglets en haut d'écran
  if (poles.includes(hashKey())) {
    const tabsNav = $('[data-pole-tabs]');
    const headerH = $('.site-header').offsetHeight;
    window.scrollTo(0, tabsNav.getBoundingClientRect().top + window.scrollY - headerH - 16);
  }
})();
