# Smart Parking System

An IoT-based smart parking system that uses RFID technology for vehicle access control with real-time monitoring and data logging capabilities.

## 🚗 Project Overview

This project implements a complete smart parking solution that includes:
- RFID-based access control for entry and exit gates
- Real-time monitoring dashboard
- MongoDB database for user management and logging
- Servo motor controlled gates
- Date-wise filtering and data export functionality

## 🛠️ Hardware Components

- **Arduino Uno** - Main microcontroller
- **2x MFRC522 RFID Readers** - For entry and exit detection
- **Servo Motor** - Gate control mechanism
- **RFID Tags/Cards** - User identification
- **Jumper Wires & Breadboard** - Connections

### Hardware Connections

| Component | Arduino Pin |
|-----------|-------------|
| Entry RFID (SS) | Pin 10 |
| Entry RFID (RST) | Pin 9 |
| Exit RFID (SS) | Pin 7 |
| Exit RFID (RST) | Pin 6 |
| Servo Motor | Pin 8 |
| SPI MOSI | Pin 11 |
| SPI MISO | Pin 12 |
| SPI SCK | Pin 13 |

## 💻 Software Stack

### Backend
- **Node.js** - Runtime environment
- **Express.js** - Web framework
- **MongoDB** - Database (using MongoDB Atlas)
- **Socket.io** - Real-time communication
- **SerialPort** - Arduino communication

### Frontend
- **HTML5/CSS3/JavaScript** - Web interface
- **Bootstrap 5** - UI framework
- **Socket.io Client** - Real-time updates
- **Moment.js** - Date/time formatting

## 📁 Project Structure

```
smart-parking-system/
├── backend/
│   ├── models/
│   │   ├── User.js
│   │   └── Log.js
│   ├── server.js
│   ├── seed.js
│   ├── mock-rfid.js
│   ├── package.json
│   └── .env
├── frontend/
│   ├── src/
│   │   ├── index.html
│   │   └── index.js
│   └── package.json
├── arduino/
│   └── smart_parking.ino
└── README.md
```

## 🚀 Installation & Setup

### Prerequisites
- Node.js (v14 or higher)
- MongoDB Atlas account
- Arduino IDE
- USB cable for Arduino connection

### Step 1: Clone the Repository
```bash
git clone <repository-url>
cd smart-parking-system
```

### Step 2: Backend Setup
```bash
cd backend
npm init -y
npm install express mongoose cors socket.io serialport moment dotenv
```

Create a `.env` file in the backend directory:
```env
MONGODB_URI=mongodb+srv://username:password@cluster0.mongodb.net/smart-parking
ARDUINO_PORT=COM3
PORT=5000
```

### Step 3: Frontend Setup
```bash
cd ../frontend
npm init -y
npm install parcel-bundler socket.io-client moment
```

### Step 4: Database Setup
Seed the database with initial user data:
```bash
cd backend
node seed.js
```

### Step 5: Arduino Setup
1. Open `arduino/smart_parking.ino` in Arduino IDE
2. Install required libraries:
   - MFRC522 library
   - Servo library (built-in)
3. Upload the code to your Arduino Uno

## 🎯 Usage

### Starting the Application

1. **Start the Backend Server:**
```bash
cd backend
node server.js
```

2. **Start the Frontend Development Server:**
```bash
cd frontend
npm run start
```

3. **Access the Dashboard:**
Open your browser and navigate to `http://localhost:1234`

### Demo Mode (If Arduino isn't available)
```bash
cd backend
node mock-rfid.js
```

## 🔧 Features

### Real-time Monitoring
- Live updates when vehicles enter or exit
- Connection status indicator
- Recent activity log

### Access Control
- RFID-based authentication
- Authorized user database
- Automatic gate control

### Data Management
- Date-wise log filtering
- CSV export for entry/exit logs
- MongoDB data persistence

### User Interface
- Responsive design
- Modern Bootstrap UI
- Real-time notifications

## 📊 Database Schema

### Users Collection
```javascript
{
  name: String,           // User's full name
  regNo: String,          // Registration number
  rfidUID: String,        // RFID card UID
  isAuthorized: Boolean   // Authorization status
}
```

### Logs Collection
```javascript
{
  userId: ObjectId,       // Reference to User
  name: String,           // User's name
  regNo: String,          // Registration number
  rfidUID: String,        // RFID card UID
  type: String,           // 'entry' or 'exit'
  timestamp: Date         // Log timestamp
}
```

## 🔌 API Endpoints

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/logs/entry` | Get entry logs |
| GET | `/api/logs/exit` | Get exit logs |
| GET | `/api/logs/download/entry` | Download entry logs as CSV |
| GET | `/api/logs/download/exit` | Download exit logs as CSV |

### Query Parameters
- `date` - Filter logs by specific date (YYYY-MM-DD format)

## 🔄 Real-time Events

### Socket.io Events
- `entry-update` - New entry detected
- `exit-update` - New exit detected
- `unauthorized` - Unauthorized access attempt

## ⚡ Arduino Communication Protocol

The Arduino sends data to the backend in the format:
```
RFID_UID|GATE_TYPE
```

Example:
```
DF3489C1|entry
DF3489C1|exit
```

## 🐛 Troubleshooting

### Common Issues

1. **Arduino not connecting:**
   - Check COM port in `.env` file
   - Verify USB connection
   - Use Device Manager to find correct port

2. **MongoDB connection failed:**
   - Verify connection string in `.env`
   - Check network connectivity
   - Ensure MongoDB Atlas cluster is running

3. **RFID not reading:**
   - Check wiring connections
   - Verify RFID library installation
   - Test with known working RFID cards

4. **Frontend not updating:**
   - Check Socket.io connection
   - Verify backend server is running
   - Check browser console for errors

### Testing Without Hardware
Use the mock RFID script for demonstration:
```bash
cd backend
node mock-rfid.js
```

## 📝 Adding New Users

To add authorized users to the system:

1. Update the `backend/seed.js` file with new user data
2. Run the seeding script:
```bash
node seed.js
```

Or add users directly to MongoDB Atlas through their web interface.

## 🔒 Security Considerations

- RFID UIDs are stored in plain text (suitable for demo purposes)
- No encryption implemented in current version
- Access control based on database authorization flags
