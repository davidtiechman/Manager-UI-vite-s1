# Manager-UI-vite-s1 (React + Vite)

A starter frontend dashboard for Spark Manager with:

- **Default Real-Time landing screen** (current data first).
- **Secondary History mode** for reviewing trends.
- Mocked agent sync data that updates every 5 seconds to simulate live monitoring.

## Run

```bash
cd frontend
npm install
npm run dev
```

## Notes

- This UI is ready to be connected to backend endpoints that expose `agents`, `syncs`, `sync_details`, and `sync_link_qualities`.
- Current implementation uses local mock data and interval-based updates.
