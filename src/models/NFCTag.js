const mongoose = require('mongoose');

// NFC tags are pre-saved in DB (admin/seeded). User does not register tags.
// At login, user scans NFC; backend validates tag exists and is active.
const nfcTagSchema = new mongoose.Schema(
  {
    tagId: { type: String, required: true, unique: true },
    status: { type: String, enum: ['active', 'revoked'], default: 'active' }
  },
  { timestamps: true }
);

module.exports = mongoose.model('NFCTag', nfcTagSchema);
