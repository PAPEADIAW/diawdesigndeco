/* DIAW DESIGN DÉCO — Service après-vente
   La demande est mise en forme puis ouverte dans WhatsApp (wa.me) vers le numéro du SAV.
   Le client l'envoie depuis son propre WhatsApp : le SAV lui répond dans la même conversation. */
(() => {
  'use strict';

  /* ==================== CONFIGURATION (modifiable) ==================== */
  // Numéro WhatsApp du service après-vente, format international sans « + » ni espaces
  const SAV_WHATSAPP = '221763655888';

  // Équipements (boutons de l'étape 1) et problèmes proposés (étape 2)
  const CATEGORIES = [
    { id: 'croix', label: 'Croix LED', icon: '<path d="M9 3h6v6h6v6h-6v6H9v-6H3V9h6z"/>',
      problemes: ["Ne s'allume plus", 'Allumage partiel (LED éteintes)', 'Clignotement ou programme déréglé', 'Choc, fixation ou boîtier abîmé', 'Autre'] },
    { id: 'enseigne', label: 'Enseigne lumineuse', icon: '<rect x="3" y="8" width="18" height="9" rx="1.5"/><path d="M7 8V4M17 8V4M7 12.5h10"/>',
      problemes: ['Lettres ou caisson éteints', 'Éclairage faible ou clignotant', 'Fixation, panneau ou lettre abîmés', 'Autre'] },
    { id: 'mobilier', label: 'Mobilier & rayonnage', icon: '<rect x="9" y="3.5" width="6" height="4" rx=".6"/><path d="M12 7.5V10M3 10h18v3H3zM5 13v8M19 13v8M5 17h14"/>',
      problemes: ['Porte, tiroir ou charnière', 'Comptoir abîmé (plateau, façade)', 'Serrure ou poignée', 'Tablette ou crémaillère', 'Stabilité ou fixation murale', 'Modification ou ajout', 'Autre'] },
    { id: 'facade', label: 'Habillage façade', icon: '<path d="M3 21h18M4 21V7h16v14M4 11h16M8 21v-6h8v6M7 7V4h10v3"/>',
      problemes: ['Panneau décollé ou abîmé', "Infiltration d'eau ou joint", 'Éclairage de façade éteint', 'Autre'] },
    { id: 'eclairage', label: 'Éclairage & électricité', icon: '<path d="M9 18h6M10 21h4M12 3a6 6 0 0 0-3.5 10.9c.6.4 1 1.1 1 1.8V16h5v-.3c0-.7.4-1.4 1-1.8A6 6 0 0 0 12 3z"/>',
      problemes: ['Spots ou bandeaux LED éteints', 'Disjoncteur, prise ou câblage', 'Autre'] },
    { id: 'autre', label: 'Autre', icon: '<path d="M14.7 6.3a4 4 0 0 0-5.4 5.4L3 18l3 3 6.3-6.3a4 4 0 0 0 5.4-5.4l-2.5 2.5-2.4-.6-.6-2.4z"/>',
      problemes: ['Menuiserie', 'Second œuvre : plafond, cloison, revêtement', 'Autre'] },
  ];

  const PRIORITES = [
    { id: 'urgent', label: "Urgent — l'officine est impactée" },
    { id: 'normal', label: 'Normal', defaut: true },
    { id: 'entretien', label: 'Entretien planifié' },
  ];
  /* ==================================================================== */

  const $ = (sel, ctx = document) => ctx.querySelector(sel);
  const $$ = (sel, ctx = document) => [...ctx.querySelectorAll(sel)];
  const form = $('#sav-form');
  if (!form) return;

  const catWrap = $('[data-categories]');
  const probWrap = $('[data-problems]');
  const prioWrap = $('[data-priorities]');
  const progress = $('[data-sav-progress]');
  const done = $('[data-sav-done]');

  const waLink = (text) => `https://wa.me/${SAV_WHATSAPP}?text=${encodeURIComponent(text)}`;

  const storage = {
    get() { try { return localStorage.getItem('ddd-sav-last'); } catch (e) { return null; } },
    set(v) { try { localStorage.setItem('ddd-sav-last', v); } catch (e) { /* stockage indisponible */ } },
  };

  /* ---------- Boutons de choix (radios natifs, accessibles au clavier) ---------- */
  const radio = (name, value, labelHtml, cls, checked) => {
    const label = document.createElement('label');
    label.className = cls;
    const input = document.createElement('input');
    input.type = 'radio'; input.name = name; input.value = value; input.className = 'sr-only';
    if (checked) input.checked = true;
    const span = document.createElement('span');
    span.className = `${cls}__inner`;
    span.innerHTML = labelHtml; // libellés issus de la configuration ci-dessus uniquement
    label.append(input, span);
    return label;
  };

  CATEGORIES.forEach((c) => {
    catWrap.append(radio('categorie', c.id,
      `<svg viewBox="0 0 24 24" aria-hidden="true">${c.icon}</svg><span>${c.label}</span>`, 'choice'));
  });
  PRIORITES.forEach((p) => {
    prioWrap.append(radio('priorite', p.id, `<span class="lozenge" aria-hidden="true"></span>${p.label}`, 'chip-choice', p.defaut));
  });

  const renderProblems = (catId) => {
    const cat = CATEGORIES.find((c) => c.id === catId);
    probWrap.replaceChildren();
    cat.problemes.forEach((p) => {
      const safe = p.replace(/&/g, '&amp;').replace(/</g, '&lt;');
      probWrap.append(radio('probleme', p, `<span class="lozenge" aria-hidden="true"></span>${safe}`, 'chip-choice'));
    });
    probWrap.setAttribute('role', 'radiogroup');
    probWrap.setAttribute('aria-label', `Problème — ${cat.label}`);
  };

  /* ---------- Progression ---------- */
  const required = ['officine', 'nom', 'telephone', 'ville'];
  const updateProgress = () => {
    const d = new FormData(form);
    const steps = [d.get('categorie'), d.get('probleme'), ...required.map((k) => String(d.get(k) || '').trim())];
    const ratio = steps.filter(Boolean).length / steps.length;
    progress.style.transform = `scaleX(${ratio})`;
  };

  form.addEventListener('change', (e) => {
    if (e.target.name === 'categorie') {
      renderProblems(e.target.value);
      $('[data-error="categorie"]').classList.remove('is-shown');
    }
    if (e.target.name === 'probleme') $('[data-error="probleme"]').classList.remove('is-shown');
    updateProgress();
  });
  form.addEventListener('input', updateProgress);

  /* ---------- Numéro de suivi : SAV-AAAAMMJJ-1234 ---------- */
  const makeRef = () => {
    const now = new Date();
    const ymd = `${now.getFullYear()}${String(now.getMonth() + 1).padStart(2, '0')}${String(now.getDate()).padStart(2, '0')}`;
    const rnd = String(Math.floor(1000 + Math.random() * 9000));
    return `SAV-${ymd}-${rnd}`;
  };

  /* ---------- Envoi ---------- */
  form.addEventListener('submit', (e) => {
    e.preventDefault();
    const d = new FormData(form);
    const get = (k) => String(d.get(k) || '').trim();
    let ok = true;

    ['categorie', 'probleme'].forEach((k) => {
      const err = $(`[data-error="${k}"]`);
      err.classList.toggle('is-shown', !get(k));
      if (!get(k)) ok = false;
    });
    if (!form.checkValidity()) { form.classList.add('was-validated'); ok = false; }
    if (!ok) {
      const first = !get('categorie') ? $('input[name="categorie"]', form)
        : !get('probleme') ? $('input[name="probleme"]', form)
        : $(':invalid:not(fieldset)', form);
      if (first) first.focus();
      return;
    }

    const cat = CATEGORIES.find((c) => c.id === get('categorie'));
    const prio = PRIORITES.find((p) => p.id === get('priorite')) || PRIORITES[1];
    const ref = makeRef();
    const lines = [
      `*Demande SAV — ${ref}*`,
      '',
      `*Équipement :* ${cat.label}`,
      `*Problème :* ${get('probleme')}`,
      `*Priorité :* ${prio.label}`,
      '',
      `*Officine :* ${get('officine')}`,
      `*Contact :* ${get('nom')}`,
      `*Téléphone :* ${get('telephone')}`,
      `*Localisation :* ${get('ville')}`,
      get('annee') ? `*Installation :* ${get('annee')}` : null,
      get('dispo') ? `*Disponibilité :* ${get('dispo')}` : null,
      get('description') ? `\n*Description :*\n${get('description')}` : null,
      '',
      'Photos envoyées à la suite de ce message.',
    ].filter((l) => l !== null);
    const url = waLink(lines.join('\n'));

    storage.set(ref);
    window.open(url, '_blank', 'noopener');

    // Confirmation
    $('[data-sav-ref]').textContent = ref;
    $('[data-sav-reopen]').href = url;
    form.hidden = true;
    done.hidden = false;
    done.focus();
    showLast();
  });

  $('[data-sav-new]').addEventListener('click', () => {
    form.reset();
    form.classList.remove('was-validated');
    probWrap.innerHTML = '<p class="sav__hint">Choisissez d\'abord un équipement.</p>';
    done.hidden = true;
    form.hidden = false;
    updateProgress();
    $('input[name="categorie"]', form).focus();
  });

  /* ---------- Suivi d'une demande existante ---------- */
  const track = $('#sav-track');
  const trackInput = $('#t-ref');
  track.addEventListener('submit', (e) => {
    e.preventDefault();
    if (!track.checkValidity()) { track.classList.add('was-validated'); trackInput.focus(); return; }
    const ref = trackInput.value.trim().toUpperCase();
    window.open(waLink(`Bonjour, je souhaite connaître le suivi de ma demande *${ref}*.`), '_blank', 'noopener');
  });

  const showLast = () => {
    const last = storage.get();
    const box = $('[data-sav-last]');
    if (!last) { box.hidden = true; return; }
    $('[data-sav-last-ref]').textContent = last;
    box.hidden = false;
  };
  $('[data-sav-last-ref]').addEventListener('click', () => {
    trackInput.value = storage.get() || '';
    trackInput.focus();
  });
  showLast();
  updateProgress();

  // Accès direct à un équipement : sav.html?equipement=croix
  const pre = new URLSearchParams(location.search).get('equipement');
  const preInput = pre && $(`input[name="categorie"][value="${CSS.escape(pre)}"]`, form);
  if (preInput) { preInput.checked = true; renderProblems(pre); updateProgress(); }
})();
