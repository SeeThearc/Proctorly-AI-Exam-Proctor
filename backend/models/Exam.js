const mongoose = require('mongoose');

const questionSchema = new mongoose.Schema({
  questionText: {
    type: String,
    required: [true, 'Question text is required']
  },
  options: {
    type: [String],
    required: true,
    validate: {
      validator: function(v) {
        return v.length >= 2;
      },
      message: 'At least 2 options are required'
    }
  },
  correctAnswer: {
    type: Number,
    required: [true, 'Correct answer is required'],
    min: 0
  },
  marks: {
    type: Number,
    required: true,
    min: 1,
    default: 1
  },
  explanation: {
    type: String,
    default: ''
  },
  image: {
    type: String,
    default: null
  }
});

const examSchema = new mongoose.Schema({
  title: {
    type:  String,
    required: [true, 'Exam title is required'],
    trim: true
  },
  description: {
    type: String,
    trim: true
  },
  course: {
    type: String,
    required: [true, 'Course is required'],
    trim: true
  },
  createdBy: {
    type: mongoose. Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  duration: {
    type:  Number,
    required: [true, 'Duration is required'],
    min: [1, 'Duration must be at least 1 minute']
  },
  totalMarks: {
    type:  Number,
    required: [true, 'Total marks is required'],
    min: [1, 'Total marks must be at least 1']
  },
  passingMarks: {
    type: Number,
    required: [true, 'Passing marks is required'],
    min:  [0, 'Passing marks cannot be negative'],
    validate: {
      validator: function(value) {
        return value <= this.totalMarks;
      },
      message: 'Passing marks cannot exceed total marks'
    }
  },
  scheduledDate: {
    type:  Date,
    required: [true, 'Scheduled date is required']
  },
  endDate:  {
    type: Date,
    required: [true, 'End date is required'],
    validate: {
      validator: function(value) {
        return value > this.scheduledDate;
      },
      message: 'End date must be after scheduled date'
    }
  },
  isActive: {
    type: Boolean,
    default: true
  },
  questions: {
    type: [questionSchema],
    validate: {
      validator: function(v) {
        return v && v.length > 0;
      },
      message: 'At least one question is required'
    }
  },
  allowedStudents: [{
    type: mongoose.Schema. Types.ObjectId,
    ref: 'User'
  }],
  proctoringSettings: {
    enableFaceDetection: {
      type: Boolean,
      default: true
    },
    enableMultipleFaceDetection: {
      type:  Boolean,
      default: true
    },
    enableHeadMovement: {
      type: Boolean,
      default: true
    },
    enableTabSwitch: {
      type: Boolean,
      default: true
    },
    warningThreshold: {
      type: Number,
      default: 3,
      min: 1,
      max: 10
    },
    autoSubmitOnThreshold: {
      type: Boolean,
      default: true
    }
  },
  settings:  {
    shuffleQuestions: {
      type: Boolean,
      default: false
    },
    shuffleOptions: {
      type: Boolean,
      default: false
    },
    showResultsImmediately: {
      type: Boolean,
      default: true
    },
    allowReviewAnswers: {
      type: Boolean,
      default: true
    },
    negativeMarking: {
      enabled: {
        type: Boolean,
        default: false
      },
      deduction: {
        type: Number,
        default: 0.25,
        min: 0
      }
    }
  }
}, {
  timestamps: true
});

// ✅ REMOVE the pre-save and pre-update hooks that are causing issues
// The controller already handles total marks calculation

// Indexes
examSchema.index({ createdBy: 1, createdAt: -1 });
examSchema.index({ scheduledDate: 1, endDate: 1 });
examSchema.index({ isActive: 1 });

module.exports = mongoose.model('Exam', examSchema);