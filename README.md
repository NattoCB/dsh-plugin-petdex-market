# DSH Petdex Market · 宠物市集插件

<p align="center">
  <img src="banner.png" alt="Petdex for DSH — Your desktop companion pet" width="100%" />
</p>

> **Working with DSH doesn't have to feel like staring at a console.** A
> **DeepSeek Harness (DSH)** plugin that brings **petdex** companion-pet
> feature to DSH: browse the live [petdex.dev](https://petdex.dev) catalog in the
> Settings UI, install / enable / rename / delete pets (single-active companion
> model), and render the active pet as a **floating desktop pet** that walks along
> the bottom of your screen, reacts to agent activity, and pops speech bubbles.
>
> 基于 petdex 的 **DSH（DeepSeek Harness）** 插件：在 Settings 界面浏览
> [petdex.dev](https://petdex.dev) 实时宠物市集，支持安装 / 启用 / 改名 / 删除（单活跃伙伴模型），
> 并把当前活跃宠物渲染为**桌面悬浮宠物**——沿屏幕底部行走、响应 agent 工作状态、弹出对话气泡。

## 为什么需要一只宠物 / Why a pet

Agent 在工作时，你只能盯着状态栏的数字猜「它在忙什么」。这只宠物把工作状态变成了看得见、摸得着的存在：
思考时它奔跑、回复落地时它挥手并弹出气泡、空闲时它打盹——你的工作台有了一座「活」的脉搏。
When your agent works, the pet runs; when a reply lands, it waves and pops a
speech bubble; when idle, it naps — a living pulse on your desktop instead of
a silent progress bar.

---

## Features · 功能

- **Marketplace** · 市集：search, pagination, live catalog (4,500+ pets)；
  搜索、分页、实时目录（4500+ 只宠物）
- **Desktop pet renderer** · 桌面渲染：transparent, always-on-top native window
  (Swift/AppKit)；透明置顶原生窗口（Swift/AppKit）
  - walks across the bottom of the screen, bounces at margins, drag to move；
    沿屏幕底部行走、边缘折返、可拖拽
  - `liveliness` controls the walk/pause duty cycle (calm ↔ lively)；
    `liveliness` 控制行走/休息占空比（安静 ↔ 活跃）
  - `pet size` scales 40%–250% with exact aspect ratio；`尺寸` 40%–250% 等比缩放
  - runs while the agent works; waves + pops a **speech bubble** when a reply lands
    (bubble toggleable)；agent 工作时奔跑，回复落地时挥手 + **气泡**（可关闭）
- **Same-origin sprite proxy** · 同源贴图代理：no CORS issues in the WebView

## Install · 安装

> Prerequisites: a working DSH with a `web` profile. · 前置：可用的 DSH 及 `web` profile。

One-line install · 一条命令安装:

```bash
dsh plugin --profile web add github:NattoCB/dsh-plugin-petdex-market
```

1. Get the plugin · 获取插件（本仓库或打包 tgz）:

   ```bash
   git clone <this-repo> dsh-plugin-petdex-market
   ```

2. Register it in the web profile · 注册进 web profile
   (edit `~/.dsh/profiles/web/package.json`)：

   ```json
   {
     "dependencies": {
       "@jasper/dsh-plugin-petdex-market": "file:/path/to/dsh-plugin-petdex-market"
     },
     "dsh": {
       "profile": {
         "bundles": [
           "@deepseek-ai/dsh-base",
           "@deepseek-ai/dsh-web-app",
           "@jasper/dsh-plugin-petdex-market"
         ]
       }
     }
   }
   ```

   Then link it into the profile · 然后链接进 profile：

   ```bash
   dsh plugin --profile web add /path/to/dsh-plugin-petdex-market
   # (equivalent manual fallback: symlink it under
   #  ~/.dsh/profiles/web/node_modules/@jasper/dsh-plugin-petdex-market)
   ```

3. Enable in `~/.dsh/settings.yaml` · 在 settings.yaml 启用：

   ```yaml
   petdex-market:
     enabled: true
     desktopEnabled: true   # render the desktop pet · 渲染桌面宠物
     petScale: 1            # 0.4 – 2.5
     petLiveliness: 0.6     # 0 (calm) – 1 (lively)
     bubbleEnabled: true
   ```

4. Restart `dsh web`. The **Petdex** tab appears under Settings. · 重启 `dsh web`，Settings 出现 **Petdex** 标签页。

## Configuration · 配置

| Key · 键 | Type · 类型 | Default · 默认 | Meaning · 含义 |
|---|---|---|---|
| `petdex-market.enabled` | bool | `false` | master switch for the whole plugin · 插件总开关 |
| `petdex-market.desktopEnabled` | bool | `true` | render the floating desktop pet · 渲染桌面悬浮宠物 |
| `petdex-market.petScale` | number | `1` | render scale, clamped 0.4–2.5 · 渲染倍率（0.4–2.5） |
| `petdex-market.petLiveliness` | number | `0.6` | walk/pause duty cycle, 0–1 · 行走活跃度（0–1） |
| `petdex-market.bubbleEnabled` | bool | `true` | speech bubble on session reply · 回复时弹气泡 |
| `petdex-market.pageSize` | number | `48` | market page size · 市集分页大小 |
| `petdex-market.manifestTtlMs` | number | `300000` | catalog manifest cache (ms) · 目录缓存 |
| `petdex-market.metaTtlMs` | number | `1800000` | per-pet metadata cache (ms) · 元数据缓存 |
| `petdex-market.spriteTtlMs` | number | `600000` | proxied sprite cache (ms) · 贴图代理缓存 |

Installed pets live under `petdex-market.pets` (auto-managed). All settings
hot-reload — no restart needed for config edits.
已安装宠物存于 `petdex-market.pets`（自动管理）。所有配置热加载，无需重启。

## HTTP API · 接口

| Route · 路由 | Method | Purpose · 用途 |
|---|---|---|
| `/petdex-market/market?q=&offset=&limit=` | GET | paginated + filtered catalog · 分页过滤目录 |
| `/petdex-market/pets` | GET | installed pets + desktop prefs · 已装宠物 + 桌面配置 |
| `/petdex-market/pets` | POST | install `{slug}` (becomes active) · 安装（成为活跃） |
| `/petdex-market/pets/<id>` | PATCH | `{enabled, buddyName}` (single-active) · 启用/改名 |
| `/petdex-market/pets/<id>` | DELETE | remove · 删除 |
| `/petdex-market/desktop` | GET | renderer config (pet + geometry + prefs + activity) · 渲染器配置 |
| `/petdex-market/desktop` | POST | `{enabled, scale, liveliness, bubbleEnabled}` · 更新桌面配置 |
| `/petdex-market/sprite/<slug>` | GET | same-origin market sprite proxy · 同源市集贴图 |
| `/petdex-market/installed/<id>/sprite` | GET | same-origin installed sprite proxy · 同源已装贴图 |
| `/petdex-market/meta/<slug>` | GET | pet.json metadata · 宠物元数据 |
| `/petdex-market/cache` | POST | flush in-memory caches · 清缓存 |

## Build · 构建

Only needed when changing the client UI or the native renderer. · 仅在改动前端 UI 或原生渲染器时需要。

```bash
# 1. client bundle (esbuild, temporary dev dependency)
npm i -D esbuild
node build-client.mjs          # writes client/client.js

# 2. native macOS renderer (requires Xcode Command Line Tools)
swiftc -O renderer/main.swift -o petdex-renderer
```

## Architecture · 架构

```
dsh-plugin-petdex-market/
├── src/
│   ├── index.js        # server: settings namespace, /petdex-market API,
│   │                   #   single-active enforcement, session/event → pet states,
│   │                   #   renderer process lifecycle (spawn/kill/watchdog)
│   └── petdex.js       # petdex.dev client lib (manifest, meta normalize, sprite cache)
├── renderer/main.swift # native macOS pet window (transparent, always-on-top,
│                       #   walker, drag, bubble, right-click menu)
├── client_src.tsx      # Settings tab component
├── client/client.js    # esbuild output, loaded via window.__ModuleLoader__
├── cordis.patch.yml    # bundle registration (settings + sessions injection)
└── build-client.mjs    # client bundling script
```

The server subscribes to DSH `session/event` (user message → pet `run`;
assistant reply → pet `wave` + bubble) and exposes the latest activity in
`GET /petdex-market/desktop`; the renderer polls it every 2 s.
服务端订阅 DSH `session/event`（用户消息 → 宠物 `run`；助手回复 → `wave` + 气泡），
通过 `GET /petdex-market/desktop` 暴露最新活动状态；渲染器每 2 秒轮询。

## Credits · 致谢

Pet artwork and catalog by [petdex.dev](https://petdex.dev) and their community.
宠物素材与目录来自 [petdex.dev](https://petdex.dev) 及其社区。

---

**领一只回去 / Try it:** 一行安装、重启，然后在 Settings 的 **Petdex** 页签挑一只陪你工作的伙伴。
发现渲染器或市集的问题？[提 issue](https://github.com/NattoCB/dsh-plugin-petdex-market/issues)。
Install with one line, restart, and pick a companion from the **Petdex** tab. Bugs or ideas? [Open an issue](https://github.com/NattoCB/dsh-plugin-petdex-market/issues).
