ALTER TABLE "order_lines" ADD COLUMN "variant_id" uuid;--> statement-breakpoint
ALTER TABLE "order_lines" ADD COLUMN "package_type" varchar(50);--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "order_lines" ADD CONSTRAINT "order_lines_variant_id_product_variants_id_fk" FOREIGN KEY ("variant_id") REFERENCES "product_variants"("id") ON DELETE no action ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
