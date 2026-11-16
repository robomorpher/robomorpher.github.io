'use strict';
const $ = (s, root = document) => root.querySelector(s);
const $$ = (s, root = document) => [...root.querySelectorAll(s)];
const live = $('#live-status');
const header = $('#header');
const nav = $('#nav');
const menu = $('#menu-toggle');
function updateHeader() { header.classList.toggle('sticky', window.scrollY > 60); }
window.addEventListener('scroll', updateHeader, {passive:true});
updateHeader();
menu.addEventListener('click', () => { const open = menu.getAttribute('aria-expanded') !== 'true'; menu.setAttribute('aria-expanded', String(open)); menu.setAttribute('aria-label', open ? 'Close navigation' : 'Open navigation'); nav.classList.toggle('open', open); });
$$('a[href^="#"]', nav).forEach(a => a.addEventListener('click', () => {menu.setAttribute('aria-expanded','false'); menu.setAttribute('aria-label','Open navigation'); nav.classList.remove('open');}));
document.addEventListener('keydown', e => {if(e.key === 'Escape'){menu.setAttribute('aria-expanded','false');nav.classList.remove('open');}});
const sectionObserver = new IntersectionObserver(entries => {entries.forEach(entry => { if (entry.isIntersecting) { $$('a',nav).forEach(a => a.classList.toggle('active', a.getAttribute('href') === '#'+entry.target.id)); } });}, {rootMargin:'-15% 0px -65% 0px'});
$$('main section[id]:not(#top)').forEach(s => sectionObserver.observe(s));

const heroVideo = $('#hero-video');
const motionButton = $('#motion-control');
let manuallyPaused = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
function motionUI() {motionButton.setAttribute('aria-pressed', String(manuallyPaused)); motionButton.innerHTML = manuallyPaused ? '<span aria-hidden="true">▶</span> Play background' : '<span aria-hidden="true">Ⅱ</span> Pause background';}
if(manuallyPaused) heroVideo.pause();
motionUI();
motionButton.addEventListener('click', () => {manuallyPaused = !manuallyPaused; if(manuallyPaused) heroVideo.pause(); else heroVideo.play().catch(() => {live.textContent='Background video is unavailable in this browser. The poster is shown.';}); motionUI();});
const heroObserver = new IntersectionObserver(entries => {for(const entry of entries){if(!entry.isIntersecting)heroVideo.pause();else if(!manuallyPaused)heroVideo.play().catch(()=>{});}}, {threshold:.05});
heroObserver.observe($('#top'));

const barCharts = $$('svg[data-animate-bar-chart]');
const reducedChartMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
const barChartObserver = new IntersectionObserver(entries => {
  entries.forEach(entry => {
    entry.target.classList.toggle('is-visible', entry.isIntersecting);
  });
}, {threshold: .25});
barCharts.forEach(chart => {
  if (reducedChartMotion) chart.classList.add('is-visible');
  else barChartObserver.observe(chart);
});

const tasks=[
 ['lift_dual_os','Lift','Dual-arm · opposite-side','Lift · Opposite-side'],['lift_dual_ss','Lift','Dual-arm · same-side','Lift · Same-side'],['lift_single','Lift','Single-arm','Lift · Single-arm'],
 ['pick_dual_os','Pick','Dual-arm · opposite-side','Pick · Opposite-side'],['pick_dual_ss','Pick','Dual-arm · same-side','Pick · Same-side'],['pick_single','Pick','Single-arm','Pick · Single-arm'],
 ['push_dual_ss','Push','Dual-arm · same-side','Push · Same-side'],['stack_dual_os','Stack','Dual-arm · opposite-side','Stack · Opposite-side'],['stack_dual_ss','Stack','Dual-arm · same-side','Stack · Same-side'],['stack_single','Stack','Single-arm','Stack · Single-arm']
];
tasks.forEach(([file,title,setup,label])=>{
 const article=document.createElement('article');article.className='task-card';
 const button=document.createElement('button');button.className='image-zoom';button.dataset.zoom='assets/tasks/'+file+'.webp';button.dataset.caption=title+' · '+setup+'. Saved-trajectory keyframe, separate from learned-policy evaluation.';button.setAttribute('aria-label','Enlarge '+title.toLowerCase()+' task, '+setup.toLowerCase());
 const img=document.createElement('img');img.src=button.dataset.zoom;img.alt=title+' task keyframe, '+setup;img.loading='lazy';img.width=640;img.height=480;
 const name=document.createElement('span');name.className='task-label';name.textContent=label;
 button.append(img,name);article.append(button);$('#task-grid').append(article);
});

const imageDialog=$('#image-dialog');let lastFigure;
document.addEventListener('click',e=>{const button=e.target.closest('[data-zoom]');if(!button)return;lastFigure=button;$('#dialog-image').src=button.dataset.zoom;$('#dialog-image').alt=button.dataset.caption;$('#dialog-caption').textContent=button.dataset.caption;imageDialog.showModal();document.body.style.overflow='hidden';});
function closeDialog(){imageDialog.close();}
$('.dialog-close').addEventListener('click',closeDialog);
imageDialog.addEventListener('click',e=>{if(e.target===imageDialog){const r=imageDialog.getBoundingClientRect();if(e.clientX<r.left||e.clientX>r.right||e.clientY<r.top||e.clientY>r.bottom)closeDialog();}});
imageDialog.addEventListener('close',()=>{document.body.style.overflow='';lastFigure?.focus();});

const copyCitationButton = $('#copy-citation');
let copyFeedbackTimer;
async function copyCitationText(text) {
  const helper = document.createElement('textarea');
  helper.value = text; helper.readOnly = true;
  helper.style.cssText = 'position:fixed;left:-9999px;top:0;';
  document.body.append(helper); helper.select();
  try {
    if (document.execCommand('copy')) return true;
  } catch { /* Use the Clipboard API when the browser requires it. */ }
  finally { helper.remove(); copyCitationButton.focus(); }
  try {
    await navigator.clipboard.writeText(text);
    return true;
  } catch {
    return false;
  }
}
copyCitationButton.addEventListener('click', async () => {
  const copied = await copyCitationText($('#bibtex-code').textContent.trim());
  copyCitationButton.dataset.copied = String(copied);
  $('span', copyCitationButton).textContent = copied ? 'Copied' : 'Select text';
  live.textContent = copied ? 'BibTeX citation copied.' : 'Select and copy the citation text.';
  if (!copied) {
    const range = document.createRange(); range.selectNodeContents($('#bibtex-code'));
    const selection = window.getSelection(); selection.removeAllRanges(); selection.addRange(range);
  }
  clearTimeout(copyFeedbackTimer);
  copyFeedbackTimer = setTimeout(() => {
    $('span', copyCitationButton).textContent = 'Copy';
    delete copyCitationButton.dataset.copied;
  }, 2200);
});

let results;
const labels = {robotwin: 'RoboTwin 2.0', embodi: 'EmbodiBench'};
const jointMethodOrder = ['Angle+M', '256-bin', 'FAST', 'StarVLA (joint)', 'Angle', 'RoboMorpher'];
const referenceName = 'StarVLA (EE)';
function format(value) { return value.toFixed(2); }
function bestScores(methods, valueAt) {
  return {
    joint: Math.max(...methods.filter(m => m.name !== referenceName).map(valueAt)),
    all: Math.max(...methods.map(valueAt))
  };
}
function scoreCell(value, best, reference) {
  const cell = document.createElement('td');
  const score = document.createElement('span');
  score.className = 'result-score';
  const jointBest = !reference && best.joint > 0 && Math.abs(value - best.joint) < 1e-6;
  const columnMax = best.all > 0 && Math.abs(value - best.all) < 1e-6;
  score.classList.toggle('is-joint-best', jointBest);
  score.classList.toggle('is-column-max', columnMax);
  score.textContent = format(value);
  const marks = [];
  if (jointBest) marks.push('Best joint-space');
  if (columnMax) marks.push('Column maximum');
  if (marks.length) score.title = marks.join(' · ');
  cell.append(score);
  return cell;
}
function groupHeading(body, title, columns) {
  const row = document.createElement('tr');
  row.className = 'control-group';
  const heading = document.createElement('th');
  heading.colSpan = columns;
  heading.scope = 'rowgroup';
  const label = document.createElement('span');
  label.className = 'control-group-label';
  label.textContent = title;
  heading.append(label);
  row.append(heading);
  body.append(row);
}
function methodRow(name) {
  const row = document.createElement('tr');
  row.dataset.method = name;
  if (name === 'RoboMorpher') row.className = 'method-ours';
  if (name === referenceName) row.className = 'method-reference';
  const heading = document.createElement('th');
  heading.scope = 'row';
  heading.className = 'method-column';
  heading.textContent = name === 'RoboMorpher' ? 'VLA + RoboMorpher' : name;
  row.append(heading);
  return row;
}
function renderMeanResults() {
  const jointBody = $('#results-table');
  const referenceBody = $('#results-reference');
  jointBody.replaceChildren(); referenceBody.replaceChildren();
  groupHeading(jointBody, 'Joint-space control', 3);
  groupHeading(referenceBody, 'End-effector reference', 3);
  const benchmarks = ['robotwin', 'embodi'];
  const best = benchmarks.map(key => bestScores(results[key].methods, m => m.mean));
  [...jointMethodOrder, referenceName].forEach(name => {
    const row = methodRow(name);
    benchmarks.forEach((key, i) => {
      const method = results[key].methods.find(m => m.name === name);
      const cell = scoreCell(method.mean, best[i], name === referenceName);
      cell.dataset.benchmark = key;
      row.append(cell);
    });
    (name === referenceName ? referenceBody : jointBody).append(row);
  });
}
function taskLabel(task) {
  const match = tasks.find(([file]) => file === task.replaceAll(' ', '_'));
  return match ? match[3] : task.charAt(0).toUpperCase() + task.slice(1);
}
const taskSetups = {
  single: {label: 'Single-arm', points: [[12, 19]]},
  same: {label: 'Dual-arm · same-side', points: [[7, 19], [17, 19]]},
  opposite: {label: 'Dual-arm · opposite-side', points: [[12, 2], [12, 19]]}
};
function taskConfiguration(task) {
  const match = tasks.find(([file]) => file === task.replaceAll(' ', '_'));
  if (!match) return null;
  return {title: match[1], setup: match[0].endsWith('_single') ? 'single' : match[0].endsWith('_ss') ? 'same' : 'opposite'};
}
function setupIcon(setup) {
  const ns = 'http://www.w3.org/2000/svg';
  const svg = document.createElementNS(ns, 'svg');
  svg.setAttribute('viewBox', '0 0 24 22');
  svg.setAttribute('aria-hidden', 'true');
  svg.classList.add('setup-icon');
  const table = document.createElementNS(ns, 'rect');
  Object.entries({x: 4, y: 6, width: 16, height: 9, rx: 1.6, fill: 'none', stroke: 'currentColor', 'stroke-width': 1.2, opacity: .5}).forEach(([key, value]) => table.setAttribute(key, value));
  svg.append(table);
  taskSetups[setup].points.forEach(([x, y]) => {
    const dot = document.createElementNS(ns, 'circle');
    Object.entries({cx: x, cy: y, r: 1.8, fill: 'currentColor'}).forEach(([key, value]) => dot.setAttribute(key, value));
    svg.append(dot);
  });
  return svg;
}
function renderSetupLegend() {
  const legend = $('#embodi-setup-legend');
  legend.replaceChildren();
  ['opposite', 'same', 'single'].forEach(setup => {
    const item = document.createElement('span');
    item.className = 'setup-legend-item';
    item.append(setupIcon(setup), document.createTextNode(taskSetups[setup].label));
    legend.append(item);
  });
}
function renderTaskResults(benchmark, containerSelector) {
  if (!results) return;
  const data = results[benchmark];
  const table = document.createElement('table');
  table.className = 'comparison-table task-comparison-table';
  table.style.minWidth = `calc(var(--results-method-width) + ${(data.tasks.length + 1) * 70}px)`;
  const columns = document.createElement('colgroup');
  Array.from({length: data.tasks.length + 2}, (_, i) => {
    const column = document.createElement('col');
    column.style.width = i === 0 ? 'var(--results-method-width)' : '70px';
    columns.append(column);
  });
  table.append(columns);
  const caption = document.createElement('caption');
  caption.className = 'sr-only';
  caption.textContent = 'Per-task success rates (%) on ' + labels[benchmark];
  table.append(caption);
  const head = document.createElement('thead');
  const header = document.createElement('tr');
  if (benchmark === 'embodi') {
    table.classList.add('embodi-comparison-table');
    const method = document.createElement('th');
    method.textContent = 'Method'; method.scope = 'col'; method.rowSpan = 2; method.className = 'method-column';
    header.append(method);
    const configurations = document.createElement('tr');
    configurations.className = 'configuration-header';
    data.tasks.forEach((task, i) => {
      const config = taskConfiguration(task);
      if (i === 0 || config.title !== taskConfiguration(data.tasks[i - 1]).title) {
        const group = document.createElement('th');
        group.textContent = config.title; group.scope = 'colgroup'; group.className = 'task-group-heading';
        group.colSpan = data.tasks.filter(t => taskConfiguration(t).title === config.title).length;
        header.append(group);
      }
      const cell = document.createElement('th');
      const label = config.title + ' · ' + taskSetups[config.setup].label;
      cell.scope = 'col'; cell.title = label; cell.setAttribute('aria-label', label);
      cell.dataset.task = task; cell.dataset.setup = config.setup;
      cell.append(setupIcon(config.setup));
      configurations.append(cell);
    });
    const mean = document.createElement('th');
    mean.textContent = 'Mean'; mean.scope = 'col'; mean.rowSpan = 2; mean.className = 'mean-column';
    header.append(mean);
    head.append(header, configurations);
    renderSetupLegend();
  } else {
    ['Method', ...data.tasks.map(taskLabel), 'Mean'].forEach((text, i) => {
      const cell = document.createElement('th'); cell.scope = 'col'; cell.textContent = text;
      if (i === 0) cell.className = 'method-column';
      if (i === data.tasks.length + 1) cell.className = 'mean-column';
      header.append(cell);
    });
    head.append(header);
  }
  table.append(head);
  const jointBody = document.createElement('tbody');
  const referenceBody = document.createElement('tbody');
  groupHeading(jointBody, 'Joint-space control', data.tasks.length + 2);
  groupHeading(referenceBody, 'End-effector reference', data.tasks.length + 2);
  const best = data.tasks.map((_, i) => bestScores(data.methods, m => m.tasks[i]));
  [...jointMethodOrder, referenceName].forEach(name => {
    const method = data.methods.find(m => m.name === name);
    const row = methodRow(name);
    method.tasks.forEach((value, i) => {
      const cell = scoreCell(value, best[i], name === referenceName);
      cell.dataset.taskIndex = String(i);
      row.append(cell);
    });
    const mean = scoreCell(method.mean, bestScores(data.methods, m => m.mean), name === referenceName);
    mean.className = 'mean-column';
    mean.dataset.metric = 'mean';
    row.append(mean);
    (name === referenceName ? referenceBody : jointBody).append(row);
  });
  table.append(referenceBody, jointBody);
  $(containerSelector).replaceChildren(table);
}
fetch('results.json').then(response => {
  if (!response.ok) throw Error('Results could not load');
  return response.json();
}).then(data => {
  results = data;
  renderMeanResults();
  renderTaskResults('robotwin', '#robotwin-results-table');
  renderTaskResults('embodi', '#embodi-results-table');
}).catch(() => { $('#results-error').hidden = false; });
