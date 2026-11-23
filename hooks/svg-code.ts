import { highlight, languageOf, roleColors } from './highlight'
import type { Palette } from './skin'
import { escape, fitText, HEAD_FONT, HEADER_MID, headFill, ICON_FONT, MONO, riseDelay, staggerEnd, staggerStep, svgCard, tint } from './svg-kit'

// A fenced code block as a card: the language and line count in a header, line numbers
// in a gutter, and light highlighting of comments, strings, numbers and keywords.

const HEADER_H = 44
// Level with the Copy button, which sits one row down from the card's top.
const MID = 22

// Nerd Font icon per fence language; anything else gets a generic code file.
export const LANG_ICON: Readonly<Record<string, string>> = {
  ts: '\ue628', tsx: '\ue628', typescript: '\ue628', js: '\ue60c', jsx: '\ue60c', javascript: '\ue60c',
  py: '\ue606', python: '\ue606', json: '\ue60b', md: '\ue609', markdown: '\ue609', html: '\ue60e',
  css: '\ue614', go: '\ue627', rs: '\ue68b', rust: '\ue68b', yml: '\ue6a8', yaml: '\ue6a8',
  sh: '\ue691', bash: '\ue691', zsh: '\ue691', shell: '\ue691', powershell: '\ue683', ps1: '\ue683', pwsh: '\ue683',
  c: '\ue649', cpp: '\ue646', cs: '\ue648', csharp: '\ue648', java: '\ue66d', lua: '\ue620', xml: '\ue619',
  toml: '\ue615', ini: '\ue615', sql: '\ue64d', diff: '\ueae1',
}
const LINE_H = 23
const CODE = 13.5
const MAX_LINES = 80

const KEYWORDS = new Set([
  'const', 'let', 'var', 'function', 'return', 'if', 'else', 'for', 'while', 'switch', 'case', 'break',
  'continue', 'import', 'from', 'export', 'default', 'class', 'new', 'async', 'await', 'try', 'catch',
  'throw', 'type', 'interface', 'extends', 'implements', 'def', 'fn', 'pub', 'struct', 'impl', 'enum',
  'match', 'use', 'mod', 'true', 'false', 'null', 'undefined', 'None', 'True', 'False', 'self', 'this',
  'in', 'of', 'as', 'with', 'lambda', 'yield', 'static', 'public', 'private', 'protected', 'void',
])

// Languages whose line comments start with `#`.
const HASH_COMMENTS = new Set(['py', 'python', 'sh', 'bash', 'zsh', 'shell', 'yaml', 'yml', 'toml', 'ps1', 'powershell', 'rb', 'ruby', 'r'])

export type Token = { text: string; role: 'plain' | 'comment' | 'string' | 'number' | 'keyword' }

export function tokenize(line: string, lang: string): Token[] {
  const comment = HASH_COMMENTS.has(lang) ? '#.*$' : '\\/\\/.*$|--\\s.*$'
  const pattern = new RegExp(`(${comment})|("(?:[^"\\\\]|\\\\.)*"|'(?:[^'\\\\]|\\\\.)*'|\`[^\`]*\`)|(\\b\\d[\\d_.]*\\b)|([A-Za-z_][\\w]*)`, 'g')
  const tokens: Token[] = []
  let last = 0

  for (const match of line.matchAll(pattern)) {
    const at = match.index ?? 0
    const plain = line.slice(last, at)

    if (plain !== '') {
      tokens.push({ text: plain, role: 'plain' })
    }

    const [text = ''] = match
    const role = match[1] !== undefined ? 'comment' : match[2] !== undefined ? 'string' : match[3] !== undefined ? 'number' : KEYWORDS.has(text) ? 'keyword' : 'plain'
    tokens.push({ text, role })
    last = at + text.length
  }

  return line.slice(last) === '' ? tokens : [...tokens, { text: line.slice(last), role: 'plain' }]
}

// Cuts a token list to `max` characters, ending in an ellipsis when it lost text.
function cutTokens<T extends { text: string; role: string }>(tokens: readonly T[], max: number): T[] {
  let room = max
  const kept: T[] = []

  for (const token of tokens) {
    if (room <= 0) {
      break
    }

    const chars = [...token.text]

    if (chars.length <= room) {
      kept.push(token)
      room -= chars.length
    } else {
      kept.push({ ...token, text: `${chars.slice(0, Math.max(0, room - 1)).join('')}…` })
      room = 0
    }
  }

  return kept
}

// The header is a thin strip: the language on the left, the Copy button laid over its right.
// `maxLines` cuts the card short of its usual 80 lines, for a block folded under it.
export function codeSvg(code: string, lang: string, palette: Palette, width: number, _hasControl = false, maxLines = MAX_LINES): { source: string; width: number; height: number; alt: string; entranceMs: number } {
  const all = code.replace(/\t/g, '  ').split('\n')
  const lines = all.slice(0, maxLines)
  const step = staggerStep(lines.length, 12)
  const gutter = String(all.length).length * 8 + 24
  const maxChars = Math.floor((width - gutter - 24) / (CODE * 0.6))
  const color: Readonly<Record<Token['role'], string>> = {
    plain: palette.fg,
    comment: palette.muted,
    string: palette.read,
    number: palette.warn,
    keyword: palette.user,
  }

  const full = languageOf(lang) === undefined ? null : highlight(lines.join('\n'), lang)
  const colorOf: Readonly<Record<string, string>> = full === null ? color : roleColors(palette)

  const rows = lines.map((line, i) => {
    const top = HEADER_H + 8 + i * LINE_H
    // A language highlight.ts knows gets its full colouring; anything else the light one here.
    const tokens: readonly { text: string; role: string }[] = full === null ? tokenize(line, lang) : (full[i] ?? [])
    const spans = cutTokens(tokens, maxChars)
      .map(token => `<tspan style="fill:${colorOf[token.role] ?? palette.fg}${token.role === 'keyword' || token.role === 'heading' ? ';font-weight:600' : ''}${token.role === 'comment' ? ';font-style:italic' : ''}">${escape(token.text)}</tspan>`)
      .join('')

    return `<g class="rise" ${riseDelay(i, step, 60)}><text x="${gutter - 12}" y="${top + 14}" text-anchor="end" font-family="${MONO}" font-size="11" style="fill:${palette.muted};fill-opacity:.7">${i + 1}</text><text x="${gutter}" y="${top + 14}" font-family="${MONO}" font-size="${CODE}" xml:space="preserve">${spans}</text></g>`
  })

  const hidden = all.length - lines.length
  const footer = hidden > 0 ? `<text x="${gutter}" y="${HEADER_H + 8 + lines.length * LINE_H + 14}" font-size="11.5" style="fill:${palette.muted}">mais ${hidden} linhas</text>` : ''
  const height = HEADER_H + 8 + lines.length * LINE_H + (hidden > 0 ? 28 : 10)
  const header = [
    `<text x="16" y="${MID}" dominant-baseline="central" font-family="${ICON_FONT}" font-size="18" style="fill:${palette.user}">${LANG_ICON[lang.toLowerCase()] ?? '\ueae9'}</text>`,
    `<text x="40" y="${MID}" dominant-baseline="central" font-family="${HEAD_FONT}" font-size="12" style="${headFill(palette)};font-weight:600;letter-spacing:.06em">${escape(lang.toUpperCase())}</text>`,
    `<line x1="0" y1="${HEADER_H - 0.5}" x2="${width}" y2="${HEADER_H - 0.5}" stroke="${palette.muted}" stroke-opacity=".3"/>`,
    `<g transform="translate(0 ${HEADER_H})">${tint(palette, 0, gutter - 4, height - HEADER_H, 0.04)}</g>`,
  ].join('')

  return {
    source: svgCard(width, height, palette, '', header + rows.join('') + footer),
    width,
    height,
    alt: `${lang || 'code'}:\n${fitText(code, 4000, true, CODE)}`,
    entranceMs: staggerEnd(lines.length, step, 60),
  }
}
