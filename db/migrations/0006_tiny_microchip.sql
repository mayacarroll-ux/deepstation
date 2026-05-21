CREATE TABLE "weekly_allocation_batches" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"owner_id" text NOT NULL,
	"week_year" integer NOT NULL,
	"week_number" integer NOT NULL,
	"weekly_cap_hours" numeric(5, 2) NOT NULL,
	"existing_hours" numeric(5, 2) NOT NULL,
	"remaining_hours" numeric(5, 2) NOT NULL,
	"plan_hash" text NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "time_entries" ADD COLUMN "allocation_batch_id" uuid;--> statement-breakpoint
ALTER TABLE "weekly_allocation_batches" ADD CONSTRAINT "weekly_allocation_batches_owner_id_users_id_fk" FOREIGN KEY ("owner_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
CREATE UNIQUE INDEX "weekly_allocation_batch_owner_week_plan_unique" ON "weekly_allocation_batches" USING btree ("owner_id","week_year","week_number","plan_hash");--> statement-breakpoint
ALTER TABLE "time_entries" ADD CONSTRAINT "time_entries_allocation_batch_id_weekly_allocation_batches_id_fk" FOREIGN KEY ("allocation_batch_id") REFERENCES "public"."weekly_allocation_batches"("id") ON DELETE set null ON UPDATE no action;