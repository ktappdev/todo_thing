# Backend Authentication Guide (JWT-based)

## 1. Overview

To secure the application and ensure that only authorized users can access or modify household data, we will implement token-based authentication using JSON Web Tokens (JWT).

This approach is designed to work **without a traditional username/password login system**. Instead, a user is identified by their unique `deviceId` when they first create or join a household. The backend will issue a long-lived JWT that the client application will store securely. This token will be used to authenticate every subsequent API request.

The core idea is: **one device, one user, one token.**

## 2. JWT Structure

When the backend generates a JWT, it should be signed with a strong secret key known only to the server. The payload of the token must contain the following claims:

```json
{
  "userId": "user-uuid-123",
  "householdId": "household-uuid-456",
  "deviceId": "unique-device-id-789",
  "exp": 1704067199 // Expiration timestamp (e.g., 1 year from now)
}
```

-   `userId`: The UUID of the user.
-   `householdId`: The UUID of the household the user belongs to.
-   `deviceId`: The client-generated unique identifier for the device.
-   `exp`: The token's expiration time. A long expiration (e.g., 1 year) is suitable for this model, as there is no "re-login" flow.

## 3. API Endpoint Modifications

The following endpoints need to be updated to issue JWTs and handle authenticated requests.

### A. Create Household & First User

**Endpoint:** `POST /api/households`

This endpoint should now also create the first user for the household.

**Request Body:**
```json
{
  "name": "My Home", // Household name
  "userName": "Alice",   // First user's name
  "deviceId": "client-generated-unique-id-1"
}
```

**Response (201 Created):**

The response should include the newly created household, the first user, and a JWT.

```json
{
  "token": "your.jwt.here",
  "household": {
    "id": "household-uuid-456",
    "name": "My Home",
    "inviteCode": "ABCDEFGH",
    // ... other household fields
  },
  "user": {
    "id": "user-uuid-123",
    "name": "Alice",
    "deviceId": "client-generated-unique-id-1",
    // ... other user fields
  }
}
```

### B. Join Household

**Endpoint:** `POST /api/households/code/:code/join`

This endpoint creates a new user in an existing household and returns a JWT. It should also handle cases where a user with the same `deviceId` is rejoining.

**Request Body:**
```json
{
  "name": "Bob",
  "deviceId": "client-generated-unique-id-2"
}
```

**Logic:**
1.  Find the household by its `inviteCode`.
2.  Check if a user with the given `deviceId` already exists in this household.
    -   If YES: Do not create a new user. Return the existing user's data and a new JWT.
    -   If NO: Create a new user and associate them with the household.
3.  Return the user data and a JWT.

**Response (200 OK or 201 Created):**
```json
{
  "token": "your.jwt.here",
  "user": {
    "id": "user-uuid-457",
    "name": "Bob",
    "deviceId": "client-generated-unique-id-2",
    "householdId": "household-uuid-456"
  }
}
```

## 4. New Bootstrap Endpoint

To simplify the app's initial data loading, we need a single endpoint that returns all necessary data for a logged-in user.

**Endpoint:** `GET /api/me`

**Authentication:** **Required**. The client must send its JWT in the `Authorization: Bearer <token>` header.

**Logic:**
1.  Validate the JWT from the `Authorization` header.
2.  Extract `userId` and `householdId` from the token payload.
3.  Fetch all relevant data for that user and household.

**Response (200 OK):**
```json
{
  "user": { /* ... full user object ... */ },
  "household": {
    "id": "household-uuid-456",
    "name": "My Home",
    "inviteCode": "ABCDEFGH",
    "users": [ /* ... array of full user objects in the household ... */ ],
    "tasks": [ /* ... array of all tasks in the household (with relations) ... */ ]
  }
}
```

## 5. Securing Endpoints

All endpoints that handle sensitive data must be protected. The backend should expect a JWT in the `Authorization` header for these routes. The `userId` should be extracted from the validated token, not taken from the request body.

**Remove `userId` from Request Bodies:**

For endpoints like `POST /api/households/:id/tasks` or `PATCH /api/tasks/:id/toggle`, the `creatorId` or `userId` should no longer be passed in the body. The backend will use the `userId` from the JWT claim.

**Example: Create Task**
-   **Endpoint:** `POST /api/households/:id/tasks`
-   **Old Body:** `{ "title": "...", "creatorId": "<userId>", ... }`
-   **New Body:** `{ "title": "...", ... }` (no `creatorId`)

**List of Endpoints to Secure:**
-   `GET /api/households/:id/users`
-   `GET /api/households/:id/invite`
-   `POST /api/households/:id/invite/refresh`
-   `GET /api/households/:id/tasks`
-   `POST /api/households/:id/tasks`
-   `PUT /api/tasks/:id`
-   `DELETE /api/tasks/:id`
-   `PATCH /api/tasks/:id/toggle`
-   `POST /api/tasks/:id/assign`
-   `DELETE /api/tasks/:id/assign/:userId`
-   `PUT /api/users/:id`
-   `DELETE /api/users/:id`

## 6. Example Workflow

1.  **New User Creates a Household:**
    -   FE: `POST /api/households` with `{ name, userName, deviceId }`.
    -   BE: Creates household, creates user, generates JWT.
    -   BE: Returns `{ token, household, user }`.
    -   FE: Stores the token securely.

2.  **App Startup (Existing User):**
    -   FE: Retrieves the stored token.
    -   FE: `GET /api/me` with `Authorization: Bearer <token>` header.
    -   BE: Validates token, fetches all data.
    -   BE: Returns the bootstrap payload `{ user, household }`.
    -   FE: Populates the UI with the received data.

3.  **User Creates a Task:**
    -   FE: `POST /api/households/:id/tasks` with task details (no `creatorId`) and the auth header.
    -   BE: Validates token, gets `userId` from the token, creates the task with the `userId` as the creator.
    -   BE: Returns the new task.
