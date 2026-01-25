const Exam = require('../models/Exam');
const ExamSession = require('../models/ExamSession');
const User = require('../models/User');
const Violation = require('../models/Violation');

// @desc    Get all students or search students
// @route   GET /api/faculty/students
// @access  Private (Faculty)
exports.getStudents = async (req, res, next) => {
  try {
    const { search } = req.query;

    let query = {
      role: 'student',
      isActive: true
    };

    // If search provided, add search criteria
    if (search && search.trim().length >= 2) {
      const searchRegex = new RegExp(search. trim(), 'i');
      query.$or = [
        { name: searchRegex },
        { email:  searchRegex },
        { studentId: searchRegex },
        { department: searchRegex }
      ];
    }

    const students = await User.find(query)
      .select('name email studentId department')
      .sort({ name: 1 })
      .limit(100);

    res.status(200).json({
      success: true,
      count: students.length,
      students
    });
  } catch (error) {
    console.error('Get students error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error while fetching students'
    });
  }
};

// @desc    Create new MCQ exam
// @route   POST /api/faculty/exams
// @access  Private (Faculty)
exports.createExam = async (req, res, next) => {
  try {
    const {
      title,
      description,
      course,
      duration,
      passingMarks,
      questions,
      scheduledDate,
      endDate,
      allowedStudents,
      proctoringSettings,
      settings
    } = req.body;

    console.log('📥 Received exam creation request');
    console.log('Title:', title);
    console.log('Questions count:', questions?. length);
    console.log('Passing marks:', passingMarks);

    // Validation
    if (!title || !course || !duration || !questions || !scheduledDate || !endDate || !allowedStudents) {
      return res.status(400).json({
        success: false,
        message: 'Please provide all required fields'
      });
    }

    if (! Array.isArray(questions) || questions.length === 0) {
      return res.status(400).json({
        success: false,
        message: 'At least one question is required'
      });
    }

    // Validate and normalize questions
    for (let i = 0; i < questions.length; i++) {
      const q = questions[i];
      
      if (!q.questionText || !q.options || q. options.length < 2) {
        return res.status(400).json({
          success: false,
          message: `Question ${i + 1}:  Invalid format.  Must have question text and at least 2 options`
        });
      }

      if (q.correctAnswer === undefined || q.correctAnswer < 0 || q.correctAnswer >= q.options.length) {
        return res.status(400).json({
          success: false,
          message: `Question ${i + 1}: Invalid correct answer index`
        });
      }

      // ✅ Ensure marks is a valid number
      if (! q.marks || isNaN(q.marks) || parseInt(q.marks) < 1) {
        questions[i]. marks = 1;
      } else {
        questions[i].marks = parseInt(q.marks);
      }
    }

    // Validate dates
    if (new Date(endDate) <= new Date(scheduledDate)) {
      return res.status(400).json({
        success: false,
        message: 'End date must be after scheduled date'
      });
    }

    // Validate students exist
    const students = await User. find({
      _id: { $in: allowedStudents },
      role: 'student',
      isActive: true
    });

    if (students.length !== allowedStudents.length) {
      return res.status(400).json({
        success: false,
        message: 'Some students are invalid or inactive'
      });
    }

    // ✅ Calculate total marks
    const totalMarks = questions.reduce((sum, q) => {
      const marks = parseInt(q.marks) || 1;
      return sum + marks;
    }, 0);

    console.log('📊 Calculated total marks:', totalMarks);

    // ✅ Validate total marks
    if (! totalMarks || totalMarks === 0) {
      return res.status(400).json({
        success: false,
        message: 'Total marks must be greater than 0'
      });
    }

    // ✅ Validate passing marks
    const passingMarksInt = parseInt(passingMarks);
    if (isNaN(passingMarksInt) || passingMarksInt < 0) {
      return res.status(400).json({
        success: false,
        message: 'Invalid passing marks'
      });
    }

    if (passingMarksInt > totalMarks) {
      return res.status(400).json({
        success: false,
        message: `Passing marks (${passingMarksInt}) cannot exceed total marks (${totalMarks})`
      });
    }

    // ✅ Create exam with totalMarks explicitly included
    const exam = await Exam.create({
      title: title. trim(),
      description: description?. trim() || '',
      course: course. trim(),
      duration: parseInt(duration),
      totalMarks: totalMarks, // ✅ CRITICAL: Include totalMarks
      passingMarks: passingMarksInt,
      questions:  questions,
      scheduledDate: new Date(scheduledDate),
      endDate: new Date(endDate),
      allowedStudents:  allowedStudents,
      proctoringSettings: proctoringSettings || {
        enableFaceDetection: true,
        enableMultipleFaceDetection: true,
        enableHeadMovement: true,
        enableTabSwitch: true,
        warningThreshold: 3
      },
      settings: settings || {
        shuffleQuestions: false,
        shuffleOptions: false,
        showResultsImmediately: true,
        negativeMarking: {
          enabled: false,
          deduction: 0.25
        }
      },
      createdBy: req. user. id
    });

    console.log('✅ Exam created successfully:', exam._id);

    res.status(201).json({
      success: true,
      message: 'Exam created successfully',
      exam
    });
  } catch (error) {
    console.error('❌ Create exam error:', error);
    console.error('Error message:', error.message);
    
    // Handle validation errors
    if (error.name === 'ValidationError') {
      const messages = Object.values(error.errors).map(err => err.message);
      return res.status(400).json({
        success: false,
        message: messages.join(', ')
      });
    }
    
    // Generic error response
    return res.status(500).json({
      success: false,
      message: error.message || 'Server error while creating exam'
    });
  }
};

// @desc    Get all exams created by faculty
// @route   GET /api/faculty/exams
// @access  Private (Faculty)
exports.getMyExams = async (req, res, next) => {
  try {
    console.log('📋 Fetching exams for faculty:', req.user.id);
    
    const exams = await Exam.find({ createdBy: req.user.id })
      .populate('allowedStudents', 'name email studentId')
      .sort({ createdAt: -1 })
      .lean(); // ✅ Add . lean() for better performance

    console.log('✅ Found exams:', exams.length);

    res.status(200).json({
      success: true,
      count: exams.length,
      exams
    });
  } catch (error) {
    console.error('❌ Get my exams error:', error);
    console.error('Error details:', error.message);
    console.error('Error stack:', error.stack);
    
    res.status(500).json({
      success: false,
      message: 'hey hello Server error while fetching exams',
      error: error.message // ✅ Send error details in development
    });
  }
};

// @desc    Get single exam with full details
// @route   GET /api/faculty/exams/:examId
// @access  Private (Faculty)
exports.getExam = async (req, res, next) => {
  try {
    const exam = await Exam. findById(req.params.examId)
      .populate('allowedStudents', 'name email studentId')
      .populate('createdBy', 'name email');

    if (!exam) {
      return res.status(404).json({
        success: false,
        message: 'Exam not found'
      });
    }

    // Check ownership
    if (exam.createdBy._id.toString() !== req.user.id && req.user.role !== 'admin') {
      return res.status(403).json({
        success: false,
        message: 'Not authorized to access this exam'
      });
    }

    res.status(200).json({
      success: true,
      exam
    });
  } catch (error) {
    console.error('Get exam error:', error);
    res.status(500).json({
      success: false,
      message:  'Server error while fetching exam'
    });
  }
};

// @desc    Update exam
// @route   PUT /api/faculty/exams/:examId
// @access  Private (Faculty)
exports.updateExam = async (req, res, next) => {
  try {
    const { examId } = req.params;
    const facultyId = req.user.id;

    console.log('📝 Updating exam:', examId);

    // Find exam and verify ownership
    const exam = await Exam.findById(examId);

    if (!exam) {
      return res.status(404).json({
        success: false,
        message: 'Exam not found'
      });
    }

    if (exam.createdBy. toString() !== facultyId) {
      return res.status(403).json({
        success: false,
        message: 'Not authorized to update this exam'
      });
    }

    // ✅ Validate dates manually
    const scheduledDate = new Date(req.body.scheduledDate);
    const endDate = new Date(req.body.endDate);

    if (endDate <= scheduledDate) {
      return res.status(400).json({
        success: false,
        message: 'End date must be after scheduled date'
      });
    }

    // ✅ Calculate total marks from questions
    const calculatedTotalMarks = req.body.questions.reduce((sum, q) => sum + Number(q.marks), 0);

    console.log('📊 Calculated total marks:', calculatedTotalMarks);
    console.log('📊 Passing marks:', req.body.passingMarks);

    // ✅ Validate passing marks manually
    if (Number(req.body.passingMarks) > calculatedTotalMarks) {
      return res. status(400).json({
        success: false,
        message:  `Passing marks (${req.body.passingMarks}) cannot exceed total marks (${calculatedTotalMarks})`
      });
    }

    // ✅ Update exam directly using assignment (bypasses some validators)
    exam.title = req.body.title;
    exam.description = req.body.description;
    exam.course = req.body.course;
    exam.duration = Number(req.body.duration);
    exam.totalMarks = calculatedTotalMarks;
    exam.passingMarks = Number(req.body.passingMarks);
    exam.scheduledDate = scheduledDate;
    exam.endDate = endDate;
    exam.isActive = req.body.isActive;
    exam.questions = req.body.questions;
    exam.allowedStudents = req.body.allowedStudents;
    exam.proctoringSettings = req.body.proctoringSettings;
    exam.settings = req.body.settings;

    // Save the exam
    const updatedExam = await exam.save();

    console.log('✅ Exam updated successfully');

    res.status(200).json({
      success: true,
      message: 'Exam updated successfully',
      exam: updatedExam
    });
  } catch (error) {
    console.error('❌ Update exam error:', error);
    
    // Better error handling
    if (error.name === 'ValidationError') {
      const messages = Object.values(error.errors).map(err => err.message);
      return res.status(400).json({
        success: false,
        message: 'Validation failed',
        errors: messages
      });
    }

    res.status(500).json({
      success: false,
      message: 'Server error while updating exam',
      error: error.message
    });
  }
};

// @desc    Activate/Deactivate exam
// @route   PUT /api/faculty/exams/:examId/toggle
// @access  Private (Faculty)
exports.toggleExamStatus = async (req, res, next) => {
  try {
    const exam = await Exam. findById(req.params.examId);

    if (!exam) {
      return res.status(404).json({
        success: false,
        message: 'Exam not found'
      });
    }

    // Check ownership
    if (exam.createdBy.toString() !== req.user.id && req.user.role !== 'admin') {
      return res.status(403).json({
        success: false,
        message: 'Not authorized'
      });
    }

    exam.isActive = !exam. isActive;
    await exam. save();

    res.status(200).json({
      success: true,
      message: `Exam ${exam.isActive ?  'activated' : 'deactivated'} successfully`,
      isActive: exam.isActive
    });
  } catch (error) {
    console.error('Toggle exam status error:', error);
    res.status(500).json({
      success: false,
      message:  'Server error while toggling exam status'
    });
  }
};

// @desc    Get all sessions for an exam
// @route   GET /api/faculty/exams/:examId/sessions
// @access  Private (Faculty)
exports.getExamSessions = async (req, res, next) => {
  try {
    const exam = await Exam.findById(req.params.examId);

    if (!exam) {
      return res.status(404).json({
        success: false,
        message: 'Exam not found'
      });
    }

    // Check ownership
    if (exam.createdBy. toString() !== req.user.id && req.user.role !== 'admin') {
      return res.status(403).json({
        success: false,
        message: 'Not authorized'
      });
    }

    const sessions = await ExamSession.find({ exam: req.params.examId })
      .populate('student', 'name email studentId')
      .populate('violations')
      .sort({ startTime: -1 });

    // Calculate statistics
    const stats = {
      totalSessions: sessions.length,
      completed: sessions.filter(s => s.status === 'completed').length,
      inProgress: sessions.filter(s => s.status === 'in-progress').length,
      autoSubmitted: sessions.filter(s => s.status === 'auto-submitted').length,
      averageScore: 0,
      passRate: 0
    };

    const completedSessions = sessions.filter(s => 
      s.status === 'completed' || s.status === 'auto-submitted'
    );

    if (completedSessions.length > 0) {
      stats.averageScore = completedSessions.reduce((sum, s) => sum + (s.score || 0), 0) / completedSessions.length;
      const passedCount = completedSessions.filter(s => s.result === 'pass').length;
      stats.passRate = (passedCount / completedSessions. length) * 100;
    }

    res.status(200).json({
      success: true,
      stats,
      sessions
    });
  } catch (error) {
    console.error('Get exam sessions error:', error);
    res.status(500).json({
      success: false,
      message:  'Server error while fetching exam sessions'
    });
  }
};

// @desc    Get detailed session report
// @route   GET /api/faculty/sessions/:sessionId
// @access  Private (Faculty)
exports.getSessionDetails = async (req, res, next) => {
  try {
    const session = await ExamSession.findById(req.params. sessionId)
      .populate('student', 'name email studentId')
      .populate('exam')
      .populate('violations');

    if (!session) {
      return res.status(404).json({
        success: false,
        message: 'Session not found'
      });
    }

    // Check ownership of exam
    if (session.exam.createdBy.toString() !== req.user.id && req. user.role !== 'admin') {
      return res.status(403).json({
        success: false,
        message: 'Not authorized'
      });
    }

    res.status(200).json({
      success: true,
      session
    });
  } catch (error) {
    console.error('Get session details error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error while fetching session details'
    });
  }
};

// @desc    Delete exam
// @route   DELETE /api/faculty/exams/:examId
// @access  Private (Faculty)
exports.deleteExam = async (req, res, next) => {
  try {
    const exam = await Exam.findById(req. params.examId);

    if (!exam) {
      return res.status(404).json({
        success: false,
        message: 'Exam not found'
      });
    }

    // Check ownership
    if (exam.createdBy.toString() !== req.user.id && req. user.role !== 'admin') {
      return res.status(403).json({
        success: false,
        message: 'Not authorized'
      });
    }

    // Check if sessions exist
    const sessions = await ExamSession.findOne({ exam: exam._id });
    if (sessions) {
      return res.status(400).json({
        success: false,
        message: 'Cannot delete exam with existing sessions.  Students have already attempted this exam.'
      });
    }

    await exam.deleteOne();

    res.status(200).json({
      success: true,
      message:  'Exam deleted successfully'
    });
  } catch (error) {
    console.error('Delete exam error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error while deleting exam'
    });
  }
};