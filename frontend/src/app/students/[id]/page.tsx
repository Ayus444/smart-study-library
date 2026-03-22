'use client'
import { useEffect, useState } from 'react'
import { useParams, useRouter } from 'next/navigation'
import {
  ArrowLeft, Phone, MapPin, CreditCard, CalendarCheck,
  User, IndianRupee, Clock, CheckCircle2, XCircle,
  AlertTriangle, Send, QrCode, TrendingUp
} from 'lucide-react'
import AppLayout from '@/components/layout/AppLayout'
import { AuthProvider } from '@/lib/auth'
import { studentsAPI, paymentsAPI, attendanceAPI, notificationsAPI } from '@/lib/api'
import { formatCurrency, formatDate, formatDateShort, getMonthName } from '@/lib/utils'
import toast from 'react-hot-toast'

function StudentProfile() {
  const { id } = useParams()
  const router = useRouter()
  const [student, setStudent] = useState<any>(null)
  const [payments, setPayments] = useState<any[]>([])
  const [attendance, setAttendance] = useState<any[]>([])
  const [attendanceStats, setAttendanceStats] = useState<any>(null)
  const [qrCode, setQrCode] = useState<string | null>(null)
  const [loading, setLoading] = useState(true)
  const [tab, setTab] = useState<'overview' | 'payments' | 'attendance'>('overview')
  const [showQR, setShowQR] = useState(false)

  useEffect(() => {
    if (!id) return
    Promise.all([
      studentsAPI.getById(id as string),
      paymentsAPI.getAll({ studentId: id }),
      attendanceAPI.getAll({ studentId: id }),
      attendanceAPI.getStats(id as string),
    ]).then(([s, p, a, stats]) => {
      setStudent(s.data.student)
      setPayments(p.data.payments)
      setAttendance(a.data.attendance)
      setAttendanceStats(stats.data.stats)
    }).catch(() => toast.error('Failed to load student'))
    .finally(() => setLoading(false))
  }, [id])

  const loadQR = async () => {
    try {
      const r = await attendanceAPI.getQR(id as string)
      setQrCode(r.data.qrCode)
      setShowQR(true)
    } catch { toast.error('Failed to generate QR') }
  }

  const sendReminder = async () => {
    try {
      await notificationsAPI.sendReminder(id as string, 'whatsapp')
      toast.success('Reminder sent (mock)!')
    } catch { toast.error('Failed to send') }
  }

  if (loading) return (
    <div className="flex items-center justify-center h-64">
      <div className="w-8 h-8 rounded-full border-2 border-t-transparent animate-spin"
        style={{ borderColor: 'var(--saffron)', borderTopColor: 'transparent' }} />
    </div>
  )

  if (!student) return (
    <div className="text-center py-16">
      <p style={{ color: 'var(--text-muted)' }}>Student not found</p>
      <button onClick={() => router.push('/students')} className="btn-secondary mt-4">← Back</button>
    </div>
  )

  const feeStatusClass: Record<string, string> = { Paid: 'badge-paid', Pending: 'badge-pending', Overdue: 'badge-overdue' }
  const shiftClass: Record<string, string> = { Morning: 'badge-morning', Evening: 'badge-evening', 'Full Day': 'badge-fullday' }
  const totalPaid = payments.filter(p => p.status === 'Paid').reduce((a, p) => a + p.amount, 0)
  const lastPayment = payments.find(p => p.status === 'Paid')

  // Group attendance by month for calendar view
  const attByDate: Record<string, boolean> = {}
  attendance.forEach(a => { attByDate[a.dateString] = a.present })

  // Last 30 days attendance dots
  const last30Days = Array.from({ length: 30 }, (_, i) => {
    const d = new Date()
    d.setDate(d.getDate() - (29 - i))
    const ds = d.toISOString().split('T')[0]
    return { date: ds, present: attByDate[ds], marked: ds in attByDate }
  })

  return (
    <div className="space-y-5 max-w-2xl mx-auto">
      {/* Back */}
      <button onClick={() => router.push('/students')}
        className="flex items-center gap-2 text-sm transition-opacity hover:opacity-70 animate-in"
        style={{ color: 'var(--text-muted)' }}>
        <ArrowLeft size={16} /> Back to Students
      </button>

      {/* Profile Header */}
      <div className="card p-5 animate-in stagger-1">
        <div className="flex items-start gap-4">
          {/* Avatar */}
          <div className="w-16 h-16 rounded-2xl flex items-center justify-center text-2xl font-display font-bold text-white flex-shrink-0"
            style={{ background: 'linear-gradient(135deg, var(--saffron), #c74608)' }}>
            {student.name[0]}
          </div>
          <div className="flex-1 min-w-0">
            <div className="flex items-start justify-between gap-2 flex-wrap">
              <div>
                <h1 className="text-xl font-display font-bold" style={{ color: 'var(--text-primary)' }}>{student.name}</h1>
                <div className="flex items-center gap-1.5 mt-0.5 text-sm" style={{ color: 'var(--text-muted)' }}>
                  <Phone size={12} /> {student.phone}
                </div>
              </div>
              <div className="flex gap-2 flex-wrap">
                <span className={`badge ${shiftClass[student.shift]}`}>{student.shift}</span>
                <span className={`badge ${feeStatusClass[student.feeStatus]}`}>{student.feeStatus}</span>
              </div>
            </div>
            <div className="flex flex-wrap gap-3 mt-3">
              <div className="flex items-center gap-1.5 text-xs px-2.5 py-1 rounded-full"
                style={{ background: 'var(--bg-secondary)', color: 'var(--text-secondary)' }}>
                🪑 Seat {student.seatNumber || 'Not Assigned'}
              </div>
              <div className="flex items-center gap-1.5 text-xs px-2.5 py-1 rounded-full"
                style={{ background: 'var(--bg-secondary)', color: 'var(--text-secondary)' }}>
                📅 Joined {formatDate(student.joinDate)}
              </div>
              {student.idProofType && (
                <div className="flex items-center gap-1.5 text-xs px-2.5 py-1 rounded-full"
                  style={{ background: 'var(--bg-secondary)', color: 'var(--text-secondary)' }}>
                  🪪 {student.idProofType}
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="flex gap-2 mt-4 flex-wrap">
          {student.feeStatus !== 'Paid' && (
            <button onClick={sendReminder} className="btn-danger text-xs px-3 py-2 gap-1.5">
              <Send size={12} /> Send Reminder
            </button>
          )}
          <button onClick={loadQR} className="btn-secondary text-xs px-3 py-2 gap-1.5">
            <QrCode size={12} /> Show QR Code
          </button>
        </div>
      </div>

      {/* Quick Stats */}
      <div className="grid grid-cols-3 gap-3 animate-in stagger-2">
        <div className="card p-4 text-center">
          <div className="text-lg font-display font-bold" style={{ color: 'var(--green)' }}>{formatCurrency(totalPaid)}</div>
          <div className="text-xs mt-0.5" style={{ color: 'var(--text-muted)' }}>Total Paid</div>
        </div>
        <div className="card p-4 text-center">
          <div className="text-lg font-display font-bold" style={{ color: 'var(--saffron)' }}>
            {attendanceStats?.percentage || 0}%
          </div>
          <div className="text-xs mt-0.5" style={{ color: 'var(--text-muted)' }}>Attendance</div>
        </div>
        <div className="card p-4 text-center">
          <div className="text-lg font-display font-bold" style={{ color: student.feeStatus === 'Overdue' ? 'var(--red)' : 'var(--text-primary)' }}>
            {student.dueDate ? formatDateShort(student.dueDate) : '—'}
          </div>
          <div className="text-xs mt-0.5" style={{ color: 'var(--text-muted)' }}>Next Due</div>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex gap-1 p-1 rounded-xl animate-in stagger-2" style={{ background: 'var(--bg-secondary)' }}>
        {(['overview', 'payments', 'attendance'] as const).map(t => (
          <button key={t} onClick={() => setTab(t)}
            className={`flex-1 py-2 rounded-lg text-sm font-medium transition-all capitalize ${tab === t ? 'shadow-sm' : ''}`}
            style={{
              background: tab === t ? 'var(--bg-card)' : 'transparent',
              color: tab === t ? 'var(--saffron)' : 'var(--text-muted)'
            }}>
            {t === 'overview' ? '👤 Profile' : t === 'payments' ? '💰 Payments' : '📅 Attendance'}
          </button>
        ))}
      </div>

      {/* Tab: Overview */}
      {tab === 'overview' && (
        <div className="card p-5 space-y-4 animate-in">
          <h3 className="font-display font-semibold" style={{ color: 'var(--text-primary)' }}>Student Details</h3>
          <div className="grid grid-cols-2 gap-4">
            {[
              { label: 'Full Name', value: student.name },
              { label: 'Phone', value: student.phone },
              { label: 'Email', value: student.email || '—' },
              { label: 'Shift', value: student.shift },
              { label: 'Seat Number', value: student.seatNumber ? `#${student.seatNumber}` : 'Not assigned' },
              { label: 'Monthly Fee', value: formatCurrency(student.monthlyFee) },
              { label: 'ID Proof', value: student.idProofType || '—' },
              { label: 'ID Number', value: student.idProofNumber || '—' },
              { label: 'Join Date', value: formatDate(student.joinDate) },
              { label: 'Due Date', value: student.dueDate ? formatDate(student.dueDate) : '—' },
            ].map(({ label, value }) => (
              <div key={label}>
                <div className="text-xs uppercase tracking-wide mb-0.5" style={{ color: 'var(--text-muted)' }}>{label}</div>
                <div className="text-sm font-medium" style={{ color: 'var(--text-primary)' }}>{value}</div>
              </div>
            ))}
          </div>
          {student.address && (
            <div>
              <div className="text-xs uppercase tracking-wide mb-0.5" style={{ color: 'var(--text-muted)' }}>Address</div>
              <div className="text-sm" style={{ color: 'var(--text-primary)' }}>{student.address}</div>
            </div>
          )}
          {student.notes && (
            <div>
              <div className="text-xs uppercase tracking-wide mb-0.5" style={{ color: 'var(--text-muted)' }}>Notes</div>
              <div className="text-sm p-3 rounded-lg" style={{ background: 'var(--bg-secondary)', color: 'var(--text-secondary)' }}>
                {student.notes}
              </div>
            </div>
          )}
          {lastPayment && (
            <div className="p-3 rounded-lg" style={{ background: 'var(--green-light)' }}>
              <div className="text-xs font-medium mb-0.5" style={{ color: 'var(--green)' }}>Last Payment</div>
              <div className="text-sm font-bold" style={{ color: 'var(--text-primary)' }}>
                {formatCurrency(lastPayment.amount)} — {getMonthName(lastPayment.month)}
              </div>
              <div className="text-xs mt-0.5" style={{ color: 'var(--text-muted)' }}>
                {lastPayment.paymentDate ? formatDate(lastPayment.paymentDate) : '—'} via {lastPayment.paymentMethod}
              </div>
            </div>
          )}
        </div>
      )}

      {/* Tab: Payments */}
      {tab === 'payments' && (
        <div className="space-y-3 animate-in">
          {payments.length === 0 ? (
            <div className="card p-8 text-center text-sm" style={{ color: 'var(--text-muted)' }}>No payment records</div>
          ) : payments.map((p, i) => (
            <div key={p._id} className="card p-4 flex items-center justify-between gap-3">
              <div className="flex items-center gap-3">
                <div className={`w-9 h-9 rounded-full flex items-center justify-center flex-shrink-0 ${p.status === 'Paid' ? '' : ''}`}
                  style={{ background: p.status === 'Paid' ? 'var(--green-light)' : p.status === 'Overdue' ? 'var(--red-light)' : 'var(--amber-light)' }}>
                  {p.status === 'Paid'
                    ? <CheckCircle2 size={18} style={{ color: 'var(--green)' }} />
                    : p.status === 'Overdue'
                    ? <AlertTriangle size={18} style={{ color: 'var(--red)' }} />
                    : <Clock size={18} style={{ color: 'var(--amber)' }} />}
                </div>
                <div>
                  <div className="text-sm font-medium" style={{ color: 'var(--text-primary)' }}>
                    {getMonthName(p.month)}
                  </div>
                  <div className="text-xs" style={{ color: 'var(--text-muted)' }}>
                    {p.status === 'Paid'
                      ? `Paid on ${formatDate(p.paymentDate)} via ${p.paymentMethod}`
                      : `Due: ${formatDate(p.dueDate)}`}
                  </div>
                  {p.transactionId && (
                    <div className="text-xs mt-0.5 font-mono" style={{ color: 'var(--text-muted)' }}>
                      Ref: {p.transactionId}
                    </div>
                  )}
                </div>
              </div>
              <div className="text-right flex-shrink-0">
                <div className="font-display font-bold text-base" style={{ color: 'var(--text-primary)' }}>
                  {formatCurrency(p.amount)}
                </div>
                <span className={`badge text-xs ${feeStatusClass[p.status]}`}>{p.status}</span>
              </div>
            </div>
          ))}

          {/* Payment Summary */}
          {payments.length > 0 && (
            <div className="card p-4" style={{ background: 'var(--saffron-light)' }}>
              <div className="flex justify-between items-center">
                <span className="text-sm font-medium" style={{ color: 'var(--text-secondary)' }}>Total Paid</span>
                <span className="font-display font-bold text-lg" style={{ color: 'var(--saffron)' }}>{formatCurrency(totalPaid)}</span>
              </div>
              <div className="flex justify-between items-center mt-1">
                <span className="text-xs" style={{ color: 'var(--text-muted)' }}>Pending / Overdue</span>
                <span className="text-sm font-medium" style={{ color: 'var(--red)' }}>
                  {payments.filter(p => p.status !== 'Paid').length} month(s)
                </span>
              </div>
            </div>
          )}
        </div>
      )}

      {/* Tab: Attendance */}
      {tab === 'attendance' && (
        <div className="space-y-4 animate-in">
          {/* Stats */}
          <div className="grid grid-cols-3 gap-3">
            {[
              { label: 'Present', value: attendanceStats?.presentDays || 0, color: 'var(--green)' },
              { label: 'Absent', value: attendanceStats?.absentDays || 0, color: 'var(--red)' },
              { label: 'Rate', value: `${attendanceStats?.percentage || 0}%`, color: 'var(--saffron)' },
            ].map(({ label, value, color }) => (
              <div key={label} className="card p-3 text-center">
                <div className="text-xl font-display font-bold" style={{ color }}>{value}</div>
                <div className="text-xs mt-0.5" style={{ color: 'var(--text-muted)' }}>{label}</div>
              </div>
            ))}
          </div>

          {/* Last 30 days dots */}
          <div className="card p-4">
            <h3 className="text-sm font-medium mb-3" style={{ color: 'var(--text-secondary)' }}>Last 30 Days</h3>
            <div className="grid grid-cols-10 gap-1.5">
              {last30Days.map(({ date, present, marked }) => (
                <div key={date} title={`${date}: ${!marked ? 'Not marked' : present ? 'Present' : 'Absent'}`}
                  className="aspect-square rounded-md transition-all"
                  style={{
                    background: !marked ? 'var(--bg-secondary)' : present ? 'var(--green)' : 'var(--red-light)',
                    border: !marked ? '1px solid var(--border)' : present ? 'none' : '1px solid rgba(192,57,43,0.3)',
                    opacity: !marked ? 0.4 : 1
                  }} />
              ))}
            </div>
            <div className="flex items-center gap-4 mt-3">
              <div className="flex items-center gap-1.5 text-xs" style={{ color: 'var(--text-muted)' }}>
                <div className="w-2.5 h-2.5 rounded-sm" style={{ background: 'var(--green)' }} /> Present
              </div>
              <div className="flex items-center gap-1.5 text-xs" style={{ color: 'var(--text-muted)' }}>
                <div className="w-2.5 h-2.5 rounded-sm" style={{ background: 'var(--red-light)', border: '1px solid rgba(192,57,43,0.3)' }} /> Absent
              </div>
              <div className="flex items-center gap-1.5 text-xs" style={{ color: 'var(--text-muted)' }}>
                <div className="w-2.5 h-2.5 rounded-sm" style={{ background: 'var(--bg-secondary)', border: '1px solid var(--border)', opacity: 0.4 }} /> Not marked
              </div>
            </div>
          </div>

          {/* Attendance List */}
          <div className="card overflow-hidden">
            <div className="px-4 py-3 border-b text-xs font-semibold uppercase tracking-wide"
              style={{ borderColor: 'var(--border)', background: 'var(--bg-secondary)', color: 'var(--text-muted)' }}>
              Attendance History ({attendance.length} records)
            </div>
            {attendance.length === 0 ? (
              <div className="p-8 text-center text-sm" style={{ color: 'var(--text-muted)' }}>No attendance records yet</div>
            ) : (
              <div className="divide-y max-h-72 overflow-y-auto" style={{ borderColor: 'var(--border)' }}>
                {attendance.slice().reverse().map(a => (
                  <div key={a._id} className="flex items-center justify-between px-4 py-2.5">
                    <div className="flex items-center gap-2.5">
                      {a.present
                        ? <CheckCircle2 size={15} style={{ color: 'var(--green)' }} />
                        : <XCircle size={15} style={{ color: 'var(--red)' }} />}
                      <span className="text-sm" style={{ color: 'var(--text-primary)' }}>
                        {new Date(a.date).toLocaleDateString('en-IN', { weekday: 'short', day: 'numeric', month: 'short' })}
                      </span>
                    </div>
                    <div className="flex items-center gap-2">
                      {a.checkInTime && (
                        <span className="text-xs" style={{ color: 'var(--text-muted)' }}>
                          {new Date(a.checkInTime).toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' })}
                        </span>
                      )}
                      <span className={`badge text-xs ${a.present ? 'badge-paid' : 'badge-overdue'}`}>
                        {a.present ? 'Present' : 'Absent'}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      )}

      {/* QR Modal */}
      {showQR && qrCode && (
        <div className="modal-overlay" onClick={() => setShowQR(false)}>
          <div className="modal-box p-6 max-w-xs text-center">
            <h3 className="font-display text-lg font-semibold mb-1" style={{ color: 'var(--text-primary)' }}>{student.name}</h3>
            <p className="text-xs mb-4" style={{ color: 'var(--text-muted)' }}>Scan to mark attendance</p>
            <img src={qrCode} alt="QR Code" className="mx-auto rounded-xl w-56 h-56" />
            <p className="text-xs mt-3" style={{ color: 'var(--text-muted)' }}>Seat #{student.seatNumber} · {student.shift}</p>
            <button onClick={() => setShowQR(false)} className="btn-secondary mt-4 w-full justify-center">Close</button>
          </div>
        </div>
      )}
    </div>
  )
}

export default function StudentProfilePage() {
  return <AuthProvider><AppLayout><StudentProfile /></AppLayout></AuthProvider>
}
