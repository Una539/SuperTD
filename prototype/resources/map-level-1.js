'use strict';
// 第一关地图。坐标为 [列, 行]，从 0 开始；尺寸单位为格，cellSize 单位为像素。
const MAP_LEVEL_1 = {
  id:1,
  label:'第一关',
  edgePadding:4,
  reward:{building:'slow',title:'解锁减速炮塔',description:'命中后使敌人减速 50%，第二关起可部署。'},
  initialCamera:{focus:[8,9]},
  width: 36,
  height: 26,
  cellSize: 66,
  terrain: {
    grass: {src:'assets/terrain-grass-cartoon-v1.png',tileCells:4},
    clover: {src:'assets/terrain-grass-clover-v1.png',tileCells:4},
    tufts: {src:'assets/terrain-grass-tufts-v1.png',tileCells:4},
    flowers: {src:'assets/terrain-grass-flowers-v1.png',tileCells:4},
    path: {src:'assets/terrain-path-cartoon-v1.png',tileCells:3}
  },
  grassVariants: ['grass','clover','tufts','flowers'],
  spawnMarker: {src:'assets/spawn-flag-cartoon-v1.png',sizeCells:1.4},
  // 此关允许建造的建筑 ID，同时决定菜单顺序。
  allowedBuildings: ['gun', 'miner'],
  // 每条路径按拐点连接，相邻拐点须在同一行或同一列。
  // 第一个点为出怪点，最后一个点为基地；当前关卡只有一条路径。
  paths: [[[4,7],[10,7],[10,11],[7,11],[7,16],[17,16],[17,9],[25,9],[25,13],[31,13]]],
  // 每组为一处矿区，每个坐标为一块矿石。当前 5 处，共 15 块。
  oreClusters: [[[7,8],[8,8],[7,9]],[[8,12],[9,12],[8,13]],[[14,13],[15,13],[14,14]],[[19,10],[20,10],[19,11]],[[28,11],[29,11],[28,12]]]
};
