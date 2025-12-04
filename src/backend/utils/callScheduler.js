const agenda = require('agenda');
const Call = require('../models/Call');
const Lead = require('../models/Lead');
const vapiService = require('../services/vapiService');
const sunrunAssistantConfig = require('../config/assistantConfig');

// Initialize agenda for job scheduling
const jobScheduler = new agenda({
  db: {
    address: process.env.MONGODB_URI || 'mongodb://localhost:27017/voice-agent',
    collection: 'agendaJobs'
  }
});

// Define job types
jobScheduler.define('make-call', async (job) => {
  const { leadId, phoneNumber, assistantId, retryCount = 0 } = job.attrs.data;
  
  try {
    // Find the lead to get their information
    const lead = await Lead.findById(leadId);
    if (!lead) {
      console.error(`Lead not found: ${leadId}`);
      return;
    }

    // Create a Vapi call configuration
    const callConfig = {
      assistantId: assistantId || process.env.VAPI_DEFAULT_ASSISTANT_ID || sunrunAssistantConfig.id,
      numberId: process.env.VAPI_PHONE_NUMBER_ID,
      customer: {
        number: phoneNumber,
        name: lead.name || 'Customer'
      },
      metadata: {
        leadId: lead._id.toString(),
        leadName: lead.name,
        leadAddress: lead.address || '',
        campaign: 'sunrun-outreach',
        retryCount
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
      agent: lead.agent || null, // Use the lead's assigned agent if available
      metadata: callConfig.metadata
    });

    await newCall.save();

    console.log(`Call initiated for lead ${leadId}, Vapi call ID: ${vapiCall.id}`);
  } catch (error) {
    console.error(`Error making call to lead ${leadId}:`, error.message);
    throw error; // This will cause agenda to retry the job
  }
});

// Job to handle retry logic
jobScheduler.define('retry-call', async (job) => {
  const { leadId, phoneNumber, assistantId, retryCount = 0 } = job.attrs.data;
  
  // Check if max retries reached (max 2 attempts as per requirements)
  if (retryCount >= 2) {
    console.log(`Max retries reached for lead ${leadId}. Moving to voicemail logic.`);
    
    // In a real implementation, you would drop a voicemail here
    // This could be a pre-recorded message or TTS message
    await handleVoicemail(leadId, phoneNumber);
    return;
  }

  // Schedule the retry
  const newRetryCount = retryCount + 1;
  
  // Schedule retry after 24 hours for the first retry, then 48 hours for the second
  let delayHours = 24;
  if (retryCount === 1) {
    delayHours = 48; // Second retry after 48 hours
  }

  await jobScheduler
    .create('make-call', { leadId, phoneNumber, assistantId, retryCount: newRetryCount })
    .schedule(`${delayHours} hours from now`)
    .save();

  console.log(`Scheduled retry #${newRetryCount} for lead ${leadId} in ${delayHours} hours`);
});

// Job to handle voicemail
jobScheduler.define('handle-voicemail', async (job) => {
  const { leadId, phoneNumber } = job.attrs.data;
  
  try {
    // In a real implementation, this would drop a voicemail
    // For now, we'll just update the call record to indicate voicemail left
    const call = await Call.findOne({ lead: leadId, phoneNumber }).sort({ createdAt: -1 });
    
    if (call) {
      call.status = 'voicemail-left';
      call.voicemailLeft = true;
      await call.save();
    }

    console.log(`Voicemail handled for lead ${leadId}`);
  } catch (error) {
    console.error(`Error handling voicemail for lead ${leadId}:`, error.message);
  }
});

// Helper function to handle voicemail
async function handleVoicemail(leadId, phoneNumber) {
  // Create a job to handle voicemail
  await jobScheduler
    .create('handle-voicemail', { leadId, phoneNumber })
    .schedule('in 5 minutes') // Small delay before marking as voicemail
    .save();
}

// Process jobs
jobScheduler.process('make-call', 5); // Process up to 5 concurrent call jobs
jobScheduler.process('retry-call', 3); // Process up to 3 concurrent retry jobs
jobScheduler.process('handle-voicemail', 5); // Process up to 5 concurrent voicemail jobs

// Start the scheduler
jobScheduler.start();

// Function to schedule an initial call
async function scheduleInitialCall(leadId, phoneNumber, assistantId, scheduledTime = null) {
  try {
    const job = await jobScheduler
      .create('make-call', { 
        leadId, 
        phoneNumber, 
        assistantId,
        retryCount: 0 
      });

    if (scheduledTime) {
      job.schedule(scheduledTime);
    } else {
      job.schedule('now');
    }

    await job.save();
    
    console.log(`Scheduled initial call for lead ${leadId}`);
    return job;
  } catch (error) {
    console.error(`Error scheduling initial call for lead ${leadId}:`, error.message);
    throw error;
  }
}

// Function to schedule a retry
async function scheduleRetry(leadId, phoneNumber, assistantId, retryCount) {
  try {
    const job = await jobScheduler
      .create('retry-call', { 
        leadId, 
        phoneNumber, 
        assistantId,
        retryCount 
      });

    // Retry after 1 hour initially to test quickly
    job.schedule('in 1 hour');
    await job.save();
    
    console.log(`Scheduled retry #${retryCount + 1} for lead ${leadId}`);
    return job;
  } catch (error) {
    console.error(`Error scheduling retry for lead ${leadId}:`, error.message);
    throw error;
  }
}

// Function to schedule a call with retry logic
async function scheduleCallWithRetry(leadId, phoneNumber, assistantId, scheduledTime = null) {
  // First, schedule the initial call
  const initialJob = await scheduleInitialCall(leadId, phoneNumber, assistantId, scheduledTime);
  
  return {
    initialJobId: initialJob.attrs._id,
    leadId,
    phoneNumber,
    status: 'scheduled'
  };
}

module.exports = {
  jobScheduler,
  scheduleInitialCall,
  scheduleRetry,
  scheduleCallWithRetry
};