'use strict';
const canvas = document.querySelector('#game'), ctx = canvas.getContext('2d');
const $ = s => document.querySelector(s);
const {cellSize:CELL,width:W,height:H} = MAP_CONFIG;
const WAVE_SETTINGS = GAME_CONFIG.rules;
const BATCHES=WAVE_SETTINGS.batches;
const MAX_WAVES=BATCHES.filter(b=>b.assault).length;
const LEVEL_TOTAL=BATCHES.reduce((n,b)=>n+Object.values(b.enemies).reduce((a,c)=>a+c,0),0);
let batchIndex,batchStates,buildCooldowns;
let outcome=null;
let preparationLeft,waveTotal;
const types = GAME_CONFIG.buildings;
const allowedBuildings=MAP_CONFIG.allowedBuildings??Object.keys(types);
const enemyTypes = GAME_CONFIG.enemies;
function stats(b){return types[b.type].levels[(b.level||1)-1];}
function kind(b){return types[b.type].kind;}
const paths = MAP_CONFIG.paths.map(makePath);
function makePath(points){const out=[{x:points[0][0],y:points[0][1]}];for(let i=1;i<points.length;i++){let {x,y}=out[out.length-1];const [tx,ty]=points[i];while(x!==tx||y!==ty){x+=Math.sign(tx-x);y+=Math.sign(ty-y);out.push({x,y});}}return out;}
const road = new Set(paths.flat().map(p=>`${p.x},${p.y}`));
const oreClusters = MAP_CONFIG.oreClusters;
const ores = oreClusters.flat().map(([x,y])=>({x,y}));
let buildings,enemies,shots,impacts,wave,health,queue,spawnClock,active,paused,ended,tool,selected,hover;
let cam={x:0,y:0},zoom=1,viewW=1,viewH=1,pointer=null,last=0,messageTimer;
function reset(){batchIndex=-1;batchStates=[];buildCooldowns=Object.fromEntries(Object.keys(types).map(id=>[id,0]));outcome=null;$('#overlay').className='';$('#overlay').innerHTML='';buildings=[];enemies=[];shots=[];impacts=[];wave=0;health=WAVE_SETTINGS.baseHealth;preparationLeft=WAVE_SETTINGS.initialDelay;waveTotal=0;queue=[];spawnClock=0;active=false;paused=false;ended=false;tool=null;selected=null;hover=null;zoom=1;cam={x:0,y:2*CELL};closeMenu();$('#overlay').hidden=true;$('#pause').textContent='暂停';clampCam();ui();}
function cost(b){return stats(b).cost;}
function claimed(b,o){return Math.max(Math.abs(b.x-o.x),Math.abs(b.y-o.y))<=types[b.type].coverage;}
function miningCount(o,list=buildings){return list.filter(b=>kind(b)==='miner'&&claimed(b,o)).length;}
function capacity(list=buildings){return ores.reduce((n,o)=>n+Math.min(WAVE_SETTINGS.maxMinersPerOre,miningCount(o,list))*WAVE_SETTINGS.manaPerOre,0);}
function used(list=buildings){return list.reduce((n,b)=>n+cost(b),0);}
function at(x,y){return buildings.find(b=>b.x===x&&b.y===y);}
function valid(type,x,y){if(!allowedBuildings.includes(type))return '本关尚未开放该建筑';if(buildCooldowns[type]>0)return `建造冷却 · ${Math.ceil(buildCooldowns[type])} 秒`;if(x<0||y<0||x>=W||y>=H)return '超出地图';if(at(x,y))return '该格已有建筑';const r=road.has(`${x},${y}`),t=types[type];if(t.kind==='wall'){if(!r)return '阻拦设施只能放在道路上';if(paths.some(p=>[p[0],p[p.length-1]].some(q=>q.x===x&&q.y===y)))return '不能封堵出生点或基地';}else if(r)return '该建筑不能放在道路上';if(ores.some(o=>o.x===x&&o.y===y))return '矿石格不能建造，请建在旁边';if(t.kind==='miner'&&!ores.some(o=>claimed({x,y,type},o)&&miningCount(o)<WAVE_SETTINGS.maxMinersPerOre))return '周围矿石均已达到开采上限，或没有矿石';if(used()+types[type].levels[0].cost>capacity())return '魔力容量不足，请扩展魔力枢纽';return '';}
function toast(t){$('#message').textContent=t;$('#message').style.opacity=1;clearTimeout(messageTimer);messageTimer=setTimeout(()=>$('#message').style.opacity=0,2700);}
for(const id of allowedBuildings){const t=types[id];const b=document.createElement('button');b.style.setProperty('--accent',t.color);b.innerHTML=`<span class="build-icon" data-sprite="${t.sprite}">${t.icon}</span><span class="build-copy"><b>${t.name}</b><small>${t.desc}</small><small class="build-cooldown">建造 CD ${t.buildCooldown} 秒</small></span><span class="build-cost">${t.levels[0].cost||'免费'}</span>`;b.onclick=()=>{if(!menuTile||ended)return;const {x,y}=menuTile;const error=valid(id,x,y);if(error){toast(error);return;}buildings.push({type:id,x,y,level:1,hp:t.levels[0].hp,maxHp:t.levels[0].hp,cd:0,angle:Math.random()*Math.PI*2});buildCooldowns[id]=t.buildCooldown;closeMenu();ui();};b.onpointerenter=b.onfocus=()=>{if(menuTile&&!selected&&!$('#context-menu').hidden){tool=id;}};b.onpointerleave=b.onblur=()=>{if(tool===id)tool=null;};b.dataset.type=id;$('#buildings').append(b);}
let menuTile=null;
function closeMenu(){menuTile=null;selected=null;tool=null;$('#context-menu').hidden=true;}
function openMenu(cell,p){
  closeMenu();
  if(cell.x<0||cell.y<0||cell.x>=W||cell.y>=H)return;
  if(ores.some(o=>o.x===cell.x&&o.y===cell.y))return;
  menuTile=cell;selected=at(cell.x,cell.y)||null;
  const menu=$('#context-menu');menu.hidden=false;
  menu.dataset.mode=selected?'selection':'build';
  menu.dataset.options=String(Math.min(4,Math.max(2,allowedBuildings.length)));
  $('#menu-background').src=selected?'assets/ui-hud-panel-v1.png':`assets/ui-build-menu-${menu.dataset.options}-v1.png`;
  menu.style.setProperty('--option-count',String(Math.max(2,allowedBuildings.length)));
  $('#context-title').textContent=selected?'建筑':`建造 · ${cell.x}, ${cell.y}`;
  $('#buildings').hidden=!!selected;$('#selection').hidden=!selected;
  document.querySelectorAll('[data-type]').forEach(button=>{
    const error=valid(button.dataset.type,cell.x,cell.y);
    button.disabled=!!error;button.title=error;
  });
  selectionKey='';ui();
  const width=menu.offsetWidth,height=menu.offsetHeight;
  menu.style.left=Math.max(8,Math.min(p.x+16,viewW-width-8))+'px';
  menu.style.top=Math.max(8,Math.min(p.y-20,viewH-height-8))+'px';
}
$('#close-menu').onclick=closeMenu;
let selectionKey = '';
function updateHud(){
  const consumed=used(),limit=capacity();
  $('#mana-value').textContent=consumed+' / '+limit;
  $('#mana-fill').style.width=(limit?consumed/limit*100:0)+'%';
  $('#mana-meter').setAttribute('aria-valuemin','0');
  $('#mana-meter').setAttribute('aria-valuemax',String(Math.max(1,limit)));
  $('#mana-meter').setAttribute('aria-valuenow',String(consumed));
  $('#mana-meter').setAttribute('aria-valuetext',`已占用 ${consumed}，容量 ${limit}`);
  $('#health-value').textContent=health+' / '+WAVE_SETTINGS.baseHealth;
  $('#health-fill').style.width=(health/WAVE_SETTINGS.baseHealth*100)+'%';
  $('#health-meter').setAttribute('aria-valuenow',String(health));
  $('#health-meter').setAttribute('aria-valuemax',String(WAVE_SETTINGS.baseHealth));
  const handled=batchStates.reduce((n,b)=>n+b.kills+b.escaped,0);
  const progress=Math.min(100,handled/LEVEL_TOTAL*100);
  $('#wave-fill').style.width=progress+'%';
  $('#wave-meter').setAttribute('aria-valuenow',String(Math.round(progress)));
  $('#wave-meter').setAttribute('aria-valuetext',`关卡进度 ${Math.round(progress)}%，总攻 ${wave}/${MAX_WAVES}`);
  $('#wave-label').textContent=`第一关 · ${MAX_WAVES} 次总攻`;
  $('#wave-state').textContent=ended?(outcome==='victory'?'防守成功':'基地失守'):paused?'已暂停':!active?'准备中':BATCHES[batchIndex]?.assault?'最终总攻':`第 ${batchIndex+1} 批来袭`;
  let scheduled=0;
  const flags=BATCHES.map((b,i)=>{
    const before=scheduled;scheduled+=Object.values(b.enemies).reduce((a,c)=>a+c,0);
    if(!b.assault)return '';
    const cleared=batchStates[i]&&batchStates[i].kills+batchStates[i].escaped===batchStates[i].total;
    return `<span class="wave-flag ${cleared?'cleared':''}" style="left:${before/LEVEL_TOTAL*100}%"><i>⚑</i><small>总攻</small></span>`;
  }).join('');
  if($('#wave-flags').innerHTML!==flags)$('#wave-flags').innerHTML=flags;
  $('#wave-countdown').hidden=!WAVE_SETTINGS.showCountdown||active||ended;
  $('#wave-countdown').textContent=`开局准备 · ${Math.ceil(preparationLeft)} 秒`;
  $('#pause').textContent=paused?'继续':'暂停';$('#pause').setAttribute('aria-pressed',String(paused));$('#pause').setAttribute('aria-label',paused?'继续':'暂停');
  $('#pause').disabled=ended;
}
function ui(){updateHud();document.querySelectorAll('[data-type]').forEach(b=>{
  const id=b.dataset.type,left=buildCooldowns[id];
  b.classList.toggle('active',id===tool);
  const cd=b.querySelector('.build-cooldown');
  if(cd)cd.textContent=left>0?`冷却 ${Math.ceil(left)} 秒`:`建造 CD ${types[id].buildCooldown} 秒`;
  if(menuTile&&!selected){const error=valid(id,menuTile.x,menuTile.y);b.disabled=!!error;b.title=error;}
});const el=$('#selection');if(selected&&!buildings.includes(selected))selected=null;const key=JSON.stringify([tool,selected ? [selected.x,selected.y,selected.type,selected.level,Math.ceil(selected.hp)] : null,used(),capacity(),ended]);if(key===selectionKey)return;selectionKey=key;if(!selected){el.textContent='';return;}const b=selected,t=types[b.type],v=stats(b),next=t.levels[b.level];el.innerHTML=`<b>${t.name} · Lv.${b.level}</b><br>魔力占用：${cost(b)}${kind(b)==='miner'?`<br>覆盖矿石：${ores.filter(o=>claimed(b,o)).length} 块（每块最多 ${WAVE_SETTINGS.maxMinersPerOre} 台）`:kind(b)==='wall'?`<br>耐久：${Math.ceil(b.hp)} / ${b.maxHp}`:`<br>每发伤害：${v.damage}${v.projectiles?` · 齐射 ${v.projectiles} 发`: ''} · 射程：${v.range.toFixed(1)} 格<br>射速：${(1/v.cool).toFixed(2)} 次/秒（间隔 ${v.cool} 秒）${t.attack==='splash'?`<br>溅射：${v.splashDamage} · ${t.blastSize}×${t.blastSize} 格（其他敌人）`:t.slowDuration?`<br>减速：${Math.round((1-t.slowFactor)*100)}% · ${t.slowDuration} 秒 · 不叠加`: ''}`}`;if(next){const up=document.createElement('button');up.textContent=`升级（+${next.cost-v.cost}）`;up.disabled=used()+next.cost-v.cost>capacity()||ended;up.onclick=()=>{if(ended||used()+next.cost-v.cost>capacity())return;b.level++;b.maxHp=next.hp;b.hp=t.healOnUpgrade?b.maxHp:Math.min(b.hp,b.maxHp);ui();};el.append(up);}const sell=document.createElement('button');sell.textContent='拆除';sell.onclick=()=>{const next=buildings.filter(q=>q!==b);if(used(next)>capacity(next)){toast('拆除后魔力容量不足，请先拆除部分防御建筑');return;}buildings=next;closeMenu();ui();};el.append(sell);}
function finishGame(result){
  if(ended)return;
  ended=true;active=false;paused=false;outcome=result;preparationLeft=0;
  closeMenu();clearTimeout(messageTimer);$('#message').style.opacity=0;
  const won=result==='victory',overlay=$('#overlay');
  overlay.className='result '+result;
  overlay.innerHTML=`<div class="result-backdrop"></div><div class="result-particles" aria-hidden="true">${Array.from({length:28},(_,i)=>`<i style="--n:${i};--x:${(i*37)%100}%;--drift:${(i%2?1:-1)*(20+i*3)}px;--delay:${(i%7)*.08}s"></i>`).join('')}</div><section class="result-card" role="dialog" aria-modal="true" aria-labelledby="result-title"><img class="result-art" src="assets/ui-result-${won?'victory':'defeat'}-v1.png" alt="" aria-hidden="true" draggable="false"><h2 id="result-title">${won?'防守成功':'基地失守'}</h2><p>${won?`最终总攻已击退`:`防线止步于第 ${batchIndex+1} 批`}</p><div class="result-summary">${won?`基地生命 <b>${health} / ${WAVE_SETTINGS.baseHealth}</b>`:`基地生命 <b>0 / ${WAVE_SETTINGS.baseHealth}</b>`}</div><button id="result-restart" aria-label="重新开始"><span class="result-restart-label">重新开始</span></button></section>`;
  overlay.hidden=false;
  $('#result-restart').onclick=reset;
  $('#result-restart').focus();
}
function startBatch(){
  if(ended||batchIndex+1>=BATCHES.length)return;
  batchIndex++;active=true;preparationLeft=0;
  const config=BATCHES[batchIndex];
  if(config.assault)wave++;
  const entries=Object.entries(config.enemies);
  waveTotal=entries.reduce((n,[,count])=>n+count,0);
  batchStates.push({total:waveTotal,kills:0,escaped:0,farthest:0});
  queue=entries.flatMap(([type,count])=>Array.from({length:count},()=>({type,path:0,batch:batchIndex})));
  spawnClock=0;
}
function advanceBatches(){
  if(ended||!active||queue.length)return;
  const state=batchStates[batchIndex],trigger=BATCHES[batchIndex].trigger;
  if(batchIndex<BATCHES.length-1){
    if(state.kills+state.escaped>=state.total||
       (trigger&&(state.kills>=trigger.kills||state.farthest>=trigger.progress)))startBatch();
  }else if(!enemies.length)finishGame('victory');
}
$('#pause').onclick=()=>{if(ended)return;paused=!paused;ui();};$('#restart').onclick=reset;
window.addEventListener('keydown',e=>{if(e.key==='Escape'){closeMenu();ui();}});
function resize(){const r=canvas.getBoundingClientRect();viewW=r.width;viewH=r.height;canvas.width=Math.round(r.width*devicePixelRatio);canvas.height=Math.round(r.height*devicePixelRatio);clampCam();}
new ResizeObserver(resize).observe(canvas);
function pos(e){const r=canvas.getBoundingClientRect();return {x:e.clientX-r.left,y:e.clientY-r.top};}
function tile(p){return {x:Math.floor((p.x/zoom+cam.x)/CELL),y:Math.floor((p.y/zoom+cam.y)/CELL)};}
function minZoom(){return Math.max(viewW/(W*CELL),viewH/(H*CELL));}
function clampCam(){zoom=Math.max(zoom,minZoom());cam.x=Math.max(0,Math.min(W*CELL-viewW/zoom,cam.x));cam.y=Math.max(0,Math.min(H*CELL-viewH/zoom,cam.y));}
canvas.oncontextmenu=e=>e.preventDefault();
canvas.onpointerdown=e=>{const p=pos(e);pointer={...p,startX:p.x,startY:p.y,drag:false,button:e.button};canvas.setPointerCapture(e.pointerId);};
canvas.onpointermove=e=>{const p=pos(e);hover=tile(p);if(pointer){if(Math.hypot(p.x-pointer.startX,p.y-pointer.startY)>5)pointer.drag=true;if(pointer.drag){closeMenu();cam.x-=(p.x-pointer.x)/zoom;cam.y-=(p.y-pointer.y)/zoom;clampCam();}pointer.x=p.x;pointer.y=p.y;}};
canvas.onpointerup=e=>{if(pointer&&!pointer.drag&&pointer.button===0&&!ended){if(!$('#context-menu').hidden){closeMenu();}else{const p=pos(e);openMenu(tile(p),p);}}else if(pointer&&pointer.button===2)closeMenu();pointer=null;};canvas.onpointercancel=()=>pointer=null;canvas.onpointerleave=()=>hover=null;
canvas.addEventListener('wheel',e=>{e.preventDefault();closeMenu();const p=pos(e),wx=p.x/zoom+cam.x,wy=p.y/zoom+cam.y;zoom=Math.max(minZoom(),Math.min(Math.max(1.7,minZoom()),zoom*Math.exp(-e.deltaY*.001)));cam.x=wx-p.x/zoom;cam.y=wy-p.y/zoom;clampCam();},{passive:false});
function spawn(s){const t=enemyTypes[s.type],p=paths[s.path][0],hp=t.hp;enemies.push({batch:s.batch,type:s.type,x:p.x+.5,y:p.y+.5,path:s.path,next:1,hp,maxHp:hp,speed:t.speed,slow:0,slowFactor:1});}
function update(dt){if(paused||ended)return;for(const id of Object.keys(buildCooldowns))buildCooldowns[id]=Math.max(0,buildCooldowns[id]-dt);if(!active){preparationLeft=Math.max(0,preparationLeft-dt);if(preparationLeft<=0)startBatch();}if(active){spawnClock-=dt;if(queue.length&&spawnClock<=0){spawn(queue.shift());spawnClock=WAVE_SETTINGS.spawnInterval;}}
for(const e of enemies){if(e.hp<=0)continue;e.slow=Math.max(0,e.slow-dt);let move=e.speed*(e.slow>0?e.slowFactor:1)*dt;while(move>0){const p=paths[e.path][e.next];if(!p){e.hp=0;e.escaped=true;health-=enemyTypes[e.type].baseDamage;break;}const block=at(p.x,p.y);const dx=p.x+.5-e.x,dy=p.y+.5-e.y,d=Math.hypot(dx,dy);if(block&&kind(block)==='wall'&&d<.85){block.hp-=dt*enemyTypes[e.type].wallDps;if(block.hp<=0)buildings=buildings.filter(b=>b!==block);break;}if(move>=d){e.x=p.x+.5;e.y=p.y+.5;e.next++;move-=d;}else{e.x+=dx/d*move;e.y+=dy/d*move;move=0;}}}
for(const e of enemies){const state=batchStates[e.batch];if(state)state.farthest=Math.max(state.farthest,Math.min(1,(e.next-1)/(paths[e.path].length-1)));}
for(const b of buildings){
  const t=types[b.type],v=stats(b);if(t.kind!=='tower')continue;
  b.cd-=dt;
  const range=v.range;
  const target=enemies.filter(e=>e.hp>0&&Math.hypot(e.x-b.x-.5,e.y-b.y-.5)<=range).sort((a,c)=>(paths[a.path].length-a.next)-(paths[c.path].length-c.next))[0];
  if(!target)continue;
  const desired=Math.atan2(target.y-b.y-.5,target.x-b.x-.5);
  b.angle??=desired;
  const delta=Math.atan2(Math.sin(desired-b.angle),Math.cos(desired-b.angle));
  const step=t.turnSpeed*dt;
  b.angle+=Math.max(-step,Math.min(step,delta));
  if(b.cd>0||Math.abs(delta)>step+.08)continue;
  b.cd=v.cool;
  const count=v.projectiles??1;
  for(let i=0;i<count;i++){
    const muzzle=v.muzzleForward??.42,side=v.muzzleOffsets?.[i]??0;
    shots.push({
      x:b.x+.5+Math.cos(b.angle)*muzzle-Math.sin(b.angle)*side,
      y:b.y+.5+Math.sin(b.angle)*muzzle+Math.cos(b.angle)*side,
      dx:Math.cos(b.angle),dy:Math.sin(b.angle),
      speed:t.projectileSpeed??WAVE_SETTINGS.projectileSpeed,
      radius:t.projectileRadius??WAVE_SETTINGS.projectileRadius,
      damage:v.damage,color:t.color,blast:t.attack==='splash',blastSize:t.blastSize,
      splashDamage:v.splashDamage,slowDuration:t.slowDuration,slowFactor:t.slowFactor
    });
  }
}
updateProjectiles(dt);
for(const e of enemies)if(e.hp<=0){const state=batchStates[e.batch];if(state){if(e.escaped)state.escaped++;else state.kills++;}}
enemies=enemies.filter(e=>e.hp>0);impacts.forEach(s=>s.life-=dt);impacts=impacts.filter(s=>s.life>0);if(health<=0){health=0;finishGame('defeat');}
advanceBatches();ui();}
// Segment-circle intersection: hit the first enemy along this frame's flight,
// rather than teleporting damage to the selected target or tunnelling through it.
function segmentHit(x,y,dx,dy,cx,cy,r){
  const ox=x-cx,oy=y-cy,c=ox*ox+oy*oy-r*r;
  if(c<=0)return 0;
  const a=dx*dx+dy*dy;if(!a)return null;
  const b=2*(ox*dx+oy*dy),d=b*b-4*a*c;if(d<0)return null;
  const t=(-b-Math.sqrt(d))/(2*a);return t>=0&&t<=1?t:null;
}
function updateProjectiles(dt){
  for(const shot of shots){
    const dx=shot.dx*shot.speed*dt,dy=shot.dy*shot.speed*dt;
    let hit=null,first=Infinity;
    for(const enemy of enemies){
      if(enemy.hp<=0)continue;
      const radius=enemyTypes[enemy.type].radius/44+shot.radius;
      const time=segmentHit(shot.x,shot.y,dx,dy,enemy.x,enemy.y,radius);
      if(time!==null&&time<first){first=time;hit=enemy;}
    }
    if(hit){
      shot.x+=dx*first;shot.y+=dy*first;shot.spent=true;
      hit.hp-=shot.damage;
      if(shot.blast){
        const half=shot.blastSize/2;
        for(const enemy of enemies)if(enemy!==hit&&enemy.hp>0&&Math.abs(enemy.x-shot.x)<=half&&Math.abs(enemy.y-shot.y)<=half)enemy.hp-=shot.splashDamage;
      }
      if(shot.slowDuration){hit.slow=shot.slowDuration;hit.slowFactor=shot.slowFactor;}
      impacts.push({x:shot.x,y:shot.y,color:shot.color,blast:shot.blast,blastSize:shot.blastSize,life:.25});
    }else{shot.x+=dx;shot.y+=dy;}
  }
  shots=shots.filter(s=>!s.spent&&s.x>=0&&s.x<=W&&s.y>=0&&s.y<=H);
}
function rect(x,y,w,h,color){ctx.fillStyle=color;ctx.fillRect(x,y,w,h);}
function circle(x,y,r,color){ctx.beginPath();ctx.arc(x,y,r,0,Math.PI*2);ctx.fillStyle=color;ctx.fill();}
function draw(){ctx.setTransform(devicePixelRatio,0,0,devicePixelRatio,0,0);rect(0,0,viewW,viewH,'#283d2c');ctx.scale(zoom,zoom);ctx.translate(-cam.x,-cam.y);terrain();
for(const path of paths){spawnMarker(path[0]);for(let i=3;i<path.length-1;i+=5){const p=path[i],n=path[i+1];ctx.save();ctx.translate((p.x+.5)*CELL,(p.y+.5)*CELL);ctx.rotate(Math.atan2(n.y-p.y,n.x-p.x));ctx.fillStyle='#735e3c55';ctx.beginPath();ctx.moveTo(6,0);ctx.lineTo(-4,-5);ctx.lineTo(-4,5);ctx.fill();ctx.restore();}}
outpost();
for(const o of ores){
  const layers=Math.min(WAVE_SETTINGS.maxMinersPerOre,miningCount(o));
  crystal(o,layers>0);
  if(layers){const x=(o.x+.5)*CELL,y=(o.y+.85)*CELL;for(let i=0;i<WAVE_SETTINGS.maxMinersPerOre;i++)circle(x+(i-(WAVE_SETTINGS.maxMinersPerOre-1)/2)*5,y,1.7,i<layers?'#f0d58d':'#254a3c');}
}
const focus=selected||(menuTile&&tool&&!$('#context-menu').hidden?{...menuTile,type:tool,level:1}:null);if(focus){const t=types[focus.type],v=stats(focus),x=(focus.x+.5)*CELL,y=(focus.y+.5)*CELL;ctx.fillStyle=t.color+'24';ctx.strokeStyle=t.color+'bb';ctx.lineWidth=2/zoom;if(t.kind==='miner'){ctx.fillRect((focus.x-t.coverage)*CELL,(focus.y-t.coverage)*CELL,(t.coverage*2+1)*CELL,(t.coverage*2+1)*CELL);ctx.strokeRect((focus.x-t.coverage)*CELL,(focus.y-t.coverage)*CELL,(t.coverage*2+1)*CELL,(t.coverage*2+1)*CELL);}else if(v.range){ctx.beginPath();ctx.arc(x,y,v.range*CELL,0,Math.PI*2);ctx.fill();ctx.stroke();}}
for(const b of buildings)structure(b);
for(const e of enemies)creature(e);
for(const s of shots){
  ctx.strokeStyle=s.color;ctx.lineWidth=s.blast?4:2;ctx.lineCap='round';
  ctx.beginPath();ctx.moveTo((s.x-s.dx*.18)*CELL,(s.y-s.dy*.18)*CELL);ctx.lineTo(s.x*CELL,s.y*CELL);ctx.stroke();
  circle(s.x*CELL,s.y*CELL,Math.max(2,s.radius*CELL),'#fff2c2');
}
ctx.lineCap='butt';
for(const s of impacts){
  ctx.globalAlpha=s.life/.25;ctx.strokeStyle=s.color;ctx.lineWidth=2;
  if(s.blast){const size=(1-s.life/.25)*CELL*s.blastSize;ctx.strokeRect(s.x*CELL-size/2,s.y*CELL-size/2,size,size);}
  else{ctx.beginPath();ctx.arc(s.x*CELL,s.y*CELL,3+(1-s.life/.25)*8,0,Math.PI*2);ctx.stroke();}
}
ctx.globalAlpha=1;
if(menuTile&&!$('#context-menu').hidden){ctx.strokeStyle='#f4e4a9';ctx.lineWidth=2;ctx.strokeRect(menuTile.x*CELL+2,menuTile.y*CELL+2,CELL-4,CELL-4);}ctx.lineWidth=1;}
function frame(time){const dt=Math.min((time-last)/1000,.05);last=time;update(dt);draw();requestAnimationFrame(frame);}
reset();resize();requestAnimationFrame(frame);
