const pool = require('../database');
const fs = require('fs-extra');
const path = require('path');
const archiver = require('archiver');
const moment = require('moment');

const BACKUP_DIR = path.join(__dirname, '../../backups');
const PRIMARY_DIR = path.join(BACKUP_DIR, 'primary');
const EMERGENCY_DIR = path.join(BACKUP_DIR, 'emergency');

async function ensureBackupDirs() {
  await fs.ensureDir(PRIMARY_DIR);
  await fs.ensureDir(EMERGENCY_DIR);
}

async function getBackupStatus() {
  await ensureBackupDirs();
  
  const client = await pool.connect();
  try {
    // Get total records
    const recordsResult = await client.query('SELECT COUNT(*) as count FROM reports');
    const recordsStored = parseInt(recordsResult.rows?.[0]?.count || recordsResult[0]?.count || 0);
    
    // Calculate main storage size (simplified for SQLite)
    const mainStorageKb = recordsStored * 0.5; // Approximate 0.5KB per record
    
    // Get backup file info
    const primaryFiles = await fs.readdir(PRIMARY_DIR).catch(() => []);
    const emergencyFiles = await fs.readdir(EMERGENCY_DIR).catch(() => []);
    
    const getLatestFileInfo = async (dir, files) => {
      if (files.length === 0) return { kb: 0, lastAt: null };
      
      const latestFile = files
        .filter(f => f.endsWith('.csv'))
        .sort()
        .pop();
      
      if (!latestFile) return { kb: 0, lastAt: null };
      
      const filePath = path.join(dir, latestFile);
      const stats = await fs.stat(filePath);
      
      // Extract timestamp from filename
      const timestampMatch = latestFile.match(/backup_(\d{4}-\d{2}-\d{2}T\d{2}-\d{2}-\d{2})/);
      const lastAt = timestampMatch ? 
        moment(timestampMatch[1], 'YYYY-MM-DDTHH-mm-ss').toISOString() : 
        stats.mtime.toISOString();
      
      return {
        kb: stats.size / 1024,
        lastAt
      };
    };
    
    const primaryInfo = await getLatestFileInfo(PRIMARY_DIR, primaryFiles);
    const emergencyInfo = await getLatestFileInfo(EMERGENCY_DIR, emergencyFiles);
    
    return {
      records_stored: recordsStored,
      main_storage_kb: mainStorageKb,
      primary_backup_kb: primaryInfo.kb,
      emergency_backup_kb: emergencyInfo.kb,
      primary_last_at: primaryInfo.lastAt,
      emergency_last_at: emergencyInfo.lastAt
    };
    
  } finally {
    client.release();
  }
}

async function createBackup(target = 'primary') {
  await ensureBackupDirs();
  
  const targetDir = target === 'emergency' ? EMERGENCY_DIR : PRIMARY_DIR;
  const timestamp = moment().format('YYYY-MM-DDTHH-mm-ss');
  const filename = `backup_${timestamp}.csv`;
  const filepath = path.join(targetDir, filename);
  
  const client = await pool.connect();
  try {
    // For SQLite development mode, get all columns
    const dataResult = await client.query(`
      SELECT 
        report_date,
        month_label,
        registered_onboarded,
        linked_accounts,
        total_advance_applications,
        total_advance_applicants,
        total_micro_financing_applications,
        total_micro_financing_applicants,
        total_personal_finance_application,
        total_personal_finance_applicants,
        notes,
        created_at,
        updated_at
      FROM reports 
      ORDER BY report_date
    `);
    
    const rows = dataResult.rows || dataResult;
    
    if (rows.length === 0) {
      throw new Error('No data found to backup');
    }
    
    // Build CSV header from the first row keys
    const headers = Object.keys(rows[0]);
    let csvContent = headers.join(',') + '\n';
    
    // Build CSV rows
    for (const row of rows) {
      const csvRow = headers.map(header => {
        const value = row[header];
        return value !== undefined && value !== null ? `"${value}"` : '""';
      });
      csvContent += csvRow.join(',') + '\n';
    }
    
    await fs.writeFile(filepath, csvContent);
    
    // Clean up old backups (keep last 10)
    const files = await fs.readdir(targetDir);
    const backupFiles = files
      .filter(f => f.startsWith('backup_') && f.endsWith('.csv'))
      .sort()
      .reverse();
    
    if (backupFiles.length > 10) {
      const filesToDelete = backupFiles.slice(10);
      for (const file of filesToDelete) {
        await fs.unlink(path.join(targetDir, file));
      }
    }
    
    return { success: true, filename, path: filepath, records: rows.length };
    
  } finally {
    client.release();
  }
}

async function checkIntegrity() {
  const client = await pool.connect();
  try {
    // Get database counts
    const dbResult = await client.query('SELECT COUNT(*) as count FROM reports');
    const dbCount = parseInt(dbResult.rows[0].count);
    
    // Check primary backup
    const primaryFiles = await fs.readdir(PRIMARY_DIR).catch(() => []);
    const latestPrimary = primaryFiles
      .filter(f => f.endsWith('.csv'))
      .sort()
      .pop();
    
    if (!latestPrimary) {
      return { success: false, message: 'No primary backup found' };
    }
    
    const backupPath = path.join(PRIMARY_DIR, latestPrimary);
    const backupContent = await fs.readFile(backupPath, 'utf8');
    const backupLines = backupContent.split('\n').filter(line => line.trim());
    const backupCount = backupLines.length - 1; // Subtract header
    
    return {
      success: true,
      database_count: dbCount,
      backup_count: backupCount,
      match: dbCount === backupCount,
      backup_file: latestPrimary
    };
    
  } finally {
    client.release();
  }
}

async function recoverFromBackup(source = 'primary') {
  const sourceDir = source === 'emergency' ? EMERGENCY_DIR : PRIMARY_DIR;
  const files = await fs.readdir(sourceDir).catch(() => []);
  const latestFile = files
    .filter(f => f.endsWith('.csv'))
    .sort()
    .pop();
  
  if (!latestFile) {
    throw new Error(`No backup file found in ${source} backup`);
  }
  
  const backupPath = path.join(sourceDir, latestFile);
  const backupContent = await fs.readFile(backupPath, 'utf8');
  
  // Parse CSV and restore data
  const lines = backupContent.split('\n').filter(line => line.trim());
  const headers = lines[0].split(',').map(h => h.replace(/"/g, ''));
  
  const data = [];
  for (let i = 1; i < lines.length; i++) {
    const values = lines[i].split(',').map(v => v.replace(/"/g, ''));
    const row = {};
    headers.forEach((header, index) => {
      row[header] = values[index] || '';
    });
    data.push(row);
  }
  
  // Clear existing data and restore
  const client = await pool.connect();
  try {
    // For SQLite, we don't need explicit transactions for simple operations
    await client.query('DELETE FROM reports');
    
    // Restore data by inserting each row
    for (const row of data) {
      if (row.report_date) {
        await client.query(`
          INSERT INTO reports (
            report_date, month_label, registered_onboarded, linked_accounts,
            total_advance_applications, total_advance_applicants,
            total_micro_financing_applications, total_micro_financing_applicants,
            total_personal_finance_application, total_personal_finance_applicants,
            notes, created_at, updated_at
          ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP)
        `, [
          row.report_date, row.month_label, row.registered_onboarded, row.linked_accounts,
          row.total_advance_applications, row.total_advance_applicants,
          row.total_micro_financing_applications, row.total_micro_financing_applicants,
          row.total_personal_finance_application, row.total_personal_finance_applicants,
          row.notes
        ]);
      }
    }
    
    return { success: true, backup_file: latestFile, records_restored: data.length };
    
  } finally {
    client.release();
  }
}

module.exports = {
  getBackupStatus,
  createBackup,
  checkIntegrity,
  recoverFromBackup
};
