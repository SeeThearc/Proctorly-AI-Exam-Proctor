const express = require('express');
const router = express.Router();
const { protect } = require('../middleware/auth');
const {
  register,
  login,
  getMe,
  updateFaceDescriptor,
  logout
} = require('../controllers/authController');

// Public routes
router.post('/register', register);
router.post('/login', login);

// Protected routes
router.get('/me', protect, getMe);
router.put('/face-descriptor', protect, updateFaceDescriptor);
router.post('/logout', protect, logout);

module.exports = router;