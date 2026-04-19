# Manager UI Vite S1

This project runs a React frontend with a lightweight manager service and 5 agent services in Docker.

## Services

- `manager` - Express API service on `http://localhost:9000`
- `ui` - React Vite frontend on `http://localhost:5173`
- `agent-001`..`agent-005` - simulated agents posting sync data to the manager

## Run

From the project root:

```bash
docker compose up --build
```

Open the UI in your browser:

```text
http://localhost:5173
```

## Notes

- The frontend fetches agent status from `http://manager:9000/api/ui/agents`
- Each agent sends sync data to `http://manager:9000/api/agents/sync`
- The manager keeps a short history for each agent

## Stop

```bash
docker compose down
```
