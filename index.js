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
    id: 'web', title: 'Développement web', icon: 'fas fa-code', color: '#0056b3',
    tech: ['HTML', 'CSS', 'PHP', 'ASP.NET', 'Blazor'], projects: ['copro']
  },
  {
    id: 'bdd', title: 'Base de données', icon: 'fas fa-database', color: '#0056b3',
    tech: ['SQL', 'PL/pgSQL', 'PostgreSQL', 'Entity Framework'], projects: ['copro']
  },
  {
    id: 'prog', title: 'Programmation', icon: 'fas fa-terminal', color: '#0056b3',
    tech: ['C', 'C++', 'Python', 'Bash', 'Kotlin'], projects: ['copro']
  },
  {
    id: 'app', title: 'Développement applicatif', icon: 'fas fa-layer-group', color: '#0056b3',
    tech: ['C#', '.NET MAUI', 'XAML'], projects: ['memory']
  },
  {
    id: 'tools', title: 'Outils', icon: 'fas fa-toolbox', color: '#0056b3',
    tech: ['Git', 'SSH', 'x2go'], projects: ['copro', 'memory']
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
      ? `role="button" tabindex="0" aria-label="${skill.title} : voir ${plural ? 'les projets associés' : 'le projet associé'}"`
      : `aria-label="${skill.title} : projet à venir"`;

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
      subtitle: "Écoute et composition",
      icon: "fas fa-music",
      mainContent: "La musique fait partie de mon quotidien. J'écoute beaucoup de rap, de latino, de RnB et de pop, et je compose mes propres morceaux sur GarageBand. C'est autant une source d'inspiration qu'un moyen de me détendre.",
      details: [
          { label: "Genres écoutés", value: "Rap, latino, RnB, pop" },
          { label: "Composition", value: "GarageBand" },
          { label: "Pratique", value: "Régulière, en autodidacte" }
      ]
  },
  musculation: {
      title: "Musculation",
      subtitle: "Cinq ans de pratique",
      icon: "fas fa-dumbbell",
      mainContent: "Je pratique la musculation en salle depuis cinq ans. J'y viens par goût de la rigueur, de la régularité et du dépassement de soi, des valeurs que je retrouve aussi dans mon travail.",
      details: [
          { label: "Depuis", value: "5 ans" },
          { label: "Lieu", value: "En salle" },
          { label: "Ce que j'y trouve", value: "Rigueur et régularité" }
      ]
  },
  football: {
      title: "Football",
      subtitle: "Sur le terrain et devant l'écran",
      icon: "fas fa-futbol",
      mainContent: "Je suis passionné de football. J'aime suivre les matchs au stade comme à la télévision, et échanger avec d'autres passionnés sur les forums de supporters.",
      details: [
          { label: "Suivi", value: "Stade et télévision" },
          { label: "Communauté", value: "Forums de supporters" }
      ]
  },
  rugby: {
      title: "Rugby",
      subtitle: "Supporter de l'ASM",
      icon: "fas fa-football",
      mainContent: "Supporter de l'ASM Clermont Auvergne, je suis souvent présent au stade Marcel Michelin pour vivre les matchs et leur ambiance.",
      details: [
          { label: "Club", value: "ASM Clermont Auvergne" },
          { label: "Stade", value: "Marcel Michelin" }
      ]
  }
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

      const detailsHTML = (data.details || []).map(d => `
          <li class="pm-detail">
              <span class="pm-detail-label">${d.label}</span>
              <span class="pm-detail-value">${d.value}</span>
          </li>
      `).join('');

      popupContent.innerHTML = `
          <div class="passion-modal">
              <span class="pm-icon" aria-hidden="true"><i class="${data.icon}"></i></span>
              <h2 class="pm-title" id="passionPopupTitle">${data.title}</h2>
              <p class="pm-subtitle">${data.subtitle}</p>
              <p class="pm-intro">${data.mainContent}</p>
              ${detailsHTML ? `<ul class="pm-details">${detailsHTML}</ul>` : ''}
          </div>
      `;

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
  copro: {
      title: "Copro",
      subtitle: "Application web et mobile · Projet universitaire (équipe de 8)",
      icon: "fas fa-building",
      images: [],
      description: `Développée à huit dans le cadre d'un projet universitaire, l'application Copro permet à des copropriétaires d'auto-gérer leur copropriété, sans passer par un syndic.

Elle réunit une messagerie entre copropriétaires, la gestion des documents administratifs et un emploi du temps regroupant tous les évènements importants (assemblées, interventions, etc.).

Le projet comporte une partie web et une partie mobile. J'ai travaillé au sein de l'équipe sur la conception et le développement, en m'appuyant sur l'écosystème .NET et une base de données PostgreSQL.`,
      technologies: [
          { name: "ASP.NET", icon: "fas fa-globe" },
          { name: "Blazor", icon: "fas fa-code" },
          { name: "C#", icon: "fas fa-hashtag" },
          { name: "Entity Framework", icon: "fas fa-diagram-project" },
          { name: "PostgreSQL", icon: "fas fa-database" },
          { name: "Kotlin", icon: "fas fa-mobile-screen" }
      ],
      skills: [
          { name: "Travail en équipe (8)", icon: "fas fa-users" },
          { name: "Développement web & mobile", icon: "fas fa-layer-group" },
          { name: "Gestion de projet", icon: "fas fa-diagram-project" }
      ]
  },
  memory: {
    title: "Memory",
    subtitle: "Jeu de mémoire, application de bureau .NET MAUI (équipe de 3)",
    icon: "fas fa-brain",
    downloads: [
        { name: "macOS", icon: "fab fa-apple", href: "https://github.com/alexandre-tc/portfolio/releases/download/memory-v1.0/Memory-macOS.zip" },
        { name: "Windows", icon: "fab fa-windows", href: "https://github.com/alexandre-tc/portfolio/releases/download/memory-v1.0/Memory-Windows.zip" }
    ],
    images: [
        { src: "images/projets/memory-menu.png", alt: "Menu principal de Memory", caption: "Le menu principal et les statistiques de jeu." },
        { src: "images/projets/memory-partie.png", alt: "Une partie de Memory en cours", caption: "Une partie à deux joueurs en cours." }
    ],
    description: `Memory est un jeu de mémoire numérique simple et interactif : retrouvez les paires de cartes le plus rapidement possible et obtenez le meilleur score.

L'application propose un mode joueur contre joueur, un mode contre une IA, un classement des meilleurs scores ainsi qu'une page de règles. Plusieurs niveaux de difficulté et thèmes de cartes sont disponibles.

Développée à trois en C# avec .NET MAUI, elle est multiplateforme : une version macOS et une version Windows sont proposées au téléchargement.`,
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
      
      // Galerie d'images (uniquement si le projet en possède)
      const galleryHTML = (data.images && data.images.length)
          ? '<div class="project-popup-gallery">' + data.images.map(image => `
              <div class="project-popup-image-container">
                  <img src="${image.src}" alt="${image.alt}" class="project-popup-image" loading="lazy" decoding="async">
                  <div class="project-popup-caption">${image.caption}</div>
              </div>`).join('') + '</div>'
          : '';

      // Construire le contenu du pop-up
      let contentHTML = `
          <div class="project-popup-header">
              <h2 class="project-popup-title">${data.title}</h2>
              <p class="project-popup-subtitle">${data.subtitle}</p>
          </div>
          ${galleryHTML}
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
              contentHTML += `
                  <a href="${dl.href}" class="download-btn" rel="noopener" aria-label="Télécharger ${data.title} pour ${dl.name}">
                      <i class="${dl.icon}" aria-hidden="true"></i>
                      <span>${dl.name}</span>
                  </a>
              `;
          });
          contentHTML += `
                      <button type="button" class="download-help-btn download-help-btn--wide" onclick="openInstallGuide()"
                          aria-label="Comment installer l'application ?">
                          <i class="fas fa-question" aria-hidden="true"></i>
                          <span>Comment installer ?</span>
                      </button>
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
// Guide d'installation de Memory (pop-up ?, tutos Windows + macOS)
// ===========================================================
const installGuide = {
  windows: {
    label: 'Windows',
    icon: 'fab fa-windows',
    steps: [
      { title: "Télécharge le fichier", text: "Clique sur le bouton « Windows ». Le fichier Memory-Windows.zip se télécharge (tu le retrouves dans le dossier « Téléchargements »)." },
      { title: "Ouvre le dossier Téléchargements", text: "Ouvre l'Explorateur de fichiers (l'icône dossier jaune dans la barre des tâches en bas), puis clique sur « Téléchargements » dans la colonne de gauche." },
      { title: "Décompresse le dossier", text: "Fais un clic droit sur Memory-Windows.zip, choisis « Extraire tout… », puis clique sur « Extraire ». Un nouveau dossier s'ouvre avec les fichiers de l'application." },
      { title: "Lance l'application", text: "Dans ce dossier, repère le fichier nommé « Memory » (type « Application ») et double-clique dessus." },
      { title: "Autorise l'application", text: "Windows peut afficher un écran bleu « Windows a protégé votre ordinateur ». C'est normal pour une application indépendante, il n'y a aucun risque.", note: "Clique sur « Informations complémentaires », puis sur le bouton « Exécuter quand même »." },
      { title: "C'est prêt, bon jeu !", text: "Memory se lance. Les prochaines fois, il suffira de rouvrir le dossier extrait et de double-cliquer sur « Memory »." }
    ]
  },
  macos: {
    label: 'macOS',
    icon: 'fab fa-apple',
    steps: [
      { title: "Télécharge le fichier", text: "Clique sur le bouton « macOS ». Le fichier Memory-macOS.zip se télécharge (tu le vois en haut à droite de Safari, ou dans le dossier « Téléchargements »)." },
      { title: "Ouvre le dossier Téléchargements", text: "Ouvre le Finder (l'icône sourire bleu dans le Dock), puis clique sur « Téléchargements » dans la colonne de gauche." },
      { title: "Décompresse le fichier", text: "Double-clique sur Memory-macOS.zip. Une application nommée « Memory » apparaît juste à côté." },
      { title: "Range l'application (facultatif)", text: "Tu peux glisser « Memory » dans le dossier « Applications » pour la retrouver plus facilement ensuite." },
      { title: "Ouvre l'app la première fois", text: "Fais un clic droit sur « Memory » (ou maintiens la touche Contrôle et clique), puis choisis « Ouvrir » dans le menu qui apparaît." },
      { title: "Confirme l'ouverture", text: "macOS affiche un avertissement car l'app vient d'un développeur indépendant. Clique sur « Ouvrir » dans la fenêtre pour confirmer.", note: "Si le bouton « Ouvrir » n'apparaît pas : va dans le menu Pomme () → Réglages Système → Confidentialité et sécurité, descends tout en bas, clique sur « Ouvrir quand même », puis relance Memory." },
      { title: "C'est prêt, bon jeu !", text: "Memory se lance. Les prochaines fois, un simple double-clic sur l'application suffira." }
    ]
  }
};

function detectOS() {
  const info = ((navigator.userAgent || '') + ' ' + (navigator.platform || '')).toLowerCase();
  if (/mac|iphone|ipad|ipod/.test(info)) return 'macos';
  return 'windows';
}

function renderInstallGuide(os) {
  const content = document.getElementById('installPopupContent');
  if (!content) return;
  const order = ['windows', 'macos'];

  const tabs = order.map(k =>
    `<button type="button" class="ig-tab${k === os ? ' active' : ''}" data-os="${k}">
       <i class="${installGuide[k].icon}" aria-hidden="true"></i> ${installGuide[k].label}
     </button>`
  ).join('');

  const panels = order.map(k => {
    const steps = installGuide[k].steps.map((s, i) => `
      <li class="ig-step">
        <span class="ig-step-num">${i + 1}</span>
        <div class="ig-step-body">
          <span class="ig-step-title">${s.title}</span>
          <span class="ig-step-text">${s.text}</span>
          ${s.note ? `<span class="ig-step-note"><i class="fas fa-lightbulb" aria-hidden="true"></i> ${s.note}</span>` : ''}
        </div>
      </li>`).join('');
    return `<div class="ig-panel${k === os ? ' active' : ''}" data-os="${k}"><ol class="ig-steps">${steps}</ol></div>`;
  }).join('');

  content.innerHTML = `
    <div class="install-guide">
      <header class="ig-hero">
        <span class="ig-hero-icon"><i class="fas fa-question" aria-hidden="true"></i></span>
        <div class="ig-hero-text">
          <h2 class="ig-title" id="installPopupTitle">Installer Memory</h2>
          <p class="ig-subtitle">Guide pour télécharger mon app !</p>
        </div>
      </header>
      <div class="ig-tabs" role="tablist">${tabs}</div>
      ${panels}
    </div>
  `;

  content.querySelectorAll('.ig-tab').forEach(tab => {
    tab.addEventListener('click', () => setInstallTab(tab.dataset.os));
  });
}

function setInstallTab(os) {
  const content = document.getElementById('installPopupContent');
  if (!content) return;
  content.querySelectorAll('.ig-tab').forEach(t => t.classList.toggle('active', t.dataset.os === os));
  content.querySelectorAll('.ig-panel').forEach(p => p.classList.toggle('active', p.dataset.os === os));
  const container = document.getElementById('installPopupContainer');
  if (container) container.scrollTop = 0;
}

let lastFocusedInstall = null;

function openInstallGuide(os) {
  const overlay = document.getElementById('installPopupOverlay');
  if (!overlay) return;
  renderInstallGuide(os || detectOS());
  lastFocusedInstall = document.activeElement;
  overlay.classList.add('active');
  document.body.style.overflow = 'hidden';
  const closeBtn = document.getElementById('installPopupCloseBtn');
  if (closeBtn) closeBtn.focus();
}

function closeInstallGuide() {
  const overlay = document.getElementById('installPopupOverlay');
  if (!overlay) return;
  overlay.classList.remove('active');
  const stillOpen = ['projectPopupOverlay', 'passionPopupOverlay', 'skillPopupOverlay']
    .some(id => document.getElementById(id)?.classList.contains('active'));
  document.body.style.overflow = stillOpen ? 'hidden' : 'auto';
  if (lastFocusedInstall && typeof lastFocusedInstall.focus === 'function') lastFocusedInstall.focus();
}

window.openInstallGuide = openInstallGuide;

document.addEventListener('DOMContentLoaded', function () {
  const overlay = document.getElementById('installPopupOverlay');
  const closeBtn = document.getElementById('installPopupCloseBtn');
  if (!overlay) return;
  if (closeBtn) closeBtn.addEventListener('click', closeInstallGuide);
  overlay.addEventListener('click', (e) => { if (e.target === overlay) closeInstallGuide(); });
  document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape' && overlay.classList.contains('active')) closeInstallGuide();
  });
});
