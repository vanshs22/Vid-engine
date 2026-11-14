from __future__ import annotations

import json
import os
from dataclasses import dataclass


@dataclass
class RedisJobQueue:
    url: str | None = None

    def __post_init__(self):
        self.url = self.url or os.environ.get('REDIS_URL')
        if not self.url:
            raise RuntimeError('REDIS_URL is required for Redis queue')
        try:
            import redis
        except ImportError as exc:
            raise RuntimeError('Install redis to use RedisJobQueue') from exc
        self.client = redis.Redis.from_url(self.url, decode_responses=True)

    def submit(self, job_id: str, payload: dict) -> None:
        self.client.rpush('uvs:jobs', json.dumps({'job_id': job_id, 'payload': payload}))

    def get(self, timeout: int = 5):
        item = self.client.blpop('uvs:jobs', timeout=timeout)
        return json.loads(item[1]) if item else None
