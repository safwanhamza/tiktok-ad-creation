const express = require('express');
const router = express.Router();
const auth = require('../middleware/auth');
const Lead = require('../models/Lead');

// @route   GET api/leads
// @desc    Get all leads
// @access  Private
router.get('/', auth, async (req, res) => {
  try {
    const leads = await Lead.find()
      .populate('assignedTo', ['name', 'email'])
      .sort({ createdAt: -1 });
    res.json(leads);
  } catch (err) {
    console.error(err.message);
    res.status(500).send('Server error');
  }
});

// @route   GET api/leads/:id
// @desc    Get lead by ID
// @access  Private
router.get('/:id', auth, async (req, res) => {
  try {
    const lead = await Lead.findById(req.params.id)
      .populate('assignedTo', ['name', 'email']);
    
    if (!lead) {
      return res.status(404).json({ msg: 'Lead not found' });
    }
    
    res.json(lead);
  } catch (err) {
    console.error(err.message);
    res.status(500).send('Server error');
  }
});

// @route   POST api/leads
// @desc    Create a new lead
// @access  Private
router.post('/', auth, async (req, res) => {
  try {
    const { firstName, lastName, phone, email, address } = req.body;

    const newLead = new Lead({
      firstName,
      lastName,
      phone,
      email,
      address
    });

    const lead = await newLead.save();
    res.json(lead);
  } catch (err) {
    console.error(err.message);
    res.status(500).send('Server error');
  }
});

// @route   PUT api/leads/:id
// @desc    Update a lead
// @access  Private
router.put('/:id', auth, async (req, res) => {
  try {
    const { firstName, lastName, phone, email, address, status, assignedTo } = req.body;

    const leadFields = {};
    if (firstName) leadFields.firstName = firstName;
    if (lastName) leadFields.lastName = lastName;
    if (phone) leadFields.phone = phone;
    if (email) leadFields.email = email;
    if (address) leadFields.address = address;
    if (status) leadFields.status = status;
    if (assignedTo) leadFields.assignedTo = assignedTo;

    let lead = await Lead.findById(req.params.id);
    
    if (!lead) {
      return res.status(404).json({ msg: 'Lead not found' });
    }

    lead = await Lead.findByIdAndUpdate(
      req.params.id,
      { $set: leadFields },
      { new: true }
    );

    res.json(lead);
  } catch (err) {
    console.error(err.message);
    res.status(500).send('Server error');
  }
});

// @route   DELETE api/leads/:id
// @desc    Delete a lead
// @access  Private
router.delete('/:id', auth, async (req, res) => {
  try {
    const lead = await Lead.findById(req.params.id);
    
    if (!lead) {
      return res.status(404).json({ msg: 'Lead not found' });
    }

    await Lead.findByIdAndRemove(req.params.id);
    res.json({ msg: 'Lead removed' });
  } catch (err) {
    console.error(err.message);
    res.status(500).send('Server error');
  }
});

module.exports = router;