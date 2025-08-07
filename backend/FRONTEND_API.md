# Frontend API Guide

Base URL
- http://localhost:8080/api
- Health: GET /health → { "status": "ok" }

Auth
- Scheme: JWT Bearer in Authorization header: "Bearer <token>"
- Token issued by: POST /api/households and POST /api/households/code/:code/join
- Bootstrap: GET /api/me returns user + household graph
- For protected endpoints, do not send userId/creatorId in body; backend uses JWT claims

Models (response shapes)
- Household: { id, name, inviteCode, createdAt, updatedAt, users:[User], tasks:[Task] }
- User: { id, name, deviceId, householdId, createdAt, updatedAt, lastSeen|null, isActive }
- Task: { id, title, description, category: GENERAL|CHORES|SHOPPING|WORK, dueDate|null, completed, creatorId, householdId, createdAt, updatedAt, completedAt|null, completedBy|null, creator:User, assignments:[{ id, taskId, userId, createdAt, updatedAt, user:User }] }

Households
- POST /api/households
  Auth: none
  Body: { "name": "My Home", "userName": "Alice", "deviceId": "device-123" }
  201: { token, household: Household, user: User }
  Errors: 400 invalid body; 500 create failure
  Example:
  → {"name":"My Home","userName":"Alice","deviceId":"ios-uuid"}
  ← {"token":"<jwt>","household":{...},"user":{...}}

- GET /api/households/code/:code
  Auth: none
  200: Household (no preloads beyond defaults) | 404

- POST /api/households/code/:code/join
  Auth: none
  Body: { "name": "Bob", "deviceId": "device-456" }
  201 new user or 200 existing user: { token, user: User }
  Notes: If deviceId already in household, updates name if changed and returns 200

- GET /api/me
  Auth: required
  200: { user: User, household: Household(with users, tasks.creator, tasks.assignments.user) }

- GET /api/households/:id/users
  Auth: required; must match JWT householdId
  200: [User] | 403 | 500

- GET /api/households/:id/invite
  Auth: required; must match JWT householdId
  200: { "inviteCode": "ABCDEFGH" } | 403 | 404

- POST /api/households/:id/invite/refresh
  Auth: required; must match JWT householdId
  200: { "inviteCode": "NEWCODE" } | 403 | 404 | 500

Tasks
- GET /api/households/:id/tasks
  Auth: required; must match JWT householdId
  200: [Task] (with creator, assignments.user) | 403 | 500

- POST /api/households/:id/tasks
  Auth: required; creator inferred from JWT
  Body: { "title":"...", "description":"...", "category":"GENERAL|CHORES|SHOPPING|WORK", "dueDate": "2025-01-31T12:00:00Z"|null, "assignedTo":["<userId>"] }
  201: Task (with relations) | 400 | 404 | 403 | 500

- PUT /api/tasks/:id
  Auth: required; must belong to JWT household
  Body (any subset): { "title":"", "description":"", "category":"...", "dueDate": ISO8601|null, "assignedTo":["<userId>"] }
  200: Task (with relations) | 400 | 404 | 500

- DELETE /api/tasks/:id
  Auth: required; must belong to JWT household
  200: { "message": "Task deleted successfully" } | 404 | 500

- PATCH /api/tasks/:id/toggle
  Auth: required; acting user from JWT
  Body: {} (ignored)
  200: Task (completed toggled; completedAt/completedBy set/cleared) | 404 | 500

- POST /api/tasks/:id/assign
  Auth: required; task must belong to JWT household
  Body: { "userIds":["<userId>"] }
  200: Task (with relations) | 400 | 404 | 500

- DELETE /api/tasks/:id/assign/:userId
  Auth: required; task must belong to JWT household
  200: Task (with relations) | 404 | 500

Users
- PUT /api/users/:id
  Auth: required; userId must equal JWT userId and be in JWT household
  Body: { "name": "New Name" }
  200: User (lastSeen updated) | 400 | 404 | 403 | 500

- DELETE /api/users/:id
  Auth: required; userId must equal JWT userId
  200: { "message": "Successfully left household" } | 403 | 404 | 500
  Notes: Backend reassigns or deletes created tasks if last member

Conventions
- JSON Content-Type; CORS allowed
- Dates are ISO8601 strings; nullable fields sent as null
- Errors: { "error": "message" } with proper HTTP status

Request headers
- Authorization: Bearer <token> (required for protected routes)
- Content-Type: application/json

Examples (curl)
- Create household: curl -X POST http://localhost:8080/api/households -H 'Content-Type: application/json' -d '{"name":"Home","userName":"Alice","deviceId":"dev-1"}'
- Bootstrap: curl http://localhost:8080/api/me -H 'Authorization: Bearer <token>'
- Create task: curl -X POST http://localhost:8080/api/households/<hid>/tasks -H 'Authorization: Bearer <token>' -H 'Content-Type: application/json' -d '{"title":"Dishes","assignedTo":[]}'
