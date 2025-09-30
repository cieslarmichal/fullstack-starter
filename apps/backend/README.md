# Backend

## Setup local database

* In project root run:

```bash
docker-compose up
```

* In backend directory run:

```bash
export DATABASE_URL=postgres://postgres:postgres@localhost:5432/monorepo-template
npm run db:push
```

if any issues with drizzle check: [github issue](https://github.com/drizzle-team/drizzle-orm/issues/2699#issuecomment-2660850530)
