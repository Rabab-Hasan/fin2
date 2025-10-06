const express = require('express');
const { v4: uuidv4 } = require('uuid');
const db = require('../database-sqlite');

const router = express.Router();

// Helper function to build task tree (main tasks with their subtasks)
function buildTaskTree(tasks) {
  const taskMap = new Map();
  const rootTasks = [];

  // First pass: create all task objects and map them
  tasks.forEach(task => {
    const taskObj = {
      id: task.id,
      title: task.title,
      description: task.description,
      status: task.status,
      assignee: task.assignee,
      deadline: task.deadline,
      clientComments: task.client_comments,
      actionLabsComments: task.action_labs_comments,
      link: task.link,
      parentId: task.parent_id,
      clientId: task.client_id,
      visibleToClient: task.visible_to_client === 1,
      subtasks: [],
      createdAt: task.created_at,
      updatedAt: task.updated_at
    };
    taskMap.set(task.id, taskObj);
  });

  // Second pass: build the tree structure
  tasks.forEach(task => {
    const taskObj = taskMap.get(task.id);
    if (task.parent_id) {
      // It's a subtask, add to parent's subtasks array
      const parent = taskMap.get(task.parent_id);
      if (parent) {
        parent.subtasks.push(taskObj);
      }
    } else {
      // It's a main task, add to root
      rootTasks.push(taskObj);
    }
  });

  return rootTasks;
}

// GET /api/tasks - Get all tasks with optional filtering
router.get('/', async (req, res) => {
  try {
    const { status, assignee, search, clientId, userType } = req.query;
    let query = 'SELECT * FROM tasks';
    const conditions = [];
    const params = [];

    // Always filter by client_id
    if (clientId) {
      conditions.push('client_id = ?');
      params.push(clientId);
    } else {
      return res.status(400).json({ error: 'Client ID is required' });
    }

    // Filter by visibility for client users
    if (userType === 'client') {
      conditions.push('visible_to_client = 1');
    }

    if (status) {
      conditions.push('status = ?');
      params.push(status);
    }

    if (assignee) {
      conditions.push('assignee LIKE ?');
      params.push(`%${assignee}%`);
    }

    if (search) {
      conditions.push('(title LIKE ? OR description LIKE ?)');
      params.push(`%${search}%`, `%${search}%`);
    }

    if (conditions.length > 0) {
      query += ' WHERE ' + conditions.join(' AND ');
    }

    query += ' ORDER BY created_at DESC';

    const pool = await db.connect();
    const result = await pool.query(query, params);
    pool.release();

    // Build task tree structure
    const taskTree = buildTaskTree(result.rows);

    res.json({ tasks: taskTree });
  } catch (error) {
    console.error('Error fetching tasks:', error);
    res.status(500).json({ error: 'Failed to fetch tasks' });
  }
});

// GET /api/tasks/:id - Get a specific task
router.get('/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const { clientId } = req.query;
    
    if (!clientId) {
      return res.status(400).json({ error: 'Client ID is required' });
    }

    const pool = await db.connect();
    const result = await pool.query('SELECT * FROM tasks WHERE id = ? AND client_id = ?', [id, clientId]);
    pool.release();

    if (!result.rows || result.rows.length === 0) {
      return res.status(404).json({ error: 'Task not found' });
    }

    const task = result.rows[0];

    // Convert database format to API format
    const taskObj = {
      id: task.id,
      title: task.title,
      description: task.description,
      status: task.status,
      assignee: task.assignee,
      deadline: task.deadline,
      clientComments: task.client_comments,
      actionLabsComments: task.action_labs_comments,
      link: task.link,
      parentId: task.parent_id,
      clientId: task.client_id,
      visibleToClient: task.visible_to_client === 1,
      createdAt: task.created_at,
      updatedAt: task.updated_at
    };

    res.json({ task: taskObj });
  } catch (error) {
    console.error('Error fetching task:', error);
    res.status(500).json({ error: 'Failed to fetch task' });
  }
});

// POST /api/tasks - Create a new task
router.post('/', async (req, res) => {
  try {
    const {
      title,
      description,
      status = 'todo',
      assignee,
      deadline,
      clientComments,
      actionLabsComments,
      link,
      parentId,
      clientId,
      visibleToClient = true
    } = req.body;

    if (!title || title.trim() === '') {
      return res.status(400).json({ error: 'Task title is required' });
    }

    if (!clientId) {
      return res.status(400).json({ error: 'Client ID is required' });
    }

    // Validate status
    const validStatuses = ['todo', 'in-progress', 'pending', 'completed'];
    if (!validStatuses.includes(status)) {
      return res.status(400).json({ error: 'Invalid status' });
    }

    // If parentId is provided, verify the parent task exists and belongs to the same client
    if (parentId) {
      const pool = await db.connect();
      const result = await pool.query('SELECT id FROM tasks WHERE id = ? AND client_id = ?', [parentId, clientId]);
      if (!result.rows || result.rows.length === 0) {
        pool.release();
        return res.status(400).json({ error: 'Parent task not found or belongs to different client' });
      }
      pool.release();
    }

    const taskId = uuidv4();
    const now = new Date().toISOString();

    const pool = await db.connect();
    await pool.query(
      `INSERT INTO tasks (
        id, title, description, status, assignee, deadline, 
        client_comments, action_labs_comments, link, parent_id, client_id,
        visible_to_client, created_at, updated_at
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [
        taskId,
        title.trim(),
        description?.trim() || null,
        status,
        assignee?.trim() || null,
        deadline || null,
        clientComments?.trim() || null,
        actionLabsComments?.trim() || null,
        link?.trim() || null,
        parentId || null,
        clientId,
        visibleToClient ? 1 : 0,
        now,
        now
      ]
    );

    // Fetch the created task
    const result = await pool.query('SELECT * FROM tasks WHERE id = ?', [taskId]);
    pool.release();

    if (!result.rows || result.rows.length === 0) {
      return res.status(500).json({ error: 'Failed to create task' });
    }

    const newTask = result.rows[0];

    // Convert to API format
    const taskObj = {
      id: newTask.id,
      title: newTask.title,
      description: newTask.description,
      status: newTask.status,
      assignee: newTask.assignee,
      deadline: newTask.deadline,
      clientComments: newTask.client_comments,
      actionLabsComments: newTask.action_labs_comments,
      link: newTask.link,
      parentId: newTask.parent_id,
      clientId: newTask.client_id,
      visibleToClient: newTask.visible_to_client === 1,
      subtasks: [],
      createdAt: newTask.created_at,
      updatedAt: newTask.updated_at
    };

    res.status(201).json({ task: taskObj });
  } catch (error) {
    console.error('Error creating task:', error);
    res.status(500).json({ error: 'Failed to create task' });
  }
});

// PUT /api/tasks/:id - Update a task
router.put('/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const {
      title,
      description,
      status,
      assignee,
      deadline,
      clientComments,
      actionLabsComments,
      link,
      clientId,
      visibleToClient
    } = req.body;

    if (!clientId) {
      return res.status(400).json({ error: 'Client ID is required' });
    }

    // Validate status if provided
    if (status) {
      const validStatuses = ['todo', 'in-progress', 'pending', 'completed'];
      if (!validStatuses.includes(status)) {
        return res.status(400).json({ error: 'Invalid status' });
      }
    }

    const pool = await db.connect();
    
    // Check if task exists and belongs to client
    const existingResult = await pool.query('SELECT * FROM tasks WHERE id = ? AND client_id = ?', [id, clientId]);
    if (!existingResult.rows || existingResult.rows.length === 0) {
      pool.release();
      return res.status(404).json({ error: 'Task not found' });
    }

    // Update the task
    await pool.query(
      `UPDATE tasks SET 
        title = COALESCE(?, title),
        description = COALESCE(?, description),
        status = COALESCE(?, status),
        assignee = COALESCE(?, assignee),
        deadline = COALESCE(?, deadline),
        client_comments = COALESCE(?, client_comments),
        action_labs_comments = COALESCE(?, action_labs_comments),
        link = COALESCE(?, link),
        visible_to_client = COALESCE(?, visible_to_client),
        updated_at = datetime('now')
      WHERE id = ?`,
      [
        title?.trim() || null,
        description?.trim() || null,
        status || null,
        assignee?.trim() || null,
        deadline || null,
        clientComments?.trim() || null,
        actionLabsComments?.trim() || null,
        link?.trim() || null,
        visibleToClient !== undefined ? (visibleToClient ? 1 : 0) : null,
        id
      ]
    );

    // Fetch the updated task
    const updatedResult = await pool.query('SELECT * FROM tasks WHERE id = ?', [id]);
    pool.release();

    if (!updatedResult.rows || updatedResult.rows.length === 0) {
      return res.status(500).json({ error: 'Failed to update task' });
    }

    const updatedTask = updatedResult.rows[0];

    // Convert to API format
    const taskObj = {
      id: updatedTask.id,
      title: updatedTask.title,
      description: updatedTask.description,
      status: updatedTask.status,
      assignee: updatedTask.assignee,
      deadline: updatedTask.deadline,
      clientComments: updatedTask.client_comments,
      actionLabsComments: updatedTask.action_labs_comments,
      link: updatedTask.link,
      parentId: updatedTask.parent_id,
      clientId: updatedTask.client_id,
      visibleToClient: updatedTask.visible_to_client === 1,
      createdAt: updatedTask.created_at,
      updatedAt: updatedTask.updated_at
    };

    res.json({ task: taskObj });
  } catch (error) {
    console.error('Error updating task:', error);
    res.status(500).json({ error: 'Failed to update task' });
  }
});

// DELETE /api/tasks/:id - Delete a task (and all its subtasks)
router.delete('/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const { clientId } = req.query;

    if (!clientId) {
      return res.status(400).json({ error: 'Client ID is required' });
    }

    const pool = await db.connect();
    
    // Check if task exists and belongs to client
    const existingResult = await pool.query('SELECT * FROM tasks WHERE id = ? AND client_id = ?', [id, clientId]);
    if (!existingResult.rows || existingResult.rows.length === 0) {
      pool.release();
      return res.status(404).json({ error: 'Task not found' });
    }

    // Delete the task (CASCADE will handle subtasks)
    const result = await pool.query('DELETE FROM tasks WHERE id = ? AND client_id = ?', [id, clientId]);
    pool.release();

    if (result.changes === 0) {
      return res.status(404).json({ error: 'Task not found' });
    }

    res.json({ message: 'Task deleted successfully' });
  } catch (error) {
    console.error('Error deleting task:', error);
    res.status(500).json({ error: 'Failed to delete task' });
  }
});

// GET /api/tasks/stats - Get task statistics
router.get('/stats', async (req, res) => {
  try {
    const { clientId } = req.query;

    if (!clientId) {
      return res.status(400).json({ error: 'Client ID is required' });
    }

    const pool = await db.connect();
    
    const statsResult = await pool.query(`
      SELECT 
        status,
        COUNT(*) as count
      FROM tasks 
      WHERE parent_id IS NULL AND client_id = ?
      GROUP BY status
    `, [clientId]);

    const totalResult = await pool.query(`
      SELECT COUNT(*) as total 
      FROM tasks 
      WHERE parent_id IS NULL AND client_id = ?
    `, [clientId]);

    const overdueResult = await pool.query(`
      SELECT COUNT(*) as overdue
      FROM tasks 
      WHERE deadline < date('now') 
      AND status != 'completed'
      AND parent_id IS NULL
      AND client_id = ?
    `, [clientId]);

    pool.release();

    // Format statistics
    const statusCounts = {
      todo: 0,
      'in-progress': 0,
      pending: 0,
      completed: 0
    };

    if (statsResult.rows) {
      statsResult.rows.forEach(stat => {
        statusCounts[stat.status] = stat.count;
      });
    }

    res.json({
      statusCounts,
      totalTasks: totalResult.rows?.[0]?.total || 0,
      overdueTasks: overdueResult.rows?.[0]?.overdue || 0
    });
  } catch (error) {
    console.error('Error fetching task stats:', error);
    res.status(500).json({ error: 'Failed to fetch task statistics' });
  }
});

module.exports = router;