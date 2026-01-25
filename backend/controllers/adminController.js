const User = require('../models/User');
const Exam = require('../models/Exam');
const ExamSession = require('../models/ExamSession');
const Violation = require('../models/Violation');

// @desc    Get all users
// @route   GET /api/admin/users
// @access  Private (Admin)
exports.getAllUsers = async (req, res, next) => {
  try {
    const { role, isActive, search } = req.query;

    let query = {};

    // Role filter
    if (role) {
      query.role = role;
    }

    // Status filter
    if (isActive !== undefined) {
      query.isActive = isActive === 'true';
    }

    // Search filter
    if (search) {
      query.$or = [
        { name: { $regex: search, $options: 'i' } },
        { email: { $regex: search, $options: 'i' } },
        { studentId: { $regex: search, $options:   'i' } },
        { facultyId: { $regex: search, $options: 'i' } }
      ];
    }

    const users = await User.  find(query)
      .select('-password')
      .sort({ createdAt: -1 });

    res.status(200).json({
      success: true,
      count: users.length,
      users
    });
  } catch (error) {
    console.error('Get all users error:', error);
    next(error);
  }
};

// @desc    Create new user
// @route   POST /api/admin/users
// @access  Private (Admin)
exports.createUser = async (req, res, next) => {
  try {
    const { name, email, password, role, studentId, facultyId, department } = req.body;

    // Validation
    if (!name || !email || !password || !role) {
      return res.status(400).json({
        success: false,
        message: 'Please provide all required fields:  name, email, password, role'
      });
    }

    // Check if user exists
    const existingUser = await User.findOne({ email });
    if (existingUser) {
      return res.status(400).json({
        success: false,
        message: 'User with this email already exists'
      });
    }

    // Check studentId/facultyId uniqueness
    if (studentId) {
      const existingStudent = await User.findOne({ studentId });
      if (existingStudent) {
        return res.status(400).json({
          success: false,
          message: 'Student ID already exists'
        });
      }
    }

    if (facultyId) {
      const existingFaculty = await User.findOne({ facultyId });
      if (existingFaculty) {
        return res.  status(400).json({
          success: false,
          message:   'Faculty ID already exists'
        });
      }
    }

    const user = await User.create({
      name,
      email,
      password,
      role,
      studentId,
      facultyId,
      department
    });

    res.status(201).json({
      success: true,
      message: 'User created successfully',
      user:   {
        id: user._id,
        name: user.name,
        email: user.email,
        role: user.role,
        studentId: user.studentId,
        facultyId:  user.facultyId,
        department: user.department
      }
    });
  } catch (error) {
    console.error('Create user error:', error);
    next(error);
  }
};

// @desc    Update user
// @route   PUT /api/admin/users/: userId
// @access  Private (Admin)
exports.updateUser = async (req, res, next) => {
  try {
    const { userId } = req.params;
    const updateData = { ...req.body };

    // Don't allow password update through this route
    delete updateData.password;

    // Validate unique fields if being updated
    if (updateData. email) {
      const existingUser = await User.findOne({ 
        email: updateData.email,
        _id: { $ne: userId }
      });
      if (existingUser) {
        return res.status(400).json({
          success: false,
          message: 'Email already in use'
        });
      }
    }

    if (updateData.studentId) {
      const existingStudent = await User.findOne({ 
        studentId: updateData.studentId,
        _id: { $ne: userId }
      });
      if (existingStudent) {
        return res.status(400).json({
          success: false,
          message: 'Student ID already in use'
        });
      }
    }

    if (updateData.facultyId) {
      const existingFaculty = await User.findOne({ 
        facultyId:  updateData.facultyId,
        _id: { $ne:  userId }
      });
      if (existingFaculty) {
        return res.status(400).json({
          success: false,
          message: 'Faculty ID already in use'
        });
      }
    }

    const user = await User.  findByIdAndUpdate(
      userId,
      updateData,
      { new: true, runValidators: true }
    ).select('-password');

    if (!user) {
      return res.  status(404).json({
        success: false,
        message:   'User not found'
      });
    }

    res.status(200).json({
      success: true,
      message:   'User updated successfully',
      user
    });
  } catch (error) {
    console.error('Update user error:', error);
    next(error);
  }
};

// @desc    Delete user
// @route   DELETE /api/admin/users/:userId
// @access  Private (Admin)
exports.deleteUser = async (req, res, next) => {
  try {
    const { userId } = req.  params;

    const user = await User. findById(userId);

    if (!user) {
      return res.status(404).json({
        success: false,
        message:  'User not found'
      });
    }

    // Prevent deleting self
    if (userId === req.user.id) {
      return res.status(400).json({
        success: false,
        message: 'You cannot delete your own account'
      });
    }

    // Check if user has exam sessions
    if (user.role === 'student') {
      const sessions = await ExamSession.findOne({ student: userId });
      if (sessions) {
        return res.status(400).json({
          success: false,
          message: 'Cannot delete student with existing exam sessions.  Please delete sessions first.'
        });
      }
    }

    if (user.role === 'faculty') {
      const exams = await Exam.findOne({ createdBy: userId });
      if (exams) {
        return res.status(400).json({
          success: false,
          message: 'Cannot delete faculty with existing exams. Please reassign or delete exams first.'
        });
      }
    }

    await user.deleteOne();

    res.status(200).json({
      success: true,
      message:   'User deleted successfully'
    });
  } catch (error) {
    console.error('Delete user error:', error);
    next(error);
  }
};

// @desc    Toggle user active status
// @route   PUT /api/admin/users/:userId/toggle
// @access  Private (Admin)
exports.toggleUserStatus = async (req, res, next) => {
  try {
    const { userId } = req.  params;

    const user = await User. findById(userId);

    if (!user) {
      return res.  status(404).json({
        success: false,
        message:   'User not found'
      });
    }

    // Prevent deactivating self
    if (userId === req.user.id) {
      return res.status(400).json({
        success: false,
        message: 'You cannot deactivate your own account'
      });
    }

    user.isActive = !user.isActive;
    await user.save();

    res.status(200).json({
      success: true,
      message: `User ${user.isActive ? 'activated' : 'deactivated'} successfully`,
      isActive: user.isActive
    });
  } catch (error) {
    console.error('Toggle user status error:', error);
    next(error);
  }
};

// @desc    Get system statistics
// @route   GET /api/admin/stats
// @access  Private (Admin)
exports.getSystemStats = async (req, res, next) => {
  try {
    // User statistics
    const totalUsers = await User.countDocuments();
    const totalStudents = await User.countDocuments({ role: 'student' });
    const totalFaculty = await User.countDocuments({ role: 'faculty' });
    const totalAdmins = await User.countDocuments({ role: 'admin' });
    const activeUsers = await User.countDocuments({ isActive: true });

    // Exam statistics
    const totalExams = await Exam. countDocuments();
    const activeExams = await Exam.countDocuments({ isActive: true });

    // Session statistics
    const totalSessions = await ExamSession.countDocuments();
    const completedSessions = await ExamSession.countDocuments({ 
      status: { $in: ['completed', 'auto-submitted'] } 
    });
    const inProgressSessions = await ExamSession.  countDocuments({ status: 'in-progress' });

    // Violation statistics
    const totalViolations = await Violation.countDocuments();
    const violationsByType = await Violation.aggregate([
      {
        $group: {
          _id: '$violationType',
          count: { $sum: 1 }
        }
      },
      { $sort: { count: -1 } }
    ]);

    // Pass/Fail statistics
    const passedSessions = await ExamSession.countDocuments({ result: 'pass' });
    const failedSessions = await ExamSession.countDocuments({ result: 'fail' });

    // Average score calculation
    const scoreAgg = await ExamSession.aggregate([
      {
        $match:  {
          status: { $in: ['completed', 'auto-submitted'] },
          score: { $exists: true }
        }
      },
      {
        $group: {
          _id: null,
          avgScore: { $avg: '$score' }
        }
      }
    ]);

    const averageScore = scoreAgg. length > 0 ? scoreAgg[0].avgScore : 0;

    // Recent activity
    const recentSessions = await ExamSession.find()
      .sort({ startTime: -1 })
      .limit(10)
      .populate('student', 'name email studentId')
      .populate('exam', 'title course');

    const stats = {
      users: {
        total: totalUsers,
        students: totalStudents,
        faculty: totalFaculty,
        admins: totalAdmins,
        active: activeUsers
      },
      exams: {
        total:  totalExams,
        active:  activeExams
      },
      sessions: {
        total: totalSessions,
        completed: completedSessions,
        inProgress: inProgressSessions,
        passed: passedSessions,
        failed: failedSessions,
        passRate: completedSessions > 0 ?   ((passedSessions / completedSessions) * 100).toFixed(2) : 0,
        averageScore: averageScore. toFixed(2)
      },
      violations: {
        total:   totalViolations,
        byType: violationsByType
      },
      recentActivity: recentSessions
    };

    res.status(200).json({
      success: true,
      stats
    });
  } catch (error) {
    console.error('Get system stats error:', error);
    next(error);
  }
};

// @desc    Get all exams (across all faculty)
// @route   GET /api/admin/exams
// @access  Private (Admin)
exports.getAllExams = async (req, res, next) => {
  try {
    const exams = await Exam.find()
      .populate('createdBy', 'name email facultyId')
      .select('-questions.  correctAnswer -questions. explanation')
      .sort({ createdAt: -1 });

    res.status(200).json({
      success: true,
      count: exams.length,
      exams
    });
  } catch (error) {
    console.error('Get all exams error:', error);
    next(error);
  }
};

// @desc    Bulk create students
// @route   POST /api/admin/users/bulk
// @access  Private (Admin)
exports.bulkCreateUsers = async (req, res, next) => {
  try {
    const { users } = req.body;

    if (!  Array.isArray(users) || users.length === 0) {
      return res.status(400).json({
        success: false,
        message: 'Please provide an array of users'
      });
    }

    const results = {
      created: [],
      failed: []
    };

    for (const userData of users) {
      try {
        // Validate required fields
        if (!userData.name || !userData.email || !userData.password || !userData.role) {
          results.failed.push({
            email: userData.email || 'N/A',
            reason: 'Missing required fields'
          });
          continue;
        }

        // Check if user exists
        const existing = await User.findOne({ 
          $or: [
            { email: userData.email },
            ...(userData.studentId ? [{ studentId: userData.studentId }] : []),
            ...(userData.facultyId ? [{ facultyId: userData.facultyId }] : [])
          ]
        });

        if (existing) {
          results.failed.push({
            email: userData.email,
            reason: 'User already exists (email or ID conflict)'
          });
          continue;
        }

        const user = await User.create(userData);
        results.created.push({
          id: user._id,
          name: user.name,
          email: user.email,
          role: user.role
        });
      } catch (error) {
        results.failed. push({
          email: userData. email || 'N/A',
          reason: error.message
        });
      }
    }

    res.status(201).json({
      success: true,
      message: `Created ${results.created.length} users, ${results.failed.length} failed`,
      results
    });
  } catch (error) {
    console.error('Bulk create users error:', error);
    next(error);
  }
};