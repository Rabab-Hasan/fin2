const pool = require('../database');

async function createCampaignsTable() {
    try {
        
        // Create campaigns table
        const createCampaignsSQL = `
            CREATE TABLE IF NOT EXISTS campaigns (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                name TEXT NOT NULL,
                type TEXT,
                budget DECIMAL(15,2),
                product_service TEXT,
                objective TEXT,
                narrative TEXT,
                concept TEXT,
                tagline TEXT,
                hero_artwork TEXT,
                account_manager_id INTEGER,
                activities TEXT, -- JSON array of selected activities
                internal_approval_required INTEGER DEFAULT 0,
                client_approval_required INTEGER DEFAULT 0,
                status TEXT DEFAULT 'draft',
                ai_validation_passed INTEGER DEFAULT 0,
                ai_validation_feedback TEXT,
                client_id INTEGER,
                created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
                updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
                created_by INTEGER,
                FOREIGN KEY (client_id) REFERENCES clients(id),
                FOREIGN KEY (account_manager_id) REFERENCES users(id),
                FOREIGN KEY (created_by) REFERENCES users(id)
            )
        `;

        const client = await pool.connect();
        
        await client.query(createCampaignsSQL);
        console.log('✅ Campaigns table created successfully');

        // Create campaign_tasks table for auto-generated tasks
        const createCampaignTasksSQL = `
            CREATE TABLE IF NOT EXISTS campaign_tasks (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                campaign_id INTEGER NOT NULL,
                task_id INTEGER NOT NULL,
                is_auto_generated INTEGER DEFAULT 1,
                activity_type TEXT, -- which activity this task belongs to
                created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
                FOREIGN KEY (campaign_id) REFERENCES campaigns(id) ON DELETE CASCADE,
                FOREIGN KEY (task_id) REFERENCES tasks(id) ON DELETE CASCADE
            )
        `;

        await client.query(createCampaignTasksSQL);
        console.log('✅ Campaign_tasks table created successfully');

        // Create campaign_approvals table for tracking approval workflow
        const createCampaignApprovalsSQL = `
            CREATE TABLE IF NOT EXISTS campaign_approvals (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                campaign_id INTEGER NOT NULL,
                approval_type TEXT NOT NULL, -- 'internal' or 'client'
                status TEXT DEFAULT 'pending', -- 'pending', 'approved', 'rejected'
                approved_by INTEGER,
                approved_at DATETIME,
                rejection_reason TEXT,
                created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
                FOREIGN KEY (campaign_id) REFERENCES campaigns(id) ON DELETE CASCADE,
                FOREIGN KEY (approved_by) REFERENCES users(id)
            )
        `;

        await client.query(createCampaignApprovalsSQL);
        console.log('✅ Campaign_approvals table created successfully');

        client.release();
        console.log('✅ All campaign-related tables created successfully!');
        
    } catch (error) {
        console.error('❌ Error creating campaigns tables:', error);
        process.exit(1);
    }
}

// Run the migration
createCampaignsTable();