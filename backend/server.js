require('dotenv').config();
const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const { SerialPort } = require('serialport');
const { ReadlineParser } = require('@serialport/parser-readline');
const http = require('http');
const socketIo = require('socket.io');
const moment = require('moment');

const User = require('./models/User.js');
const Log = require('./models/Log.js');

const app = express();
const server = http.createServer(app);
const io = socketIo(server, {
  cors: {
    origin: '*',
    methods: ['GET', 'POST']
  }
});

// Middleware
app.use(cors());
app.use(express.json())

// MongoDB Connection
mongoose.connect(process.env.MONGODB_URI)
  .then(() => console.log('Connected to MongoDB'))
  .catch(err => console.error('MongoDB connection error:', err));

// API Routes
app.get('/api/logs/entry', async (req, res) => {
  try {
    const { date } = req.query;
    let query = { type: 'entry' };
    
    if (date) {
      const startDate = new Date(date);
      const endDate = new Date(date);
      endDate.setDate(endDate.getDate() + 1);
      
      query.timestamp = {
        $gte: startDate,
        $lt: endDate
      };
    }
    
    const logs = await Log.find(query).sort({ timestamp: -1 });
    res.json(logs);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

app.get('/api/logs/exit', async (req, res) => {
  try {
    const { date } = req.query;
    let query = { type: 'exit' };
    
    if (date) {
      const startDate = new Date(date);
      const endDate = new Date(date);
      endDate.setDate(endDate.getDate() + 1);
      
      query.timestamp = {
        $gte: startDate,
        $lt: endDate
      };
    }
    
    const logs = await Log.find(query).sort({ timestamp: -1 });
    res.json(logs);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Download logs
app.get('/api/logs/download/entry', async (req, res) => {
  try {
    const { date } = req.query;
    let query = { type: 'entry' };
    
    if (date) {
      const startDate = new Date(date);
      const endDate = new Date(date);
      endDate.setDate(endDate.getDate() + 1);
      
      query.timestamp = {
        $gte: startDate,
        $lt: endDate
      };
    }
    
    const logs = await Log.find(query).sort({ timestamp: -1 });
    
    // Create CSV content
    const csvHeader = 'Name,Registration Number,RFID UID,Timestamp\n';
    const csvRows = logs.map(log => {
      const timestamp = moment(log.timestamp).format('YYYY-MM-DD HH:mm:ss');
      return `${log.name},${log.regNo},${log.rfidUID},${timestamp}`;
    }).join('\n');
    
    const csvContent = csvHeader + csvRows;
    
    res.setHeader('Content-Type', 'text/csv');
    res.setHeader('Content-Disposition', `attachment; filename=entry_logs_${date || 'all'}.csv`);
    res.send(csvContent);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

app.get('/api/logs/download/exit', async (req, res) => {
  try {
    const { date } = req.query;
    let query = { type: 'exit' };
    
    if (date) {
      const startDate = new Date(date);
      const endDate = new Date(date);
      endDate.setDate(endDate.getDate() + 1);
      
      query.timestamp = {
        $gte: startDate,
        $lt: endDate
      };
    }
    
    const logs = await Log.find(query).sort({ timestamp: -1 });
    
    // Create CSV content
    const csvHeader = 'Name,Registration Number,RFID UID,Timestamp\n';
    const csvRows = logs.map(log => {
      const timestamp = moment(log.timestamp).format('YYYY-MM-DD HH:mm:ss');
      return `${log.name},${log.regNo},${log.rfidUID},${timestamp}`;
    }).join('\n');
    
    const csvContent = csvHeader + csvRows;
    
    res.setHeader('Content-Type', 'text/csv');
    res.setHeader('Content-Disposition', `attachment; filename=exit_logs_${date || 'all'}.csv`);
    res.send(csvContent);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Socket.io connection
io.on('connection', (socket) => {
  console.log('New client connected');
  
  socket.on('disconnect', () => {
    console.log('Client disconnected');
  });
});

// Process RFID scan based on gate type
async function processRFIDScan(rfidUID, gateType) {
  try {
    // Find user with this RFID UID
    const user = await User.findOne({ rfidUID: rfidUID.trim() });
    
    if (user && user.isAuthorized) {
      // Create log entry
      const log = new Log({
        userId: user._id,
        name: user.name,
        regNo: user.regNo,
        rfidUID: user.rfidUID,
        type: gateType
      });
      
      await log.save();
      console.log(`${gateType.toUpperCase()} - Authorized access: ${user.name}`);
      
      // Emit the event to all connected clients
      io.emit(`${gateType}-update`, {
        name: user.name,
        regNo: user.regNo,
        rfidUID: user.rfidUID,
        timestamp: log.timestamp
      });
      
      // Send command to Arduino to open the gate
      // serialPort.write('OPEN\n', (err) => {
      //   if (err) {
      //     console.error('Error writing to serial port:', err);
      //   }
      // });
      // Send command to Arduino to open the correct gate
    const command = gateType === 'exit' ? 'OPEN_EXIT\n' : 'OPEN\n';
    serialPort.write(command, (err) => {
    if (err) {
      console.error('Error writing to serial port:', err);
      }
    });

    }else {
      // User not authorized or not found
      console.log(`${gateType.toUpperCase()} - Unauthorized access attempt: ${rfidUID}`);
      io.emit('unauthorized', { rfidUID: rfidUID.trim(), gateType });
    }
  } catch (error) {
    console.error('Error processing RFID data:', error);
  }
}

// Serial Port setup for Arduino - Single connection
let serialPort;

try {
  serialPort = new SerialPort({ path: process.env.ARDUINO_PORT || 'COM6', baudRate: 9600 });
  const parser = serialPort.pipe(new ReadlineParser({ delimiter: '\r\n' }));
  
  parser.on('data', async (data) => {
    console.log('RFID data received:', data);
    
    // Check if the data is in the expected format (UID|GateType)
    if (data.includes('|')) {
      // Parse the data (expected format: UID|GateType)
      const [rfidUID, gateType] = data.trim().split('|');
      
      // Process based on gate type (entry or exit)
      if (gateType === 'entry' || gateType === 'exit') {
        // Handle the RFID scan
        processRFIDScan(rfidUID, gateType);
      }
    } else {
      // Log any other messages from Arduino (like status messages)
      console.log('Arduino message:', data);
    }
  });
  
  console.log(`Connected to Arduino on port ${process.env.ARDUINO_PORT || 'COM3'}`);
} catch (error) {
  console.error('Error initializing serial port:', error);
  console.log('Continuing without Arduino connection. You can use the mock-rfid.js script for testing.');
}

// Start server
const PORT = process.env.PORT || 5000;
server.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});