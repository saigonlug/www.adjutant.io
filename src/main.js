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

function initializePageLayout() {
  const root = document.documentElement;
  const header = document.querySelector('.site-header');
  const work = document.querySelector('#work');
  const browser = work?.querySelector('.case-browser');
  if (!header) return;
  let framePending = false;

  function update() {
    root.style.setProperty('--site-header-height', `${header.getBoundingClientRect().height}px`);
    if (work && browser) {
      const bannerHeight = browser.getBoundingClientRect().top - work.getBoundingClientRect().top;
      root.style.setProperty('--case-banner-height', `${bannerHeight}px`);
    }
    framePending = false;
  }

  function schedule() {
    if (framePending) return;
    framePending = true;
    requestAnimationFrame(update);
  }

  if ('ResizeObserver' in window) {
    const observer = new ResizeObserver(schedule);
    [header, work?.querySelector('.section-marker'), work?.querySelector('.case-introduction')]
      .filter(Boolean)
      .forEach((element) => observer.observe(element));
  }
  window.addEventListener('resize', schedule);
  document.fonts?.ready.then(schedule);
  update();
}

function initializeCaseBrowser() {
  const work = document.querySelector('#work');
  const browser = work?.querySelector('.case-browser');
  const tabList = work?.querySelector('.case-tabs');
  const details = [...document.querySelectorAll('[data-case-detail]')];
  const tabs = [...document.querySelectorAll('[data-case-open]')];
  if (!browser || !tabList || !details.length || !tabs.length) return;

  document.body.classList.add('case-browser-ready');
  tabList.setAttribute('role', 'tablist');
  const mobile = window.matchMedia('(max-width: 760px)');
  const linkedDetail = details.find((detail) => `#${detail.id}` === location.hash);
  let activeId = linkedDetail?.id ?? details[0].id;

  function updateOrientation() {
    tabList.setAttribute('aria-orientation', mobile.matches ? 'horizontal' : 'vertical');
  }

  function renderCase() {
    details.forEach((detail) => {
      detail.hidden = detail.id !== activeId;
      detail.setAttribute('role', 'tabpanel');
      detail.setAttribute('aria-labelledby', tabs.find((tab) => tab.dataset.caseOpen === detail.id).id);
    });
    tabs.forEach((tab) => {
      const selected = tab.dataset.caseOpen === activeId;
      tab.setAttribute('role', 'tab');
      tab.setAttribute('aria-selected', String(selected));
      tab.setAttribute('aria-controls', tab.dataset.caseOpen);
      tab.tabIndex = selected ? 0 : -1;
    });
    window.dispatchEvent(new Event('resize'));
  }

  function revealActiveCase(focusHeading = false) {
    const active = details.find((detail) => detail.id === activeId);
    if (!active) return;
    requestAnimationFrame(() => {
      const reducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
      const fullScreenCases = window.matchMedia('(min-width: 1200px) and (min-height: 850px)').matches;
      const target = fullScreenCases ? work : browser;
      target.scrollIntoView({ behavior: reducedMotion ? 'instant' : 'smooth', block: 'start' });
      if (focusHeading) active.querySelector('h3')?.focus({ preventScroll: true });
    });
  }

  function selectCase(tab) {
    if (activeId === tab.dataset.caseOpen) return;
    activeId = tab.dataset.caseOpen;
    renderCase();
    history.replaceState(null, '', `#${activeId}`);
    revealActiveCase();
  }

  tabs.forEach((tab, index) => {
    tab.addEventListener('click', (event) => {
      event.preventDefault();
      selectCase(tab);
    });
    tab.addEventListener('keydown', (event) => {
      const previous = mobile.matches ? 'ArrowLeft' : 'ArrowUp';
      const next = mobile.matches ? 'ArrowRight' : 'ArrowDown';
      let target;
      if (event.key === previous) target = tabs[(index + tabs.length - 1) % tabs.length];
      if (event.key === next) target = tabs[(index + 1) % tabs.length];
      if (event.key === 'Home') target = tabs[0];
      if (event.key === 'End') target = tabs[tabs.length - 1];
      if (target) {
        event.preventDefault();
        target.focus({ preventScroll: true });
        selectCase(target);
      } else if (event.key === ' ') {
        event.preventDefault();
        selectCase(tab);
      }
    });
  });

  window.addEventListener('hashchange', () => {
    const linked = details.find((detail) => `#${detail.id}` === location.hash);
    if (!linked) return;
    activeId = linked.id;
    renderCase();
    revealActiveCase(true);
  });
  mobile.addEventListener('change', updateOrientation);
  updateOrientation();
  renderCase();
  if (linkedDetail) revealActiveCase();
}

drawDataFlow();
initializeReadingProgress();
initializeCaseBrowser();
initializePageLayout();
document.querySelector('#year').textContent = String(new Date().getFullYear());
