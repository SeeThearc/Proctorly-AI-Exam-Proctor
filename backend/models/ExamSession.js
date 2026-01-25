const mongoose = require('mongoose');

const mcqAnswerSchema = new mongoose. Schema({
  questionId: {
    type: mongoose.Schema.Types.ObjectId,
    required: true
  },
  selectedOption: {
    type: Number,
    min: 0,
    max: 5
  },
  isCorrect: {
    type:  Boolean,
    default: null
  },
  marksAwarded: {
    type: Number,
    default: 0
  },
  timeSpent: {
    type: Number,
    default: 0
  }
});

const examSessionSchema = new mongoose.Schema({
  exam: {
    type: mongoose.Schema. Types.ObjectId,
    ref: 'Exam',
    required: true
  },
  student: {
    type: mongoose. Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  startTime: {
    type: Date,
    default: Date.now
  },
  endTime: {
    type: Date,
    default: null
  },
  status: {
    type: String,
    enum: ['in-progress', 'completed', 'auto-submitted', 'terminated'],
    default: 'in-progress'
  },
  answers: {
    type: [mcqAnswerSchema],
    default: []
  },
  questionOrder: {
    type: [Number],
    default: []
  },
  warningCount: {
    type: Number,
    default: 0,
    min: 0
  },
  violations: [{
    type: mongoose.Schema. Types.ObjectId,
    ref: 'Violation'
  }],
  snapshots: {
    type: [String],
    default: []
  },
  videoRecording: {
    type: String,
    default: null
  },
  score: {
    type: Number,
    default: 0
  },
  totalQuestions: {
    type: Number,
    default: 0
  },
  correctAnswers: {
    type:  Number,
    default: 0
  },
  wrongAnswers: {
    type:  Number,
    default: 0
  },
  unansweredQuestions: {
    type: Number,
    default: 0
  },
  percentage: {
    type: Number,
    default: 0,
    min: 0,
    max: 100
  },
  result: {
    type: String,
    enum: ['pass', 'fail', 'pending'],
    default: 'pending'
  },
  gradedAt: {
    type: Date,
    default: null
  },
  canViewAnswers: {
    type: Boolean,
    default: false
  }
}, {
  timestamps:  true
});

// Compound index for unique student-exam combination
examSessionSchema.index({ exam: 1, student: 1 }, { unique: true });
examSessionSchema.index({ status: 1 });
examSessionSchema.index({ startTime: -1 });

module.exports = mongoose.model('ExamSession', examSessionSchema);