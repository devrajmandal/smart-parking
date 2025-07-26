require('dotenv').config();
const mongoose = require('mongoose');
const User = require('./models/User');

// MongoDB Connection
mongoose.connect(process.env.MONGODB_URI)
  .then(() => console.log('Connected to MongoDB'))
  .catch(err => console.error('MongoDB connection error:', err));

// Sample users with RFID UIDs
const users = [
  {
    name: 'Abhijeet',
    regNo: 'REG001',
    rfidUID: 'BF5A871F',
    isAuthorized: true
  },
  {
    name: 'Abhilash',
    regNo: 'REG002',
    rfidUID: '94B96BB0',
    isAuthorized: true
  },
];

// Function to seed database
async function seedDatabase() {
  try {
    // Clear existing users
    await User.deleteMany({});
    console.log('Cleared existing users');

    // Add new users
    const result = await User.insertMany(users);
    console.log(`Added ${result.length} users to the database`);

    // Disconnect from MongoDB
    mongoose.disconnect();
    console.log('Database seeding completed');
  } catch (error) {
    console.error('Error seeding database:', error);
    mongoose.disconnect();
  }
}

// Run seeding function
seedDatabase();