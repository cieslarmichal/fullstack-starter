# Fullstack Starter

A modern fullstack starter with everything you need to build production-ready applications. Backend and frontend pre-configured and ready to go. Skip the boilerplate and start building.

## ✨ Features

### 🚀 Backend with Fastify

High-performance Node.js server with TypeScript strict mode, TypeBox schemas for request/response validation, structured logging with Pino, per-route rate limiting, and comprehensive centralized error handling.

### 💻 Frontend with React

React 19 with TypeScript, Tailwind CSS v4, React Router v7, and Radix UI component library. React Hook Form + Zod v4 for type-safe forms. Includes private/public/admin route guards, profile management, and toast notifications via Sonner.

### 🗄️ PostgreSQL & Drizzle ORM

Type-safe database queries with Drizzle ORM, automatic migrations, connection pooling, UUID v7 primary keys, and serializable transactions for all multi-step writes.

### 🔐 Complete Authentication System

JWT access tokens (short-lived, in-memory) + HTTP-only refresh tokens with rotation and grace period. bcrypt password hashing, database-backed session management, email verification flow, and password reset via one-time tokens.

### 📧 Email System

Transactional email via Resend with pg-boss job queue for reliable background delivery. Email verification and password reset emails included out of the box.

### ☁️ AWS S3 & Image Uploads

File storage with AWS S3. Image upload with Sharp-based optimization — WebP conversion and resizing on the server. LocalStack used for local S3 emulation during development.

### ⚡ Integration Testing

Integration tests with Vitest running against a real PostgreSQL database — no mocks. Includes a seeder tool for generating test data.

### ✅ Production Ready

- **Docker Setup**: Multi-stage Dockerfiles for optimized production builds
- **CI/CD**: GitHub Actions pipeline — build, lint, test, deploy
- **Deployment**: Fly.io configuration for both frontend and backend
- **Security**: CORS, Helmet security headers, rate limiting per route
- **Logging**: Structured Pino logs with request IDs for tracing
- **Error Handling**: Centralized error handling with typed custom error classes

### 📦 Monorepo Architecture

Turborepo with npm workspaces. Packages: `apps/backend`, `apps/frontend`, `tools/seeder`. Shared TypeScript configuration and centralized dependency management.

## Getting Started

### Prerequisites

- [Node.js](https://nodejs.org/) (v26+)
- [npm](https://www.npmjs.com/) (v12+, comes with Node.js)
- [Docker](https://www.docker.com/get-started) + [Docker Compose](https://docs.docker.com/compose/install/)

### Installation

1. Install dependencies:

   ```bash
   npm install
   ```

2. Start local services (PostgreSQL + LocalStack):

   ```bash
   docker compose up -d
   ```

3. Run database migrations:

   ```bash
   cd apps/backend
   export DATABASE_URL=postgres://postgres:postgres@localhost:5432/postgres
   npm run db:migrate
   ```

4. Start backend (in a new terminal):

   ```bash
   cd apps/backend
   export RESEND_API_KEY=<your-resend-key>
   npm run dev
   ```

5. Start frontend (in a new terminal):

   ```bash
   cd apps/frontend
   npm run dev
   ```

### Configuration

Backend configuration is layered — JSON files in `apps/backend/config/` provide the defaults per environment (`default.json`, `development.json`, `test.json`, `staging.json`, `production.json`), and `custom-environment-variables.json` maps environment variables on top of them. The merged result is validated with TypeBox at startup, so a missing or malformed value fails fast with a clear message instead of surfacing later at runtime.

`development.json` already covers the database, cookies, tokens and LocalStack S3, so local development only needs `RESEND_API_KEY` exported in the shell. Variables recognised in every environment:

| Variable                                        | Purpose                                       |
| ----------------------------------------------- | --------------------------------------------- |
| `DATABASE_URL`                                   | PostgreSQL connection string                  |
| `RESEND_API_KEY`                                 | Transactional email                           |
| `COOKIE_SECRET`                                  | Refresh-token cookie signing                  |
| `ACCESS_TOKEN_SECRET` / `REFRESH_TOKEN_SECRET`   | JWT signing — `openssl rand -hex 32`          |
| `AWS_ACCESS_KEY_ID` / `AWS_SECRET_ACCESS_KEY`    | S3 storage (`test`/`test` for LocalStack)     |
| `LOG_LEVEL`                                      | `trace` … `fatal`                             |
| `VITE_BACKEND_URL`                               | Frontend → backend URL (build-time)           |

The secrets committed in `development.json` and `test.json` are throwaway values for local use — staging and production must get real ones from the environment.

### Rebranding

App name, initials, description, URL, contact email and author links live in a single object in `apps/frontend/src/config.ts`. Header, footer, page titles and meta tags all read from it, so renaming the app is one edit there plus the static tags in `apps/frontend/index.html`, `apps/frontend/public/robots.txt` and this README.

### Useful commands

```bash
npm run build        # Production build
npm run build:dev    # Build with type checking (run after every change)
npm run lint         # Lint all packages
npm run lint:fix     # Fix auto-fixable lint errors
npm run test         # Run full test suite
```

### Database migrations

```bash
cd apps/backend
export DATABASE_URL=postgres://postgres:postgres@localhost:5432/postgres
npm run db:generate  # Generate migration from schema changes
npm run db:migrate   # Apply pending migrations
```

When adding a `NOT NULL` column to a table with existing rows, edit the generated SQL to: add as nullable → backfill → set NOT NULL.

### Seeding test data

```bash
cd tools/seeder
npm run seed
```

## Deployment

The application is configured for deployment on Fly.io. Ensure you have the [Fly CLI](https://fly.io/docs/getting-started/installing-flyctl/) installed.

### Deploying to Fly.io

1. Authenticate with Fly:
   ```bash
   flyctl auth login
   ```

2. Launch frontend and backend apps:
   ```bash
   fly launch --name <your-app-name>-frontend -c ./apps/frontend/fly.toml
   fly launch --name <your-app-name>-backend  -c ./apps/backend/fly.toml
   ```

3. Create a PostgreSQL instance:
   ```bash
   flyctl postgres create --name <your-app-name>-db --region <region>
   ```

4. Set the database URL secret on the backend. TLS is controlled only by `sslmode` in the connection string (there is no `ssl` config option), so production URLs should end with `?sslmode=verify-full`:
   ```bash
   flyctl secrets set DATABASE_URL='<postgres-connection-string>?sslmode=verify-full' --app <your-app-name>-backend
   ```

5. If your database provider uses a private CA (e.g. DigitalOcean managed Postgres), the server certificate can't be verified out of the box. Download the CA certificate from the provider's dashboard (DigitalOcean: database → Overview → Connection details → Download CA certificate) and store it as a base64-encoded secret:
   ```bash
   flyctl secrets set DB_CA_CERT="$(base64 < ca-certificate.crt)" --app <your-app-name>-backend
   ```
   `apps/backend/fly.toml` writes this secret to `/app/certs/db-ca.crt` on the machine (`[[files]]`) and sets `NODE_EXTRA_CA_CERTS` to that path, so Node trusts the CA. The secret must be set before deploying. If your provider uses a publicly trusted certificate, you can remove the `[[files]]` block and `NODE_EXTRA_CA_CERTS` from `fly.toml`.

   Locally, leave `sslmode` out of the URL; the local Postgres runs without TLS.

6. CI/CD via GitHub Actions handles deployments on push to `main`.
