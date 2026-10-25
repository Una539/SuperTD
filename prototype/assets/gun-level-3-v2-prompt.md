# 四管炮塔透明背景修复

内置 imagegen 编辑 gun-level-3-v1.png，输出 gun-level-3-v2.png。新文件为独立上层，不再使用图集裁切，保留共用底座。

```text
Use case: background-extraction. Edit target: attached sprite atlas. Extract ONLY the blue FOUR-BARREL turret upper head in the BOTTOM LEFT cell. Delete every other object and delete ALL background, colored glow, haze, clouds and shadows. Outside the solid object silhouette must have alpha ZERO. Do NOT include any dark rectangular backdrop or dark fringe beyond the crisp outline. Preserve exactly FOUR parallel right-pointing barrels, the blue armor, brass ring, gray circular hub. Output a single square transparent PNG, one isolated object, no atlas. Place the circular rotation hub center at exactly image center. Keep generous transparent margins. No text, no ground, no new objects.
```
