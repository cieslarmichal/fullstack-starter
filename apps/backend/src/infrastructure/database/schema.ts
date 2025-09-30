import { boolean, pgTable, text, timestamp, uuid, varchar } from 'drizzle-orm/pg-core';

export const users = pgTable('users', {
  id: uuid('id').primaryKey(),
  email: varchar('email', { length: 255 }).notNull().unique(),
  password: text('password').notNull(),
  isDeleted: boolean('is_deleted').notNull().default(false),
  createdAt: timestamp('created_at').notNull().defaultNow(),
});

export const blacklistedTokens = pgTable('blacklisted_tokens', {
  id: uuid('id').primaryKey(),
  userId: uuid('user_id')
    .notNull()
    .references(() => users.id, { onDelete: 'cascade' }),
  tokenHash: text('token_hash').notNull(),
  expiresAt: timestamp('expires_at').notNull(),
});
