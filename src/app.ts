import 'dotenv/config'
import express from 'express'
import cors from 'cors'
import { handleChat } from './routes/chat'
import { handleToken } from './routes/token'

const app = express()
app.use(express.json())
app.use(cors({
  origin:      process.env.CORS_ORIGIN ?? 'http://localhost:3000',
  credentials: true,
}))

app.post('/api/chat',  (req, res) => { void handleChat(req, res) })
app.post('/api/token', (req, res) => { void handleToken(req, res) })
app.get('/health', (_req, res) => res.json({ status: 'ok' }))

export default app
