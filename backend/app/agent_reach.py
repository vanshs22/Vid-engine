from __future__ import annotations

import shutil
import subprocess
from dataclasses import dataclass


@dataclass
class AgentReachAdapter:
    executable: str | None = None

    def __post_init__(self):
        self.executable = self.executable or shutil.which('agent-reach')

    def available(self) -> bool:
        return bool(self.executable)

    def search(self, channel: str, query: str) -> dict:
        if not self.executable:
            return {'status': 'not_configured', 'channel': channel, 'query': query}
        result = subprocess.run([self.executable, channel, 'search', query], capture_output=True, text=True, timeout=90)
        return {'status': 'completed' if result.returncode == 0 else 'failed', 'channel': channel, 'query': query, 'stdout': result.stdout[-20000:], 'stderr': result.stderr[-4000:]}

    def read(self, url: str) -> dict:
        if not self.executable:
            return {'status': 'not_configured', 'url': url}
        result = subprocess.run([self.executable, 'read', url], capture_output=True, text=True, timeout=90)
        return {'status': 'completed' if result.returncode == 0 else 'failed', 'url': url, 'stdout': result.stdout[-20000:], 'stderr': result.stderr[-4000:]}
