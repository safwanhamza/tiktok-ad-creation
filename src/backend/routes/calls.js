const express = require('express');
const router = express.Router();
const auth = require('../middleware/auth');
const Call = require('../models/Call');

// @route   GET api/calls
// @desc    Get all calls
// @access  Private
router.get('/', auth, async (req, res) => {
  try {
    const calls = await Call.find()
      .populate('leadId', ['firstName', 'lastName', 'phone'])
      .populate('agentId', ['name', 'email'])
      .sort({ createdAt: -1 });
    res.json(calls);
  } catch (err) {
    console.error(err.message);
    res.status(500).send('Server error');
  }
});

// @route   GET api/calls/:id
// @desc    Get call by ID
// @access  Private
router.get('/:id', auth, async (req, res) => {
  try {
    const call = await Call.findById(req.params.id)
      .populate('leadId', ['firstName', 'lastName', 'phone'])
      .populate('agentId', ['name', 'email']);
    
    if (!call) {
      return res.status(404).json({ msg: 'Call not found' });
    }
    
    res.json(call);
  } catch (err) {
    console.error(err.message);
    res.status(500).send('Server error');
  }
});

// @route   POST api/calls
// @desc    Create a new call
// @access  Private
router.post('/', auth, async (req, res) => {
  try {
    const { leadId, phoneNumber, status } = req.body;

    const newCall = new Call({
      leadId,
      phoneNumber,
      status,
      agentId: req.user.id
    });

    const call = await newCall.save();
    res.json(call);
  } catch (err) {
    console.error(err.message);
    res.status(500).send('Server error');
  }
});

// @route   PUT api/calls/:id
// @desc    Update a call
// @access  Private
router.put('/:id', auth, async (req, res) => {
  try {
    const { status, outcome, transcript, recordingUrl, duration, appointmentScheduled, notes } = req.body;

    const callFields = {};
    if (status) callFields.status = status;
    if (outcome) callFields.outcome = outcome;
    if (transcript) callFields.transcript = transcript;
    if (recordingUrl) callFields.recordingUrl = recordingUrl;
    if (duration) callFields.duration = duration;
    if (appointmentScheduled) callFields.appointmentScheduled = appointmentScheduled;
    if (notes) callFields.notes = notes;

    if (status === 'completed' || status === 'failed') {
      callFields.endTime = Date.now();
    }

    let call = await Call.findById(req.params.id);
    
    if (!call) {
      return res.status(404).json({ msg: 'Call not found' });
    }

    call = await Call.findByIdAndUpdate(
      req.params.id,
      { $set: callFields },
      { new: true }
    );

    res.json(call);
  } catch (err) {
    console.error(err.message);
    res.status(500).send('Server error');
  }
});

// @route   DELETE api/calls/:id
// @desc    Delete a call
// @access  Private
router.delete('/:id', auth, async (req, res) => {
  try {
    const call = await Call.findById(req.params.id);
    
    if (!call) {
      return res.status(404).json({ msg: 'Call not found' });
    }

    await Call.findByIdAndRemove(req.params.id);
    res.json({ msg: 'Call removed' });
  } catch (err) {
    console.error(err.message);
    res.status(500).send('Server error');
  }
});

module.exports = router;