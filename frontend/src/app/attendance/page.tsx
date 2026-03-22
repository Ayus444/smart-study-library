'use client'
import { useEffect, useState } from 'react'
import { CalendarCheck, QrCode, Check, X, RefreshCw, Save } from 'lucide-react'
import AppLayout from '@/components/layout/AppLayout'
import { AuthProvider } from '@/lib/auth'
import { attendanceAPI, studentsAPI } from '@/lib/api'
import { getCurrentDate } from '@/lib/utils'
import toast from 'react-hot-toast'

function QRModal({ student, onClose }: any) {
  const [qr, setQr] = useState<string | null>(null)
  useEffect(() => {
    attendanceAPI.getQR(student._id).then(r => setQr(r.data.qrCode)).catch(() => toast.error('QR failed'))
  }, [student._id])

  return (
    <div className="modal-overlay" onClick={e => e.target === e.currentTarget && onClose()}>
      <div className="modal-box p-6 max-w-xs text-center">
        <h3 className="font-display text-lg font-semibold mb-1" style={{ color: 'var(--text-primary)' }}>{student.name}</h3>
        <p className="text-xs mb-4" style={{ color: 'var(--text-muted)' }}>Scan to check in</p>
        {qr ? <img src={qr} alt="QR Code" className="mx-auto rounded-lg w-56 h-56" /> : (
          <div className="w-56 h-56 mx-auto rounded-lg flex items-center justify-center" style={{ background: 'var(--bg-secondary)' }}>
            <div className="animate-spin w-6 h-6 rounded-full border-2 border-t-transparent" style={{ borderColor: 'var(--saffron)', borderTopColor: 'transparent' }} />
          </div>
        )}
        <button onClick={onClose} className="btn-secondary mt-4 w-full justify-center">Close</button>
      </div>
    </div>
  )
}

function AttendanceContent() {
  const [students, setStudents] = useState<any[]>([])
  const [attendance, setAttendance] = useState<Record<string, boolean>>({})
  const [date, setDate] = useState(getCurrentDate())
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [qrStudent, setQrStudent] = useState<any>(null)
  const [history, setHistory] = useState<any[]>([])

  const loadStudents = async () => {
    setLoading(true)
    try {
      const [sr, ar] = await Promise.all([
        studentsAPI.getAll({ limit: 200 }),
        attendanceAPI.getAll({ date })
      ])
      setStudents(sr.data.students)
      const att: Record<string, boolean> = {}
      ar.data.attendance.forEach((a: any) => { att[a.studentId?._id || a.studentId] = a.present })
      setAttendance(att)
      setHistory(ar.data.attendance)
    } catch { toast.error('Failed to load') }
    finally { setLoading(false) }
  }

  useEffect(() => { loadStudents() }, [date])

  const toggle = (id: string) => setAttendance(a => ({ ...a, [id]: !a[id] }))

  const markAll = (present: boolean) => {
    const all: Record<string, boolean> = {}
    students.forEach(s => { all[s._id] = present })
    setAttendance(all)
  }

  const saveAttendance = async () => {
    setSaving(true)
    try {
      const records = students.map(s => ({ studentId: s._id, present: !!attendance[s._id] }))
      await attendanceAPI.bulkMark({ date, records })
      toast.success('Attendance saved!')
      loadStudents()
    } catch { toast.error('Failed to save attendance') }
    finally { setSaving(false) }
  }

  const presentCount = students.filter(s => attendance[s._id]).length
  const shiftColor: Record<string, string> = { Morning: '#f59e0b', Evening: '#3949ab', 'Full Day': '#2e7d32' }

  return (
    <div className="space-y-5">
      <div className="flex items-center justify-between animate-in">
        <div>
          <h1 className="text-2xl font-display font-bold" style={{ color: 'var(--text-primary)' }}>Attendance</h1>
          <p className="text-sm mt-0.5" style={{ color: 'var(--text-muted)' }}>
            {presentCount} / {students.length} present
          </p>
        </div>
        <div className="flex gap-2 flex-wrap justify-end">
          <input type="date" className="input w-auto text-sm py-2" value={date} onChange={e => setDate(e.target.value)} max={getCurrentDate()} />
          <button onClick={saveAttendance} disabled={saving} className="btn-primary disabled:opacity-50">
            <Save size={15} /> {saving ? 'Saving...' : 'Save'}
          </button>
        </div>
      </div>

      {/* Summary Bar */}
      <div className="card p-4 animate-in stagger-1">
        <div className="flex items-center justify-between mb-2">
          <span className="text-xs font-medium" style={{ color: 'var(--text-muted)' }}>Attendance Rate</span>
          <span className="text-xs font-bold" style={{ color: 'var(--text-primary)' }}>
            {students.length > 0 ? Math.round((presentCount / students.length) * 100) : 0}%
          </span>
        </div>
        <div className="h-2 rounded-full overflow-hidden" style={{ background: 'var(--bg-secondary)' }}>
          <div className="h-full rounded-full transition-all duration-500"
            style={{ width: `${students.length > 0 ? (presentCount / students.length) * 100 : 0}%`, background: 'linear-gradient(90deg, var(--green), #2e7d32)' }} />
        </div>
        <div className="flex gap-3 mt-3">
          <button onClick={() => markAll(true)} className="btn-secondary text-xs py-1.5"><Check size={12} /> Mark All Present</button>
          <button onClick={() => markAll(false)} className="btn-secondary text-xs py-1.5"><X size={12} /> Mark All Absent</button>
        </div>
      </div>

      {/* Student List */}
      <div className="card overflow-hidden animate-in stagger-2">
        <div className="px-4 py-3 border-b flex items-center gap-2" style={{ borderColor: 'var(--border)', background: 'var(--bg-secondary)' }}>
          <CalendarCheck size={15} style={{ color: 'var(--saffron)' }} />
          <span className="text-xs font-semibold uppercase tracking-wide" style={{ color: 'var(--text-muted)' }}>
            {new Date(date).toLocaleDateString('en-IN', { weekday: 'long', day: 'numeric', month: 'long' })}
          </span>
        </div>
        {loading ? (
          <div className="p-8 text-center">
            <div className="w-6 h-6 rounded-full border-2 border-t-transparent animate-spin mx-auto" style={{ borderColor: 'var(--saffron)', borderTopColor: 'transparent' }} />
          </div>
        ) : students.length === 0 ? (
          <div className="p-8 text-center text-sm" style={{ color: 'var(--text-muted)' }}>No students found</div>
        ) : (
          <div className="divide-y" style={{ '--tw-divide-opacity': 1 } as any}>
            {students.map(s => {
              const present = !!attendance[s._id]
              return (
                <div key={s._id} className="flex items-center gap-3 px-4 py-3 transition-colors" style={{ background: present ? 'var(--green-light)' : undefined }}>
                  <button onClick={() => toggle(s._id)}
                    className={`w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0 transition-all ${present ? 'scale-110' : ''}`}
                    style={{ background: present ? 'var(--green)' : 'var(--bg-secondary)', color: present ? 'white' : 'var(--text-muted)' }}>
                    {present ? <Check size={16} /> : <X size={14} />}
                  </button>
                  <div className="flex-1 min-w-0">
                    <div className="text-sm font-medium truncate" style={{ color: 'var(--text-primary)' }}>{s.name}</div>
                    <div className="text-xs flex items-center gap-1.5" style={{ color: 'var(--text-muted)' }}>
                      <span>Seat {s.seatNumber || 'N/A'}</span>
                      <span>•</span>
                      <span style={{ color: shiftColor[s.shift] }}>{s.shift}</span>
                      <span>•</span>
                      <span>{s.phone}</span>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className={`text-xs font-medium ${present ? '' : 'opacity-50'}`} style={{ color: present ? 'var(--green)' : 'var(--red)' }}>
                      {present ? 'Present' : 'Absent'}
                    </span>
                    <button onClick={() => setQrStudent(s)} title="Show QR"
                      className="p-1.5 rounded-md transition-opacity hover:opacity-70" style={{ color: 'var(--text-muted)' }}>
                      <QrCode size={14} />
                    </button>
                  </div>
                </div>
              )
            })}
          </div>
        )}
      </div>

      {/* History Summary */}
      {history.length > 0 && (
        <div className="card p-4 animate-in stagger-3">
          <h3 className="font-display text-sm font-semibold mb-3" style={{ color: 'var(--text-primary)' }}>Today's Record</h3>
          <div className="grid grid-cols-3 gap-3 text-center">
            <div><div className="text-xl font-display font-bold" style={{ color: 'var(--green)' }}>{history.filter(h => h.present).length}</div><div className="text-xs" style={{ color: 'var(--text-muted)' }}>Present</div></div>
            <div><div className="text-xl font-display font-bold" style={{ color: 'var(--red)' }}>{history.filter(h => !h.present).length}</div><div className="text-xs" style={{ color: 'var(--text-muted)' }}>Absent</div></div>
            <div><div className="text-xl font-display font-bold" style={{ color: 'var(--saffron)' }}>{history.length}</div><div className="text-xs" style={{ color: 'var(--text-muted)' }}>Total Marked</div></div>
          </div>
        </div>
      )}

      {qrStudent && <QRModal student={qrStudent} onClose={() => setQrStudent(null)} />}
    </div>
  )
}

export default function AttendancePage() {
  return <AuthProvider><AppLayout><AttendanceContent /></AppLayout></AuthProvider>
}
