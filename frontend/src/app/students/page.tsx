'use client'
import { useEffect, useState, useRef } from 'react'
import { Plus, Search, Filter, Edit2, Trash2, Download, Phone, MapPin, X, User, ChevronDown } from 'lucide-react'
import AppLayout from '@/components/layout/AppLayout'
import { AuthProvider } from '@/lib/auth'
import { studentsAPI, seatsAPI } from '@/lib/api'
import { formatCurrency, formatDate, shiftFee, downloadBlob } from '@/lib/utils'
import toast from 'react-hot-toast'

const SHIFTS = ['Morning', 'Evening', 'Full Day']
const ID_TYPES = ['Aadhar', 'PAN', 'Passport', 'Voter ID', 'Driving License']

function StudentModal({ student, seats, onClose, onSaved }: any) {
  const isEdit = !!student?._id
  const [form, setForm] = useState({
    name: student?.name || '',
    phone: student?.phone || '',
    email: student?.email || '',
    address: student?.address || '',
    idProofType: student?.idProofType || 'Aadhar',
    idProofNumber: student?.idProofNumber || '',
    shift: student?.shift || 'Morning',
    monthlyFee: student?.monthlyFee || shiftFee['Morning'],
    seatNumber: student?.seatNumber || '',
    notes: student?.notes || '',
  })
  const [photo, setPhoto] = useState<File | null>(null)
  const [loading, setLoading] = useState(false)
  const fileRef = useRef<HTMLInputElement>(null)

  const set = (k: string, v: any) => setForm(f => ({ ...f, [k]: v }))

  const submit = async (e: any) => {
    e.preventDefault()
    setLoading(true)
    try {
      const fd = new FormData()
      Object.entries(form).forEach(([k, v]) => fd.append(k, String(v)))
      if (photo) fd.append('photo', photo)
      if (isEdit) await studentsAPI.update(student._id, fd)
      else await studentsAPI.create(fd)
      toast.success(isEdit ? 'Student updated!' : 'Student added!')
      onSaved()
      onClose()
    } catch (err: any) {
      toast.error(err.response?.data?.message || 'Error saving student')
    } finally { setLoading(false) }
  }

  const availSeats = seats.filter((s: any) => !s.isOccupied || s.seatNumber === student?.seatNumber)

  return (
    <div className="modal-overlay" onClick={e => e.target === e.currentTarget && onClose()}>
      <div className="modal-box p-6 w-full max-w-2xl">
        <div className="flex items-center justify-between mb-5">
          <h2 className="font-display text-xl font-semibold" style={{ color: 'var(--text-primary)' }}>
            {isEdit ? 'Edit Student' : 'Add New Student'}
          </h2>
          <button onClick={onClose} className="p-1 rounded-md hover:opacity-70"><X size={20} style={{ color: 'var(--text-muted)' }} /></button>
        </div>
        <form onSubmit={submit} className="grid grid-cols-2 gap-4">
          <div className="col-span-2 md:col-span-1">
            <label className="label">Full Name *</label>
            <input className="input" value={form.name} onChange={e => set('name', e.target.value)} required placeholder="Rahul Sharma" />
          </div>
          <div className="col-span-2 md:col-span-1">
            <label className="label">Phone Number *</label>
            <input className="input" value={form.phone} onChange={e => set('phone', e.target.value)} required placeholder="9876543210" />
          </div>
          <div className="col-span-2 md:col-span-1">
            <label className="label">Email</label>
            <input className="input" type="email" value={form.email} onChange={e => set('email', e.target.value)} placeholder="student@email.com" />
          </div>
          <div className="col-span-2 md:col-span-1">
            <label className="label">Shift *</label>
            <select className="input" value={form.shift} onChange={e => { set('shift', e.target.value); set('monthlyFee', shiftFee[e.target.value]) }}>
              {SHIFTS.map(s => <option key={s}>{s}</option>)}
            </select>
          </div>
          <div className="col-span-2 md:col-span-1">
            <label className="label">Monthly Fee (₹) *</label>
            <input className="input" type="number" value={form.monthlyFee} onChange={e => set('monthlyFee', e.target.value)} required />
          </div>
          <div className="col-span-2 md:col-span-1">
            <label className="label">Seat Number</label>
            <select className="input" value={form.seatNumber} onChange={e => set('seatNumber', e.target.value)}>
              <option value="">-- No Seat --</option>
              {availSeats.map((s: any) => <option key={s.seatNumber} value={s.seatNumber}>Seat {s.seatNumber}</option>)}
            </select>
          </div>
          <div className="col-span-2 md:col-span-1">
            <label className="label">ID Proof Type</label>
            <select className="input" value={form.idProofType} onChange={e => set('idProofType', e.target.value)}>
              {ID_TYPES.map(t => <option key={t}>{t}</option>)}
            </select>
          </div>
          <div className="col-span-2 md:col-span-1">
            <label className="label">ID Proof Number</label>
            <input className="input" value={form.idProofNumber} onChange={e => set('idProofNumber', e.target.value)} placeholder="XXXX XXXX XXXX" />
          </div>
          <div className="col-span-2">
            <label className="label">Address</label>
            <input className="input" value={form.address} onChange={e => set('address', e.target.value)} placeholder="Flat/House No., Area, City" />
          </div>
          <div className="col-span-2">
            <label className="label">Photo</label>
            <div className="flex items-center gap-3">
              <button type="button" onClick={() => fileRef.current?.click()}
                className="btn-secondary text-xs px-3 py-2">
                <User size={14} /> {photo ? photo.name : 'Choose Photo'}
              </button>
              {student?.photo && !photo && <span className="text-xs" style={{ color: 'var(--text-muted)' }}>Photo on file</span>}
              <input ref={fileRef} type="file" accept="image/*" className="hidden" onChange={e => setPhoto(e.target.files?.[0] || null)} />
            </div>
          </div>
          <div className="col-span-2">
            <label className="label">Notes</label>
            <textarea className="input resize-none" rows={2} value={form.notes} onChange={e => set('notes', e.target.value)} placeholder="Any additional notes..." />
          </div>
          <div className="col-span-2 flex gap-3 justify-end pt-2">
            <button type="button" onClick={onClose} className="btn-secondary">Cancel</button>
            <button type="submit" disabled={loading} className="btn-primary disabled:opacity-50">
              {loading ? 'Saving...' : isEdit ? 'Update Student' : 'Add Student'}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}

function StudentsContent() {
  const [students, setStudents] = useState<any[]>([])
  const [seats, setSeats] = useState<any[]>([])
  const [search, setSearch] = useState('')
  const [filterShift, setFilterShift] = useState('')
  const [filterStatus, setFilterStatus] = useState('')
  const [loading, setLoading] = useState(true)
  const [modal, setModal] = useState<any>(null) // null | {} | student obj
  const [deleting, setDeleting] = useState<string | null>(null)

  const load = async () => {
    setLoading(true)
    try {
      const [sr, setr] = await Promise.all([
        studentsAPI.getAll({ search, shift: filterShift, feeStatus: filterStatus }),
        seatsAPI.getAll()
      ])
      setStudents(sr.data.students)
      setSeats(setr.data.seats)
    } catch { toast.error('Failed to load students') }
    finally { setLoading(false) }
  }

  useEffect(() => { load() }, [search, filterShift, filterStatus])

  const deleteStudent = async (id: string, name: string) => {
    if (!confirm(`Remove ${name} from the library?`)) return
    setDeleting(id)
    try {
      await studentsAPI.delete(id)
      toast.success('Student removed')
      load()
    } catch { toast.error('Failed to delete') }
    finally { setDeleting(null) }
  }

  const exportCSV = async () => {
    try {
      const res = await studentsAPI.exportCSV()
      downloadBlob(res.data, 'students.csv')
      toast.success('CSV downloaded!')
    } catch { toast.error('Export failed') }
  }

  const feeStatusClass: Record<string, string> = { Paid: 'badge-paid', Pending: 'badge-pending', Overdue: 'badge-overdue' }
  const shiftClass: Record<string, string> = { Morning: 'badge-morning', Evening: 'badge-evening', 'Full Day': 'badge-fullday' }

  return (
    <div className="space-y-5">
      <div className="flex items-center justify-between animate-in">
        <div>
          <h1 className="text-2xl font-display font-bold" style={{ color: 'var(--text-primary)' }}>Students</h1>
          <p className="text-sm mt-0.5" style={{ color: 'var(--text-muted)' }}>{students.length} registered students</p>
        </div>
        <div className="flex gap-2">
          <button onClick={exportCSV} className="btn-secondary text-sm hidden sm:flex"><Download size={15} /> Export CSV</button>
          <button onClick={() => setModal({})} className="btn-primary"><Plus size={16} /> Add Student</button>
        </div>
      </div>

      {/* Filters */}
      <div className="flex flex-wrap gap-3 animate-in stagger-1">
        <div className="relative flex-1 min-w-48">
          <Search size={15} className="absolute left-3 top-1/2 -translate-y-1/2" style={{ color: 'var(--text-muted)' }} />
          <input className="input py-2" style={{paddingLeft: "2.25rem"}} placeholder="Search by name or phone..." value={search} onChange={e => setSearch(e.target.value)} />
        </div>
        <select className="input w-auto py-2 pr-8" value={filterShift} onChange={e => setFilterShift(e.target.value)}>
          <option value="">All Shifts</option>
          {SHIFTS.map(s => <option key={s}>{s}</option>)}
        </select>
        <select className="input w-auto py-2 pr-8" value={filterStatus} onChange={e => setFilterStatus(e.target.value)}>
          <option value="">All Status</option>
          {['Paid', 'Pending', 'Overdue'].map(s => <option key={s}>{s}</option>)}
        </select>
      </div>

      {/* Table */}
      <div className="card overflow-hidden animate-in stagger-2">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr style={{ background: 'var(--bg-secondary)', borderBottom: '1px solid var(--border)' }}>
                {['Student', 'Phone', 'Shift', 'Seat', 'Monthly Fee', 'Fee Status', 'Due Date', 'Actions'].map(h => (
                  <th key={h} className="text-left px-4 py-3 text-xs font-semibold uppercase tracking-wide" style={{ color: 'var(--text-muted)' }}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {loading ? (
                [...Array(5)].map((_, i) => (
                  <tr key={i} className="table-row">
                    {[...Array(8)].map((_, j) => (
                      <td key={j} className="px-4 py-3">
                        <div className="h-4 rounded animate-pulse" style={{ background: 'var(--bg-secondary)', width: j === 0 ? 120 : 60 }} />
                      </td>
                    ))}
                  </tr>
                ))
              ) : students.length === 0 ? (
                <tr><td colSpan={8} className="text-center py-12 text-sm" style={{ color: 'var(--text-muted)' }}>No students found</td></tr>
              ) : students.map(s => (
                <tr key={s._id} className="table-row">
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-2.5">
                      <div className="w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold text-white flex-shrink-0"
                        style={{ background: 'linear-gradient(135deg, var(--saffron), #c74608)' }}>
                        {s.name[0]}
                      </div>
                      <div>
                        <div className="font-medium" style={{ color: 'var(--text-primary)' }}>{s.name}</div>
                        <div className="text-xs" style={{ color: 'var(--text-muted)' }}>{s.idProofType}</div>
                      </div>
                    </div>
                  </td>
                  <td className="px-4 py-3" style={{ color: 'var(--text-secondary)' }}>{s.phone}</td>
                  <td className="px-4 py-3"><span className={`badge ${shiftClass[s.shift]}`}>{s.shift}</span></td>
                  <td className="px-4 py-3">
                    <span className="font-mono text-xs px-2 py-1 rounded" style={{ background: 'var(--bg-secondary)', color: 'var(--text-primary)' }}>
                      {s.seatNumber ? `#${s.seatNumber}` : '—'}
                    </span>
                  </td>
                  <td className="px-4 py-3 font-medium" style={{ color: 'var(--text-primary)' }}>{formatCurrency(s.monthlyFee)}</td>
                  <td className="px-4 py-3"><span className={`badge ${feeStatusClass[s.feeStatus]}`}>{s.feeStatus}</span></td>
                  <td className="px-4 py-3 text-xs" style={{ color: s.feeStatus === 'Overdue' ? 'var(--red)' : 'var(--text-muted)' }}>
                    {s.dueDate ? formatDate(s.dueDate) : '—'}
                  </td>
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-1">
                      <button onClick={() => setModal(s)} className="p-1.5 rounded-md hover:opacity-80 transition-opacity" style={{ color: 'var(--saffron)' }}><Edit2 size={14} /></button>
                      <button onClick={() => deleteStudent(s._id, s.name)} disabled={deleting === s._id}
                        className="p-1.5 rounded-md hover:opacity-80 transition-opacity" style={{ color: 'var(--red)' }}>
                        <Trash2 size={14} />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {modal !== null && (
        <StudentModal student={modal?._id ? modal : null} seats={seats} onClose={() => setModal(null)} onSaved={load} />
      )}
    </div>
  )
}

export default function StudentsPage() {
  return <AuthProvider><AppLayout><StudentsContent /></AppLayout></AuthProvider>
      }
