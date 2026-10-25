const path=require('node:path');
const root=path.resolve(__dirname,'..');
const vm=require('node:vm'),fs=require('node:fs'),assert=require('node:assert');
const context=new Proxy({}, {get:(o,k)=>o[k]??(()=>{})});
const nodes=new Map();
function el(){return {style:{setProperty(){}},dataset:{},classList:{toggle(){}},setAttribute(){},focus(){},children:[],append(child){this.children.push(child)},getBoundingClientRect(){return {width:1280,height:800,left:0,top:0}},getContext(){return context},addEventListener(){},hidden:true,offsetWidth:282,offsetHeight:350};}
const sandbox={console,Math,Set,Image:class {},document:{querySelector(s){if(!nodes.has(s))nodes.set(s,el());return nodes.get(s)},querySelectorAll(){return []},createElement:el},window:{addEventListener(){}},ResizeObserver:class{observe(){}},devicePixelRatio:1,requestAnimationFrame(){},setTimeout(){},clearTimeout(){}};
vm.createContext(sandbox);
const read=p=>fs.readFileSync(path.join(root,p),'utf8');
vm.runInContext(read('resources/game-config.js'),sandbox);
vm.runInContext(`
// A new ID with existing behavior and artwork requires only data.
GAME_CONFIG.buildings.testTower={...GAME_CONFIG.buildings.gun,name:'测试塔',levels:[{cost:2,hp:99,damage:30,cool:.2,range:6}]};
GAME_CONFIG.enemies.testEnemy={...GAME_CONFIG.enemies.normal,hp:160,wallDps:37,baseDamage:3};
`,sandbox);
vm.runInContext(read('visuals.js')+'\n'+read('game.js')+`\n
function check(ok,msg){if(!ok)throw Error(msg)}
check(MAX_WAVES===5&&ores.length===135,'Default map/waves changed');
check(W===44&&H===28&&CELL===66&&W*CELL===2904&&H*CELL===1848,'Grid/world dimensions incorrect');
check(new Set(ores.map(o=>o.x+','+o.y)).size===135,'Duplicate ores');
check(ores.every(o=>o.x>=0&&o.x<W&&o.y>=0&&o.y<H&&!road.has(o.x+','+o.y)),'Ore outside map or on road');
for(const path of paths)for(let i=0;i<path.length;i++){const p=path[i];check(p.x>=0&&p.x<W&&p.y>=0&&p.y<H,'Path outside map');if(i)check(Math.abs(p.x-path[i-1].x)+Math.abs(p.y-path[i-1].y)===1,'Disconnected path');}
for(const [vw,vh] of [[1280,800],[390,844],[5000,3000]]){viewW=vw;viewH=vh;zoom=.01;cam={x:-99999,y:99999};clampCam();check(cam.x>=0&&cam.y>=0&&cam.x+viewW/zoom<=W*CELL+.001&&cam.y+viewH/zoom<=H*CELL+.001,'Camera outside map');}

check($('#buildings').children.length===6,'New building absent from menu');
check(types.gun.levels.map(v=>v.cost).join(',')==='10,40,60','Gun mana balance mismatch');
check(types.wall.levels.map(v=>v.hp).join(',')==='4000,4140,4280','Original wall HP changed');
wave=1;spawn({path:0,type:'normal'});spawn({path:1,type:'heavy'});
check(enemies[0].hp===200&&enemies[1].hp===570,'Fixed enemy HP mismatch');
spawn({path:0,type:'testEnemy'});check(enemies[2].hp===160,'New enemy config ignored');
for(let n=1;n<=5;n++){wave=n;enemies=[];spawn({path:0,type:'normal'});spawn({path:1,type:'heavy'});check(enemies[0].hp===200&&enemies[1].hp===570,'HP must stay fixed across waves');check(enemies.every(e=>e.speed===1.15),'Enemy speed must be equal and fixed across waves');}
for(const id of ['gun','cannon','slow']){const levels=types[id].levels;check(levels[1].cost===levels[0].cost*4&&levels[2].cost===levels[0].cost*6,'Tower upgrade cost multiplier mismatch');}
check(types.gun.levels.every((v,i)=>v.damage===20*(i+1)&&v.cool===1.425),'Gun damage/rate mismatch');
check(types.gun.levels[0].range===4,'Gun range changed');
check(types.wall.levels.map(v=>v.cost).join(',')==='5,10,15','Wall costs mismatch');
reset();update(25);check(wave===1&&enemies[0].type==='normal','Automatic wave failed');
for(let n=1;n<=5;n++){check(wave===n,'Wave mismatch');queue=[];enemies=[];update(.01);if(n<5)update(12);}
check(ended&&outcome==='victory','Five-wave victory regressed');startWave();check(wave===5,'Sixth wave started');
reset();GAME_CONFIG.rules.baseHealth=37;GAME_CONFIG.rules.manaPerOre=7;reset();check(health===37,'Base health config ignored');
buildings=[{type:'miner',x:6,y:6,level:1}];const nearby=ores.filter(o=>Math.max(Math.abs(o.x-6),Math.abs(o.y-6))<=2).length;check(capacity()===nearby*7,'Mana per ore ignored');
types.miner.coverage=1;check(capacity()===ores.filter(o=>Math.max(Math.abs(o.x-6),Math.abs(o.y-6))<=1).length*7,'Miner coverage ignored');types.miner.coverage=2;
const tower={type:'testTower',x:7,y:7,level:1,hp:99,maxHp:99,angle:0,cd:0};
buildings=[tower];wave=1;spawn({path:0,type:'testEnemy'});const enemy=enemies[0];enemy.x=9;enemy.y=7.5;enemy.speed=0;update(.05);
check(enemy.hp===130&&tower.cd===.2,'Configured tower attack ignored');
selected=tower;ui();check($('#selection').innerHTML.includes('30')&&$('#selection').innerHTML.includes('5.00 次/秒'),'Configured tower info ignored');
reset();const wall={type:'wall',x:paths[0][1].x,y:paths[0][1].y,level:1,hp:180,maxHp:180};buildings=[wall];wave=1;spawn({path:0,type:'testEnemy'});enemies[0].x=wall.x+.5;enemies[0].y=wall.y+.5;update(.1);check(Math.abs(wall.hp-176.3)<1e-8,'Configured wall damage ignored');
reset();wave=1;spawn({path:0,type:'testEnemy'});enemies[0].next=paths[0].length;update(.1);check(health===34,'Configured base damage ignored');
reset();GAME_CONFIG.rules.enemyCycle=['testEnemy'];startWave();check(queue.every(s=>s.type==='testEnemy'),'Enemy roster ignored');
GAME_CONFIG.rules.spawnInterval=.3;update(.01);check(spawnClock===.3,'Spawn interval ignored');
// Explosion: direct victim is not hit twice; square corners receive splash.
reset();wave=1;
const cannon={type:'cannon',x:5,y:5,level:1,hp:180,maxHp:180,angle:0,cd:0};buildings=[cannon];
function dummy(x,y){return {type:'normal',x,y,path:0,next:1,hp:200,maxHp:200,speed:0,slow:0,slowFactor:1};}
const direct=dummy(7.5,5.5),corner=dummy(9,7),outside=dummy(9.01,5.5);enemies=[direct,corner,outside];update(.05);
check(direct.hp===160&&corner.hp===190&&outside.hp===200,'Direct/square splash damage wrong');
check(shots[0].blastSize===3,'Blast effect size wrong');
reset();wave=1;const target=dummy(7.5,5.5);enemies=[target];buildings=[0,1].map(()=>({type:'slow',x:5,y:5,level:1,hp:180,maxHp:180,angle:0,cd:0}));update(.05);
check(target.slowFactor===.5&&target.slow===1.8&&target.hp===192,'Slow stacked or damage changed');
check(enemyTypes.normal.wallDps===100&&enemyTypes.heavy.wallDps===25,'Enemy wall DPS mismatch');
spriteAtlas.naturalWidth=1254;spriteAtlas.naturalHeight=1254;spriteAtlas.onload();towerAtlas.naturalWidth=1536;towerAtlas.naturalHeight=1024;towerAtlas.onload();draw();
console.log('PASS: fixed enemy HP across all waves, tower mana multipliers, gun balance, five-wave victory, config-driven new units/menu, tower damage/cooldown/info, mining, enemy HP/attacks, wave roster and drawing');
`,sandbox);
