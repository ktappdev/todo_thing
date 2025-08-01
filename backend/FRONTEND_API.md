# Frontend API Guide

Base URL
- http://localhost:8080/api
- Health: GET /health → { "status": "ok" }

Storage
- SQLite via GORM; file household_todo.db
- IDs are UUID strings

Households
- POST /api/households
  Body: { "name": "My Home" }
  201: { id, name, inviteCode, createdAt, updatedAt, users:[], tasks:[] }
- GET /api/households/code/:code
  200: { id, name, inviteCode, ... } | 404
- POST /api/households/code/:code/join
  Body: { "name": "Alice", "deviceId": "device-123" }
  201 new user or 200 existing user: { id, name, deviceId, householdId, lastSeen, isActive, ... }
- GET /api/households/:id/users
  200: [User]
- GET /api/households/:id/invite
  200: { "inviteCode": "ABCDEFGH" }
- POST /api/households/:id/invite/refresh
  200: { "inviteCode": "NEWCODE" }

Tasks
- GET /api/households/:id/tasks
  200: [Task with creator, assignments.user]
- POST /api/households/:id/tasks
  Body: { "title":"...", "description":"...", "category":"GENERAL|CHORES|SHOPPING|WORK", "dueDate": ISO8601|null, "creatorId":"<userId>", "assignedTo":["<userId>"] }
  201: Task (with relations)
- PUT /api/tasks/:id
  Body (any subset): { "title":"", "description":"", "category":"...", "dueDate": ISO8601|null, "assignedTo":["<userId>"] }
  200: Task (with relations)
- DELETE /api/tasks/:id
  200: { "message": "Task deleted successfully" }
- PATCH /api/tasks/:id/toggle
  Body: { "userId":"<userId>" }
  200: Task (completed, completedAt, completedBy updated)
- POST /api/tasks/:id/assign
  Body: { "userIds":["<userId>"] }
  200: Task (with relations)
- DELETE /api/tasks/:id/assign/:userId
  200: Task (with relations)

Users
- PUT /api/users/:id
  Body: { "name": "New Name" }
  200: User (lastSeen updated)
- DELETE /api/users/:id
  200: { "message": "Successfully left household" }

Conventions
- JSON Content-Type; CORS allowed.
- Dates are ISO8601 strings; nullable fields sent as null.
- Errors: { "error": "message" } with appropriate status.
