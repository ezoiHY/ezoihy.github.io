/* 404 page: a planar three-link arm solves inverse kinematics (FABRIK) toward the pointer.
 * Decorative and self-contained; reduced motion removes idle drift and smoothing. */
(() => {
  'use strict';
  const figure = document.querySelector('[data-reach]');
  const svg = figure?.querySelector('svg');
  if (!svg) return;
  const reducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)');
  const base = { x: 300, y: 206 };
  const lengths = [84, 68, 48];
  const reach = lengths.reduce((sum, length) => sum + length, 0);
  const floor = 200;
  const links = [...svg.querySelectorAll('[data-reach-link]')];
  const joints = [...svg.querySelectorAll('[data-reach-joint]')];
  const gripper = svg.querySelector('[data-reach-gripper]');
  const fingers = [...svg.querySelectorAll('[data-reach-finger]')];
  const target = svg.querySelector('[data-reach-target]');
  const anglesText = figure.querySelector('[data-reach-angles]');
  const statusText = figure.querySelector('[data-reach-status]');
  let points = [{ ...base }, { x: 300, y: 122 }, { x: 352, y: 80 }, { x: 398, y: 92 }];
  let goal = { x: 430, y: 70 };
  let aim = { ...goal };
  let lastInput = 0;
  let grasp = 0;
  let frame = 0;

  const distance = (a, b) => Math.hypot(a.x - b.x, a.y - b.y);
  function solve(to) {
    const next = points.map(point => ({ ...point }));
    if (distance(base, to) >= reach) {
      // Out of reach: the arm straightens toward the target.
      for (let i = 0; i < lengths.length; i++) {
        const span = distance(next[i], to) || 1;
        next[i + 1] = { x: next[i].x + (to.x - next[i].x) / span * lengths[i], y: next[i].y + (to.y - next[i].y) / span * lengths[i] };
      }
      return next;
    }
    for (let iteration = 0; iteration < 14; iteration++) {
      next[3] = { ...to };
      for (let i = 2; i >= 0; i--) {
        const span = distance(next[i], next[i + 1]) || 1;
        next[i] = { x: next[i + 1].x + (next[i].x - next[i + 1].x) / span * lengths[i], y: next[i + 1].y + (next[i].y - next[i + 1].y) / span * lengths[i] };
      }
      next[0] = { ...base };
      for (let i = 0; i < 3; i++) {
        const span = distance(next[i], next[i + 1]) || 1;
        next[i + 1] = { x: next[i].x + (next[i + 1].x - next[i].x) / span * lengths[i], y: next[i].y + (next[i + 1].y - next[i].y) / span * lengths[i] };
      }
      if (distance(next[3], to) < .5) break;
    }
    return next;
  }

  const degrees = radians => Math.round(radians * 180 / Math.PI);
  const wrap = angle => Math.atan2(Math.sin(angle), Math.cos(angle));
  // The solver places the grasp point (between the jaws) on the target; the last
  // link stops where the gripper begins.
  const jaw = 14;
  function draw() {
    links.forEach((link, i) => {
      const end = { ...points[i + 1] };
      if (i === links.length - 1) {
        const span = distance(points[i], points[i + 1]) || 1;
        end.x -= (points[i + 1].x - points[i].x) / span * jaw;
        end.y -= (points[i + 1].y - points[i].y) / span * jaw;
      }
      link.setAttribute('x1', points[i].x.toFixed(1));
      link.setAttribute('y1', points[i].y.toFixed(1));
      link.setAttribute('x2', end.x.toFixed(1));
      link.setAttribute('y2', end.y.toFixed(1));
    });
    joints.forEach((joint, i) => {
      joint.setAttribute('cx', points[i].x.toFixed(1));
      joint.setAttribute('cy', points[i].y.toFixed(1));
    });
    const headings = links.map((_, i) => Math.atan2(points[i + 1].y - points[i].y, points[i + 1].x - points[i].x));
    const tip = points[3];
    gripper.setAttribute('transform', `translate(${tip.x.toFixed(1)} ${tip.y.toFixed(1)}) rotate(${(headings[2] * 180 / Math.PI).toFixed(1)}) translate(${-jaw} 0)`);
    const opening = 7 - grasp * 5;
    fingers[0].setAttribute('d', `M0 0 L14 ${-opening} L22 ${-opening + grasp * 2}`);
    fingers[1].setAttribute('d', `M0 0 L14 ${opening} L22 ${opening - grasp * 2}`);
    target.setAttribute('transform', `translate(${goal.x.toFixed(1)} ${goal.y.toFixed(1)})`);
    const angles = [-headings[0], -wrap(headings[1] - headings[0]), -wrap(headings[2] - headings[1])].map(degrees);
    anglesText.textContent = angles.map((angle, i) => `J${i + 1} ${String(angle).padStart(4, ' ')}°`).join('  ');
    const reachable = distance(base, goal) < reach - 1;
    figure.classList.toggle('is-out-of-reach', !reachable);
    statusText.textContent = reachable ? (grasp > .5 ? 'Grasped. The page is still missing.' : 'Target within reach') : 'Out of reach, like this page';
  }

  function step(time) {
    frame = 0;
    const idle = !reducedMotion.matches && time - lastInput > 2600;
    if (idle) {
      // Without input the target drifts slowly along a figure eight.
      const t = time / 1000;
      goal = { x: 300 + Math.sin(t * .42) * 205, y: 96 + Math.sin(t * .84) * 46 };
    }
    const follow = reducedMotion.matches ? 1 : .2;
    aim = { x: aim.x + (goal.x - aim.x) * follow, y: aim.y + (goal.y - aim.y) * follow };
    points = solve(aim);
    grasp += ((distance(points[3], goal) < 3 && distance(base, goal) < reach - 1 && !idle ? 1 : 0) - grasp) * (reducedMotion.matches ? 1 : .18);
    draw();
    const settled = distance(aim, goal) < .2 && Math.abs(grasp - Math.round(grasp)) < .01;
    if ((idle || !settled) && !document.hidden && onScreen) frame = requestAnimationFrame(step);
    else if (settled && !idle) scheduleIdle();
  }
  const wake = () => { if (!frame && onScreen && !document.hidden) frame = requestAnimationFrame(step); };
  // Once the arm settles, the idle drift starts after a quiet spell without input.
  let idleTimer = 0;
  function scheduleIdle() {
    clearTimeout(idleTimer);
    if (reducedMotion.matches) return;
    idleTimer = setTimeout(wake, Math.max(0, 2650 - (performance.now() - lastInput)));
  }
  // Nothing animates while the stage is scrolled away.
  let onScreen = true;
  if ('IntersectionObserver' in window) {
    new IntersectionObserver(entries => {
      onScreen = entries[0].isIntersecting;
      if (onScreen) wake();
    }).observe(svg);
  }

  function pointerTarget(event) {
    const matrix = svg.getScreenCTM();
    if (!matrix) return;
    const point = new DOMPoint(event.clientX, event.clientY).matrixTransform(matrix.inverse());
    goal = { x: Math.min(585, Math.max(15, point.x)), y: Math.min(floor, Math.max(8, point.y)) };
    lastInput = performance.now();
    wake();
  }
  window.addEventListener('pointermove', pointerTarget, { passive: true });
  svg.addEventListener('pointerdown', pointerTarget);
  document.addEventListener('visibilitychange', () => { if (!document.hidden) wake(); });
  reducedMotion.addEventListener('change', wake);
  points = solve(aim);
  draw();
  figure.classList.add('is-ready');
  wake();
})();
