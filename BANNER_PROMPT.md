# GitHub Repo Banner — Image2 Prompt · 仓库 Banner 生成提示词

Target: horizontal social-card banner for a GitHub repository (≈ 1280×640,
GitHub social preview 640×320 minimum safe zone). Generate with an
image model that supports **image2image / text+logo overlay** (e.g. gpt-image-1,
Ideogram, Midjourney + upscale). Keep the title inside the center safe area.

目标：GitHub 仓库横版 banner（约 1280×640，社交预览最小安全区 640×320）。用支持
image2image / 文字叠加的模型生成（如 gpt-image-1、Ideogram、Midjourney+放大）。
标题文字保持在中央安全区内。

## Prompt (English)

```
Horizontal banner for a GitHub repository, 3:2 wide aspect, soft modern flat
illustration style, clean vector look with gentle gradients, rounded shapes,
plenty of negative space.

Subject: a cute pixel-art / chibi robot-pet hybrid mascot — a small round
beige-and-orange robot puppy with big glossy dark eyes, a tiny antenna with a
glowing heart-shaped tip, and a little satellite dish on its back. It stands on
the left third of the banner, mid-step walking pose, facing right, with a
semi-transparent speech bubble above its head containing a tiny heart icon.
Behind it, a faint dotted path trails across the banner like a walking route
(a small flag at the start and a tiny bone icon at the end), suggesting the
mascot roams freely across a desktop. Background: a calm dark indigo-to-teal
gradient with a subtle grid of faint pixel squares (like a desktop wallpaper)
and 2-3 small floating pet-card shapes (rounded squares with tiny pet sprites)
scattered on the right side.

Typography: large friendly rounded bold title "Petdex for DSH" centered or
slightly right-of-center, pure white with a soft teal glow; a smaller subtitle
line below it: "Your desktop companion pet · 你的桌面宠物伙伴" in light gray.
Style: cute, warm, approachable; thick 2px outlines around the mascot for
readability at small sizes; no photorealism, no 3D render.

Lighting: soft top-left light, subtle drop shadow under the mascot.
Negative prompt: text artifacts, watermark, photorealism, clutter, dark mood,
more than one mascot, cropped title.
```

## Prompt (中文版)

```
GitHub 仓库横版 banner，3:2 宽幅，柔和现代扁平插画风，干净矢量质感，柔和渐变，
圆角造型，大量留白。

主体：一只可爱的像素风/幼萌机器人宠物杂交吉祥物——圆滚滚的米色+橙色机器小狗，
大而闪亮的深色眼睛，头顶一根天线、顶端是一颗发光爱心，背上有一面小卫星锅。
它站在画面左侧三分之一处，迈步行走姿势，面朝右方，头顶上方有一个半透明对话气泡，
气泡里是一颗小爱心。它身后延伸出一条虚点行走轨迹横贯 banner（起点一面小旗、
终点一个小骨头图标），暗示吉祥物自由漫步在桌面上。背景：沉稳的靛蓝到青色的渐变，
叠加一层若隐若现的像素小方格网格（像桌面壁纸），右侧点缀 2–3 张悬浮的小宠物卡片
（圆角方块，内嵌迷你宠物贴图）。

文字：大号圆润粗体标题 "Petdex for DSH"，居中或略偏右，纯白色带柔和青色辉光；
下方一行小字副标题 "Your desktop companion pet · 你的桌面宠物伙伴"，浅灰色。
风格：可爱、温暖、亲和；吉祥物外圈 2px 描边保证小尺寸下可读；不要写实、不要 3D 渲染。

光照：左上方柔和光，吉祥物下方轻微投影。
负向提示：文字乱码、水印、写实、画面杂乱、阴沉、多于一只吉祥物、标题被裁切。
```

## Usage notes · 使用说明

1. Prefer 1:1.91 → 3:2 output; upscale to 1280×640. · 优先 1:1.91 → 3:2 输出，放大到 1280×640。
2. GitHub renders the social card at 640×320 — keep the title in the center band. · GitHub 社交卡片按 640×320 展示，标题保持在中央区域。
3. If the model cannot draw text reliably, generate the illustration alone and
   overlay the title with an image editor (text layer, rounded bold font).
   若模型文字生成不稳定，可先生成插画，再用图片编辑器叠加标题（圆润粗体文字图层）。
