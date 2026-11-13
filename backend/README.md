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
