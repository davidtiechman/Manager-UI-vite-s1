# Agent / Manager / UI demo (with PostgreSQL)

This folder contains a new standalone architecture focused on frontend development with mock-like generated runtime data:

- `agent` sends sync payload to `manager` every 15 seconds (or server-defined interval).
- `manager` stores all sync data in PostgreSQL and returns active configuration.
- `ui` polls `manager` continuously and renders real-time + history views.

## Services

- Manager: `http://localhost:9000`
- UI: `http://localhost:5173`
- Postgres: `localhost:5432`

## Run with Docker Compose

```bash
cd platform
docker compose up --build
```

## Key API

- `POST /api/agents/sync` -> called by Agent, returns configuration + next sync interval
- `POST /api/configurations/:agentId` -> update an agent config
- `GET /api/ui/agents` -> UI real-time list
- `GET /api/ui/agents/:agentId/history?limit=20` -> UI history
