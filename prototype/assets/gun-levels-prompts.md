# 普通炮塔升级资产

使用内置 imagegen，原 tower-layers-v2.png 作为风格参考。二级保留现有双管，不改原图。一级输出保存为 gun-level-1-v1.png；三级输出保存为 gun-level-3-v1.png，使用其左下格四管上层。

共同提示词：

```text
Use case: stylized-concept. Asset type: one transparent upper-head sprite for a cartoon overhead tower defense game. Input image is STYLE REFERENCE ONLY: match the blue-and-brass turret in the bottom-left cell, but output ONE isolated turret upper head only. Strict directly-overhead orthographic view, bold dark green outlines, simple blue metal armor, brass ring around gray circular rotation hub. NO foundation, no stone base, no other sprites, no text, no ground, no shadows, no glow. All outside pixels genuinely alpha zero. Square canvas. The center of the circular rotation hub MUST be at EXACT image center (50% width,50% height); barrels point horizontally RIGHT. Circular head radius around 20% image width; muzzle tips at 84% image width. Keep entire object inside the canvas with empty margins.
```

一级附加提示词：

```text
Primary request: LEVEL ONE variant, with EXACTLY ONE gun barrel emerging from hub to the right, centered vertically on the hub. Simple small blue head.
```

三级附加提示词：

```text
Primary request: LEVEL THREE variant, EXACTLY FOUR separate parallel blue gun barrels side by side emerging from hub to the RIGHT, all four visible from overhead, evenly spaced vertically at -13.5%, -4.5%, +4.5%, +13.5% image height relative to hub center. Count FOUR distinct muzzle tips. A beefier blue turret head but same circular hub and blue brass palette.
```
