from __future__ import annotations

import json
import os
from urllib.parse import urlencode
from urllib.request import Request, urlopen

from .jobs import LocalJobQueue
from .models import ProjectRequest
from .orchestrator import Director


class TelegramBotService:
    def __init__(self, director: Director, queue: LocalJobQueue, token: str | None = None):
        self.director = director
        self.queue = queue
        self.token = token or os.environ.get('TELEGRAM_BOT_TOKEN')
        self.offset = 0

    def configured(self) -> bool:
        return bool(self.token)

    def poll_once(self) -> list[dict]:
        if not self.token: raise RuntimeError('TELEGRAM_BOT_TOKEN is not configured')
        url = f'https://api.telegram.org/bot{self.token}/getUpdates?' + urlencode({'offset': self.offset, 'timeout': 0})
        with urlopen(url, timeout=20) as response:
            payload = json.loads(response.read().decode())
        updates = payload.get('result', [])
        for update in updates:
            self.offset = max(self.offset, int(update['update_id']) + 1)
            message = update.get('message', {})
            text = message.get('text', '').strip()
            chat_id = message.get('chat', {}).get('id')
            if text.startswith('/create ') and chat_id is not None:
                topic = text.removeprefix('/create ').strip()
                request = ProjectRequest(topic=topic)
                self.queue.submit(request.project_id, lambda request=request: self.director.run(request))
                self.send_message(str(chat_id), f'Queued {request.project_id}: {topic}')
        return updates

    def send_message(self, chat_id: str, text: str) -> None:
        if not self.token: raise RuntimeError('TELEGRAM_BOT_TOKEN is not configured')
        body = urlencode({'chat_id': chat_id, 'text': text}).encode()
        request = Request(f'https://api.telegram.org/bot{self.token}/sendMessage', data=body, headers={'Content-Type': 'application/x-www-form-urlencoded'})
        with urlopen(request, timeout=20): pass
