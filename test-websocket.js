const { io } = require("socket.io-client");
const axios = require("axios");

// Configuration
const API_BASE_URL = "http://localhost:3000";
const WS_URL = "http://localhost:3000/flags";
const TENANT_ID = "123e4567-e89b-12d3-a456-426614174000";

// Colors for terminal output
const colors = {
  green: '\x1b[32m',
  blue: '\x1b[34m',
  yellow: '\x1b[33m',
  red: '\x1b[31m',
  reset: '\x1b[0m'
};

// Log with color
function logWithColor(message, color) {
  console.log(`${color}${message}${colors.reset}`);
}

async function testWebSocket() {
  logWithColor("===========================================", colors.blue);
  logWithColor("    WebSocket Feature Flag Update Test    ", colors.blue);
  logWithColor("===========================================", colors.blue);

  // Connect to WebSocket with tenant ID
  const socket = io(WS_URL, {
    query: {
      tenantId: TENANT_ID
    }
  });

  // WebSocket event handlers
  socket.on("connect", () => {
    logWithColor(`Connected to WebSocket server with ID: ${socket.id}`, colors.green);
    
    // Subscribe to specific flags
    socket.emit("subscribe", { flags: ["test-feature"] });
  });

  socket.on("connection", (data) => {
    logWithColor(`Connection acknowledgement: ${JSON.stringify(data)}`, colors.green);
  });

  socket.on("subscribed", (data) => {
    logWithColor(`Subscribed to flags: ${JSON.stringify(data)}`, colors.green);
    
    // After subscription, let's update a flag to trigger an update
    setTimeout(updateFlag, 1000);
  });

  socket.on("flag-changed", (data) => {
    logWithColor(`Flag changed event received: ${JSON.stringify(data)}`, colors.yellow);
    
    // Wait a bit and then test the evaluation with the updated flag
    setTimeout(testUpdatedFlag, 1000);
  });

  socket.on("pong", (data) => {
    logWithColor(`Pong response: ${JSON.stringify(data)}`, colors.green);
  });

  socket.on("disconnect", () => {
    logWithColor("Disconnected from WebSocket server", colors.red);
  });

  socket.on("error", (error) => {
    logWithColor(`WebSocket error: ${error}`, colors.red);
  });

  // Send a ping after connection established
  setTimeout(() => {
    logWithColor("Sending ping...", colors.blue);
    socket.emit("ping");
  }, 2000);
}

// Function to update a flag and trigger WebSocket update
async function updateFlag() {
  try {
    logWithColor("Updating test feature flag (should trigger WebSocket event)...", colors.blue);
    
    // Toggle the flag enabled state
    const response = await axios.patch(`${API_BASE_URL}/feature-flags/key/test-feature`, {
      enabled: false // Disable the flag to see the change
    }, {
      headers: {
        'Content-Type': 'application/json',
        'x-tenant-id': TENANT_ID
      }
    });
    
    logWithColor(`Flag updated: ${JSON.stringify(response.data)}`, colors.green);
  } catch (error) {
    logWithColor(`Error updating flag: ${error.message}`, colors.red);
  }
}

// Function to test evaluation after flag update
async function testUpdatedFlag() {
  try {
    logWithColor("Testing evaluation after flag update...", colors.blue);
    
    const response = await axios.post(`${API_BASE_URL}/api/v1/evaluate/test-feature`, {
      userId: "user-123",
      userRole: "premium",
      location: {
        country: "UK"
      }
    }, {
      headers: {
        'Content-Type': 'application/json',
        'x-tenant-id': TENANT_ID
      }
    });
    
    logWithColor(`Evaluation result after update: ${JSON.stringify(response.data)}`, colors.green);
    
    // Exit after waiting
    setTimeout(() => {
      logWithColor("Test completed, exiting...", colors.blue);
      process.exit(0);
    }, 3000);
  } catch (error) {
    logWithColor(`Error testing updated flag: ${error.message}`, colors.red);
  }
}

// Start the test
testWebSocket(); 