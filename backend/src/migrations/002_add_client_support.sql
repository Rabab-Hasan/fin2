-- Add client_id column to tasks table for multi-tenancy
ALTER TABLE tasks ADD COLUMN client_id TEXT;

-- Create index for faster client-based queries
CREATE INDEX IF NOT EXISTS idx_tasks_client_id ON tasks(client_id);

-- Create clients table for managing client information
CREATE TABLE IF NOT EXISTS clients (
    id TEXT PRIMARY KEY,
    name TEXT NOT NULL,
    email TEXT,
    phone TEXT,
    company TEXT,
    created_at TEXT NOT NULL DEFAULT (datetime('now')),
    updated_at TEXT NOT NULL DEFAULT (datetime('now'))
);

-- Create index for client queries
CREATE INDEX IF NOT EXISTS idx_clients_name ON clients(name);

-- Trigger to update clients updated_at timestamp
CREATE TRIGGER IF NOT EXISTS update_clients_updated_at 
    AFTER UPDATE ON clients
    FOR EACH ROW
BEGIN
    UPDATE clients SET updated_at = datetime('now') WHERE id = NEW.id;
END;