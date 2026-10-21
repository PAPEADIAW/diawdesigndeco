/* DIAW DESIGN DÉCO — Service après-vente
   1. Le client coche un ou plusieurs équipements et les problèmes constatés.
   2. La demande est enregistrée par Netlify Forms (formulaire « sav »).
   3. WhatsApp s'ouvre vers le SAV avec la demande rédigée et le numéro de suivi :
      le SAV répond au client dans la même conversation. */
(() => {
  'use strict';

  /* ==================== CONFIGURATION (modifiable) ==================== */
  // Numéro WhatsApp du service après-vente, format international sans « + » ni espaces
  const SAV_WHATSAPP = '221777494934';

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
  const submitBtn = $('[data-sav-submit]');
  const submitLabel = $('[data-sav-submit-label]');

  const waLink = (text) => `https://wa.me/${SAV_WHATSAPP}?text=${encodeURIComponent(text)}`;
  const esc = (s) => s.replace(/&/g, '&amp;').replace(/</g, '&lt;');

  const storage = {
    get() { try { return localStorage.getItem('ddd-sav-last'); } catch (e) { return null; } },
    set(v) { try { localStorage.setItem('ddd-sav-last', v); } catch (e) { /* stockage indisponible */ } },
  };

  /* ---------- Boutons de choix (cases et radios natifs, accessibles au clavier) ---------- */
  const choice = (type, name, value, labelHtml, cls, checked) => {
    const label = document.createElement('label');
    label.className = cls;
    const input = document.createElement('input');
    input.type = type; input.name = name; input.value = value; input.className = 'sr-only';
    if (checked) input.checked = true;
    const span = document.createElement('span');
    span.className = `${cls}__inner`;
    span.innerHTML = labelHtml; // libellés issus de la configuration ci-dessus uniquement
    label.append(input, span);
    return label;
  };

  CATEGORIES.forEach((c) => {
    catWrap.append(choice('checkbox', 'equipement', c.id,
      `<span class="choice__check" aria-hidden="true"></span><svg viewBox="0 0 24 24" aria-hidden="true">${c.icon}</svg><span>${c.label}</span>`, 'choice'));
  });
  PRIORITES.forEach((p) => {
    prioWrap.append(choice('radio', 'priorite', p.id, `<span class="lozenge" aria-hidden="true"></span>${p.label}`, 'chip-choice', p.defaut));
  });

  const selectedCats = () => CATEGORIES.filter((c) => $(`input[name="equipement"][value="${c.id}"]`, form).checked);
  const checkedProblems = (catId) => $$(`input[name="pb-${catId}"]:checked`, form).map((i) => i.value);

  // Un groupe de problèmes par équipement coché ; les cases déjà cochées sont conservées
  const renderProblems = () => {
    const keep = {};
    CATEGORIES.forEach((c) => { keep[c.id] = checkedProblems(c.id); });
    const cats = selectedCats();
    probWrap.replaceChildren();
    if (!cats.length) {
      probWrap.innerHTML = '<p class="sav__hint">Choisissez d\'abord un équipement.</p>';
      return;
    }
    cats.forEach((c) => {
      const group = document.createElement('div');
      group.className = 'problem-group';
      group.setAttribute('role', 'group');
      group.setAttribute('aria-label', `Problèmes — ${c.label}`);
      const title = document.createElement('p');
      title.className = 'problem-group__title';
      title.textContent = c.label;
      const chips = document.createElement('div');
      chips.className = 'chip-choices';
      c.problemes.forEach((p) => chips.append(choice('checkbox', `pb-${c.id}`, p,
        `<span class="lozenge" aria-hidden="true"></span>${esc(p)}`, 'chip-choice', keep[c.id].includes(p))));
      group.append(title, chips);
      probWrap.append(group);
    });
  };

  /* ---------- Progression ---------- */
  const required = ['officine', 'nom', 'telephone', 'ville'];
  const updateProgress = () => {
    const d = new FormData(form);
    const cats = selectedCats();
    const steps = [cats.length > 0, cats.some((c) => checkedProblems(c.id).length > 0),
      ...required.map((k) => String(d.get(k) || '').trim() !== '')];
    progress.style.transform = `scaleX(${steps.filter(Boolean).length / steps.length})`;
  };

  form.addEventListener('change', (e) => {
    if (e.target.name === 'equipement') {
      renderProblems();
      if (selectedCats().length) $('[data-error="categorie"]').classList.remove('is-shown');
    }
    if (e.target.name && e.target.name.startsWith('pb-')) $('[data-error="probleme"]').classList.remove('is-shown');
    updateProgress();
  });
  form.addEventListener('input', updateProgress);

  /* ---------- Numéro de suivi : SAV-AAAAMMJJ-1234 ---------- */
  const makeRef = () => {
    const now = new Date();
    const ymd = `${now.getFullYear()}${String(now.getMonth() + 1).padStart(2, '0')}${String(now.getDate()).padStart(2, '0')}`;
    return `SAV-${ymd}-${String(Math.floor(1000 + Math.random() * 9000))}`;
  };

  // Envoi à Netlify Forms. Renvoie true si le SAV a bien reçu la demande.
  const saveToNetlify = async (fields) => {
    const ctrl = new AbortController();
    const timer = setTimeout(() => ctrl.abort(), 20000);
    try {
      const res = await fetch('/', {
        method: 'POST',
        headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
        body: new URLSearchParams(fields).toString(),
        signal: ctrl.signal,
      });
      return res.ok;
    } catch (e) {
      return false;
    } finally {
      clearTimeout(timer);
    }
  };

  /* ---------- Envoi ---------- */
  form.addEventListener('submit', async (e) => {
    e.preventDefault();
    const d = new FormData(form);
    const get = (k) => String(d.get(k) || '').trim();
    const cats = selectedCats();
    const withProblems = cats.map((c) => ({ c, pbs: checkedProblems(c.id) }));
    const anyProblem = withProblems.some((x) => x.pbs.length);

    $('[data-error="categorie"]').classList.toggle('is-shown', !cats.length);
    $('[data-error="probleme"]').classList.toggle('is-shown', cats.length > 0 && !anyProblem);
    const fieldsOk = form.checkValidity();
    if (!fieldsOk) form.classList.add('was-validated');
    if (!cats.length || !anyProblem || !fieldsOk) {
      const first = !cats.length ? $('input[name="equipement"]', form)
        : !anyProblem ? $('input[name^="pb-"]', form)
        : $(':invalid:not(fieldset)', form);
      if (first) first.focus();
      return;
    }

    const prio = PRIORITES.find((p) => p.id === get('priorite')) || PRIORITES[1];
    const ref = makeRef();
    const equipements = cats.map((c) => c.label).join(', ');
    const problemes = withProblems.map(({ c, pbs }) => `${c.label} : ${pbs.length ? pbs.join(', ') : 'à préciser'}`).join(' | ');

    // Fenêtre ouverte tout de suite (pendant le clic) pour ne pas être bloquée par le navigateur
    const win = window.open('', '_blank');
    submitBtn.disabled = true;
    submitLabel.textContent = 'Envoi en cours…';

    const saved = await saveToNetlify({
      'form-name': 'sav', 'bot-field': '', reference: ref, equipements, problemes,
      priorite_libelle: prio.label, officine: get('officine'), nom: get('nom'), telephone: get('telephone'),
      ville: get('ville'), annee: get('annee'), dispo: get('dispo'), description: get('description'),
    });

    const lines = [
      `*Demande SAV — ${ref}*`,
      '',
      ...withProblems.map(({ c, pbs }) => `*${c.label} :* ${pbs.length ? pbs.join(', ') : 'à préciser'}`),
      `*Priorité :* ${prio.label}`,
      '',
      `*Officine :* ${get('officine')}`,
      `*Contact :* ${get('nom')}`,
      `*Téléphone :* ${get('telephone')}`,
      `*Localisation :* ${get('ville')}`,
      get('annee') ? `*Installation :* ${get('annee')}` : null,
      get('dispo') ? `*Disponibilité :* ${get('dispo')}` : null,
      get('description') ? `\n*Description :*\n${get('description')}` : null,
    ].filter((l) => l !== null);
    const url = waLink(lines.join('\n'));

    if (win) { win.opener = null; win.location.href = url; }
    storage.set(ref);

    // Confirmation
    $('[data-sav-ref]').textContent = ref;
    $('[data-sav-reopen]').href = url;
    const status = $('[data-sav-status]');
    status.className = `sav__status ${saved ? 'is-ok' : 'is-warn'}`;
    status.textContent = saved
      ? 'Demande bien reçue par le SAV.'
      : 'Envoyez le message WhatsApp pour transmettre votre demande.';

    submitBtn.disabled = false;
    submitLabel.textContent = 'Envoyer au SAV par WhatsApp';
    form.hidden = true;
    done.hidden = false;
    done.focus();
    showLast();
  });

  $('[data-sav-new]').addEventListener('click', () => {
    form.reset();
    form.classList.remove('was-validated');
    renderProblems();
    done.hidden = true;
    form.hidden = false;
    updateProgress();
    $('input[name="equipement"]', form).focus();
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

  // Accès direct à un équipement : sav.html?equipement=croix (plusieurs : ?equipement=croix,enseigne)
  const pre = (new URLSearchParams(location.search).get('equipement') || '').split(',').filter(Boolean);
  pre.forEach((id) => {
    const input = $(`input[name="equipement"][value="${CSS.escape(id)}"]`, form);
    if (input) input.checked = true;
  });
  if (pre.length) { renderProblems(); updateProgress(); }
})();
