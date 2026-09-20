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

function initializeCaseBrowser() {
  const work = document.querySelector('#work');
  const details = [...document.querySelectorAll('[data-case-detail]')];
  const triggers = [...document.querySelectorAll('[data-case-open]')];
  if (!work || !details.length || !triggers.length) return;

  document.body.classList.add('case-browser-ready');
  const linkedDetail = details.find((detail) => `#${detail.id}` === window.location.hash);
  let activeId = linkedDetail?.id ?? null;

  function renderCase() {
    const active = details.find((detail) => detail.id === activeId);
    work.classList.toggle('case-is-open', Boolean(active));
    details.forEach((detail) => {
      detail.hidden = detail !== active;
    });
    triggers.forEach((trigger) => {
      const selected = active?.id === trigger.dataset.caseOpen;
      const heading = trigger.querySelector('h3').innerText.replace(/\s+/g, ' ').trim();
      const label = trigger.querySelector('[data-case-trigger-label]');
      trigger.setAttribute('role', 'button');
      trigger.tabIndex = 0;
      trigger.setAttribute('aria-expanded', String(selected));
      trigger.setAttribute('aria-controls', trigger.dataset.caseOpen);
      trigger.setAttribute(
        'aria-label',
        `${selected ? 'Hide details' : 'See what happened'}: ${heading}`,
      );
      label.textContent = selected ? 'Hide what happened' : 'See what happened';
    });
    window.dispatchEvent(new Event('resize'));
  }

  function toggleCase(trigger) {
    activeId = activeId === trigger.dataset.caseOpen ? null : trigger.dataset.caseOpen;
    renderCase();
  }

  triggers.forEach((trigger) => {
    trigger.addEventListener('click', () => toggleCase(trigger));
    trigger.addEventListener('keydown', (event) => {
      if (event.key !== 'Enter' && event.key !== ' ') return;
      event.preventDefault();
      toggleCase(trigger);
    });
  });
  renderCase();
}

drawDataFlow();
initializeReadingProgress();
initializeCaseBrowser();
document.querySelector('#year').textContent = String(new Date().getFullYear());
