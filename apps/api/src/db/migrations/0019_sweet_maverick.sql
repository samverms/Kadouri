ALTER TABLE "agents" ADD COLUMN "company_name" varchar(255);--> statement-breakpoint
ALTER TABLE "agents" ADD COLUMN "address_line1" varchar(255);--> statement-breakpoint
ALTER TABLE "agents" ADD COLUMN "address_line2" varchar(255);--> statement-breakpoint
ALTER TABLE "agents" ADD COLUMN "city" varchar(100);--> statement-breakpoint
ALTER TABLE "agents" ADD COLUMN "state" varchar(50);--> statement-breakpoint
ALTER TABLE "agents" ADD COLUMN "postal_code" varchar(20);--> statement-breakpoint
ALTER TABLE "agents" ADD COLUMN "country" varchar(50) DEFAULT 'US';--> statement-breakpoint
ALTER TABLE "agents" ADD COLUMN "active" boolean DEFAULT true NOT NULL;--> statement-breakpoint
ALTER TABLE "agents" ADD COLUMN "created_by" varchar(255);--> statement-breakpoint
ALTER TABLE "brokers" ADD COLUMN "company_name" varchar(255);--> statement-breakpoint
ALTER TABLE "brokers" ADD COLUMN "address_line1" varchar(255);--> statement-breakpoint
ALTER TABLE "brokers" ADD COLUMN "address_line2" varchar(255);--> statement-breakpoint
ALTER TABLE "brokers" ADD COLUMN "city" varchar(100);--> statement-breakpoint
ALTER TABLE "brokers" ADD COLUMN "state" varchar(50);--> statement-breakpoint
ALTER TABLE "brokers" ADD COLUMN "postal_code" varchar(20);--> statement-breakpoint
ALTER TABLE "brokers" ADD COLUMN "country" varchar(50) DEFAULT 'US';--> statement-breakpoint
ALTER TABLE "brokers" ADD COLUMN "active" boolean DEFAULT true NOT NULL;--> statement-breakpoint
ALTER TABLE "brokers" ADD COLUMN "created_by" varchar(255);