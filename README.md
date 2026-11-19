# EduAIoT WeChat Sync

[中文说明](#中文说明)

Save videos, articles, photos, files and voice recordings on your phone with the **易度随手存** (Yidu Suishoucun) WeChat mini program or the iOS Shortcut — they appear in your vault automatically, with optional transcripts and summary notes.

## Features

| Feature | What it does |
| --- | --- |
| Video links | WeChat Channels, Bilibili, Douyin and more; video saved as attachment and embedded |
| Articles | Official Account articles / image posts as Markdown; images and embedded audio downloaded locally |
| Photos, files, recordings | Uploads from the mini program (photos, videos, PDF, Word, voice) saved as attachments |
| Transcripts | Optional: server-side speech-to-text; paragraphs with timestamps appended to the note |
| Summary notes | Optional: key points, analogies, highlights and keywords above the transcript |
| Category folders | Folders from the mini program; note (+ attachments) can move when summary reclassifies |
| Engagement stats | WeChat Channels likes / loves / shares / comments in frontmatter when available |
| Tidy structure | By month (`<folder>/2026-10/`); attachments in `附件/`; names like `20261026-001 Platform-Title.md` |

## Requirements

| Item | Notes |
| --- | --- |
| Account | Required — use the **易度随手存** WeChat mini program (WeChat login). No payment required |
| Obsidian | Desktop or mobile 1.4.0+ |

## Getting started

| Step | Action |
| --- | --- |
| 1 | Install and enable the plugin |
| 2 | Mini program → **设置** → copy the 6-digit bind code |
| 3 | Plugin settings → paste code → **立即绑定** |
| 4 | Save in the mini program; syncs in ~30s, or ribbon / command **立即同步** |

## Settings

| Setting | Description |
| --- | --- |
| Bind / Unbind | Link this vault to your mini program account (up to 3 devices) |
| Default folder | When the mini program does not specify one. Default: `易度随手存` |
| Auto transcript | Off by default; turn on after bind to generate transcripts for video / audio |
| Auto summary | Off by default; requires transcript; generates summary notes after transcription |
| Server URL (advanced) | Empty = official server; fill in if you self-host |
| Sync interval (advanced) | Seconds between checks (minimum 10) |

## Privacy

Needs network. Connects to:

| Destination | When |
| --- | --- |
| 易度随手存 sync server (`https://wechat-obsidian.eduaiot.com` or your URL) | Bind, poll new items, download uploads, report sync path |
| Content platform media servers (WeChat, Bilibili, Douyin, …) | Download videos, covers and images for saved links |

Does not read or upload other vault notes. No telemetry, no ads.

**What the sync server stores**

| Data | Retention |
| --- | --- |
| Account: WeChat OpenID and mini program settings | Until you stop using the service |
| Bound devices: name and last sync time | Until you remove the device in the mini program |
| Saved items: link, title, platform, text, transcript, summary, sync status, note path | Until you delete the item in the mini program |
| Uploaded photos, videos, documents | Deleted after vault sync; unsynced after 7 days |
| Voice recordings | 30 days (sharing); shared ones until share ends |
| Shares you create | Until expiry or cancel |
| Cover images | Deleted after 7 days |

## Contact

https://wechat-obsidian.eduaiot.com

| Mini program | WeChat |
| --- | --- |
| <img src="assets/miniprogram.jpg" width="180" alt="易度随手存 mini program"> | <img src="assets/wechat.png" width="180" alt="WeChat"> |

## Install / License

Manual: download `main.js` and `manifest.json` from [latest release](../../releases/latest) → `<vault>/.obsidian/plugins/eduaiot-wechat-sync/` → enable.

[MIT](LICENSE)

---

## 中文说明

用 **易度随手存** 小程序或 iPhone 快捷指令，在手机上保存视频、文章、照片、文件和录音，自动同步到 Obsidian；可选文字稿与概括。

### 功能

| 功能 | 做什么 |
| --- | --- |
| 视频链接 | 视频号、B 站、抖音等；视频存为附件并嵌入笔记 |
| 文章 | 公众号图文存为 Markdown；图片与文内音频下载到本地 |
| 照片、文件、录音 | 小程序上传的内容保存为附件 |
| 文字稿 | 可选：服务端转写，按段落与时间点写入笔记 |
| 概括 | 可选：要点、类比、亮点、关键词（在文字稿上方） |
| 分类目录 | 小程序设置目录；概括后可连同附件自动挪目录 |
| 互动数据 | 视频号点赞/喜欢/转发/评论写入 frontmatter（有数据时） |
| 目录整齐 | 按月分目录；附件在 `附件/`；文件名如 `20261026-001 平台-标题.md` |

### 前提

| 项 | 说明 |
| --- | --- |
| 账号 | 需要；配合微信小程序 **易度随手存**（微信登录）。目前不收费 |
| Obsidian | 电脑或手机 1.4.0+ |

### 开始使用

| 步骤 | 操作 |
| --- | --- |
| 1 | 安装并启用插件 |
| 2 | 小程序「设置」复制 6 位绑定码 |
| 3 | 插件设置粘贴 →「立即绑定」 |
| 4 | 小程序里保存；约 30 秒同步，或点侧栏 /「立即同步」 |

### 设置项

| 设置 | 说明 |
| --- | --- |
| 绑定 / 解除绑定 | 关联笔记库与小程序账号，最多 3 台设备 |
| 默认保存目录 | 小程序未指定时使用，默认「易度随手存」 |
| 自动转文字 | 默认关闭；绑定后可打开，为视频/录音生成文字稿 |
| 自动概括 | 默认关闭；依赖转文字，转完后生成概括 |
| 服务器地址（高级） | 留空用官方；自建则填写 |
| 同步间隔（高级） | 检查间隔秒数，最小 10 |

### 隐私

需要联网：

| 去向 | 何时 |
| --- | --- |
| 易度随手存同步服务器 | 绑定、拉取、下载上传文件、回报保存路径 |
| 内容平台媒体服务器 | 下载视频、封面、图片 |

不读不传库内其他笔记。无统计、无广告。

**同步服务器保存的数据**

| 数据 | 保留时间 |
| --- | --- |
| 账号：微信 OpenID 与小程序设置 | 直到停止使用 |
| 已绑定设备：名称与最近同步时间 | 直到在小程序解除 |
| 保存内容：链接、标题、正文、文字稿、概括、同步状态、笔记路径 | 直到在小程序删除 |
| 上传的照片、视频、文档 | 同步后删除；7 天未同步也会删 |
| 录音 | 保留 30 天；分享中的保留到分享结束 |
| 你创建的分享 | 直到过期或取消 |
| 封面图 | 7 天后删除 |

### 联系 / 安装 / 许可

官网：https://wechat-obsidian.eduaiot.com

| 小程序 | 个人微信 |
| --- | --- |
| <img src="assets/miniprogram.jpg" width="180" alt="易度随手存小程序码"> | <img src="assets/wechat.png" width="180" alt="个人微信"> |

手动安装：从 [最新版本](../../releases/latest) 下载 `main.js`、`manifest.json` 到 `笔记库/.obsidian/plugins/eduaiot-wechat-sync/` 后启用。

[MIT](LICENSE)
