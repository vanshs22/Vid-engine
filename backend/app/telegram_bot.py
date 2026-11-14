from __future__ import annotations

import json
import os
from urllib.parse import urlencode
from urllib.request import Request, urlopen

from .jobs import LocalJobQueue
from .models import PageProfile, ProjectRequest
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
            if text.startswith('/page ') and chat_id is not None:
                parts = text.split()
                page_id = parts[1]
                profile = self.director.store.load_page_profile(page_id)
                if profile is None:
                    profile = PageProfile(page_id=page_id)
                    self.director.store.save_page_profile(profile)
                self.send_message(str(chat_id), f'Page {page_id} saved. Style: {profile.style}; caption: {profile.caption_style}')
            elif text.startswith('/competitor ') and chat_id is not None:
                parts = text.split(maxsplit=2)
                if len(parts) < 3: continue
                page_id, competitor = parts[1], parts[2]
                profile = self.director.store.load_page_profile(page_id) or PageProfile(page_id=page_id)
                if competitor not in profile.competitors: profile.competitors.append(competitor)
                self.director.store.save_page_profile(profile)
                self.send_message(str(chat_id), f'Saved competitor for {page_id}: {competitor}')
            elif text.startswith('/create ') and chat_id is not None:
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
