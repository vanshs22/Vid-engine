from __future__ import annotations

from datetime import datetime, timezone
from enum import Enum
from typing import Any
from uuid import uuid4

from pydantic import BaseModel, Field


def now_iso() -> str:
    return datetime.now(timezone.utc).isoformat()


class ProductionMode(str, Enum):
    creation = "creation"
    editing = "editing"
    reference_intelligence = "reference_intelligence"


class TaskStatus(str, Enum):
    pending = "pending"
    running = "running"
    completed = "completed"
    failed = "failed"
    skipped = "skipped"


class ArtifactType(str, Enum):
    research = "research"
    script = "script"
    storyboard = "storyboard"
    style_profile = "style_profile"
    asset_manifest = "asset_manifest"
    audio = "audio"
    timing = "timing"
    render = "render"
    qa_report = "qa_report"
    lesson = "lesson"


class ProjectRequest(BaseModel):
    project_id: str = Field(default_factory=lambda: f"project-{uuid4().hex[:8]}")
    mode: ProductionMode = ProductionMode.creation
    topic: str = "How local voice generation works"
    duration_seconds: int = Field(default=30, ge=5, le=600)
    style: str = "voice-studio-3d"
    platform: str = "short-form-vertical"
    reference_path: str | None = None
    raw_path: str | None = None


class Artifact(BaseModel):
    artifact_id: str = Field(default_factory=lambda: uuid4().hex)
    project_id: str
    artifact_type: ArtifactType
    path: str
    version: int = 1
    producer: str
    status: str = "approved"
    metadata: dict[str, Any] = Field(default_factory=dict)
    created_at: str = Field(default_factory=now_iso)


class Task(BaseModel):
    task_id: str = Field(default_factory=lambda: uuid4().hex)
    project_id: str
    agent: str
    action: str
    inputs: list[str] = Field(default_factory=list)
    outputs: list[str] = Field(default_factory=list)
    depends_on: list[str] = Field(default_factory=list)
    status: TaskStatus = TaskStatus.pending
    attempts: int = 0
    max_attempts: int = 2
    error: str | None = None
    created_at: str = Field(default_factory=now_iso)
    updated_at: str = Field(default_factory=now_iso)


class AgentResult(BaseModel):
    agent: str
    status: TaskStatus
    artifacts: list[Artifact] = Field(default_factory=list)
    message: str = ""
    metrics: dict[str, Any] = Field(default_factory=dict)


class ProductionState(BaseModel):
    project: ProjectRequest
    stage: str = "created"
    tasks: list[Task] = Field(default_factory=list)
    artifacts: list[Artifact] = Field(default_factory=list)
    errors: list[str] = Field(default_factory=list)
    events: list[dict[str, Any]] = Field(default_factory=list)
    updated_at: str = Field(default_factory=now_iso)
