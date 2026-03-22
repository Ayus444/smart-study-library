const express = require('express');
const router = express.Router();
const Seat = require('../models/Seat');
const Student = require('../models/Student');
const { protect } = require('../middleware/auth');

// GET /api/seats
router.get('/', protect, async (req, res) => {
  try {
    const seats = await Seat.find({ isActive: true })
      .populate('studentId', 'name phone shift feeStatus')
      .sort({ seatNumber: 1 });
    res.json({ success: true, seats });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

// POST /api/seats/initialize — creates seats from 1 to totalSeats (first time only)
router.post('/initialize', protect, async (req, res) => {
  try {
    const { totalSeats = 50 } = req.body;
    const existing = await Seat.countDocuments();
    if (existing > 0) return res.status(400).json({ success: false, message: 'Seats already initialized. Use /add-more to add additional seats.' });
    const seats = [];
    for (let i = 1; i <= totalSeats; i++) {
      seats.push({ seatNumber: i, row: Math.ceil(i / 10), column: ((i - 1) % 10) + 1 });
    }
    await Seat.insertMany(seats);
    res.json({ success: true, message: `${totalSeats} seats initialized` });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

// POST /api/seats/add-more — adds N more seats continuing from last seat number
router.post('/add-more', protect, async (req, res) => {
  try {
    const { count = 10 } = req.body;
    if (count < 1 || count > 200) {
      return res.status(400).json({ success: false, message: 'Count must be between 1 and 200' });
    }
    // Find the highest existing seat number
    const lastSeat = await Seat.findOne().sort({ seatNumber: -1 });
    const startFrom = lastSeat ? lastSeat.seatNumber + 1 : 1;
    const seats = [];
    for (let i = 0; i < count; i++) {
      const num = startFrom + i;
      seats.push({ seatNumber: num, row: Math.ceil(num / 10), column: ((num - 1) % 10) + 1 });
    }
    await Seat.insertMany(seats);
    res.json({
      success: true,
      message: `${count} seats added (Seat ${startFrom} to ${startFrom + count - 1})`,
      addedFrom: startFrom,
      addedTo: startFrom + count - 1
    });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

// DELETE /api/seats/:id — remove a seat (only if unoccupied)
router.delete('/:id', protect, async (req, res) => {
  try {
    const seat = await Seat.findById(req.params.id);
    if (!seat) return res.status(404).json({ success: false, message: 'Seat not found' });
    if (seat.isOccupied) return res.status(400).json({ success: false, message: 'Cannot delete an occupied seat. Remove student first.' });
    await Seat.findByIdAndDelete(req.params.id);
    res.json({ success: true, message: `Seat ${seat.seatNumber} deleted` });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

// PUT /api/seats/:id/assign
router.put('/:id/assign', protect, async (req, res) => {
  try {
    const { studentId } = req.body;
    const seat = await Seat.findById(req.params.id);
    if (!seat) return res.status(404).json({ success: false, message: 'Seat not found' });
    if (seat.isOccupied) return res.status(400).json({ success: false, message: 'Seat already occupied' });
    const student = await Student.findById(studentId);
    if (!student) return res.status(404).json({ success: false, message: 'Student not found' });
    if (student.seatId) {
      await Seat.findByIdAndUpdate(student.seatId, { isOccupied: false, studentId: null });
    }
    seat.isOccupied = true;
    seat.studentId = studentId;
    await seat.save();
    student.seatId = seat._id;
    student.seatNumber = seat.seatNumber;
    await student.save();
    res.json({ success: true, message: 'Student assigned to seat', seat });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

// PUT /api/seats/:id/remove
router.put('/:id/remove', protect, async (req, res) => {
  try {
    const seat = await Seat.findById(req.params.id);
    if (!seat) return res.status(404).json({ success: false, message: 'Seat not found' });
    if (seat.studentId) {
      await Student.findByIdAndUpdate(seat.studentId, { seatId: null, seatNumber: null });
    }
    seat.isOccupied = false;
    seat.studentId = null;
    await seat.save();
    res.json({ success: true, message: 'Seat cleared', seat });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

module.exports = router;
