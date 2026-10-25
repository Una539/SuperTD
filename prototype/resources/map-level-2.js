'use strict';
// 第二关：一条连续路线，无分岔；布局规则见 MAP-DESIGN.md。
const MAP_LEVEL_2 = {
  ...MAP_LEVEL_1,
  id:2,
  enabled:false, // 地图保留，暂不向玩家开放。
  label:'第二关',
  width:44,
  height:30,
  edgePadding:4,
  reward:null,
  initialCamera:{focus:[10,10]},
  allowedBuildings:['gun','miner','slow'],
  paths:[
    [[4,8],[16,8],[16,14],[8,14],[8,23],[27,23],[27,8],[36,8],[36,18],[39,18]]
  ],
  // 7 处、21 块；前段支持开局采矿，中后段支持减速与普通塔协作。
  oreClusters:[
    [[7,9],[8,9],[7,10]],
    [[11,11],[12,11],[11,12]],
    [[10,18],[11,18],[10,19]],
    [[19,21],[20,21],[19,22]],
    [[24,10],[25,10],[24,11]],
    [[30,10],[31,10],[30,11]],
    [[37,15],[38,15],[37,16]]
  ],
  rules:{
    initialDelay:20,
    batches:[
      {enemies:{normal:6},trigger:{kills:4,progress:.55}},
      {enemies:{normal:8},trigger:{kills:5,progress:.55}},
      {assault:true,enemies:{normal:12,heavy:2},trigger:{kills:9,progress:.6}},
      {enemies:{normal:10,heavy:2},trigger:{kills:8,progress:.6}},
      {enemies:{normal:12,heavy:3},trigger:{kills:10,progress:.6}},
      {assault:true,enemies:{normal:18,heavy:4}}
    ]
  }
};
