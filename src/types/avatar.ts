// ── Animation ─────────────────────────────────────────────────────────────────

export type AnimationName =
  | 'idle'
  | 'talking'
  | 'nodding'
  | 'thinking'
  | 'waving'
  | 'surprised'
  | 'shaking_head'

export interface AnimationCommand {
  name: AnimationName
  intensity?: number
  duration?: number
  crossFade?: boolean
}

// ── Emotion ───────────────────────────────────────────────────────────────────

export type EmotionName =
  | 'neutral'
  | 'happy'
  | 'sad'
  | 'angry'
  | 'surprised'
  | 'curious'
  | 'excited'
  | 'confused'

// ── Environment ───────────────────────────────────────────────────────────────

export type EnvironmentPreset =
  | 'default'
  | 'night'
  | 'office'
  | 'outdoor'
  | 'studio'
  | 'warehouse'

export interface EnvironmentCommand {
  preset?: EnvironmentPreset
  ambientIntensity?: number
  backgroundColor?: string
}

// ── AvatarResponse — LLM ↔ Frontend contract ─────────────────────────────────

export interface AvatarResponse {
  text: string
  animation: AnimationCommand
  emotion: EmotionName
  environment?: EnvironmentCommand
  metadata?: {
    thinking?: boolean
    language?: string
  }
}

// ── Conversation ──────────────────────────────────────────────────────────────

export interface ConversationTurn {
  id: string
  role: 'user' | 'assistant'
  content: string
  timestamp: number
  avatarResponse?: AvatarResponse
}
