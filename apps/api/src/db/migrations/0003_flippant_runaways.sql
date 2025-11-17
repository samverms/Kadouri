-- Add contract_status enum
DO $$ BEGIN
 CREATE TYPE "contract_status" AS ENUM('draft', 'active', 'completed', 'expired', 'cancelled');
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;

-- Create contracts table
CREATE TABLE IF NOT EXISTS "contracts" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"contract_number" text NOT NULL,
	"seller_id" uuid NOT NULL,
	"buyer_id" uuid NOT NULL,
	"product_id" uuid NOT NULL,
	"total_quantity" numeric(10, 2) NOT NULL,
	"remaining_quantity" numeric(10, 2) NOT NULL,
	"unit" text NOT NULL,
	"price_per_unit" numeric(10, 4) NOT NULL,
	"currency" text DEFAULT 'USD' NOT NULL,
	"total_value" numeric(12, 2) NOT NULL,
	"valid_from" timestamp with time zone NOT NULL,
	"valid_until" timestamp with time zone NOT NULL,
	"status" "contract_status" DEFAULT 'draft' NOT NULL,
	"terms" text,
	"notes" text,
	"draft_document_url" text,
	"draft_document_type" text,
	"draft_generated_at" timestamp with time zone,
	"executed_document_url" text,
	"executed_document_type" text,
	"executed_uploaded_at" timestamp with time zone,
	"executed_uploaded_by" text,
	"document_versions" jsonb,
	"created_by" text NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "contracts_contract_number_unique" UNIQUE("contract_number")
);

-- Create contract_draws table
CREATE TABLE IF NOT EXISTS "contract_draws" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"contract_id" uuid NOT NULL,
	"order_id" uuid NOT NULL,
	"quantity_drawn" numeric(10, 2) NOT NULL,
	"remaining_after_draw" numeric(10, 2) NOT NULL,
	"drawn_at" timestamp with time zone DEFAULT now() NOT NULL,
	"drawn_by" text NOT NULL
);

-- Add contract_id column to orders table if it doesn't exist
DO $$ BEGIN
 ALTER TABLE "orders" ADD COLUMN IF NOT EXISTS "contract_id" uuid;
EXCEPTION
 WHEN duplicate_column THEN null;
END $$;

-- Add foreign keys
DO $$ BEGIN
 ALTER TABLE "contract_draws" ADD CONSTRAINT "contract_draws_contract_id_contracts_id_fk" FOREIGN KEY ("contract_id") REFERENCES "contracts"("id") ON DELETE cascade ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
 ALTER TABLE "contracts" ADD CONSTRAINT "contracts_seller_id_accounts_id_fk" FOREIGN KEY ("seller_id") REFERENCES "accounts"("id") ON DELETE restrict ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
 ALTER TABLE "contracts" ADD CONSTRAINT "contracts_buyer_id_accounts_id_fk" FOREIGN KEY ("buyer_id") REFERENCES "accounts"("id") ON DELETE restrict ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
 ALTER TABLE "contracts" ADD CONSTRAINT "contracts_product_id_products_id_fk" FOREIGN KEY ("product_id") REFERENCES "products"("id") ON DELETE restrict ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
