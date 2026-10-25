# 分层炮塔提示词

使用内置 imagegen 生成；底座固定、上层独立旋转。

```text
Use case: stylized-concept
Asset type: layered modular sprites for a simple cartoon top-down tower defense game.
Create a transparent square atlas, EXACT equal 3x2 grid (three columns, two rows). Each cell same rectangular size, each object centered at exact cell center, object contained within central 65% of cell width and 70% of cell height.
Top row left: one universal tower foundation, gray-green square stone plinth with circular central steel bearing, four identical corner bolts, NO gun, perfectly fourfold symmetric.
Top row center: stationary mining machine seen STRICTLY FROM DIRECTLY ABOVE, fourfold rotational symmetry, square brass and teal housing, central round teal drill shaft descending VERTICALLY into ground (only circular top visible), four identical corner supports. NO sideways drill, no barrel, no tracks, no direction.
Top row right: simple horizontal wooden reinforced barricade.
Bottom row left: ONLY blue rapid-fire turret UPPER HEAD, round centered rotation hub with two blue gun barrels pointing RIGHT.
Bottom row center: ONLY purple mortar UPPER HEAD, round centered rotation hub with one thick short cannon barrel pointing RIGHT.
Bottom row right: ONLY cyan slowing turret UPPER HEAD, round centered rotation hub with crystalline emitter pointing RIGHT.
All three upper heads have rotation pivot at EXACT center of cell, extend barrel to right. No foundations, no plinths, no ground under upper heads: they are separate compositing layers.
Style: simple clean cartoon, strict overhead orthographic bird's-eye view, thick dark green outlines, flat colors with one shade, chunky readable at 44px. Cohesive forest green brass palette, blue purple cyan turret accents. No isometric angle, no text, no labels, no grid, no frames, no shadows, no watermark. Genuine transparent background.
```

后续内置 imagegen 编辑提示词：

```text
Use case: background-extraction. Edit this sprite atlas: remove ALL background, ALL colored clouds, ALL glow, ALL shadows. Outside the solid outlined six objects must be completely transparent alpha zero, including spaces between sprites. Preserve the six objects, their exact positions, colors, silhouettes and the 3-column 2-row layout unchanged. Flat clean isolated cutouts on truly transparent background, no ambient effects, no haze. Keep all object interiors solid opaque. Do not move or resize any object.
```
