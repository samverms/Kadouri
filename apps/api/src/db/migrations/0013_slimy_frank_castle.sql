CREATE TABLE IF NOT EXISTS "order_activities" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"order_id" uuid NOT NULL,
	"clerk_user_id" varchar(255),
	"user_name" varchar(255),
	"activity_type" varchar(50) NOT NULL,
	"description" text NOT NULL,
	"changes" jsonb,
	"ip_address" varchar(45),
	"created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "order_activities" ADD CONSTRAINT "order_activities_order_id_orders_id_fk" FOREIGN KEY ("order_id") REFERENCES "orders"("id") ON DELETE cascade ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
