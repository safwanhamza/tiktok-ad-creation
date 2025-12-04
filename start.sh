#!/bin/bash

echo "Starting AI Voice Agent System..."

# Install dependencies if not already installed
if [ ! -d "node_modules" ]; then
    echo "Installing dependencies..."
    npm install
fi

# Start the backend server
echo "Starting backend server..."
cd src/backend

# Create a default .env file if it doesn't exist
if [ ! -f ".env" ]; then
    echo "Creating default .env file..."
    cat > .env << EOF
# Vapi Configuration
VAPI_API_KEY=your_vapi_api_key_here
VAPI_SECRET_KEY=your_vapi_secret_key_here
VAPI_DEFAULT_ASSISTANT_ID=your_assistant_id_here
VAPI_PHONE_NUMBER_ID=your_phone_number_id_here

# Calendly Configuration
CALENDLY_API_KEY=your_calendly_api_key_here

# Database Configuration
MONGODB_URI=mongodb://localhost:27017/voice-agent

# JWT Secret
JWT_SECRET=your_jwt_secret_here

# Port
PORT=5000
EOF
    echo "Default .env file created. Please update with your actual credentials."
fi

# Start the server
node server.js