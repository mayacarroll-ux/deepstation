CREATE TABLE "weekly_summary_email_settings" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"owner_id" text NOT NULL,
	"manager_email" text NOT NULL,
	"accounting_emails" text[] DEFAULT '{}' NOT NULL,
	"cc_emails" text[] DEFAULT '{}' NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "weekly_summary_email_statuses" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"owner_id" text NOT NULL,
	"week_year" integer NOT NULL,
	"week_number" integer NOT NULL,
	"last_sent_at" timestamp NOT NULL,
	"last_message_id" text,
	"last_send_mode" text NOT NULL,
	"to_recipients" text[] DEFAULT '{}' NOT NULL,
	"cc_recipients" text[] DEFAULT '{}' NOT NULL,
	"send_count" integer DEFAULT 1 NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "weekly_summary_email_settings" ADD CONSTRAINT "weekly_summary_email_settings_owner_id_users_id_fk" FOREIGN KEY ("owner_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "weekly_summary_email_statuses" ADD CONSTRAINT "weekly_summary_email_statuses_owner_id_users_id_fk" FOREIGN KEY ("owner_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
CREATE UNIQUE INDEX "weekly_summary_email_settings_owner_unique" ON "weekly_summary_email_settings" USING btree ("owner_id");--> statement-breakpoint
CREATE UNIQUE INDEX "weekly_summary_email_status_owner_week_unique" ON "weekly_summary_email_statuses" USING btree ("owner_id","week_year","week_number");