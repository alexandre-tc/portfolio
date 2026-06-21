// ---------------------------
// Config (remplace par tes valeurs)
// ---------------------------
const EMAILJS_PUBLIC_KEY = 'rDvloLoDhMMkEMeSs';        // <-- remplace
const EMAILJS_SERVICE_ID = 'service_rd93ge7';        // <-- vérifie
const EMAILJS_TEMPLATE_ID = 'template_g0vrt5q';      // <-- vérifie
const EMAIL_RECIPIENT = 'alextriniolpro@gmail.com';  // utile si tu veux l'envoyer côté template

// ---------------------------
// Utility : safe query + exist check
// ---------------------------
const $ = selector => document.querySelector(selector);
const $$ = selector => Array.from(document.querySelectorAll(selector));

// ---------------------------
// EmailJS init (safe)
// ---------------------------
function initEmailJS() {
  if (typeof emailjs === 'undefined') {
    console.warn('EmailJS non chargé. Assure-toi d\'inclure la lib emailjs SDK.');
    return;
  }
  if (!EMAILJS_PUBLIC_KEY || EMAILJS_PUBLIC_KEY === 'YOUR_PUBLIC_KEY') {
    console.warn('EmailJS PUBLIC KEY manquante : remplace EMAILJS_PUBLIC_KEY.');
  }
  try {
    emailjs.init(EMAILJS_PUBLIC_KEY);
    console.log('EmailJS initialisé');
  } catch (e) {
    console.error('Erreur initialization EmailJS', e);
  }
}

// ---------------------------
// Notifications (une seule à la fois)
// ---------------------------
let notificationTimer = null;
function showNotification(message, type = 'success') {
  // type: 'success' | 'error' | 'info'
  let notification = document.querySelector('.notification');
  if (!notification) {
    notification = document.createElement('div');
    notification.className = 'notification';
    notification.innerHTML = `
      <div class="notification-content" role="status" aria-live="polite">
        <div class="notification-icon"></div>
        <div class="notification-message"></div>
      </div>
    `;
    Object.assign(notification.style, {
      position: 'fixed',
      right: '20px',
      top: '20px',
      zIndex: 9999,
      transition: 'transform .25s ease, opacity .25s ease',
      transform: 'translateY(-10px)',
      opacity: '0',
      boxShadow: '0 6px 20px rgba(0,0,0,0.08)'
    });
    document.body.appendChild(notification);
  }

  notification.className = `notification ${type}`;
  notification.querySelector('.notification-message').textContent = message;
  notification.querySelector('.notification-icon').innerHTML = type === 'success' ? '✓' : '!';
  notification.style.transform = 'translateY(0)';
  notification.style.opacity = '1';

  // clear previous timer
  if (notificationTimer) clearTimeout(notificationTimer);
  notificationTimer = setTimeout(() => {
    notification.style.transform = 'translateY(-10px)';
    notification.style.opacity = '0';
    setTimeout(() => {
      if (notification.parentNode) notification.parentNode.removeChild(notification);
    }, 300);
    notificationTimer = null;
  }, 5000);
}

// Message affiché tant que la version Windows anonymisée n'est pas publiée
function showWindowsUnavailable() {
  showNotification(
    "Cette version Windows n'est pas encore prête car le nom n'a pas encore été retiré. Elle sera disponible prochainement.",
    'error'
  );
}

// ---------------------------
// Validation email (tolérant, accepte '+', sous-domaines, etc.)
// ---------------------------
function isValidEmail(email) {
  const re = /^[^\s@]+@[^\s@]+\.[^\s@]+$/; // simple et efficace
  return re.test(String(email).toLowerCase());
}

// ---------------------------
// Envoi Email (async/await + safe DOM checks)
// ---------------------------
async function sendEmail(formData) {
  // éléments UI
  const submitBtn = $('#submit-btn');
  const submitText = $('#submit-text');
  const submitIcon = $('#submit-icon');

  const setButtonState = (state) => {
    // state: 'loading' | 'success' | 'error' | 'idle'
    if (!submitBtn) return;
    submitBtn.classList.remove('loading', 'success', 'error');
    if (state !== 'idle') submitBtn.classList.add(state);
  };

  try {
    // UI -> loading
    setButtonState('loading');
    if (submitText) submitText.textContent = 'Envoi en cours...';
    if (submitIcon) submitIcon.className = 'fas fa-spinner';

    // Préparer templateParams en respectant les variables utilisées dans ton template EmailJS
    const templateParams = {
      user_name: formData.get('user_name'),
      user_email: formData.get('user_email'),
      user_subject: formData.get('user_subject'),
      message: formData.get('message'),
      date: new Date().toLocaleString('fr-FR'),
      to_email: EMAIL_RECIPIENT
    };

    // Vérifications basiques
    if (!templateParams.user_name || !templateParams.user_email || !templateParams.user_subject || !templateParams.message) {
      showNotification('Veuillez remplir tous les champs', 'error');
      setButtonState('idle');
      if (submitText) submitText.textContent = 'Envoyer le message';
      if (submitIcon) submitIcon.className = 'fas fa-paper-plane';
      return;
    }
    if (!isValidEmail(templateParams.user_email)) {
      showNotification('Veuillez entrer une adresse email valide', 'error');
      setButtonState('idle');
      if (submitText) submitText.textContent = 'Envoyer le message';
      if (submitIcon) submitIcon.className = 'fas fa-paper-plane';
      return;
    }

    // Envoi via EmailJS (vérifie que emailjs est chargé)
    if (typeof emailjs === 'undefined' || !emailjs.send) {
      throw new Error('EmailJS non disponible. Vérifie que le SDK est chargé.');
    }

    const resp = await emailjs.send(EMAILJS_SERVICE_ID, EMAILJS_TEMPLATE_ID, templateParams);
    console.log('EmailJS success', resp);

    // UI -> success
    setButtonState('success');
    if (submitText) submitText.textContent = 'Envoyer le message';
    if (submitIcon) submitIcon.className = 'fas fa-check';

    showNotification('Message envoyé avec succès !', 'success');

    // Réinitialiser le formulaire
    const contactForm = $('#contact-form');
    if (contactForm) contactForm.reset();

    // revenir à l'état initial après 3s
    setTimeout(() => {
      setButtonState('idle');
      if (submitIcon) submitIcon.className = 'fas fa-paper-plane';
    }, 3000);

  } catch (err) {
    console.error('Erreur envoi email :', err);
    setButtonState('error');
    if (submitText) submitText.textContent = 'Envoyer le message';
    if (submitIcon) submitIcon.className = 'fas fa-exclamation';

    showNotification('Erreur lors de l\'envoi du message.', 'error');

    // reset after 3s
    setTimeout(() => {
      setButtonState('idle');
      if (submitIcon) submitIcon.className = 'fas fa-paper-plane';
    }, 3000);
  }
}

// ---------------------------
// Particules : safe
// ---------------------------
function createParticles() {
  const particlesContainer = $('#particles');
  if (!particlesContainer) return; // si pas de container -> skip

  // Respecter la préférence "réduire les animations"
  if (window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches) return;

  const particleCount = 50;
  // vider au cas où
  particlesContainer.innerHTML = '';

  for (let i = 0; i < particleCount; i++) {
    const particle = document.createElement('div');
    particle.classList.add('particle');
    const posX = Math.random() * 100;
    const posY = Math.random() * 100;
    const size = Math.random() * 3 + 1;
    const delay = Math.random() * 20;

    Object.assign(particle.style, {
      position: 'absolute',
      left: `${posX}%`,
      top: `${posY}%`,
      width: `${size}px`,
      height: `${size}px`,
      borderRadius: '50%',
      animationDelay: `${delay}s`,
      opacity: (Math.random() * 0.3 + 0.1).toString(),
      pointerEvents: 'none'
    });

    particlesContainer.appendChild(particle);
  }
}

// ---------------------------
// DOMContentLoaded : événements et observers
// ---------------------------
document.addEventListener('DOMContentLoaded', function () {
  // init EmailJS
  initEmailJS();

  // header scroll safe
  const header = $('header');
  if (header) {
    window.addEventListener('scroll', function () {
      header.classList.toggle('scrolled', window.scrollY > 50);
    });
  }

  // IntersectionObserver pour animations (safe)
  const observerOptions = { threshold: 0.1, rootMargin: '0px 0px -50px 0px' };
  const observer = new IntersectionObserver((entries) => {
    entries.forEach(entry => {
      if (entry.isIntersecting) {
        entry.target.classList.add('visible');
        observer.unobserve(entry.target);
      }
    });
  }, observerOptions);

  const elementsToAnimate = $$('.section-title, .about-text, .about-image, .skill-card, .project-card, .contact-item, .contact-form, .passion-card, .cv-container');
  elementsToAnimate.forEach(el => observer.observe(el));

  // --- Navigation : menu mobile (burger) ---
  const headerEl = $('header');
  const navToggle = $('#navToggle');
  const navMenu = $('#navMenu');
  const headerOffset = () => (headerEl ? headerEl.offsetHeight : 0) + 24;

  const closeMobileNav = () => {
    if (!navMenu || !navToggle) return;
    navMenu.classList.remove('open');
    navToggle.setAttribute('aria-expanded', 'false');
    navToggle.setAttribute('aria-label', 'Ouvrir le menu');
  };

  if (navToggle && navMenu) {
    navToggle.addEventListener('click', () => {
      const isOpen = navMenu.classList.toggle('open');
      navToggle.setAttribute('aria-expanded', String(isOpen));
      navToggle.setAttribute('aria-label', isOpen ? 'Fermer le menu' : 'Ouvrir le menu');
    });
    document.addEventListener('click', (e) => {
      if (navMenu.classList.contains('open') && !navMenu.contains(e.target) && !navToggle.contains(e.target)) {
        closeMobileNav();
      }
    });
    document.addEventListener('keydown', (e) => {
      if (e.key === 'Escape') closeMobileNav();
    });
  }

  // Défilement doux des liens d'ancre (décalage pour le header fixe) + fermeture du menu mobile
  $$('.nav-menu a').forEach(link => {
    link.addEventListener('click', function (e) {
      const href = this.getAttribute('href');
      if (!href || !href.startsWith('#')) return;
      const targetSection = document.querySelector(href);
      if (!targetSection) return;
      e.preventDefault();
      const top = targetSection.getBoundingClientRect().top + window.pageYOffset - headerOffset();
      window.scrollTo({ top: Math.max(top, 0), behavior: 'smooth' });
      closeMobileNav();
    });
  });

  // Scroll-spy : surligne le lien de la section actuellement visible
  const navLinks = $$('.nav-menu a');
  const spySections = navLinks
    .map(a => document.querySelector(a.getAttribute('href')))
    .filter(Boolean);
  if (spySections.length) {
    const spy = new IntersectionObserver((entries) => {
      entries.forEach(entry => {
        if (entry.isIntersecting) {
          const id = entry.target.id;
          navLinks.forEach(a => a.classList.toggle('active', a.getAttribute('href') === '#' + id));
        }
      });
    }, { rootMargin: '-45% 0px -50% 0px', threshold: 0 });
    spySections.forEach(s => spy.observe(s));
  }

  // CTA "Voir mes projets" -> amène directement sur les cartes de projets (et non sur le titre)
  const heroCta = document.querySelector('.hero .cta-button');
  if (heroCta) {
    heroCta.addEventListener('click', function (e) {
      e.preventDefault();
      const grid = document.querySelector('#projets .projects-grid') || document.querySelector('#projets');
      if (!grid) return;
      const header = document.querySelector('header');
      const offset = (header ? header.offsetHeight : 0) + 40;
      const top = grid.getBoundingClientRect().top + window.pageYOffset - offset;
      window.scrollTo({ top: Math.max(top, 0), behavior: 'smooth' });
    });
  }

  // Formulaire contact
  const contactForm = $('#contact-form');
  if (contactForm) {
    contactForm.addEventListener('submit', function (e) {
      e.preventDefault();

      const formData = new FormData(contactForm);
      const name = formData.get('user_name');
      const email = formData.get('user_email');
      const subject = formData.get('user_subject');
      const message = formData.get('message');

      if (!name || !email || !subject || !message) {
        showNotification('Veuillez remplir tous les champs', 'error');
        return;
      }

      if (!isValidEmail(email)) {
        showNotification('Veuillez entrer une adresse email valide', 'error');
        return;
      }

      // envoyer
      sendEmail(formData);
    });
  }

  // init particules si présent
  createParticles();
});

// Données détaillées pour chaque passion
const passionsData = {
  musique: {
      title: "Musique",
      icon: '<i class="fas fa-music"></i>',
      mainContent: "La musique est plus qu'une passion, c'est une partie intégrante de ma vie. Je passe des heures à explorer différents genres, analyser des compositions et créer mes propres morceaux.",
      details: [
          { label: "Style préféré", value: "Trap/Reggaeton" },
          { label: "Expérience", value: "2 ans de composition" },
          { label: "Logiciel", value: "GarageBand" },
      ],
      favorites: [
          { icon: '<i class="fas fa-compact-disc"></i>', text: "Album : 'LUX - ROSALÍA'" },
          { icon: '<i class="fas fa-user"></i>', text: "Artiste : Green Montana" },
          { icon: '<i class="fas fa-guitar"></i>', text: "Titre : NEYMAR JR - Green Montana & SDM" },
          { icon: '<i class="fas fa-headphones"></i>', text: "Genre : Trap" }
      ],
      quote: "La musique donne une âme à nos cœurs et des ailes à la pensée."
  },
  football: {
      title: "Football",
      icon: '<i class="fas fa-futbol"></i>',
      mainContent: "Depuis mon enfance, le football rythme ma vie. Que ce soit en regardant les matchs ou en jouant avec des amis, ce sport m'a enseigné l'esprit d'équipe et la persévérance.",
      details: [
          { label: "Équipe favorite", value: "PSG" },
          { label: "Poste", value: "Gardien de but" },
          { label: "Depuis", value: "12 ans" },
          { label: "Style de jeu", value: "Relanceur" }
      ],
      favorites: [
          { icon: '<i class="fas fa-trophy"></i>', text: "Joueur : Steven Berghuis" },
          { icon: '<i class="fas fa-flag"></i>', text: "Compétition : Ligue 1" },
          { icon: '<i class="fas fa-landmark"></i>', text: "Stade : Stade Gabriel Montpied" },
          { icon: '<i class="fas fa-history"></i>', text: "Moment : Finale de la coupe du monde 2018" }
      ],
      quote: "Le football est un sport simple, mais le jouer simplement est la chose la plus difficile."
  },
};

// Gestion des pop-ups de passions
document.addEventListener('DOMContentLoaded', function() {
  const passionCards = document.querySelectorAll('.passion-card');
  const popupOverlay = document.getElementById('passionPopupOverlay');
  const popupCloseBtn = document.getElementById('popupCloseBtn');
  const popupIcon = document.getElementById('popupIcon');
  const popupTitle = document.getElementById('popupTitle');
  const popupMainContent = document.getElementById('popupMainContent');
  const popupDetails = document.getElementById('popupDetails');
  const popupFavorites = document.getElementById('popupFavorites');
  const popupQuote = document.getElementById('popupQuote');

  let lastFocusedPassion = null;

  // Associer chaque carte à sa passion (lue depuis data-passion ; repli sur l'index)
  passionCards.forEach((card, index) => {
      if (!card.dataset.passion) {
          card.dataset.passion = Object.keys(passionsData)[index];
      }
      const open = () => {
          const passion = card.dataset.passion;
          if (passion && passionsData[passion]) {
              openPassionPopup(passion);
          }
      };
      card.addEventListener('click', open);
      card.addEventListener('keydown', (e) => {
          if (e.key === 'Enter' || e.key === ' ') {
              e.preventDefault();
              open();
          }
      });
  });

  // Fonction pour ouvrir le pop-up
  function openPassionPopup(passion) {
      const data = passionsData[passion];
      
      popupIcon.innerHTML = data.icon;
      popupTitle.textContent = data.title;
      popupMainContent.textContent = data.mainContent;
      
      // Détails
      popupDetails.innerHTML = '';
      data.details.forEach(detail => {
          const detailHTML = `
              <div class="detail-item">
                  <span class="detail-label">${detail.label}</span>
                  <span class="detail-value">${detail.value}</span>
              </div>
          `;
          popupDetails.innerHTML += detailHTML;
      });
      
      // Favoris
      popupFavorites.innerHTML = '';
      data.favorites.forEach(fav => {
          const favHTML = `
              <div class="favorite-item">
                  ${fav.icon}
                  <span>${fav.text}</span>
              </div>
          `;
          popupFavorites.innerHTML += favHTML;
      });
      
      // Citation
      popupQuote.textContent = data.quote;
      
      // Afficher le pop-up
      lastFocusedPassion = document.activeElement;
      popupOverlay.classList.add('active');
      document.body.style.overflow = 'hidden'; // Empêcher le défilement
      popupCloseBtn.focus();
  }

  // Fermer le pop-up
  popupCloseBtn.addEventListener('click', closePopup);
  popupOverlay.addEventListener('click', function(e) {
      if (e.target === popupOverlay) {
          closePopup();
      }
  });

  // Touche Échap pour fermer
  document.addEventListener('keydown', function(e) {
      if (e.key === 'Escape' && popupOverlay.classList.contains('active')) {
          closePopup();
      }
  });

  function closePopup() {
      popupOverlay.classList.remove('active');
      document.body.style.overflow = 'auto'; // Rétablir le défilement
      if (lastFocusedPassion && typeof lastFocusedPassion.focus === 'function') {
          lastFocusedPassion.focus();
      }
  }
});

// Données pour les projets
const projectsData = {
  memory: {
    title: "Memory",
    subtitle: "Jeu de mémoire — Application de bureau .NET MAUI",
    downloads: [
        { name: "macOS", icon: "fab fa-apple", href: "https://github.com/alexandre-tc/portfolio/releases/download/memory-v1.0/Memory-macOS.zip" },
        { name: "Windows", icon: "fab fa-windows", disabled: true }
    ],
    images: [
        { src: "images/projets/memory-menu.png", alt: "Menu principal de Memory", caption: "Le menu principal et les statistiques de jeu." },
        { src: "images/projets/memory-partie.png", alt: "Une partie de Memory en cours", caption: "Une partie à deux joueurs en cours." }
    ],
    description: `Memory est un jeu de mémoire numérique simple et interactif : retrouvez les paires de cartes le plus rapidement possible et obtenez le meilleur score.

L'application propose un mode joueur contre joueur, un mode contre une IA, un classement des meilleurs scores ainsi qu'une page de règles. Plusieurs niveaux de difficulté et thèmes de cartes sont disponibles.

Développée en C# avec .NET MAUI, elle est multiplateforme : une version macOS et une version Windows sont proposées au téléchargement. Projet réalisé en équipe avec Sasha Lorenc et Cristiano Franco-Tith.`,
    technologies: [
        { name: "C#", icon: "fas fa-hashtag" },
        { name: ".NET MAUI", icon: "fas fa-layer-group" },
        { name: "XAML", icon: "fas fa-code" },
        { name: "Tests unitaires", icon: "fas fa-vial" }
    ],
    skills: [
        { name: "Programmation orientée objet", icon: "fas fa-cubes" },
        { name: "Conception UML", icon: "fas fa-project-diagram" },
        { name: "Travail en équipe", icon: "fas fa-users" }
    ]
},
  gestionStocks: {
      title: "Application en C - Gestion de stocks",
      subtitle: "Application en C - Gestion de données",
      githubLink: "https://github.com/alexandre-tc/saeAlgo",
      images: [
          { src: "images/projets/menu.png", alt: "Menu", caption: "Notre menu." },
          { src: "images/projets/etatStock.png", alt: "Interface", caption: "L'évaluation des stocks" }
      ],
      description: `Cette application charge les données de plusieurs fichiers dans des tableaux statiques.
      Elle permet de modifier des données, d'en ajouter des nouvelles ou même d'en supprimer.
      Il est possible d'afficher l'état du stock, et même de faire des commandes de plusieurs produits.`,
      technologies: [
          { name: "C", icon: "fas fa-terminal" },
          { name: "Makefile", icon: "fas fa-cogs" },
          { name: "Doxyfile", icon: "fas fa-file-code" },
          { name: "Structures de données", icon: "fas fa-database" },
      ],
      skills: [
          { name: "Programmation C", icon: "fas fa-terminal" },
          { name: "Gestion de fichiers", icon: "fas fa-folder-open" },
          { name: "Documentation", icon: "fas fa-book" },
      ]
  }
};

// Gestion des pop-ups de projets
document.addEventListener('DOMContentLoaded', function() {
  const projectCards = document.querySelectorAll('.project-card');
  const projectPopupOverlay = document.getElementById('projectPopupOverlay');
  const projectPopupCloseBtn = document.getElementById('projectPopupCloseBtn');
  const projectPopupContent = document.getElementById('projectPopupContent');
  let lastFocusedProject = null;

  // Associer chaque carte à son projet (clé lue depuis l'attribut data-project)
  projectCards.forEach((card) => {
      const open = () => {
          const project = card.dataset.project;
          if (project && projectsData[project]) {
              openProjectPopup(project);
          }
      };
      card.addEventListener('click', open);
      card.addEventListener('keydown', (e) => {
          if (e.key === 'Enter' || e.key === ' ') {
              e.preventDefault();
              open();
          }
      });
  });

  // Fonction pour ouvrir le pop-up de projet
  function openProjectPopup(project) {
      const data = projectsData[project];
      
      // Construire le contenu du pop-up
      let contentHTML = `
          <div class="project-popup-header">
              <h2 class="project-popup-title">${data.title}</h2>
              <p class="project-popup-subtitle">${data.subtitle}</p>
          </div>
          
          <div class="project-popup-gallery">
      `;
      
      // Ajouter les images
      data.images.forEach(image => {
          contentHTML += `
              <div class="project-popup-image-container">
                  <img src="${image.src}" alt="${image.alt}" class="project-popup-image" loading="lazy" decoding="async">
                  <div class="project-popup-caption">${image.caption}</div>
              </div>
          `;
      });
      
      contentHTML += `
          </div>
          
          <div class="project-popup-description">
              ${data.description.split('\n\n').map(para => `<p>${para}</p>`).join('')}
          </div>
          
          <div class="project-popup-technologies">
              <h3 class="project-popup-tech-title">
                  <i class="fas fa-tools" aria-hidden="true"></i>
                  Technologies utilisées
              </h3>
              <div class="project-popup-tech-tags">
      `;

      // Ajouter les technologies
      data.technologies.forEach(tech => {
          contentHTML += `
              <span class="project-popup-tech-tag">
                  <i class="${tech.icon}" aria-hidden="true"></i>
                  ${tech.name}
              </span>
          `;
      });
      
      contentHTML += `
              </div>
          </div>
          
          <div class="project-popup-skills">
              <h3 class="project-popup-skills-title">
                  <i class="fas fa-graduation-cap" aria-hidden="true"></i>
                  Compétences acquises
              </h3>
              <div class="project-popup-skills-list">
      `;

      // Ajouter les compétences
      data.skills.forEach(skill => {
          contentHTML += `
              <div class="project-popup-skill-item">
                  <i class="${skill.icon}" aria-hidden="true"></i>
                  <span>${skill.name}</span>
              </div>
          `;
      });
      
      contentHTML += `
              </div>
          </div>
      `;

      // Actions : téléchargements (mac/windows) ou lien GitHub selon le projet
      if (Array.isArray(data.downloads) && data.downloads.length) {
          contentHTML += `
              <div class="project-popup-actions">
                  <h3 class="project-popup-actions-title">
                      <i class="fas fa-download" aria-hidden="true"></i>
                      Télécharger l'application
                  </h3>
                  <div class="project-popup-downloads">
          `;
          data.downloads.forEach(dl => {
              if (dl.disabled) {
                  contentHTML += `
                      <button type="button" class="download-btn" onclick="showWindowsUnavailable()" aria-label="Télécharger ${data.title} pour ${dl.name} (indisponible)">
                          <i class="${dl.icon}" aria-hidden="true"></i>
                          <span>${dl.name}</span>
                      </button>
                  `;
              } else {
                  contentHTML += `
                      <a href="${dl.href}" class="download-btn" rel="noopener" aria-label="Télécharger ${data.title} pour ${dl.name}">
                          <i class="${dl.icon}" aria-hidden="true"></i>
                          <span>${dl.name}</span>
                      </a>
                  `;
              }
          });
          contentHTML += `
                  </div>
              </div>
          `;
      } else if (data.githubLink) {
          contentHTML += `
              <div class="project-popup-github">
                  <a href="${data.githubLink}" class="github-link" target="_blank" rel="noopener">
                      <i class="fab fa-github" aria-hidden="true"></i>
                      Voir sur GitHub
                      <i class="fas fa-arrow-up-right-from-square" aria-hidden="true"></i>
                  </a>
              </div>
          `;
      }

      // Injecter le contenu
      projectPopupContent.innerHTML = contentHTML;
      
      // Afficher le pop-up
      lastFocusedProject = document.activeElement;
      projectPopupOverlay.classList.add('active');
      document.body.style.overflow = 'hidden';
      projectPopupCloseBtn.focus();
  }

  // Fermer le pop-up
  projectPopupCloseBtn.addEventListener('click', closeProjectPopup);
  projectPopupOverlay.addEventListener('click', function(e) {
      if (e.target === projectPopupOverlay) {
          closeProjectPopup();
      }
  });

  // Touche Échap pour fermer
  document.addEventListener('keydown', function(e) {
      if (e.key === 'Escape' && projectPopupOverlay.classList.contains('active')) {
          closeProjectPopup();
      }
  });

  function closeProjectPopup() {
      projectPopupOverlay.classList.remove('active');
      document.body.style.overflow = 'auto';
      if (lastFocusedProject && typeof lastFocusedProject.focus === 'function') {
          lastFocusedProject.focus();
      }
  }

  // Animation au survol des cartes de projet
  projectCards.forEach(card => {
      card.addEventListener('mouseenter', function() {
          this.style.zIndex = '10';
      });
      
      card.addEventListener('mouseleave', function() {
          this.style.zIndex = '1';
      });
  });
});