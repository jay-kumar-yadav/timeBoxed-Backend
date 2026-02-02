const mongoose = require('mongoose');

const userSchema = new mongoose.Schema(
  {
    identifier: { type: String, required: true, unique: true },
    type: { type: String, enum: ['email', 'phone'], required: true }
  },
  { timestamps: true }
);

module.exports = mongoose.model('User', userSchema);
