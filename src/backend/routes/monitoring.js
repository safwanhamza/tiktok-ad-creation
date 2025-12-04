const express = require('express');
const router = express.Router();
const auth = require('../middleware/auth');
const monitoringService = require('../services/monitoringService');

// @route   GET api/monitoring/stats
// @desc    Get call statistics
// @access  Private
router.get('/stats', auth, async (req, res) => {
  try {
    const stats = await monitoringService.getCallStats(req.user.id);
    
    res.json({
      success: true,
      stats
    });
  } catch (err) {
    console.error('Error getting call stats:', err.message);
    res.status(500).send('Server error');
  }
});

// @route   GET api/monitoring/conversion
// @desc    Get conversion statistics
// @access  Private
router.get('/conversion', auth, async (req, res) => {
  try {
    const conversionStats = await monitoringService.getConversionStats(req.user.id);
    
    res.json({
      success: true,
      conversionStats
    });
  } catch (err) {
    console.error('Error getting conversion stats:', err.message);
    res.status(500).send('Server error');
  }
});

// @route   GET api/monitoring/performance
// @desc    Get agent performance metrics
// @access  Private
router.get('/performance', auth, async (req, res) => {
  try {
    const performance = await monitoringService.getAgentPerformance(req.user.id);
    
    res.json({
      success: true,
      performance
    });
  } catch (err) {
    console.error('Error getting agent performance:', err.message);
    res.status(500).send('Server error');
  }
});

// @route   GET api/monitoring/daily
// @desc    Get daily call metrics
// @access  Private
router.get('/daily', auth, async (req, res) => {
  try {
    const { days = 7 } = req.query;
    const dailyMetrics = await monitoringService.getDailyMetrics(req.user.id, parseInt(days));
    
    res.json({
      success: true,
      dailyMetrics
    });
  } catch (err) {
    console.error('Error getting daily metrics:', err.message);
    res.status(500).send('Server error');
  }
});

// @route   GET api/monitoring/dashboard
// @desc    Get real-time dashboard data
// @access  Private
router.get('/dashboard', auth, async (req, res) => {
  try {
    const dashboardData = await monitoringService.getRealTimeDashboard(req.user.id);
    
    res.json({
      success: true,
      dashboardData
    });
  } catch (err) {
    console.error('Error getting dashboard data:', err.message);
    res.status(500).send('Server error');
  }
});

// @route   POST api/monitoring/log-event
// @desc    Log a call event for monitoring
// @access  Private
router.post('/log-event', auth, async (req, res) => {
  try {
    const { callId, eventType, details } = req.body;
    
    const result = await monitoringService.logCallEvent(callId, eventType, details);
    
    res.json({
      success: true,
      result
    });
  } catch (err) {
    console.error('Error logging call event:', err.message);
    res.status(500).send('Server error');
  }
});

module.exports = router;