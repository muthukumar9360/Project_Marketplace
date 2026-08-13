const mongoose = require('mongoose');

const SettingSchema = new mongoose.Schema({
  globalId: { type: String, default: 'global', unique: true },
  upiId: { type: String, default: '' },
  sellerName: { type: String, default: '' },
  developerTitle: { type: String, default: '' },
  githubProfile: { type: String, default: '' },
  linkedinProfile: { type: String, default: '' },
  leetcodeProfile: { type: String, default: '' },
  portfolioUrl: { type: String, default: '' },
  adminUsername: { type: String, default: 'muthukumar_9360' },
  adminPassword: { type: String, default: 'Muthukumar@9360' },
  adminFcmToken: { type: String, default: '' }
});

module.exports = mongoose.model('Setting', SettingSchema);
