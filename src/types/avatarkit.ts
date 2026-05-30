// ── Messages WebSocket STT ─────────────────────────────────────────────────────

/**
 * Messages du navigateur → endpoint WebSocket /ws/stt
 *
 * L'audio est envoyé en PCM16 brut (pas d'encodage mp3/opus)
 * pour éviter la latence de codec côté navigateur.
 */
export type WsClientMessage =
  | {
      type: 'audio_chunk'
      /** ArrayBuffer PCM16 encodé en base64 (128 samples = 8ms @ 16kHz) */
      data: string
    }
  | {
      type: 'barge_in'
      avatarSessionId: string
    }
  | { type: 'config'; language: string }

/** Messages du backend STT WebSocket → navigateur */
export type WsServerMessage =
  | {
      type: 'transcript'
      text: string
      isFinal: boolean
    }
  | { type: 'error'; message: string }
  | { type: 'ready' }
