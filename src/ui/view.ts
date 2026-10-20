import { badNews } from '../domain/find.ts'
import { statusOn } from '../domain/status.ts'
import { formatHuman, todayInSingapore, yearOf } from '../domain/today.ts'
import { uncleSays } from '../domain/uncle.ts'
import type { Centre, DatedClosure, IsoDate, Snapshot, Status } from '../domain/types.ts'

const esc = (s: string) =>
  s.replace(/[&<>"']/g, ch => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' })[ch]!)

export const centreHref = (c: Centre) => `#/c/${encodeURIComponent(c.id)}`

const CHIP: Record<Status['kind'], { icon: string; label: string }> = {
  closed: { icon: '✕', label: 'Closed' },
  'closing-soon': { icon: '!', label: 'Closing soon' },
  unknown: { icon: '?', label: 'Not sure' },
  open: { icon: '✓', label: 'Open' },
}

export function chip(status: Status): string {
  const { icon, label } = CHIP[status.kind]
  return `<span class="chip chip--${status.kind}"><span class="chip__icon" aria-hidden="true">${icon}</span>${label}</span>`
}

const REASON: Record<DatedClosure['kind'], string> = { cleaning: 'cleaning', works: 'works' }

const dayFrom = (today: IsoDate) => (d: IsoDate) => formatHuman(d, yearOf(d) !== yearOf(today))

function statusDetail(status: Status, today: IsoDate): string {
  const day = dayFrom(today)
  switch (status.kind) {
    case 'closed':
      return `Closed for ${REASON[status.closure.kind]} till ${day(status.closure.end)}. Reopens ${day(status.reopensOn)}.`
    case 'closing-soon': {
      const { start, end, kind } = status.closure
      const span = start === end ? `on ${day(start)}` : `${day(start)} to ${day(end)}`
      return `Closes ${span} for ${REASON[kind]}.`
    }
    case 'open':
      return status.next
        ? `Next closure ${day(status.next.start)} for ${REASON[status.next.kind]}.`
        : 'No closure dates announced yet.'
    case 'unknown':
      return `Q${status.quarter} cleaning date not announced yet.`
  }
}

export const UNCLE_SVG = `<svg class="uncle" viewBox="0 0 80 80" aria-hidden="true" focusable="false">
  <circle cx="40" cy="40" r="39" fill="var(--sign-green)"/>
  <path d="M14 80c2-14 12-21 26-21s24 7 26 21z" fill="#fff"/>
  <path d="M22 62c6 6 14 10 22 18l8-2c-6-8-14-14-22-20z" fill="#fff" stroke="#c9c2b0" stroke-width="1"/>
  <path d="M26 66l6 4M33 71l6 4" stroke="var(--sign-red)" stroke-width="2.5" stroke-linecap="round"/>
  <ellipse cx="40" cy="36" rx="17" ry="20" fill="#e3a978"/>
  <path d="M23 33c0-6 2-10 4-11M57 33c0-6-2-10-4-11" stroke="#9a9a9a" stroke-width="4" stroke-linecap="round" fill="none"/>
  <circle cx="33" cy="36" r="5" fill="none" stroke="#2b1d12" stroke-width="2"/>
  <circle cx="47" cy="36" r="5" fill="none" stroke="#2b1d12" stroke-width="2"/>
  <path d="M38 36h4" stroke="#2b1d12" stroke-width="2"/>
  <circle cx="33" cy="36" r="1.5" fill="#2b1d12"/>
  <circle cx="47" cy="36" r="1.5" fill="#2b1d12"/>
  <path d="M33 47c3-2 11-2 14 0" stroke="#5a5a5a" stroke-width="3" stroke-linecap="round" fill="none"/>
</svg>`

export function uncleBubble(line: string, attrs = 'role="status"'): string {
  return `<div class="verdict">${UNCLE_SVG}<p class="bubble" ${attrs}>${esc(line)}</p></div>`
}

export function centreList(items: Array<{ centre: Centre; note?: string }>, today: IsoDate): string {
  return items
    .map(({ centre, note }) => {
      const noteHtml = note === undefined ? '' : `<span class="row__km">${note}</span>`
      return `<li><a class="row" href="${centreHref(centre)}">
        <span class="row__name">${esc(centre.name)}</span>
        <span class="row__meta">${chip(statusOn(centre, today))}${noteHtml}</span>
      </a></li>`
    })
    .join('')
}

export function noMatches(query: string): string {
  return `<li class="centre-list__empty">Uncle cannot find "${esc(query.trim())}". Try part of the name or the postal code.</li>`
}

export function board(centres: Centre[], today: IsoDate): string {
  const { closed, closingSoon } = badNews(centres, today)
  const day = dayFrom(today)
  const group = (id: string, title: string, empty: string, items: Array<{ centre: Centre; note: string }>) => {
    const list = `<ul class="centre-list" aria-labelledby="${id}">${centreList(items, today)}</ul>`
    return `<h3 class="board__group" id="${id}">${title}</h3>${items.length ? list : `<p class="board__empty">${empty}</p>`}`
  }
  const reopening = closed.map(({ centre, status }) => ({ centre, note: `reopens ${day(status.reopensOn)}` }))
  const closing = closingSoon.map(({ centre, status }) => ({ centre, note: `closes ${day(status.closure.start)}` }))
  return (
    group('board-closed', 'Closed today', 'Nothing closed today. Go makan anywhere!', reopening) +
    group('board-soon', 'Closing in the next 7 days', 'No closures coming this week.', closing)
  )
}

function stallPlates(c: Centre): string {
  const plate = (n: number, what: string) =>
    n > 0 ? `<li class="plate"><span class="plate__no">#${n}</span>${what}</li>` : ''
  return `<ul class="plates" aria-label="Stall counts">${plate(c.foodStalls, 'food stalls')}${plate(c.marketStalls, 'market stalls')}</ul>`
}

export function centreView(
  c: Centre,
  today: IsoDate,
  alternative: { centre: Centre; km: number } | undefined,
): string {
  const status = statusOn(c, today)
  const remarks = status.kind === 'closed' || status.kind === 'closing-soon' ? status.closure.remarks : undefined
  const address = c.address === remarks ? '' : `<p class="centre__address">${esc(c.address)}</p>`
  const description = c.description && c.description !== remarks ? `<p class="centre__description">${esc(c.description)}</p>` : ''
  const instead =
    status.kind === 'open' || !alternative
      ? ''
      : `<section class="instead" aria-labelledby="instead-title">
          <h2 id="instead-title">Go here instead</h2>
          <a class="instead__link" href="${centreHref(alternative.centre)}">${esc(alternative.centre.name)}</a>
          <p class="row__meta">${chip(statusOn(alternative.centre, today))}<span class="row__km">${alternative.km.toFixed(1)} km away</span></p>
        </section>`
  return `
    <a class="back" href="#/">Back to all centres</a>
    <h1 class="centre__name" tabindex="-1">${esc(c.name)}</h1>
    ${address}
    ${uncleBubble(uncleSays(status, c))}
    <p class="centre__status">${chip(status)}<span>${statusDetail(status, today)}</span></p>
    ${remarks ? `<aside class="notice" aria-label="NEA remarks"><p class="notice__from">NEA notice</p><p class="notice__text">${esc(remarks)}</p></aside>` : ''}
    ${instead}
    ${stallPlates(c)}
    ${description}`
}

const sgDateTime = new Intl.DateTimeFormat('en-SG', {
  timeZone: 'Asia/Singapore',
  dateStyle: 'medium',
  timeStyle: 'short',
})

export function footer(snapshot: Snapshot): string {
  const fetched = new Date(snapshot.fetchedAt)
  return `
    <p>Data as of ${esc(sgDateTime.format(fetched))} (Singapore time).</p>
    <p>Contains information from Dates of Hawker Centres Closure accessed on ${formatHuman(todayInSingapore(fetched), true)} from data.gov.sg, which is made available under the terms of the <a href="https://data.gov.sg/open-data-licence">Singapore Open Data Licence version 1.0</a>.</p>`
}
