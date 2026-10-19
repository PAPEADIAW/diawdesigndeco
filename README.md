
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
    logo/               ← déposer ici les PNG du logo
    favicon.svg         provisoire
netlify.toml          configuration de déploiement Netlify
