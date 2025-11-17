CREATE TABLE IF NOT EXISTS "quickbooks_tokens" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"realm_id" text NOT NULL,
	"access_token" text NOT NULL,
	"refresh_token" text NOT NULL,
	"token_type" text DEFAULT 'bearer',
	"expires_at" timestamp NOT NULL,
	"refresh_token_expires_at" timestamp NOT NULL,
	"is_active" boolean DEFAULT true,
	"created_at" timestamp DEFAULT now(),
	"updated_at" timestamp DEFAULT now(),
	CONSTRAINT "quickbooks_tokens_realm_id_unique" UNIQUE("realm_id")
);
