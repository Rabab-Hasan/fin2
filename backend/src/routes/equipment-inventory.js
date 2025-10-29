const express = require('express');
const { ObjectId } = require('mongodb');
const { getDb } = require('../database-mongo');
const multer = require('multer');
const path = require('path');
const fs = require('fs-extra');

const router = express.Router();

// Configure multer for image uploads
const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    const uploadPath = path.join(__dirname, '../../uploads/equipment');
    fs.ensureDirSync(uploadPath);
    cb(null, uploadPath);
  },
  filename: function (req, file, cb) {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    cb(null, file.fieldname + '-' + uniqueSuffix + path.extname(file.originalname));
  }
});

const upload = multer({ 
  storage: storage,
  fileFilter: function (req, file, cb) {
    // Accept images only
    if (!file.originalname.match(/\.(jpg|JPG|jpeg|JPEG|png|PNG|gif|GIF)$/)) {
      req.fileValidationError = 'Only image files are allowed!';
      return cb(new Error('Only image files are allowed!'), false);
    }
    cb(null, true);
  },
  limits: {
    fileSize: 5 * 1024 * 1024 // 5MB limit
  }
});

// GET /api/equipment-inventory - Get all equipment
router.get('/', async (req, res) => {
  try {
    const db = await getDb();
    const equipment = await db.collection('equipment_inventory')
      .find({ isActive: true })
      .sort({ name: 1 })
      .toArray();

    res.json(equipment);
  } catch (error) {
    console.error('Error fetching equipment inventory:', error);
    res.status(500).json({ error: 'Failed to fetch equipment inventory' });
  }
});

// GET /api/equipment-inventory/available - Get available equipment
router.get('/available', async (req, res) => {
  try {
    const { type } = req.query;
    const db = await getDb();
    
    const filter = { 
      isActive: true, 
      quantityAvailable: { $gt: 0 } 
    };
    
    if (type) {
      filter.type = type;
    }

    const equipment = await db.collection('equipment_inventory')
      .find(filter)
      .sort({ name: 1 })
      .toArray();

    res.json(equipment);
  } catch (error) {
    console.error('Error fetching available equipment:', error);
    res.status(500).json({ error: 'Failed to fetch available equipment' });
  }
});

// POST /api/equipment-inventory - Add new equipment
router.post('/', upload.single('image'), async (req, res) => {
  try {
    const {
      name,
      type,
      model,
      brand,
      serialNumber,
      quantityAvailable,
      quantityTotal,
      location,
      condition,
      addedBy
    } = req.body;

    if (!name || !type || !model || !quantityTotal) {
      return res.status(400).json({ 
        error: 'Name, type, model, and quantity are required' 
      });
    }

    const db = await getDb();
    
    const equipmentData = {
      name,
      type,
      model,
      brand: brand || '',
      serialNumber: serialNumber || '',
      quantityAvailable: parseInt(quantityAvailable) || parseInt(quantityTotal),
      quantityTotal: parseInt(quantityTotal),
      location: location || '',
      condition: condition || 'New',
      addedBy: addedBy || 'System',
      addedAt: new Date(),
      updatedAt: new Date(),
      isActive: true
    };

    // Add image path if uploaded
    if (req.file) {
      equipmentData.imagePath = `/uploads/equipment/${req.file.filename}`;
    }

    const result = await db.collection('equipment_inventory').insertOne(equipmentData);
    const newEquipment = await db.collection('equipment_inventory').findOne({ _id: result.insertedId });

    res.status(201).json(newEquipment);
  } catch (error) {
    console.error('Error adding equipment:', error);
    res.status(500).json({ error: 'Failed to add equipment' });
  }
});

// PUT /api/equipment-inventory/:id - Update equipment
router.put('/:id', upload.single('image'), async (req, res) => {
  try {
    const { id } = req.params;
    const updateData = { ...req.body };
    
    // Convert string numbers to integers
    if (updateData.quantityAvailable) {
      updateData.quantityAvailable = parseInt(updateData.quantityAvailable);
    }
    if (updateData.quantityTotal) {
      updateData.quantityTotal = parseInt(updateData.quantityTotal);
    }
    
    updateData.updatedAt = new Date();

    // Add new image path if uploaded
    if (req.file) {
      updateData.imagePath = `/uploads/equipment/${req.file.filename}`;
    }

    const db = await getDb();
    const result = await db.collection('equipment_inventory').updateOne(
      { _id: new ObjectId(id) },
      { $set: updateData }
    );

    if (result.matchedCount === 0) {
      return res.status(404).json({ error: 'Equipment not found' });
    }

    const updatedEquipment = await db.collection('equipment_inventory').findOne({ _id: new ObjectId(id) });
    res.json(updatedEquipment);
  } catch (error) {
    console.error('Error updating equipment:', error);
    res.status(500).json({ error: 'Failed to update equipment' });
  }
});

// DELETE /api/equipment-inventory/:id - Delete equipment (soft delete)
router.delete('/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const db = await getDb();
    
    const result = await db.collection('equipment_inventory').updateOne(
      { _id: new ObjectId(id) },
      { 
        $set: { 
          isActive: false, 
          updatedAt: new Date() 
        } 
      }
    );

    if (result.matchedCount === 0) {
      return res.status(404).json({ error: 'Equipment not found' });
    }

    res.json({ message: 'Equipment deleted successfully' });
  } catch (error) {
    console.error('Error deleting equipment:', error);
    res.status(500).json({ error: 'Failed to delete equipment' });
  }
});

// PATCH /api/equipment-inventory/:id/quantity - Adjust quantity
router.patch('/:id/quantity', async (req, res) => {
  try {
    const { id } = req.params;
    const { quantityChange, reason } = req.body;

    if (typeof quantityChange !== 'number') {
      return res.status(400).json({ error: 'Quantity change must be a number' });
    }

    const db = await getDb();
    const equipment = await db.collection('equipment_inventory').findOne({ _id: new ObjectId(id) });
    
    if (!equipment) {
      return res.status(404).json({ error: 'Equipment not found' });
    }

    const newQuantity = equipment.quantityAvailable + quantityChange;
    
    if (newQuantity < 0) {
      return res.status(400).json({ error: 'Insufficient quantity available' });
    }

    const result = await db.collection('equipment_inventory').updateOne(
      { _id: new ObjectId(id) },
      { 
        $set: { 
          quantityAvailable: newQuantity,
          updatedAt: new Date()
        } 
      }
    );

    // Log the quantity change
    await db.collection('equipment_quantity_logs').insertOne({
      equipmentId: id,
      equipmentName: equipment.name,
      quantityChange,
      reason: reason || 'Manual adjustment',
      previousQuantity: equipment.quantityAvailable,
      newQuantity,
      timestamp: new Date(),
      performedBy: req.user?.name || 'System'
    });

    const updatedEquipment = await db.collection('equipment_inventory').findOne({ _id: new ObjectId(id) });
    res.json(updatedEquipment);
  } catch (error) {
    console.error('Error adjusting equipment quantity:', error);
    res.status(500).json({ error: 'Failed to adjust equipment quantity' });
  }
});

module.exports = router;