CREATE TABLE "recurring_time_entry_templates" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"owner_id" text NOT NULL,
	"task_description" text NOT NULL,
	"product_name" text NOT NULL,
	"budget_name" text NOT NULL,
	"budget_number" text NOT NULL,
	"day_of_week" integer NOT NULL,
	"hours_worked" numeric(5, 2) NOT NULL,
	"notes" text,
	"start_date" date NOT NULL,
	"end_date" date,
	"is_active" boolean DEFAULT true NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "time_entries" ADD COLUMN "recurring_template_id" uuid;--> statement-breakpoint
ALTER TABLE "recurring_time_entry_templates" ADD CONSTRAINT "recurring_time_entry_templates_owner_id_users_id_fk" FOREIGN KEY ("owner_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "time_entries" ADD CONSTRAINT "time_entries_recurring_template_id_recurring_time_entry_templates_id_fk" FOREIGN KEY ("recurring_template_id") REFERENCES "public"."recurring_time_entry_templates"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
CREATE UNIQUE INDEX "time_entry_owner_recurring_date_unique" ON "time_entries" USING btree ("owner_id","recurring_template_id","entry_date");