-- Add agent and broker fields to invoices table
ALTER TABLE "invoices" ADD COLUMN IF NOT EXISTS "agent_user_id" varchar(255);
ALTER TABLE "invoices" ADD COLUMN IF NOT EXISTS "agent_name" varchar(255);
ALTER TABLE "invoices" ADD COLUMN IF NOT EXISTS "broker_user_id" varchar(255);
ALTER TABLE "invoices" ADD COLUMN IF NOT EXISTS "broker_name" varchar(255);
