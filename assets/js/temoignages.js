/* DIAW DESIGN DÉCO — Témoignages de l'accueil
   Données : data/temoignages.json (modifiable depuis /admin). La section reste masquée si la liste est vide. */
(async () => {
  'use strict';

  const section = document.querySelector('[data-testimonials]');
  const list = document.querySelector('[data-testimonials-list]');
  if (!section || !list || !window.DDD) return;

  let items = [];
  try {
    items = ((await window.DDD.load('data/temoignages.json')).temoignages || [])
      .filter((t) => t && t.citation && t.nom)
      .slice(0, 3);
  } catch (e) {
    return; // pas de données : la section reste masquée
  }
  if (!items.length) return;

  const el = (tag, cls, text) => {
    const n = document.createElement(tag);
    if (cls) n.className = cls;
    if (text != null) n.textContent = text;
    return n;
  };
  const initials = (nom) => nom.replace(/^(Dr|Docteur|M\.|Mme|Mlle)\.?\s+/i, '')
    .split(/\s+/).filter(Boolean).slice(0, 2).map((w) => w[0].toUpperCase()).join('');

  list.replaceChildren(...items.map((t, i) => {
    const li = el('li', 'testimonial-card reveal is-visible');
    li.style.setProperty('--d', `${i * 0.08}s`);
    const fig = el('figure');

    const quote = el('blockquote');
    // Espaces insécables : les guillemets restent collés au texte
    quote.append(el('p', '', `« ${t.citation.trim().replace(/^«\s*|\s*»$/g, '')} »`));

    const cap = el('figcaption', 'testimonial-card__who');
    if (t.photo) {
      const img = window.DDD.image(t.photo, `Portrait de ${t.nom}`, { sizes: '56px' });
      img.className = 'testimonial-card__photo';
      img.width = 56; img.height = 56;
      cap.append(img);
    } else {
      cap.append(el('span', 'testimonial-card__initials', initials(t.nom)));
    }
    const who = el('span', 'testimonial-card__id');
    who.append(el('strong', '', t.nom));
    const role = [t.fonction, [t.officine, t.ville].filter(Boolean).join(', ')].filter(Boolean).join(' · ');
    if (role) who.append(el('span', '', role));
    cap.append(who);

    fig.append(quote, cap);
    li.append(fig);
    if (t.album) {
      const a = el('a', 'card__models', 'Voir la réalisation');
      a.href = `realisation.html?ref=${encodeURIComponent(t.album)}`;
      a.insertAdjacentHTML('beforeend', '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M5 12h14M13 6l6 6-6 6"/></svg>');
      li.append(a);
    }
    return li;
  }));
  section.hidden = false;
})();
