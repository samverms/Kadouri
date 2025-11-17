ALTER TABLE "products" ADD COLUMN "source" varchar(50) DEFAULT 'manual' NOT NULL;--> statement-breakpoint
ALTER TABLE "products" ADD COLUMN "archived_at" timestamp;--> statement-breakpoint
ALTER TABLE "products" ADD COLUMN "archived_by" varchar(100);