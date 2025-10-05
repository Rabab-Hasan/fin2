const db = require('../src/database-sqlite');

async function updateClientOne() {
  const pool = await db.connect();
  try {
    await pool.query("UPDATE clients SET name='ONE', company='ONEAPP' WHERE id='1'");
    console.log('Client 1 updated to ONE / ONEAPP');
  } finally {
    pool.release();
  }
}

updateClientOne();
