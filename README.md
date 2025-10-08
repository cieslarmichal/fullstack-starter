# Fullstack Starter

## Features

- **Backend**: Node.js with Fastify, Drizzle ORM, JWT authentication, and RESTful API.
- **Frontend**: React with Vite, TypeScript, and Tailwind CSS.
- **Database**: PostgreSQL with Drizzle ORM for type-safe database interactions.
- **Containerization**: Docker and Docker Compose for easy setup and deployment.
- **CI/CD**: GitHub Actions for continuous integration and deployment to Fly.io.
- **Monorepo Management**: Using Turborepo for efficient monorepo management.
- **Testing**: Vitest for automated testing for backend and frontend.
- **User module**: Basic pages for login and sign up integrated with backend.

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

6. Run database migrations (if you ran tests before, you can skip this step because the test setup already runs migrations):

   ```bash
   cd apps/backend
   export DATABASE_URL=postgres://postgres:postgres@localhost:5432/fullstack-starter
   npm run db:push
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
