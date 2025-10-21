const { getDb } = require('../database-mongo');
const fs = require('fs-extra');
const path = require('path');
const archiver = require('archiver');
const moment = require('moment');

const BACKUP_DIR = path.join(__dirname, '../../backups');
const PRIMARY_DIR = path.join(BACKUP_DIR, 'primary');
const EMERGENCY_DIR = path.join(BACKUP_DIR, 'emergency');

async function ensureBackupDirs() {
  try {
    await fs.ensureDir(PRIMARY_DIR);
    await fs.ensureDir(EMERGENCY_DIR);
  } catch (error) {
    console.warn('Could not create backup directories (filesystem may be read-only):', error.message);
  }
}

async function getBackupStatus() {
  try {
    const db = await getDb();
    // Get total records
    const recordsStored = await db.collection('reports').countDocuments();
    
    // Calculate main storage size (approximate)
    const mainStorageKb = recordsStored * 0.8; // Approximate 0.8KB per record
    
    // For production environments with read-only filesystems, return status without file operations
    const isReadOnlyEnvironment = process.env.NODE_ENV === 'production' || process.env.RENDER;
    
    if (isReadOnlyEnvironment) {
      return {
        records_stored: recordsStored,
        main_storage_kb: mainStorageKb,
        primary_backup_kb: 0,
        emergency_backup_kb: 0,
        primary_last_at: null,
        emergency_last_at: null,
        message: 'File system backups not available in production environment'
      };
    }
    
    await ensureBackupDirs();
    
    // Get backup file info (handle file system errors gracefully)
    let primaryFiles = [];
    let emergencyFiles = [];
    
    try {
      primaryFiles = await fs.readdir(PRIMARY_DIR);
    } catch (error) {
      console.warn('Could not read primary backup directory:', error.message);
    }
    
    try {
      emergencyFiles = await fs.readdir(EMERGENCY_DIR);
    } catch (error) {
      console.warn('Could not read emergency backup directory:', error.message);
    }
    
    const getLatestFileInfo = async (dir, files) => {
      if (files.length === 0) return { kb: 0, lastAt: null };
      
      const latestFile = files
        .filter(f => f.endsWith('.csv'))
        .sort()
        .pop();
      
      if (!latestFile) return { kb: 0, lastAt: null };
      
      try {
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
      } catch (error) {
        console.warn('Could not read backup file stats:', error.message);
        return { kb: 0, lastAt: null };
      }
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
    
  } catch (error) {
    console.error('Error getting backup status:', error);
    throw error;
  }
}

async function createBackup(target = 'primary') {
  await ensureBackupDirs();
  
  const targetDir = target === 'emergency' ? EMERGENCY_DIR : PRIMARY_DIR;
  const timestamp = moment().format('YYYY-MM-DDTHH-mm-ss');
  const filename = `backup_${timestamp}.csv`;
  const filepath = path.join(targetDir, filename);
  
  try {
    const db = await getDb();
    // Get all reports data
    const rows = await db.collection('reports')
      .find({})
      .sort({ report_date: 1 })
      .toArray();
      
    if (rows.length === 0) {
      throw new Error('No data found to backup');
    }

    // On read-only filesystems (like Render), return the data as a response instead of writing to file
    const isReadOnlySystem = process.env.NODE_ENV === 'production' || process.env.RENDER;
    
    if (isReadOnlySystem) {
      return { 
        success: true, 
        filename, 
        records: rows.length,
        message: 'Backup created in memory (filesystem is read-only)',
        data: rows
      };
    }
    
    if (rows.length === 0) {
      throw new Error('No data found to backup');
    }
    
    // Define headers for consistent CSV structure
    const headers = [
      'id', 'report_date', 'month_label', 'clientId', 'notes',
      'createdAt', 'updatedAt'
    ];
    
    // Add data fields from the data object
    const dataFields = new Set();
    rows.forEach(row => {
      if (row.data && typeof row.data === 'object') {
        Object.keys(row.data).forEach(key => dataFields.add(key));
      }
    });
    
    const allHeaders = [...headers, ...Array.from(dataFields)];
    let csvContent = allHeaders.join(',') + '\n';
    
    // Build CSV rows
    for (const row of rows) {
      const csvRow = allHeaders.map(header => {
        let value;
        if (dataFields.has(header)) {
          value = row.data?.[header];
        } else {
          value = row[header];
        }
        return value !== undefined && value !== null ? `"${value}"` : '""';
      });
      csvContent += csvRow.join(',') + '\n';
    }
    
    try {
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
    } catch (fsError) {
      console.warn('Could not write backup file (filesystem may be read-only):', fsError.message);
      return { 
        success: true, 
        filename, 
        records: rows.length,
        message: 'Backup created in memory (could not write to filesystem)',
        data: rows
      };
    }
    
  } catch (error) {
    console.error('Error creating backup:', error);
    throw error;
  }
}

async function checkIntegrity() {
  try {
    const db = await getDb();
    // Get database counts
    const dbCount = await db.collection('reports').countDocuments();
    
    // Check primary backup
    let primaryFiles = [];
    try {
      primaryFiles = await fs.readdir(PRIMARY_DIR);
    } catch (error) {
      console.warn('Could not read backup directory:', error.message);
      return { 
        success: true,
        database_count: dbCount,
        backup_count: 0,
        match: false,
        message: 'No backup directory accessible (filesystem may be read-only)'
      };
    }
    
    const latestPrimary = primaryFiles
      .filter(f => f.endsWith('.csv'))
      .sort()
      .pop();
    
    if (!latestPrimary) {
      return { 
        success: true,
        database_count: dbCount,
        backup_count: 0,
        match: false,
        message: 'No primary backup found'
      };
    }
    
    try {
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
    } catch (fileError) {
      console.warn('Could not read backup file:', fileError.message);
      return { 
        success: true,
        database_count: dbCount,
        backup_count: 0,
        match: false,
        message: 'Could not read backup file'
      };
    }
    
  } catch (error) {
    console.error('Error checking integrity:', error);
    throw error;
  }
}

async function recoverFromBackup(source = 'primary') {
  const sourceDir = source === 'emergency' ? EMERGENCY_DIR : PRIMARY_DIR;
  
  let files = [];
  try {
    files = await fs.readdir(sourceDir);
  } catch (error) {
    throw new Error(`No backup directory accessible for ${source} backup (filesystem may be read-only)`);
  }
  
  const latestFile = files
    .filter(f => f.endsWith('.csv'))
    .sort()
    .pop();
  
  if (!latestFile) {
    throw new Error(`No backup file found in ${source} backup`);
  }
  
  let backupContent;
  try {
    const backupPath = path.join(sourceDir, latestFile);
    backupContent = await fs.readFile(backupPath, 'utf8');
  } catch (error) {
    throw new Error(`Could not read backup file: ${error.message}`);
  }
  
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
  try {
    const db = await getDb();
    // Clear all reports
    await db.collection('reports').deleteMany({});
    
    // Restore data by inserting each row
    const restoredRows = [];
    for (const row of data) {
      if (row.report_date && row.id) {
        // Separate basic fields from data fields
        const basicFields = ['id', 'report_date', 'month_label', 'clientId', 'notes'];
        const document = {
          createdAt: new Date(),
          updatedAt: new Date(),
          data: {}
        };
        
        // Process each field
        Object.keys(row).forEach(key => {
          if (basicFields.includes(key)) {
            document[key] = row[key];
          } else if (key !== 'createdAt' && key !== 'updatedAt') {
            // Put everything else in data object
            document.data[key] = row[key];
          }
        });
        
        await db.collection('reports').insertOne(document);
        restoredRows.push(document);
      }
    }
    
    return { success: true, backup_file: latestFile, records_restored: restoredRows.length };
    
  } catch (error) {
    console.error('Error recovering from backup:', error);
    throw error;
  }
}

module.exports = {
  getBackupStatus,
  createBackup,
  checkIntegrity,
  recoverFromBackup
};
