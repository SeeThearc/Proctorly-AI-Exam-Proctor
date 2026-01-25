const ExamSession = require('../models/ExamSession');
const Violation = require('../models/Violation');
const Exam = require('../models/Exam');

// // Helper function to shuffle array
// const shuffleArray = (array) => {
//   const shuffled = [... array];
//   for (let i = shuffled.length - 1; i > 0; i--) {
//     const j = Math.floor(Math.random() * (i + 1));
//     [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
//   }
//   return shuffled;
// };

exports.startExamSession = async (req, res, next) => {
  try {
    const { examId } = req.params;
    const studentId = req.user.id;

    console.log('🚀 START EXAM SESSION');
    console.log('📝 Exam ID:', examId);
    console.log('👤 Student ID:', studentId);

    // Validate examId format
    if (!examId || ! examId.match(/^[0-9a-fA-F]{24}$/)) {
      console.log('❌ Invalid exam ID format');
      return res.status(400).json({
        success: false,
        message: 'Invalid exam ID format'
      });
    }

    // Check if exam exists and is active
    const exam = await Exam.findById(examId);
    
    console.log('📚 Exam found:', exam ?  'YES' : 'NO');
    
    if (!exam) {
      console.log('❌ Exam not found');
      return res.status(404).json({
        success: false,
        message: 'Exam not found'
      });
    }

    if (! exam.isActive) {
      console.log('❌ Exam is not active');
      return res.status(400).json({
        success: false,
        message: 'This exam is not active'
      });
    }

    console.log('✅ Exam is active');

    // Check if exam has started
    const now = new Date();
    const scheduled = new Date(exam.scheduledDate);
    const ended = new Date(exam.endDate);

    console.log('⏰ Time check:', {
      now: now.toISOString(),
      scheduled: scheduled.toISOString(),
      ended: ended.toISOString()
    });

    if (now < scheduled) {
      console.log('❌ Exam not started yet');
      return res.status(400).json({
        success: false,
        message: `Exam has not started yet.  Starts at ${scheduled.toLocaleString()}`
      });
    }

    if (now > ended) {
      console.log('❌ Exam has ended');
      return res.status(400).json({
        success: false,
        message: 'Exam has ended'
      });
    }

    console.log('✅ Exam timing is valid');

    // Check if student is allowed
    const isAllowed = exam.allowedStudents.some(id => id.toString() === studentId);
    
    console.log('👥 Student allowed:', isAllowed);
    
    if (!isAllowed) {
      console.log('❌ Student not authorized');
      return res.status(403).json({
        success: false,
        message: 'You are not authorized to attempt this exam'
      });
    }

    console.log('✅ Student is authorized');

    // ✅ FIX: Use findOne with better query and check all statuses
    const existingSession = await ExamSession.findOne({
      exam: examId,
      student:  studentId
    }).lean(); // Use lean() for better performance

    console.log('🔍 Existing session:', existingSession ? existingSession._id :  'NONE');

    if (existingSession) {
      console.log('📊 Session status:', existingSession.status);
      
      if (existingSession.status === 'in-progress') {
        console.log('✅ Resuming existing in-progress session');
        return res.status(200).json({
          success: true,
          message: 'Resuming existing session',
          session: existingSession
        });
      } else if (existingSession.status === 'completed' || existingSession.status === 'auto-submitted') {
        console.log('❌ Session already completed');
        return res.status(400).json({
          success: false,
          message: `You have already ${existingSession.status} this exam`,
          redirectTo: `/student/results/${existingSession._id}`
        });
      }
    }

    // Create question order (shuffled if enabled)
    let questionOrder = exam.questions.map((_, index) => index);
    if (exam.settings?. shuffleQuestions) {
      questionOrder = shuffleArray(questionOrder);
      console.log('🔀 Questions shuffled');
    }

    console.log('📝 Creating new session...');

    // ✅ FIX: Use findOneAndUpdate with upsert to prevent race conditions
    const session = await ExamSession.findOneAndUpdate(
      {
        exam: examId,
        student: studentId
      },
      {
        $setOnInsert: {
          exam: examId,
          student: studentId,
          questionOrder,
          totalQuestions: exam.questions.length,
          status: 'in-progress',
          startTime: new Date(),
          warningCount: 0,
          score: 0,
          result: 'pending',
          answers: [],
          violations: []
        }
      },
      {
        new: true,
        upsert: true,
        runValidators: true
      }
    );

    console.log('✅ Session created/found:', session._id);

    res.status(201).json({
      success: true,
      message: 'Exam session started successfully',
      session
    });
  } catch (error) {
    console.error('❌ START EXAM SESSION ERROR:', error);
    console.error('Error name:', error.name);
    console.error('Error message:', error. message);
    console.error('Error stack:', error.stack);
    
    // Handle specific error types
    if (error.name === 'CastError') {
      return res.status(400).json({
        success: false,
        message: 'Invalid exam ID format'
      });
    }

    if (error.name === 'ValidationError') {
      return res. status(400).json({
        success: false,
        message:  'Validation error:  ' + error.message
      });
    }

    if (error.code === 11000) {
      // ✅ If still duplicate, try to find and return existing session
      try {
        const existing = await ExamSession.findOne({
          exam: req.params.examId,
          student: req.user.id
        });
        
        if (existing) {
          console.log('✅ Returning existing session after duplicate error');
          return res.status(200).json({
            success: true,
            message: 'Resuming existing session',
            session: existing
          });
        }
      } catch (findError) {
        console.error('Error finding existing session:', findError);
      }
      
      return res.status(400).json({
        success: false,
        message: 'You have already started this exam'
      });
    }
    
    res.status(500).json({
      success: false,
      message: 'Server error while starting exam session',
      error: process.env.NODE_ENV === 'development' ? error.message :  undefined
    });
  }
};

// Helper function to shuffle array
function shuffleArray(array) {
  const shuffled = [...array];
  for (let i = shuffled.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
  }
  return shuffled;
}

// @desc    Get exam questions for session
// @route   GET /api/proctoring/session/:sessionId/questions
// @access  Private (Student)
exports.getExamQuestions = async (req, res, next) => {
  try {
    const { sessionId } = req.params;

    const session = await ExamSession.findById(sessionId).populate('exam');

    if (!session) {
      return res. status(404).json({
        success: false,
        message:  'Session not found'
      });
    }

    // Check ownership
    if (session.student.toString() !== req.user.id) {
      return res.status(403).json({
        success: false,
        message: 'Not authorized to access this session'
      });
    }

    if (session.status !== 'in-progress') {
      return res.status(400).json({
        success: false,
        message: `Session is ${session.status}. Cannot retrieve questions.`
      });
    }

    // Prepare questions without correct answers
    const questions = session. questionOrder.map((originalIndex, displayIndex) => {
      const question = session.exam.questions[originalIndex];
      
      let options = [... question.options];
      
      // Shuffle options if enabled (maintain correct answer tracking)
      if (session.exam.settings?.shuffleOptions) {
        const correctOption = options[question.correctAnswer];
        options = shuffleArray(options);
        const newCorrectIndex = options.indexOf(correctOption);
        
        return {
          _id: question._id,
          questionNumber: displayIndex + 1,
          questionText: question.questionText,
          options:  options,
          marks: question.marks,
          image: question.image,
          correctAnswerShuffled: newCorrectIndex // Don't send to frontend
        };
      }

      return {
        _id:  question._id,
        questionNumber: displayIndex + 1,
        questionText: question.questionText,
        options: options,
        marks: question.marks,
        image: question.image
      };
    });

    // Remove correctAnswerShuffled before sending
    const sanitizedQuestions = questions.map(q => {
      const { correctAnswerShuffled, ...rest } = q;
      return rest;
    });

    res.status(200).json({
      success: true,
      exam: {
        title: session.exam.title,
        duration: session.exam.duration,
        totalMarks: session.exam.totalMarks,
        totalQuestions: sanitizedQuestions.length,
        proctoringSettings: session.exam.proctoringSettings
      },
      questions: sanitizedQuestions,
      currentAnswers: session.answers
    });
  } catch (error) {
    console.error('Get exam questions error:', error);
    next(error);
  }
};

// @desc    Submit MCQ answer
// @route   POST /api/proctoring/answer/:sessionId
// @access  Private (Student)
exports.submitAnswer = async (req, res, next) => {
  try {
    const { sessionId } = req.params;
    const { questionId, selectedOption, timeSpent } = req.body;

    const session = await ExamSession.findById(sessionId);

    if (!session) {
      return res.status(404).json({
        success: false,
        message: 'Session not found'
      });
    }

    // Check ownership
    if (session.student.toString() !== req.user.id) {
      return res.status(403).json({
        success: false,
        message: 'Not authorized'
      });
    }

    if (session.status !== 'in-progress') {
      return res.status(400).json({
        success: false,
        message: 'Cannot submit answer.  Session is not active.'
      });
    }

    // Validate selectedOption
    if (selectedOption === undefined || selectedOption < 0) {
      return res.status(400).json({
        success: false,
        message: 'Invalid answer selection'
      });
    }

    // Check if answer already exists
    const existingAnswerIndex = session.answers.findIndex(
      a => a.questionId. toString() === questionId
    );

    const answerData = {
      questionId,
      selectedOption,
      timeSpent:  timeSpent || 0
    };

    if (existingAnswerIndex !== -1) {
      session.answers[existingAnswerIndex] = answerData;
    } else {
      session.answers.push(answerData);
    }

    await session.save();

    res.status(200).json({
      success: true,
      message: 'Answer saved successfully',
      answeredCount: session.answers.length,
      totalQuestions: session.totalQuestions
    });
  } catch (error) {
    console.error('Submit answer error:', error);
    next(error);
  }
};

// @desc    Auto-grade exam and submit
// @route   POST /api/proctoring/submit/:sessionId
// @access  Private (Student)
exports.submitExam = async (req, res, next) => {
  try {
    const { sessionId } = req.params;

    const session = await ExamSession.findById(sessionId).populate('exam');

    if (!session) {
      return res.status(404).json({
        success: false,
        message: 'Session not found'
      });
    }

    // Check ownership
    if (session.student.toString() !== req.user.id) {
      return res.status(403).json({
        success: false,
        message: 'Not authorized'
      });
    }

    if (session.status === 'completed' || session.status === 'auto-submitted') {
      return res.status(400).json({
        success: false,
        message: 'Exam already submitted'
      });
    }

    // AUTO-GRADING LOGIC
    let totalScore = 0;
    let correctCount = 0;
    let wrongCount = 0;
    
    const negativeMarking = session.exam.settings?.negativeMarking || { enabled: false, deduction: 0 };

    // Grade each answer
    session.answers = session.answers.map(answer => {
      const question = session.exam.questions.find(
        q => q._id. toString() === answer.questionId. toString()
      );

      if (!question) {
        return answer;
      }

      const isCorrect = answer.selectedOption === question.correctAnswer;
      let marksAwarded = 0;

      if (isCorrect) {
        marksAwarded = question.marks;
        correctCount++;
      } else {
        wrongCount++;
        if (negativeMarking.enabled) {
          marksAwarded = -negativeMarking.deduction;
        }
      }

      totalScore += marksAwarded;

      return {
        questionId: answer.questionId,
        selectedOption: answer.selectedOption,
        timeSpent: answer.timeSpent,
        isCorrect,
        marksAwarded
      };
    });

    const unansweredCount = session.totalQuestions - session.answers.length;
    const percentage = (totalScore / session.exam.totalMarks) * 100;
    const result = totalScore >= session.exam.passingMarks ? 'pass' : 'fail';

    // Update session
    session.status = session.status === 'in-progress' ? 'completed' : session.status;
    session.endTime = new Date();
    session.score = Math.max(0, totalScore); // Ensure score is not negative
    session.correctAnswers = correctCount;
    session.wrongAnswers = wrongCount;
    session.unansweredQuestions = unansweredCount;
    session.percentage = Math.max(0, percentage);
    session.result = result;
    session.gradedAt = new Date();
    session.canViewAnswers = session.exam.settings?.showResultsImmediately || false;

    await session.save();

    // Prepare response based on settings
    let response = {
      success: true,
      message: 'Exam submitted and graded successfully',
      session:  {
        _id: session._id,
        status: session.status,
        endTime: session.endTime,
        score: session.score,
        percentage: session.percentage. toFixed(2),
        result: session.result
      }
    };

    // Show results immediately if enabled
    if (session.exam.settings?.showResultsImmediately) {
      response.results = {
        score: session.score,
        totalMarks: session.exam.totalMarks,
        percentage: session.percentage.toFixed(2),
        result: session.result,
        correctAnswers: session. correctAnswers,
        wrongAnswers: session.wrongAnswers,
        unansweredQuestions: session.unansweredQuestions
      };
    }

    res.status(200).json(response);
  } catch (error) {
    console.error('Submit exam error:', error);
    next(error);
  }
};

// @desc    Log violation
// @route   POST /api/proctoring/violation/:sessionId
// @access  Private (Student)
exports.logViolation = async (req, res, next) => {
  try {
    const { sessionId } = req.params;
    const { violationType, snapshot, severity, metadata } = req.body;

    const session = await ExamSession. findById(sessionId).populate('exam');

    if (!session) {
      return res. status(404).json({
        success: false,
        message:  'Session not found'
      });
    }

    if (session.status !== 'in-progress') {
      return res.status(400).json({
        success: false,
        message: 'Session is not active'
      });
    }

    // Create violation
    const violation = await Violation.create({
      session: sessionId,
      violationType,
      snapshot,
      severity:  severity || 'medium',
      metadata: metadata || {}
    });

    // Update session
    session.violations. push(violation._id);
    session.warningCount += 1;

    // Check if threshold reached
    const threshold = session.exam.proctoringSettings?.warningThreshold || 3;
    let autoSubmitted = false;

    if (session.warningCount >= threshold) {
      // Auto-grade before submitting
      await autoGradeAndSubmit(session);
      autoSubmitted = true;
    } else {
      await session.save();
    }

    res.status(201).json({
      success: true,
      violation: {
        _id: violation._id,
        violationType:  violation.violationType,
        severity: violation.severity,
        timestamp: violation.timestamp
      },
      warningCount: session.warningCount,
      threshold,
      autoSubmitted
    });
  } catch (error) {
    console.error('Log violation error:', error);
    next(error);
  }
};

// Helper function for auto-grading and submission
async function autoGradeAndSubmit(session) {
  await session.populate('exam');
  
  let totalScore = 0;
  let correctCount = 0;
  let wrongCount = 0;
  
  const negativeMarking = session.exam.settings?.negativeMarking || { enabled: false, deduction:  0 };

  session.answers = session.answers.map(answer => {
    const question = session.exam.questions.find(
      q => q._id.toString() === answer.questionId.toString()
    );

    if (!question) return answer;

    const isCorrect = answer.selectedOption === question. correctAnswer;
    let marksAwarded = 0;

    if (isCorrect) {
      marksAwarded = question. marks;
      correctCount++;
    } else {
      wrongCount++;
      if (negativeMarking.enabled) {
        marksAwarded = -negativeMarking.deduction;
      }
    }

    totalScore += marksAwarded;

    return {
      questionId: answer. questionId,
      selectedOption:  answer.selectedOption,
      timeSpent: answer.timeSpent || 0,
      isCorrect,
      marksAwarded
    };
  });

  const unansweredCount = session. totalQuestions - session.answers. length;
  const percentage = (totalScore / session.exam.totalMarks) * 100;
  const result = totalScore >= session.exam.passingMarks ?  'pass' : 'fail';

  session.status = 'auto-submitted';
  session.endTime = new Date();
  session.score = Math.max(0, totalScore);
  session.correctAnswers = correctCount;
  session.wrongAnswers = wrongCount;
  session.unansweredQuestions = unansweredCount;
  session.percentage = Math.max(0, percentage);
  session.result = result;
  session.gradedAt = new Date();

  await session.save();
}

// @desc    Get session violations
// @route   GET /api/proctoring/violations/:sessionId
// @access  Private (Faculty/Student)
exports.getSessionViolations = async (req, res, next) => {
  try {
    const { sessionId } = req.params;

    const session = await ExamSession.findById(sessionId).populate('exam');
    
    if (!session) {
      return res.status(404).json({
        success: false,
        message: 'Session not found'
      });
    }

    // Check authorization
    const isStudent = session.student.toString() === req.user.id;
    const isFacultyOwner = session.exam.createdBy.toString() === req.user.id;
    const isAdmin = req.user.role === 'admin';

    if (!isStudent && !isFacultyOwner && !isAdmin) {
      return res.status(403).json({
        success: false,
        message: 'Not authorized to view violations'
      });
    }

    const violations = await Violation.find({ session: sessionId })
      .sort({ timestamp: 1 });

    res.status(200).json({
      success: true,
      count: violations.length,
      violations
    });
  } catch (error) {
    console.error('Get session violations error:', error);
    next(error);
  }
};

// @desc    Get exam results for student
// @route   GET /api/proctoring/results/:sessionId
// @access  Private (Student)
exports.getResults = async (req, res, next) => {
  try {
    const { sessionId } = req.params;

    const session = await ExamSession.findById(sessionId)
      .populate('exam', 'title totalMarks passingMarks settings questions')
      .populate('violations');

    if (!session) {
      return res.status(404).json({
        success: false,
        message: 'Session not found'
      });
    }

    // Check ownership
    if (session.student. toString() !== req.user.id) {
      return res.status(403).json({
        success: false,
        message: 'Not authorized'
      });
    }

    if (session.status === 'in-progress') {
      return res.status(400).json({
        success: false,
        message: 'Exam not yet completed'
      });
    }

    const results = {
      examTitle: session.exam.title,
      score: session.score,
      totalMarks: session.exam.totalMarks,
      percentage: session.percentage.toFixed(2),
      result: session. result,
      passingMarks: session.exam. passingMarks,
      correctAnswers: session.correctAnswers,
      wrongAnswers: session.wrongAnswers,
      unansweredQuestions: session. unansweredQuestions,
      totalQuestions: session.totalQuestions,
      warningCount: session.warningCount,
      violationCount: session.violations.length,
      startTime: session.startTime,
      endTime: session.endTime,
      timeTaken: Math.round((new Date(session.endTime) - new Date(session.startTime)) / 60000)
    };

    // Include detailed answers if allowed
    if (session.canViewAnswers) {
      results.answers = session.answers. map(answer => {
        const question = session.exam.questions.find(
          q => q._id.toString() === answer.questionId.toString()
        );

        if (!question) {
          return {
            questionText: 'Question not found',
            selectedAnswer: 'N/A',
            correctAnswer: 'N/A',
            isCorrect: false,
            marksAwarded: 0
          };
        }

        return {
          questionText: question.questionText,
          selectedOption: answer.selectedOption,
          selectedAnswer: question.options[answer.selectedOption],
          correctAnswer: question.options[question.correctAnswer],
          isCorrect: answer.isCorrect,
          marksAwarded: answer.marksAwarded,
          explanation: question.explanation
        };
      });
    }

    res.status(200).json({
      success: true,
      results
    });
  } catch (error) {
    console.error('Get results error:', error);
    next(error);
  }
};