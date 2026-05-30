import type { IncomingMessage } from 'http'
import type { WebSocket } from 'ws'
import { createSTTSession } from '../lib/stt'
import { activeStreams } from '../lib/activeStreams'
import { logger } from '../lib/logger'
import type { WsClientMessage } from '../types/avatarkit'

const CTX = 'WS/STT'

export function handleSTTConnection(ws: WebSocket, _req: IncomingMessage): void {
  logger.info(CTX, '← WebSocket STT connexion ouverte')

  let language   = 'fr'
  let sttSession = createSTTSession(ws, language)

  ws.on('message', (data: Buffer | string) => {
    let msg: WsClientMessage
    try {
      msg = JSON.parse(typeof data === 'string' ? data : data.toString()) as WsClientMessage
    } catch {
      return
    }

    switch (msg.type) {
      case 'config': {
        language = msg.language
        sttSession.close()
        sttSession = createSTTSession(ws, language)
        logger.info(CTX, '↺ STT reconfiguré', { language })
        break
      }

      case 'audio_chunk': {
        const pcmBuffer = Buffer.from(msg.data, 'base64')
        sttSession.sendAudio(pcmBuffer)
        break
      }

      case 'barge_in': {
        const { avatarSessionId } = msg
        logger.info(CTX, '⚡ barge-in', { avatarSessionId })
        const controller = activeStreams.get(avatarSessionId)
        if (controller) {
          controller.abort('barge-in')
          activeStreams.delete(avatarSessionId)
          logger.info(CTX, '✓ stream Claude annulé')
        }
        break
      }
    }
  })

  ws.on('close', () => {
    logger.info(CTX, '→ connexion fermée')
    sttSession.close()
  })

  ws.on('error', (err) => {
    logger.error(CTX, '✗ WebSocket error', { err: String(err) })
    sttSession.close()
  })
}
