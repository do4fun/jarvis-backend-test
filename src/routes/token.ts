// ─────────────────────────────────────────────────────────────────────────────
// POST /api/token — Génère un token LiveKit + dispatche l'agent vocal
//
// Flow :
//   1. Génère un JWT d'accès pour le navigateur (1h de validité)
//   2. Dispatche le worker Python "jarvis-agent" dans la room
//   3. Retourne { token, url, room, identity }
// ─────────────────────────────────────────────────────────────────────────────

import type { Request, Response } from 'express'
import { AccessToken, AgentDispatchClient } from 'livekit-server-sdk'
import { logger } from '../lib/logger'

const CTX = '/api/token'

export async function handleToken(req: Request, res: Response): Promise<void> {
  const livekitUrl    = process.env.LIVEKIT_URL
  const livekitApiKey = process.env.LIVEKIT_API_KEY
  const livekitSecret = process.env.LIVEKIT_API_SECRET

  if (!livekitUrl || !livekitApiKey || !livekitSecret) {
    logger.error(CTX, '✗ Variables LiveKit manquantes (LIVEKIT_URL / LIVEKIT_API_KEY / LIVEKIT_API_SECRET)')
    res.status(500).json({ error: "LiveKit non configuré — vérifier les variables d'environnement" })
    return
  }

  const body     = req.body as { room?: string }
  const room     = body.room ?? 'jarvis-room'
  const identity = `browser-${crypto.randomUUID().slice(0, 8)}`

  logger.info(CTX, '→ génération token', { room, identity })

  const at = new AccessToken(livekitApiKey, livekitSecret, {
    identity,
    ttl: '1h',
  })
  at.addGrant({
    roomJoin:       true,
    room,
    canPublish:     true,
    canSubscribe:   true,
    canPublishData: true,
  })
  const token = await at.toJwt()

  try {
    const httpUrl  = livekitUrl.replace(/^wss?:\/\//, 'https://')
    const dispatch = new AgentDispatchClient(httpUrl, livekitApiKey, livekitSecret)
    await dispatch.createDispatch(room, 'jarvis-agent')
    logger.info(CTX, '✓ agent dispatché', { room })
  } catch (err) {
    logger.warn(CTX, '⚠ dispatch agent échoué (agent déjà présent?)', { err: String(err) })
  }

  logger.info(CTX, '✓ token généré', { room, identity })

  res.json({ token, url: livekitUrl, room, identity })
}
