CREATE TABLE "deliveries" (
	"id" serial PRIMARY KEY NOT NULL,
	"subscriber_id" integer,
	"notice_id" integer,
	"sent_at" timestamp with time zone DEFAULT now(),
	CONSTRAINT "deliveries_subscriber_id_notice_id_unique" UNIQUE("subscriber_id","notice_id")
);
--> statement-breakpoint
CREATE TABLE "gazette_editions" (
	"id" serial PRIMARY KEY NOT NULL,
	"volume" text,
	"edition_number" integer,
	"publish_date" date NOT NULL,
	"is_special" boolean DEFAULT false,
	"source_url" text NOT NULL,
	"pdf_downloaded" boolean DEFAULT false,
	"processed_at" timestamp with time zone,
	CONSTRAINT "gazette_editions_source_url_unique" UNIQUE("source_url")
);
--> statement-breakpoint
CREATE TABLE "notices" (
	"id" serial PRIMARY KEY NOT NULL,
	"edition_id" integer,
	"notice_number" integer NOT NULL,
	"notice_year" integer NOT NULL,
	"page_number" integer,
	"act_cited" text,
	"subject_line" text,
	"raw_text" text NOT NULL,
	"primary_category" text NOT NULL,
	"tags" text[],
	"classification_tier" text NOT NULL,
	"classification_conf" double precision,
	"corrects_notice_id" integer,
	"revokes_notice_id" integer,
	"notice_date" date,
	"dated_by" text,
	"embedding" vector(1536),
	CONSTRAINT "notices_notice_number_notice_year_unique" UNIQUE("notice_number","notice_year")
);
--> statement-breakpoint
CREATE TABLE "payments" (
	"id" serial PRIMARY KEY NOT NULL,
	"subscriber_id" integer,
	"provider" text NOT NULL,
	"amount" numeric NOT NULL,
	"status" text NOT NULL,
	"provider_ref" text,
	"created_at" timestamp with time zone DEFAULT now()
);
--> statement-breakpoint
CREATE TABLE "subscriber_interests" (
	"subscriber_id" integer NOT NULL,
	"tag" text NOT NULL,
	CONSTRAINT "subscriber_interests_subscriber_id_tag_pk" PRIMARY KEY("subscriber_id","tag")
);
--> statement-breakpoint
CREATE TABLE "subscribers" (
	"id" serial PRIMARY KEY NOT NULL,
	"telegram_chat_id" bigint NOT NULL,
	"phone_number" text,
	"subscription_status" text DEFAULT 'trial' NOT NULL,
	"subscription_expires_at" timestamp with time zone,
	"created_at" timestamp with time zone DEFAULT now(),
	CONSTRAINT "subscribers_telegram_chat_id_unique" UNIQUE("telegram_chat_id")
);
--> statement-breakpoint
ALTER TABLE "deliveries" ADD CONSTRAINT "deliveries_subscriber_id_subscribers_id_fk" FOREIGN KEY ("subscriber_id") REFERENCES "public"."subscribers"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "deliveries" ADD CONSTRAINT "deliveries_notice_id_notices_id_fk" FOREIGN KEY ("notice_id") REFERENCES "public"."notices"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "notices" ADD CONSTRAINT "notices_edition_id_gazette_editions_id_fk" FOREIGN KEY ("edition_id") REFERENCES "public"."gazette_editions"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "notices" ADD CONSTRAINT "notices_corrects_notice_id_notices_id_fk" FOREIGN KEY ("corrects_notice_id") REFERENCES "public"."notices"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "notices" ADD CONSTRAINT "notices_revokes_notice_id_notices_id_fk" FOREIGN KEY ("revokes_notice_id") REFERENCES "public"."notices"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "payments" ADD CONSTRAINT "payments_subscriber_id_subscribers_id_fk" FOREIGN KEY ("subscriber_id") REFERENCES "public"."subscribers"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "subscriber_interests" ADD CONSTRAINT "subscriber_interests_subscriber_id_subscribers_id_fk" FOREIGN KEY ("subscriber_id") REFERENCES "public"."subscribers"("id") ON DELETE no action ON UPDATE no action;