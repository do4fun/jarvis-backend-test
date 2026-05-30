import type { AvatarResponse, ConversationTurn } from './avatar'

// ── Request ───────────────────────────────────────────────────────────────────

export interface ChatRequest {
  message: string
  history?: Pick<ConversationTurn, 'role' | 'content'>[]
  avatarSessionId?: string
  /** LiveKit room name — defaults to 'jarvis-room' on the server */
  room?: string
}

// ── SSE Events ────────────────────────────────────────────────────────────────

export interface SSETextDelta {
  type: 'text_delta'
  content: string
}

export interface SSEAvatarComplete {
  type: 'avatar_complete'
  response: AvatarResponse
}

export interface SSEError {
  type: 'error'
  message: string
}

export interface SSEDone {
  type: 'done'
}

export type SSEEvent = SSETextDelta | SSEAvatarComplete | SSEError | SSEDone
