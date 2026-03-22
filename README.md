# 📚 Smart Study Library System (Abhyasika)

A complete full-stack web application for managing Indian-style study libraries with seat allocation, shifts, fee tracking, attendance, and more.

---

## 🗂 Project Structure

```
smart-study-library/
├── backend/                   # Node.js + Express + MongoDB
│   ├── middleware/
│   │   └── auth.js            # JWT auth middleware
│   ├── models/
│   │   ├── User.js            # Admin/staff accounts
│   │   ├── Student.js         # Student profiles
│   │   ├── Seat.js            # Seat layout
│   │   ├── Payment.js         # Fee records
│   │   └── Attendance.js      # Daily attendance
│   ├── routes/
│   │   ├── auth.js            # Login / me
│   │   ├── students.js        # CRUD + CSV export
│   │   ├── seats.js           # Seat management
│   │   ├── payments.js        # Payment tracking
│   │   ├── attendance.js      # Attendance + QR
│   │   ├── dashboard.js       # Stats aggregation
│   │   └── notifications.js   # Alerts + reminders
│   ├── utils/
│   │   └── seed.js            # Sample data seeder
│   ├── .env                   # Environment config
│   ├── server.js              # Express entry point
│   └── package.json
│
└── frontend/                  # Next.js 14 + Tailwind CSS
    ├── src/
    │   ├── app/
    │   │   ├── login/         # Login page
    │   │   ├── dashboard/     # Stats, charts, alerts
    │   │   ├── students/      # Student CRUD
    │   │   ├── seats/         # Visual seat grid
    │   │   ├── payments/      # Fee management
    │   │   ├── attendance/    # Daily attendance + QR
    │   │   ├── layout.tsx     # Root layout
    │   │   ├── page.tsx       # Redirect handler
    │   │   └── globals.css    # Design system
    │   ├── components/
    │   │   └── layout/
    │   │       └── AppLayout.tsx  # Sidebar nav
    │   └── lib/
    │       ├── api.ts         # Axios API client
    │       ├── auth.tsx       # Auth context
    │       └── utils.ts       # Helpers
    ├── .env.local
    ├── next.config.js
    ├── tailwind.config.js
    └── package.json
```

---

## ⚡ Quick Start

### Prerequisites
- **Node.js** v18+
- **MongoDB** (local or Atlas)
- **npm** or **yarn**

---

### 1. Clone & Setup Backend

```bash
cd smart-study-library/backend

# Install dependencies
npm install

# Configure environment (already set up with defaults)
# Edit .env if needed:
#   MONGODB_URI=mongodb://localhost:27017/smart-study-library
#   JWT_SECRET=your_secret_key
#   ADMIN_EMAIL=admin@library.com
#   ADMIN_PASSWORD=admin123

# Seed sample data (20 students, 50 seats, payments, attendance)
npm run seed

# Start backend server
npm run dev
```

Backend runs on: **http://localhost:5000**

---

### 2. Setup Frontend

```bash
cd smart-study-library/frontend

# Install dependencies
npm install

# Environment is pre-configured in .env.local
# NEXT_PUBLIC_API_URL=http://localhost:5000/api

# Start development server
npm run dev
```

Frontend runs on: **http://localhost:3000**

---

### 3. Login

Open **http://localhost:3000** in your browser.

```
Email:    admin@library.com
Password: admin123
```

---

## 🔌 API Reference

### Authentication
| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/api/auth/login` | Admin login → returns JWT |
| GET | `/api/auth/me` | Get current user |

### Students
| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/students` | List all (search, filter) |
| GET | `/api/students/:id` | Get single student |
| POST | `/api/students` | Add student (multipart/form-data) |
| PUT | `/api/students/:id` | Update student |
| DELETE | `/api/students/:id` | Soft-delete student |
| GET | `/api/students/export/csv` | Download CSV |

### Seats
| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/seats` | All seats with student info |
| POST | `/api/seats/initialize` | Create N seats |
| PUT | `/api/seats/:id/assign` | Assign student to seat |
| PUT | `/api/seats/:id/remove` | Clear seat |

### Payments
| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/payments` | List payments (filter by month/status) |
| POST | `/api/payments` | Record new payment |
| PUT | `/api/payments/:id` | Update payment |
| GET | `/api/payments/monthly-revenue` | Revenue chart data |
| POST | `/api/payments/update-overdue` | Auto-mark overdue |

### Attendance
| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/attendance` | Query attendance |
| POST | `/api/attendance/mark` | Mark one student |
| POST | `/api/attendance/bulk` | Bulk mark attendance |
| GET | `/api/attendance/qr/:studentId` | Generate QR code |
| POST | `/api/attendance/qr-checkin` | QR check-in |
| GET | `/api/attendance/stats/:studentId` | Student stats |

### Dashboard & Notifications
| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/dashboard` | Full stats summary |
| GET | `/api/notifications` | Overdue + due-soon alerts |
| POST | `/api/notifications/send-reminder` | Mock WhatsApp reminder |

---

## 🗄 Database Models

### Student
```js
{ name, phone, email, address, idProofType, idProofNumber, photo,
  seatId, seatNumber, shift, monthlyFee, feeStatus, joinDate, dueDate, isActive }
```

### Seat
```js
{ seatNumber, isOccupied, studentId, row, column, section, isActive }
```

### Payment
```js
{ studentId, amount, month, paymentDate, dueDate, status, paymentMethod, transactionId }
```

### Attendance
```js
{ studentId, date, dateString, present, checkInTime, checkOutTime, markedBy }
```

---

## ✨ Features Overview

| Feature | Status |
|---------|--------|
| JWT Login / Logout | ✅ |
| Dashboard with charts | ✅ |
| Add/Edit/Delete Students | ✅ |
| Photo upload | ✅ |
| Seat visual grid (50 seats) | ✅ |
| Click seat to assign/remove | ✅ |
| Shift assignment (Morning/Evening/Full Day) | ✅ |
| Monthly fee tracking | ✅ |
| Payment history | ✅ |
| Auto overdue marking | ✅ |
| Daily attendance marking | ✅ |
| Bulk attendance save | ✅ |
| QR code generation per student | ✅ |
| WhatsApp/SMS mock reminder | ✅ |
| Overdue alerts on dashboard | ✅ |
| Search by name/phone | ✅ |
| Filter by shift/status | ✅ |
| Export students CSV | ✅ |
| Revenue bar chart | ✅ |
| Shift pie chart | ✅ |
| Dark mode toggle | ✅ |
| Mobile responsive | ✅ |
| Collapsible sidebar | ✅ |

---

## 🏷 Fee Structure (Defaults)

| Shift | Timing | Monthly Fee |
|-------|--------|-------------|
| Morning | 6 AM – 2 PM | ₹800 |
| Evening | 2 PM – 10 PM | ₹800 |
| Full Day | 6 AM – 10 PM | ₹1,500 |

*Fees can be customized per student.*

---

## 🌐 Environment Variables

### Backend `.env`
```env
PORT=5000
MONGODB_URI=mongodb://localhost:27017/smart-study-library
JWT_SECRET=your_super_secret_key
JWT_EXPIRES_IN=7d
ADMIN_EMAIL=admin@library.com
ADMIN_PASSWORD=admin123
NODE_ENV=development
FRONTEND_URL=http://localhost:3000
```

### Frontend `.env.local`
```env
NEXT_PUBLIC_API_URL=http://localhost:5000/api
```

---

## 🚀 Production Deployment

### Backend (Railway / Render / VPS)
```bash
npm start
# Set MONGODB_URI to your Atlas connection string
# Set NODE_ENV=production
```

### Frontend (Vercel)
```bash
npm run build
# Set NEXT_PUBLIC_API_URL to your deployed backend URL
```

---

## 📱 WhatsApp Integration (Real)

To enable real WhatsApp reminders, replace the mock in `routes/notifications.js` with Twilio:

```bash
npm install twilio
```

```js
const twilio = require('twilio')
const client = twilio(process.env.TWILIO_SID, process.env.TWILIO_TOKEN)
await client.messages.create({
  from: 'whatsapp:+14155238886',
  to: `whatsapp:+91${student.phone}`,
  body: message
})
```

---

## 👤 Sample Data (after `npm run seed`)

- 1 admin account
- 50 seats initialized
- 20 students with varied shifts, fee statuses
- Payment records for each student
- 7 days of attendance history per student

---

*Built for real Abhyasika (अभ्यासिका) library operators across India* 🇮🇳

---

## ☁️ Render Deployment Guide

### Prerequisites
- A free [Render](https://render.com) account
- A free [MongoDB Atlas](https://cloud.mongodb.com) cluster (M0 free tier is fine)

---

### Step 1 — MongoDB Atlas
1. Create a free M0 cluster at [cloud.mongodb.com](https://cloud.mongodb.com)
2. Create a database user (username + password)
3. Under **Network Access**, add `0.0.0.0/0` (allow all IPs — Render IPs are dynamic)
4. Copy your connection string:
   ```
   mongodb+srv://<user>:<password>@cluster0.xxxxx.mongodb.net/smart-study-library?retryWrites=true&w=majority
   ```

---

### Step 2 — Push to GitHub
```bash
cd smart-study-library
git init
git add .
git commit -m "Initial commit"
# Create a repo on GitHub, then:
git remote add origin https://github.com/YOUR_USERNAME/smart-study-library.git
git push -u origin main
```

---

### Step 3 — Deploy Backend on Render
1. Go to [render.com](https://render.com) → **New** → **Web Service**
2. Connect your GitHub repo
3. Settings:
   - **Root Directory:** `backend`
   - **Build Command:** `npm install`
   - **Start Command:** `npm start`
4. Add these **Environment Variables**:
   ```
   NODE_ENV         = production
   MONGODB_URI      = mongodb+srv://... (your Atlas URI)
   JWT_SECRET       = any_long_random_string_here
   JWT_EXPIRES_IN   = 7d
   ADMIN_EMAIL      = admin@library.com
   ADMIN_PASSWORD   = YourSecurePassword123
   FRONTEND_URL     = https://smart-study-library-app.onrender.com  ← set after step 4
   PORT             = 10000
   ```
5. Click **Create Web Service**
6. Wait for deploy (~2 min). Note your backend URL:
   `https://smart-study-library-api.onrender.com`

---

### Step 4 — Deploy Frontend on Render
1. **New** → **Web Service** again
2. Same GitHub repo
3. Settings:
   - **Root Directory:** `frontend`
   - **Build Command:** `npm install && npm run build`
   - **Start Command:** `node .next/standalone/server.js`
4. Add **Environment Variables**:
   ```
   NODE_ENV             = production
   NEXT_PUBLIC_API_URL  = https://smart-study-library-api.onrender.com/api
   PORT                 = 3000
   ```
5. Click **Create Web Service**
6. Note your frontend URL: `https://smart-study-library-app.onrender.com`

---

### Step 5 — Update CORS
Go back to your **backend** service on Render → Environment → Update:
```
FRONTEND_URL = https://smart-study-library-app.onrender.com
```
Click **Save** (triggers redeploy automatically).

---

### Step 6 — Seed Data (optional)
In Render backend service → **Shell** tab:
```bash
npm run seed
```
This creates admin + 20 sample students.

---

### ⚠️ Render Free Tier Notes
| Issue | Solution |
|-------|----------|
| Service sleeps after 15 min inactivity | Upgrade to Starter ($7/mo) or use [UptimeRobot](https://uptimerobot.com) to ping `/api/health` every 5 min |
| File uploads (photos) don't persist | Free tier has ephemeral filesystem — use Cloudinary or S3 for production photo storage |
| Cold start takes ~30s | Normal on free tier |

---

### One-Click Deploy (render.yaml)
If you push the repo with `render.yaml` at the root, you can use **Render Blueprints**:
1. Render Dashboard → **New** → **Blueprint**
2. Connect your repo — it auto-reads `render.yaml`
3. Fill in the `sync: false` env vars manually
