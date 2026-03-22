const mongoose = require('mongoose');

const paymentSchema = new mongoose.Schema({
  studentId: { type: mongoose.Schema.Types.ObjectId, ref: 'Student', required: true },
  amount: { type: Number, required: true },
  month: { type: String, required: true }, // e.g., "2024-01"
  paymentDate: { type: Date, default: Date.now },
  dueDate: { type: Date, required: true },
  status: { type: String, enum: ['Paid', 'Pending', 'Overdue'], default: 'Pending' },
  paymentMethod: { type: String, enum: ['Cash', 'UPI', 'Bank Transfer', 'Other'], default: 'Cash' },
  transactionId: { type: String },
  notes: { type: String },
  collectedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User', default: null }
}, { timestamps: true });

module.exports = mongoose.model('Payment', paymentSchema);
