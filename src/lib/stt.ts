// ─────────────────────────────────────────────────────────────────────────────
// STT — Service de transcription temps réel via Deepgram
//
// Reçoit de l'audio PCM16 depuis le WebSocket navigateur et retourne des
// transcriptions au fil de l'eau (interim + final).
//
// Optimisations latence :
//   1. Nova-2 avec interim_results=true → premier mot transcrit en ~100ms
//   2. endpointing=300ms → détection de fin de phrase rapide
//   3. encoding=linear16 → pas de décodage codec côté serveur
//   4. Connexion Deepgram persistante par session WebSocket
// ─────────────────────────────────────────────────────────────────────────────

import { createClient, LiveTranscriptionEvents } from '@deepgram/sdk'
import type { WebSocket } from 'ws'
import { logger } from './logger'
import type { WsServerMessage } from '../types/avatarkit'

const CTX = 'STT'

let _deepgramClient: ReturnType<typeof createClient> | null = null

function getDeepgramClient() {
  if (_deepgramClient) return _deepgramClient
  const key = process.env.DEEPGRAM_API_KEY
  if (!key) {
    logger.warn(CTX, 'DEEPGRAM_API_KEY manquant — STT désactivé')
    return null
  }
  _deepgramClient = createClient(key)
  return _deepgramClient
}

export interface STTSession {
  sendAudio: (buffer: Buffer) => void
  close:     () => void
}

export function createSTTSession(clientWs: WebSocket, language = 'fr'): STTSession {
  logger.info(CTX, '→ createSTTSession', { language })

  const client = getDeepgramClient()
  if (!client) {
    return { sendAudio: () => {}, close: () => {} }
  }

  const live = client.listen.live({
    model:           'nova-2',
    language,
    smart_format:    true,
    interim_results: true,
    endpointing:     300,
    encoding:        'linear16',
    sample_rate:     16000,
    channels:        1,
    filler_words:    false,
  })

  const send = (msg: WsServerMessage) => {
    if (clientWs.readyState === 1 /* OPEN */) {
      clientWs.send(JSON.stringify(msg))
    }
  }

  live.on(LiveTranscriptionEvents.Open, () => {
    logger.info(CTX, '✓ Deepgram connexion ouverte')
    send({ type: 'ready' })
  })

  live.on(LiveTranscriptionEvents.Transcript, (data) => {
    const alt = data.channel?.alternatives?.[0]
    if (!alt?.transcript) return
    send({
      type:    'transcript',
      text:    alt.transcript,
      isFinal: data.is_final === true,
    })
  })

  live.on(LiveTranscriptionEvents.Error, (err) => {
    logger.error(CTX, '✗ Deepgram error', { err: String(err) })
    send({ type: 'error', message: String(err) })
  })

  live.on(LiveTranscriptionEvents.Close, () => {
    logger.info(CTX, '← Deepgram connexion fermée')
  })

  return {
    sendAudio: (buffer: Buffer) => {
      try {
        const ab = buffer.buffer.slice(buffer.byteOffset, buffer.byteOffset + buffer.byteLength)
        live.send(ab as ArrayBuffer)
      } catch {
        // Ignore errors if connection is already closed (e.g. barge-in)
      }
    },
    close: () => {
      try {
        live.finish()
      } catch {
        // Ignore double-close errors
      }
    },
  }
}
