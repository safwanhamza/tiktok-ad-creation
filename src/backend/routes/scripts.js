const express = require('express');
const router = express.Router();
const auth = require('../middleware/auth');
const Script = require('../models/Script');

// @route   GET api/scripts
// @desc    Get all scripts
// @access  Private
router.get('/', auth, async (req, res) => {
  try {
    const scripts = await Script.find()
      .populate('createdBy', ['name', 'email'])
      .sort({ createdAt: -1 });
    res.json(scripts);
  } catch (err) {
    console.error(err.message);
    res.status(500).send('Server error');
  }
});

// @route   GET api/scripts/:id
// @desc    Get script by ID
// @access  Private
router.get('/:id', auth, async (req, res) => {
  try {
    const script = await Script.findById(req.params.id)
      .populate('createdBy', ['name', 'email']);
    
    if (!script) {
      return res.status(404).json({ msg: 'Script not found' });
    }
    
    res.json(script);
  } catch (err) {
    console.error(err.message);
    res.status(500).send('Server error');
  }
});

// @route   POST api/scripts
// @desc    Create a new script
// @access  Private
router.post('/', auth, async (req, res) => {
  try {
    const { name, description, questions } = req.body;

    const newScript = new Script({
      name,
      description,
      questions,
      createdBy: req.user.id
    });

    const script = await newScript.save();
    res.json(script);
  } catch (err) {
    console.error(err.message);
    res.status(500).send('Server error');
  }
});

// @route   PUT api/scripts/:id
// @desc    Update a script
// @access  Private
router.put('/:id', auth, async (req, res) => {
  try {
    const { name, description, questions, isActive } = req.body;

    const scriptFields = {};
    if (name) scriptFields.name = name;
    if (description) scriptFields.description = description;
    if (questions) scriptFields.questions = questions;
    if (isActive !== undefined) scriptFields.isActive = isActive;
    scriptFields.updatedAt = Date.now();

    let script = await Script.findById(req.params.id);
    
    if (!script) {
      return res.status(404).json({ msg: 'Script not found' });
    }

    script = await Script.findByIdAndUpdate(
      req.params.id,
      { $set: scriptFields },
      { new: true }
    );

    res.json(script);
  } catch (err) {
    console.error(err.message);
    res.status(500).send('Server error');
  }
});

// @route   DELETE api/scripts/:id
// @desc    Delete a script
// @access  Private
router.delete('/:id', auth, async (req, res) => {
  try {
    const script = await Script.findById(req.params.id);
    
    if (!script) {
      return res.status(404).json({ msg: 'Script not found' });
    }

    await Script.findByIdAndRemove(req.params.id);
    res.json({ msg: 'Script removed' });
  } catch (err) {
    console.error(err.message);
    res.status(500).send('Server error');
  }
});

module.exports = router;