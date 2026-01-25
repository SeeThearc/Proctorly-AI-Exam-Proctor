const auth = require('../middleware/auth');
console.log('AUTH MODULE:', auth);
const express = require('express');
const router = express.Router();
const { protect, authorize } = require('../middleware/auth');
console.log('authorize:', typeof authorize);
const {
  getStudents,
  createExam,
  getMyExams,
  getExam,
  updateExam,
  toggleExamStatus,
  getExamSessions,
  getSessionDetails,
  deleteExam
} = require('../controllers/facultyController');

// Protect all routes & authorize only faculty/admin
router.use(protect);
router.use(authorize('faculty', 'admin'));

// Student routes
router.get('/students', getStudents);

router.route('/exams')
  .get(getMyExams)
  .post(createExam);

router.route('/exams/:examId')
  .get(getExam)
  .put(updateExam)
  .delete(deleteExam);

router.put('/exams/:examId/toggle', toggleExamStatus);
router.get('/exams/:examId/sessions', getExamSessions);
router.get('/sessions/:sessionId', getSessionDetails);

module.exports = router;