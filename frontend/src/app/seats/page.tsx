'use client'
import { useEffect, useState } from 'react'
import { Grid3x3, X, Check, Plus, Trash2 } from 'lucide-react'
import AppLayout from '@/components/layout/AppLayout'
import { AuthProvider } from '@/lib/auth'
import { seatsAPI, studentsAPI } from '@/lib/api'
import api from '@/lib/api'
import toast from 'react-hot-toast'

function AssignModal({ seat, students, onClose, onSaved }: any) {
  const [selected, setSelected] = useState('')
  const [loading, setLoading] = useState(false)

  const assign = async () => {
    if (!selected) return
    setLoading(true)
    try {
      await seatsAPI.assign(seat._id, selected)
      toast.success(`Seat ${seat.seatNumber} assigned!`)
      onSaved(); onClose()
    } catch (err: any) {
      toast.error(err.response?.data?.message || 'Failed to assign')
    } finally { setLoading(false) }
  }

  const remove = async () => {
    setLoading(true)
    try {
      await seatsAPI.remove(seat._id)
      toast.success(`Seat ${seat.seatNumber} cleared!`)
      onSaved(); onClose()
    } catch { toast.error('Failed to clear seat') }
    finally { setLoading(false) }
  }

  const deleteSeat = async () => {
    if (!confirm(`Delete Seat ${seat.seatNumber} permanently?`)) return
    setLoading(true)
    try {
      await api.delete(`/seats/${seat._id}`)
      toast.success(`Seat ${seat.seatNumber} deleted!`)
      onSaved(); onClose()
    } catch (err: any) {
      toast.error(err.response?.data?.message || 'Failed to delete')
    } finally { setLoading(false) }
  }

  return (
    <div className="modal-overlay" onClick={e => e.target === e.currentTarget && onClose()}>
      <div className="modal-box p-6 max-w-sm">
        <div className="flex items-center justify-between mb-4">
          <h3 className="font-display text-lg font-semibold" style={{ color: 'var(--text-primary)' }}>
            Seat #{seat.seatNumber}
          </h3>
          <button onClick={onClose}><X size={18} style={{ color: 'var(--text-muted)' }} /></button>
        </div>

        {seat.isOccupied ? (
          <div>
            <div className="p-4 rounded-lg mb-4" style={{ background: 'var(--saffron-light)' }}>
              <div className="font-medium" style={{ color: 'var(--text-primary)' }}>{seat.studentId?.name}</div>
              <div className="text-sm mt-0.5" style={{ color: 'var(--text-muted)' }}>
                {seat.studentId?.phone} • {seat.studentId?.shift}
              </div>
              <span className={`badge mt-2 ${seat.studentId?.feeStatus === 'Paid' ? 'badge-paid' : seat.studentId?.feeStatus === 'Overdue' ? 'badge-overdue' : 'badge-pending'}`}>
                {seat.studentId?.feeStatus}
              </span>
            </div>
            <button onClick={remove} disabled={loading} className="btn-danger w-full justify-center disabled:opacity-50">
              {loading ? 'Removing...' : '🗑 Remove Student from Seat'}
            </button>
          </div>
        ) : (
          <div>
            <p className="text-sm mb-3" style={{ color: 'var(--text-muted)' }}>Assign a student to this seat:</p>
            <select className="input mb-4" value={selected} onChange={e => setSelected(e.target.value)}>
              <option value="">-- Select Student --</option>
              {students.filter((s: any) => !s.seatNumber).map((s: any) => (
                <option key={s._id} value={s._id}>{s.name} ({s.shift})</option>
              ))}
            </select>
            <button onClick={assign} disabled={!selected || loading} className="btn-primary w-full justify-center disabled:opacity-50 mb-3">
              {loading ? 'Assigning...' : 'Assign Student'}
            </button>
            <button onClick={deleteSeat} disabled={loading} className="btn-danger w-full justify-center disabled:opacity-50">
              <Trash2 size={14} /> Delete This Seat
            </button>
          </div>
        )}
      </div>
    </div>
  )
}

function AddSeatsModal({ currentTotal, onClose, onSaved }: any) {
  const [count, setCount] = useState(10)
  const [loading, setLoading] = useState(false)

  const add = async () => {
    setLoading(true)
    try {
      const res = await api.post('/seats/add-more', { count })
      toast.success(res.data.message)
      onSaved(); onClose()
    } catch (err: any) {
      toast.error(err.response?.data?.message || 'Failed to add seats')
    } finally { setLoading(false) }
  }

  return (
    <div className="modal-overlay" onClick={e => e.target === e.currentTarget && onClose()}>
      <div className="modal-box p-6 max-w-sm">
        <div className="flex items-center justify-between mb-4">
          <h3 className="font-display text-lg font-semibold" style={{ color: 'var(--text-primary)' }}>
            Add More Seats
          </h3>
          <button onClick={onClose}><X size={18} style={{ color: 'var(--text-muted)' }} /></button>
        </div>
        <p className="text-sm mb-4" style={{ color: 'var(--text-muted)' }}>
          Current seats: <strong style={{ color: 'var(--text-primary)' }}>{currentTotal}</strong>
          <br />New seats will be numbered from <strong style={{ color: 'var(--saffron)' }}>{currentTotal + 1}</strong> onwards.
        </p>
        <label className="label">How many seats to add?</label>
        <input
          type="number"
          className="input mb-4"
          style={{ padding: '0.625rem 0.75rem' }}
          value={count}
          min={1} max={200}
          onChange={e => setCount(parseInt(e.target.value) || 1)}
        />
        <div className="grid grid-cols-4 gap-2 mb-4">
          {[5, 10, 20, 50].map(n => (
            <button key={n} onClick={() => setCount(n)}
              className={`py-1.5 rounded-lg text-sm font-medium transition-all ${count === n ? 'btn-primary' : 'btn-secondary'}`}>
              +{n}
            </button>
          ))}
        </div>
        <div className="p-3 rounded-lg mb-4 text-sm" style={{ background: 'var(--saffron-light)', color: 'var(--saffron-dark)' }}>
          After adding: <strong>{currentTotal + count} total seats</strong> (Seat {currentTotal + 1} → {currentTotal + count})
        </div>
        <div className="flex gap-3">
          <button onClick={onClose} className="btn-secondary flex-1 justify-center">Cancel</button>
          <button onClick={add} disabled={loading || count < 1} className="btn-primary flex-1 justify-center disabled:opacity-50">
            {loading ? 'Adding...' : `Add ${count} Seats`}
          </button>
        </div>
      </div>
    </div>
  )
}

function SeatsContent() {
  const [seats, setSeats] = useState<any[]>([])
  const [students, setStudents] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [selected, setSelected] = useState<any>(null)
  const [showAddModal, setShowAddModal] = useState(false)
  const [filter, setFilter] = useState<'all' | 'available' | 'occupied'>('all')
  const [initializing, setInitializing] = useState(false)

  const load = async () => {
    setLoading(true)
    try {
      const [sr, studr] = await Promise.all([seatsAPI.getAll(), studentsAPI.getAll({ limit: 200 })])
      setSeats(sr.data.seats)
      setStudents(studr.data.students)
    } catch { toast.error('Failed to load seats') }
    finally { setLoading(false) }
  }

  useEffect(() => { load() }, [])

  const initSeats = async () => {
    const n = prompt('How many seats to create?', '50')
    if (!n || isNaN(parseInt(n))) return
    setInitializing(true)
    try {
      await seatsAPI.initialize(parseInt(n))
      toast.success(`${n} seats created!`)
      load()
    } catch (err: any) {
      toast.error(err.response?.data?.message || 'Failed to initialize')
    } finally { setInitializing(false) }
  }

  const filtered = seats.filter(s =>
    filter === 'all' ? true : filter === 'available' ? !s.isOccupied : s.isOccupied
  )

  const occupied = seats.filter(s => s.isOccupied).length
  const available = seats.length - occupied

  return (
    <div className="space-y-5">
      <div className="flex items-center justify-between animate-in">
        <div>
          <h1 className="text-2xl font-display font-bold" style={{ color: 'var(--text-primary)' }}>Seat Map</h1>
          <p className="text-sm mt-0.5" style={{ color: 'var(--text-muted)' }}>
            {occupied} occupied · {available} available · {seats.length} total
          </p>
        </div>
        <div className="flex gap-2">
          {seats.length === 0 ? (
            <button onClick={initSeats} disabled={initializing} className="btn-primary">
              {initializing ? 'Creating...' : '+ Initialize Seats'}
            </button>
          ) : (
            <button onClick={() => setShowAddModal(true)} className="btn-primary">
              <Plus size={15} /> Add Seats
            </button>
          )}
        </div>
      </div>

      {/* Legend + Filter */}
      <div className="flex flex-wrap items-center gap-4 animate-in stagger-1">
        <div className="flex items-center gap-4">
          <div className="flex items-center gap-1.5 text-xs" style={{ color: 'var(--green)' }}>
            <div className="w-3 h-3 rounded-sm" style={{ background: 'var(--green-light)', border: '1px solid rgba(45,122,79,0.4)' }} /> Available
          </div>
          <div className="flex items-center gap-1.5 text-xs" style={{ color: 'var(--saffron-dark)' }}>
            <div className="w-3 h-3 rounded-sm" style={{ background: 'var(--saffron-light)', border: '1px solid rgba(255,125,15,0.4)' }} /> Occupied
          </div>
          <div className="flex items-center gap-1.5 text-xs" style={{ color: 'var(--red)' }}>
            <div className="w-3 h-3 rounded-sm" style={{ background: 'var(--red-light)', border: '1px solid rgba(192,57,43,0.4)' }} /> Overdue
          </div>
        </div>
        <div className="ml-auto flex gap-1">
          {(['all', 'available', 'occupied'] as const).map(f => (
            <button key={f} onClick={() => setFilter(f)}
              className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-all ${filter === f ? 'btn-primary' : 'btn-secondary'}`}>
              {f.charAt(0).toUpperCase() + f.slice(1)}
            </button>
          ))}
        </div>
      </div>

      {/* Seat Grid */}
      {loading ? (
        <div className="grid grid-cols-5 sm:grid-cols-8 md:grid-cols-10 gap-2">
          {[...Array(50)].map((_, i) => (
            <div key={i} className="aspect-square rounded-lg animate-pulse" style={{ background: 'var(--bg-secondary)' }} />
          ))}
        </div>
      ) : seats.length === 0 ? (
        <div className="card p-12 text-center">
          <Grid3x3 size={40} className="mx-auto mb-3" style={{ color: 'var(--text-muted)' }} />
          <p className="font-medium mb-1" style={{ color: 'var(--text-primary)' }}>No seats configured</p>
          <p className="text-sm" style={{ color: 'var(--text-muted)' }}>Click "Initialize Seats" to set up the seat layout</p>
        </div>
      ) : (
        <div className="card p-4 animate-in stagger-2">
          <div className="grid grid-cols-5 sm:grid-cols-8 md:grid-cols-10 gap-2">
            {filtered.map((seat) => {
              const isOverdue = seat.isOccupied && seat.studentId?.feeStatus === 'Overdue'
              return (
                <button
                  key={seat._id}
                  onClick={() => setSelected(seat)}
                  title={seat.isOccupied ? `${seat.studentId?.name} (${seat.studentId?.shift})` : `Seat ${seat.seatNumber} - Available`}
                  className={`aspect-square text-xs font-medium rounded-lg flex flex-col items-center justify-center gap-0.5 transition-all duration-200 hover:scale-105 hover:shadow-md
                    ${seat.isOccupied ? (isOverdue ? 'seat-occupied seat-overdue' : 'seat-occupied') : 'seat-available'}`}
                >
                  <span className="text-xs font-mono font-bold leading-none">{seat.seatNumber}</span>
                  {seat.isOccupied && (
                    <span className="leading-none opacity-80 truncate w-full text-center px-0.5" style={{ fontSize: 9 }}>
                      {seat.studentId?.name?.split(' ')[0]}
                    </span>
                  )}
                </button>
              )
            })}
          </div>
        </div>
      )}

      {/* Occupancy bar */}
      {seats.length > 0 && (
        <div className="card p-4 animate-in stagger-3">
          <div className="flex items-center gap-2 mb-2">
            <span className="text-xs font-medium" style={{ color: 'var(--text-muted)' }}>Occupancy</span>
            <span className="text-xs font-bold ml-auto" style={{ color: 'var(--text-primary)' }}>
              {Math.round((occupied / seats.length) * 100)}%
            </span>
          </div>
          <div className="h-2 rounded-full overflow-hidden" style={{ background: 'var(--bg-secondary)' }}>
            <div className="h-full rounded-full transition-all duration-500"
              style={{ width: `${(occupied / seats.length) * 100}%`, background: 'linear-gradient(90deg, var(--saffron), #c74608)' }} />
          </div>
          <p className="text-xs mt-2" style={{ color: 'var(--text-muted)' }}>
            💡 Click any seat to assign a student, remove one, or delete the seat
          </p>
        </div>
      )}

      {selected && <AssignModal seat={selected} students={students} onClose={() => setSelected(null)} onSaved={load} />}
      {showAddModal && <AddSeatsModal currentTotal={seats.length} onClose={() => setShowAddModal(false)} onSaved={load} />}
    </div>
  )
}

export default function SeatsPage() {
  return <AuthProvider><AppLayout><SeatsContent /></AppLayout></AuthProvider>
          }
