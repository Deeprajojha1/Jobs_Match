# JobMatch Pro

Production-grade full-stack job matching platform built with Node.js, Express, Next.js, MongoDB, Redis, AWS S3, OpenAI API, and Socket.IO.

## Architecture

- Backend follows `routes -> controllers -> services -> models`.
- Controllers only translate HTTP requests and responses.
- Services own business behavior, cache-aside Redis reads, S3 uploads, OpenAI resume matching, and Socket.IO domain events.
- Frontend keeps API traffic in `src/services`, with UI components receiving data and callbacks.
- JWT authentication uses HTTP-only cookies. No auth token is stored in `localStorage`.

## Backend Setup

```bash
cd backend
npm install
cp .env.example .env
npm run dev
```

Fill `backend/.env` after you provide credentials:

- `MONGODB_URI`
- `JWT_SECRET`
- `REDIS_URL`
- `AWS_REGION`
- `AWS_ACCESS_KEY_ID`
- `AWS_SECRET_ACCESS_KEY`
- `AWS_S3_BUCKET`
- `OPENAI_API_KEY`
- `OPENAI_MODEL`

Do not put real credentials in `backend/.env.example`; that file is only a
template. The real secret file is `backend/.env`, which is ignored by git.

## Frontend Setup

```bash
cd frontend
npm install
cp .env.example .env.local
npm run dev
```

Open `http://localhost:3000`.

## API

- `POST /api/auth/register`
- `POST /api/auth/login`
- `POST /api/auth/logout`
- `GET /api/auth/me`
- `GET /api/jobs`
- `POST /api/jobs`
- `GET /api/jobs/:id`
- `POST /api/apply`
- `GET /api/applications`

## Production Notes

- Run the backend on AWS EC2 behind HTTPS so production cookies can use `secure: true`.
- Set `FRONTEND_URL` to the deployed Next.js origin for CORS and Socket.IO.
- Use a managed MongoDB and Redis service or private EC2 networking for database/cache access.
- Attach an IAM user or role with least-privilege S3 access to the resume bucket.
- Keep secrets in EC2 environment variables or a secret manager, not in source control.
