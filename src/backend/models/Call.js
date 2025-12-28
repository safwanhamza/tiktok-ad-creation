const mongoose = require('mongoose');

const CallSchema = new mongoose.Schema({
  leadId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Lead',
    required: true
  },
  agentId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  },
  phoneNumber: {
    type: String,
    required: true
  },
  status: {
    type: String,
    enum: ['initiated', 'ringing', 'in-progress', 'completed', 'failed', 'no-answer', 'busy', 'voicemail'],
    default: 'initiated'
  },
  outcome: {
    type: String,
    enum: ['successful', 'failed', 'no-answer', 'busy', 'wrong-number', 'do-not-call']
  },
  startTime: {
    type: Date
  },
  endTime: {
    type: Date
  },
  duration: {
    type: Number // in seconds
  },
  transcript: {
    type: String
  },
  recordingUrl: {
    type: String
  },
  voicemailLeft: {
    type: Boolean,
    default: false
  },
  scheduledCall: {
    type: Boolean,
    default: false
  },
  callAttempts: {
    type: Number,
    default: 1
  },
  objectionsHandled: [{
    objection: String,
    response: String,
    timestamp: Date
  }],
  appointmentScheduled: {
    date: Date,
    confirmed: {
      type: Boolean,
      default: false
    }
  },
  notes: String,
  createdAt: {
    type: Date,
    default: Date.now
  }
});

module.exports = mongoose.model('Call', CallSchema);