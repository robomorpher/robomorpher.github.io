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
let heroVisible = false;
let heroReady = false;
function updateHeroPlayback(){
 if(!heroReady||!heroVisible||manuallyPaused||document.hidden){heroVideo.pause();return;}
 if(!heroVideo.getAttribute('src')){
  heroVideo.src=window.matchMedia('(max-width: 800px)').matches?'assets/hero-mobile.mp4':'assets/hero-desktop.mp4';
 }
 heroVideo.play().catch(()=>{});
}
motionUI();
motionButton.addEventListener('click',()=>{manuallyPaused=!manuallyPaused;heroReady=true;motionUI();updateHeroPlayback();});
const heroObserver=new IntersectionObserver(entries=>{
 heroVisible=entries[0].isIntersecting;updateHeroPlayback();
},{threshold:.05});
heroObserver.observe($('#top'));
function scheduleHero(){
 const start=()=>{heroReady=true;updateHeroPlayback();};
 if('requestIdleCallback' in window)window.requestIdleCallback(start,{timeout:1500});
 else setTimeout(start,200);
}
if(document.readyState==='complete')scheduleHero();
else window.addEventListener('load',scheduleHero,{once:true});

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
 const button=document.createElement('button');button.className='image-zoom';button.dataset.video='assets/tasks/'+file+'.mp4';button.dataset.poster='assets/tasks/'+file+'.webp';button.dataset.caption=title+' · '+setup+'. Saved-trajectory replay, separate from learned-policy evaluation.';button.setAttribute('aria-label','Enlarge '+title.toLowerCase()+' task video, '+setup.toLowerCase());
 const video=document.createElement('video');video.className='task-video';video.dataset.src=button.dataset.video;video.dataset.poster=button.dataset.poster;video.width=640;video.height=480;video.loop=true;video.muted=true;video.defaultMuted=true;video.playsInline=true;video.preload='none';video.tabIndex=-1;video.setAttribute('aria-hidden','true');
 const name=document.createElement('span');name.className='task-label';name.textContent=label;
 button.append(video,name);article.append(button);$('#task-grid').append(article);
});

const imageDialog=$('#image-dialog');let lastFigure;
const dialogVideo=$('#dialog-video');
const taskVideos=$$('.task-video, .morphology-video');
const visibleTaskVideos=new Set();
const posterObserver=new IntersectionObserver(entries=>{
 entries.forEach(({target,isIntersecting})=>{
  if(!isIntersecting)return;
  target.poster=target.dataset.poster;
  posterObserver.unobserve(target);
 });
},{rootMargin:'240px'});
taskVideos.forEach(video=>posterObserver.observe(video));
function loadVideo(video){
 if(video.dataset.loaded)return;
 if(video.dataset.src)video.src=video.dataset.src;
 video.querySelectorAll('source[data-src]').forEach(source=>{source.src=source.dataset.src;});
 video.dataset.loaded='true';
 video.load();
}
function updateTaskPlayback(){
 taskVideos.forEach(video=>{
  if(visibleTaskVideos.has(video)&&!document.hidden&&!imageDialog.open&&!reducedChartMotion){loadVideo(video);video.play().catch(()=>{});}
  else video.pause();
 });
}
const taskVideoObserver=new IntersectionObserver(entries=>{
 entries.forEach(entry=>{
  if(entry.isIntersecting)visibleTaskVideos.add(entry.target);
  else visibleTaskVideos.delete(entry.target);
 });
 updateTaskPlayback();
},{threshold:.05});
taskVideos.forEach(video=>taskVideoObserver.observe(video));
document.addEventListener('visibilitychange',()=>{
 updateTaskPlayback();
 updateHeroPlayback();
 if(document.hidden)dialogVideo.pause();
 else if(imageDialog.open&&!dialogVideo.hidden)dialogVideo.play().catch(()=>{});
});
document.addEventListener('click',e=>{
 const button=e.target.closest('[data-zoom],[data-video]');if(!button)return;
 lastFigure=button;
 const isVideo=!!button.dataset.video;
 $('#dialog-image').hidden=isVideo;dialogVideo.hidden=!isVideo;
 if(isVideo){
  dialogVideo.src=button.dataset.video;dialogVideo.poster=button.dataset.poster;dialogVideo.muted=true;dialogVideo.defaultMuted=true;
  dialogVideo.setAttribute('aria-label',button.getAttribute('aria-label'));
 }else{
  $('#dialog-image').src=button.dataset.zoom;$('#dialog-image').alt=button.dataset.caption;
 }
 $('#dialog-caption').textContent=button.dataset.caption;
 imageDialog.showModal();document.body.style.overflow='hidden';updateTaskPlayback();
 if(isVideo)dialogVideo.play().catch(()=>{});
});
function closeDialog(){imageDialog.close();}
$('.dialog-close').addEventListener('click',closeDialog);
imageDialog.addEventListener('click',e=>{if(e.target===imageDialog){const r=imageDialog.getBoundingClientRect();if(e.clientX<r.left||e.clientX>r.right||e.clientY<r.top||e.clientY>r.bottom)closeDialog();}});
imageDialog.addEventListener('close',()=>{dialogVideo.pause();dialogVideo.removeAttribute('src');dialogVideo.load();dialogVideo.hidden=true;document.body.style.overflow='';lastFigure?.focus();updateTaskPlayback();});

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
