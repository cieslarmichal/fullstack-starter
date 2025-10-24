# GitHub Copilot Instructions

## Project Overview

This is a monorepo using npm workspaces with Turborepo. The project consists of a backend API and a frontend web application for a series matching and watch room platform.

## Technology Stack

### Backend

- **Framework**: Fastify
- **ORM**: Drizzle ORM
- **Database**: PostgreSQL
- **Storage**: S3
- **Validation**: TypeBox
- **Testing**: Vitest

### Frontend

- **Framework**: React
- **Router**: React Router
- **Validation**: Zod
- **Styling**: Tailwind CSS
- **Components**: Radix UI
- **Forms**: React Hook Form

## Code Style & General Rules

### TypeScript Standards

- Always use TypeScript in strict mode
- Never use `any`, `@ts-ignore`, or disable lint rules
- Use ES module syntax (import/export)
- Prefer modern Node.js and ES features
- Always use async/await for asynchronous operations
- Add "TODO:" comments for incomplete work
- Keep code self-explanatory with minimal comments describing purpose only
- No dead code or unused imports
- Follow existing ESLint and Prettier configurations

## Backend Development Guidelines

### Architecture & Structure

- Organize code by feature modules using Fastify's plugin system
- Register all routes using `fastify.register()`
- Use Fastify hooks: `onRequest`, `preHandler`, `onSend`
- Validate all requests and responses using TypeBox schemas

### Node.js Compatibility (Critical)

- Code must be executable directly with the `node` command
- **Avoid TypeScript enums** - use const objects or union types instead
- **Avoid constructor property declarations** - use traditional constructor assignment
- Ensure all TypeScript features compile to standard JavaScript

### Database (Drizzle ORM)

- Use Drizzle ORM exclusively; avoid raw SQL unless strictly necessary
- Prefer typed queries and inferred return types
- Use Drizzle migrations to apply all database schema changes
- Use UUIDs for primary keys
- Use `snake_case` for table and column names

### Transaction Management

- Use Drizzle's transaction API: `db.transaction(async (tx) => { ... })`
- Group all multi-step write operations into single transactions
- Use serializable isolation level for critical consistency flows
- Roll back transactions on any error (never partially commit)
- Define transaction boundaries in the actions layer, not in routes
- Prefer idempotent logic for retries
- For concurrency-sensitive operations, use Postgres advisory or row-level locks
- Log transaction duration and failures for observability

### Error Handling

- Use custom error classes extending `BaseError` with context
- Implement centralized error serialization with `serializeError()`
- Use specific error types:
  - `InputNotValidError` - for validation failures
  - `ResourceNotFoundError` - for missing resources
  - `OperationNotValidError` - for invalid operations
  - `ResourceAlreadyExistsError` - for conflicts
  - `UnauthorizedAccessError` - for authentication failures
  - `ForbiddenAccessError` - for authorization failures
- Never expose stack traces in production responses
- Log all errors with structured context (reqId, endpoint, error details)
- Handle TypeError separately with generic internal server error response

### Logging

- Use Pino for structured logging via `LoggerService` wrapper
- All application actions classes must use `LoggerService`
- Log levels: debug, info, warn, error
- **Never use `console.log` or `console.error`**
- Include structured context in all log entries (message + context object)
- Use request ID (reqId) for request tracing
- Log authentication events, business operations, and errors
- **Never log sensitive data**: passwords, tokens, PII
- Use consistent log message format with relevant context

### Configuration

- Use config module with environment-specific JSON files
- Validate configuration with TypeBox schemas at startup
- Use `custom-environment-variables.json` for env var mapping
- Support environments: development, staging, production, test, local
- Fail fast on configuration errors with `ConfigurationError`
- Use centralized config creation with `createConfig()`

### Testing

- Use Vitest for all logic and action classes
- Update or extend tests when modifying files containing logic
- Test files use `.test.ts` suffix
- Use `createTestContext()` for test setup with mocked services
- Use `truncateTables()` for database cleanup between tests
- Mock external services (e.g., EmailService) in tests
- Use globalSetup for database migrations in test environment
- Test both success and error scenarios
- Use `Generator` class for creating test data

## Frontend Development Guidelines

### Component Architecture

- Use functional components and hooks exclusively
- Create reusable UI components in `components/ui/`
- Use TypeScript interfaces for all component props
- Implement proper loading and error states in all components
- Use React Router loaders for data fetching

### State Management

- Use React Context for global state (e.g., `AuthContext`)
- Use React Hook Form for form state management
- Implement silent token refresh with useEffect and intervals
- Use useCallback for performance optimization
- Manage access token in memory, refresh token in HTTP-only cookies

### Forms

- Use react-hook-form with zodResolver for validation
- Implement proper form error handling and display
- Use controlled components with proper state management
- Validate on touched/blur for better UX

### Styling

- Use Tailwind CSS classes semantically (no inline styles)
- Use Radix UI primitives for accessible components
- Keep component structure modular and clean
- Create beautiful and consistent UI

### API Integration

- Consume backend via REST API
- Use HTTP-only cookies for refresh token
- Store access token in memory only

## Security Requirements

### General Security

- **Never log sensitive data**: passwords, tokens, PII
- Enforce strict CORS (trusted origins only)
- Use Helmet for security headers
- Validate and sanitize all user input
- Escape dynamic data
- Use UUIDs v7 for identifiers
- Require HTTP-only, Secure, and SameSite=strict cookies
- Use CSRF protection for unsafe operations
- Hash passwords with bcrypt (minimum 12 rounds)
- Apply rate limiting and IP blocking on auth endpoints
- Enforce least privilege in DB permissions
- Require centralized auth check via Fastify onRequest hook
- Enable ETag or version validation on sensitive endpoints

## Scalability Best Practices

- Design backend as stateless
- Use Postgres connection pooling
- Cache frequent queries (Redis or Fastify cache plugins)
- Use pagination for requests that return many items
- Avoid N+1 queries; use Drizzle relations or joins
- Use CDN for static assets
- Log and monitor slow queries; optimize indexes regularly
- Memoize expensive computations
- Expose `/health` endpoints for orchestration

## Build & Package Management

- Build all apps: `npm run build:dev`
- Install packages via root workspace:
- Shared dependency: `npm i package`
- Backend dependency: `npm i package --workspace=@apps/backend`
- Frontend dependency: `npm i package --workspace=@apps/frontend`

## Code Suggestions & Refactoring

When generating or modifying code, consider:

- Converting manual logic into Fastify plugins or hooks
- Caching frequently accessed queries
- Adding rate limiting or sanitization where missing
- Suggesting async workflows or message queues for heavy logic
- Using proper error handling with custom error classes
- Adding structured logging for business operations
- Implementing proper transaction boundaries
- Using TypeBox schemas for request/response validation
- Adding proper authentication/authorization middleware
- Using React Hook Form with Zod validation for forms
- Implementing proper loading and error states in components
- Suggesting refactors for duplicate logic
