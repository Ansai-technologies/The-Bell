import {
  pgTable,
  serial,
  text,
  integer,
  date,
  boolean,
  timestamp,
  doublePrecision,
  bigint,
  numeric,
  primaryKey,
  unique,
  AnyPgColumn,
} from 'drizzle-orm/pg-core';
import { customType } from 'drizzle-orm/pg-core';

// Custom type for pgvector
const vector = customType<{ data: number[] }>({
  dataType() {
    return 'vector(1536)';
  },
  toDriver(value: number[]) {
    return `[${value.join(',')}]`;
  },
});

export const gazetteEditions = pgTable('gazette_editions', {
  id: serial('id').primaryKey(),
  volume: text('volume'),
  editionNumber: integer('edition_number'),
  publishDate: date('publish_date').notNull(),
  isSpecial: boolean('is_special').default(false),
  sourceUrl: text('source_url').notNull().unique(),
  pdfDownloaded: boolean('pdf_downloaded').default(false),
  processedAt: timestamp('processed_at', { withTimezone: true }),
});

export const notices = pgTable('notices', {
  id: serial('id').primaryKey(),
  editionId: integer('edition_id').references(() => gazetteEditions.id),
  noticeNumber: integer('notice_number').notNull(),
  noticeYear: integer('notice_year').notNull(),
  pageNumber: integer('page_number'),
  actCited: text('act_cited'),
  subjectLine: text('subject_line'),
  rawText: text('raw_text').notNull(),
  primaryCategory: text('primary_category').notNull(),
  tags: text('tags').array(), // Default will be managed at insert level if needed
  classificationTier: text('classification_tier').notNull(),
  classificationConf: doublePrecision('classification_conf'),
  correctsNoticeId: integer('corrects_notice_id').references((): AnyPgColumn => notices.id),
  revokesNoticeId: integer('revokes_notice_id').references((): AnyPgColumn => notices.id),
  noticeDate: date('notice_date'),
  datedBy: text('dated_by'),
  embedding: vector('embedding'),
}, (t) => [
  unique().on(t.noticeNumber, t.noticeYear)
]);

export const subscribers = pgTable('subscribers', {
  id: serial('id').primaryKey(),
  telegramChatId: bigint('telegram_chat_id', { mode: 'number' }).notNull().unique(),
  phoneNumber: text('phone_number'),
  subscriptionStatus: text('subscription_status').notNull().default('trial'),
  subscriptionExpiresAt: timestamp('subscription_expires_at', { withTimezone: true }),
  createdAt: timestamp('created_at', { withTimezone: true }).defaultNow(),
});

export const subscriberInterests = pgTable('subscriber_interests', {
  subscriberId: integer('subscriber_id').notNull().references(() => subscribers.id),
  tag: text('tag').notNull(),
}, (t) => [
  primaryKey({ columns: [t.subscriberId, t.tag] })
]);

export const deliveries = pgTable('deliveries', {
  id: serial('id').primaryKey(),
  subscriberId: integer('subscriber_id').references(() => subscribers.id),
  noticeId: integer('notice_id').references(() => notices.id),
  sentAt: timestamp('sent_at', { withTimezone: true }).defaultNow(),
}, (t) => [
  unique().on(t.subscriberId, t.noticeId)
]);

export const payments = pgTable('payments', {
  id: serial('id').primaryKey(),
  subscriberId: integer('subscriber_id').references(() => subscribers.id),
  provider: text('provider').notNull(),
  amount: numeric('amount').notNull(),
  status: text('status').notNull(),
  providerRef: text('provider_ref'),
  createdAt: timestamp('created_at', { withTimezone: true }).defaultNow(),
});
