require('dotenv').config();
const mongoose = require('mongoose');
const User = require('./models/User');
const Log = require('./models/Log');
const io = require('socket.io-client');

// Connect to your socket server
const socket = io('http://localhost:5000');

// MongoDB Connection
mongoose.connect(process.env.MONGODB_URI)
  .then(() => console.log('Connected to MongoDB'))
  .catch(err => console.error('MongoDB connection error:', err));

// Sample RFIDs to test
const rfids = [
  { uid: 'DF3489C1', type: 'entry' },
  { uid: 'DF3489C1', type: 'exit' },
  { uid: '94B96BB0', type: 'entry' },
  { uid: '94B96BB0', type: 'exit' }
];

// Function to simulate RFID scan
async function simulateRFIDScan(rfidData) {
  try {
    const { uid, type } = rfidData;
    console.log(`Simulating ${type} scan for RFID: ${uid}`);
    
    // Find user with this RFID UID
    const user = await User.findOne({ rfidUID: uid });
    
    if (user) {
      // Create log entry
      const log = new Log({
        userId: user._id,
        name: user.name,
        regNo: user.regNo,
        rfidUID: user.rfidUID,
        type
      });
      
      await log.save();
      console.log(`Log created for ${user.name} at ${type} gate`);
      
      // Emit event to real-time dashboard
      socket.emit(`${type}-update`, {
        name: user.name,
        regNo: user.regNo,
        rfidUID: user.rfidUID,
        timestamp: log.timestamp
      });
    } else {
      console.log(`Unauthorized RFID: ${uid}`);
      socket.emit('unauthorized', { rfidUID: uid });
    }
  } catch (error) {
    console.error('Error simulating RFID scan:', error);
  }
}

// Run simulation
async function runDemo() {
  console.log('Starting RFID simulation for demo...');
  console.log('Press Ctrl+C to stop');
  
  let index = 0;
  
  // Simulate a scan every 10 seconds
  const interval = setInterval(async () => {
    await simulateRFIDScan(rfids[index]);
    index = (index + 1) % rfids.length;
  }, 10000);
  
  // Allow manual scans
  console.log('\nType "entry" or "exit" followed by the RFID UID to simulate a scan');
  console.log('Example: entry DF3489C1\n');
  
  process.stdin.on('data', async (data) => {
    const input = data.toString().trim().split(' ');
    if (input.length === 2) {
      const type = input[0].toLowerCase();
      const uid = input[1].toUpperCase();
      
      if (type === 'entry' || type === 'exit') {
        await simulateRFIDScan({ uid, type });
      } else {
        console.log('Invalid type. Use "entry" or "exit"');
      }
    } else {
      console.log('Invalid format. Use "<type> <uid>", e.g., "entry DF3489C1"');
    }
  });
  
  // Handle shutdown
  process.on('SIGINT', () => {
    clearInterval(interval);
    console.log('\nStopping simulation');
    mongoose.disconnect();
    process.exit();
  });
}

// Start the demo
runDemo();