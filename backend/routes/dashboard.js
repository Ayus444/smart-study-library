const express = require('express');
const router = express.Router();
const Student = require('../models/Student');
const Seat = require('../models/Seat');
const Payment = require('../models/Payment');
const Attendance = require('../models/Attendance');
const { protect } = require('../middleware/auth');

router.get('/', protect, async (req, res) => {
  try {
    const today = new Date().toISOString().split('T')[0];
    const currentMonth = today.substring(0, 7);

    const [totalStudents, occupiedSeats, totalSeats, paidPayments, pendingPayments, overduePayments, overdueStudents, todayAttendance, monthlyRevenue] = await Promise.all([
      Student.countDocuments({ isActive: true }),
      Seat.countDocuments({ isOccupied: true }),
      Seat.countDocuments({ isActive: true }),
      Payment.countDocuments({ status: 'Paid', month: currentMonth }),
      Student.countDocuments({ feeStatus: 'Pending', isActive: true }),
      Student.countDocuments({ feeStatus: 'Overdue', isActive: true }),
      Student.find({ feeStatus: 'Overdue', isActive: true }).select('name phone dueDate seatNumber shift').limit(10),
      Attendance.countDocuments({ dateString: today, present: true }),
      Payment.aggregate([
        { $match: { status: 'Paid', month: currentMonth } },
        { $group: { _id: null, total: { $sum: '$amount' } } }
      ])
    ]);

    const revenueData = await Payment.aggregate([
      { $match: { status: 'Paid' } },
      { $group: { _id: '$month', revenue: { $sum: '$amount' }, count: { $sum: 1 } } },
      { $sort: { _id: 1 } },
      { $limit: 6 }
    ]);

    const shiftDistribution = await Student.aggregate([
      { $match: { isActive: true } },
      { $group: { _id: '$shift', count: { $sum: 1 } } }
    ]);

    res.json({
      success: true,
      stats: {
        totalStudents,
        occupiedSeats,
        availableSeats: totalSeats - occupiedSeats,
        totalSeats,
        paidThisMonth: paidPayments,
        pendingPayments,
        overduePayments,
        todayAttendance,
        monthlyRevenue: monthlyRevenue[0]?.total || 0
      },
      overdueStudents,
      revenueData,
      shiftDistribution
    });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

module.exports = router;
