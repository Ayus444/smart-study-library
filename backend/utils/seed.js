const mongoose = require('mongoose');
const dotenv = require('dotenv');
dotenv.config();

const User = require('../models/User');
const Student = require('../models/Student');
const Seat = require('../models/Seat');
const Payment = require('../models/Payment');
const Attendance = require('../models/Attendance');

const SHIFTS = ['Morning', 'Evening', 'Full Day'];
const NAMES = ['Rahul Sharma', 'Priya Patel', 'Amit Kumar', 'Sneha Gupta', 'Ravi Verma', 'Pooja Singh', 'Deepak Yadav', 'Anita Joshi', 'Vikram Mehta', 'Kavita Nair', 'Suresh Iyer', 'Rekha Pillai', 'Arjun Reddy', 'Meena Krishnan', 'Sanjay Dubey', 'Lalita Mishra', 'Rohit Tiwari', 'Sunita Pandey', 'Manish Agarwal', 'Geeta Chopra'];

async function seed() {
  try {
    await mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/smart-study-library');
    console.log('Connected to MongoDB');

    // Clear existing data
    await Promise.all([User.deleteMany(), Student.deleteMany(), Seat.deleteMany(), Payment.deleteMany(), Attendance.deleteMany()]);
    console.log('Cleared existing data');

    // Create admin user
    const admin = await User.create({ name: 'Admin', email: process.env.ADMIN_EMAIL || 'admin@library.com', password: process.env.ADMIN_PASSWORD || 'admin123', role: 'admin' });
    console.log('Admin created:', admin.email);

    // Create 50 seats
    const seats = [];
    for (let i = 1; i <= 50; i++) {
      seats.push({ seatNumber: i, row: Math.ceil(i / 10), column: ((i - 1) % 10) + 1 });
    }
    const createdSeats = await Seat.insertMany(seats);
    console.log('50 seats created');

    // Create 20 students
    const feeMap = { Morning: 800, Evening: 800, 'Full Day': 1500 };
    const students = [];
    for (let i = 0; i < 20; i++) {
      const shift = SHIFTS[i % 3];
      const joinDate = new Date();
      joinDate.setDate(joinDate.getDate() - Math.floor(Math.random() * 60));
      const dueDate = new Date(joinDate);
      dueDate.setMonth(dueDate.getMonth() + 1);
      const feeStatuses = ['Paid', 'Pending', 'Overdue'];
      const student = await Student.create({
        name: NAMES[i],
        phone: `98${String(10000000 + i * 111111).substring(0, 8)}`,
        email: `${NAMES[i].split(' ')[0].toLowerCase()}@example.com`,
        address: `${i + 1} Gandhi Nagar, Pune`,
        idProofType: 'Aadhar',
        idProofNumber: `${Math.floor(1000 + Math.random() * 9000)} ${Math.floor(1000 + Math.random() * 9000)} ${Math.floor(1000 + Math.random() * 9000)}`,
        shift,
        monthlyFee: feeMap[shift],
        seatId: createdSeats[i]._id,
        seatNumber: i + 1,
        feeStatus: feeStatuses[i % 3],
        joinDate, dueDate
      });
      await Seat.findByIdAndUpdate(createdSeats[i]._id, { isOccupied: true, studentId: student._id });
      
      // Create payment records
      const month = `${joinDate.getFullYear()}-${String(joinDate.getMonth() + 1).padStart(2, '0')}`;
      await Payment.create({
        studentId: student._id, amount: feeMap[shift], month,
        dueDate, status: feeStatuses[i % 3],
        paymentDate: feeStatuses[i % 3] === 'Paid' ? new Date() : null,
        paymentMethod: 'Cash'
      });

      // Attendance for last 7 days
      for (let d = 0; d < 7; d++) {
        const attDate = new Date();
        attDate.setDate(attDate.getDate() - d);
        const ds = attDate.toISOString().split('T')[0];
        await Attendance.create({ studentId: student._id, date: attDate, dateString: ds, present: Math.random() > 0.3 });
      }

      students.push(student);
    }
    console.log('20 students created with attendance and payments');
    console.log('\n✅ Seed complete!');
    console.log('Login: admin@library.com / admin123');
    process.exit(0);
  } catch (err) {
    console.error('Seed error:', err);
    process.exit(1);
  }
}

seed();
