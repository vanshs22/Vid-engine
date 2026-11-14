from __future__ import annotations

from dataclasses import dataclass, field


@dataclass(frozen=True)
class AgentDefinition:
    name: str
    department: str
    responsibility: str
    tools: tuple[str, ...] = ()
    permissions: tuple[str, ...] = ()


MVP_AGENTS: tuple[AgentDefinition, ...] = (
    AgentDefinition("director", "orchestration", "Own production state, dependencies, retries, approvals and delivery", ("task_store", "agent_registry"), ("project:read", "project:write")),
    AgentDefinition("research", "research", "Create a local research placeholder and source ledger", ("filesystem",), ("research:write",)),
    AgentDefinition("trend_research", "research", "Find platform trends and competitor/reference patterns through Agent-Reach when configured", ("agent-reach",), ("research:write",)),
    AgentDefinition("script_writer", "story", "Create or normalize the script brief", ("filesystem",), ("script:write",)),
    AgentDefinition("script_critic", "story", "Check pacing, repetition, unsupported claims and duration", ("filesystem",), ("script:read",)),
    AgentDefinition("prompt_designer", "creative", "Turn approved scene intent into structured visual plans", ("filesystem",), ("storyboard:read", "storyboard:write")),
    AgentDefinition("storyboard", "production", "Create sentence-level scene specifications", ("filesystem",), ("storyboard:write",)),
    AgentDefinition("visual_production", "production", "Connect scene plans to the existing Remotion/Three.js renderer", ("terminal", "remotion", "threejs"), ("render:write",)),
    AgentDefinition("voice", "audio", "Run optional local Kokoro narration and cache it", ("terminal", "kokoro"), ("audio:write",)),
    AgentDefinition("alignment", "audio", "Align narration with local faster-whisper", ("terminal", "whisper"), ("timing:write",)),
    AgentDefinition("longform_editor", "editing", "Transcribe, score, crop and render long-form moments into vertical candidates", ("ffmpeg", "ffprobe", "whisper", "agent-reach"), ("raw:read", "edit:write")),
    AgentDefinition("raw_editor", "editing", "Probe raw footage, create an edit decision list, extract audio and produce a safe local baseline", ("terminal", "ffmpeg", "ffprobe"), ("raw:read", "edit:write")),
    AgentDefinition("editor", "editing", "Run preparation, mix, render and contact-sheet tools", ("terminal", "ffmpeg", "remotion"), ("render:write",)),
    AgentDefinition("quality", "quality", "Run media metadata, audio and sampled-frame QA", ("terminal", "ffprobe", "opencv"), ("qa:read",)),
    AgentDefinition("learning", "learning", "Record approved lessons and failures without mutating code", ("sqlite",), ("memory:write",)),
)


class AgentRegistry:
    def __init__(self, definitions: tuple[AgentDefinition, ...] = MVP_AGENTS):
        self._definitions = {definition.name: definition for definition in definitions}

    def get(self, name: str) -> AgentDefinition:
        return self._definitions[name]

    def list(self) -> list[AgentDefinition]:
        return list(self._definitions.values())

    def has(self, name: str) -> bool:
        return name in self._definitions
