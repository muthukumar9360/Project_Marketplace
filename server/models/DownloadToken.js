const mongoose = require('mongoose');

const DownloadTokenSchema = new mongoose.Schema({
  token: { type: String, required: true, unique: true },
  projectId: { type: String, required: true },
  requestId: { type: String, required: true },
  expiresAt: { type: Date, required: true, expires: 0 } // Auto-delete token when it expires
});

module.exports = mongoose.model('DownloadToken', DownloadTokenSchema);
