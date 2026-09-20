const svgNamespace = 'http://www.w3.org/2000/svg';

// Deterministic paths: an illustration of disorder becoming bounded flows.
function drawDataFlow() {
  const group = document.querySelector('#flow-lines');
  if (!group) return;
  for (let index = 0; index < 28; index += 1) {
    const start = 115 + ((index * 67) % 420);
    const end = 165 + index * 12;
    const bend = 60 + ((index * 113) % 510);
    const loop = 50 + ((index * 89) % 530);
    const path = document.createElementNS(svgNamespace, 'path');
    path.setAttribute(
      'd',
      `M 35 ${start} C 200 ${bend}, 475 ${loop}, 295 ${550 - bend / 2} S 190 ${loop}, 400 ${end} S 535 ${end}, 620 ${end} L 910 ${end}`,
    );
    path.setAttribute('class', `flow-path${index % 6 === 0 ? ' highlight' : ''}`);
    path.style.setProperty('--flow-delay', `${index * 18}ms`);
    group.append(path);
    if (index % 4 === 0) addFlowNode(group, 700 + ((index * 29) % 160), end);
  }
}

function addFlowNode(group, x, y) {
  const node = document.createElementNS(svgNamespace, 'circle');
  node.setAttribute('cx', x);
  node.setAttribute('cy', y);
  node.setAttribute('r', '2.6');
  node.setAttribute('class', 'flow-node');
  group.append(node);
}

function initializeReadingProgress() {
  const indicator = document.querySelector('.reading-progress');
  let framePending = false;
  function update() {
    const travel = document.documentElement.scrollHeight - window.innerHeight;
    const progress = travel > 0 ? Math.min(1, Math.max(0, window.scrollY / travel)) : 0;
    indicator.style.transform = `scaleX(${progress})`;
    framePending = false;
  }
  function schedule() {
    if (framePending) return;
    framePending = true;
    window.requestAnimationFrame(update);
  }
  window.addEventListener('scroll', schedule, { passive: true });
  window.addEventListener('resize', schedule);
  document
    .querySelectorAll('details')
    .forEach((details) => details.addEventListener('toggle', schedule));
  update();
}

function initializeBrandDock() {
  const slot = document.querySelector('.hero-brand');
  const brand = slot?.querySelector('.brand-link');
  const header = document.querySelector('.site-header');
  if (!brand || !header) return;

  // Move the original node, never clone the owner's mark. The empty slot keeps
  // the hero stable, and the header supplies the correct stacking/tab order.
  header.prepend(brand);
  brand.classList.add('is-floating');
  const reducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)');
  let geometry;
  let framePending = false;

  function update() {
    const { left, top, width, targetLeft, targetTop, targetWidth, distance } = geometry;
    const scroll = Math.max(0, window.scrollY);
    const progress = Math.min(1, scroll / distance);
    const amount = reducedMotion.matches ? Number(progress === 1) : progress;
    const scale = 1 + (targetWidth / width - 1) * amount;
    const x = left + (targetLeft - left) * amount;
    const y =
      reducedMotion.matches && progress < 1 ? top - scroll : top + (targetTop - top) * progress;
    brand.style.transform = `translate3d(${x}px, ${y}px, 0) scale(${scale})`;
    framePending = false;
  }

  function measure() {
    const origin = slot.getBoundingClientRect();
    const nav = header.querySelector('nav').getBoundingClientRect();
    const targetLeft = parseFloat(getComputedStyle(header).paddingLeft);
    const targetWidth = Math.min(window.innerWidth <= 760 ? 140 : 180, nav.left - targetLeft - 24);
    const targetTop = (header.offsetHeight - (targetWidth * 810) / 3362) / 2;
    const top = origin.top + window.scrollY;
    geometry = {
      left: origin.left,
      top,
      width: origin.width,
      targetLeft,
      targetTop,
      targetWidth,
      distance: Math.max(1, top - targetTop),
    };
    brand.style.width = `${origin.width}px`;
    update();
  }

  function schedule() {
    if (framePending) return;
    framePending = true;
    window.requestAnimationFrame(update);
  }

  measure();
  window.addEventListener('scroll', schedule, { passive: true });
  window.addEventListener('resize', measure);
  window.addEventListener('pageshow', measure);
  reducedMotion.addEventListener('change', schedule);
  const observer = new ResizeObserver(measure);
  observer.observe(slot);
  observer.observe(header);
  document.fonts.ready.then(measure);
}

drawDataFlow();
initializeReadingProgress();
initializeBrandDock();
document.querySelector('#year').textContent = String(new Date().getFullYear());
