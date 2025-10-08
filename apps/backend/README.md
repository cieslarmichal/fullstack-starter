# Backend

## Setup local database

- In project root run:

```bash
docker-compose up
```

- In backend directory run:

```bash
export DATABASE_URL=postgres://postgres:postgres@localhost:5432/fullstack-starter
npm run db:push
```

if any issues with drizzle check: [github issue](https://github.com/drizzle-team/drizzle-orm/issues/2699#issuecomment-2660850530)

## Database changes

- Make your changes in `apps/backend/src/db/schema.ts`
- Set `DATABASE_URL` env variable to your database
- Run `npm run db:generate` to create migration file
- Run `npm run db:migrate` to apply changes to database
