const express = require('express');
const router = express.Router();
const { authMiddleware, adminOnly } = require('../middleware/auth');
const { getProjectTasks, createTask, updateTaskStatus, deleteTask, getAllTasks } = require('../controllers/taskController');

// tasks are under projects
router.get('/', authMiddleware, getAllTasks);
router.get('/project/:id', authMiddleware, getProjectTasks);
router.post('/', authMiddleware, adminOnly, createTask);
router.patch('/:id/status', authMiddleware, updateTaskStatus);
router.delete('/:id', authMiddleware, adminOnly, deleteTask);

module.exports = router;
