const mongoose = require('mongoose');

const seatSchema = new mongoose.Schema({
  seatNumber: { type: Number, required: true, unique: true },
  isOccupied: { type: Boolean, default: false },
  studentId: { type: mongoose.Schema.Types.ObjectId, ref: 'Student', default: null },
  row: { type: Number },
  column: { type: Number },
  section: { type: String, default: 'A' },
  isActive: { type: Boolean, default: true }
}, { timestamps: true });

module.exports = mongoose.model('Seat', seatSchema);
