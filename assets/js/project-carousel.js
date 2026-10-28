/* Progressive enhancement: without JavaScript, every selected project stays readable. */
(() => {
  'use strict';
  const carousel = document.querySelector('[data-project-carousel]');
  if (!carousel) return;
  const slides = Array.from(carousel.querySelectorAll('[data-project-slide]'));
  const controls = carousel.querySelector('[data-carousel-controls]');
  const previous = carousel.querySelector('[data-carousel-previous]');
  const next = carousel.querySelector('[data-carousel-next]');
  const toggle = carousel.querySelector('[data-carousel-toggle]');
  const count = carousel.querySelector('[data-carousel-count]');
  const status = carousel.querySelector('[data-carousel-status]');
  if (slides.length < 2 || !controls || !previous || !next || !toggle || !count || !status) return;

  const motion = window.matchMedia('(prefers-reduced-motion: reduce)');
  const interval = 6000;
  let index = 0;
  let autoplay = !motion.matches;
  let pointerAutoplay = autoplay;
  let hovered = false;
  let inView = !('IntersectionObserver' in window);
  let timer;

  function schedule() {
    window.clearTimeout(timer);
    timer = undefined;
    if (!autoplay || hovered || !inView || document.hidden) return;
    timer = window.setTimeout(() => show(index + 1), interval);
  }

  function updateToggle() {
    toggle.textContent = autoplay ? 'Pause' : 'Play';
    toggle.setAttribute('aria-label', autoplay ? 'Pause automatic project rotation' : 'Start automatic project rotation');
  }

  function show(nextIndex, announce = false) {
    index = (nextIndex + slides.length) % slides.length;
    slides.forEach((slide, position) => {
      const active = position === index;
      slide.classList.toggle('is-active', active);
      slide.inert = !active;
      slide.setAttribute('aria-hidden', String(!active));
      slide.setAttribute('role', 'group');
      slide.setAttribute('aria-roledescription', 'slide');
      slide.setAttribute('aria-label', `${position + 1} of ${slides.length}`);
    });
    count.textContent = `${index + 1} / ${slides.length}`;
    // Only announce requested changes; automatic rotation must not interrupt a screen reader.
    if (announce) status.textContent = `${index + 1} of ${slides.length}: ${slides[index].querySelector('h3').textContent.trim()}`;
    else status.textContent = '';
    schedule();
  }

  function pause() {
    autoplay = false;
    updateToggle();
    schedule();
  }

  function step(direction) {
    pause();
    show(index + direction, true);
  }

  previous.addEventListener('click', () => step(-1));
  next.addEventListener('click', () => step(1));
  // Pointer focus fires before click; retain the action shown when the press began.
  toggle.addEventListener('pointerdown', () => { pointerAutoplay = autoplay; });
  toggle.addEventListener('click', event => {
    autoplay = event.detail > 0 ? !pointerAutoplay : !autoplay;
    updateToggle();
    schedule();
  });
  controls.addEventListener('keydown', event => {
    if (event.key !== 'ArrowLeft' && event.key !== 'ArrowRight') return;
    event.preventDefault();
    step(event.key === 'ArrowRight' ? 1 : -1);
  });
  // Keyboard focus stops rotation until the visitor explicitly presses Play.
  carousel.addEventListener('focusin', pause);
  carousel.addEventListener('pointerenter', event => {
    if (event.pointerType !== 'mouse' && event.pointerType !== 'pen') return;
    hovered = true;
    schedule();
  });
  carousel.addEventListener('pointerleave', () => {
    hovered = false;
    schedule();
  });
  document.addEventListener('visibilitychange', schedule);
  motion.addEventListener('change', event => { if (event.matches) pause(); });
  if ('IntersectionObserver' in window) {
    const observer = new IntersectionObserver(entries => {
      inView = entries.some(entry => entry.isIntersecting && entry.intersectionRatio >= .25);
      schedule();
    }, { threshold: [0, .25] });
    observer.observe(carousel);
  }

  carousel.dataset.carouselReady = 'true';
  controls.hidden = false;
  updateToggle();
  show(0);
})();
