'use strict';
// Add new map resources before this file, then register them here in play order.
const CAMPAIGN_LEVELS=[MAP_LEVEL_1,MAP_LEVEL_2];
const requestedLevel=Number(new URLSearchParams(location.search).get('level'));
const MAP_CONFIG=CAMPAIGN_LEVELS.find(level=>level.id===requestedLevel&&level.enabled!==false)??CAMPAIGN_LEVELS[0];
const NEXT_LEVEL=CAMPAIGN_LEVELS[CAMPAIGN_LEVELS.indexOf(MAP_CONFIG)+1]??null;
function recordLevelVictory(){
  try{
    const saved=JSON.parse(localStorage.getItem('supertd.progress')??'{}');
    const completed=Array.isArray(saved.completed)?saved.completed:[];
    saved.completed=[...new Set([...completed,MAP_CONFIG.id])];
    localStorage.setItem('supertd.progress',JSON.stringify(saved));
  }catch{/* Progress storage is optional, including private/file browsing. */}
}
function enterNextLevel(){
  if(!NEXT_LEVEL||NEXT_LEVEL.enabled===false)return;
  const url=new URL('./',location.href);url.searchParams.set('level',String(NEXT_LEVEL.id));
  location.href=url.href;
}

function enterLevel(id){
  const level=CAMPAIGN_LEVELS.find(level=>level.id===id);
  if(!level||level.enabled===false)return;
  const url=new URL('./',location.href);url.searchParams.set('level',String(id));location.href=url.href;
}
function initLevelList(){
  const toggle=document.querySelector('#level-toggle'),list=document.querySelector('#level-list');
  if(!toggle||!list)return;
  for(const level of CAMPAIGN_LEVELS){
    const button=document.createElement('button');
    button.textContent=level.label+(level.enabled===false?' · 暂未开放':level===MAP_CONFIG?' · 当前':'');
    button.disabled=level.enabled===false;
    if(level===MAP_CONFIG)button.setAttribute('aria-current','page');
    button.onclick=()=>enterLevel(level.id);list.append(button);
  }
  toggle.onclick=()=>{list.hidden=!list.hidden;toggle.setAttribute('aria-expanded',String(!list.hidden));};
  document.addEventListener('pointerdown',event=>{
    if(!document.querySelector('#level-nav').contains(event.target)){list.hidden=true;toggle.setAttribute('aria-expanded','false');}
  });
  window.addEventListener('keydown',event=>{if(event.key==='Escape'){list.hidden=true;toggle.setAttribute('aria-expanded','false');}});
}
