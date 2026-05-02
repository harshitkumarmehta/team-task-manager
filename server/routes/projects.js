const express = require('express');
const router = express.Router();
const { authMiddleware, adminOnly } = require('../middleware/auth');
const {
  getAllProjects,
  createProject,
  updateProject,
  deleteProject,
  addMember,
  removeMember,
  getProjectMembers
} = require('../controllers/projectController');

router.get('/', authMiddleware, getAllProjects);
router.post('/', authMiddleware, adminOnly, createProject);
router.put('/:id', authMiddleware, adminOnly, updateProject);
router.delete('/:id', authMiddleware, adminOnly, deleteProject);

router.get('/:id/members', authMiddleware, getProjectMembers);
router.post('/:id/members', authMiddleware, adminOnly, addMember);
router.delete('/:id/members/:userId', authMiddleware, adminOnly, removeMember);

module.exports = router;
