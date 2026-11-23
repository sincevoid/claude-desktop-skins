// The turn as it runs, for the band above the prompt: what the main loop is doing now,
// one chip per finished tool call in its kind's colour, and the counts so far.
import type { LiveChip, LiveTurn } from '../types'
import { kindOf } from './tools'
import type { Kind, Palette } from './skin'

// Declared with the plugin's state, which must not import from the hooks.
export type { LiveChip, LiveTurn }

// The turn keeps its latest chips; the band shows fewer and counts the rest.
export const MAX_CHIPS = 40
const SHOWN_CHIPS = 14

const base = (path: unknown): string => (typeof path === 'string' ? (path.split(/[\\/]/).pop() ?? path) : '')
const cut = (text: string, max: number): string => (text.length > max ? `${text.slice(0, max - 1)}…` : text)

// What the band says a call is doing, from its name and arguments.
export function actionOf(tool: string, input: Record<string, unknown>): { kind: Kind; label: string } {
  const kind: Kind = kindOf(tool) ?? 'other'

  if (tool.startsWith('mcp__')) {
    const [, server = '', ...name] = tool.split('__')
    return { kind, label: `🔌 ${server} · ${name.join('__')}` }
  }

  switch (tool) {
    case 'Read':
      return { kind, label: `📖 Lendo ${base(input.file_path)}` }
    case 'Edit':
    case 'MultiEdit':
    case 'Write':
    case 'NotebookEdit':
      return { kind, label: `✏️ Editando ${base(input.file_path ?? input.notebook_path)}` }
    case 'Bash':
    case 'PowerShell':
      return { kind, label: `▶ ${cut(String(input.description ?? input.command ?? '').split('\n')[0] ?? '', 34)}` }
    case 'Grep':
    case 'Glob':
      return { kind, label: `🔍 Buscando ${cut(String(input.pattern ?? ''), 24)}` }
    case 'WebFetch':
    case 'WebSearch':
      return { kind, label: '🌐 Pesquisando na web' }
    case 'Skill':
      return { kind, label: `🧰 Skill ${String(input.skill ?? '')}` }
    case 'Agent':
    case 'Task':
      return { kind, label: `🤖 ${cut(String(input.description ?? 'Agente'), 30)}` }
    default:
      return { kind, label: `🔧 ${tool}` }
  }
}

// The colour of a chip or of the call running now.
export const kindColor = (palette: Palette, kind: Kind, failed = false): string => (failed ? palette.err : palette[kind] ?? palette.other)

// A dot (pulsing while the turn runs, a still tick once done), then a chip per call, the
// latest few, with a count of the ones before them: an image, redrawn when a call ends.
export function liveSvg(live: Pick<LiveTurn, 'chips' | 'current'>, palette: Palette, isDone = false): { source: string; width: number; height: number; alt: string } {
  const height = 18
  const chips = live.chips.slice(-SHOWN_CHIPS)
  const before = live.chips.length - chips.length
  const lead = before > 0 ? 34 : 24
  const width = lead + chips.length * 9
  const dot = isDone ? palette.ok : live.current === null ? palette.user : kindColor(palette, live.current.kind)
  const more = before > 0 ? `<text x="22" y="13" font-size="10" font-family="system-ui,sans-serif" style="fill:${palette.muted}">+${before}</text>` : ''
  const items = more + chips.map((chip, i) => `<circle cx="${lead + 2 + i * 9}" cy="9" r="3" fill="${kindColor(palette, chip.kind, chip.failed)}"/>`).join('')
  const mark = isDone
    ? `<circle cx="9" cy="9" r="8" fill="${dot}" fill-opacity=".18"/><path d="M5.5 9.2l2.3 2.3 4.7-4.9" fill="none" stroke="${dot}" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>`
    : `<circle cx="9" cy="9" r="8" fill="${dot}" fill-opacity=".18"/><circle class="pulse" cx="9" cy="9" r="5" fill="${dot}"/>`
  const style = [
    '@keyframes pulse{0%,100%{opacity:1;transform:scale(1)}50%{opacity:.35;transform:scale(.7)}}',
    '.pulse{transform-origin:9px 9px;animation:pulse 1.2s ease-in-out infinite}',
    '@media (prefers-reduced-motion:reduce){.pulse{animation:none}}',
  ].join('')

  return {
    source: `<svg xmlns="http://www.w3.org/2000/svg" width="${width}" height="${height}" viewBox="0 0 ${width} ${height}"><style>${style}</style>${mark}${items}</svg>`,
    width,
    height,
    alt: `${live.chips.length} ferramentas`,
  }
}
