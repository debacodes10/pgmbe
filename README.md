# Project Graveyard Manager (PGM) Backend

Production-ready backend for tracking inactive projects, syncing GitHub activity, and making status decisions.

## Tech Stack

- Node.js LTS (ES modules)
- Express.js
- Firebase Admin SDK (auth)
- Firestore
- GitHub REST API
- node-cron
- Pino logging
- Zod validation

## Folder Structure

```text
src/
  app.js
  server.js
  config/
  constants/
  controllers/
  jobs/
  middlewares/
  routes/
  services/
  utils/
  validators/
```

## API Endpoints

Public:

- `GET /health`

Protected (Firebase ID token required):

- `POST /api/projects`
- `GET /api/projects`
- `GET /api/projects/:id`
- `PATCH /api/projects/:id`
- `DELETE /api/projects/:id`
- `POST /api/projects/:id/sync`
- `POST /api/projects/:id/archive`
- `POST /api/projects/:id/resume`
- `POST /api/projects/:id/ship`

## Local Setup

1. Install dependencies:

```bash
npm install
```

2. Create environment file:

```bash
cp .env.example .env
```

3. Fill `.env` values:
- `FIREBASE_PROJECT_ID`
- `FIREBASE_SERVICE_ACCOUNT_JSON` (or use platform default credentials)
- Optional `GITHUB_TOKEN` to increase API limits
- CORS and rate-limit settings

4. Start dev server:

```bash
npm run dev
```

5. Run lint:

```bash
npm run lint
```

## Firebase Admin Setup

1. Open Firebase Console and create/select your project.
2. Go to **Project settings > Service accounts**.
3. Generate a new private key JSON.
4. Put JSON into `FIREBASE_SERVICE_ACCOUNT_JSON` as a single-line JSON string (escape newlines in private key with `\\n`).
5. Ensure Firebase Authentication is enabled in your project.

## Firestore Setup

1. In Firebase Console, enable Firestore in Native mode.
2. Create indexes as prompted by Firestore logs for production queries (if requested).
3. Data model used by backend:
- `users/{userId}/projects/{projectId}`
- `users/{userId}/activityLogs/{logId}`

### Recommended Firestore Security Rule Note

This backend uses Admin SDK and bypasses Firestore client rules on the server. Restrict service account usage and keep credentials private.

## Authentication Flow

1. Client signs in with Firebase Authentication.
2. Client gets Firebase ID token.
3. Client calls backend with header:

```http
Authorization: Bearer <firebase_id_token>
```

4. Backend verifies token using Firebase Admin and attaches decoded payload to `req.user`.

## Example Requests

Set token once:

```bash
export TOKEN="<firebase_id_token>"
```

Create project:

```bash
curl -X POST http://localhost:8080/api/projects \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "name": "PGM API",
    "description": "Track stale side projects",
    "repoUrl": "https://github.com/octocat/Hello-World"
  }'
```

List projects:

```bash
curl -H "Authorization: Bearer $TOKEN" http://localhost:8080/api/projects
```

Sync latest commit:

```bash
curl -X POST -H "Authorization: Bearer $TOKEN" http://localhost:8080/api/projects/<projectId>/sync
```

Archive:

```bash
curl -X POST -H "Authorization: Bearer $TOKEN" http://localhost:8080/api/projects/<projectId>/archive
```

Resume:

```bash
curl -X POST -H "Authorization: Bearer $TOKEN" http://localhost:8080/api/projects/<projectId>/resume
```

Ship MVP:

```bash
curl -X POST -H "Authorization: Bearer $TOKEN" http://localhost:8080/api/projects/<projectId>/ship
```

## Cron Stagnation Detection

- Scheduled daily via `STAGNATION_CRON` (default: `0 2 * * *`, UTC).
- Marks `active` projects as `stagnant` when:
- `now - lastCommitAt > STAGNATION_DAYS_THRESHOLD`
- Sets `forcedDecisionAt`
- Writes an activity log
- Job handles failures internally and never crashes the server process.

## Deployment (Render / Railway / DigitalOcean)

1. Provision Node.js service.
2. Set build command:

```bash
npm install
```

3. Set start command:

```bash
npm start
```

4. Add environment variables from `.env.example`.
5. Ensure `PORT` is provided by platform (or set manually).
6. Store Firebase service account JSON and GitHub token as secrets.
7. Verify health endpoint:

- `GET /health`

## Production Notes

- Helmet, CORS, compression, and rate limiting are enabled.
- Validation is strict via Zod with sanitization.
- Errors are centralized and stack traces are hidden in production.
- Logging is structured with Pino.
- All async flows use `async/await`.
