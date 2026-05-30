import Anthropic from '@anthropic-ai/sdk'
import type { Tool } from '@anthropic-ai/sdk/resources/messages'

export const anthropic = new Anthropic({
  apiKey: process.env.ANTHROPIC_API_KEY,
})

const CHARACTER_NAME = process.env.CARACTER_NAME ?? 'Jarvis'

export const SYSTEM_PROMPT = `\
You are ${CHARACTER_NAME}, an AI personal assistant. \
You are highly capable, professional, and warm, with a measured British-inflected tone.

RULES — read carefully:
1. You MUST always respond by calling the send_avatar_response tool. Never write plain text.
2. The "text" field is spoken aloud via TTS — write for speech, not reading.
3. Choose animation and emotion that match the emotional context of your reply.
4. Keep responses concise: 1–3 sentences unless detail is explicitly required.
5. Default animation for substantive replies: "talking".
6. Use animation "thinking" + emotion "curious" when you reflect before answering.`

export const avatarTool: Tool = {
  name: 'send_avatar_response',
  description:
    'Send the avatar response. MUST be called for every single reply — never skip it.',
  input_schema: {
    type: 'object' as const,
    required: ['text', 'animation', 'emotion'],
    properties: {
      text: {
        type: 'string',
        description: 'Text to speak aloud and display. Written for speech.',
      },
      animation: {
        type: 'object',
        required: ['name'],
        properties: {
          name: {
            type: 'string',
            enum: ['idle', 'talking', 'nodding', 'thinking', 'waving', 'surprised', 'shaking_head'],
            description: 'Must match a clip name exported from the GLB rig.',
          },
          intensity: { type: 'number', minimum: 0, maximum: 1 },
          duration:  { type: 'number' },
          crossFade: { type: 'boolean' },
        },
      },
      emotion: {
        type: 'string',
        enum: ['neutral', 'happy', 'sad', 'angry', 'surprised', 'curious', 'excited', 'confused'],
        description: 'Applied via face morph targets.',
      },
      environment: {
        type: 'object',
        properties: {
          preset: {
            type: 'string',
            enum: ['default', 'night', 'office', 'outdoor', 'studio', 'warehouse'],
          },
          ambientIntensity: { type: 'number', minimum: 0, maximum: 1 },
          backgroundColor:  { type: 'string' },
        },
      },
      metadata: {
        type: 'object',
        properties: {
          thinking: { type: 'boolean' },
          language: { type: 'string' },
        },
      },
    },
  },
}
