const axios = require('axios');

class CalendlyService {
  constructor() {
    this.apiKey = process.env.CALENDLY_API_KEY;
    this.baseUrl = 'https://api.calendly.com';
    this.headers = {
      'Authorization': `Bearer ${this.apiKey}`,
      'Content-Type': 'application/json'
    };
  }

  // Get user URI from Calendly
  async getCurrentUser() {
    try {
      const response = await axios.get(
        `${this.baseUrl}/users/me`,
        { headers: this.headers }
      );
      return response.data;
    } catch (error) {
      console.error('Error getting Calendly user:', error.response?.data || error.message);
      throw error;
    }
  }

  // Get scheduling links for the user
  async getSchedulingLinks(userUri) {
    try {
      const response = await axios.get(
        `${this.baseUrl}/scheduling_links`,
        { 
          headers: this.headers,
          params: {
            'owner': userUri,
            'status': 'active'
          }
        }
      );
      return response.data;
    } catch (error) {
      console.error('Error getting scheduling links:', error.response?.data || error.message);
      throw error;
    }
  }

  // Get available scheduling link or create one if needed
  async getOrCreateSchedulingLink() {
    try {
      const user = await this.getCurrentUser();
      const links = await this.getSchedulingLinks(user.resource.uri);
      
      // If there's already an active scheduling link, return it
      if (links.collection.length > 0) {
        return links.collection[0];
      }
      
      // Otherwise, create a new scheduling link
      const eventType = await this.getDefaultEventType(user.resource.uri);
      
      if (!eventType) {
        throw new Error('No event types found for user');
      }
      
      const response = await axios.post(
        `${this.baseUrl}/scheduling_links`,
        {
          max_event_count: 1,
          owner: eventType.uri,
          owner_type: 'EventType'
        },
        { headers: this.headers }
      );
      
      return response.data.resource;
    } catch (error) {
      console.error('Error getting or creating scheduling link:', error.response?.data || error.message);
      throw error;
    }
  }

  // Get default event type for the user
  async getDefaultEventType(userUri) {
    try {
      const response = await axios.get(
        `${this.baseUrl}/event_types`,
        {
          headers: this.headers,
          params: {
            'user': userUri,
            'active': true
          }
        }
      );
      
      if (response.data.collection.length > 0) {
        return response.data.collection[0];
      }
      
      return null;
    } catch (error) {
      console.error('Error getting event types:', error.response?.data || error.message);
      throw error;
    }
  }

  // Get available times for an event type
  async getAvailableTimes(eventTypeUuid, date) {
    try {
      const response = await axios.get(
        `${this.baseUrl}/event_type_available_times`,
        {
          headers: this.headers,
          params: {
            'event_type': eventTypeUuid,
            'date': date
          }
        }
      );
      
      return response.data;
    } catch (error) {
      console.error('Error getting available times:', error.response?.data || error.message);
      throw error;
    }
  }

  // Create an invitee (schedule an appointment)
  async createInvitee(schedulingLink, payload) {
    try {
      const response = await axios.post(
        `${this.baseUrl}/invitee`,
        {
          ...payload,
          scheduling_link: schedulingLink
        },
        { headers: this.headers }
      );
      
      return response.data;
    } catch (error) {
      console.error('Error creating invitee:', error.response?.data || error.message);
      throw error;
    }
  }
}

module.exports = new CalendlyService();