const mongoose = require('mongoose');

const DownloadTokenSchema = new mongoose.Schema({
  token: { type: String, required: true, unique: true },
  projectId: { type: String, required: true },
  requestId: { type: String, required: true },
  expiresAt: { type: Date },
  used: { type: Boolean, default: false },
  expired: { type: Boolean, default: false }
});

module.exports = mongoose.model('DownloadToken', DownloadTokenSchema);
