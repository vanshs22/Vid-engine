# Agent Orchestration Foundation

This backend adds a real local Director/agent layer without replacing the existing Remotion/Three.js media engine.

## Install

```bash
python3 -m venv .venv-agent
. .venv-agent/bin/activate
pip install -e backend
```

The backend dependencies are free/open-source. No LLM call is required for the deterministic local MVP.

## Inspect agents

```bash
python -m backend.app.cli agents
```

## Run the deterministic MVP graph

```bash
python -m backend.app.cli run-mvp --topic "How local voice generation works"
```

The Director creates SQLite checkpoints at `.cache/agent-state.sqlite3` and agent artifacts under `projects/<project-id>/agent-artifacts/`. The MVP agents do not overwrite approved media artifacts or install software.

## FastAPI

```bash
uvicorn backend.app.api:create_app --factory --reload
```

The API exposes `/agents`, `/projects/run`, and `/projects/{project_id}`.

## Architecture

- `models.py`: Pydantic task, artifact, project, and production-state contracts.
- `registry.py`: permission-aware agent definitions.
- `tools.py`: controlled tool registry and project path guard.
- `store.py`: SQLite checkpoints and artifact/lesson persistence.
- `orchestrator.py`: Director with dependencies, status updates, retries-ready task records, and deterministic fallback.
- `langgraph_flow.py`: LangGraph graph builder when the optional dependency is installed.
- `agents/mvp.py`: functional MVP department agents.

The current backend is intentionally deterministic to minimize credits. Provider-backed LLM, web research, browser, and vision tools can be added behind the same artifact contracts.

## Optional capability adapters

- `providers.py`: URL research, OpenAI-compatible LLM, and vision-review interfaces.
- `editing.py`: raw-footage metadata/audio helpers for Mode B.
- `memory.py`: SQLite memory interface with a PostgreSQL/pgvector-compatible seam.
- `jobs.py`: local parallel job queue for multi-project execution.
- `telegram.py`: explicit, token-gated Telegram adapter.

These adapters fail closed when credentials or providers are absent. The local deterministic workflow remains usable without paid services.

## LLM and Telegram configuration

Optional environment variables:

```bash
UVS_LLM_API_KEY=...
UVS_LLM_BASE_URL=https://api.openai.com/v1
UVS_LLM_MODEL=gpt-4o-mini
GEMINI_API_KEY=...
GEMINI_MODEL=gemini-2.0-flash
TELEGRAM_BOT_TOKEN=...
DATABASE_URL=postgresql://...
```

Without provider keys, the Director uses deterministic local artifacts. `TelegramBotService` accepts `/create <topic>`, submits a persistent project job to the local queue, and sends a confirmation. Credentials are never stored in project artifacts.

## FreeLLMAPI and Agent-Reach

### FreeLLMAPI

Run FreeLLMAPI separately, then configure:

```bash
FREELLMAPI_BASE_URL=http://localhost:3001/v1
FREELLMAPI_API_KEY=...
FREELLMAPI_MODEL=auto
```

The existing OpenAI-compatible provider then routes script/research/vision-supporting text requests through FreeLLMAPI. Its router/failover remains external; when it is unavailable, the Director uses deterministic local artifacts.

### Agent-Reach

Install Agent-Reach from its GitHub instructions, not an unrelated PyPI package, then enable trend research per request:

```bash
agent-reach channels
agent-reach youtube search "your niche topic"
```

Set `trend_research=true` in the project request. The `trend_research` agent queries YouTube, Twitter, and Reddit when the CLI is available; otherwise it records a skipped optional task and does not block production.
