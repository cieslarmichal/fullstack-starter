import { index, pgTable, text, timestamp, uuid, varchar } from 'drizzle-orm/pg-core';

export const users = pgTable('users', {
  id: uuid('id').primaryKey(),
  email: varchar('email', { length: 255 }).notNull().unique(),
  password: text('password').notNull(),
  createdAt: timestamp('created_at').notNull().defaultNow(),
});

export const userSessions = pgTable(
  'user_sessions',
  {
    id: uuid('id').primaryKey(),
    userId: uuid('user_id')
      .notNull()
      .references(() => users.id, { onDelete: 'cascade' }),
    currentRefreshHash: text('current_refresh_hash').notNull().unique(),
    prevRefreshHash: text('prev_refresh_hash'),
    prevUsableUntil: timestamp('prev_usable_until'),
    lastRotatedAt: timestamp('last_rotated_at').notNull().defaultNow(),
    status: varchar('status', { length: 16 }).notNull().default('active'), // 'active' | 'revoked'
    createdAt: timestamp('created_at').notNull().defaultNow(),
    updatedAt: timestamp('updated_at').notNull().defaultNow(),
  },
  (table) => [index('idx_user_sessions_user_id').on(table.userId)],
);
