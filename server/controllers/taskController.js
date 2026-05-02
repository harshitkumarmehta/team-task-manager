const db = require('../db/db');

async function getProjectTasks(req, res) {
  const { id } = req.params;
  const { status, assigned_to } = req.query;

  try {
    // members can only see tasks of projects they belong to
    if (req.user.role !== 'admin') {
      const check = await db.query(
        'SELECT id FROM project_members WHERE project_id = $1 AND user_id = $2',
        [id, req.user.id]
      );
      if (check.rows.length === 0) {
        return res.status(403).json({ error: 'Access denied' });
      }
    }

    let query = `
      SELECT t.*, u.name as assignee_name, u.email as assignee_email
      FROM tasks t
      LEFT JOIN users u ON t.assigned_to = u.id
      WHERE t.project_id = $1
    `;
    const params = [id];
    let idx = 2;

    if (status) {
      query += ` AND t.status = $${idx}`;
      params.push(status);
      idx++;
    }
    if (assigned_to) {
      query += ` AND t.assigned_to = $${idx}`;
      params.push(assigned_to);
      idx++;
    }

    query += ' ORDER BY t.due_date ASC, t.created_at DESC';

    const result = await db.query(query, params);
    res.json(result.rows);
  } catch (err) {
    console.error('Get tasks error:', err);
    res.status(500).json({ error: 'Server error' });
  }
}

async function createTask(req, res) {
  const { title, description, project_id, assigned_to, priority, due_date } = req.body;

  if (!title || !project_id || !assigned_to || !due_date) {
    return res.status(400).json({ error: 'Title, project, assignee and due date are required' });
  }

  try {
    const result = await db.query(
      `INSERT INTO tasks (title, description, project_id, assigned_to, created_by, priority, due_date)
       VALUES ($1, $2, $3, $4, $5, $6, $7) RETURNING *`,
      [title, description || null, project_id, assigned_to, req.user.id, priority || 'medium', due_date]
    );
    res.status(201).json(result.rows[0]);
  } catch (err) {
    console.error('Create task error:', err);
    res.status(500).json({ error: 'Server error' });
  }
}

async function updateTaskStatus(req, res) {
  const { id } = req.params;
  const { status } = req.body;

  const validStatuses = ['todo', 'inprogress', 'done'];
  if (!validStatuses.includes(status)) {
    return res.status(400).json({ error: 'Invalid status value' });
  }

  try {
    // members can only update tasks assigned to them
    if (req.user.role !== 'admin') {
      const check = await db.query(
        'SELECT id FROM tasks WHERE id = $1 AND assigned_to = $2',
        [id, req.user.id]
      );
      if (check.rows.length === 0) {
        return res.status(403).json({ error: 'You can only update your own tasks' });
      }
    }

    const result = await db.query(
      'UPDATE tasks SET status = $1 WHERE id = $2 RETURNING *',
      [status, id]
    );
    if (result.rows.length === 0) return res.status(404).json({ error: 'Task not found' });
    res.json(result.rows[0]);
  } catch (err) {
    console.error('Update task error:', err);
    res.status(500).json({ error: 'Server error' });
  }
}

async function deleteTask(req, res) {
  const { id } = req.params;
  try {
    await db.query('DELETE FROM tasks WHERE id = $1', [id]);
    res.json({ message: 'Task deleted' });
  } catch (err) {
    console.error('Delete task error:', err);
    res.status(500).json({ error: 'Server error' });
  }
}

async function getAllTasks(req, res) {
  const { status, overdue } = req.query;

  try {
    let query = `
      SELECT t.*, u.name as assignee_name, p.name as project_name
      FROM tasks t
      LEFT JOIN users u ON t.assigned_to = u.id
      LEFT JOIN projects p ON t.project_id = p.id
    `;
    const params = [];
    let idx = 1;
    const conditions = [];

    if (req.user.role !== 'admin') {
      conditions.push(`t.assigned_to = $${idx}`);
      params.push(req.user.id);
      idx++;
    }

    if (status) {
      conditions.push(`t.status = $${idx}`);
      params.push(status);
      idx++;
    }

    if (overdue === 'true') {
      conditions.push(`t.due_date < CURRENT_DATE AND t.status != 'done'`);
    }

    if (conditions.length > 0) {
      query += ' WHERE ' + conditions.join(' AND ');
    }

    query += ' ORDER BY t.due_date ASC';

    const result = await db.query(query, params);
    res.json(result.rows);
  } catch (err) {
    console.error('Get all tasks error:', err);
    res.status(500).json({ error: 'Server error' });
  }
}

module.exports = { getProjectTasks, createTask, updateTaskStatus, deleteTask, getAllTasks };
