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

$$('[data-survey]').forEach(button => button.addEventListener('click', () => {
  const lengths=button.dataset.survey==='lengths';
  $$('[data-survey]').forEach(b=>{const selected=b===button;b.classList.toggle('selected',selected);b.setAttribute('aria-pressed',String(selected));});
  $('#survey-image').src=lengths?'assets/link-lengths.svg':'assets/joint-distribution.svg';
  $('#survey-image').alt=lengths?'Seven Gaussian priors fitted to 185 reported link lengths':'Survey distribution: 21 six-DoF, 9 seven-DoF, and 3 five-DoF robot descriptions';
  $('#survey-caption').textContent=lengths?'Survey-derived priors before truncation and chain-length rescaling. The inventory describes the collected robots, rather than the full hardware population.':'Six- and seven-DoF arms account for 30 of the 33 surveyed descriptions (90.9%), motivating the generator’s sampling range.';
}));

const stages={
  generate:{label:'MORPHGEN',title:'Scale kinematic supervision.',description:'Normalize serial-arm chains to a shared local-Z convention, sample new morphologies, and pair configurations with forward-kinematics targets. No manipulation demonstrations are needed for tokenizer pretraining.',nodes:['Survey priors','Local-Z arms','URDF + q + FK'],note:'40M morphology–state pairs'},
  tokenize:{label:'ROBOMORPHER',title:'Encode angles with their spatial effects.',description:'Morphology features condition joint-aligned encoding and decoding. Two shared residual codebooks produce two indices per valid joint. Joint-angle and link-pose reconstruction connect action codes to the robot’s geometry.',nodes:['Morphology + q','Residual VQ','Angles + poses'],note:'2 × 2048 codebooks · 2 indices per valid joint'},
  predict:{label:'MORPHOLOGY-AWARE VLA',title:'From discrete codes to continuous control.',description:'The frozen tokenizer integrates with Qwen3-VL-4B and a two-branch action model. MaskGIT predicts discrete codes; decoded trajectories initialize a continuous flow-matching branch for refinement.',nodes:['Predict codes','Decode 10 → 50','Flow refinement'],note:'8 MaskGIT iterations · 4 Euler steps · 50-frame chunks'}
};
function selectStage(button,focus=false){
  const stage=stages[button.dataset.stage];
  $$('[data-stage]').forEach(b=>{const selected=b===button;b.setAttribute('aria-selected',String(selected));b.tabIndex=selected?0:-1;});
  $('#method-panel').setAttribute('aria-labelledby',button.id);
  $('#method-label').textContent=stage.label;$('#method-title').textContent=stage.title;$('#method-description').textContent=stage.description;
  const diagram=$('#stage-diagram');diagram.setAttribute('aria-label',stage.label+' stage');diagram.replaceChildren();
  stage.nodes.forEach((text,i)=>{if(i){const arrow=document.createElement('b');arrow.textContent='→';arrow.setAttribute('aria-hidden','true');diagram.append(arrow);}const node=document.createElement('span');node.textContent=text;if(i===2)node.className='accent';diagram.append(node);});
  const note=document.createElement('small');note.textContent=stage.note;diagram.append(note);if(focus)button.focus();
}
const tabs=$$('[data-stage]');tabs.forEach((b,index)=>{b.addEventListener('click',()=>selectStage(b));b.addEventListener('keydown',e=>{let next;if(e.key==='ArrowRight')next=(index+1)%tabs.length;if(e.key==='ArrowLeft')next=(index-1+tabs.length)%tabs.length;if(e.key==='Home')next=0;if(e.key==='End')next=tabs.length-1;if(next!==undefined){e.preventDefault();selectStage(tabs[next],true);}});});

const tasks=[
 ['lift_dual_os','lift','Lift','Dual-arm · opposite-side','OS'],['lift_dual_ss','lift','Lift','Dual-arm · same-side','SS'],['lift_single','lift','Lift','Single-arm','1 ARM'],
 ['pick_dual_os','pick','Pick','Dual-arm · opposite-side','OS'],['pick_dual_ss','pick','Pick','Dual-arm · same-side','SS'],['pick_single','pick','Pick','Single-arm','1 ARM'],
 ['push_dual_ss','push','Push','Dual-arm · same-side','SS'],['stack_dual_os','stack','Stack','Dual-arm · opposite-side','OS'],['stack_dual_ss','stack','Stack','Dual-arm · same-side','SS'],['stack_single','stack','Stack','Single-arm','1 ARM']
];
tasks.forEach(([file,family,title,setup,badge])=>{
 const article=document.createElement('article');article.className='task-card';article.dataset.family=family;
 const button=document.createElement('button');button.className='image-zoom';button.dataset.zoom='assets/tasks/'+file+'.webp';button.dataset.caption=title+' · '+setup+'. Saved-trajectory keyframe, separate from learned-policy evaluation.';button.setAttribute('aria-label','Enlarge '+title.toLowerCase()+' task, '+setup.toLowerCase());
 const img=document.createElement('img');img.src=button.dataset.zoom;img.alt=title+' task keyframe, '+setup;img.loading='lazy';img.width=640;img.height=480;button.append(img);const zoom=document.createElement('span');zoom.className='zoom-tag';zoom.textContent='↗';button.append(zoom);
 const text=document.createElement('div');text.className='task-card-text';const description=document.createElement('div');const h=document.createElement('h3');h.textContent=title;const small=document.createElement('small');small.textContent=setup;description.append(h,small);const tag=document.createElement('span');tag.textContent=badge;text.append(description,tag);article.append(button,text);$('#task-grid').append(article);
});
$$('[data-filter]').forEach(button=>button.addEventListener('click',()=>{const filter=button.dataset.filter;$$('[data-filter]').forEach(b=>{const selected=b===button;b.classList.toggle('selected',selected);b.setAttribute('aria-pressed',String(selected));});$$('.task-card').forEach(card=>card.hidden=filter!=='all'&&card.dataset.family!==filter);const count=$$('.task-card').filter(c=>!c.hidden).length;live.textContent=count+' benchmark tasks shown.';}));

const imageDialog=$('#image-dialog');let lastFigure;
document.addEventListener('click',e=>{const button=e.target.closest('[data-zoom]');if(!button)return;lastFigure=button;$('#dialog-image').src=button.dataset.zoom;$('#dialog-image').alt=button.dataset.caption;$('#dialog-caption').textContent=button.dataset.caption;imageDialog.showModal();document.body.style.overflow='hidden';});
function closeDialog(){imageDialog.close();}
$('.dialog-close').addEventListener('click',closeDialog);
imageDialog.addEventListener('click',e=>{if(e.target===imageDialog){const r=imageDialog.getBoundingClientRect();if(e.clientX<r.left||e.clientX>r.right||e.clientY<r.top||e.clientY>r.bottom)closeDialog();}});
imageDialog.addEventListener('close',()=>{document.body.style.overflow='';lastFigure?.focus();});

let benchmark='robotwin';let results;
const labels={robotwin:'RoboTwin 2.0',embodi:'EmbodiBench'};
const order=['RoboMorpher','StarVLA (joint)','256-bin','FAST','Angle+M','Angle','StarVLA (EE)'];
function format(v){return v.toFixed(2);}
function renderResults(){
 if(!results)return;
 const data=results[benchmark];const root=$('#result-bars');root.replaceChildren();root.setAttribute('aria-label','Success rates for joint-space methods on '+labels[benchmark]);
 const methods=data.methods.filter(m=>m.name!=='StarVLA (EE)').sort((a,b)=>b.mean-a.mean);
 for(const method of methods){const row=document.createElement('div');row.className='bar-row'+(method.name==='RoboMorpher'?' ours':'');const name=document.createElement('span');name.className='bar-name';name.textContent=method.name;const track=document.createElement('div');track.className='bar-track';const fill=document.createElement('div');fill.className='bar-fill';fill.style.width=method.mean+'%';track.append(fill);const value=document.createElement('span');value.className='bar-value';value.textContent=format(method.mean);row.append(name,track,value);root.append(row);}
 const taskTable=document.createElement('table');taskTable.className='comparison-table';const caption=document.createElement('caption');caption.className='sr-only';caption.textContent='Per-task success rates on '+labels[benchmark];taskTable.append(caption);const head=document.createElement('thead');const hr=document.createElement('tr');['Method',...data.tasks].forEach(t=>{const th=document.createElement('th');th.scope='col';th.textContent=t;hr.append(th);});head.append(hr);taskTable.append(head);const tbody=document.createElement('tbody');
 for(const name of order){const method=data.methods.find(m=>m.name===name);const tr=document.createElement('tr');if(name==='RoboMorpher')tr.className='ours';if(name==='StarVLA (EE)')tr.className='reference';[name,...method.tasks.map(format)].forEach(v=>{const td=document.createElement('td');td.textContent=v;tr.append(td);});tbody.append(tr);}taskTable.append(tbody);$('#task-results-table').replaceChildren(taskTable);
}
fetch('results.json').then(r=>{if(!r.ok)throw Error('Results could not load');return r.json();}).then(data=>{
 results=data;
 for(const name of order){const tr=document.createElement('tr');if(name==='RoboMorpher')tr.className='ours';if(name==='StarVLA (EE)')tr.className='reference';const cell=document.createElement('td');cell.textContent=name==='RoboMorpher'?'VLA + RoboMorpher':name;if(name==='StarVLA (EE)'){const small=document.createElement('small');small.textContent='Separate control interface';cell.append(small);}tr.append(cell);for(const key of ['robotwin','embodi']){const td=document.createElement('td');td.textContent=format(data[key].methods.find(m=>m.name===name).mean)+'%';tr.append(td);}$('#results-table').append(tr);}
 renderResults();
}).catch(()=>{$('#result-bars').innerHTML='<p>See the full results in the <a href="assets/paper.pdf">paper (PDF)</a>.</p>';});
$$('[data-benchmark]').forEach(button=>button.addEventListener('click',()=>{benchmark=button.dataset.benchmark;$$('[data-benchmark]').forEach(b=>{const selected=b===button;b.classList.toggle('selected',selected);b.setAttribute('aria-pressed',String(selected));});renderResults();live.textContent=labels[benchmark]+' results shown.';}));
