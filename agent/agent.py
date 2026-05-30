"""
Jarvis Voice Agent — LiveKit agents 1.5 + Anthropic Claude
===========================================================
Pipeline : VAD (Silero) → STT (Deepgram) → LLM (Claude) → TTS (Cartesia)
                                                           ↓
                                                SpatialReal AvatarSession
"""

import asyncio
import json
import logging
import os

from dotenv import load_dotenv
from livekit import rtc
from livekit.agents import AutoSubscribe, JobContext, WorkerOptions, cli
from livekit.agents.voice import Agent, AgentSession
from livekit.plugins import anthropic, cartesia, deepgram, silero
from livekit.plugins.spatialreal import AvatarSession

load_dotenv()

logging.basicConfig(level=logging.INFO)
logger = logging.getLogger("jarvis-agent")

SYSTEM_PROMPT = os.getenv(
    "AGENT_INSTRUCTIONS",
    "Tu es Jarvis, un assistant personnel intelligent et sophistiqué. "
    "Tu réponds de manière concise, naturelle et en français. "
    "Tu es efficace, poli et légèrement formel, comme un majordome numérique.",
)


async def entrypoint(ctx: JobContext) -> None:
    logger.info("Agent démarré — room: %s", ctx.room.name)

    await ctx.connect(auto_subscribe=AutoSubscribe.AUDIO_ONLY)

    agent = Agent(instructions=SYSTEM_PROMPT)

    session = AgentSession(
        vad=silero.VAD.load(),
        stt=deepgram.STT(
            model=os.getenv("DEEPGRAM_MODEL", "nova-2"),
            language=os.getenv("DEEPGRAM_LANGUAGE", "fr"),
        ),
        llm=anthropic.LLM(
            model=os.getenv("LLM_MODEL", "claude-sonnet-4-6"),
            api_key=os.environ["ANTHROPIC_API_KEY"],
        ),
        tts=cartesia.TTS(
            model=os.getenv("CARTESIA_MODEL", "sonic-2"),
            language=os.getenv("CARTESIA_LANGUAGE", "fr"),
            voice=os.getenv("CARTESIA_VOICE", "f786b574-daa5-4673-aa0c-cbe3e8534c02"),
        ),
    )

    avatar_session = AvatarSession(
        api_key=os.environ["SPATIALREAL_API_KEY"],
        app_id=os.environ["SPATIALREAL_APP_ID"],
        avatar_id=os.environ["SPATIALREAL_AVATAR_ID"],
    )

    await avatar_session.start(session, ctx.room)
    await session.start(agent, room=ctx.room)

    @ctx.room.on("data_received")
    def on_data_received(packet: rtc.DataPacket):
        try:
            msg = json.loads(packet.data.decode("utf-8"))
            if msg.get("type") == "jarvis_say" and msg.get("text"):
                logger.info("→ jarvis_say reçu: %s", msg["text"][:80])
                asyncio.create_task(session.say(msg["text"], allow_interruptions=True))
        except Exception as e:
            logger.warning("⚠ data_received parse error: %s", e)

    await session.say(
        "Bonjour, je suis Jarvis. Comment puis-je vous aider?",
        allow_interruptions=True,
    )

    logger.info("Agent prêt")


if __name__ == "__main__":
    cli.run_app(WorkerOptions(entrypoint_fnc=entrypoint, agent_name="jarvis-agent"))
