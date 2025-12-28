const mongoose = require('mongoose');

const ScriptSchema = new mongoose.Schema({
  name: {
    type: String,
    required: true
  },
  description: {
    type: String
  },
  isActive: {
    type: Boolean,
    default: true
  },
  questions: [{
    question: {
      type: String,
      required: true
    },
    expectedAnswers: [{
      answer: String,
      followUpAction: String, // 'continue', 'objection', 'schedule', etc.
      nextQuestion: String
    }],
    isObjection: {
      type: Boolean,
      default: false
    }
  }],
  createdAt: {
    type: Date,
    default: Date.now
  },
  updatedAt: {
    type: Date,
    default: Date.now
  },
  createdBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  }
});

module.exports = mongoose.model('Script', ScriptSchema);