const express = require('express');
const router = express.Router();
const { protect, authorize } = require('../middleware/auth');
const {
  getAllUsers,
  createUser,
  updateUser,
  deleteUser,
  toggleUserStatus,
  getSystemStats,
  getAllExams,
  bulkCreateUsers
} = require('../controllers/adminController');

// Protect all routes and authorize only admins
router.use(protect);
router.use(authorize('admin'));

// User management
router.route('/users')
  .get(getAllUsers)
  .post(createUser);

router.post('/users/bulk', bulkCreateUsers);

router.route('/users/:userId')
  .put(updateUser)
  .delete(deleteUser);

router.put('/users/:userId/toggle', toggleUserStatus);

// System statistics
router.get('/stats', getSystemStats);

// Exam management
router.get('/exams', getAllExams);

module.exports = router;