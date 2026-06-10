/**
 * Xám Pet Shop – Shared Animation Script
 * Include this after DOM is ready on every page.
 * Usage: <script src="../js/animations.js"></script>
 */
(function () {
  // ── Scroll Reveal ──────────────────────────────────────────────────
  function initScrollReveal() {
    const els = document.querySelectorAll(
      '.reveal, .reveal-left, .reveal-right, .reveal-scale'
    );
    if (!els.length) return;
    const io = new IntersectionObserver(
      (entries) => {
        entries.forEach((e) => {
          if (e.isIntersecting) {
            e.target.classList.add('visible');
            io.unobserve(e.target);
          }
        });
      },
      { threshold: 0.01 }
    );
    els.forEach((el) => io.observe(el));
  }

  // ── Navbar scroll effect ───────────────────────────────────────────
  function initNavbarScroll() {
    const header = document.querySelector('header');
    if (!header) return;
    const onScroll = () => {
      header.classList.toggle('scrolled', window.scrollY > 40);
    };
    window.addEventListener('scroll', onScroll, { passive: true });
    onScroll();
  }

  // ── Ripple on buttons ──────────────────────────────────────────────
  function initRipple() {
    document.querySelectorAll('button, a.btn-ripple, .btn-ripple').forEach((btn) => {
      btn.classList.add('btn-ripple');
    });
  }

  // ── Page entrance fade ─────────────────────────────────────────────
  function initPageEntrance() {
    const main = document.querySelector('main');
    if (main) main.classList.add('page-enter');
  }

  // ── Card hover class auto-attach ──────────────────────────────────
  function initCardHover() {
    document.querySelectorAll(
      '.product-card, .cat-card, .order-card, .stat-card'
    ).forEach((c) => c.classList.add('card-hover'));
  }

  // ── Stagger children of grid/list ─────────────────────────────────
  function initStagger() {
    document.querySelectorAll('[data-stagger]').forEach((parent) => {
      Array.from(parent.children).forEach((child, i) => {
        child.classList.add('reveal');
        child.classList.add(`delay-${Math.min(i + 1, 6)}`);
      });
    });
  }

  // ── 3D tilt-on-hover for .tilt-card elements ───────────────────────
  const TILT_MAX_DEG = 7;
  function handleTiltMove(e) {
    const card = e.currentTarget;
    const rect = card.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;
    const cx = rect.width / 2;
    const cy = rect.height / 2;
    const rotateX = ((cy - y) / cy) * TILT_MAX_DEG;
    const rotateY = ((x - cx) / cx) * TILT_MAX_DEG;
    card.style.transform = `perspective(900px) rotateX(${rotateX.toFixed(2)}deg) rotateY(${rotateY.toFixed(2)}deg) translateY(-6px)`;
  }
  function handleTiltLeave(e) {
    e.currentTarget.style.transform = '';
  }
  function initTilt(root = document) {
    const reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    const isCoarsePointer = window.matchMedia('(pointer: coarse)').matches;
    if (reduceMotion || isCoarsePointer) return;
    root.querySelectorAll('.tilt-card').forEach((card) => {
      if (card.dataset.tiltBound) return;
      card.dataset.tiltBound = 'true';
      card.addEventListener('mousemove', handleTiltMove);
      card.addEventListener('mouseleave', handleTiltLeave);
    });
  }

  // ── Parallax scroll for [data-parallax] elements ───────────────────
  function initParallax() {
    const els = document.querySelectorAll('[data-parallax]');
    if (!els.length) return;
    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) return;

    let ticking = false;
    function update() {
      const scrollY = window.scrollY;
      els.forEach((el) => {
        const speed = parseFloat(el.dataset.parallax) || 0.15;
        const offset = el.closest('section')?.offsetTop ?? 0;
        const delta = (scrollY - offset) * speed;
        el.style.transform = `translate3d(0, ${delta.toFixed(2)}px, 0)`;
      });
      ticking = false;
    }
    window.addEventListener(
      'scroll',
      () => {
        if (!ticking) {
          requestAnimationFrame(update);
          ticking = true;
        }
      },
      { passive: true }
    );
    update();
  }

  // ── Init all ──────────────────────────────────────────────────────
  function init() {
    initStagger();
    initScrollReveal();
    initNavbarScroll();
    initPageEntrance();
    initCardHover();
    initTilt();
    initParallax();
  }

  // ── Expose global interface ───────────────────────────────────────
  window.XamAnimations = {
    initScrollReveal,
    initNavbarScroll,
    initRipple,
    initPageEntrance,
    initCardHover,
    initStagger,
    initTilt,
    initParallax,
    init
  };

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }
})();
