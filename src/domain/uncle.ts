import { formatHuman } from './today.ts'
import type { Centre, DatedClosure, IsoDate, Status } from './types.ts'

type Voice =
  | 'closed-cleaning'
  | 'closed-works'
  | 'closing-soon-cleaning'
  | 'closing-soon-works'
  | 'unknown'
  | 'open'

type VoiceStatus = {
  'closed-cleaning': Extract<Status, { kind: 'closed' }>
  'closed-works': Extract<Status, { kind: 'closed' }>
  'closing-soon-cleaning': Extract<Status, { kind: 'closing-soon' }>
  'closing-soon-works': Extract<Status, { kind: 'closing-soon' }>
  unknown: Extract<Status, { kind: 'unknown' }>
  open: Extract<Status, { kind: 'open' }>
}

type Line<V extends Voice> = (s: VoiceStatus[V], c: Centre) => string

function voiceOf(status: Status): Voice {
  switch (status.kind) {
    case 'closed':
    case 'closing-soon':
      return `${status.kind}-${status.closure.kind}`
    default:
      return status.kind
  }
}

const startOf = (c: DatedClosure) => formatHuman(c.start)

const daysFromNow = (n: number) => `${n} day${n === 1 ? '' : 's'} from now`

const YEAR_MS = 366 * 86_400_000

// A multi-year redevelopment closure needs its year spelled out, or "Tue 1 Jan" reads as next January.
function reopenText(s: { closure: DatedClosure; reopensOn: IsoDate }): string {
  const longClosure = Date.parse(s.reopensOn) - Date.parse(s.closure.start) > YEAR_MS
  return formatHuman(s.reopensOn, longClosure)
}

const LINES: { [V in Voice]: Array<Line<V>> } = {
  'closed-cleaning': [
    (s, c) => `Aiyoh, ${c.name} closed for cleaning lah. Open back ${reopenText(s)}.`,
    (s, c) => `Sorry ah, ${c.name} is resting today. Come back ${reopenText(s)}, can?`,
    (s, c) => `${c.name} having a big wash. Uncle also hungry, but must wait till ${reopenText(s)}.`,
    (s, c) => `Don't go ${c.name} today, shutters down. Reopens ${reopenText(s)}, save your legs.`,
  ],
  'closed-works': [
    (s, c) => `Aiyoh, ${c.name} closed for works lah. Open back ${reopenText(s)}.`,
    (s, c) => `Sorry ah, ${c.name} got repairs going on. Come back ${reopenText(s)}, can?`,
    (s, c) => `${c.name} shutters down for renovation. Uncle also hungry, but must wait till ${reopenText(s)}.`,
  ],
  'closing-soon-cleaning': [
    (s, c) =>
      `${c.name} open now, but closing ${startOf(s.closure)} for cleaning, ${daysFromNow(s.daysUntil)}. Eat first!`,
    (s, c) => `Go ${c.name} soon ah. Shutters coming down ${startOf(s.closure)} for a big wash.`,
    (s, c) => `${c.name} still open, but not for long. Cleaning starts ${startOf(s.closure)}, so makan while you can.`,
  ],
  'closing-soon-works': [
    (s, c) => `${c.name} open now, but works start ${startOf(s.closure)}, ${daysFromNow(s.daysUntil)}. Eat first!`,
    (s, c) => `Go ${c.name} soon ah. Shutters coming down ${startOf(s.closure)} for repairs.`,
    (s, c) => `${c.name} still open, but not for long. Works begin ${startOf(s.closure)}, so makan while you can.`,
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
  const voice = voiceOf(status)
  const lines = LINES[voice] as Array<(s: Status, c: Centre) => string>
  const line = lines[pick(lines.length)]
  if (!line) throw new Error(`pick returned an out-of-range index for ${voice}`)
  return line(status, centre)
}
