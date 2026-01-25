const mongoose = require('mongoose');

const violationSchema = new mongoose.Schema({
  session: {
    type: mongoose. Schema.Types.ObjectId,
    ref: 'ExamSession',
    required: true
  },
  violationType: {
    type: String,
    enum: [
      'no-face-detected',
      'multiple-faces',
      'face-not-matching',
      'excessive-head-movement',
      'tab-switch',
      'fullscreen-exit',
      'window-blur',
      'suspicious-object',
      'other'
    ],
    required:  true
  },
  timestamp: {
    type: Date,
    default: Date.now
  },
  snapshot: {
    type: String,
    default: null
  },
  severity: {
    type: String,
    enum: ['low', 'medium', 'high'],
    default: 'medium'
  },
  metadata: {
    type: Map,
    of: String,
    default: {}
  },
  description: {
    type: String,
    default: null
  }
}, {
  timestamps: true
});

// Indexes for better query performance
violationSchema.index({ session: 1, timestamp: -1 });
violationSchema.index({ violationType: 1 });
violationSchema.index({ severity: 1 });

module.exports = mongoose.model('Violation', violationSchema);