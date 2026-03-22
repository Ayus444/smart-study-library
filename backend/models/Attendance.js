const mongoose = require('mongoose');

const attendanceSchema = new mongoose.Schema({
  studentId: { type: mongoose.Schema.Types.ObjectId, ref: 'Student', required: true },
  date: { type: Date, required: true },
  dateString: { type: String, required: true }, // "YYYY-MM-DD" for easy querying
  present: { type: Boolean, default: false },
  checkInTime: { type: Date },
  checkOutTime: { type: Date },
  markedBy: { type: String, enum: ['manual', 'qr'], default: 'manual' },
  notes: { type: String }
}, { timestamps: true });

attendanceSchema.index({ studentId: 1, dateString: 1 }, { unique: true });

module.exports = mongoose.model('Attendance', attendanceSchema);
