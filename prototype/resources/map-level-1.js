'use strict';
// 第一关地图。坐标为 [列, 行]，从 0 开始；尺寸单位为格，cellSize 单位为像素。
const MAP_CONFIG = {
  width: 28,
  height: 18,
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
  paths: [
    [[0,3],[6,3],[6,7],[3,7],[3,12],[13,12],[13,5],[21,5],[21,9],[27,9]]
  ],
  // 每组为一处矿区，每个坐标为一块矿石。当前 5 处，共 15 块。
  oreClusters: [
    [[3,4],[4,4],[3,5]],
    [[4,8],[5,8],[4,9]],
    [[10,9],[11,9],[10,10]],
    [[15,6],[16,6],[15,7]],
    [[24,7],[25,7],[24,8]]
  ]
};
