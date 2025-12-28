const Call = require('../models/Call');
const Lead = require('../models/Lead');

class MonitoringService {
  // Get call statistics
  async getCallStats(userId = null) {
    try {
      const query = userId ? { agent: userId } : {};
      
      const stats = await Call.aggregate([
        {
          $match: query
        },
        {
          $group: {
            _id: '$status',
            count: { $sum: 1 },
            totalDuration: { $sum: '$duration' }
          }
        }
      ]);
      
      const totalCalls = await Call.countDocuments(query);
      const completedCalls = await Call.countDocuments({ ...query, status: 'completed' });
      const failedCalls = await Call.countDocuments({ ...query, status: { $in: ['failed', 'no-answer', 'busy'] } });
      
      return {
        total: totalCalls,
        completed: completedCalls,
        failed: failedCalls,
        noAnswer: await Call.countDocuments({ ...query, status: 'no-answer' }),
        busy: await Call.countDocuments({ ...query, status: 'busy' }),
        statusBreakdown: stats,
        successRate: totalCalls > 0 ? (completedCalls / totalCalls) * 100 : 0
      };
    } catch (error) {
      console.error('Error getting call stats:', error.message);
      throw error;
    }
  }

  // Get lead conversion statistics
  async getConversionStats(userId = null) {
    try {
      const query = userId ? { agent: userId } : {};
      
      // This would depend on how you track conversions
      // For now, we'll assume that a call with a scheduled appointment indicates conversion
      const convertedLeads = await Call.countDocuments({ 
        ...query, 
        'metadata.scheduledAppointment': true 
      });
      
      const totalLeadsCalled = await Call.distinct('lead', query).length;
      
      return {
        totalLeadsCalled,
        converted: convertedLeads,
        conversionRate: totalLeadsCalled > 0 ? (convertedLeads / totalLeadsCalled) * 100 : 0
      };
    } catch (error) {
      console.error('Error getting conversion stats:', error.message);
      throw error;
    }
  }

  // Get agent performance metrics
  async getAgentPerformance(userId) {
    try {
      const callStats = await this.getCallStats(userId);
      const conversionStats = await this.getConversionStats(userId);
      
      // Calculate average call duration for completed calls
      const avgDuration = await Call.aggregate([
        { $match: { agent: userId, status: 'completed', duration: { $exists: true, $ne: null } } },
        { $group: { _id: null, avgDuration: { $avg: '$duration' } } }
      ]);
      
      return {
        ...callStats,
        ...conversionStats,
        avgCallDuration: avgDuration[0] ? avgDuration[0].avgDuration : 0,
        agentId: userId
      };
    } catch (error) {
      console.error('Error getting agent performance:', error.message);
      throw error;
    }
  }

  // Get daily call metrics
  async getDailyMetrics(userId = null, days = 7) {
    try {
      const query = userId ? { agent: userId } : {};
      const startDate = new Date();
      startDate.setDate(startDate.getDate() - days);
      
      const dailyStats = await Call.aggregate([
        {
          $match: {
            ...query,
            createdAt: { $gte: startDate }
          }
        },
        {
          $group: {
            _id: {
              $dateToString: { format: '%Y-%m-%d', date: '$createdAt' }
            },
            totalCalls: { $sum: 1 },
            completedCalls: {
              $sum: { $cond: [{ $eq: ['$status', 'completed'] }, 1, 0] }
            },
            failedCalls: {
              $sum: { 
                $cond: [
                  { $in: ['$status', ['failed', 'no-answer', 'busy']] }, 
                  1, 
                  0
                ] 
              }
            }
          }
        },
        { $sort: { _id: 1 } }
      ]);
      
      return dailyStats;
    } catch (error) {
      console.error('Error getting daily metrics:', error.message);
      throw error;
    }
  }

  // Log call event for monitoring
  async logCallEvent(callId, eventType, details) {
    try {
      // In a real implementation, you might want to store these events
      // in a separate collection for detailed monitoring
      console.log(`Call Event - Call: ${callId}, Type: ${eventType}, Details:`, details);
      
      // Update call record with the latest event if needed
      if (eventType === 'status-change') {
        await Call.findByIdAndUpdate(callId, {
          status: details.status,
          lastEvent: new Date(),
          lastEventDetails: details
        });
      }
      
      return { success: true, eventId: Date.now() };
    } catch (error) {
      console.error('Error logging call event:', error.message);
      throw error;
    }
  }

  // Get real-time call dashboard data
  async getRealTimeDashboard(userId = null) {
    try {
      const now = new Date();
      const oneHourAgo = new Date(now.getTime() - 60 * 60 * 1000); // 1 hour ago
      
      const query = userId ? { agent: userId } : {};
      
      // Get active calls (in-progress)
      const activeCalls = await Call.countDocuments({ 
        ...query, 
        status: 'in-progress',
        createdAt: { $gte: oneHourAgo }
      });
      
      // Get calls in last hour
      const recentCalls = await Call.countDocuments({ 
        ...query, 
        createdAt: { $gte: oneHourAgo }
      });
      
      // Get today's calls
      const startOfDay = new Date();
      startOfDay.setHours(0, 0, 0, 0);
      
      const todaysCalls = await Call.countDocuments({ 
        ...query, 
        createdAt: { $gte: startOfDay }
      });
      
      const completedTodaysCalls = await Call.countDocuments({ 
        ...query, 
        status: 'completed',
        createdAt: { $gte: startOfDay }
      });
      
      return {
        activeCalls,
        recentCalls,
        todaysCalls,
        completedTodaysCalls,
        activeAgents: userId ? 1 : await this.getActiveAgentCount(),
        timestamp: new Date()
      };
    } catch (error) {
      console.error('Error getting real-time dashboard:', error.message);
      throw error;
    }
  }

  // Get active agent count (agents with recent activity)
  async getActiveAgentCount() {
    try {
      const oneHourAgo = new Date(Date.now() - 60 * 60 * 1000);
      
      const activeAgents = await Call.distinct('agent', {
        createdAt: { $gte: oneHourAgo }
      });
      
      return activeAgents.length;
    } catch (error) {
      console.error('Error getting active agent count:', error.message);
      throw error;
    }
  }
}

module.exports = new MonitoringService();