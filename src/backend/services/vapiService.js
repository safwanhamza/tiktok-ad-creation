const axios = require('axios');

class VapiService {
  constructor() {
    this.apiKey = process.env.VAPI_API_KEY;
    this.secretKey = process.env.VAPI_SECRET_KEY;
    this.baseUrl = 'https://api.vapi.ai';
    this.headers = {
      'Authorization': `Bearer ${this.apiKey}`,
      'Content-Type': 'application/json'
    };
  }

  // Create an assistant for the Sunrun sales script
  async createAssistant(assistantConfig) {
    try {
      const response = await axios.post(
        `${this.baseUrl}/assistant`,
        assistantConfig,
        { headers: this.headers }
      );
      return response.data;
    } catch (error) {
      console.error('Error creating assistant:', error.response?.data || error.message);
      throw error;
    }
  }

  // Create a phone number for the voice agent
  async createPhoneNumber(phoneNumberConfig) {
    try {
      const response = await axios.post(
        `${this.baseUrl}/phone-number`,
        phoneNumberConfig,
        { headers: this.headers }
      );
      return response.data;
    } catch (error) {
      console.error('Error creating phone number:', error.response?.data || error.message);
      throw error;
    }
  }

  // Start a call using Vapi
  async startCall(callConfig) {
    try {
      const response = await axios.post(
        `${this.baseUrl}/call`,
        callConfig,
        { headers: this.headers }
      );
      return response.data;
    } catch (error) {
      console.error('Error starting call:', error.response?.data || error.message);
      throw error;
    }
  }

  // Get call details
  async getCall(callId) {
    try {
      const response = await axios.get(
        `${this.baseUrl}/call/${callId}`,
        { headers: this.headers }
      );
      return response.data;
    } catch (error) {
      console.error('Error getting call details:', error.response?.data || error.message);
      throw error;
    }
  }

  // Get all calls
  async getCalls() {
    try {
      const response = await axios.get(
        `${this.baseUrl}/call`,
        { headers: this.headers }
      );
      return response.data;
    } catch (error) {
      console.error('Error getting calls:', error.response?.data || error.message);
      throw error;
    }
  }
}

module.exports = new VapiService();