const fs=require('node:fs'),vm=require('node:vm'),path=require('node:path');
const root=path.resolve(__dirname,'..');
const nodes=new Map();
const drawing=new Proxy({}, {get:(o,k)=>o[k]??(()=>{})});
function element(){return {hidden:true,innerHTML:'',textContent:'',dataset:{},style:{setProperty(){}},classList:{toggle(){}},children:[],append(child){this.children.push(child)},querySelector(){return null},setAttribute(){},focus(){},addEventListener(){},getContext(){return drawing},getBoundingClientRect(){return {width:1249,height:892,left:0,top:0}},setPointerCapture(){},offsetWidth:320,offsetHeight:310};}
const progressStore=new Map();
const sandbox={console,Math,Map,Set,URL,URLSearchParams,location:{search:process.env.TEST_LEVEL==='2'?'?level=2':'',href:'http://localhost:8080/'},localStorage:{getItem:key=>progressStore.get(key)??null,setItem:(key,value)=>progressStore.set(key,value)},Image:class {},document:{querySelector(s){if(!nodes.has(s))nodes.set(s,element());return nodes.get(s)},querySelectorAll(s){return s==='[data-type]'?nodes.get('#buildings').children:[]},createElement:element,addEventListener(){}},window:{addEventListener(){}},ResizeObserver:class{observe(){}},devicePixelRatio:1,requestAnimationFrame(){},setTimeout(){},clearTimeout(){}};
vm.createContext(sandbox);
for(const file of ['resources/game-config.js','resources/map-level-1.js','resources/map-level-2.js','resources/campaign.js','visuals.js','game.js'])vm.runInContext(fs.readFileSync(path.join(root,file),'utf8'),sandbox,{filename:file});
vm.runInContext(`
function check(ok,message){if(!ok)throw Error(message);}
for(const map of CAMPAIGN_LEVELS){
 const route=makePath(map.paths[0]),edges=[route[0],route[route.length-1]],padding=map.edgePadding;
 check(map.paths.length===1,'Unexpected branch/spawn');
 check(edges.every(p=>p.x>=padding&&p.y>=padding&&p.x<=map.width-1-padding&&p.y<=map.height-1-padding),'Endpoint lacks scenic margin');
 const cells=new Set(route.map(p=>p.x+','+p.y));
 check(cells.size===route.length,'Route self-intersects');
 const oreList=map.oreClusters.flat();check(new Set(oreList.map(p=>p.join(','))).size===oreList.length,'Duplicate ore');
 check(oreList.every(([x,y])=>x>=0&&y>=0&&x<map.width&&y<map.height&&!cells.has(x+','+y)),'Ore on road/outside map');
}
check(MAP_LEVEL_2.width*MAP_LEVEL_2.height>MAP_LEVEL_1.width*MAP_LEVEL_1.height,'Level two not larger');
check(MAP_LEVEL_1.allowedBuildings.join(',')==='gun,miner'&&MAP_LEVEL_2.allowedBuildings.includes('slow'),'Unlock availability wrong');
check(makePath(MAP_LEVEL_1.paths[0]).length-1===53&&makePath(MAP_LEVEL_2.paths[0]).length-1===91,'Route lengths changed');
const ore=ores[0];
openMenu({x:ore.x,y:ore.y},{x:200,y:200});
check($('#context-menu').hidden&&menuTile===null,'Ore click opened menu');
const empty={x:2,y:2};openMenu(empty,{x:150,y:150});
check(!$('#context-menu').hidden,'Empty tile should open menu');
openMenu({x:ore.x,y:ore.y},{x:200,y:200});
check($('#context-menu').hidden&&menuTile===null,'Ore click did not dismiss old menu');
reset();preparationLeft=0;
// Exercise the real leak -> health zero -> defeat flow, without waiting for movement.
for(let i=0;i<1000&&!ended;i++){
 for(const enemy of enemies)enemy.next=paths[enemy.path].length;
 update(.7);
}
check(ended&&outcome==='defeat'&&health===0,'Enemy leaks failed to produce defeat');
check($('#overlay').className==='result defeat'&&!$('#overlay').hidden,'Defeat overlay missing');
check($('#overlay').innerHTML.includes('ui-result-defeat-v1.png'),'Wrong defeat artwork');
check($('#overlay').innerHTML.includes('aria-modal="true"'),'Result dialog inaccessible');
const frozen=JSON.stringify([enemies,queue,buildCooldowns,preparationLeft]);update(10);
check(JSON.stringify([enemies,queue,buildCooldowns,preparationLeft])===frozen,'Defeat did not freeze simulation');
$('#result-restart').onclick();
check(!ended&&outcome===null&&health===20&&batchIndex===-1&&preparationLeft===20&&$('#overlay').hidden,'Restart failed');
preparationLeft=0;
for(let i=0;i<1000&&!ended;i++){
 for(const enemy of enemies)enemy.hp=0;
 update(.7);
}
check(ended&&outcome==='victory'&&health===20,'Final clearance failed to produce victory');
check($('#overlay').innerHTML.includes('ui-result-victory-v1.png'),'Wrong victory artwork');
check($('#wave-fill').style.width==='100%','Victory progress not complete');
if(MAP_CONFIG.id===1){
 check($('#overlay').innerHTML.includes('解锁减速炮塔')&&$('#overlay').innerHTML.includes('进入第二关')&&$('#overlay').innerHTML.includes('disabled aria-disabled="true"'),'Missing unlock or disabled next-level UI');
 check(JSON.parse(localStorage.getItem('supertd.progress')).completed.includes(1),'Victory not recorded');
 enterNextLevel();check(new URL(location.href).searchParams.get('level')!=='2','Disabled second level was opened');
 check(MAP_CONFIG.id===1&&MAP_LEVEL_2.enabled===false,'Only first level should be available');
 check($('#level-list').children.length===2&&$('#level-list').children[1].disabled,'Level list must disable second level');
}else{check(allowedBuildings.length===3&&MAX_WAVES===2,'Level two settings incorrect');}

$('#result-restart').onclick();
check(!ended&&!enemies.length&&!shots.length&&!impacts.length,'Victory restart retained combat state');
console.log('PASS: ore click suppression, actual leak-triggered defeat, simulation freeze, both result artworks, victory clearance and restart');
`,sandbox);
