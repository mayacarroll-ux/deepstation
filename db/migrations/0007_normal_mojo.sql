CREATE TABLE "weekly_summary_email_schedules" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"owner_id" text NOT NULL,
	"enabled" boolean NOT NULL,
	"day_of_week" integer NOT NULL,
	"time_of_day" text NOT NULL,
	"time_zone" text NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "weekly_summary_email_schedules" ADD CONSTRAINT "weekly_summary_email_schedules_owner_id_users_id_fk" FOREIGN KEY ("owner_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
CREATE UNIQUE INDEX "weekly_summary_email_schedule_owner_unique" ON "weekly_summary_email_schedules" USING btree ("owner_id");