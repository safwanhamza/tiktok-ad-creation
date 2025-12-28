const express = require('express');
const router = express.Router();
const auth = require('../middleware/auth');
const vapiService = require('../services/vapiService');
const calendlyService = require('../services/calendlyService');
const Call = require('../models/Call');
const Lead = require('../models/Lead');
const sunrunAssistantConfig = require('../config/assistantConfig');

// @route   POST api/voice/incoming
// @desc    Handle incoming voice calls - this would be for webhooks from Vapi
// @access  Public (Vapi will authenticate via webhook)
router.post('/incoming', async (req, res) => {
  try {
    // This endpoint handles webhooks from Vapi about call status
    const { 
      type, 
      call, 
      conversation, 
      endReason 
    } = req.body;

    console.log(`Vapi webhook received: ${type}`);
    
    if (type === 'call-start') {
      console.log(`Call started: ${call.id}`);
      // Update call status in database
      await Call.findOneAndUpdate(
        { vapiCallId: call.id },
        { status: 'in-progress', startTime: new Date() },
        { new: true, upsert: true }
      );
    } else if (type === 'call-end') {
      console.log(`Call ended: ${call.id}, reason: ${endReason}`);
      // Update call status in database
      await Call.findOneAndUpdate(
        { vapiCallId: call.id },
        { 
          status: 'completed', 
          endTime: new Date(),
          endReason: endReason,
          duration: call.duration
        },
        { new: true }
      );
    } else if (type === 'conversation-update') {
      console.log(`Conversation updated for call: ${call.id}`);
      // Handle conversation updates if needed
    }

    res.status(200).send('Webhook received');
  } catch (err) {
    console.error('Error handling Vapi webhook:', err.message);
    res.status(500).send('Server error');
  }
});

// @route   POST api/voice/connect
// @desc    Initiate outbound call to lead using Vapi
// @access  Private
router.post('/connect', auth, async (req, res) => {
  try {
    const { leadId, phoneNumber, assistantId } = req.body;
    
    // Find the lead to get their information
    const lead = await Lead.findById(leadId);
    if (!lead) {
      return res.status(404).json({ success: false, message: 'Lead not found' });
    }

    // Use the default assistant or the one provided
    const assistantToUse = assistantId || process.env.VAPI_DEFAULT_ASSISTANT_ID;

    // Create a Vapi call configuration
    const callConfig = {
      assistantId: assistantToUse || sunrunAssistantConfig.id, // Use default or create new
      numberId: process.env.VAPI_PHONE_NUMBER_ID, // Phone number configured in Vapi
      customer: {
        number: phoneNumber,
        name: lead.name || 'Customer'
      },
      metadata: {
        leadId: lead._id.toString(),
        leadName: lead.name,
        leadAddress: lead.address || '',
        campaign: 'sunrun-outreach'
      }
    };

    // Start the call using Vapi
    const vapiCall = await vapiService.startCall(callConfig);

    // Save call record in database
    const newCall = new Call({
      lead: lead._id,
      phoneNumber: phoneNumber,
      vapiCallId: vapiCall.id,
      status: 'initiated',
      agent: req.user.id, // Assuming req.user is set by auth middleware
      metadata: callConfig.metadata
    });

    await newCall.save();

    res.json({
      success: true,
      message: 'Call initiated successfully',
      callId: vapiCall.id,
      vapiCall: vapiCall
    });
  } catch (err) {
    console.error('Error initiating call:', err.message);
    res.status(500).send('Server error');
  }
});

// @route   POST api/voice/create-assistant
// @desc    Create a Sunrun assistant in Vapi
// @access  Private
router.post('/create-assistant', auth, async (req, res) => {
  try {
    // Use the Sunrun assistant configuration
    const assistantConfig = { ...sunrunAssistantConfig };
    
    // Override name if provided in request
    if (req.body.name) {
      assistantConfig.name = req.body.name;
    }
    
    // Create the assistant in Vapi
    const assistant = await vapiService.createAssistant(assistantConfig);
    
    // Save assistant ID to environment or return for reference
    console.log(`Created assistant: ${assistant.id}`);
    
    res.json({
      success: true,
      message: 'Assistant created successfully',
      assistantId: assistant.id,
      assistant: assistant
    });
  } catch (err) {
    console.error('Error creating assistant:', err.message);
    res.status(500).send('Server error');
  }
});

// @route   POST api/voice/schedule-call
// @desc    Schedule a call for a later time
// @access  Private
router.post('/schedule-call', auth, async (req, res) => {
  try {
    const { leadId, phoneNumber, scheduledTime } = req.body;
    
    // Find the lead to get their information
    const lead = await Lead.findById(leadId);
    if (!lead) {
      return res.status(404).json({ success: false, message: 'Lead not found' });
    }

    // In a real implementation, you would use a scheduler like Agenda.js or cron
    // For now, we'll simulate scheduling by creating a record
    const scheduledCall = {
      leadId,
      phoneNumber,
      scheduledTime: new Date(scheduledTime),
      status: 'scheduled',
      agent: req.user.id
    };

    // In a real implementation, you would add this to a job queue
    // to initiate the call at the scheduled time
    console.log(`Call scheduled for ${scheduledTime} to ${phoneNumber}`);

    res.json({
      success: true,
      message: 'Call scheduled successfully',
      scheduledCall
    });
  } catch (err) {
    console.error('Error scheduling call:', err.message);
    res.status(500).send('Server error');
  }
});

// @route   GET api/voice/calls
// @desc    Get all calls for a user
// @access  Private
router.get('/calls', auth, async (req, res) => {
  try {
    const calls = await Call.find({ agent: req.user.id })
      .populate('lead', 'name phone address')
      .sort({ createdAt: -1 });
    
    res.json({
      success: true,
      calls
    });
  } catch (err) {
    console.error('Error fetching calls:', err.message);
    res.status(500).send('Server error');
  }
});

// @route   GET api/voice/call/:id
// @desc    Get specific call details
// @access  Private
router.get('/call/:id', auth, async (req, res) => {
  try {
    const call = await Call.findById(req.params.id)
      .populate('lead', 'name phone address');
    
    if (!call) {
      return res.status(404).json({ success: false, message: 'Call not found' });
    }
    
    // Check if user has permission to access this call
    if (call.agent.toString() !== req.user.id) {
      return res.status(403).json({ success: false, message: 'Access denied' });
    }
    
    res.json({
      success: true,
      call
    });
  } catch (err) {
    console.error('Error fetching call:', err.message);
    res.status(500).send('Server error');
  }
});

// @route   POST api/voice/handle-objection
// @desc    Handle objection and potentially schedule appointment
// @access  Private
router.post('/handle-objection', auth, async (req, res) => {
  try {
    const { leadId, objectionType, scheduleAppointment } = req.body;
    
    if (scheduleAppointment) {
      // Get Calendly scheduling link
      try {
        const schedulingLink = await calendlyService.getOrCreateSchedulingLink();
        
        // Return the scheduling link for frontend to use
        res.json({
          success: true,
          message: 'Scheduling link retrieved',
          schedulingLink: schedulingLink,
          needsScheduling: true
        });
      } catch (error) {
        console.error('Error getting Calendly link:', error.message);
        res.json({
          success: true,
          message: 'Proceed with scheduling',
          needsScheduling: true,
          calendlyError: error.message
        });
      }
    } else {
      res.json({
        success: true,
        message: 'Objection handled',
        needsScheduling: false
      });
    }
  } catch (err) {
    console.error('Error handling objection:', err.message);
    res.status(500).send('Server error');
  }
});

module.exports = router;
