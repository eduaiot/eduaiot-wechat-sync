export const TOP_LEVEL = 3

const FENCE = /^\s*(```|~~~)/
const HEADING = /^(#{1,6})[ \t]+(.*?)[ \t]*#*[ \t]*$/
const NUMBER = /^(?:\d+(?:\.\d+)+\.?[ \t]*|\d+[.、)）][ \t]*|[一二三四五六七八九十]+[、.．][ \t]*|[（(][一二三四五六七八九十\d]+[）)][ \t]*)/

export interface Heading {
  readonly line: number
  readonly level: number
  readonly name: string
}

function frontmatterEnd(lines: readonly string[]): number {
  if (lines[0] !== '---') return 0
  const end = lines.indexOf('---', 1)
  return end < 0 ? 0 : end + 1
}

function scan(lines: readonly string[]): Heading[] {
  const out: Heading[] = []
  let fenced = false
  for (let index = frontmatterEnd(lines); index < lines.length; index++) {
    const line = lines[index] ?? ''
    if (FENCE.test(line)) {
      fenced = !fenced
      continue
    }
    if (fenced) continue
    const match = HEADING.exec(line)
    if (match !== null) out.push({ line: index, level: match[1]?.length ?? 1, name: (match[2] ?? '').replace(NUMBER, '').trim() })
  }
  return out
}

export function headings(text: string): Heading[] {
  return scan(text.replace(/\r\n/g, '\n').split('\n'))
}

export function followsRule(text: string): boolean {
  const found = headings(text)
  return found.length === 0 || Math.min(...found.map((item) => item.level)) >= TOP_LEVEL
}

export function normalizeHeadings(text: string): string {
  const lines = text.replace(/\r\n/g, '\n').split('\n')
  const found = scan(lines)
  if (found.length === 0) return lines.join('\n')
  const top = Math.min(...found.map((item) => item.level))
  const counters: number[] = []
  let previous = -1
  for (const item of found) {
    const depth = Math.min(item.level - top, previous + 1)
    previous = depth
    counters.length = depth + 1
    counters[depth] = (counters[depth] ?? 0) + 1
    lines[item.line] = `${'#'.repeat(Math.min(6, TOP_LEVEL + depth))} ${counters.join('.')}. ${item.name}`
  }
  return lines.join('\n')
}

export function sectionRange(lines: readonly string[], name: string): [number, number] | null {
  const found = scan(lines)
  const index = found.findIndex((item) => item.name === name)
  const start = found[index]
  if (start === undefined) return null
  const next = found.slice(index + 1).find((item) => item.level <= start.level)
  return [start.line, next?.line ?? lines.length]
}

export function hasSection(text: string, name: string): boolean {
  return headings(text).some((item) => item.name === name)
}

export function replaceSection(text: string, name: string, content: string): string {
  const normalized = text.replace(/\r\n/g, '\n')
  const strict = followsRule(normalized)
  const lines = normalized.split('\n')
  const body = ['', ...content.trim().split('\n'), '']
  const range = sectionRange(lines, name)
  const next = range !== null
    ? [...lines.slice(0, range[0] + 1), ...body, ...lines.slice(range[1])].join('\n')
    : `${normalized.replace(/\s*$/, '')}\n\n${[`${strict ? '###' : '##'} ${name}`, ...body].join('\n')}`
  return strict ? normalizeHeadings(next) : next
}

function fitBlock(block: string, top: number): string {
  const lines = block.trim().replace(/\r\n/g, '\n').split('\n')
  const found = scan(lines)
  if (found.length === 0) return lines.join('\n')
  const shift = top - Math.min(...found.map((item) => item.level))
  for (const item of found) {
    const level = Math.max(1, Math.min(6, item.level + shift))
    lines[item.line] = `${'#'.repeat(level)} ${item.name}`
  }
  return lines.join('\n')
}

export function insertBlock(text: string, block: string, before?: string): string {
  const normalized = text.replace(/\r\n/g, '\n')
  const strict = followsRule(normalized)
  const fitted = fitBlock(block, strict ? TOP_LEVEL : 2)
  const lines = normalized.split('\n')
  const range = before === undefined ? null : sectionRange(lines, before)
  const next = range === null
    ? `${normalized.replace(/\s*$/, '')}\n\n${fitted}\n`
    : [...lines.slice(0, range[0]), fitted, '', ...lines.slice(range[0])].join('\n')
  return strict ? normalizeHeadings(next) : next
}
