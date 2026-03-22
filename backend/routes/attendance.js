const express = require('express');
const router = express.Router();
const QRCode = require('qrcode');
const Attendance = require('../models/Attendance');
const Student = require('../models/Student');
const { protect } = require('../middleware/auth');

// GET /api/attendance
router.get('/', protect, async (req, res) => {
  try {
    const { date, studentId, month } = req.query;
    const query = {};
    if (date) query.dateString = date;
    if (studentId) query.studentId = studentId;
    if (month) query.dateString = { $regex: `^${month}` };
    const attendance = await Attendance.find(query)
      .populate('studentId', 'name phone shift seatNumber')
      .sort({ date: -1 });
    res.json({ success: true, attendance });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

// POST /api/attendance/mark
router.post('/mark', protect, async (req, res) => {
  try {
    const { studentId, date, present, notes } = req.body;
    const dateString = date || new Date().toISOString().split('T')[0];
    const attendance = await Attendance.findOneAndUpdate(
      { studentId, dateString },
      { studentId, date: new Date(dateString), dateString, present: !!present, notes, checkInTime: present ? new Date() : null },
      { upsert: true, new: true }
    );
    res.json({ success: true, attendance });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

// POST /api/attendance/bulk
router.post('/bulk', protect, async (req, res) => {
  try {
    const { date, records } = req.body; // records: [{studentId, present}]
    const dateString = date || new Date().toISOString().split('T')[0];
    const ops = records.map(r => ({
      updateOne: {
        filter: { studentId: r.studentId, dateString },
        update: { $set: { studentId: r.studentId, date: new Date(dateString), dateString, present: !!r.present, checkInTime: r.present ? new Date() : null } },
        upsert: true
      }
    }));
    await Attendance.bulkWrite(ops);
    res.json({ success: true, message: 'Bulk attendance saved' });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

// GET /api/attendance/qr/:studentId
router.get('/qr/:studentId', protect, async (req, res) => {
  try {
    const student = await Student.findById(req.params.studentId);
    if (!student) return res.status(404).json({ success: false, message: 'Student not found' });
    const qrData = JSON.stringify({ studentId: student._id, name: student.name, timestamp: Date.now() });
    const qrCode = await QRCode.toDataURL(qrData);
    res.json({ success: true, qrCode, student: { name: student.name, id: student._id } });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

// POST /api/attendance/qr-checkin
router.post('/qr-checkin', async (req, res) => {
  try {
    const { qrData } = req.body;
    const parsed = JSON.parse(qrData);
    const { studentId } = parsed;
    const dateString = new Date().toISOString().split('T')[0];
    const attendance = await Attendance.findOneAndUpdate(
      { studentId, dateString },
      { studentId, date: new Date(), dateString, present: true, checkInTime: new Date(), markedBy: 'qr' },
      { upsert: true, new: true }
    );
    const student = await Student.findById(studentId).select('name shift seatNumber');
    res.json({ success: true, message: 'Check-in successful', attendance, student });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

// GET /api/attendance/stats/:studentId
router.get('/stats/:studentId', protect, async (req, res) => {
  try {
    const { month } = req.query;
    const query = { studentId: req.params.studentId };
    if (month) query.dateString = { $regex: `^${month}` };
    const records = await Attendance.find(query);
    const totalDays = records.length;
    const presentDays = records.filter(r => r.present).length;
    const percentage = totalDays > 0 ? Math.round((presentDays / totalDays) * 100) : 0;
    res.json({ success: true, stats: { totalDays, presentDays, absentDays: totalDays - presentDays, percentage } });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

module.exports = router;
