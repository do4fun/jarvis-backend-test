// ─────────────────────────────────────────────────────────────────────────────
// Jarvis Backend — Express + WebSocket server
//
// Endpoints :
//   POST /api/chat   — SSE streaming Claude → UI + forward LiveKit
//   POST /api/token  — LiveKit JWT + agent dispatch
//   WS   /ws/stt     — Deepgram STT temps réel (PCM16 → transcript)
//   GET  /health     — Health check
// ─────────────────────────────────────────────────────────────────────────────

import 'dotenv/config'
import fs from 'fs'
import path from 'path'
import http from 'http'
import { parse } from 'url'
import express from 'express'
import cors from 'cors'
import { WebSocketServer } from 'ws'
import { handleChat } from './routes/chat'
import { handleToken } from './routes/token'
import { handleSTTConnection } from './ws/stt'
import { logger } from './lib/logger'

// Ensure logs directory exists before logger tries to write
const logsDir = path.join(process.cwd(), 'logs')
if (!fs.existsSync(logsDir)) fs.mkdirSync(logsDir, { recursive: true })

const port = parseInt(process.env.PORT ?? '3001', 10)

// ── Express ────────────────────────────────────────────────────────────────────
const app = express()
app.use(express.json())
app.use(cors({
  origin:      process.env.CORS_ORIGIN ?? 'http://localhost:3000',
  credentials: true,
}))

app.post('/api/chat',  (req, res) => { void handleChat(req, res) })
app.post('/api/token', (req, res) => { void handleToken(req, res) })
app.get('/health', (_req, res) => res.json({ status: 'ok' }))

// ── HTTP + WebSocket ───────────────────────────────────────────────────────────
const httpServer = http.createServer(app)
const wss        = new WebSocketServer({ noServer: true })

httpServer.on('upgrade', (req, socket, head) => {
  const { pathname } = parse(req.url ?? '/', true)
  if (pathname === '/ws/stt') {
    wss.handleUpgrade(req, socket as import('stream').Duplex, head, (ws) => {
      wss.emit('connection', ws, req)
    })
  } else {
    socket.destroy()
  }
})

wss.on('connection', handleSTTConnection)

httpServer.listen(port, () => {
  logger.info('Server', `▲ Jarvis backend prêt sur http://localhost:${port}`)
  console.log(`\n▲ Jarvis backend  http://localhost:${port}`)
  console.log(`  POST /api/chat   POST /api/token   GET /health`)
  console.log(`  WS   ws://localhost:${port}/ws/stt\n`)
})
