const jwt = require('jsonwebtoken');
const User = require('../models/User');
const ExamSession = require('../models/ExamSession');

module.exports = (io) => {
  // Socket authentication middleware
  io.use(async (socket, next) => {
    try {
      const token = socket.handshake.auth.token;
      
      if (!token) {
        return next(new Error('Authentication error:  No token provided'));
      }

      // Verify token
      const decoded = jwt.verify(token, process.  env.JWT_SECRET);
      
      // Get user
      const user = await User.findById(decoded.id).select('-password');
      
      if (!user) {
        return next(new Error('Authentication error: User not found'));
      }

      if (!  user.isActive) {
        return next(new Error('Authentication error:  User account is deactivated'));
      }

      // Attach user to socket
      socket.  user = user;
      next();
    } catch (error) {
      console.error('Socket authentication error:', error);
      if (error.name === 'TokenExpiredError') {
        next(new Error('Authentication error: Token expired'));
      } else if (error.name === 'JsonWebTokenError') {
        next(new Error('Authentication error: Invalid token'));
      } else {
        next(new Error('Authentication error'));
      }
    }
  });

  io.on('connection', (socket) => {
    console.log(`✅ User connected: ${socket. user.name} (${socket.user.role}) - Socket ID: ${socket.id}`);

    // Join session room (for students)
    socket.on('join-session', async (sessionId) => {
      try {
        const session = await ExamSession.findById(sessionId);
        
        if (!session) {
          socket.emit('error', { message: 'Session not found' });
          return;
        }

        // Verify user owns this session
        if (session.  student. toString() !== socket.user.id) {
          socket.emit('error', { message: 'Unauthorized access to session' });
          return;
        }

        socket.join(`session-${sessionId}`);
        console.log(`📝 Student ${socket.user.name} joined session:  ${sessionId}`);
        
        socket.emit('session-joined', { 
          sessionId,
          message: 'Successfully joined exam session'
        });

        // Notify monitoring faculty
        socket.to(`monitor-${session.exam}`).emit('student-joined', {
          sessionId,
          studentName: socket.user.name,
          studentId: socket.user.studentId,
          timestamp: new Date()
        });

      } catch (error) {
        console.error('Error joining session:', error);
        socket.emit('error', { message: 'Failed to join session' });
      }
    });

    // Join monitoring room (for faculty)
    socket.on('join-monitor', async (examId) => {
      try {
        // Only faculty and admin can monitor
        if (socket. user.  role !== 'faculty' && socket.user. role !== 'admin') {
          socket.emit('error', { message: 'Unauthorized:   Only faculty can monitor exams' });
          return;
        }

        socket.join(`monitor-${examId}`);
        console.log(`👀 Faculty ${socket.user.name} monitoring exam: ${examId}`);

        socket.emit('monitor-joined', {
          examId,
          message: 'Successfully joined monitoring room'
        });

        // Send current active sessions
        const activeSessions = await ExamSession. find({
          exam: examId,
          status: 'in-progress'
        }).populate('student', 'name studentId');

        socket.emit('active-sessions', {
          count: activeSessions.length,
          sessions: activeSessions. map(s => ({
            sessionId: s._id,
            studentName: s.student.name,
            studentId: s.student.studentId,
            startTime: s.startTime,
            warningCount: s.warningCount
          }))
        });

      } catch (error) {
        console.error('Error joining monitor:', error);
        socket.emit('error', { message: 'Failed to join monitoring room' });
      }
    });

    // Violation detected (from student)
    socket.on('violation-detected', async (data) => {
      try {
        const { sessionId, violationType, severity } = data;

        console.log(`⚠️ Violation detected - Session: ${sessionId}, Type: ${violationType}`);

        // Get session to find exam
        const session = await ExamSession.findById(sessionId).populate('exam');

        if (session) {
          // Broadcast to faculty monitoring this exam
          io.to(`monitor-${session.exam._id}`).emit('violation-alert', {
            sessionId,
            studentName: socket.user.name,
            studentId: socket.user.studentId,
            violationType,
            severity,
            warningCount: session.warningCount + 1,
            timestamp: new Date()
          });
        }

      } catch (error) {
        console.error('Error processing violation:', error);
      }
    });

    // Heartbeat to keep connection alive
    socket.on('heartbeat', (data) => {
      socket.emit('heartbeat-ack', { 
        timestamp: Date.now(),
        message: 'Connection active'
      });
    });

    // Exam submitted
    socket.on('exam-submitted', async (data) => {
      try {
        const { sessionId, status } = data;

        const session = await ExamSession.findById(sessionId).populate('exam');

        if (session) {
          // Notify monitoring faculty
          io.to(`monitor-${session.exam._id}`).emit('exam-submission', {
            sessionId,
            studentName: socket.user. name,
            studentId: socket.user.studentId,
            status,
            score: session.score,
            percentage: session.percentage,
            result: session.result,
            timestamp: new Date()
          });

          console.log(`✅ Exam submitted - Student: ${socket.user.name}, Session: ${sessionId}`);

          // Leave session room
          socket.leave(`session-${sessionId}`);
        }

      } catch (error) {
        console.error('Error processing exam submission:', error);
      }
    });

    // Force submit (from faculty/admin)
    socket.on('force-submit', async (data) => {
      try {
        if (socket.user.role !== 'faculty' && socket.user.role !== 'admin') {
          socket.emit('error', { message: 'Unauthorized' });
          return;
        }

        const { sessionId, reason } = data;

        // Emit to student in that session
        io.to(`session-${sessionId}`).emit('force-submit', {
          reason:   reason || 'Exam force-submitted by instructor',
          timestamp: new Date()
        });

        console.log(`🛑 Force submit issued for session ${sessionId} by ${socket.user.name}`);

      } catch (error) {
        console.error('Error force submitting:', error);
      }
    });

    // Broadcast announcement to exam (faculty only)
    socket.on('broadcast-announcement', async (data) => {
      try {
        if (socket.user.role !== 'faculty' && socket.user.role !== 'admin') {
          socket. emit('error', { message: 'Unauthorized' });
          return;
        }

        const { examId, message } = data;

        // Broadcast to all sessions of this exam
        io.to(`monitor-${examId}`).emit('announcement', {
          from: socket.user.name,
          message,
          timestamp: new Date()
        });

        console.log(`📢 Announcement from ${socket.user.name} to exam ${examId}:  ${message}`);

      } catch (error) {
        console.error('Error broadcasting announcement:', error);
      }
    });

    // Student typing/activity indicator
    socket.on('student-activity', (data) => {
      const { sessionId, activity } = data;
      socket.to(`monitor-${data.examId}`).emit('student-activity-update', {
        sessionId,
        studentName: socket.user.name,
        activity,
        timestamp: Date.now()
      });
    });

    // Disconnect handler
    socket.on('disconnect', (reason) => {
      console.  log(`❌ User disconnected: ${socket.user.name} - Reason: ${reason}`);
    });

    // Error handler
    socket.  on('error', (error) => {
      console.error(`Socket error for user ${socket.user.name}:  `, error);
    });
  });

  // Global error handler
  io.on('error', (error) => {
    console.error('Socket.  IO global error:', error);
  });

  console.log('✅ Socket.  IO initialized successfully');
};