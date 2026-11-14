from __future__ import annotations

import os
from urllib.request import Request, urlopen


class TelegramAdapter:
    def __init__(self, token: str | None = None):
        self.token = token or os.environ.get('TELEGRAM_BOT_TOKEN')

    def configured(self) -> bool:
        return bool(self.token)

    def send_message(self, chat_id: str, text: str) -> dict:
        if not self.token:
            raise RuntimeError('Telegram is optional and not configured')
        payload = f'chat_id={chat_id}&text={text}'.encode()
        request = Request(f'https://api.telegram.org/bot{self.token}/sendMessage', data=payload, headers={'Content-Type': 'application/x-www-form-urlencoded'})
        with urlopen(request, timeout=20) as response:
            return response.read().decode()
