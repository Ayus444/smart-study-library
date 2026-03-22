const express = require('express');
const router = express.Router();
const multer = require('multer');
const path = require('path');
const fs = require('fs');
const Student = require('../models/Student');
const Seat = require('../models/Seat');
const Payment = require('../models/Payment');
const { protect } = require('../middleware/auth');

// Configure multer
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    const dir = path.join(__dirname, '../uploads/photos');
    if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
    cb(null, dir);
  },
  filename: (req, file, cb) => {
    cb(null, `student_${Date.now()}${path.extname(file.originalname)}`);
  }
});
const upload = multer({ storage, limits: { fileSize: 5 * 1024 * 1024 } });

// GET /api/students
router.get('/', protect, async (req, res) => {
  try {
    const { search, shift, feeStatus, page = 1, limit = 50 } = req.query;
    const query = { isActive: true };
    if (search) query.$or = [{ name: { $regex: search, $options: 'i' } }, { phone: { $regex: search, $options: 'i' } }];
    if (shift) query.shift = shift;
    if (feeStatus) query.feeStatus = feeStatus;
    const students = await Student.find(query)
      .populate('seatId', 'seatNumber')
      .sort({ createdAt: -1 })
      .skip((page - 1) * limit)
      .limit(parseInt(limit));
    const total = await Student.countDocuments(query);
    res.json({ success: true, students, total, page: parseInt(page), totalPages: Math.ceil(total / limit) });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

// GET /api/students/:id
router.get('/:id', protect, async (req, res) => {
  try {
    const student = await Student.findById(req.params.id).populate('seatId');
    if (!student) return res.status(404).json({ success: false, message: 'Student not found' });
    res.json({ success: true, student });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

// POST /api/students
router.post('/', protect, upload.single('photo'), async (req, res) => {
  try {
    const { name, phone, email, address, idProofType, idProofNumber, shift, monthlyFee, seatNumber, notes, joinDate } = req.body;
    const existing = await Student.findOne({ phone });
    if (existing) return res.status(400).json({ success: false, message: 'Phone number already registered' });
    
    let seatId = null;
    if (seatNumber) {
      const seat = await Seat.findOne({ seatNumber: parseInt(seatNumber), isOccupied: false });
      if (!seat) return res.status(400).json({ success: false, message: 'Seat not available' });
      seatId = seat._id;
    }

    const student = await Student.create({
      name, phone, email, address, idProofType, idProofNumber, shift,
      monthlyFee: parseFloat(monthlyFee),
      seatId, seatNumber: seatNumber ? parseInt(seatNumber) : null,
      photo: req.file ? `/uploads/photos/${req.file.filename}` : null,
      notes, joinDate: joinDate ? new Date(joinDate) : new Date()
    });

    if (seatId) {
      await Seat.findByIdAndUpdate(seatId, { isOccupied: true, studentId: student._id });
    }

    // Create first payment record
    const dueDate = new Date(student.joinDate);
    dueDate.setMonth(dueDate.getMonth() + 1);
    const month = `${student.joinDate.getFullYear()}-${String(student.joinDate.getMonth() + 1).padStart(2, '0')}`;
    await Payment.create({ studentId: student._id, amount: parseFloat(monthlyFee), month, dueDate, status: 'Pending' });

    res.status(201).json({ success: true, message: 'Student added successfully', student });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

// PUT /api/students/:id
router.put('/:id', protect, upload.single('photo'), async (req, res) => {
  try {
    const student = await Student.findById(req.params.id);
    if (!student) return res.status(404).json({ success: false, message: 'Student not found' });

    const { name, phone, email, address, idProofType, idProofNumber, shift, monthlyFee, seatNumber, feeStatus, notes } = req.body;

    // Handle seat change
    if (seatNumber && parseInt(seatNumber) !== student.seatNumber) {
      if (student.seatId) {
        await Seat.findByIdAndUpdate(student.seatId, { isOccupied: false, studentId: null });
      }
      const newSeat = await Seat.findOne({ seatNumber: parseInt(seatNumber), isOccupied: false });
      if (!newSeat) return res.status(400).json({ success: false, message: 'Seat not available' });
      await Seat.findByIdAndUpdate(newSeat._id, { isOccupied: true, studentId: student._id });
      student.seatId = newSeat._id;
      student.seatNumber = parseInt(seatNumber);
    }

    if (name) student.name = name;
    if (phone) student.phone = phone;
    if (email !== undefined) student.email = email;
    if (address !== undefined) student.address = address;
    if (idProofType) student.idProofType = idProofType;
    if (idProofNumber !== undefined) student.idProofNumber = idProofNumber;
    if (shift) student.shift = shift;
    if (monthlyFee) student.monthlyFee = parseFloat(monthlyFee);
    if (feeStatus) student.feeStatus = feeStatus;
    if (notes !== undefined) student.notes = notes;
    if (req.file) student.photo = `/uploads/photos/${req.file.filename}`;

    await student.save();
    res.json({ success: true, message: 'Student updated', student });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

// DELETE /api/students/:id
router.delete('/:id', protect, async (req, res) => {
  try {
    const student = await Student.findById(req.params.id);
    if (!student) return res.status(404).json({ success: false, message: 'Student not found' });
    if (student.seatId) {
      await Seat.findByIdAndUpdate(student.seatId, { isOccupied: false, studentId: null });
    }
    student.isActive = false;
    student.seatId = null;
    student.seatNumber = null;
    await student.save();
    res.json({ success: true, message: 'Student removed' });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

// GET /api/students/export/csv
router.get('/export/csv', protect, async (req, res) => {
  try {
    const students = await Student.find({ isActive: true }).sort({ name: 1 });
    const csvRows = ['Name,Phone,Email,Shift,Seat Number,Monthly Fee,Fee Status,Join Date,Due Date'];
    students.forEach(s => {
      csvRows.push(`"${s.name}","${s.phone}","${s.email || ''}","${s.shift}","${s.seatNumber || 'N/A'}","${s.monthlyFee}","${s.feeStatus}","${s.joinDate?.toLocaleDateString()}","${s.dueDate?.toLocaleDateString()}"`);
    });
    res.setHeader('Content-Type', 'text/csv');
    res.setHeader('Content-Disposition', 'attachment; filename=students.csv');
    res.send(csvRows.join('\n'));
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

module.exports = router;
