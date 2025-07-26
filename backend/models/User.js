const mongoose = require('mongoose');

const userSchema = new mongoose.Schema({
  name: {
    type: String,
    required: true
  },
  regNo: {
    type: String,
    required: true,
    unique: true
  },
  rfidUID: {
    type: String,
    required: true,
    unique: true
  },
  isAuthorized: {
    type: Boolean,
    default: true
  }
});

module.exports = mongoose.model('User', userSchema);