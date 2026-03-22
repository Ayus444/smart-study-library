const mongoose = require('mongoose');

const studentSchema = new mongoose.Schema({
  name: { type: String, required: true, trim: true },
  phone: { type: String, required: true, unique: true, trim: true },
  email: { type: String, trim: true, lowercase: true },
  address: { type: String, trim: true },
  idProofType: { type: String, enum: ['Aadhar', 'PAN', 'Passport', 'Voter ID', 'Driving License'], default: 'Aadhar' },
  idProofNumber: { type: String, trim: true },
  photo: { type: String, default: null },
  seatId: { type: mongoose.Schema.Types.ObjectId, ref: 'Seat', default: null },
  seatNumber: { type: Number, default: null },
  shift: { type: String, enum: ['Morning', 'Evening', 'Full Day'], required: true },
  monthlyFee: { type: Number, required: true },
  feeStatus: { type: String, enum: ['Paid', 'Pending', 'Overdue'], default: 'Pending' },
  joinDate: { type: Date, default: Date.now },
  dueDate: { type: Date },
  isActive: { type: Boolean, default: true },
  role: { type: String, enum: ['student', 'staff'], default: 'student' },
  notes: { type: String }
}, { timestamps: true });

studentSchema.pre('save', function(next) {
  if (!this.dueDate) {
    const due = new Date(this.joinDate || Date.now());
    due.setMonth(due.getMonth() + 1);
    this.dueDate = due;
  }
  next();
});

module.exports = mongoose.model('Student', studentSchema);
