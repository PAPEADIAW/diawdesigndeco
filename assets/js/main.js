/* DIAW DESIGN DÉCO — interactions (vanilla, sans dépendance) */
(() => {
  'use strict';

  const root = document.documentElement;
  root.classList.add('js');
  const reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  const $ = (sel, ctx = document) => ctx.querySelector(sel);
  const $$ = (sel, ctx = document) => [...ctx.querySelectorAll(sel)];

  /* ---------- Header : réduction au scroll ---------- */
  const header = $('.site-header');
  const onScroll = () => header.classList.toggle('is-scrolled', window.scrollY > 24);
  onScroll();
  window.addEventListener('scroll', onScroll, { passive: true });

  /* ---------- Menu plein écran ---------- */
  const burger = $('.burger');
  const menu = $('#menu');
  const setMenu = (open) => {
    burger.setAttribute('aria-expanded', String(open));
    burger.setAttribute('aria-label', open ? 'Fermer le menu' : 'Ouvrir le menu');
    menu.classList.toggle('is-open', open);
    menu.inert = !open;
    document.body.classList.toggle('menu-open', open);
    if (open) $('a', menu).focus({ preventScroll: true });
  };
  burger.addEventListener('click', () => setMenu(burger.getAttribute('aria-expanded') !== 'true'));
  $$('a', menu).forEach((a) => a.addEventListener('click', () => setMenu(false)));
  document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape' && menu.classList.contains('is-open')) { setMenu(false); burger.focus(); }
  });

  /* ---------- Hero : diaporama des réalisations ---------- */
  const slider = $('.hero__slider');
  const slides = $$('.hero__slide');
  if (slider && slides.length > 1) {
    const DURATION = 6000;
    const captionEl = $('[data-slide-caption]');
    const indexEl = $('[data-slide-index]');
    const dotsWrap = $('[data-slide-dots]');
    const pauseBtn = $('[data-slide-pause]');
    const pad = (n) => String(n).padStart(2, '0');
    $('[data-slide-total]').textContent = pad(slides.length);
    slider.style.setProperty('--slide-dur', `${DURATION}ms`);

    // Les images suivantes ne sont chargées qu'une fois la page affichée (LCP préservé)
    const loadSlide = (slide) => {
      const img = $('img', slide);
      if (img && img.dataset.src) {
        if (img.dataset.srcset) img.srcset = img.dataset.srcset;
        img.src = img.dataset.src;
        delete img.dataset.src;
        delete img.dataset.srcset;
      }
    };

    const dots = slides.map((_, i) => {
      const b = document.createElement('button');
      b.type = 'button';
      b.setAttribute('aria-label', `Afficher la réalisation ${i + 1}`);
      b.addEventListener('click', () => { go(i); restart(); });
      dotsWrap.append(b);
      return b;
    });

    let current = 0;
    let timer = null;
    let paused = reduceMotion; // pas de défilement automatique si l'utilisateur limite les animations
    let inView = true;

    const render = () => {
      slides.forEach((s, i) => s.classList.toggle('is-active', i === current));
      dots.forEach((d, i) => {
        d.classList.toggle('is-active', i === current);
        d.classList.toggle('is-done', i < current);
        d.setAttribute('aria-current', i === current ? 'true' : 'false');
      });
      indexEl.textContent = pad(current + 1);
      captionEl.classList.add('is-changing');
      setTimeout(() => {
        captionEl.textContent = slides[current].dataset.caption || '';
        captionEl.classList.remove('is-changing');
      }, 250);
      loadSlide(slides[(current + 1) % slides.length]); // précharge la suivante
    };
    const go = (i) => {
      current = (i + slides.length) % slides.length;
      loadSlide(slides[current]);
      // Relance l'animation de la barre active
      dots[current].classList.remove('is-active'); void dots[current].offsetWidth;
      render();
    };
    const stop = () => { clearInterval(timer); timer = null; };
    const start = () => { stop(); if (!paused && inView && !document.hidden) timer = setInterval(() => go(current + 1), DURATION); };
    const restart = () => start();

    pauseBtn.addEventListener('click', () => {
      paused = !paused;
      slider.classList.toggle('is-paused', paused);
      pauseBtn.setAttribute('aria-label', paused ? 'Relancer le diaporama' : 'Mettre le diaporama en pause');
      start();
    });
    slider.classList.toggle('is-paused', paused);
    if (paused) pauseBtn.setAttribute('aria-label', 'Relancer le diaporama');

    // Économie de batterie : pause quand le hero est hors écran ou l'onglet masqué
    new IntersectionObserver(([entry]) => { inView = entry.isIntersecting; start(); }, { threshold: 0.1 }).observe($('.hero'));
    document.addEventListener('visibilitychange', start);

    const boot = () => {
      $('.hero__slides').classList.add('is-ready'); // déclenche le zoom lent de la 1re diapo
      render();
      start();
    };
    if (document.readyState === 'complete') boot(); else window.addEventListener('load', boot, { once: true });
  }

  /* ---------- Apparitions au scroll ---------- */
  const revealIO = new IntersectionObserver((entries) => {
    entries.forEach((entry) => {
      if (!entry.isIntersecting) return;
      entry.target.classList.add('is-visible');
      revealIO.unobserve(entry.target);
    });
  }, { threshold: 0.12, rootMargin: '0px 0px -6% 0px' });
  $$('.reveal').forEach((el) => revealIO.observe(el));

  /* ---------- Compteurs ---------- */
  // Séparateur de milliers en espace insécable classique (U+00A0) : Poppins n'a pas l'espace fine U+202F
  const formatNumber = (el, n) => (el.dataset.format === 'fr' ? String(n).replace(/\B(?=(\d{3})+(?!\d))/g, ' ') : String(n));
  const runCounter = (el) => {
    const to = Number(el.dataset.count);
    const from = Number(el.dataset.from || 0);
    const duration = 1400;
    const start = performance.now();
    const tick = (now) => {
      const t = Math.min(1, (now - start) / duration);
      const eased = 1 - Math.pow(1 - t, 3);
      el.textContent = formatNumber(el, Math.round(from + (to - from) * eased));
      if (t < 1) requestAnimationFrame(tick);
    };
    requestAnimationFrame(tick);
  };
  if (!reduceMotion) {
    const counterIO = new IntersectionObserver((entries) => {
      entries.forEach((entry) => {
        if (!entry.isIntersecting) return;
        runCounter(entry.target);
        counterIO.unobserve(entry.target);
      });
    }, { threshold: 0.6 });
    $$('[data-count]').forEach((el) => {
      el.textContent = formatNumber(el, Number(el.dataset.from || 0));
      counterIO.observe(el);
    });
  }

  /* ---------- Process : ligne de progression ---------- */
  const stepsWrap = $('.steps-wrap');
  if (stepsWrap) {
    const steps = $$('.step', stepsWrap);
    const horizontal = window.matchMedia('(min-width: 900px)');
    let ticking = false;
    const update = () => {
      ticking = false;
      const rect = stepsWrap.getBoundingClientRect();
      const vh = window.innerHeight;
      const p = reduceMotion ? 1 : Math.min(1, Math.max(0, (vh * 0.72 - rect.top) / (rect.height * (horizontal.matches ? 0.9 : 1))));
      stepsWrap.style.setProperty('--p', p.toFixed(3));
      steps.forEach((step) => {
        const pos = horizontal.matches
          ? step.offsetLeft / stepsWrap.offsetWidth
          : step.offsetTop / stepsWrap.offsetHeight;
        step.classList.toggle('is-active', p > pos + 0.01);
      });
    };
    const request = () => { if (!ticking) { ticking = true; requestAnimationFrame(update); } };
    window.addEventListener('scroll', request, { passive: true });
    window.addEventListener('resize', request);
    update();
  }

  /* Réalisations : filtres et galerie gérés par realisations.js */

  /* ---------- Formulaire de devis ---------- */
  const form = $('#devis-form');
  if (form) {
    const status = $('.form__status', form);
    const submitBtn = $('[type="submit"]', form);
    const showStatus = (type, msg) => {
      status.className = `form__status is-${type}`;
      status.textContent = msg;
    };
    const validate = () => {
      if (form.checkValidity()) return true;
      form.classList.add('was-validated');
      const firstInvalid = $(':invalid:not(fieldset)', form);
      if (firstInvalid) firstInvalid.focus();
      return false;
    };

    form.addEventListener('submit', async (e) => {
      e.preventDefault();
      if (!validate()) return;
      submitBtn.disabled = true;
      try {
        // Netlify Forms : POST encodé sur la page elle-même
        const res = await fetch('/', {
          method: 'POST',
          headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
          body: new URLSearchParams(new FormData(form)).toString(),
        });
        if (!res.ok) throw new Error(String(res.status));
        form.reset();
        form.classList.remove('was-validated');
        showStatus('success', 'Merci. Votre demande est bien envoyée. Nous vous recontactons par téléphone.');
      } catch (err) {
        showStatus('error', "L'envoi n'a pas abouti. Utilisez le bouton WhatsApp ou écrivez-nous à diawdesigndeco@gmail.com.");
      } finally {
        submitBtn.disabled = false;
      }
    });

    // Arrivée depuis la page Modèles (« Demander ce modèle ») : préremplissage
    const params = new URLSearchParams(location.search);
    const modele = params.get('modele');
    if (modele) {
      const typeByPole = { croix: 'Enseigne ou croix LED seule', enseignes: 'Enseigne ou croix LED seule', mobilier: 'Mobilier ou comptoir seul', facade: 'Habillage de façade' };
      const type = typeByPole[params.get('pole')];
      if (type) form.elements.type.value = type;
      form.elements.message.value = `Modèle souhaité : ${modele.slice(0, 120)}\n`;
    }
    // Arrivée depuis un album (« Un projet similaire »)
    const reference = params.get('reference');
    if (reference && !modele) form.elements.message.value = `Projet similaire à : ${reference.slice(0, 120)}\n`;

    // Envoi alternatif : message WhatsApp prérempli avec le contenu du formulaire
    const waBtn = $('[data-wa]', form);
    waBtn.addEventListener('click', () => {
      const d = new FormData(form);
      const get = (k) => String(d.get(k) || '').trim();
      const lines = [
        'Bonjour Diaw Design Déco,',
        'Je souhaite un devis pour mon officine.',
        get('type') && `Projet : ${get('type')}`,
        get('officine') && `Officine : ${get('officine')}`,
        get('ville') && `Ville : ${get('ville')}`,
        get('surface') && `Surface : ${get('surface')} m²`,
        get('message'),
        get('nom') && `— ${get('nom')}`,
      ].filter(Boolean);
      window.open(`https://wa.me/221777494934?text=${encodeURIComponent(lines.join('\n'))}`, '_blank', 'noopener');
    });
  }

  /* ---------- Carte : chargée uniquement au clic ---------- */
  const mapBtn = $('[data-load-map]');
  if (mapBtn) {
    mapBtn.addEventListener('click', () => {
      const map = mapBtn.closest('.map');
      const iframe = document.createElement('iframe');
      iframe.src = map.dataset.src;
      iframe.title = 'Carte : 126 Cité Sotiba, Pikine';
      iframe.loading = 'lazy';
      iframe.referrerPolicy = 'no-referrer-when-downgrade';
      $('.map__frame', map).append(iframe);
      map.classList.add('is-loaded');
      mapBtn.remove();
    }, { once: true });
  }

  /* ---------- Bouton WhatsApp flottant : visible après le hero ---------- */
  const fab = $('.fab-wa');
  const hero = $('.hero');
  if (fab && hero) {
    new IntersectionObserver(([entry]) => {
      fab.classList.toggle('is-visible', !entry.isIntersecting);
    }, { threshold: 0.15 }).observe(hero);
  }

  /* ---------- Année ---------- */
  $$('[data-year]').forEach((el) => { el.textContent = String(new Date().getFullYear()); });
})();
