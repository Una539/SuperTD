'use strict';
// 纯数据资源；使用脚本加载，以兼容直接打开 index.html，无需构建或服务器。
// 时间：秒；距离：格；伤害、生命、魔力：点。字段说明见本目录 README.md。
const GAME_CONFIG = {
  rules: {
    baseHealth: 20,
    manaPerOre: 6,
    maxMinersPerOre: 5,
    initialDelay: 20,
    showCountdown: true,
    spawnInterval: 0.65,
    projectileSpeed: 14, // 格/秒；离开地图或命中后消失
    projectileRadius: .035,
    // 小批次可重叠；击杀数或推进比例满足任意一项就接下一批。
    batches: [
      {enemies:{normal:4}, trigger:{kills:3,progress:.6}},
      {enemies:{normal:6}, trigger:{kills:4,progress:.6}},
      {enemies:{normal:8}, trigger:{kills:5,progress:.6}},
      {enemies:{normal:10}, trigger:{kills:7,progress:.6}},
      {assault:true,enemies:{normal:18,heavy:2}}
    ]
  },
  // 各级 cost 为总占用；升级按钮显示追加占用。

  buildings: {
    miner: {
      name:'采矿机', kind:'miner', color:'#54c9bd', icon:'◈', sprite:'miner',
      desc:'连接周围 2 格晶矿，扩展魔力容量', coverage:2, buildCooldown:5,
      levels:[{cost:0,hp:180}]
    },
    gun: {
      name:'普通炮塔', kind:'tower', color:'#72b8fb', icon:'⌖', sprite:'gun',
      buildCooldown:5, desc:'单管 → 双管 → 四管齐射', attack:'single', turnSpeed:6.283185307179586,
      levels:[
        {cost:25,hp:180,damage:60,cool:1,range:4,projectiles:1,muzzleForward:.53,muzzleOffsets:[0],head:{src:'assets/gun-level-1-v1.png',pivot:[.426,.507]}},
        {cost:45,hp:180,damage:60,cool:1,range:4.35,projectiles:2,muzzleForward:.68,muzzleOffsets:[-.12,.12]},
        {cost:75,hp:180,damage:60,cool:1,range:4.7,projectiles:4,muzzleForward:.67,muzzleOffsets:[-.225,-.068,.086,.236],head:{src:'assets/gun-level-3-v2.png',pivot:[.355,.492]}}
      ]
    },
    cannon: {
      name:'爆破塔', kind:'tower', color:'#d4a3fc', icon:'✹', sprite:'cannon',
      buildCooldown:5, desc:'主目标直击 · 3×3 格溅射', attack:'splash', blastSize:3, turnSpeed:6.283185307179586,
      levels:[
        {cost:55,hp:180,damage:120,splashDamage:30,cool:1,range:4.7},
        {cost:90,hp:180,damage:240,splashDamage:60,cool:1,range:5.05},
        {cost:145,hp:180,damage:360,splashDamage:90,cool:1,range:5.4}
      ]
    },
    slow: {
      name:'减速塔', kind:'tower', color:'#83dfeb', icon:'❄', sprite:'slow',
      buildCooldown:10, desc:'减速 50% · 不叠加', attack:'single', slowFactor:.5, slowDuration:1.8, turnSpeed:6.283185307179586,
      levels:[
        {cost:35,hp:180,damage:12,cool:1,range:3.6},
        {cost:60,hp:180,damage:24,cool:1,range:3.95},
        {cost:95,hp:180,damage:36,cool:1,range:4.3}
      ]
    },
    wall: {
      name:'道路阻拦', kind:'wall', color:'#e6b96a', icon:'▥', sprite:'wall',
      buildCooldown:20, desc:'仅道路 · 敌人停下并攻击设施', healOnUpgrade:true,
      levels:[{cost:15,hp:4000},{cost:25,hp:4140},{cost:45,hp:4280}]
    }
  },
  enemies: {
    normal: {
      name:'普通敌人', hp:200,
      speed:1.15,
      wallDps:100, baseDamage:1,
      sprite:'bug', spriteSize:35, radius:9, color:'#b4514e', highlight:'#e49775', mouth:'#783f38'
    },
    heavy: {
      name:'重甲敌人', hp:570,
      speed:1.15,
      wallDps:25, baseDamage:1,
      sprite:'heavy', spriteSize:47, radius:13, color:'#aa7155', highlight:'#d6a575', mouth:'#704e3a'
    }
  }
};
