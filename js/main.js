// frontend/js/main.js — Main Site JS with ALL Animations
// NO showPage() function — each page is a separate HTML file now
// Performance: throttle scroll (16ms), debounce resize (250ms), passive listeners, rAF

(function () {
  'use strict';

  // ── Utility: Throttle ──────────────────────────────────────────
  function throttle(fn, ms) {
    let last = 0;
    return function () {
      const now = Date.now();
      if (now - last >= ms) {
        last = now;
        fn.apply(this, arguments);
      }
    };
  }

  // ── Utility: Debounce ──────────────────────────────────────────
  function debounce(fn, ms) {
    let timer;
    return function () {
      clearTimeout(timer);
      timer = setTimeout(() => fn.apply(this, arguments), ms);
    };
  }

  // ── 1. Scroll Progress ─────────────────────────────────────────
  function initScrollProgress() {
    const bar = document.getElementById('scrollProgress');
    if (!bar) return;

    const update = throttle(() => {
      const scrollTop = document.documentElement.scrollTop;
      const scrollHeight = document.documentElement.scrollHeight - document.documentElement.clientHeight;
      const progress = scrollHeight > 0 ? Math.min(scrollTop / scrollHeight, 1) : 0;
      bar.style.transform = 'scaleX(' + progress + ')';
    }, 16);

    window.addEventListener('scroll', update, { passive: true });
    update();
  }

  // ── 2. Navbar Scroll ──────────────────────────────────────────
  function initNavbarScroll() {
    const navbar = document.getElementById('navbar');
    if (!navbar) return;

    const update = throttle(() => {
      navbar.classList.toggle('scrolled', window.scrollY > 50);
    }, 16);

    window.addEventListener('scroll', update, { passive: true });
    update();
  }

  // ── 3. Mobile Menu ────────────────────────────────────────────
  function initMobileMenu() {
    const btn = document.getElementById('mobileMenuBtn');
    const menu = document.getElementById('mobileMenu');
    if (!btn || !menu) return;

    btn.addEventListener('click', () => {
      menu.classList.toggle('open');
    });

    // Close menu when a link inside is clicked
    menu.querySelectorAll('a').forEach(link => {
      link.addEventListener('click', () => {
        menu.classList.remove('open');
      });
    });
  }

  // ── 4. Scroll Reveal ──────────────────────────────────────────
  function initScrollReveal() {
    const opts = {
      threshold: 0.1,
      rootMargin: '0px 0px -50px 0px'
    };

    const revealObserver = new IntersectionObserver((entries, obs) => {
      entries.forEach(entry => {
        if (entry.isIntersecting) {
          entry.target.classList.add('visible');
          obs.unobserve(entry.target);
        }
      });
    }, opts);

    document.querySelectorAll('.reveal, .reveal-left, .reveal-right, .reveal-scale').forEach(el => {
      revealObserver.observe(el);
    });

    // Stagger parent
    document.querySelectorAll('.stagger-parent').forEach(el => {
      revealObserver.observe(el);
    });
  }

  // ── 5. Counter Animation ──────────────────────────────────────
  function initCounters() {
    const counted = new Set();

    const counterObserver = new IntersectionObserver((entries, obs) => {
      entries.forEach(entry => {
        if (entry.isIntersecting) {
          const el = entry.target;
          if (counted.has(el)) return;
          counted.add(el);
          obs.unobserve(el);

          const target = parseFloat(el.dataset.target);
          const decimals = parseFloat(el.dataset.decimal) || 0;
          const start = performance.now();
          const duration = 2000;

          function tick(now) {
            const elapsed = now - start;
            const progress = Math.min(elapsed / duration, 1);
            // Ease-out cubic
            const eased = 1 - Math.pow(1 - progress, 3);
            const current = target * eased;
            el.textContent = decimals > 0
              ? current.toFixed(decimals)
              : Math.floor(current).toLocaleString('en-US');
            if (progress < 1) requestAnimationFrame(tick);
          }

          requestAnimationFrame(tick);
        }
      });
    }, { threshold: 0.5 });

    document.querySelectorAll('.counter').forEach(el => {
      counterObserver.observe(el);
    });
  }

  // ── 6. Scroll Top Button ──────────────────────────────────────
  function initScrollTop() {
    const btn = document.getElementById('scrollTopBtn');
    if (!btn) return;

    const update = throttle(() => {
      btn.classList.toggle('visible', window.scrollY > 500);
    }, 16);

    window.addEventListener('scroll', update, { passive: true });

    btn.addEventListener('click', () => {
      window.scrollTo({ top: 0, behavior: 'smooth' });
    });
  }

  // ── 7. Hero Particles ─────────────────────────────────────────
  function initHeroParticles() {
    const canvas = document.getElementById('heroCanvas');
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    let w, h;
    const particles = [];
    const PARTICLE_COUNT = 30;
    const CONNECTION_DIST = 120;
    const COLORS = ['#f97316', '#f59e0b', '#3b82f6', '#8b5cf6', '#22c55e'];

    function resize() {
      const parent = canvas.parentElement;
      w = canvas.width = parent.offsetWidth;
      h = canvas.height = parent.offsetHeight;
    }

    resize();
    window.addEventListener('resize', debounce(resize, 250));

    // Create particles
    for (let i = 0; i < PARTICLE_COUNT; i++) {
      particles.push({
        x: Math.random() * w,
        y: Math.random() * h,
        r: Math.random() * 2 + 0.5,
        dx: (Math.random() - 0.5) * 0.4,
        dy: (Math.random() - 0.5) * 0.4,
        o: Math.random() * 0.25 + 0.05,
        c: COLORS[Math.floor(Math.random() * COLORS.length)]
      });
    }

    function draw() {
      ctx.clearRect(0, 0, w, h);

      for (let i = 0; i < particles.length; i++) {
        const a = particles[i];

        // Move
        a.x += a.dx;
        a.y += a.dy;
        if (a.x < 0 || a.x > w) a.dx *= -1;
        if (a.y < 0 || a.y > h) a.dy *= -1;

        // Draw particle
        ctx.beginPath();
        ctx.arc(a.x, a.y, a.r, 0, Math.PI * 2);
        ctx.fillStyle = a.c;
        ctx.globalAlpha = a.o;
        ctx.fill();

        // Draw connections
        for (let j = i + 1; j < particles.length; j++) {
          const b = particles[j];
          const dist = Math.hypot(a.x - b.x, a.y - b.y);
          if (dist < CONNECTION_DIST) {
            ctx.beginPath();
            ctx.moveTo(a.x, a.y);
            ctx.lineTo(b.x, b.y);
            ctx.strokeStyle = a.c;
            ctx.globalAlpha = 0.03 * (1 - dist / CONNECTION_DIST);
            ctx.lineWidth = 0.5;
            ctx.stroke();
          }
        }
      }

      ctx.globalAlpha = 1;
      requestAnimationFrame(draw);
    }

    draw();
  }

  // ── 8. Neural Network Canvas ──────────────────────────────────
  function initNeuralNetwork() {
    const canvas = document.getElementById('neuralCanvas');
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    let w, h;
    let mouseX = -1000, mouseY = -1000;
    const nodes = [];
    const NODE_COUNT = 25;
    const CONNECTION_DIST = 160;
    const MOUSE_ATTRACT_DIST = 200;
    const NODE_COLORS = ['#f97316', '#f59e0b', '#3b82f6', '#8b5cf6', '#22c55e', '#14b8a6'];

    function resize() {
      const parent = canvas.parentElement;
      w = canvas.width = parent.offsetWidth;
      h = canvas.height = parent.offsetHeight;
    }

    resize();
    window.addEventListener('resize', debounce(resize, 250));

    // Create nodes
    for (let i = 0; i < NODE_COUNT; i++) {
      nodes.push({
        x: Math.random() * w,
        y: Math.random() * h,
        baseX: 0,
        baseY: 0,
        r: Math.random() * 4 + 2,
        pulse: Math.random() * Math.PI * 2,
        pulseSpeed: Math.random() * 0.02 + 0.01,
        c: NODE_COLORS[Math.floor(Math.random() * NODE_COLORS.length)]
      });
    }
    nodes.forEach(n => { n.baseX = n.x; n.baseY = n.y; });

    // Mouse tracking
    canvas.addEventListener('mousemove', (e) => {
      const rect = canvas.getBoundingClientRect();
      mouseX = e.clientX - rect.left;
      mouseY = e.clientY - rect.top;
    });
    canvas.addEventListener('mouseleave', () => {
      mouseX = -1000;
      mouseY = -1000;
    });

    function draw() {
      ctx.clearRect(0, 0, w, h);

      for (let i = 0; i < nodes.length; i++) {
        const a = nodes[i];

        // Pulse
        a.pulse += a.pulseSpeed;
        const pulseR = a.r + Math.sin(a.pulse) * 1.5;

        // Mouse attraction
        const dxM = mouseX - a.x;
        const dyM = mouseY - a.y;
        const distM = Math.hypot(dxM, dyM);
        if (distM < MOUSE_ATTRACT_DIST && distM > 1) {
          const force = (MOUSE_ATTRACT_DIST - distM) / MOUSE_ATTRACT_DIST * 0.6;
          a.x += dxM / distM * force;
          a.y += dyM / distM * force;
        } else {
          // Drift back toward base position
          a.x += (a.baseX - a.x) * 0.01;
          a.y += (a.baseY - a.y) * 0.01;
        }

        // Keep within bounds loosely
        if (a.x < -20) a.x = w + 20;
        if (a.x > w + 20) a.x = -20;
        if (a.y < -20) a.y = h + 20;
        if (a.y > h + 20) a.y = -20;

        // Draw connections
        for (let j = i + 1; j < nodes.length; j++) {
          const b = nodes[j];
          const dist = Math.hypot(a.x - b.x, a.y - b.y);
          if (dist < CONNECTION_DIST) {
            ctx.beginPath();
            ctx.moveTo(a.x, a.y);
            ctx.lineTo(b.x, b.y);
            const alpha = 0.08 * (1 - dist / CONNECTION_DIST);
            ctx.strokeStyle = a.c;
            ctx.globalAlpha = alpha;
            ctx.lineWidth = 1;
            ctx.stroke();
          }
        }

        // Draw node glow
        const gradient = ctx.createRadialGradient(a.x, a.y, 0, a.x, a.y, pulseR * 4);
        gradient.addColorStop(0, a.c);
        gradient.addColorStop(1, 'transparent');
        ctx.globalAlpha = 0.15 + Math.sin(a.pulse) * 0.05;
        ctx.beginPath();
        ctx.arc(a.x, a.y, pulseR * 4, 0, Math.PI * 2);
        ctx.fillStyle = gradient;
        ctx.fill();

        // Draw node
        ctx.globalAlpha = 0.7 + Math.sin(a.pulse) * 0.2;
        ctx.beginPath();
        ctx.arc(a.x, a.y, pulseR, 0, Math.PI * 2);
        ctx.fillStyle = a.c;
        ctx.fill();
      }

      ctx.globalAlpha = 1;
      requestAnimationFrame(draw);
    }

    draw();
  }

  // ── 9. 3D Tilt Effect ─────────────────────────────────────────
  function init3DTilt() {
    const cards = document.querySelectorAll('.card-3d');
    if (!cards.length) return;

    cards.forEach(card => {
      // Create glare overlay if not present
      let glare = card.querySelector('.tilt-glare');
      if (!glare) {
        glare = document.createElement('div');
        glare.className = 'tilt-glare';
        glare.style.cssText = 'position:absolute;inset:0;border-radius:inherit;pointer-events:none;background:linear-gradient(135deg,rgba(255,255,255,0.25) 0%,transparent 60%);opacity:0;transition:opacity .3s ease;z-index:10;';
        card.style.position = card.style.position || 'relative';
        card.style.transformStyle = 'preserve-3d';
        card.appendChild(glare);
      }

      card.addEventListener('mousemove', (e) => {
        const rect = card.getBoundingClientRect();
        const x = e.clientX - rect.left;
        const y = e.clientY - rect.top;
        const centerX = rect.width / 2;
        const centerY = rect.height / 2;
        const rotateX = ((y - centerY) / centerY) * -15;
        const rotateY = ((x - centerX) / centerX) * 15;

        card.style.transform = 'perspective(800px) rotateX(' + rotateX + 'deg) rotateY(' + rotateY + 'deg) scale3d(1.02,1.02,1.02)';
        glare.style.opacity = '1';
        glare.style.background = 'radial-gradient(circle at ' + x + 'px ' + y + 'px, rgba(255,255,255,0.25) 0%, transparent 60%)';
      });

      card.addEventListener('mouseleave', () => {
        card.style.transform = 'perspective(800px) rotateX(0deg) rotateY(0deg) scale3d(1,1,1)';
        glare.style.opacity = '0';
      });
    });
  }

  // ── 10. Magnetic Buttons ──────────────────────────────────────
  function initMagneticButtons() {
    const btns = document.querySelectorAll('.magnetic-btn');
    if (!btns.length) return;

    btns.forEach(btn => {
      btn.addEventListener('mousemove', (e) => {
        const rect = btn.getBoundingClientRect();
        const x = e.clientX - rect.left - rect.width / 2;
        const y = e.clientY - rect.top - rect.height / 2;
        const maxDist = 8;
        const moveX = (x / rect.width) * maxDist * 2;
        const moveY = (y / rect.height) * maxDist * 2;
        const clampedX = Math.max(-maxDist, Math.min(maxDist, moveX));
        const clampedY = Math.max(-maxDist, Math.min(maxDist, moveY));
        btn.style.transform = 'translate(' + clampedX + 'px, ' + clampedY + 'px)';
      });

      btn.addEventListener('mouseleave', () => {
        btn.style.transform = 'translate(0, 0)';
      });
    });
  }

  // ── 11. Parallax ──────────────────────────────────────────────
  function initParallax() {
    const layers = document.querySelectorAll('.parallax-layer');
    if (!layers.length) return;

    const update = throttle(() => {
      const scrollY = window.scrollY;
      layers.forEach(layer => {
        const speed = parseFloat(layer.dataset.speed) || 0.5;
        layer.style.transform = 'translateY(' + (scrollY * speed) + 'px)';
      });
    }, 16);

    window.addEventListener('scroll', update, { passive: true });
  }

  // ── 12. Cursor Glow ───────────────────────────────────────────
  function initCursorGlow() {
    const glow = document.getElementById('cursorGlow');
    if (!glow) return;
    // Desktop only
    if (window.matchMedia('(pointer: coarse)').matches) {
      glow.style.display = 'none';
      return;
    }

    document.addEventListener('mousemove', (e) => {
      requestAnimationFrame(() => {
        glow.style.left = e.clientX + 'px';
        glow.style.top = e.clientY + 'px';
      });
    });
  }

  // ── 13. Typing Effect ─────────────────────────────────────────
  function initTypingEffect() {
    const typingEls = document.querySelectorAll('.typing-text');
    if (!typingEls.length) return;

    typingEls.forEach(el => {
      const text = el.dataset.text || el.textContent;
      el.textContent = '';
      el.style.borderRight = '2px solid var(--orange, #f97316)';

      let i = 0;
      const speed = parseInt(el.dataset.speed) || 50;

      function type() {
        if (i < text.length) {
          el.textContent += text.charAt(i);
          i++;
          setTimeout(type, speed);
        } else {
          // Remove cursor after typing
          setTimeout(() => {
            el.style.borderRight = 'none';
          }, 1000);
        }
      }

      // Start typing when visible
      const observer = new IntersectionObserver((entries, obs) => {
        entries.forEach(entry => {
          if (entry.isIntersecting) {
            obs.unobserve(entry.target);
            setTimeout(type, 300);
          }
        });
      }, { threshold: 0.5 });

      observer.observe(el);
    });
  }

  // ── 14. FAQ Accordion ─────────────────────────────────────────
  function initFAQ() {
    const questions = document.querySelectorAll('.faq-question');
    if (!questions.length) return;

    questions.forEach(question => {
      question.addEventListener('click', () => {
        const item = question.closest('.faq-item');
        const answer = item.querySelector('.faq-answer');
        const isActive = item.classList.contains('active');

        // Close all other FAQ items
        document.querySelectorAll('.faq-item.active').forEach(activeItem => {
          if (activeItem !== item) {
            activeItem.classList.remove('active');
            const activeAnswer = activeItem.querySelector('.faq-answer');
            if (activeAnswer) activeAnswer.style.maxHeight = null;
          }
        });

        // Toggle current
        item.classList.toggle('active', !isActive);
        if (!isActive) {
          answer.style.maxHeight = answer.scrollHeight + 'px';
        } else {
          answer.style.maxHeight = null;
        }
      });
    });
  }

  // ── 15. Toast System ──────────────────────────────────────────
  window.showToast = function (msg, type) {
    type = type || 'success';
    const container = document.getElementById('toastContainer');
    if (!container) return;

    const toast = document.createElement('div');
    const iconClass = type === 'success' ? 'fa-check-circle' : 'fa-exclamation-circle';
    const bgClass = type === 'success' ? 'success' : 'error';
    const title = type === 'success' ? 'Success' : 'Error';

    toast.className = 'toast';
    toast.innerHTML =
      '<div class="toast-icon ' + bgClass + '"><i class="fa-solid ' + iconClass + '"></i></div>' +
      '<div class="toast-content"><h4>' + title + '</h4><p>' + msg + '</p></div>' +
      '<button class="toast-close" onclick="this.parentElement.remove()"><i class="fa-solid fa-xmark"></i></button>';

    container.appendChild(toast);
    requestAnimationFrame(() => toast.classList.add('show'));

    setTimeout(() => {
      toast.classList.remove('show');
      setTimeout(() => toast.remove(), 400);
    }, 5000);
  };

  // ── 16. Demo Form (Web3Forms) ─────────────────────────────────
  function initDemoForm() {
    const form = document.getElementById('demoForm');
    if (!form) return;

    form.addEventListener('submit', async function (e) {
      e.preventDefault();

      const nameEl = document.getElementById('userName');
      const phoneEl = document.getElementById('userPhone');
      const emailEl = document.getElementById('userEmail');
      const productEl = document.getElementById('userProduct');
      const messageEl = document.getElementById('userMessage');

      const name = nameEl ? nameEl.value.trim() : '';
      const phone = phoneEl ? phoneEl.value.trim() : '';
      const email = emailEl ? emailEl.value.trim() : '';
      const product = productEl ? productEl.value : '';
      const message = messageEl ? messageEl.value.trim() : '';

      if (!name || !phone || !email || !product) {
        showToast('Please fill all required fields', 'error');
        return;
      }
      if (phone.length < 7) {
        showToast('Please enter a valid phone number', 'error');
        return;
      }

      const btn = document.getElementById('demoSubmitBtn');
      const txt = document.getElementById('submitText');
      const icon = document.getElementById('submitIcon');
      const spinner = document.getElementById('submitSpinner');

      if (btn) btn.disabled = true;
      if (txt) txt.textContent = 'Submitting...';
      if (icon) icon.style.display = 'none';
      if (spinner) spinner.style.display = 'inline';

      try {
        const res = await fetch('https://api.web3forms.com/submit', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json', 'Accept': 'application/json' },
          body: JSON.stringify({
            access_key: 'a69b8ccc-4d21-46cb-841f-89dfbe7dee75',
            name: name,
            phone: phone,
            email: email,
            erp_interest: product,
            message: message || 'No message',
            subject: 'DEMO REQUEST — ' + name + ' wants ' + product,
            from_name: 'AgenticFoxLabs Website'
          })
        });

        const data = await res.json();
        if (data.success) {
          showToast('Thank you ' + name + '! Demo request submitted. We will contact you within 2 hours.', 'success');
          form.reset();
          // GA4 event
          trackGA4Event('demo_form_submit', { form_type: 'demo', product: product });
        } else {
          showToast('Something went wrong. Please WhatsApp us at +91 94522 00700', 'error');
        }
      } catch (err) {
        showToast('Submission error. Please WhatsApp us at +91 94522 00700', 'error');
      } finally {
        if (btn) btn.disabled = false;
        if (txt) txt.textContent = 'Book Demo Call';
        if (icon) icon.style.display = 'inline';
        if (spinner) spinner.style.display = 'none';
      }
    });
  }

  // ── 17. GA4 Event Tracking ────────────────────────────────────
  function trackGA4Event(eventName, params) {
    params = params || {};
    if (typeof gtag === 'function') {
      gtag('event', eventName, params);
    }
    // Fallback: log to console in dev
    if (window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1') {
      console.log('[GA4 Event]', eventName, params);
    }
  }

  function initGA4Tracking() {
    // Track CTA clicks
    document.querySelectorAll('[data-track-cta]').forEach(el => {
      el.addEventListener('click', () => {
        const ctaName = el.dataset.trackCta || el.textContent.trim().substring(0, 50);
        trackGA4Event('cta_clicked', { cta_name: ctaName });
      });
    });

    // Track chat opened
    const chatBtn = document.getElementById('foxChatBtn');
    if (chatBtn) {
      chatBtn.addEventListener('click', () => {
        trackGA4Event('chat_opened', { source: 'floating_button' });
      }, { once: true });
    }

    // Track demo form page view
    if (document.getElementById('demoForm')) {
      trackGA4Event('page_view', { page_type: 'demo_form' });
    }
  }

  // ── 18. PWA ───────────────────────────────────────────────────
  function initPWA() {
    // Register service worker
    if ('serviceWorker' in navigator) {
      window.addEventListener('load', () => {
        navigator.serviceWorker.register('./sw.js').catch(() => {
          // Service worker registration failed silently
        });
      });
    }

    // Handle install prompt
    let deferredPrompt = null;

    window.addEventListener('beforeinstallprompt', (e) => {
      e.preventDefault();
      deferredPrompt = e;

      // Show custom install button if present
      const installBtn = document.getElementById('pwaInstallBtn');
      if (installBtn) {
        installBtn.style.display = 'flex';
        installBtn.addEventListener('click', async () => {
          if (!deferredPrompt) return;
          deferredPrompt.prompt();
          const result = await deferredPrompt.userChoice;
          trackGA4Event('pwa_install', { outcome: result.outcome });
          deferredPrompt = null;
          installBtn.style.display = 'none';
        });
      }
    });

    window.addEventListener('appinstalled', () => {
      deferredPrompt = null;
      const installBtn = document.getElementById('pwaInstallBtn');
      if (installBtn) installBtn.style.display = 'none';
      trackGA4Event('pwa_installed', {});
    });
  }

  // ── setERP Helper ─────────────────────────────────────────────
  // Used by product card buttons to pre-fill the demo form
  window.setERP = function (name) {
    const select = document.getElementById('userProduct');
    if (!select) return;
    setTimeout(() => {
      for (const option of select.options) {
        if (option.text.includes(name) || name.includes(option.text)) {
          select.value = option.value;
          break;
        }
      }
    }, 150);
  };

  // ── Init Everything ───────────────────────────────────────────
  function initAll() {
    initScrollProgress();
    initNavbarScroll();
    initMobileMenu();
    initScrollReveal();
    initCounters();
    initScrollTop();
    initHeroParticles();
    initNeuralNetwork();
    init3DTilt();
    initMagneticButtons();
    initParallax();
    initCursorGlow();
    initTypingEffect();
    initFAQ();
    initDemoForm();
    initGA4Tracking();
    initPWA();
  }

  // Run on DOM ready
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', initAll);
  } else {
    initAll();
  }

})();
