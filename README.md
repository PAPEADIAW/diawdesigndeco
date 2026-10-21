# Diaw Design Déco — site vitrine

Site statique en HTML/CSS/JS vanilla, sans dépendance ni étape de build.

```
index.html            page d'accueil (one-page)
modeles.html          catalogue des modèles par pôle (#croix, #enseignes, #mobilier, #facade)
sav.html              service après-vente : demande envoyée par WhatsApp avec numéro de suivi
realisation.html      album d'une pharmacie (realisation.html?ref=slug)
assets/
  css/main.css        charte (tokens couleurs/typo), mise en page mobile-first
  js/main.js          diaporama du hero, animations, compteurs, filtres, formulaire, carte
  js/donnees.js       chargement des données JSON + images adaptées à l'écran
  js/modeles.js       affichage du catalogue
  js/realisations.js  galerie filtrée, albums et visionneuse
data/
  realisations.json   ← pharmacies réalisées (galerie + albums), modifiable depuis /admin
  modeles.json        ← catalogue des modèles, modifiable depuis /admin
admin/
  index.html          espace d'administration (Decap CMS)
  config.yml          champs du formulaire d'administration
  img/
    realisations/       photos du diaporama du hero (versions -l 1600 px et -s 800 px)
    uploads/            photos envoyées depuis l'administration
    modeles/            photos de modèles ajoutées à la main (optionnel)
    placeholders/       visuels provisoires (réalisations, portraits, modèles)
    logo/               logo (SVG) et symbole du kit officiel
netlify.toml          configuration de déploiement Netlify
```

## Aperçu local
Ouvrir le dossier avec n'importe quel serveur statique (par ex. l'extension « Live Server » de VS Code), puis `http://localhost:5500`.
Le formulaire n'envoie rien en local : il affiche le message de repli (WhatsApp / e-mail). C'est normal.

## Déploiement
**Netlify relié à un dépôt GitHub** (obligatoire pour l'espace d'administration) : chaque modification faite dans `/admin` est enregistrée dans GitHub, puis Netlify republie le site en 1 à 2 minutes. Le formulaire `devis` est détecté automatiquement (Netlify Forms) ; les demandes arrivent dans *Forms* et peuvent être transférées par e-mail.
Les pages lisent `data/*.json` : il faut un serveur (Netlify, ou « Live Server » en local). Ouvrir les fichiers HTML directement depuis l'explorateur n'affiche pas la galerie ni le catalogue.

---

## Espace d'administration (`/admin`)
L'équipe ajoute des **réalisations** (pharmacie, ville, prestations, photos) et des **modèles** (croix, enseignes, mobilier, façade) depuis un formulaire, sans toucher au code. Les photos s'envoient depuis l'ordinateur ou le téléphone.

### Mise en place (une seule fois, environ 30 minutes)
1. **GitHub** : créer un compte (github.com), puis un dépôt privé, par ex. `diaw-design-deco`. Y envoyer tout le dossier du site (bouton « uploading an existing file », ou GitHub Desktop).
2. **Netlify** : *Add new site → Import an existing project → GitHub*, choisir le dépôt. Aucun réglage de build : le dossier publié est la racine (déjà indiqué dans `netlify.toml`).
3. **Application OAuth GitHub** : sur GitHub, *Settings → Developer settings → OAuth Apps → New OAuth App*.
   - Homepage URL : l'adresse du site Netlify
   - Authorization callback URL : `https://api.netlify.com/auth/done`
   - Copier le *Client ID* et générer un *Client secret*.
4. **Netlify** : *Site configuration → Access & security → OAuth → Install provider → GitHub*, coller le Client ID et le Client secret.
5. `admin/config.yml` pointe sur le dépôt `PAPEADIAW/diawdesigndeco` et le site `https://diawdesigndeco.netlify.app` (à modifier si l'un des deux change).
6. **Équipe** : sur GitHub, *dépôt → Settings → Collaborators → Add people* (accès en écriture). Chaque personne crée son compte GitHub gratuit.
7. Se connecter sur `https://adresse-du-site/admin/` avec « Se connecter avec GitHub ».

### Utilisation
- **Réalisations → Liste des pharmacies réalisées** : « Ajouter pharmacie », remplir le nom, l'identifiant (ex. `pharmacie-du-port`), les filtres, les prestations, puis ajouter les photos (la 1re sert de couverture). « Publier ». La pharmacie apparaît dans la galerie et son album est créé.
- **Modèles (catalogue)** : ouvrir un pôle, « Ajouter modèle », photo + nom + options. Cocher « Nouveau » pour le mettre en tête avec un badge.
- **Photos** : JPG paysage, idéalement moins de 500 Ko (compresser avec squoosh.app si besoin). En ligne, le CDN d'images de Netlify les redimensionne automatiquement pour les téléphones.
- Chaque enregistrement crée une version dans GitHub : une erreur peut toujours être annulée.

Le diaporama du hero, les textes des sections et le SAV restent modifiables dans le code (voir plus bas).

---

## Logo
| Fichier | Usage | Source (kit du logo) |
|---|---|---|
| `assets/img/logo/logo.svg` | Header et footer de toutes les pages, logo de l'admin | `DDD_logo-horizontal_couleur.svg` |
| `assets/img/logo/symbole.svg` | Icône d'onglet (favicon) | `DDD_symbole_couleur.svg` |
| `assets/img/logo/logo-vertical.svg` | Version principale, réservée (non utilisée dans les pages) | `DDD_logo-vertical_couleur.svg` |

Le header et le footer sont sur fond **blanc** : la version « couleur » est la bonne. La version horizontale est utilisée en en-tête, car le nom de la version verticale serait illisible à 44 px de haut. Fichiers vectoriels : nets sur tous les écrans, sans export à faire.

## Diaporama du hero
Le fond du hero fait défiler 11 photos de réalisations (fondu de 1,4 s, zoom lent, une photo toutes les 6 s). Le défilement se met en pause hors écran, et il est désactivé si l'appareil demande moins d'animations ; un bouton pause est toujours disponible.
Pour **ajouter ou changer une photo** : déposer deux versions dans `assets/img/realisations/` (`nom-l.jpg` 1600 px de large, `nom-s.jpg` 800 px, < 200 Ko), puis copier un bloc `<figure class="hero__slide" data-caption="…">` dans `index.html`. Seule la 1re photo utilise `src` ; les suivantes utilisent `data-src` / `data-srcset` (chargement différé).

## Catalogue des modèles
Ajouter ou modifier un modèle : **depuis `/admin` → Modèles** (voir ci-dessus), ou à la main dans `data/modeles.json`. Le compteur de l'onglet se met à jour ; « Nouveau » affiche un badge et place le modèle en tête.
Le bouton « Demander ce modèle » ouvre le formulaire de devis avec le nom du modèle déjà rempli.
Pour ajouter un **pôle entier** : ajouter une clé dans `data/modeles.json`, le bloc correspondant dans `admin/config.yml` et un onglet `<a href="#cle" data-pole="cle">` dans `modeles.html`.

À vérifier : les noms et descriptions des modèles ont été rédigés d'après les photos (pôles : Croix LED, Enseignes, Mobilier & rayonnage, Habillage façade ; les anciennes adresses #comptoirs et #rayonnage redirigent vers #mobilier). Les 3 modèles marqués `provisoire: true` (2 croix, tiroirs) attendent leurs vraies photos.

## Réalisations : galerie et albums
La galerie de l'accueil et les pages album (`realisation.html?ref=…`) sont générées depuis **`data/realisations.json`** (modifiable depuis `/admin`) : une entrée par pharmacie, avec ses catégories (`complet`, `enseigne`, `croix`, `mobilier`, `facade`) et ses photos. Chaque filtre affiche **10 références au plus**, puis un bouton « Voir plus ». Un filtre vide est masqué automatiquement.
L'album affiche toutes les photos (visionneuse plein écran : flèches, clavier, balayage sur mobile), les prestations, un bouton « Demander un devis » prérempli (« Projet similaire à … ») et 3 autres réalisations proches.

**À compléter :** 11 albums sont en place. 3 pharmacies sont nommées d'après leur enseigne (Fleuve Nouvelle, Adja Daba Diagne, Faa Ikhal Makhis). Les 8 autres, marquées `aConfirmer: true`, ont été regroupées d'après le style des photos : il faut indiquer le nom, la ville et vérifier le regroupement. Pour atteindre 10 références par filtre, ajouter des pharmacies depuis `/admin`.

## Service après-vente (`sav.html`)
Le client **coche un ou plusieurs équipements** (6 cartes), **un ou plusieurs problèmes par équipement**, la priorité, puis saisit ses coordonnées.
Au clic sur « Envoyer au SAV par WhatsApp » :
1. la demande est **enregistrée par Netlify Forms** (formulaire `sav`) avec le **numéro de suivi** `SAV-AAAAMMJJ-1234` ;
2. WhatsApp s'ouvre vers le SAV avec le message déjà rédigé ; le client l'envoie depuis son propre WhatsApp et le SAV **répond dans la même conversation**.

**À activer une fois dans Netlify** : *Forms* → **Enable form detection**, puis redéployer. Les demandes apparaissent dans *Forms → sav* ; *Forms → Form notifications* permet d’être prévenu par e-mail à chaque demande.

- **Suivi** : le bloc « Suivre une demande » envoie « je souhaite connaître le suivi de ma demande SAV-… » au SAV. Le dernier numéro est mémorisé dans le navigateur du client.
- **Lien direct vers un ou plusieurs équipements** : `sav.html?equipement=croix` ou `sav.html?equipement=croix,enseigne` (valeurs : `croix`, `enseigne`, `mobilier`, `facade`, `eclairage`, `autre`). Pratique à imprimer en QR code sur l'équipement posé.
- **Configuration** (en tête de `assets/js/sav.js`) : `SAV_WHATSAPP` (numéro qui reçoit les demandes, actuellement 221777494934, soit le +221 77 749 49 34), liste des équipements, des problèmes et des priorités.
- Pour garder une trace côté SAV, épingler ou étiqueter les conversations (WhatsApp Business : étiquettes « Nouveau », « En cours », « Résolu »).

## Placeholders à remplacer
| # | Emplacement | Fichier actuel | Format conseillé |
|---|---|---|---|
| 1 | Hero — noms des officines dans les légendes (`data-caption`), sauf Faa Ikhal Makhis | `index.html` | — |
| 2 | Réalisations — noms et villes des 8 albums « Informations à vérifier » | `/admin` → Réalisations | — |
| 8–9 | Portraits : `assets/img/equipe/pape-abdoulaye-diaw.jpg` et `assets/img/equipe/mamadou-diaw.jpg` (portrait provisoire affiché tant qu'ils manquent) | `assets/img/equipe/` | 800×1000 (4:5), < 150 Ko |
| 10 | Image de partage réseaux sociaux | `img/og-image.jpg` (absente) | 1200×630 JPG |
| 11 | Coordonnées GPS exactes de la carte (Pikine, approximatives) | attribut `data-src` de `.map` | — |
| 12 | Témoignage client (bloc commenté, masqué) | `index.html`, section Réalisations | citation + chiffres réels |
| 13 | Délais indicatifs par étape (commentaire `DÉLAI À COMPLÉTER`) | section Méthode | — |

Pour une photo, utiliser ce modèle (le navigateur choisit le format le plus léger) :
```html
<picture>
  <source srcset="assets/img/real/projet-1.avif" type="image/avif">
  <source srcset="assets/img/real/projet-1.webp" type="image/webp">
  <img src="assets/img/real/projet-1.jpg" alt="Comptoir de la Pharmacie X, Dakar" width="1200" height="900" loading="lazy" decoding="async">
</picture>
```
Ne pas mettre `loading="lazy"` sur la photo du hero (elle garde `fetchpriority="high"`).

## Textes à valider
Rédigés au plus près du brief, sans superlatifs. À confirmer avec la direction :
- Puces produits : « Pose murale ou en drapeau », « Simple ou double face », « Vitrines parapharmacie », « Lettres découpées rétroéclairées ».
- À propos : « …sans dépendre d'un mobilier importé ».
- Second œuvre : « cloisons, faux plafonds, revêtements ».

---

## Optimisations de performance appliquées
- **Zéro librairie** : pas de GSAP, jQuery ni framework. JS ≈ 7 Ko non minifié, chargé en `defer`.
- **Animations natives** : `IntersectionObserver` pour les apparitions, `requestAnimationFrame` + écouteurs `passive` pour la ligne du process. Seules `transform` et `opacity` sont animées (pas de reflow).
- **LCP protégé** : le contenu du hero n'est jamais masqué en opacité ; il apparaît avec une animation CSS `transform` seule, indépendante du JS. La photo du hero est préchargée (`preload` + `fetchpriority="high"`).
- **Images** : dimensions `width`/`height` partout (pas de décalage de mise en page) ; `loading="lazy"` et `decoding="async"` sous la ligne de flottaison ; placeholders en SVG de quelques Ko.
- **Polices** : uniquement les graisses de la charte (Poppins 300/400/500/700, Inter 400/400i/600/700), `display=swap`, `preconnect`. *Optionnel* : les héberger en local (woff2) pour économiser ~100 ms sur mobile 3G.
- **Carte** : la carte OpenStreetMap (iframe lourde) n'est chargée qu'au clic sur « Afficher la carte ».
- **Accessibilité** : contrastes AA (texte en `#23803A` / `#C4500F`, boutons orange sur `#C4500F`), lien d'évitement, focus visible, `aria-pressed` sur les filtres, menu `inert` quand il est fermé, `prefers-reduced-motion` respecté.
- **SEO** : balises meta et Open Graph, données structurées `LocalBusiness` (JSON-LD).
- **Cache** : en-têtes Netlify (7 jours sur `/assets`).

Pour viser > 90 sur mobile une fois les vraies photos en place : les compresser (squoosh.app), respecter les poids indiqués ci-dessus, puis vérifier avec PageSpeed Insights.

## Mise à jour des styles et scripts
Les liens vers `assets/css/main.css` et `assets/js/*.js` portent un numéro de version (`?v=20261021b`). Après une modification de ces fichiers, changer ce numéro dans les 4 pages HTML (par ex. `?v=20261105`) : tous les navigateurs rechargent alors la nouvelle version. `netlify.toml` demande en plus au navigateur de vérifier ces fichiers à chaque visite ; seules les images restent en cache 7 jours.
