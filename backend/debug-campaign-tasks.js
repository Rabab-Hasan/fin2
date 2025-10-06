const pool = require('./src/database-sqlite');

async function queryAsync(sql, params = []) {
  const client = await pool.connect();
  try {
    const result = await client.query(sql, params);
    client.release();
    return result;
  } catch (error) {
    client.release();
    throw error;
  }
}

async function debugCampaignTasks() {
  console.log('=== Debugging Campaign Tasks Organization ===\n');
  
  try {
    // Check if campaign_tasks table exists
    console.log('1. Checking campaign_tasks table...');
    const tableCheck = await queryAsync(`SELECT name FROM sqlite_master WHERE type='table' AND name='campaign_tasks'`);
    console.log('campaign_tasks table exists:', tableCheck.rows?.length > 0 || tableCheck.length > 0);
    
    // Show campaign_tasks data
    const campaignTasksResult = await queryAsync('SELECT * FROM campaign_tasks LIMIT 10');
    const campaignTasks = campaignTasksResult.rows || campaignTasksResult;
    console.log('\ncampaign_tasks data count:', campaignTasks.length);
    campaignTasks.forEach(ct => {
      console.log(`  Campaign ${ct.campaign_id} -> Task ${ct.task_id} (${ct.activity_type})`);
    });
    
    // Show all tasks
    console.log('\n2. All tasks in database:');
    const allTasksResult = await queryAsync('SELECT id, title, client_id FROM tasks LIMIT 20');
    const allTasks = allTasksResult.rows || allTasksResult;
    console.log(`Total tasks: ${allTasks.length}`);
    allTasks.forEach(task => {
      console.log(`  Task ${task.id}: "${task.title}" (client: ${task.client_id})`);
    });
    
    // Check which tasks are linked to campaigns
    console.log('\n3. Tasks linked to campaigns:');
    const linkedTasksResult = await queryAsync(`
      SELECT t.id, t.title, ct.campaign_id, ct.activity_type
      FROM tasks t
      INNER JOIN campaign_tasks ct ON t.id = ct.task_id
    `);
    const linkedTasks = linkedTasksResult.rows || linkedTasksResult;
    console.log(`Campaign-linked tasks: ${linkedTasks.length}`);
    linkedTasks.forEach(task => {
      console.log(`  Task ${task.id}: "${task.title}" -> Campaign ${task.campaign_id} (${task.activity_type})`);
    });
    
    // Show tasks that should NOT appear in main list (campaign tasks)
    console.log('\n4. Testing exclusion query (what main tasks should show):');
    const nonCampaignTasksResult = await queryAsync(`
      SELECT t.* FROM tasks t 
      LEFT JOIN campaign_tasks ct ON t.id = ct.task_id 
      WHERE ct.task_id IS NULL
      AND t.client_id = '1'
    `);
    const nonCampaignTasks = nonCampaignTasksResult.rows || nonCampaignTasksResult;
    console.log(`Non-campaign tasks for client 1: ${nonCampaignTasks.length}`);
    nonCampaignTasks.forEach(task => {
      console.log(`  Task ${task.id}: "${task.title}"`);
    });
    
    // Show campaigns
    console.log('\n5. All campaigns:');
    const campaignsResult = await queryAsync('SELECT id, name, client_id FROM campaigns');
    const campaigns = campaignsResult.rows || campaignsResult;
    console.log(`Total campaigns: ${campaigns.length}`);
    campaigns.forEach(campaign => {
      console.log(`  Campaign ${campaign.id}: "${campaign.name}" (client: ${campaign.client_id})`);
    });
    
  } catch (error) {
    console.error('Debug error:', error);
  }
}

debugCampaignTasks();