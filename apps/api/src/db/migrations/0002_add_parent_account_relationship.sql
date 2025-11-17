-- Add parent_account_id column to accounts table for hierarchical relationships
-- This allows linking primary customers to their brokers/agents
-- Example: "A-1 Bakery Supply" (parent) -> "Olive Branch Brokerage" (broker)

ALTER TABLE "accounts" ADD COLUMN "parent_account_id" uuid;

-- Add foreign key constraint
DO $$ BEGIN
 ALTER TABLE "accounts" ADD CONSTRAINT "accounts_parent_account_id_accounts_id_fk"
   FOREIGN KEY ("parent_account_id") REFERENCES "accounts"("id")
   ON DELETE SET NULL ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;

-- Add index for faster lookups
CREATE INDEX IF NOT EXISTS "accounts_parent_account_id_idx" ON "accounts"("parent_account_id");

-- Add comment for documentation
COMMENT ON COLUMN "accounts"."parent_account_id" IS 'Links broker/agent accounts to their parent customer account. NULL for direct customers or top-level parent accounts.';
