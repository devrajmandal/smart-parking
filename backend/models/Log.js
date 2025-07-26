const mongoose = require('mongoose');

const logSchema = new mongoose.Schema({
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  name: {
    type: String,
    required: true
  },
  regNo: {
    type: String,
    required: true
  },
  rfidUID: {
    type: String,
    required: true
  },
  type: {
    type: String,
    enum: ['entry', 'exit'],
    required: true
  },
  timestamp: {
    type: Date,
    default: Date.now
  }
});

module.exports = mongoose.model('Log', logSchema);