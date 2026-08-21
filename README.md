# DSH Petdex Market · 宠物市集插件

<!-- Hero -->
<div align="center">
  <b style="font-size: 1.15em;">在 DSH Settings 里逛 petdex.dev 实时市集，装一只桌面宠物陪 agent 干活。</b><br />
  <span style="color:#666">A petdex.dev companion-pet market in DSH Settings, with a native macOS desktop pet.</span><br /><br />
  <a href="LICENSE"><img alt="License" src="https://img.shields.io/badge/License-MIT-yellow.svg" /></a>
  <img alt="Version" src="https://img.shields.io/badge/version-0.1.0-blue" />
  <img alt="Platform" src="https://img.shields.io/badge/platform-macOS-lightgrey" /><br /><br />
  <img alt="桌面宠物" src="https://img.shields.io/badge/-桌面宠物-4d6bfe" />
  <img alt="宠物市集" src="https://img.shields.io/badge/-宠物市集-4d6bfe" />
  <img alt="petdex.dev" src="https://img.shields.io/badge/-petdex.dev-4d6bfe" />
  <img alt="Settings集成" src="https://img.shields.io/badge/-Settings集成-4d6bfe" />
  <img alt="Swift/AppKit" src="https://img.shields.io/badge/-Swift/AppKit-4d6bfe" /><br /><br />
  <a href="https://awesome-dsh-plugin.com"><img src="https://awesome-dsh-plugin.com/badge.svg" alt="awesome · DSH 插件" /></a><br /><br />
  <b>接入面</b> —— Settings 页签（<code>settings.section</code> slot）· <code>petdex-market</code> settings 命名空间 · <code>/petdex-market/*</code> HTTP API
</div>

> 一个 **DSH（DeepSeek Harness）** 插件：在 Settings 的 **Petdex** 页签浏览 [petdex.dev](https://petdex.dev) 实时市集，
> 安装 / 启用 / 改名 / 删除宠物（单活跃伙伴模型），并把活跃宠物渲染为原生**桌面宠物**（Swift/AppKit 透明置顶窗口；
> agent 工作时奔跑，回复落地时挥手 + 气泡）。
> 数据流向：目录直连 petdex.dev（`/api/manifest` + `/api/pets/search`，约 4,500 只），贴图经服务端
> **同源代理**转发给 WebView 与渲染器（内存缓存可一键清空）。接入：一条命令
> `dsh plugin --profile web add github:NattoCB/dsh-plugin-petdex-market`，重启后 Settings 出现 **Petdex** 页签；渲染器每 2 秒轮询 `GET /petdex-market/desktop`。

## ✨ 功能一览 / Features

- 🛒 **实时市集 Market**：live catalog 直连 petdex.dev（`/api/manifest` + `/api/pets/search`，约 4,500 只）；按名称 / 种类 / 作者搜索、分页、5 种排序（curated / newest / most-liked / most-installed / alphabetical）。stats 排序首次请求在后台构建全量索引（60 只/页、并发 8、约 76 个请求），期间回退 manifest 顺序并标记 `sortReady: false`。
- 🐾 **宠物管理 Pets**：「安装」= 在 `petdex-market.pets` 持久化一条记录并托管其预览，不下载宠物文件；单活跃伙伴模型——启用一只自动禁用其余，安装即设为活跃，删除活跃宠物后自动切换下一只已启用宠物。
- 🖼️ **同源贴图代理 Sprite proxy**：市集与已装宠物的 spritesheet 全部经 `/petdex-market/sprite/<slug>`、`/petdex-market/installed/<id>/sprite` 服务端转发，WebView 预览无 CORS 问题；10 分钟 TTL 缓存，Settings 内一键清空。
- 🦎 **原生桌面宠物 Desktop pet**：`petdex-renderer`（Swift/AppKit）透明、无边框、置顶窗口，沿主屏幕底部自主行走、边缘折返、可拖拽（拖后冻结 3 秒）、右键菜单（禁用 / 重载 / 退出）；尺寸 0.4–2.5 倍等比缩放，`liveliness` 控制行走 / 休息占空比。
- 🏃 **感知 agent 工作状态 Activity**：订阅 DSH `session/event`——`turn/start` → 奔跑，`assistant/message` → 暂存气泡文本，`turn/end` → 挥手 + 弹一次气泡（多段回复只挥手一次，气泡截断至 120 字符）；渲染器每 2 秒轮询 `GET /petdex-market/desktop`。
- ⚙️ **配置热加载 Hot reload**：全部设置存于 `petdex-market` settings 命名空间（写入 settings.yaml），改动即时生效，无需重启；渲染器进程由服务端管理（spawn / kill，崩溃 2 秒后自动重启一次）。

## 📸 效果预览 / Preview

![Petdex for DSH — desktop companion pet](banner.png)

## 🚀 Quick Start

### 前置 / Prerequisites

- 可用的 DSH 及 `web` profile（a working DSH with a `web` profile）
- macOS（桌面渲染器为 Swift/AppKit 原生二进制）

### 安装 / Install

一行安装（one-line install）：

```bash
dsh plugin --profile web add github:NattoCB/dsh-plugin-petdex-market
```

本地路径安装（开发 / 离线）：

```bash
git clone <this-repo> dsh-plugin-petdex-market
```

在 `~/.dsh/profiles/web/package.json` 注册依赖与 bundle：

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

然后链进 profile：

```bash
dsh plugin --profile web add /path/to/dsh-plugin-petdex-market
# 手动等价方式：在 ~/.dsh/profiles/web/node_modules/@jasper/ 下 symlink
```

### 运行 / Run

在 `~/.dsh/settings.yaml` 启用：

```yaml
petdex-market:
  enabled: true
  desktopEnabled: true   # 渲染桌面宠物
  petScale: 1            # 0.4 – 2.5
  petLiveliness: 0.6     # 0 (calm) – 1 (lively)
  bubbleEnabled: true
```

重启 `dsh web`，Settings 出现 **Petdex** 页签——挑一只，开始干活。

## ⚙️ Configuration

| Key | Type | Default | Meaning · 含义 |
|:----|:-----|:--------|:--------|
| `petdex-market.enabled` | bool | `false` | 插件总开关 master switch |
| `petdex-market.desktopEnabled` | bool | `true` | 渲染桌面悬浮宠物 render desktop pet |
| `petdex-market.petScale` | number | `1` | 渲染倍率，0.4–2.5 render scale (clamped) |
| `petdex-market.petLiveliness` | number | `0.6` | 行走 / 休息占空比，0–1 walk/pause duty cycle |
| `petdex-market.bubbleEnabled` | bool | `true` | 回复时弹气泡 speech bubble on reply |
| `petdex-market.pageSize` | number | `48` | 市集分页大小 market page size |
| `petdex-market.manifestTtlMs` | number | `300000` | 目录 manifest 缓存（ms） |
| `petdex-market.metaTtlMs` | number | `1800000` | 宠物元数据缓存（ms） |
| `petdex-market.spriteTtlMs` | number | `600000` | 贴图代理缓存（ms） |

`pets` 与 `activePetId` 由插件自动管理（auto-managed）。全部配置热加载，修改无需重启。

## 🌐 HTTP API

| Route | Method | Purpose · 用途 |
|:------|:-------|:--------|
| `/petdex-market/market?q=&offset=&limit=&sort=` | GET | 分页 + 过滤 + 排序目录 |
| `/petdex-market/pets` | GET | 已装宠物 + 桌面配置 |
| `/petdex-market/pets` | POST | 安装 `{slug}`（成为活跃） |
| `/petdex-market/pets/<id>` | PATCH | `{enabled, buddyName}`（单活跃） |
| `/petdex-market/pets/<id>` | DELETE | 删除 |
| `/petdex-market/desktop` | GET | 渲染器配置（宠物 + 帧几何 + 偏好 + 活动状态） |
| `/petdex-market/desktop` | POST | `{enabled, scale, liveliness, bubbleEnabled}` |
| `/petdex-market/sprite/<slug>` | GET | 同源市集贴图代理 |
| `/petdex-market/installed/<id>/sprite` | GET | 同源已装贴图代理 |
| `/petdex-market/meta/<slug>` | GET | pet.json 元数据 |
| `/petdex-market/cache` | POST | 清空内存缓存 |

## 🔨 Build

仅在改动前端 UI 或原生渲染器时需要。

```bash
# 1. client bundle（esbuild，临时 dev dependency）
npm i -D esbuild
node build-client.mjs          # 写入 client/client.js（window.__ModuleLoader__ 加载）

# 2. 原生 macOS 渲染器（需要 Xcode Command Line Tools）
swiftc -O renderer/main.swift -o petdex-renderer
```

## 🧱 Architecture

```
dsh-plugin-petdex-market/
├── src/
│   ├── index.js        # server：settings 命名空间、/petdex-market API、
│   │                   #   单活跃约束、session/event → 宠物状态、
│   │                   #   渲染器进程生命周期（spawn/kill/watchdog）
│   └── petdex.js       # petdex.dev client（manifest、pet.json 归一化、目录索引、贴图缓存）
├── renderer/main.swift # 原生 macOS 宠物窗口（透明置顶、行走器、拖拽、气泡、右键菜单）
├── client_src.tsx      # Settings 页签组件
├── client/client.js    # esbuild 产物，window.__ModuleLoader__.load() 挂载 settings.section slot
├── cordis.patch.yml    # bundle 注册（settings + sessions 注入）
└── build-client.mjs    # client 打包脚本
```

服务端订阅 DSH `session/event`（用户消息 → 宠物 `run`；助手回复 → `wave` + 气泡），
通过 `GET /petdex-market/desktop` 暴露最新活动状态；渲染器每 2 秒轮询一次。

## Credits · 致谢

宠物素材与目录来自 [petdex.dev](https://petdex.dev) 及其社区。
Pet artwork and catalog by [petdex.dev](https://petdex.dev) and their community.

---

<div align="center">

[GitHub](https://github.com/NattoCB/dsh-plugin-petdex-market) · [Issues](https://github.com/NattoCB/dsh-plugin-petdex-market/issues) · [LICENSE](LICENSE) · MIT

</div>
