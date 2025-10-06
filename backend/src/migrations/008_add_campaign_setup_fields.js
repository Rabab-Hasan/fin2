const pool = require('../database');

async function addCampaignSetupFields() {
    try {
        const client = await pool.connect();

        // SQLite doesn't support adding multiple columns at once, so we add them one by one
        const fieldsToAdd = [
            'countries TEXT',
            'duration INTEGER',
            'estimated_reach INTEGER',
            'estimated_impressions INTEGER',
            'estimated_clicks INTEGER',
            'estimated_ctr DECIMAL(5,4)',
            'platforms TEXT',
            'campaign_data TEXT'
        ];

        for (const field of fieldsToAdd) {
            try {
                await client.query(`ALTER TABLE campaigns ADD COLUMN ${field}`);
                console.log(`✅ Added field: ${field}`);
            } catch (alterError) {
                // If column already exists, that's okay
                if (alterError.message.includes('duplicate column name') || 
                    alterError.message.includes('already exists')) {
                    console.log(`✅ Field ${field} already exists, skipping...`);
                } else {
                    throw alterError;
                }
            }
        }

        client.release();
        console.log('✅ Campaign setup migration completed!');
        
    } catch (error) {
        console.error('❌ Error adding campaign setup fields:', error);
        process.exit(1);
    }
}

// Run the migration
addCampaignSetupFields();