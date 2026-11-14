from __future__ import annotations

from dataclasses import dataclass
from pathlib import Path
from typing import Callable


@dataclass(frozen=True)
class Tool:
    name: str
    description: str
    handler: Callable[..., object]


class PermissionDenied(Exception):
    pass


class ToolRegistry:
    def __init__(self) -> None:
        self._tools: dict[str, Tool] = {}

    def register(self, tool: Tool) -> None:
        self._tools[tool.name] = tool

    def call(self, tool_name: str, *, permissions: set[str], **kwargs: object) -> object:
        tool = self._tools[tool_name]
        required = f"tool:{tool_name}"
        if required not in permissions and "tool:*" not in permissions:
            raise PermissionDenied(f"Agent lacks permission {required}")
        return tool.handler(**kwargs)

    def describe(self) -> list[dict[str, str]]:
        return [{"name": tool.name, "description": tool.description} for tool in self._tools.values()]


def safe_project_path(root: Path, relative: str) -> Path:
    resolved = (root / relative).resolve()
    if root.resolve() not in resolved.parents and resolved != root.resolve():
        raise PermissionDenied(f"Path escapes project workspace: {relative}")
    return resolved
