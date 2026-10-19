/* DIAW DESIGN DÉCO — outils partagés : chargement des données (data/*.json, éditées depuis /admin)
   et sources d'images adaptées à la taille de l'écran. */
(() => {
  'use strict';

  // Netlify Image CDN : redimensionne et convertit (WebP/AVIF) à la volée les photos envoyées depuis /admin.
  // Désactivé en local (localhost, fichier) où le service n'existe pas.
  const IMAGE_CDN = !['localhost', '127.0.0.1', ''].includes(location.hostname) && location.protocol !== 'file:';

  const abs = (p) => (p.startsWith('/') || /^https?:/.test(p) ? p : `/${p}`);
  const cdn = (p, w) => `/.netlify/images?url=${encodeURIComponent(abs(p))}&w=${w}&q=75`;

  /* Renvoie { src, srcset } pour une image :
     - photos préparées à la main : « nom-l.jpg » → versions -s (800 px) et -l (1600 px)
     - photos envoyées depuis /admin : redimensionnées par le CDN Netlify une fois en ligne
     - SVG et autres cas : image telle quelle */
  const sources = (path) => {
    if (!path) return { src: '' };
    if (/-l\.jpg$/i.test(path)) {
      const s = path.replace(/-l\.jpg$/i, '-s.jpg');
      return { src: s, srcset: `${s} 800w, ${path} 1600w`, large: path };
    }
    if (IMAGE_CDN && /\.(jpe?g|png|webp)$/i.test(path)) {
      return { src: cdn(path, 800), srcset: `${cdn(path, 800)} 800w, ${cdn(path, 1600)} 1600w`, large: cdn(path, 1800), original: path };
    }
    return { src: path, large: path };
  };

  const image = (path, alt, { eager = false, sizes = '(min-width: 1024px) 33vw, (min-width: 640px) 50vw, 100vw' } = {}) => {
    const img = document.createElement('img');
    const s = sources(path);
    img.src = s.src;
    if (s.srcset) { img.srcset = s.srcset; img.sizes = sizes; }
    if (s.original) img.addEventListener('error', () => { img.removeAttribute('srcset'); img.src = s.original; }, { once: true });
    img.alt = alt || '';
    img.width = 800; img.height = 600;
    img.loading = eager ? 'eager' : 'lazy';
    img.decoding = 'async';
    return img;
  };

  const load = async (url) => {
    const res = await fetch(url, { cache: 'no-cache' });
    if (!res.ok) throw new Error(`${url} : ${res.status}`);
    return res.json();
  };

  window.DDD = { load, image, sources };
})();
