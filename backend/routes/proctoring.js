const express = require('express');
const router = express.Router();
const { protect, authorize } = require('../middleware/auth');
const {
  startExamSession,
  getExamQuestions,
  logViolation,
  submitAnswer,
  submitExam,
  getSessionViolations,
  getResults
} = require('../controllers/proctoringController');

router.use(protect);

// Student routes
router.post('/start/:examId', authorize('student'), startExamSession);
router.get('/session/:sessionId/questions', authorize('student'), getExamQuestions);
router.post('/answer/:sessionId', authorize('student'), submitAnswer);
router.post('/submit/:sessionId', authorize('student'), submitExam);
router.post('/violation/:sessionId', authorize('student'), logViolation);
router.get('/results/:sessionId', authorize('student'), getResults);

// Faculty/Admin routes
router.get('/violations/:sessionId', getSessionViolations);

module.exports = router;