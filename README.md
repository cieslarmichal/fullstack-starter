# Fullstack Starter

A modern fullstack starter with everything you need to build production-ready applications. Backend and frontend pre-configured and ready to go. Skip the boilerplate and start building.

## ✨ Features

### 🚀 Backend with Fastify

High-performance Node.js server with TypeScript, TypeBox validation for request/response schemas, structured logging with Pino, and comprehensive error handling. Built with a modular plugin architecture for scalability.

### 💻 Frontend with React

Modern React 19 with TypeScript, Tailwind CSS for styling, React Router for navigation, and beautiful Radix UI components. Includes React Hook Form with Zod validation for type-safe forms.

### 🗄️ PostgreSQL & Drizzle ORM

Type-safe database queries with Drizzle ORM, automatic migrations, connection pooling, and transaction support. Database schema defined in TypeScript with full type inference.

### 🔐 Authentication Ready

Complete authentication system with JWT access tokens, HTTP-only refresh tokens, bcrypt password hashing, secure cookie handling, and protected routes. Email verification and rate limiting included.

### ⚡ Testing Setup

- **Unit Tests**: Vitest for both backend and frontend with comprehensive test utilities
- **E2E Tests**: Playwright for end-to-end testing with Page Object Model pattern
- **API Mocking**: MSW (Mock Service Worker) for reliable API mocking in tests
- **Test Coverage**: Pre-configured test environments with proper setup and teardown

### 📦 Monorepo Architecture

Organized with npm workspaces and Turborepo for efficient builds and parallel task execution. Shared TypeScript configurations and centralized dependency management.

### ✅ Production Ready

- **Docker Setup**: Multi-stage Dockerfiles for optimized builds
- **Error Handling**: Centralized error handling with custom error classes
- **Logging**: Structured logging with request IDs for tracing
- **Security**: Helmet for security headers, CORS configuration, rate limiting
- **Deployment**: CI/CD pipeline with GitHub Actions and Fly.io configuration

### 🛠️ Developer Experience

Hot module reload for instant feedback, TypeScript strict mode for type safety, ESLint and Prettier for code quality, comprehensive documentation, and Git hooks for pre-commit checks.

## Getting Started

### Prerequisites

- [Docker](https://www.docker.com/get-started)
- [Docker Compose](https://docs.docker.com/compose/install/)
- [Node.js](https://nodejs.org/) (for local development)
- [npm](https://www.npmjs.com/) (comes with Node.js)

### Installation

1. Install dependencies:

   ```bash
   npm install
   ```

2. Build apps:

   ```bash
   npm run build
   ```

3. Lint code:

   ```bash
   npm run lint
   ```

4. Start services with Docker Compose:

   ```bash
   docker compose up -d
   ```

5. Run tests

   ```bash
   npm run test
   ```

6. Run database migrations

   ```bash
   cd apps/backend
   export DATABASE_URL=postgres://postgres:postgres@localhost:5432/postgres
   npm run db:migrate
   ```

7. Start frontend app (in a new terminal):

   ```bash
   cd apps/frontend
   npm run dev
   ```

8. Start backend app (in a new terminal):

   ```bash
   cd apps/backend
   npm run dev
   ```

## Initial Deployment Configuration

The application is configured for deployment on Fly.io. Ensure you have the [Fly CLI](https://fly.io/docs/getting-started/installing-flyctl/) installed.

### Deploying to Fly.io

1. Authenticate with Fly
```bash
flyctl auth login
```

2. Launch frontend and backend apps (replace <your-app-name> and paths as needed)
```bash
fly launch --name <your-app-name>-frontend -c ./apps/frontend/fly.toml
fly launch --name <your-app-name>-backend  -c ./apps/backend/fly.toml
```

3. Create a PostgreSQL instance on Fly (replace <region>)
```bash
flyctl postgres create --name <your-app-name>-db --region <region>
```

4. Configure the backend to use the database
- Retrieve the DB connection string from the Fly UI or the postgres creation output.
- Set it as a secret for the backend app:
```bash
flyctl secrets set DATABASE_URL='<postgres-connection-string>' --app <your-app-name>-backend
```

5. CI/CD will handle deployments on push to main branch.
