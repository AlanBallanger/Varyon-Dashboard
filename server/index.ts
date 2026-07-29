import { createServer } from 'node:http'
import { readFile } from 'node:fs/promises'
import { join, extname } from 'node:path'
import { loadEnv } from './env'
import { getHealth } from './health'
import { queryLokiLogs } from './loki'
import { getPlayers } from './players'
import { listMods } from './mods'
import { sendConsoleCommand } from './console'
import type { ConsoleSendRequest, LogLevel, PublicConfig } from './types'

const env = loadEnv()

function sendJson(res: import('node:http').ServerResponse, status: number, body: unknown) {
  const data = JSON.stringify(body)
  res.writeHead(status, {
    'Content-Type': 'application/json; charset=utf-8',
    'Cache-Control': 'no-store',
  })
  res.end(data)
}

function sendError(res: import('node:http').ServerResponse, status: number, message: string) {
  sendJson(res, status, { error: message })
}

function parseUrl(reqUrl: string | undefined) {
  return new URL(reqUrl ?? '/', `http://127.0.0.1:${env.apiPort}`)
}

async function readJsonBody(req: import('node:http').IncomingMessage, maxBytes = 8192): Promise<unknown> {
  const chunks: Buffer[] = []
  let size = 0
  for await (const chunk of req) {
    size += chunk.length
    if (size > maxBytes) throw new Error('Request body too large')
    chunks.push(chunk)
  }
  if (chunks.length === 0) return {}
  return JSON.parse(Buffer.concat(chunks).toString('utf8'))
}

const server = createServer(async (req, res) => {
  try {
    const url = parseUrl(req.url)
    if (req.method === 'GET' && url.pathname === '/api/health') {
      return sendJson(res, 200, await getHealth(env))
    }
    if (req.method === 'GET' && url.pathname === '/api/config/public') {
      const cfg: PublicConfig = {
        lokiLogSelector: env.lokiLogSelector,
        playersPollMs: 5000,
        logsPollMs: 2000,
      }
      return sendJson(res, 200, cfg)
    }
    if (req.method === 'GET' && url.pathname === '/api/logs/query') {
      const start = Number(url.searchParams.get('start') ?? Date.now() - 15 * 60_000)
      const end = Number(url.searchParams.get('end') ?? Date.now())
      const limit = Number(url.searchParams.get('limit') ?? 500)
      const filter = url.searchParams.get('filter') ?? undefined
      const level = (url.searchParams.get('level') as LogLevel | null) ?? 'ALL'
      const result = await queryLokiLogs(env, { startMs: start, endMs: end, limit, filter, level })
      return sendJson(res, 200, result)
    }
    if (req.method === 'GET' && url.pathname === '/api/players') {
      return sendJson(res, 200, await getPlayers(env))
    }
    if (req.method === 'GET' && url.pathname === '/api/mods') {
      return sendJson(res, 200, await listMods(env))
    }
    if (req.method === 'POST' && url.pathname === '/api/console/send') {
      const body = (await readJsonBody(req)) as Partial<ConsoleSendRequest>
      if (typeof body.command !== 'string') {
        return sendError(res, 400, 'Missing "command" string')
      }
      await sendConsoleCommand(env, body.command)
      return sendJson(res, 200, { ok: true })
    }

    if (req.method === 'GET' && !url.pathname.startsWith('/api')) {
      const dist = join(process.cwd(), 'dist')
      const path = url.pathname === '/' ? '/index.html' : url.pathname
      try {
        const file = join(dist, path)
        const buf = await readFile(file)
        const types: Record<string, string> = {
          '.html': 'text/html',
          '.js': 'text/javascript',
          '.css': 'text/css',
          '.svg': 'image/svg+xml',
        }
        res.writeHead(200, { 'Content-Type': types[extname(file)] ?? 'application/octet-stream' })
        return res.end(buf)
      } catch {
        try {
          const buf = await readFile(join(dist, 'index.html'))
          res.writeHead(200, { 'Content-Type': 'text/html' })
          return res.end(buf)
        } catch {
          /* fallthrough */
        }
      }
    }

    sendError(res, 404, 'Not found')
  } catch (e) {
    sendError(res, 500, e instanceof Error ? e.message : String(e))
  }
})

server.listen(env.apiPort, '0.0.0.0', () => {
  console.log(`Varyon API listening on http://0.0.0.0:${env.apiPort}`)
})
