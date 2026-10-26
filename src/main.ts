import { App, Notice, Platform, Plugin, PluginSettingTab, Setting, TFile, TFolder, moment, normalizePath, requestUrl } from 'obsidian';
import { hasSection, insertBlock } from './md-headings';

interface Settings {
  serverUrl: string;
  deviceToken: string;
  deviceName: string;
  folder: string;
  intervalSec: number;
}

interface InboxItem {
  id: string;
  text: string;
  video_url: string;
  content?: string;
  images?: string[];
  cover_url: string;
  title: string;
  platform: string;
  author: string;
  kind?: 'image' | 'video' | 'audio' | 'file';
  file_name?: string;
  file_ext?: string;
  options: { saveVideo: boolean; saveCover: boolean; folder: string };
  move?: { from: string; to: string; delivered: boolean };
  asr?: { status: string; text: string; segments: Segment[]; delivered: boolean };
  summary?: { status: string; data: Summary | null; delivered: boolean };
  status: string;
  path: string;
  createdAt: number;
}

interface Segment {
  start: number;
  end: number;
  text: string;
  spk?: number | null;
}

const MOBILE_UA = 'Mozilla/5.0 (iPhone; CPU iPhone OS 17_0 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Mobile/15E148';
const REFERERS: Record<string, string> = {
  'qpic.cn': 'https://mp.weixin.qq.com/',
  bilivideo: 'https://www.bilibili.com/',
  douyin: 'https://www.douyin.com/',
  xhscdn: 'https://www.xiaohongshu.com/',
  kwai: 'https://www.kuaishou.com/',
  yximgs: 'https://www.kuaishou.com/'
};

function mediaHeaders(url: string): Record<string, string>[] {
  const host = (() => {
    try {
      return new URL(url).hostname;
    } catch {
      return '';
    }
  })();
  const key = Object.keys(REFERERS).find((k) => host.includes(k));
  const list: Record<string, string>[] = [{}, { 'User-Agent': MOBILE_UA }];
  if (key) list.unshift({ 'User-Agent': MOBILE_UA, Referer: REFERERS[key] });
  return list;
}

function clock(ms: number) {
  const s = Math.floor(ms / 1000);
  const hh = Math.floor(s / 3600);
  const mm = String(Math.floor((s % 3600) / 60)).padStart(2, '0');
  const ss = String(s % 60).padStart(2, '0');
  return hh ? `${hh}:${mm}:${ss}` : `${mm}:${ss}`;
}

interface Paragraph {
  start: number;
  spk?: number | null;
  text: string;
}

function paragraphs(segs: Segment[]): Paragraph[] {
  const result: Paragraph[] = [];
  let cur: Paragraph | null = null;
  let lastEnd = 0;
  for (const s of segs) {
    const breakBefore = cur && (s.spk !== cur.spk || s.start - lastEnd > 2000);
    if (!cur || breakBefore) {
      cur = { start: s.start, spk: s.spk, text: '' };
      result.push(cur);
    }
    cur.text += s.text;
    lastEnd = s.end;
    const len = cur.text.length;
    if ((/[。！？!?]$/.test(s.text) && len >= 60) || len >= 160) cur = null;
  }
  return result;
}

interface Summary {
  summary: string;
  key_points: string[];
  analogies: { concept: string; analogy: string; relation: string }[];
  highlights: string[];
  keywords: string[];
}

const cell = (s: string) => s.replace(/\|/g, '｜').replace(/\n/g, ' ');

function summaryMarkdown(s: Summary) {
  const out = ['', '## AI 笔记', ''];
  if (s.summary) out.push(`> ${s.summary}`, '');
  if (s.key_points?.length) out.push('### 核心内容', '', ...s.key_points.map((p) => `- ${p}`), '');
  if (s.analogies?.length) {
    out.push('### 核心类比拆解', '', '| 概念 | 生活类比 | 对应关系 |', '| --- | --- | --- |');
    out.push(...s.analogies.map((a) => `| ${cell(a.concept)} | ${cell(a.analogy)} | ${cell(a.relation)} |`), '');
  }
  if (s.highlights?.length) out.push('### 亮点', '', ...s.highlights.map((h) => `- ${h}`), '');
  const tags = (s.keywords || []).map((k) => k.replace(/[\s#,，、。.]+/g, '')).filter(Boolean);
  if (tags.length) out.push(`关键词：${tags.map((t) => `#${t}`).join(' ')}`, '');
  return out.join('\n');
}

function insertSummary(content: string, block: string) {
  if (hasSection(content, 'AI 笔记')) return content;
  return insertBlock(content, block, '文字稿');
}

function transcriptMarkdown(asr: NonNullable<InboxItem['asr']>) {
  const segs = asr.segments || [];
  const speakers = new Set(segs.map((s) => s.spk).filter((s) => s !== null && s !== undefined));
  const blocks = segs.length
    ? paragraphs(segs).map((p) => {
        const who = speakers.size > 1 && p.spk !== null && p.spk !== undefined ? `**说话人${Number(p.spk) + 1}** ` : '';
        return `${who}\`${clock(p.start)}\` ${p.text}`;
      })
    : [asr.text];
  return ['', '## 文字稿', '', blocks.join('\n\n'), ''].join('\n');
}

const OFFICIAL_SERVER = 'https://wechat-obsidian.eduaiot.com';

const DEFAULT_SETTINGS: Settings = {
  serverUrl: '',
  deviceToken: '',
  deviceName: '',
  folder: '易度随手存',
  intervalSec: 30
};

function trimSlash(url: string) {
  return url.trim().replace(/\/+$/, '');
}

function shortTitle(title: string) {
  const name = title
    .replace(/#\S+/g, ' ')
    .replace(/[\p{Extended_Pictographic}\u{1F1E6}-\u{1F1FF}\uFE0F\u200D\u20E3]/gu, '')
    .replace(/[\\/:*?"<>|^\[\]{}()（）【】《》「」“”‘’'`~!！@$%&=+;；，,。.、?？\s]+/g, '')
    .slice(0, 20);
  return name || '未命名视频';
}

function deviceName(vault: string) {
  const system = Platform.isIosApp
    ? 'iOS'
    : Platform.isAndroidApp
      ? 'Android'
      : Platform.isMacOS
        ? 'Mac'
        : Platform.isWin
          ? 'Windows'
          : Platform.isLinux
            ? 'Linux'
            : '';
  return [system, vault].filter(Boolean).join(' · ');
}

export default class EduaiotWechatSyncPlugin extends Plugin {
  settings!: Settings;
  private timer: number | null = null;
  private syncing = false;
  private imported = new Map<string, string>();

  async onload() {
    this.settings = Object.assign({}, DEFAULT_SETTINGS, await this.loadData());
    if (this.settings.folder === '微信视频') {
      this.settings.folder = DEFAULT_SETTINGS.folder;
      await this.saveData(this.settings);
    }
    this.addSettingTab(new SettingTab(this.app, this));
    this.addCommand({ id: 'sync-now', name: '立即同步', callback: () => this.sync(true) });
    this.addRibbonIcon('video', '立即同步易度随手存', () => this.sync(true));
    this.app.workspace.onLayoutReady(() => {
      this.sync();
      this.restartTimer();
    });
  }

  async saveSettings() {
    await this.saveData(this.settings);
    this.restartTimer();
  }

  restartTimer() {
    if (this.timer !== null) window.clearInterval(this.timer);
    const sec = Math.max(10, this.settings.intervalSec || DEFAULT_SETTINGS.intervalSec);
    this.timer = this.registerInterval(window.setInterval(() => this.sync(), sec * 1000));
  }

  private get base() {
    return trimSlash(this.settings.serverUrl || OFFICIAL_SERVER);
  }

  private get headers() {
    return { Authorization: `Bearer ${this.settings.deviceToken}` };
  }

  async bind(code: string) {
    const name = deviceName(this.app.vault.getName());
    const res = await requestUrl({
      url: `${this.base}/api/bind`,
      method: 'POST',
      contentType: 'application/json',
      body: JSON.stringify({ code: code.trim(), name }),
      throw: false
    });
    if (res.json?.retcode !== 200) throw new Error(res.json?.msg || `绑定失败（${res.status}）`);
    this.settings.deviceToken = res.json.data.token;
    this.settings.deviceName = res.json.data.name;
    await this.saveSettings();
    this.sync();
  }

  async unbind() {
    this.settings.deviceToken = '';
    this.settings.deviceName = '';
    await this.saveSettings();
  }

  private async report(id: string, action: 'done' | 'fail' | 'asr-delivered' | 'summary-delivered' | 'moved', body: Record<string, unknown> = {}) {
    await requestUrl({
      url: `${this.base}/api/items/${id}/${action}`,
      method: 'POST',
      contentType: 'application/json',
      headers: this.headers,
      body: JSON.stringify(body)
    });
  }

  async sync(manual = false) {
    if (this.syncing) return;
    if (!this.base || !this.settings.deviceToken) {
      if (manual) new Notice('请先在插件设置里绑定手机');
      return;
    }
    this.syncing = true;
    try {
      const res = await requestUrl({ url: `${this.base}/api/pull`, headers: this.headers, throw: false });
      if (res.status === 401) {
        await this.unbind();
        new Notice('手机端已解除绑定，请重新绑定');
        return;
      }
      if (res.status >= 400) throw new Error(res.json?.msg || `HTTP ${res.status}`);
      const items: InboxItem[] = res.json?.data ?? [];
      let count = 0;
      let transcripts = 0;
      let summaries = 0;
      let moved = 0;
      for (const item of items) {
        if (item.status !== 'wait') {
          try {
            if (item.move && !item.move.delivered) {
              const path = await this.moveItem(item);
              if (path !== item.path) moved++;
              item.path = path;
              await this.report(item.id, 'moved', { path });
            }
            if (item.asr?.status === 'ok' && !item.asr.delivered) {
              if (await this.appendTranscript(item)) transcripts++;
              await this.report(item.id, 'asr-delivered');
            }
            if (item.summary?.status === 'ok' && item.summary.data && !item.summary.delivered) {
              if (await this.addSummary(item)) summaries++;
              await this.report(item.id, 'summary-delivered');
            }
          } catch (e) {
            console.error('[eduaiot-wechat-sync] 补充内容失败', item, e);
          }
          continue;
        }
        try {
          let path = this.imported.get(item.id);
          if (!path) {
            path = await this.importItem(item);
            this.imported.set(item.id, path);
            count++;
          }
          await this.report(item.id, 'done', {
            path,
            asrDelivered: item.asr?.status === 'ok',
            summaryDelivered: item.summary?.status === 'ok' && !!item.summary.data
          });
        } catch (e) {
          console.error('[eduaiot-wechat-sync] 导入失败', item, e);
          await this.report(item.id, 'fail', { reason: (e as Error).message || '导入失败' }).catch(() => {});
        }
      }
      if (count) new Notice(`已同步 ${count} 条资料`);
      if (transcripts) new Notice(`已补充 ${transcripts} 份文字稿`);
      if (summaries) new Notice(`已补充 ${summaries} 份 AI 笔记`);
      if (moved) new Notice(`已按内容把 ${moved} 条笔记移到对应目录`);
      if (manual && !count && !transcripts && !summaries && !moved) new Notice('没有新内容');
    } catch (e) {
      console.error('[eduaiot-wechat-sync] 同步失败', e);
      if (manual) new Notice(`同步失败：${(e as Error).message}`);
    } finally {
      this.syncing = false;
    }
  }

  private async importItem(item: InboxItem) {
    const opts = item.options || { saveVideo: true, saveCover: false, folder: '' };
    const root = normalizePath(opts.folder || this.settings.folder || DEFAULT_SETTINGS.folder);
    const created = moment(item.createdAt);
    const folder = `${root}/${created.format('YYYY-MM')}`;
    const assets = `${folder}/附件`;
    await this.ensureFolder(assets);

    const serial = this.nextSerial(folder, assets, created.format('YYYYMMDD'));
    const noteBase = `${serial} ${item.platform ? item.platform + '-' : ''}${shortTitle(item.title)}`;
    const notePath = this.available(folder, noteBase, 'md');
    const assetBase = serial;

    const body: string[] = [];
    const article = !item.kind && !item.video_url && (!!item.content || !!item.images?.length);
    if (article) {
      body.push(await this.articleBody(item, assets, assetBase));
    } else if (item.kind) {
      const ext = (item.file_ext || '').replace(/^\./, '') || 'bin';
      const res = await requestUrl({ url: `${this.base}/api/files/${item.id}`, headers: this.headers });
      const filePath = this.available(assets, assetBase, ext);
      await this.app.vault.createBinary(filePath, res.arrayBuffer);
      body.push(`![[${filePath}]]`);
    } else if (opts.saveCover && item.cover_url) {
      try {
        const cover = await requestUrl({ url: item.cover_url });
        const coverPath = this.available(assets, assetBase, 'jpg');
        await this.app.vault.createBinary(coverPath, cover.arrayBuffer);
        body.push(`![[${coverPath}]]`);
      } catch (e) {
        console.warn('[eduaiot-wechat-sync] 封面下载失败', e);
      }
    }
    if (!item.kind && !article) {
      if (opts.saveVideo !== false) {
        const videoPath = this.available(assets, assetBase, 'mp4');
        await this.app.vault.createBinary(videoPath, await this.download(item));
        body.push(`![[${videoPath}]]`);
      } else if (item.video_url) {
        body.push(`[视频链接](${item.video_url})`);
      }
    }

    const note = [
      '---',
      `title: ${JSON.stringify(item.title || '')}`,
      `platform: ${JSON.stringify(item.platform || '')}`,
      `author: ${JSON.stringify(item.author || '')}`,
      `source: ${JSON.stringify(item.text || '')}`,
      `created: ${moment(item.createdAt).format('YYYY-MM-DD HH:mm:ss')}`,
      '---',
      '',
      ...body,
      ''
    ].join('\n');
    let text = note;
    if (item.summary?.status === 'ok' && item.summary.data) text = insertBlock(text, summaryMarkdown(item.summary.data));
    if (item.asr?.status === 'ok') text = insertBlock(text, transcriptMarkdown(item.asr));
    await this.app.vault.create(notePath, text);
    return notePath;
  }

  private async addSummary(item: InboxItem) {
    const file = item.path && this.app.vault.getAbstractFileByPath(normalizePath(item.path));
    if (!(file instanceof TFile) || !item.summary?.data) return false;
    const block = summaryMarkdown(item.summary.data);
    await this.app.vault.process(file, (content) => insertSummary(content, block));
    return true;
  }

  private async appendTranscript(item: InboxItem) {
    const file = item.path && this.app.vault.getAbstractFileByPath(normalizePath(item.path));
    if (!(file instanceof TFile) || !item.asr) return false;
    await this.app.vault.process(file, (content) => (hasSection(content, '文字稿') ? content : insertBlock(content, transcriptMarkdown(item.asr!))));
    return true;
  }

  private async moveItem(item: InboxItem) {
    const note = this.app.vault.getAbstractFileByPath(normalizePath(item.path || ''));
    const to = normalizePath(item.move?.to || '');
    if (!(note instanceof TFile) || !note.parent || !to) return item.path;
    const folder = `${to}/${note.parent.name}`;
    if (note.parent.path === folder) return note.path;
    const assets = `${folder}/附件`;
    await this.ensureFolder(assets);

    const serial = note.basename.split(' ')[0];
    const serialized = /^\d{8}-\d{3,}$/.test(serial);
    const fresh = serialized ? this.nextSerial(folder, assets, serial.slice(0, 8)) : serial;
    const renames: [string, string][] = [];
    const oldAssets = this.app.vault.getAbstractFileByPath(`${note.parent.path}/附件`);
    if (serialized && oldAssets instanceof TFolder) {
      for (const f of [...oldAssets.children]) {
        if (!(f instanceof TFile) || !(f.basename === serial || f.basename.startsWith(`${serial}-`))) continue;
        const target = this.available(assets, fresh + f.basename.slice(serial.length), f.extension);
        renames.push([f.path, target]);
        await this.app.fileManager.renameFile(f, target);
      }
    }
    if (renames.length) await this.app.vault.process(note, (c) => renames.reduce((t, [a, b]) => t.split(a).join(b), c));
    const target = this.available(folder, fresh + note.basename.slice(serial.length), 'md');
    await this.app.fileManager.renameFile(note, target);
    return target;
  }

  private exists(path: string) {
    return !!this.app.vault.getAbstractFileByPath(normalizePath(path));
  }

  private nextSerial(folder: string, assets: string, date: string) {
    const pattern = new RegExp(`^${date}-(\\d{3,})`);
    let max = 0;
    for (const dir of [folder, assets]) {
      const f = this.app.vault.getAbstractFileByPath(dir);
      if (!(f instanceof TFolder)) continue;
      for (const child of f.children) {
        const m = child.name.match(pattern);
        if (m) max = Math.max(max, Number(m[1]));
      }
    }
    return `${date}-${String(max + 1).padStart(3, '0')}`;
  }

  private available(folder: string, base: string, ext: string) {
    let path = `${folder}/${base}.${ext}`;
    for (let i = 2; this.exists(path); i++) path = `${folder}/${base}-${i}.${ext}`;
    return path;
  }

  private async ensureFolder(path: string) {
    let current = '';
    for (const part of path.split('/')) {
      current = current ? `${current}/${part}` : part;
      if (!this.app.vault.getAbstractFileByPath(current)) await this.app.vault.createFolder(current);
    }
  }

  private async articleBody(item: InboxItem, assets: string, assetBase: string) {
    const saved = new Map<string, string>();
    let index = 0;
    for (const url of item.images || []) {
      if (saved.has(url)) continue;
      index++;
      const ext = (url.match(/wx_fmt=(\w+)/)?.[1] || url.match(/\.(jpe?g|png|gif|webp)(?:\?|$)/i)?.[1] || 'jpg').replace('jpeg', 'jpg');
      for (const headers of mediaHeaders(url)) {
        try {
          const res = await requestUrl({ url, headers });
          if (!res.arrayBuffer.byteLength) continue;
          const imgPath = this.available(assets, `${assetBase}-${String(index).padStart(2, '0')}`, ext);
          await this.app.vault.createBinary(imgPath, res.arrayBuffer);
          saved.set(url, `![[${imgPath}]]`);
          break;
        } catch {}
      }
      if (!saved.has(url)) saved.set(url, `![](${url})`);
    }
    const used = new Set<string>();
    const content = (item.content || '').replace(/!\[\]\((\S+?)\)/g, (_, url: string) => {
      used.add(url);
      return saved.get(url) || `![](${url})`;
    });
    const gallery = [...saved.entries()].filter(([url]) => !used.has(url)).map(([, md]) => md);
    return [...gallery, content].filter(Boolean).join('\n\n');
  }

  private async download(item: InboxItem): Promise<ArrayBuffer> {
    if (!item.video_url) throw new Error('缺少视频地址');
    for (const headers of mediaHeaders(item.video_url)) {
      try {
        const res = await requestUrl({ url: item.video_url, headers });
        if (res.arrayBuffer.byteLength) return res.arrayBuffer;
      } catch {}
    }
    throw new Error('视频链接已过期，请在小程序重新同步');
  }
}

class SettingTab extends PluginSettingTab {
  private code = '';
  private advanced = false;

  constructor(app: App, private plugin: EduaiotWechatSyncPlugin) {
    super(app, plugin);
  }

  display() {
    const { containerEl } = this;
    const s = this.plugin.settings;
    containerEl.empty();

    if (s.deviceToken) {
      new Setting(containerEl)
        .setName('已绑定手机')
        .setDesc(`本机名称：${s.deviceName}`)
        .addButton((b) =>
          b.setButtonText('解除绑定').setWarning().onClick(async () => {
            await this.plugin.unbind();
            this.display();
          })
        );
    } else {
      new Setting(containerEl)
        .setName('绑定手机')
        .setDesc('在「易度随手存」小程序「设置」页获取 6 位绑定码')
        .addText((t) => t.setPlaceholder('6 位绑定码').onChange((v) => (this.code = v)))
        .addButton((b) =>
          b.setButtonText('立即绑定').setCta().onClick(async () => {
            try {
              await this.plugin.bind(this.code);
              new Notice('绑定成功');
              this.display();
            } catch (e) {
              new Notice((e as Error).message);
            }
          })
        );
    }

    new Setting(containerEl)
      .setName('默认保存目录')
      .setDesc('小程序未指定目录时使用')
      .addText((t) =>
        t.setValue(s.folder).onChange(async (v) => {
          s.folder = v.trim();
          await this.plugin.saveSettings();
        })
      );

    new Setting(containerEl).addButton((b) => b.setButtonText('立即同步').setCta().onClick(() => this.plugin.sync(true)));

    new Setting(containerEl)
      .setName('高级设置')
      .setDesc('一般不需要修改')
      .addToggle((t) =>
        t.setValue(this.advanced).onChange((v) => {
          this.advanced = v;
          this.display();
        })
      );

    if (!this.advanced) return;

    new Setting(containerEl)
      .setName('服务器地址')
      .setDesc('留空使用官方服务，私有部署时填写')
      .addText((t) =>
        t
          .setPlaceholder(OFFICIAL_SERVER)
          .setValue(s.serverUrl)
          .onChange(async (v) => {
            s.serverUrl = v.trim();
            await this.plugin.saveSettings();
          })
      );

    new Setting(containerEl)
      .setName('同步间隔（秒）')
      .setDesc('最小 10 秒')
      .addText((t) =>
        t.setValue(String(s.intervalSec)).onChange(async (v) => {
          const n = Number(v);
          if (Number.isFinite(n) && n > 0) {
            s.intervalSec = n;
            await this.plugin.saveSettings();
          }
        })
      );
  }
}
