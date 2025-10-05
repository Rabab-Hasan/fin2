const db = require('../database-sqlite');

(async () => {
  const client = await db.connect();
  try {
    await client.query('DELETE FROM reports');
    console.log('All records deleted from reports table.');
  } catch (err) {
    console.error('Error deleting records:', err);
  } finally {
    client.release();
    process.exit(0);
  }
})();
