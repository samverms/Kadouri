-- Migration: Add team tracking and user audit columns
-- Created: 2025-11-15
-- Description: Adds sales_agent_id, customer_service_id, back_office_id, and updated_by columns

-- Step 1: Add all columns first
ALTER TABLE accounts ADD COLUMN IF NOT EXISTS sales_agent_id VARCHAR(255);
ALTER TABLE accounts ADD COLUMN IF NOT EXISTS customer_service_id VARCHAR(255);
ALTER TABLE accounts ADD COLUMN IF NOT EXISTS back_office_id VARCHAR(255);
ALTER TABLE accounts ADD COLUMN IF NOT EXISTS updated_by VARCHAR(255);
ALTER TABLE addresses ADD COLUMN IF NOT EXISTS updated_by VARCHAR(255);
ALTER TABLE contacts ADD COLUMN IF NOT EXISTS updated_by VARCHAR(255);
ALTER TABLE orders ADD COLUMN IF NOT EXISTS sales_agent_id VARCHAR(255);
ALTER TABLE orders ADD COLUMN IF NOT EXISTS updated_by VARCHAR(255);
