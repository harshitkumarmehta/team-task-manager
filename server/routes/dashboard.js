const express = require('express');
const router = express.Router();
const { authMiddleware, adminOnly } = require('../middleware/auth');
const { getDashboardStats, getAllUsers } = require('../controllers/dashboardController');

router.get('/stats', authMiddleware, getDashboardStats);
router.get('/users', authMiddleware, adminOnly, getAllUsers);

module.exports = router;
