-- Add client_id column to reports table for multi-tenancy
ALTER TABLE reports ADD COLUMN client_id TEXT;

-- Create index for faster client-based queries
CREATE INDEX IF NOT EXISTS idx_reports_client_id ON reports(client_id);

-- Add client_id to columns_registry table
ALTER TABLE columns_registry ADD COLUMN client_id TEXT;

-- Create index for client-based column registry queries
CREATE INDEX IF NOT EXISTS idx_columns_registry_client_id ON columns_registry(client_id);