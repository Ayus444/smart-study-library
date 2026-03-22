const express = require('express');
const router = express.Router();
const Payment = require('../models/Payment');
const Student = require('../models/Student');
const { protect } = require('../middleware/auth');

// GET /api/payments
router.get('/', protect, async (req, res) => {
  try {
    const { studentId, status, month, page = 1, limit = 50 } = req.query;
    const query = {};
    if (studentId) query.studentId = studentId;
    if (status) query.status = status;
    if (month) query.month = month;
    const payments = await Payment.find(query)
      .populate('studentId', 'name phone shift seatNumber')
      .sort({ dueDate: -1 })
      .skip((page - 1) * limit)
      .limit(parseInt(limit));
    const total = await Payment.countDocuments(query);
    res.json({ success: true, payments, total });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

// POST /api/payments
router.post('/', protect, async (req, res) => {
  try {
    const { studentId, amount, month, paymentMethod, transactionId, notes } = req.body;
    const student = await Student.findById(studentId);
    if (!student) return res.status(404).json({ success: false, message: 'Student not found' });

    const dueDate = new Date(`${month}-01`);
    dueDate.setMonth(dueDate.getMonth() + 1);

    const payment = await Payment.create({
      studentId, amount: parseFloat(amount), month, dueDate,
      status: 'Paid', paymentDate: new Date(), paymentMethod, transactionId, notes,
      collectedBy: req.user._id
    });

    // Update student fee status and due date
    const nextDue = new Date(dueDate);
    nextDue.setMonth(nextDue.getMonth() + 1);
    await Student.findByIdAndUpdate(studentId, { feeStatus: 'Paid', dueDate: nextDue });

    res.status(201).json({ success: true, message: 'Payment recorded', payment });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

// GET /api/payments/monthly-revenue
router.get('/monthly-revenue', protect, async (req, res) => {
  try {
    const data = await Payment.aggregate([
      { $match: { status: 'Paid' } },
      { $group: { _id: '$month', revenue: { $sum: '$amount' }, count: { $sum: 1 } } },
      { $sort: { _id: 1 } },
      { $limit: 12 }
    ]);
    res.json({ success: true, data });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

// PUT /api/payments/:id
router.put('/:id', protect, async (req, res) => {
  try {
    const payment = await Payment.findByIdAndUpdate(req.params.id, req.body, { new: true });
    if (!payment) return res.status(404).json({ success: false, message: 'Payment not found' });
    res.json({ success: true, payment });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

// POST /api/payments/update-overdue
router.post('/update-overdue', protect, async (req, res) => {
  try {
    const today = new Date();
    const result = await Payment.updateMany(
      { status: 'Pending', dueDate: { $lt: today } },
      { $set: { status: 'Overdue' } }
    );
    // Update students too
    const overduePayments = await Payment.find({ status: 'Overdue' }).distinct('studentId');
    await Student.updateMany({ _id: { $in: overduePayments } }, { feeStatus: 'Overdue' });
    res.json({ success: true, message: `${result.modifiedCount} payments marked overdue` });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

module.exports = router;
