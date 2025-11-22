-- Migration: Drop sales_agent_id from orders table
-- This column was deprecated in favor of agent_id (UUID reference to agents table)

ALTER TABLE orders DROP COLUMN IF EXISTS sales_agent_id;
