ALTER TABLE "orders" ADD COLUMN "seller_billing_address_id" uuid;--> statement-breakpoint
ALTER TABLE "orders" ADD COLUMN "seller_pickup_address_id" uuid;--> statement-breakpoint
ALTER TABLE "orders" ADD COLUMN "buyer_billing_address_id" uuid;--> statement-breakpoint
ALTER TABLE "orders" ADD COLUMN "buyer_shipping_address_id" uuid;--> statement-breakpoint
ALTER TABLE "orders" ADD COLUMN "is_pickup" boolean DEFAULT false NOT NULL;--> statement-breakpoint
ALTER TABLE "orders" ADD COLUMN "agent_user_id" varchar(255);--> statement-breakpoint
ALTER TABLE "orders" ADD COLUMN "agent_name" varchar(255);--> statement-breakpoint
ALTER TABLE "orders" ADD COLUMN "broker_user_id" varchar(255);--> statement-breakpoint
ALTER TABLE "orders" ADD COLUMN "broker_name" varchar(255);--> statement-breakpoint
ALTER TABLE "orders" ADD COLUMN "memo" text;--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "orders" ADD CONSTRAINT "orders_seller_billing_address_id_addresses_id_fk" FOREIGN KEY ("seller_billing_address_id") REFERENCES "addresses"("id") ON DELETE no action ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "orders" ADD CONSTRAINT "orders_seller_pickup_address_id_addresses_id_fk" FOREIGN KEY ("seller_pickup_address_id") REFERENCES "addresses"("id") ON DELETE no action ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "orders" ADD CONSTRAINT "orders_buyer_billing_address_id_addresses_id_fk" FOREIGN KEY ("buyer_billing_address_id") REFERENCES "addresses"("id") ON DELETE no action ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "orders" ADD CONSTRAINT "orders_buyer_shipping_address_id_addresses_id_fk" FOREIGN KEY ("buyer_shipping_address_id") REFERENCES "addresses"("id") ON DELETE no action ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
