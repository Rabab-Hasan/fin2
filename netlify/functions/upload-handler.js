// Serverless-compatible file upload handler for Netlify Functions
const multer = require('multer');
const path = require('path');
const fs = require('fs-extra');

// For serverless, use memory storage instead of disk storage
const storage = multer.memoryStorage();

const upload = multer({
  storage,
  limits: {
    fileSize: 10 * 1024 * 1024, // 10MB limit for serverless
  },
  fileFilter: (req, file, cb) => {
    // Allow common file types
    const allowedTypes = /\.(jpg|jpeg|png|gif|pdf|doc|docx|xls|xlsx|csv)$/i;
    const extname = allowedTypes.test(path.extname(file.originalname));
    const mimetype = /image\/(jpeg|png|gif)|application\/(pdf|msword|vnd\.openxmlformats-officedocument|vnd\.ms-excel)|text\/csv/.test(file.mimetype);
    
    if (mimetype && extname) {
      return cb(null, true);
    } else {
      cb(new Error('Invalid file type'));
    }
  }
});

// Helper function to save uploaded files in serverless environment
const saveUploadedFile = async (file, subdirectory = '') => {
  try {
    // In serverless, we can use /tmp directory for temporary storage
    // Note: Files in /tmp are lost when function ends, so you might want to upload to cloud storage
    const uploadDir = path.join('/tmp/uploads', subdirectory);
    await fs.ensureDir(uploadDir);
    
    const filename = `${Date.now()}-${Math.random().toString(36).substr(2, 9)}${path.extname(file.originalname)}`;
    const filepath = path.join(uploadDir, filename);
    
    await fs.writeFile(filepath, file.buffer);
    
    return {
      filename,
      filepath,
      originalname: file.originalname,
      size: file.size,
      mimetype: file.mimetype
    };
  } catch (error) {
    console.error('Error saving uploaded file:', error);
    throw error;
  }
};

// Helper function to get file content
const getFileContent = async (filepath) => {
  try {
    return await fs.readFile(filepath);
  } catch (error) {
    console.error('Error reading file:', error);
    throw error;
  }
};

module.exports = {
  upload,
  saveUploadedFile,
  getFileContent
};