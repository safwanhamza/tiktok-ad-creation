const mongoose = require('mongoose');

const LeadSchema = new mongoose.Schema({
  firstName: {
    type: String,
    required: true
  },
  lastName: {
    type: String,
    required: true
  },
  phone: {
    type: String,
    required: true
  },
  email: {
    type: String
  },
  address: {
    street: String,
    city: String,
    state: String,
    zip: String
  },
  status: {
    type: String,
    enum: ['new', 'contacted', 'scheduled', 'converted', 'unreachable', 'do_not_call'],
    default: 'new'
  },
  callAttempts: {
    type: Number,
    default: 0
  },
  lastContacted: {
    type: Date
  },
  scheduledCall: {
    date: Date,
    completed: {
      type: Boolean,
      default: false
    }
  },
  callHistory: [{
    date: {
      type: Date,
      default: Date.now
    },
    outcome: String,
    transcript: String,
    duration: Number
  }],
  createdAt: {
    type: Date,
    default: Date.now
  },
  assignedTo: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  }
});

module.exports = mongoose.model('Lead', LeadSchema);