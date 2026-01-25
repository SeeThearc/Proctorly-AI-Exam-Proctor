const Exam = require('../models/Exam');
const ExamSession = require('../models/ExamSession');
const User = require('../models/User');

// @desc    Get available exams for student
// @route   GET /api/student/exams
// @access  Private (Student)
exports.getAvailableExams = async (req, res, next) => {
  try {
    const studentId = req.user.id;

    console.log('📋 Fetching exams for student:', studentId);

    // Find exams where student is in allowedStudents and exam is active
    const exams = await Exam.find({
      allowedStudents: studentId,
      isActive: true
    })
      .populate('createdBy', 'name email')
      .sort({ scheduledDate: 1 })
      .lean();

    console.log('✅ Found exams:', exams.length);

    // Check exam status and student's attempt for each exam
    const examsWithStatus = await Promise.all(
      exams.map(async (exam) => {
        const now = new Date();
        const scheduled = new Date(exam.scheduledDate);
        const ended = new Date(exam.endDate);

        let status = 'upcoming';
        if (now >= scheduled && now <= ended) {
          status = 'ongoing';
        } else if (now > ended) {
          status = 'ended';
        }

        // Check if student has attempted
        const session = await ExamSession.findOne({
          exam: exam._id,
          student: studentId
        });

        return {
          _id: exam._id,
          title: exam. title,
          description: exam. description,
          course: exam. course,
          duration: exam. duration,
          totalMarks:  exam.totalMarks,
          passingMarks: exam.passingMarks,
          scheduledDate: exam.scheduledDate,
          endDate: exam.endDate,
          totalQuestions:  exam.questions?. length || 0,
          proctoringSettings: exam.proctoringSettings,
          createdBy: exam.createdBy,
          status,
          attempted: !!session,
          sessionStatus: session?. status,
          sessionId: session?._id,
          score: session?.score
        };
      })
    );

    res.status(200).json({
      success: true,
      count:  examsWithStatus.length,
      exams: examsWithStatus
    });
  } catch (error) {
    console.error('❌ Get available exams error:', error);
    console.error('Error details:', error.message);
    res.status(500).json({
      success: false,
      message: 'Server error while fetching exams',
      error: error.message
    });
  }
};

// @desc    Get exam details for student
// @route   GET /api/student/exams/:examId
// @access  Private (Student)
exports.getExamDetails = async (req, res, next) => {
  try {
    const { examId } = req.params;
    const studentId = req.user.id;

    console.log('📄 Fetching exam details:', examId, 'for student:', studentId);

    const exam = await Exam.findById(examId)
      .populate('createdBy', 'name email')
      .lean();

    if (!exam) {
      return res.status(404).json({
        success: false,
        message: 'Exam not found'
      });
    }

    // Check if student is allowed
    const isAllowed = exam.allowedStudents. some(
      id => id. toString() === studentId
    );

    if (!isAllowed) {
      return res.status(403).json({
        success: false,
        message: 'You are not authorized to access this exam'
      });
    }

    // Check exam status
    const now = new Date();
    const scheduled = new Date(exam.scheduledDate);
    const ended = new Date(exam.endDate);

    let status = 'upcoming';
    if (now >= scheduled && now <= ended) {
      status = 'ongoing';
    } else if (now > ended) {
      status = 'ended';
    }

    // Check if student has already attempted
    const existingSession = await ExamSession. findOne({
      exam: examId,
      student: studentId
    });

    res.status(200).json({
      success: true,
      exam:  {
        _id: exam._id,
        title: exam. title,
        description: exam. description,
        course: exam. course,
        duration: exam. duration,
        totalMarks:  exam.totalMarks,
        passingMarks: exam.passingMarks,
        scheduledDate: exam.scheduledDate,
        endDate: exam.endDate,
        totalQuestions:  exam.questions?.length || 0,
        proctoringSettings:  exam.proctoringSettings,
        settings: exam.settings,
        createdBy: exam.createdBy,
        status,
        attempted: !!existingSession,
        sessionStatus: existingSession?. status,
        sessionId: existingSession?._id
      }
    });
  } catch (error) {
    console.error('❌ Get exam details error:', error);
    console.error('Error details:', error. message);
    res.status(500).json({
      success: false,
      message: 'Server error while fetching exam details',
      error: error.message
    });
  }
};

// @desc    Get student's exam history
// @route   GET /api/student/history
// @access  Private (Student)
exports.getExamHistory = async (req, res, next) => {
  try {
    const studentId = req.user.id;

    console.log('📚 Fetching exam history for student:', studentId);

    const sessions = await ExamSession.find({
      student: studentId
    })
      .populate('exam', 'title course totalMarks passingMarks')
      .sort({ startTime: -1 })
      .lean();

    console.log('✅ Found sessions:', sessions.length);

    const history = sessions. map(session => ({
      sessionId: session._id,
      examTitle: session.exam?.title || 'Deleted Exam',
      course: session.exam?. course || 'N/A',
      status: session.status,
      score: session.score,
      totalMarks: session. exam?.totalMarks || 0,
      percentage: session.percentage,
      result: session.result,
      startTime: session. startTime,
      endTime:  session.endTime,
      warningCount: session.warningCount,
      violationCount: session.violations?. length || 0
    }));

    res.status(200).json({
      success: true,
      count: history.length,
      history
    });
  } catch (error) {
    console.error('❌ Get exam history error:', error);
    console.error('Error details:', error.message);
    res.status(500).json({
      success: false,
      message: 'Server error while fetching exam history',
      error: error.message
    });
  }
};