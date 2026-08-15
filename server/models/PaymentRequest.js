const mongoose = require('mongoose');

const PaymentRequestSchema = new mongoose.Schema({
  id: { type: String, required: true, unique: true },
  projectId: { type: String, required: true },
  projectName: { type: String, required: true },
  amount: { type: Number, required: true },
  status: { type: String, enum: ['PENDING', 'ACCEPTED', 'DECLINED', 'DOWNLOADED'], default: 'PENDING' },
  sessionToken: { type: String, required: true },
  expiresAt: { type: Date }
});

module.exports = mongoose.model('PaymentRequest', PaymentRequestSchema);
