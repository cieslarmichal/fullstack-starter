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

- [Node.js](https://nodejs.org/) (v22+)
- [npm](https://www.npmjs.com/) (comes with Node.js)
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
   npm run dev
   ```

5. Start frontend (in a new terminal):

   ```bash
   cd apps/frontend
   npm run dev
   ```

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

4. Set the database URL secret on the backend:
   ```bash
   flyctl secrets set DATABASE_URL='<postgres-connection-string>' --app <your-app-name>-backend
   ```

5. CI/CD via GitHub Actions handles deployments on push to `main`.
