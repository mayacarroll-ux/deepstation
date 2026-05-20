CREATE TABLE "workday_day_statuses" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"owner_id" text NOT NULL,
	"entry_date" date NOT NULL,
	"is_entered" boolean DEFAULT false NOT NULL,
	"entered_at" timestamp,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "workday_week_statuses" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"owner_id" text NOT NULL,
	"week_year" integer NOT NULL,
	"week_number" integer NOT NULL,
	"is_entered" boolean DEFAULT false NOT NULL,
	"entered_at" timestamp,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "workday_day_statuses" ADD CONSTRAINT "workday_day_statuses_owner_id_users_id_fk" FOREIGN KEY ("owner_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "workday_week_statuses" ADD CONSTRAINT "workday_week_statuses_owner_id_users_id_fk" FOREIGN KEY ("owner_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
CREATE UNIQUE INDEX "workday_day_status_owner_date_unique" ON "workday_day_statuses" USING btree ("owner_id","entry_date");--> statement-breakpoint
CREATE UNIQUE INDEX "workday_week_status_owner_week_unique" ON "workday_week_statuses" USING btree ("owner_id","week_year","week_number");