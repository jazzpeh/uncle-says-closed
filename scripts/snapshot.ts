import { mkdir, readFile, writeFile } from 'node:fs/promises'
import { parseArgs } from 'node:util'
import { parseClosuresCsv } from './parse.ts'
import type { Snapshot } from '../src/domain/types.ts'

const DATASET_ID = 'd_bda4baa634dd1cc7a6c7cad5f19e2d68'
const POLL_URL = `https://api-open.data.gov.sg/v1/public/api/datasets/${DATASET_ID}/poll-download`
const OUTPUT = 'public/data/centres.json'
const MAX_ATTEMPTS = 6

function headers(): Record<string, string> {
  const h: Record<string, string> = { 'User-Agent': 'uncle-says-closed' }
  const key = process.env.DATA_GOV_SG_API_KEY
  if (key) h['x-api-key'] = key
  else console.warn('warning: DATA_GOV_SG_API_KEY not set, requesting without a key')
  return h
}

const sleep = (ms: number) => new Promise(r => setTimeout(r, ms))

function isRateLimited(res: Response, body: string): boolean {
  if (res.status === 429) return true
  try {
    return (JSON.parse(body) as { name?: string }).name === 'TOO_MANY_REQUESTS'
  } catch {
    return false
  }
}

async function fetchText(url: string, h: Record<string, string>): Promise<string> {
  for (let attempt = 1; ; attempt++) {
    const res = await fetch(url, { headers: h })
    const body = await res.text()
    if (isRateLimited(res, body) && attempt < MAX_ATTEMPTS) {
      await sleep(5000 * 2 ** (attempt - 1))
      continue
    }
    if (!res.ok || isRateLimited(res, body)) {
      throw new Error(`GET ${new URL(url).origin}${new URL(url).pathname} failed: HTTP ${res.status} ${body.slice(0, 200)}`)
    }
    return body
  }
}

async function downloadCsv(): Promise<string> {
  const poll = JSON.parse(await fetchText(POLL_URL, headers())) as { data?: { url?: string } }
  const url = poll.data?.url
  if (!url) throw new Error('poll-download response has no data.url')
  return fetchText(url, { 'User-Agent': 'uncle-says-closed' })
}

const { values } = parseArgs({ options: { fixture: { type: 'string' } } })
const csv = values.fixture ? await readFile(values.fixture, 'utf8') : await downloadCsv()
const centres = parseClosuresCsv(csv)

const snapshot: Snapshot = { fetchedAt: new Date().toISOString(), centres }
await mkdir('public/data', { recursive: true })
await writeFile(OUTPUT, JSON.stringify(snapshot))

const count = (kind: string) => centres.flatMap(c => c.closures).filter(c => c.kind === kind).length
console.log(`${centres.length} centres, ${count('cleaning')} cleaning, ${count('works')} works, ${count('tbc')} tbc`)
