// Purely visual helpers: deterministic terrain, cached once; no gameplay changes.
let terrainLayer;
const terrainImages={};
for(const [name,config] of Object.entries(MAP_CONFIG.terrain??{})){
  const asset={image:new Image(),ready:false};
  asset.image.onload=()=>{asset.ready=true;terrainLayer=null;};
  asset.image.src=config.src;terrainImages[name]=asset;
}
function terrainPattern(g,name,fallback){
  const asset=terrainImages[name];if(!asset?.ready)return fallback;
  // Mirrored neighbors share their boundary pixels, so the base never has a seam.
  const tile=document.createElement('canvas'),size=Math.round(CELL*MAP_CONFIG.terrain[name].tileCells);
  tile.width=tile.height=size*2;
  const t=tile.getContext('2d');
  for(let x=0;x<2;x++)for(let y=0;y<2;y++){
    t.save();t.translate(x?size*2:0,y?size*2:0);t.scale(x?-1:1,y?-1:1);
    t.drawImage(asset.image,0,0,size,size);t.restore();
  }
  return g.createPattern(tile,'repeat');
}
function grassPatches(g){
  const names=(MAP_CONFIG.grassVariants??[]).filter(name=>terrainImages[name]?.ready);
  if(names.length<2)return;
  const size=CELL*4,patches=new Map();
  for(const name of names){
    if(name==='grass')continue;
    const patch=document.createElement('canvas');patch.width=patch.height=size;
    const p=patch.getContext('2d');p.drawImage(terrainImages[name].image,0,0,size,size);
    // Every variant fades to the same shared ground at ALL edges.
    const mask=p.createRadialGradient(size/2,size/2,size*.25,size/2,size/2,size*.5);
    mask.addColorStop(0,'#fff');mask.addColorStop(.5,'#ffffffe0');mask.addColorStop(1,'#fff0');
    p.globalCompositeOperation='destination-in';p.fillStyle=mask;p.fillRect(0,0,size,size);
    patches.set(name,patch);
  }
  for(let x=-1;x<=Math.ceil(W/4);x++)for(let y=-1;y<=Math.ceil(H/4);y++){
    const name=names[Math.floor(noise(x,y,203)*names.length)],patch=patches.get(name);
    if(!patch)continue;
    g.save();g.translate((x+.5)*size,(y+.5)*size);g.rotate(Math.floor(noise(x,y,204)*4)*Math.PI/2);
    g.drawImage(patch,-size/2,-size/2);g.restore();
  }
}
const spawnFlagImage=new Image();let spawnFlagReady=false;
spawnFlagImage.onload=()=>{spawnFlagReady=true;};
spawnFlagImage.src=MAP_CONFIG.spawnMarker?.src??'assets/spawn-flag-cartoon-v1.png';
function spawnMarker(p){
  const x=(p.x+.5)*CELL,y=(p.y+.5)*CELL,size=(MAP_CONFIG.spawnMarker?.sizeCells??1.4)*CELL;
  if(spawnFlagReady){ctx.drawImage(spawnFlagImage,x-size/2,y-size*.82,size,size);return;}
  rect(x-2,y-30,4,42,'#79502e');polygon([[x+2,y-29],[x+29,y-24],[x+19,y-14],[x+2,y-12]],'#e47736');
}
const spriteAtlas = new Image();
let spritesReady = false;
spriteAtlas.onload = () => { spritesReady = true; };
spriteAtlas.src = 'assets/forest-sprites-v1.png';
const spriteCells = {gun:[0,0],cannon:[1,0],slow:[2,0],miner:[0,1],wall:[1,1],crystal:[2,1],bug:[0,2],heavy:[1,2],base:[2,2]};
function sprite(name,x,y,size,angle=0){
  if(!spritesReady)return false;
  const [col,row]=spriteCells[name],sw=spriteAtlas.naturalWidth/3,sh=spriteAtlas.naturalHeight/3;
  ctx.save();ctx.translate(x,y);ctx.rotate(angle);
  ctx.drawImage(spriteAtlas,col*sw,row*sh,sw,sh,-size/2,-size/2,size,size);
  ctx.restore();return true;
}
const towerAtlas = new Image();
let towerLayersReady=false;
towerAtlas.onload=()=>{towerLayersReady=true;};
towerAtlas.src='assets/tower-layers-v2.png';
// Pivot coordinates measured in each 512px source cell, so heads rotate on the bearing.
const towerCells={foundation:[0,0,267,281],miner:[1,0,257,275],wall:[2,0,256,280],gun:[0,1,209,235],cannon:[1,1,223,236],slow:[2,1,195,234]};
function towerLayer(name,x,y,size,angle=0){
  if(!towerLayersReady)return false;
  const [col,row,px,py]=towerCells[name],sw=towerAtlas.naturalWidth/3,sh=towerAtlas.naturalHeight/2;
  ctx.save();ctx.translate(x,y);ctx.rotate(angle);
  // Keep the source hub fixed on the building center.
  ctx.drawImage(towerAtlas,col*sw,row*sh,sw,sh,-size*px/512,-size*py/512,size,size*sh/sw);
  ctx.restore();return true;
}
// Optional per-level heads; the existing atlas remains the level-two head.
const levelHeadImages=new Map();
for(const building of Object.values(GAME_CONFIG.buildings))for(const level of building.levels){
  if(level.head&&!levelHeadImages.has(level.head.src)){
    const asset={image:new Image(),ready:false};
    asset.image.onload=()=>{asset.ready=true;};asset.image.src=level.head.src;
    levelHeadImages.set(level.head.src,asset);
  }
}
function levelHead(head,size,angle){
  const asset=levelHeadImages.get(head?.src);if(!asset?.ready)return false;
  const [px,py]=head.pivot;
  const [fx,fy,fw,fh]=head.frame??[0,0,1,1],image=asset.image;
  ctx.save();ctx.rotate(angle);ctx.drawImage(image,fx*image.naturalWidth,fy*image.naturalHeight,fw*image.naturalWidth,fh*image.naturalHeight,-size*px,-size*py,size,size);ctx.restore();return true;
}
function selectedCorners(){
  ctx.strokeStyle='#fff1b0';ctx.lineWidth=2;
  for(const [a,c] of [[-1,-1],[1,-1],[-1,1],[1,1]]){ctx.beginPath();ctx.moveTo(a*21,c*14);ctx.lineTo(a*21,c*21);ctx.lineTo(a*14,c*21);ctx.stroke();}
}
function noise(x,y,n=0){const v=Math.sin(x*127.1+y*311.7+n*74.7)*43758.5453;return v-Math.floor(v);}
function polygon(points,color){ctx.fillStyle=color;ctx.beginPath();points.forEach(([x,y],i)=>i?ctx.lineTo(x,y):ctx.moveTo(x,y));ctx.closePath();ctx.fill();}
function terrain(){
  if(!terrainLayer){
    terrainLayer=document.createElement('canvas');
    terrainLayer.width=W*CELL;terrainLayer.height=H*CELL;
    const g=terrainLayer.getContext('2d');
    g.fillStyle=terrainPattern(g,'grass','#7daf50');
    g.fillRect(0,0,W*CELL,H*CELL);
    grassPatches(g);
    const pathFill=terrainPattern(g,'path','#dec18a');
    g.lineJoin='round';g.lineCap='round';
    // Shared continuous path stroke keeps generated surface connected at bends.
    function strokePath(path,width,paint){
      g.lineWidth=width;g.strokeStyle=paint;g.beginPath();
      path.forEach((p,i)=>{const x=(p.x+.5)*CELL,y=(p.y+.5)*CELL;i?g.lineTo(x,y):g.moveTo(x,y);});
      g.stroke();
    }
    for(const path of paths){
      strokePath(path,CELL+8,'#52783c');
      strokePath(path,CELL+3,'#f1d9a2');
      strokePath(path,CELL-3,pathFill);
    }
  }
  ctx.drawImage(terrainLayer,0,0,W*CELL,H*CELL);
  // Keep placement cells visible on demand over the quieter cartoon terrain.
  if(tool){
    ctx.strokeStyle='#ecf4ce28';ctx.lineWidth=1;
    for(let x=0;x<=W;x++){ctx.beginPath();ctx.moveTo(x*CELL,0);ctx.lineTo(x*CELL,H*CELL);ctx.stroke();}
    for(let y=0;y<=H;y++){ctx.beginPath();ctx.moveTo(0,y*CELL);ctx.lineTo(W*CELL,y*CELL);ctx.stroke();}
  }
}

function crystalArt(o,taken){if(spritesReady){ctx.save();ctx.globalAlpha=taken?.65:1;sprite('crystal',(o.x+.5)*CELL,(o.y+.5)*CELL,48);ctx.restore();return;}const x=(o.x+.5)*CELL,y=(o.y+.5)*CELL;ctx.save();ctx.translate(x,y);ctx.scale(1,.45);circle(2,21,17,'#163c3450');ctx.restore();
  for(const [dx,dy,s] of [[-9,5,.7],[8,5,.8],[0,0,1]]){ctx.save();ctx.translate(x+dx,y+dy);ctx.scale(s,s);polygon([[-8,5],[-6,-11],[0,-19],[8,-9],[9,5],[0,11]],taken?'#409e96':'#5dd8c8');polygon([[0,-19],[8,-9],[9,5],[0,11]],taken?'#2b7778':'#329eaa');polygon([[-6,-11],[0,-19],[0,4],[-8,5]],taken?'#87c9b3':'#c0f7dc');ctx.restore();}
}
function structureArt(b){
  const t=types[b.type],v=stats(b);ctx.save();ctx.translate((b.x+.5)*CELL,(b.y+.5)*CELL);
  if(t.kind==='miner'){
    if(!towerLayer(t.sprite,0,0,55)){
      rect(-17,-17,34,34,'#294c42');
      for(const x of [-15,9])for(const y of [-15,9])rect(x,y,6,6,'#c9ae65');
      circle(0,0,13,'#26473d');circle(0,0,9,'#66d1bd');circle(0,0,4,'#214f46');
    }
  }else if(t.kind==='wall'){
    if(!towerLayer(t.sprite,0,0,53))sprite('wall',0,0,51);
    rect(-18,20,36,4,'#213b2b');rect(-17,21,34*b.hp/b.maxHp,2,'#c9ed91');
  }else{
    if(!towerLayer('foundation',0,0,55)){
      rect(-18,-18,36,36,'#294a3c');rect(-15,-15,30,30,'#91a18a');circle(0,0,13,'#3f5c50');
      for(const x of [-12,12])for(const y of [-12,12])circle(x,y,2,'#e2d4a0');
    }
    const headDrawn=v.head?levelHead(v.head,55,b.angle??0):towerLayer(t.sprite,0,0,55,b.angle??0);
    if(!headDrawn){
      ctx.save();ctx.rotate(b.angle??0);circle(0,0,10,t.color);
      for(const side of v.muzzleOffsets??[0])rect(0,side*44-3,t.attack==='splash'?22:24,t.attack==='splash'?12:6,t.color);ctx.restore();
    }
    for(let i=0;i<b.level;i++)circle((i-(b.level-1)/2)*5,20,1.6,'#ffe5a1');
  }
  if(b===selected)selectedCorners();ctx.restore();
}
function creatureArt(e){const t=enemyTypes[e.type];if(spritesReady){const p=paths[e.path][e.next],angle=p?Math.atan2(p.y+.5-e.y,p.x+.5-e.x):0;const x=e.x*CELL,y=e.y*CELL;ctx.save();if(e.slow>0){circle(x,y,16,'#a9f2ef66');}sprite(t.sprite,x,y,t.spriteSize,angle);rect(x-14,y-23,28,4,'#213b2b');rect(x-13,y-22,26*Math.max(0,e.hp/e.maxHp),2,e.slow>0?'#a2e8db':'#d5e69a');ctx.restore();return;}const x=e.x*CELL,y=e.y*CELL,r=t.radius;ctx.save();ctx.translate(x,y);ctx.save();ctx.scale(1,.45);circle(3,16,r+3,'#182a2455');ctx.restore();
  const p=paths[e.path][e.next],angle=p?Math.atan2(p.y+.5-e.y,p.x+.5-e.x):0;
  ctx.save();ctx.rotate(angle);for(const a of [-1,1]){rect(-r+1,a*7-2,7,4,'#523e37');rect(r-6,a*7-2,7,4,'#523e37');}circle(0,0,r,e.slow>0?'#81d2d2':t.color);circle(-2,-2,r-3,e.slow>0?'#b6eddf':t.highlight);polygon([[2,-5],[r+3,0],[2,5]],t.mouth);circle(r-1,-3,1.5,'#ffe6a6');circle(r-1,3,1.5,'#ffe6a6');ctx.restore();
  rect(-15,-24,30,5,'#24392ce0');rect(-14,-23,28*Math.max(0,e.hp/e.maxHp),3,e.slow>0?'#a2e8db':'#d5e69a');ctx.restore();
}
function outpostArt(){if(spritesReady){const end=paths[0][paths[0].length-1];sprite('base',(end.x+.5)*CELL,(end.y+.5)*CELL,66);return;}const end=paths[0][paths[0].length-1],x=end.x*CELL,y=end.y*CELL;rect(x+1,y+5,42,36,'#455b48');rect(x+4,y+1,36,32,'#b1b898');rect(x+8,y-8,28,32,'#658b71');polygon([[x+4,y-8],[x+22,y-20],[x+40,y-8]],'#d4d6b0');rect(x+17,y+13,10,20,'#2c4c3d');rect(x+10,y+1,6,7,'#dce7ac');rect(x+28,y+1,6,7,'#dce7ac');rect(x+34,y-32,2,25,'#d1cd9d');polygon([[x+36,y-32],[x+50,y-27],[x+36,y-22]],'#e9d08c');}

// Art uses a canonical 44px cell; scale around its world-space anchor.
function cellArt(x,y,draw){ctx.save();ctx.translate(x,y);ctx.scale(CELL/44,CELL/44);ctx.translate(-x,-y);draw();ctx.restore();}
function crystal(o,taken){cellArt((o.x+.5)*CELL,(o.y+.5)*CELL,()=>crystalArt(o,taken));}
function structure(b){cellArt((b.x+.5)*CELL,(b.y+.5)*CELL,()=>structureArt(b));}
function creature(e){cellArt(e.x*CELL,e.y*CELL,()=>creatureArt(e));}
function outpost(){const end=paths[0][paths[0].length-1];cellArt((end.x+.5)*CELL,(end.y+.5)*CELL,()=>outpostArt());}
