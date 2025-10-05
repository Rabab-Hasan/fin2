const express = require('express');
const { v4: uuidv4 } = require('uuid');
const { getDb } = require('../database-mongo');

const router = express.Router();

// GET /api/clients - Get all clients
router.get('/', async (req, res) => {
  try {
    const db = await getDb();
    const clients = await db.collection('clients').find({}).sort({ name: 1 }).toArray();

    res.json({ clients });
  } catch (error) {
    console.error('Error fetching clients:', error);
    res.status(500).json({ error: 'Failed to fetch clients' });
  }
});

// GET /api/clients/:id - Get a specific client
router.get('/:id', async (req, res) => {
  try {
    const { id } = req.params;
    
    const db = await getDb();
    const client = await db.collection('clients').findOne({ id });

    if (!client) {
      return res.status(404).json({ error: 'Client not found' });
    }

    res.json({ client });
  } catch (error) {
    console.error('Error fetching client:', error);
    res.status(500).json({ error: 'Failed to fetch client' });
  }
});

// POST /api/clients - Create a new client
router.post('/', async (req, res) => {
  try {
    const { name, email, phone, company } = req.body;

    if (!name || name.trim() === '') {
      return res.status(400).json({ error: 'Client name is required' });
    }

    const clientId = uuidv4();
    const now = new Date();

    const newClient = {
      id: clientId,
      name: name.trim(),
      email: email ? email.trim() : null,
      phone: phone ? phone.trim() : null,
      company: company ? company.trim() : null,
      createdAt: now,
      updatedAt: now
    };

    const db = await getDb();
    await db.collection('clients').insertOne(newClient);

    res.status(201).json({ 
      message: 'Client created successfully', 
      client: newClient 
    });
  } catch (error) {
    console.error('Error creating client:', error);
    res.status(500).json({ error: 'Failed to create client' });
  }
});

// PUT /api/clients/:id - Update a client
router.put('/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const { name, email, phone, company } = req.body;

    if (!name || name.trim() === '') {
      return res.status(400).json({ error: 'Client name is required' });
    }

    const updateData = {
      name: name.trim(),
      email: email ? email.trim() : null,
      phone: phone ? phone.trim() : null,
      company: company ? company.trim() : null,
      updatedAt: new Date()
    };

    const db = await getDb();
    const result = await db.collection('clients').updateOne(
      { id },
      { $set: updateData }
    );

    if (result.matchedCount === 0) {
      return res.status(404).json({ error: 'Client not found' });
    }

    const updatedClient = await db.collection('clients').findOne({ id });

    res.json({ 
      message: 'Client updated successfully', 
      client: updatedClient 
    });
  } catch (error) {
    console.error('Error updating client:', error);
    res.status(500).json({ error: 'Failed to update client' });
  }
});

// DELETE /api/clients/:id - Delete a client
router.delete('/:id', async (req, res) => {
  try {
    const { id } = req.params;

    const db = await getDb();
    
    // Check if client has associated reports
    const reportsCount = await db.collection('reports').countDocuments({ clientId: id });
    
    if (reportsCount > 0) {
      return res.status(400).json({ 
        error: 'Cannot delete client with existing reports. Please delete reports first.' 
      });
    }

    const result = await db.collection('clients').deleteOne({ id });

    if (result.deletedCount === 0) {
      return res.status(404).json({ error: 'Client not found' });
    }

    res.json({ message: 'Client deleted successfully' });
  } catch (error) {
    console.error('Error deleting client:', error);
    res.status(500).json({ error: 'Failed to delete client' });
  }
});

// GET /api/clients/:id/reports - Get all reports for a specific client
router.get('/:id/reports', async (req, res) => {
  try {
    const { id } = req.params;
    
    const db = await getDb();
    
    // Check if client exists
    const client = await db.collection('clients').findOne({ id });
    if (!client) {
      return res.status(404).json({ error: 'Client not found' });
    }

    // Get reports for this client
    const reports = await db.collection('reports')
      .find({ clientId: id })
      .sort({ report_date: -1 })
      .toArray();

    res.json({ 
      client,
      reports 
    });
  } catch (error) {
    console.error('Error fetching client reports:', error);
    res.status(500).json({ error: 'Failed to fetch client reports' });
  }
});

module.exports = router;