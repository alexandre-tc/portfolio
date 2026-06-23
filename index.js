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
    "Cette version Windows n'est pas encore prête. Elle sera disponible prochainement.",
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

  // Générer les cartes de compétences (avant l'observer d'animation)
  renderSkills();

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

// ---------------------------
// Helpers couleurs (utilisés par les compétences et les passions)
// ---------------------------
function hexToRgba(hex, alpha = 1) {
  const h = hex.replace('#', '');
  const full = h.length === 3 ? h.split('').map(c => c + c).join('') : h;
  const num = parseInt(full, 16);
  return `rgba(${(num >> 16) & 255}, ${(num >> 8) & 255}, ${num & 255}, ${alpha})`;
}

// Éclaircit (percent > 0) ou assombrit (percent < 0) une couleur hex
function shadeHex(hex, percent) {
  const h = hex.replace('#', '');
  const full = h.length === 3 ? h.split('').map(c => c + c).join('') : h;
  const num = parseInt(full, 16);
  const clamp = v => Math.max(0, Math.min(255, Math.round(v)));
  const r = clamp(((num >> 16) & 255) * (1 + percent));
  const g = clamp(((num >> 8) & 255) * (1 + percent));
  const b = clamp((num & 255) * (1 + percent));
  return `rgb(${r}, ${g}, ${b})`;
}

// ---------------------------
// Compétences (données + rendu + lien vers les projets)
// ---------------------------
const skillsData = [
  {
    id: 'web', title: 'Développement web', icon: 'fas fa-code', color: '#007AFF',
    tech: ['HTML', 'CSS', 'PHP'], projects: []
  },
  {
    id: 'bdd', title: 'Base de données', icon: 'fas fa-database', color: '#5856D6',
    tech: ['SQL', 'PL/pgSQL', 'PostgreSQL'], projects: []
  },
  {
    id: 'prog', title: 'Programmation', icon: 'fas fa-terminal', color: '#FF9500',
    tech: ['C', 'C++', 'Python', 'Bash'], projects: ['gestionStocks']
  },
  {
    id: 'app', title: 'Développement applicatif', icon: 'fas fa-layer-group', color: '#34C759',
    tech: ['C#', '.NET MAUI', 'XAML'], projects: ['memory']
  },
  {
    id: 'admin', title: 'Administration', icon: 'fas fa-server', color: '#5AC8FA',
    tech: ['Linux', 'Réseau'], projects: []
  },
  {
    id: 'tools', title: 'Outils', icon: 'fas fa-toolbox', color: '#AF52DE',
    tech: ['Git', 'SSH', 'x2go'], projects: ['memory', 'gestionStocks']
  }
];

function renderSkills() {
  const container = document.getElementById('skillsContainer');
  if (!container) return;

  container.innerHTML = skillsData.map(skill => {
    const hasProjects = Array.isArray(skill.projects) && skill.projects.length > 0;
    const plural = hasProjects && skill.projects.length > 1;
    const techHTML = skill.tech.map(t => `<li>${t}</li>`).join('');
    const footerHTML = hasProjects
      ? `<span class="skill-link">Voir ${plural ? 'les projets' : 'le projet'}<i class="fas fa-arrow-right" aria-hidden="true"></i></span>`
      : `<span class="skill-soon"><i class="fas fa-hourglass-half" aria-hidden="true"></i> Projet à venir</span>`;
    const a11y = hasProjects
      ? `role="button" tabindex="0" aria-label="${skill.title} — voir ${plural ? 'les projets associés' : 'le projet associé'}"`
      : `aria-label="${skill.title} — projet à venir"`;

    return `
      <article class="skill-card glass-effect ${hasProjects ? 'is-clickable' : 'is-coming'}"
        data-skill="${skill.id}" data-projects="${(skill.projects || []).join(',')}"
        style="--skill-color:${skill.color}; --skill-bg:${hexToRgba(skill.color, 0.12)}; --skill-border:${hexToRgba(skill.color, 0.32)}"
        ${a11y}>
        <div class="skill-icon" aria-hidden="true"><i class="${skill.icon}"></i></div>
        <h3 class="skill-title">${skill.title}</h3>
        <ul class="skill-tech">${techHTML}</ul>
        <div class="skill-footer">${footerHTML}</div>
      </article>`;
  }).join('');

  container.querySelectorAll('.skill-card.is-clickable').forEach(card => {
    const open = () => openSkillPopup(card.dataset.skill);
    card.addEventListener('click', open);
    card.addEventListener('keydown', (e) => {
      if (e.key === 'Enter' || e.key === ' ') {
        e.preventDefault();
        open();
      }
    });
  });
}

// ---------------------------
// Pop-up « Projets associés à une compétence »
// ---------------------------
let lastFocusedSkill = null;

function openSkillPopup(skillId) {
  const skill = skillsData.find(s => s.id === skillId);
  const overlay = document.getElementById('skillPopupOverlay');
  const container = document.getElementById('skillPopupContainer');
  const content = document.getElementById('skillPopupContent');
  if (!skill || !overlay || !content) return;

  const projects = (skill.projects || [])
    .map(key => ({ key, data: projectsData[key] }))
    .filter(p => p.data);

  const count = projects.length;

  const projectsHTML = projects.map(({ key, data }) => {
    const tagsHTML = (data.technologies || [])
      .map(t => `<span class="sp-tag">${t.name}</span>`)
      .join('');
    return `
      <button type="button" class="sp-project" data-project="${key}"
        aria-label="Ouvrir le détail du projet ${data.title}">
        <span class="sp-project-icon"><i class="${data.icon || 'fas fa-folder'}" aria-hidden="true"></i></span>
        <span class="sp-project-body">
          <span class="sp-project-title">${data.title}</span>
          <span class="sp-project-sub">${data.subtitle || ''}</span>
          <span class="sp-project-tags">${tagsHTML}</span>
        </span>
        <span class="sp-project-go"><i class="fas fa-arrow-right" aria-hidden="true"></i></span>
      </button>
    `;
  }).join('');

  content.innerHTML = `
    <div class="skill-popup" style="--skill-color:${skill.color}; --skill-color-dark:${shadeHex(skill.color, -0.4)}; --skill-bg:${hexToRgba(skill.color, 0.12)}; --skill-border:${hexToRgba(skill.color, 0.3)}">
      <header class="sp-hero">
        <span class="sp-hero-icon"><i class="${skill.icon}" aria-hidden="true"></i></span>
        <div class="sp-hero-text">
          <h2 class="sp-title" id="skillPopupTitle">${skill.title}</h2>
          <p class="sp-subtitle">${count} projet${count > 1 ? 's' : ''} réalisé${count > 1 ? 's' : ''} avec cette compétence</p>
        </div>
      </header>
      <div class="sp-tech-recap">
        ${skill.tech.map(t => `<span class="sp-tech">${t}</span>`).join('')}
      </div>
      <div class="sp-projects">${projectsHTML}</div>
    </div>
  `;

  if (container) container.style.setProperty('--skill-color', skill.color);
  overlay.setAttribute('aria-labelledby', 'skillPopupTitle');

  // Ouvrir le détail complet d'un projet depuis ce pop-up
  content.querySelectorAll('.sp-project').forEach(btn => {
    btn.addEventListener('click', () => {
      const key = btn.dataset.project;
      closeSkillPopup({ restoreFocus: false });
      if (typeof window.openProjectPopup === 'function') {
        window.openProjectPopup(key);
      }
    });
  });

  if (container) container.scrollTop = 0;
  lastFocusedSkill = document.activeElement;
  overlay.classList.add('active');
  document.body.style.overflow = 'hidden';
  document.getElementById('skillPopupCloseBtn').focus();
}

function closeSkillPopup(opts = {}) {
  const { restoreFocus = true } = opts;
  const overlay = document.getElementById('skillPopupOverlay');
  if (!overlay) return;
  overlay.classList.remove('active');
  document.body.style.overflow = 'auto';
  if (restoreFocus && lastFocusedSkill && typeof lastFocusedSkill.focus === 'function') {
    lastFocusedSkill.focus();
  }
}

document.addEventListener('DOMContentLoaded', function () {
  const overlay = document.getElementById('skillPopupOverlay');
  const closeBtn = document.getElementById('skillPopupCloseBtn');
  if (!overlay) return;
  if (closeBtn) closeBtn.addEventListener('click', () => closeSkillPopup());
  overlay.addEventListener('click', (e) => {
    if (e.target === overlay) closeSkillPopup();
  });
  document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape' && overlay.classList.contains('active')) closeSkillPopup();
  });
});

// Données détaillées pour chaque passion
const passionsData = {
  musique: {
      title: "Musique",
      subtitle: "Composition & écoute",
      icon: "fas fa-music",
      color: "#9F7AEA",
      mainContent: "La musique est plus qu'une passion, c'est une partie intégrante de ma vie. Je passe des heures à explorer différents genres, analyser des compositions et créer mes propres morceaux.",
      stats: [
          { icon: "fas fa-sliders", label: "Style préféré", value: "Trap / Reggaeton" },
          { icon: "fas fa-clock-rotate-left", label: "Expérience", value: "2 ans de composition" },
          { icon: "fas fa-wave-square", label: "Logiciel", value: "GarageBand" },
      ],
      favorites: [
          { icon: "fas fa-compact-disc", label: "Album", value: "LUX — ROSALÍA" },
          { icon: "fas fa-user", label: "Artiste", value: "Green Montana" },
          { icon: "fas fa-guitar", label: "Titre", value: "NEYMAR JR — Green Montana & SDM" },
          { icon: "fas fa-headphones", label: "Genre", value: "Trap" }
      ],
      quote: "La musique donne une âme à nos cœurs et des ailes à la pensée."
  },
  football: {
      title: "Football",
      subtitle: "Sur le terrain & devant l'écran",
      icon: "fas fa-futbol",
      color: "#48BB78",
      mainContent: "Depuis mon enfance, le football rythme ma vie. Que ce soit en regardant les matchs ou en jouant avec des amis, ce sport m'a enseigné l'esprit d'équipe et la persévérance.",
      stats: [
          { icon: "fas fa-shield-halved", label: "Équipe favorite", value: "PSG" },
          { icon: "fas fa-hand", label: "Poste", value: "Gardien de but" },
          { icon: "fas fa-calendar-check", label: "Depuis", value: "12 ans" },
          { icon: "fas fa-futbol", label: "Style de jeu", value: "Relanceur" }
      ],
      favorites: [
          { icon: "fas fa-star", label: "Joueur", value: "Steven Berghuis" },
          { icon: "fas fa-flag", label: "Compétition", value: "Ligue 1" },
          { icon: "fas fa-landmark", label: "Stade", value: "Gabriel Montpied" },
          { icon: "fas fa-trophy", label: "Moment", value: "Finale de la Coupe du monde 2018" }
      ],
      quote: "Le football est un sport simple, mais le jouer simplement est la chose la plus difficile."
  },
};

// Gestion des pop-ups de passions
document.addEventListener('DOMContentLoaded', function() {
  const passionCards = document.querySelectorAll('.passion-card');
  const popupOverlay = document.getElementById('passionPopupOverlay');
  const popupContainer = document.getElementById('passionPopupContainer');
  const popupCloseBtn = document.getElementById('popupCloseBtn');
  const popupContent = document.getElementById('passionPopupContent');

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
      if (!data) return;

      const statsHTML = data.stats.map(s => `
          <div class="pm-stat">
              <i class="${s.icon}" aria-hidden="true"></i>
              <div class="pm-stat-text">
                  <span class="pm-stat-label">${s.label}</span>
                  <span class="pm-stat-value">${s.value}</span>
              </div>
          </div>
      `).join('');

      const favoritesHTML = data.favorites.map(f => `
          <div class="pm-fav">
              <span class="pm-fav-icon"><i class="${f.icon}" aria-hidden="true"></i></span>
              <span class="pm-fav-label">${f.label}</span>
              <span class="pm-fav-value">${f.value}</span>
          </div>
      `).join('');

      const styleVars = `--passion-color:${data.color};`
          + `--passion-color-dark:${shadeHex(data.color, -0.4)};`
          + `--passion-bg:${hexToRgba(data.color, 0.12)};`
          + `--passion-border:${hexToRgba(data.color, 0.28)}`;

      popupContent.innerHTML = `
          <div class="passion-modal" style="${styleVars}">
              <header class="pm-hero">
                  <span class="pm-hero-icon"><i class="${data.icon}" aria-hidden="true"></i></span>
                  <div class="pm-hero-text">
                      <h2 class="pm-title" id="passionPopupTitle">${data.title}</h2>
                      <p class="pm-subtitle">${data.subtitle}</p>
                  </div>
              </header>
              <p class="pm-intro">${data.mainContent}</p>
              <div class="pm-stats">${statsHTML}</div>
              <section class="pm-section">
                  <h3 class="pm-section-title"><i class="fas fa-heart" aria-hidden="true"></i> Mes favoris</h3>
                  <div class="pm-favorites">${favoritesHTML}</div>
              </section>
              <blockquote class="pm-quote">${data.quote}</blockquote>
          </div>
      `;

      // Teinte de la pop-up (utilisée notamment par le bouton de fermeture)
      if (popupContainer) popupContainer.style.setProperty('--passion-color', data.color);
      popupOverlay.setAttribute('aria-labelledby', 'passionPopupTitle');

      // Afficher le pop-up
      if (popupContainer) popupContainer.scrollTop = 0;
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
    icon: "fas fa-brain",
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
      icon: "fas fa-warehouse",
      terminal: true, // affiche le bouton « Ouvrir le terminal interactif » dans la pop-up
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

      // Terminal interactif (mini-jeu) pour les projets en ligne de commande
      if (data.terminal) {
          contentHTML += `
              <div class="project-popup-terminal">
                  <button type="button" class="terminal-launch-btn" onclick="openTerminal()">
                      <i class="fas fa-terminal" aria-hidden="true"></i>
                      <span>Ouvrir le terminal interactif</span>
                  </button>
                  <span class="terminal-launch-hint">Un petit jeu se cache ici 👀</span>
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

  // Exposer l'ouverture du détail projet (utilisé par le pop-up des compétences)
  window.openProjectPopup = openProjectPopup;

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
// ===========================================================
// Easter egg : terminal interactif (mini-jeu) — pop-up dans la page
// Lancé via le bouton « Ouvrir le terminal » de la pop-up projet,
// ou en tapant jeu() dans la console du navigateur.
// ===========================================================
(function terminalGame() {
  const enigmes = [
    {
      q: "Je réponds toujours mais ne pose jamais de question, je répète sans jamais comprendre. Dans un terminal, je suis aussi une commande. Que suis-je ?",
      r: ["echo"],
      indice: "On m'utilise pour afficher du texte dans un terminal."
    },
    {
      q: "J'ai des touches mais aucune porte, un retour mais jamais de voyage, et de l'espace sans être l'univers. Que suis-je ?",
      r: ["clavier"],
      indice: "Tu m'utilises à l'instant même pour taper."
    },
    {
      q: "Petite bête invisible, je me cache dans le code et fais planter tes rêves. On me traque, mais je résiste. Que suis-je ?",
      r: ["bug"],
      indice: "Les développeurs passent leurs journées à me chasser."
    },
    {
      q: "Je vole sans ailes, je file sans jambes, on me perd sans jamais me rattraper. Que suis-je ?",
      r: ["temps", "le temps"],
      indice: "Une montre essaie de me mesurer."
    },
    {
      q: "Je grandis quand on m'enlève de la matière, je rétrécis quand on m'en ajoute. Que suis-je ?",
      r: ["trou"],
      indice: "Une pelle m'agrandit."
    }
  ];

  let current = null;

  const norm = s => String(s).toLowerCase().trim()
    .normalize('NFD').replace(/[̀-ͯ]/g, '')
    .replace(/^(l'|le |la |les |un |une )\s*/, '').trim();

  const pick = () => { current = enigmes[Math.floor(Math.random() * enigmes.length)]; };
  const line = (text, cls) => ({ text, cls: cls || '' });

  // Moteur de commandes : renvoie { lines, clear?, close? }
  function processCommand(raw) {
    const trimmed = String(raw).trim();
    if (!trimmed) return { lines: [] };
    const parts = trimmed.split(/\s+/);
    const cmd = parts[0].toLowerCase();
    const rest = trimmed.slice(parts[0].length).trim();

    switch (cmd) {
      case 'help':
        return { lines: [
          line('Commandes disponibles :', 'title'),
          line('  aventure            (re)lance le jeu et tire une énigme au hasard'),
          line('  ls                  liste les fichiers'),
          line('  cat enigme.txt      relit l\'énigme en cours'),
          line('  indice              un coup de pouce'),
          line('  reponse <réponse>   propose ta réponse'),
          line('  whoami              qui suis-je ?'),
          line('  clear               nettoie l\'écran'),
          line('  exit                ferme le terminal')
        ] };

      case 'aventure':
      case 'jeu':
      case 'start':
        pick();
        return { lines: [
          line('🗺️  Une énigme apparaît. Résous-la pour déverrouiller le coffre.', 'title'),
          line('🧩 ' + current.q, 'accent'),
          line('→ réponds avec :  reponse <ta réponse>     (besoin d\'aide ?  indice)', 'hint')
        ] };

      case 'ls': {
        const lines = [line('enigme.txt   indice.txt   coffre.zip 🔒', 'muted')];
        if (!current) lines.push(line('astuce : tape  aventure  pour commencer', 'hint'));
        return { lines };
      }

      case 'cat': {
        const f = norm(rest);
        if (f.includes('enigme')) {
          if (!current) pick();
          return { lines: [line('🧩 ' + current.q, 'accent'), line('→ reponse <ta réponse>', 'hint')] };
        }
        if (f.includes('indice')) return processCommand('indice');
        if (f.includes('coffre')) return { lines: [line('🔒 coffre.zip est verrouillé. Résous l\'énigme pour l\'ouvrir.', 'err')] };
        if (!rest) return { lines: [line('cat: précise un fichier (ex: cat enigme.txt)', 'err')] };
        return { lines: [line('cat: ' + rest + ': fichier introuvable — tape  ls', 'err')] };
      }

      case 'indice':
        if (!current) return { lines: [line('lance d\'abord  aventure', 'hint')] };
        return { lines: [line('💡 ' + current.indice, 'hint')] };

      case 'reponse':
      case 'repondre':
      case 'rep':
        if (!current) return { lines: [line('lance d\'abord  aventure', 'hint')] };
        if (!rest) return { lines: [line('précise ta réponse : reponse <ta réponse>', 'err')] };
        if (current.r.map(norm).includes(norm(rest))) {
          current = null;
          if (typeof showNotification === 'function') {
            showNotification('🎉 Énigme résolue ! Bien joué.', 'success');
          }
          return { lines: [
            line('✅ Exact, c\'était « ' + rest + ' » !', 'ok'),
            line('🔓 coffre.zip déverrouillé.', 'ok'),
            line('Tu as l\'œil d\'un·e vrai·e dev. Si tu recrutes en alternance, on est faits pour s\'entendre 😉', 'accent'),
            line('📬 alexandre.triniol--crozatier@etu.uca.fr', 'hint'),
            line('(tape  aventure  pour une nouvelle énigme)', 'muted')
          ] };
        }
        return { lines: [line('❌ Raté… ce n\'est pas « ' + rest + ' ». Réessaie, ou tape  indice', 'err')] };

      case 'whoami':
        return { lines: [
          line('Alexandre Triniol--Crozatier', 'title'),
          line('Étudiant en BUT Informatique • musique 🎵 & foot ⚽ • en quête d\'une alternance.', 'hint')
        ] };

      case 'sudo':
        return { lines: [line('Nice try 😏 — tu n\'as pas les droits root sur ma personnalité.', 'err')] };

      case 'clear':
      case 'cls':
        return { clear: true, lines: [] };

      case 'exit':
      case 'quit':
        return { close: true, lines: [line('À bientôt 👋', 'hint')] };

      default:
        return { lines: [line(cmd + ': commande introuvable — tape  help', 'err')] };
    }
  }

  // --- Interface du terminal ---
  const overlay = document.getElementById('terminalPopupOverlay');
  const win = document.getElementById('terminalWindow');
  const output = document.getElementById('terminalOutput');
  const form = document.getElementById('terminalForm');
  const input = document.getElementById('terminalInput');
  const closeBtn = document.getElementById('terminalCloseBtn');
  const screen = document.getElementById('terminalScreen');

  let lastFocused = null;
  const history = [];
  let histIndex = -1;

  function append(lines) {
    (lines || []).forEach(l => {
      const div = document.createElement('div');
      div.className = 'term-line' + (l.cls ? ' term-' + l.cls : '');
      div.textContent = l.text;
      output.appendChild(div);
    });
    if (screen) screen.scrollTop = screen.scrollHeight;
  }

  function echoCommand(value) {
    const div = document.createElement('div');
    div.className = 'term-line term-cmd';
    const prompt = document.createElement('span');
    prompt.className = 'term-cmd-prompt';
    prompt.textContent = 'visiteur@portfolio:~$ ';
    div.appendChild(prompt);
    div.appendChild(document.createTextNode(value));
    output.appendChild(div);
  }

  function openTerminal() {
    if (!overlay) return;
    if (!output.childElementCount) {
      append([
        line('Bienvenue dans le terminal d\'Alexandre 👋', 'title'),
        line('tape  help  pour les commandes, ou  aventure  pour lancer le jeu.', 'hint')
      ]);
    }
    lastFocused = document.activeElement;
    overlay.classList.add('active');
    document.body.style.overflow = 'hidden';
    setTimeout(() => input && input.focus(), 60);
  }

  function anyOtherOverlayOpen() {
    return ['projectPopupOverlay', 'passionPopupOverlay', 'skillPopupOverlay']
      .some(id => document.getElementById(id)?.classList.contains('active'));
  }

  function closeTerminal() {
    if (!overlay) return;
    overlay.classList.remove('active');
    document.body.style.overflow = anyOtherOverlayOpen() ? 'hidden' : 'auto';
    if (lastFocused && typeof lastFocused.focus === 'function') lastFocused.focus();
  }

  if (form) {
    form.addEventListener('submit', (e) => {
      e.preventDefault();
      const value = input.value;
      if (value.trim()) { history.push(value); histIndex = history.length; }
      echoCommand(value);
      input.value = '';
      const res = processCommand(value);
      if (res.clear) output.innerHTML = '';
      append(res.lines);
      if (res.close) setTimeout(closeTerminal, 400);
    });
  }

  if (input) {
    input.addEventListener('keydown', (e) => {
      if (e.key === 'ArrowUp') {
        if (histIndex > 0) { histIndex--; input.value = history[histIndex]; e.preventDefault(); }
      } else if (e.key === 'ArrowDown') {
        if (histIndex < history.length - 1) { histIndex++; input.value = history[histIndex]; }
        else { histIndex = history.length; input.value = ''; }
        e.preventDefault();
      }
    });
  }

  if (closeBtn) closeBtn.addEventListener('click', closeTerminal);
  if (screen) screen.addEventListener('click', () => input && input.focus());
  if (overlay) overlay.addEventListener('click', (e) => { if (e.target === overlay) closeTerminal(); });
  document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape' && overlay && overlay.classList.contains('active')) closeTerminal();
  });

  // Exposer pour le bouton de la pop-up projet et pour la console
  window.openTerminal = openTerminal;
  window.jeu = openTerminal;

  // Clin d'œil discret dans la console du navigateur
  console.log('%c👋 Curieux·se ? Un terminal interactif se cache dans le projet « Gestion de stocks » (section Projets) — ou tape %cjeu()%c ici.',
    'color:#5856D6;font-size:13px;', 'color:#FF9500;font-family:monospace;font-weight:bold;', 'color:#5856D6;font-size:13px;');
})();
