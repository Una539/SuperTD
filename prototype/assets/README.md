# 卡通俯视资产

文件：`forest-sprites-v1.png`，内置 imagegen 生成，RGBA 透明图集；按等分 3 × 3 格由 Canvas 和建造菜单共用。

从左至右：第一行速射塔、爆破塔、减速塔；第二行采矿机、道路阻拦、矿石；第三行普通敌人、重甲敌人、基地。

最终提示词：

```text
Use case: stylized-concept
Asset type: transparent sprite atlas used directly in a top-down cartoon tower defense game.
Create exactly nine simple flat cartoon game sprites on a transparent square canvas in an EXACT equal 3x3 grid. Each object centered within its own cell, generous empty padding 14% per side, no overlap.
Row 1: blue rapid fire gun turret pointing RIGHT; purple mortar cannon pointing RIGHT; cyan ice slowing turret.
Row 2: teal mining drill machine; tan wooden road barricade oriented horizontally; mint green crystal ore cluster.
Row 3: small red beetle monster facing RIGHT; large orange armored beetle monster facing RIGHT; small green-roof stone command base with tiny yellow flag.
Style: STRICT overhead bird's-eye view, looking straight down at every object. Simple playful cartoon, thick clean dark green outlines, broad flat color fills, only one shade per material, rounded chunky shapes. Instantly readable at 44 pixels. No isometric perspective, no visible front walls, no realistic detail, no painterly textures, no gradients. Distinct blue purple cyan tower colors; forest green brass supporting colors.
Constraints: genuine transparent background, no ground patches, no scenery, no drop shadows beyond object bounds, no text, no letters, no labels, no borders, no grid lines, no watermark. All sprites fully visible and isolated in respective equal cells.
```
