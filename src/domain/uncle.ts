import { formatHuman } from './today.ts'
import type { Centre, Closure, IsoDate, Status } from './types.ts'

type Line<K extends Status['kind']> = (s: Extract<Status, { kind: K }>, c: Centre) => string

const startOf = (c: Closure) => (c.kind === 'tbc' ? 'a date to be confirmed' : formatHuman(c.start))

const YEAR_MS = 366 * 86_400_000

// A multi-year redevelopment closure needs its year spelled out, or "Tue 1 Jan" reads as next January.
function reopenText(s: { closure: Closure; reopensOn: IsoDate }): string {
  const longClosure = s.closure.kind !== 'tbc' && Date.parse(s.reopensOn) - Date.parse(s.closure.start) > YEAR_MS
  return formatHuman(s.reopensOn, longClosure)
}

const LINES: { [K in Status['kind']]: Array<Line<K>> } = {
  closed: [
    (s, c) => `Aiyoh, ${c.name} closed for cleaning lah. Open back ${reopenText(s)}.`,
    (s, c) => `Sorry ah, ${c.name} is resting today. Come back ${reopenText(s)}, can?`,
    (s, c) => `${c.name} having a big wash. Uncle also hungry, but must wait till ${reopenText(s)}.`,
    (s, c) => `Don't go ${c.name} today, shutters down. Reopens ${reopenText(s)}, save your legs.`,
  ],
  'closing-soon': [
    (s, c) =>
      `${c.name} open now, but closing ${startOf(s.closure)}, ${s.daysUntil} day${s.daysUntil === 1 ? '' : 's'} from now. Eat first!`,
    (s, c) => `Go ${c.name} soon ah. Shutters coming down ${startOf(s.closure)}.`,
    (s, c) => `${c.name} still open, but not for long. Closing ${startOf(s.closure)}, so makan while you can.`,
  ],
  unknown: [
    (s, c) => `Uncle also don't know leh. ${c.name} not say when Q${s.quarter} cleaning is. Call first, okay?`,
    (s, c) => `${c.name} cleaning date for Q${s.quarter} still TBC. Better check before you go.`,
    (s, c) => `Aiyah, NEA still never confirm ${c.name} Q${s.quarter} cleaning. Uncle can't promise anything.`,
  ],
  open: [
    (_, c) => `${c.name} open today! Go go go, chope a seat.`,
    (_, c) => `Can can, ${c.name} open. Come eat, don't think so much.`,
    (s, c) =>
      s.next
        ? `${c.name} open today. Next break is ${startOf(s.next)}, so no rush.`
        : `${c.name} open today. Uncle say go makan lah.`,
    (_, c) => `Shutters up at ${c.name}. Bring your appetite!`,
  ],
}

export function uncleSays(
  status: Status,
  centre: Centre,
  pick: (n: number) => number = n => Math.floor(Math.random() * n),
): string {
  const lines = LINES[status.kind] as Array<Line<typeof status.kind>>
  const line = lines[pick(lines.length)]
  if (!line) throw new Error(`pick returned an out-of-range index for ${status.kind}`)
  return line(status as never, centre)
}
