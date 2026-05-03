const db = require('../db/db');

async function getDashboardStats(req, res) {
  try {
    let stats = {};

    if (req.user.role === 'admin') {
      const taskStats = await db.query(`
        SELECT
          COUNT(*)::int as total,
          COALESCE(SUM(CASE WHEN status = 'todo' THEN 1 ELSE 0 END), 0)::int as todo,
          COALESCE(SUM(CASE WHEN status = 'inprogress' THEN 1 ELSE 0 END), 0)::int as inprogress,
          COALESCE(SUM(CASE WHEN status = 'done' THEN 1 ELSE 0 END), 0)::int as done,
          COALESCE(SUM(CASE WHEN due_date != '' AND due_date::date < CURRENT_DATE AND status != 'done' THEN 1 ELSE 0 END), 0)::int as overdue
        FROM tasks
      `);

      const projectCount = await db.query('SELECT COUNT(*)::int as total FROM projects');
      const memberCount = await db.query("SELECT COUNT(*)::int as total FROM users WHERE role = 'member'");

      stats = {
        ...taskStats.rows[0],
        total_projects: projectCount.rows[0].total,
        total_members: memberCount.rows[0].total
      };
    } else {
      // member only sees their own assigned tasks
      const taskStats = await db.query(`
        SELECT
          COUNT(*)::int as total,
          COALESCE(SUM(CASE WHEN status = 'todo' THEN 1 ELSE 0 END), 0)::int as todo,
          COALESCE(SUM(CASE WHEN status = 'inprogress' THEN 1 ELSE 0 END), 0)::int as inprogress,
          COALESCE(SUM(CASE WHEN status = 'done' THEN 1 ELSE 0 END), 0)::int as done,
          COALESCE(SUM(CASE WHEN due_date != '' AND due_date::date < CURRENT_DATE AND status != 'done' THEN 1 ELSE 0 END), 0)::int as overdue
        FROM tasks
        WHERE assigned_to = $1
      `, [req.user.id]);

      const projectCount = await db.query(`
        SELECT COUNT(DISTINCT project_id)::int as total
        FROM project_members
        WHERE user_id = $1
      `, [req.user.id]);

      stats = {
        ...taskStats.rows[0],
        total_projects: projectCount.rows[0].total
      };
    }

    res.json(stats);
  } catch (err) {
    console.error('Dashboard stats error:', err);
    res.status(500).json({ error: 'Server error' });
  }
}

async function getAllUsers(req, res) {
  try {
    const result = await db.query(
      'SELECT id, name, email, role, created_at FROM users ORDER BY name ASC'
    );
    res.json(result.rows);
  } catch (err) {
    console.error('Get users error:', err);
    res.status(500).json({ error: 'Server error' });
  }
}

module.exports = { getDashboardStats, getAllUsers };
