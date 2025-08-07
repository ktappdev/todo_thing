# WebSocket Backend Implementation

## Overview
- Endpoint: GET /ws
- Auth: JWT via Authorization: Bearer <token> or query ?token=...
- Rooms: household:{householdId}
- Auto-join: On successful auth, connection auto-joins its household room
- Client events: auth, join:household, leave:household
- Server events: JSON frames {"type": string, "data": object}
- Default: WEBSOCKET_ENABLED defaults to true

## Connect
- URL: ws://<api-host>/ws
- Headers: Authorization: Bearer <jwt>
- Or: ws://<api-host>/ws?token=<jwt>
- Optional after connect: {"type":"auth","token":"<jwt>"}

On connect with valid JWT, server extracts userId and householdId and joins room household:{householdId}.

## Client Events
- auth: {"type":"auth","token":"<jwt>"}
- join:household: {"type":"join:household","householdId":"<id>"} (must match authed household)
- leave:household: {"type":"leave:household","householdId":"<id>"}

## Server Broadcasts
Data payloads include full objects where applicable.

- task:created
  - data: { task, householdId }
- task:updated
  - data: { task, householdId }
- task:deleted
  - data: { taskId, householdId }
- task:completed
  - data: { task, householdId, completedBy }
- task:assigned
  - data: { task, householdId }
- task:unassigned
  - data: { task, householdId, unassignedFrom }
- household:member_joined
  - data: { user, household }
- household:invite_code_refreshed
  - data: { inviteCode, household }
- user:updated
  - data: { user, householdId }
- household:member_left
  - data: { userId, household }

## API Integration Points
Emits occur after successful DB mutations in these endpoints:
- POST /api/households/:id/tasks → task:created
- PUT /api/tasks/:id → task:updated
- DELETE /api/tasks/:id → task:deleted
- PATCH /api/tasks/:id/toggle → task:completed
- POST /api/tasks/:id/assign → task:assigned
- DELETE /api/tasks/:id/assign/:userId → task:unassigned
- POST /api/households/code/:code/join and POST /api/households → household:member_joined
- POST /api/households/:id/invite/refresh → household:invite_code_refreshed
- PUT /api/users/:id → user:updated
- DELETE /api/users/:id → household:member_left

## Message Format
- Frame: { "type": "<event>", "data": <payload> }
- Text frames only; ping/pong handled by server

## Environment
- WEBSOCKET_ENABLED=true (default when unset)
- JWT_SECRET=<long random secret>

## Notes
- WebSocket shares the same host/port as the REST API
- Auth is required for room operations and auto-join
- If broadcasting fails, API requests are not affected