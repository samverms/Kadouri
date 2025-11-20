ALTER TABLE "orders" ADD COLUMN "agent_id" uuid;--> statement-breakpoint
ALTER TABLE "orders" ADD COLUMN "broker_id" uuid;--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "orders" ADD CONSTRAINT "orders_agent_id_agents_id_fk" FOREIGN KEY ("agent_id") REFERENCES "agents"("id") ON DELETE no action ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "orders" ADD CONSTRAINT "orders_broker_id_brokers_id_fk" FOREIGN KEY ("broker_id") REFERENCES "brokers"("id") ON DELETE no action ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
