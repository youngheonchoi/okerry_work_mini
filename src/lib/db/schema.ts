import { pgTable, uuid, text, integer, date, boolean, numeric, timestamp, pgEnum, unique, jsonb } from 'drizzle-orm/pg-core'

export const payTypeEnum = pgEnum('pay_type', ['daily', 'weekly', 'monthly'])

export const wageSettings = pgTable('wage_settings', {
  id: uuid('id').primaryKey().defaultRandom(),
  userId: text('user_id').notNull().unique(),
  dailyWage: integer('daily_wage').notNull(),
  payType: payTypeEnum('pay_type').notNull(),
  nextPayDate: date('next_pay_date').notNull(),
  createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
  updatedAt: timestamp('updated_at', { withTimezone: true }).notNull().defaultNow(),
})

export const workLogs = pgTable('work_logs', {
  id: uuid('id').primaryKey().defaultRandom(),
  userId: text('user_id').notNull(),
  workDate: date('work_date').notNull(),
  worked: boolean('worked').notNull().default(false),
  isHoliday: boolean('is_holiday').notNull().default(false),
  overtimeHrs: numeric('overtime_hrs', { precision: 4, scale: 1 }).notNull().default('0'),
  totalWage: integer('total_wage').notNull().default(0),
  createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
  updatedAt: timestamp('updated_at', { withTimezone: true }).notNull().defaultNow(),
}, (t) => [unique().on(t.userId, t.workDate)])

export type JournalEntry = {
  startTime: string
  endTime?: string
  memo?: string
}

export const dailyJournals = pgTable('daily_journals', {
  id: uuid('id').primaryKey().defaultRandom(),
  userId: text('user_id').notNull(),
  workDate: date('work_date').notNull(),
  entries: jsonb('entries').$type<JournalEntry[]>().notNull().default([]),
  createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
  updatedAt: timestamp('updated_at', { withTimezone: true }).notNull().defaultNow(),
}, (t) => [unique().on(t.userId, t.workDate)])

export type WageSettings = typeof wageSettings.$inferSelect
export type WorkLog = typeof workLogs.$inferSelect
export type DailyJournal = typeof dailyJournals.$inferSelect
