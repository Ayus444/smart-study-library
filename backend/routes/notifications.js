const express = require('express');
const router = express.Router();
const Student = require('../models/Student');
const { protect } = require('../middleware/auth');

// GET /api/notifications - Get pending alerts
router.get('/', protect, async (req, res) => {
  try {
    const today = new Date();
    const threeDaysLater = new Date(today);
    threeDaysLater.setDate(threeDaysLater.getDate() + 3);

    const overdueStudents = await Student.find({ feeStatus: 'Overdue', isActive: true })
      .select('name phone dueDate seatNumber').limit(20);
    
    const dueSoonStudents = await Student.find({
      feeStatus: 'Pending', isActive: true,
      dueDate: { $gte: today, $lte: threeDaysLater }
    }).select('name phone dueDate seatNumber').limit(20);

    const notifications = [
      ...overdueStudents.map(s => ({
        type: 'overdue', priority: 'high',
        message: `${s.name} (Seat ${s.seatNumber || 'N/A'}) - Fee overdue`,
        student: s
      })),
      ...dueSoonStudents.map(s => ({
        type: 'due_soon', priority: 'medium',
        message: `${s.name} (Seat ${s.seatNumber || 'N/A'}) - Fee due ${s.dueDate?.toLocaleDateString()}`,
        student: s
      }))
    ];

    res.json({ success: true, notifications, counts: { overdue: overdueStudents.length, dueSoon: dueSoonStudents.length } });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

// POST /api/notifications/send-reminder - Mock WhatsApp/SMS reminder
router.post('/send-reminder', protect, async (req, res) => {
  try {
    const { studentId, type = 'whatsapp' } = req.body;
    const student = await Student.findById(studentId);
    if (!student) return res.status(404).json({ success: false, message: 'Student not found' });

    // Mock notification - in production integrate Twilio/WhatsApp Business API
    const message = `Dear ${student.name}, your library fee of ₹${student.monthlyFee} is due on ${student.dueDate?.toLocaleDateString()}. Please pay at the earliest. - Smart Study Library`;

    console.log(`[MOCK ${type.toUpperCase()}] To: ${student.phone} | Message: ${message}`);

    res.json({
      success: true,
      message: `Reminder sent via ${type} (mock)`,
      details: { phone: student.phone, messagePreview: message }
    });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

module.exports = router;
