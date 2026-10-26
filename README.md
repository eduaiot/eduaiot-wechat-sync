# EduAIoT WeChat Sync

[中文说明](#中文说明)

Save videos, articles, photos, files and voice recordings on your phone with the **易度随手存** (Yidu Suishoucun) WeChat mini program or the iOS Shortcut, and they appear in your vault automatically — with transcripts and AI notes.

## Features

- **Video links**: WeChat Channels, Bilibili, Douyin and more. The video file is saved as an attachment and embedded in the note.
- **Articles**: WeChat Official Account articles and image posts are saved as Markdown, with images downloaded locally.
- **Photos, files and recordings**: anything uploaded from the mini program (photos, videos, PDF, Word, voice recordings) is saved as an attachment.
- **Transcripts**: videos and recordings are transcribed on the server; the transcript is appended to the note, grouped into paragraphs with timestamps.
- **AI notes**: an optional summary with key points, analogies, highlights and keywords is inserted above the transcript.
- **Category folders**: set up folders such as `English` or `Math` in the mini program. New items go to the matching folder, and the note is moved (together with its attachments) if the AI later decides it belongs elsewhere.
- **Tidy structure**: notes are grouped by month (`<folder>/2026-10/`), attachments are stored in `附件/` next to the note, and files are named `20261026-001 Platform-Title.md`.

## Requirements

- **An account is required.** The plugin only works together with the **易度随手存 (Yidu Suishoucun)** WeChat mini program, which you sign in to with your WeChat account. No payment is required.
- Desktop or mobile Obsidian 1.4.0 or later.

## Getting started

1. Install and enable the plugin.
2. In the mini program, open **设置 (Settings)** and copy the 6-digit bind code.
3. In the plugin settings, paste the code and click **立即绑定 (Bind)**.
4. Save something in the mini program. It is synced to your vault within about 30 seconds, or immediately via the ribbon icon or the command **EduAIoT WeChat Sync: 立即同步 (Sync now)**.

## Settings

| Setting | Description |
| --- | --- |
| Bind / Unbind | Links this vault to your mini program account. You can bind up to 3 devices. |
| Default folder | Used when the mini program does not specify a folder. Default: `易度随手存`. |
| Server URL (advanced) | Leave empty to use the official server. Fill in your own address if you self-host the backend. |
| Sync interval (advanced) | How often to check for new items, in seconds (minimum 10). |

## Network use and privacy

This plugin needs a network connection to work. It connects to two kinds of remote services:

1. **The 易度随手存 sync server**, `https://wechat-obsidian.eduaiot.com` by default, or the server URL you set in the advanced settings. It is needed to receive the items you save on your phone. The plugin:
   - sends the bind code and a device name (system type and vault name, for example `Mac · My Vault`) when you bind;
   - checks for new items at the sync interval (every 30 seconds by default), using the device token received at binding;
   - downloads the files you uploaded in the mini program;
   - reports each item's sync result and the note's path in your vault, so the mini program can show where it was saved.
2. **The media servers of the content platforms** you saved links from (for example WeChat, Bilibili and Douyin). They are needed to download the videos, covers and images of those links.

The plugin does not read or upload any other notes or files in your vault, and it contains no client-side telemetry or ads.

**What the sync server stores**

| Data | Retention |
| --- | --- |
| Your account: WeChat OpenID and your mini program settings | Until you stop using the service |
| Bound devices: device name and last sync time | Until you remove the device in the mini program |
| Saved items: link, title, platform, article text, transcript, AI notes, sync status and note path | Until you delete the item in the mini program |
| Uploaded files (photos, videos, recordings, documents) | Deleted after they are synced to your vault; unsynced files are deleted after 7 days |
| Cover images | Deleted after 7 days |

## Manual installation

Download `main.js` and `manifest.json` from the [latest release](../../releases/latest) and copy them into `<your vault>/.obsidian/plugins/eduaiot-wechat-sync/`, then enable the plugin in **Settings → Community plugins**.

## License

[MIT](LICENSE)

---

## 中文说明

在手机上用 **易度随手存** 微信小程序或 iPhone 快捷指令保存视频、文章、照片、文件和录音，内容会自动同步到你的 Obsidian 笔记库，并附带文字稿和 AI 笔记。

### 功能

- **视频链接**：支持视频号、B 站、抖音等。视频保存为附件并插入笔记。
- **文章**：公众号文章和图片帖保存为 Markdown，图片下载到本地。
- **照片、文件和录音**：小程序里上传的照片、视频、PDF、Word、录音都会保存为附件。
- **文字稿**：视频和录音在服务器上转成文字，按段落和时间点追加到笔记里。
- **AI 笔记**：可选。在文字稿上方插入一句话总结、核心内容、类比拆解、亮点和关键词。
- **分类目录**：在小程序里设置「英语」「数学」等分类目录，新内容自动放进对应目录。AI 总结后如果判断属于别的分类，会把笔记连同附件一起移过去。
- **目录整齐**：按月份分子目录（`目录/2026-10/`），附件放在笔记旁边的 `附件/` 里，文件名形如 `20261026-001 平台-标题.md`。

### 使用前提

- **需要账号。** 插件必须配合微信小程序 **易度随手存** 使用，小程序用微信账号登录。目前不收费。
- Obsidian 1.4.0 及以上版本，电脑和手机都可以用。

### 开始使用

1. 安装并启用插件。
2. 在小程序「设置」页复制 6 位绑定码。
3. 在插件设置里粘贴绑定码，点「立即绑定」。
4. 在小程序里保存内容，大约 30 秒内会同步到笔记库；也可以点左侧边栏图标或执行命令「EduAIoT WeChat Sync: 立即同步」马上同步。

### 设置项

| 设置 | 说明 |
| --- | --- |
| 绑定 / 解除绑定 | 把这个笔记库和你的小程序账号关联，最多绑定 3 台设备 |
| 默认保存目录 | 小程序没有指定目录时使用，默认「易度随手存」 |
| 服务器地址（高级） | 留空使用官方服务器；自己部署了后端时填写自己的地址 |
| 同步间隔（高级） | 多少秒检查一次新内容，最小 10 秒 |

### 网络使用与隐私

插件需要联网才能工作，会连接两类远程服务：

1. **易度随手存同步服务器**：默认 `https://wechat-obsidian.eduaiot.com`，或你在高级设置里填写的地址，用来接收你在手机上保存的内容。插件会：
   - 绑定时发送绑定码和设备名称（系统类型加笔记库名称，例如 `Mac · 我的笔记`）；
   - 用绑定时获得的设备令牌，按同步间隔（默认 30 秒）检查新内容；
   - 下载你在小程序里上传的文件；
   - 回报每条内容的同步结果和笔记在库里的路径，方便在小程序里查看保存位置。
2. **你保存的链接所属平台的媒体服务器**（如微信、B 站、抖音）：用来下载这些链接的视频、封面和图片。

插件不会读取或上传笔记库里的其他笔记和文件，也没有任何客户端统计、埋点或广告。

**同步服务器保存的数据**

| 数据 | 保留时间 |
| --- | --- |
| 账号：微信 OpenID 和你在小程序里的设置 | 直到你停止使用服务 |
| 已绑定的设备：设备名称和最近同步时间 | 直到你在小程序里解除这台设备 |
| 保存的内容：链接、标题、平台、图文正文、文字稿、AI 笔记、同步状态和笔记路径 | 直到你在小程序里删除这条记录 |
| 上传的文件（照片、视频、录音、文档） | 同步到笔记库后删除；7 天内未同步的也会删除 |
| 封面图 | 7 天后删除 |

### 手动安装

从 [最新版本](../../releases/latest) 下载 `main.js` 和 `manifest.json`，放进 `你的笔记库/.obsidian/plugins/eduaiot-wechat-sync/`，然后在「设置 → 第三方插件」里启用。

### 许可证

[MIT](LICENSE)
