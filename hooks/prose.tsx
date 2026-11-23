import type { AlertType, Block, Line, Run, RunStyle, Task } from './blocks'
import { inlineRuns } from './blocks'
import { safeHref, touchOf } from './links'
import { isDarkText } from './light'
import { hardBreaks, LINK } from './markdown'
import type { Look } from './rows'
import type { Palette } from './skin'

type Glyphs = { mark: string; done: string; open: string }

const ALERTS: Record<AlertType, { title: string; slot: keyof Palette; unicode: string; ascii: string }> = {
  note: { title: 'Observação', slot: 'web', unicode: 'ℹ', ascii: 'i' },
  tip: { title: 'Dica', slot: 'ok', unicode: '✦', ascii: '*' },
  important: { title: 'Importante', slot: 'mcp', unicode: '❖', ascii: '!' },
  warning: { title: 'Aviso', slot: 'warn', unicode: '▲', ascii: '!' },
  caution: { title: 'Cuidado', slot: 'err', unicode: '✖', ascii: 'x' },
}

const glyphs = (look: Look): Glyphs =>
  look.prefs.icons === 'ascii' ? { mark: '-', done: '[x]', open: '[ ]' } : { mark: '•', done: '✅', open: '⬜' }

// The slot each highlighted kind of text takes from the skin.
const SLOTS: Partial<Record<RunStyle, keyof Palette>> = {
  code: 'search',
  number: 'user',
  duration: 'user',
  version: 'mcp',
  path: 'read',
  url: 'web',
}

// The colour a path takes: created this turn (ok), edited (warn), else the path colour.
function pathSlot(look: Look, text: string): keyof Palette {
  const touch = look.touched === undefined ? undefined : touchOf(look.touched.files, text, look.touched.cwd)

  return touch === 'created' ? 'ok' : touch === 'edited' ? 'warn' : 'read'
}

// `~~text~~` reads faded, not struck: a line through the words makes them hard to read.
// `base` overrides the plain text's colour, as a done task fades.
function runText(look: Look, run: Run, base?: string) {
  const { Link, Text } = look.ui
  const { palette } = look.skin
  const slot = run.style === 'path' ? pathSlot(look, run.text) : SLOTS[run.style]
  const href = run.style === 'url' && look.links === true ? safeHref(run.text) : null

  // A URL the engine's Link takes is one where the surface draws links; any other is text.
  if (href !== null) {
    return (
      <Text color={palette.web} underline>
        <Link href={href}>{run.text}</Link>
      </Text>
    )
  }

  const color =
    run.style === 'code' && look.prefs.code === 'accent' ? accentRed(palette) : run.style === 'strike' ? palette.muted : slot === undefined ? (base ?? palette.fg) : palette[slot]

  return (
    <Text
      color={color}
      bold={run.style === 'bold'}
      italic={run.style === 'italic'}
      dimColor={run.style === 'strike'}
      {...(run.style === 'code' ? { backgroundColor: palette.surface } : {})}
    >
      {run.style === 'code' ? ` ${run.text} ` : run.text}
    </Text>
  )
}

// The accent red for inline code, as Notion draws it: deepened on a light background to
// read at 4.5:1 or better on the band (#ededed), lighter on a dark one.
export const ACCENT_RED = { light: '#b03a2e', dark: '#f28b82' } as const

const accentRed = (palette: Palette): string => (isDarkText(palette.fg) ? ACCENT_RED.light : ACCENT_RED.dark)

function lineRow(look: Look, line: Line) {
  const { Box, Text } = look.ui
  const body = <Text>{line.runs.map(run => runText(look, run))}</Text>

  if (line.bullet === null) {
    return body
  }

  const mark = line.bullet === '•' ? glyphs(look).mark : line.bullet

  return (
    <Box flexDirection="row" paddingLeft={line.depth * 2}>
      <Text color={look.skin.palette.muted}>{`${mark} `}</Text>
      {body}
    </Box>
  )
}

function headingRow(look: Look, level: number, text: string) {
  const { Text } = look.ui
  const { palette } = look.skin

  return (
    <Text color={level <= 2 ? palette.user : palette.fg} bold underline={level === 1}>
      {level <= 2 ? `${look.prefs.icons === 'ascii' ? '#' : '▍'} ${text}` : text}
    </Text>
  )
}

function alertBox(look: Look, type: AlertType, body: string) {
  const { Box, Text, Markdown } = look.ui
  const alert = ALERTS[type]
  const color = look.skin.palette[alert.slot]

  return (
    <Box flexDirection="column" borderStyle="round" borderColor={color} backgroundColor={look.skin.palette.surface} paddingX="md" paddingY="xs">
      <Text color={color} bold>{` ${look.prefs.icons === 'ascii' ? alert.ascii : alert.unicode}  ${alert.title}`}</Text>
      {body === '' ? null : <Markdown text={hardBreaks(body)} />}
    </Box>
  )
}

// Width of the progress bar under a task list, in cells.
const BAR = 12

// On the desktop, a rounded bar that fills to its share when it first shows.
function progressSvg(look: Look, done: number, total: number) {
  const Svg = look.svg
  const { palette } = look.skin
  const width = 140
  const filled = total === 0 ? 0 : Math.round((done / total) * width)
  const source = `<svg xmlns="http://www.w3.org/2000/svg" width="${width}" height="8" viewBox="0 0 ${width} 8"><style>@keyframes grow{from{width:0}}.f{animation:grow .9s cubic-bezier(.2,.8,.2,1)}@media (prefers-reduced-motion:reduce){.f{animation:none}}</style><rect width="${width}" height="8" rx="4" fill="${palette.muted}" fill-opacity=".25"/><rect class="f" width="${filled}" height="8" rx="4" fill="${palette.ok}"/></svg>`

  return Svg === undefined ? '' : <Svg key="tasks-bar" source={source} alt={`${done} de ${total}`} width={width} height={8} />
}

function taskRows(look: Look, items: readonly Task[]) {
  const { Box, Text } = look.ui
  const { palette } = look.skin
  const mark = glyphs(look)
  const done = items.filter(item => item.done).length

  return (
    <Box flexDirection="column">
      {items.map(item => (
        <Box flexDirection="row" paddingLeft={item.depth * 2}>
          <Text color={item.done ? palette.ok : palette.muted}>{`${item.done ? mark.done : mark.open}  `}</Text>
          <Text>{inlineRuns(item.text.replace(LINK, '$1')).map(run => runText(look, run, item.done ? palette.muted : undefined))}</Text>
        </Box>
      ))}
      <Box marginTop={1} flexDirection="row" alignItems="center" columnGap={1}>
        {look.svg === undefined ? '' : progressSvg(look, done, items.length)}
        <Text>
          <Text color={palette.ok}>{look.svg === undefined ? '━'.repeat(Math.round((done / items.length) * BAR)) : ''}</Text>
          <Text color={palette.muted}>{look.svg === undefined ? '━'.repeat(BAR - Math.round((done / items.length) * BAR)) : ''}</Text>
          <Text color={palette.muted}>{`  ${done} de ${items.length} feitas`}</Text>
        </Text>
      </Box>
    </Box>
  )
}

// One row per block; paragraphs and headings sit a line apart, as markdown would set them.
export function blockRows(look: Look, blocks: readonly Block[]) {
  const { Box, Markdown } = look.ui

  return blocks.map((block, i) => {
    const gap = i === 0 ? 0 : 1

    switch (block.kind) {
      case 'markdown':
        return <Markdown text={hardBreaks(block.text)} />
      case 'heading':
        return <Box marginTop={gap}>{headingRow(look, block.level, block.text)}</Box>
      case 'alert':
        return <Box marginY={2}>{alertBox(look, block.type, block.body)}</Box>
      case 'tasks':
        return <Box marginY={2}>{taskRows(look, block.items)}</Box>
      case 'paragraph':
        return (
          <Box flexDirection="column" marginTop={blocks[i - 1]?.kind === 'heading' ? 0 : gap}>
            {block.lines.map(line => lineRow(look, line))}
          </Box>
        )
    }
  })
}
