const express = require('express');
const router = express.Router();
const { protect, authorize } = require('../middleware/auth');
const {
  getAvailableExams,
  getExamDetails,
  getExamHistory
} = require('../controllers/studentController');

// Protect all routes & authorize only students
router.use(protect);
router.use(authorize('student'));

router.get('/exams', getAvailableExams);
router.get('/exams/:examId', getExamDetails);
router.get('/history', getExamHistory);

module.exports = router;