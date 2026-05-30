/**
 * Map de sessionId → AbortController du stream Claude correspondant.
 * Le handler /api/chat enregistre le controller ; le handler WebSocket
 * barge-in l'annule via controller.abort().
 */
export const activeStreams = new Map<string, AbortController>()
