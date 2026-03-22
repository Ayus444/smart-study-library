'use client'
import { useEffect, useState } from 'react'
import { Plus, X, IndianRupee, RefreshCw, TrendingUp } from 'lucide-react'
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer } from 'recharts'
import AppLayout from '@/components/layout/AppLayout'
import { AuthProvider } from '@/lib/auth'
import { paymentsAPI, studentsAPI } from '@/lib/api'
import { formatCurrency, formatDate, getCurrentMonth, getMonthName } from '@/lib/utils'
import toast from 'react-hot-toast'

function PaymentModal({ students, onClose, onSaved }: any) {
  const [form, setForm] = useState({ studentId: '', amount: '', month: getCurrentMonth(), paymentMethod: 'Cash', transactionId: '', notes: '' })
  const [loading, setLoading] = useState(false)
  const set = (k: string, v: any) => setForm(f => ({ ...f, [k]: v }))

  const onStudentChange = (id: string) => {
    const s = students.find((s: any) => s._id === id)
    set('studentId', id)
    if (s) set('amount', s.monthlyFee)
  }

  const submit = async (e: any) => {
    e.preventDefault()
    setLoading(true)
    try {
      await paymentsAPI.create(form)
      toast.success('Payment recorded!')
      onSaved(); onClose()
    } catch (err: any) {
      toast.error(err.response?.data?.message || 'Error recording payment')
    } finally { setLoading(false) }
  }

  return (
    <div className="modal-overlay" onClick={e => e.target === e.currentTarget && onClose()}>
      <div className="modal-box p-6 max-w-sm">
        <div className="flex items-center justify-between mb-5">
          <h3 className="font-display text-lg font-semibold" style={{ color: 'var(--text-primary)' }}>Record Payment</h3>
          <button onClick={onClose}><X size={18} style={{ color: 'var(--text-muted)' }} /></button>
        </div>
        <form onSubmit={submit} className="space-y-3">
          <div>
            <label className="label">Student *</label>
            <select className="input" value={form.studentId} onChange={e => onStudentChange(e.target.value)} required>
              <option value="">-- Select Student --</option>
              {students.map((s: any) => <option key={s._id} value={s._id}>{s.name} (Seat {s.seatNumber || 'N/A'})</option>)}
            </select>
          </div>
          <div>
            <label className="label">Month *</label>
            <input type="month" className="input" value={form.month} onChange={e => set('month', e.target.value)} required />
          </div>
          <div>
            <label className="label">Amount (₹) *</label>
            <input type="number" className="input" value={form.amount} onChange={e => set('amount', e.target.value)} required placeholder="1500" />
          </div>
          <div>
            <label className="label">Payment Method</label>
            <select className="input" value={form.paymentMethod} onChange={e => set('paymentMethod', e.target.value)}>
              {['Cash', 'UPI', 'Bank Transfer', 'Other'].map(m => <option key={m}>{m}</option>)}
            </select>
          </div>
          <div>
            <label className="label">Transaction ID</label>
            <input className="input" value={form.transactionId} onChange={e => set('transactionId', e.target.value)} placeholder="UPI ref / receipt no." />
          </div>
          <div>
            <label className="label">Notes</label>
            <input className="input" value={form.notes} onChange={e => set('notes', e.target.value)} placeholder="Optional notes" />
          </div>
          <div className="flex gap-3 pt-2">
            <button type="button" onClick={onClose} className="btn-secondary flex-1 justify-center">Cancel</button>
            <button type="submit" disabled={loading} className="btn-primary flex-1 justify-center disabled:opacity-50">
              {loading ? 'Saving...' : 'Record Payment'}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}

function PaymentsContent() {
  const [payments, setPayments] = useState<any[]>([])
  const [students, setStudents] = useState<any[]>([])
  const [revenueData, setRevenueData] = useState<any[]>([])
  const [filterStatus, setFilterStatus] = useState('')
  const [filterMonth, setFilterMonth] = useState(getCurrentMonth())
  const [loading, setLoading] = useState(true)
  const [modal, setModal] = useState(false)

  const load = async () => {
    setLoading(true)
    try {
      const [pr, sr, rev] = await Promise.all([
        paymentsAPI.getAll({ status: filterStatus, month: filterMonth }),
        studentsAPI.getAll({ limit: 200 }),
        paymentsAPI.getMonthlyRevenue()
      ])
      setPayments(pr.data.payments)
      setStudents(sr.data.students)
      setRevenueData(rev.data.data)
    } catch { toast.error('Failed to load payments') }
    finally { setLoading(false) }
  }

  useEffect(() => { load() }, [filterStatus, filterMonth])

  const updateOverdue = async () => {
    try {
      const r = await paymentsAPI.updateOverdue()
      toast.success(r.data.message)
      load()
    } catch { toast.error('Failed to update overdue') }
  }

  const totalRevenue = payments.filter(p => p.status === 'Paid').reduce((a, p) => a + p.amount, 0)
  const statusClass: Record<string, string> = { Paid: 'badge-paid', Pending: 'badge-pending', Overdue: 'badge-overdue' }

  return (
    <div className="space-y-5">
      <div className="flex items-center justify-between animate-in">
        <div>
          <h1 className="text-2xl font-display font-bold" style={{ color: 'var(--text-primary)' }}>Payments</h1>
          <p className="text-sm mt-0.5" style={{ color: 'var(--text-muted)' }}>{payments.length} records</p>
        </div>
        <div className="flex gap-2">
          <button onClick={updateOverdue} className="btn-secondary text-sm"><RefreshCw size={14} /> Update Overdue</button>
          <button onClick={() => setModal(true)} className="btn-primary"><Plus size={16} /> Record Payment</button>
        </div>
      </div>

      {/* Summary */}
      <div className="grid grid-cols-3 gap-4 animate-in stagger-1">
        {[
          { label: 'Collected', value: formatCurrency(totalRevenue), color: 'var(--green)' },
          { label: 'Pending', value: payments.filter(p => p.status === 'Pending').length, color: 'var(--amber)' },
          { label: 'Overdue', value: payments.filter(p => p.status === 'Overdue').length, color: 'var(--red)' },
        ].map(({ label, value, color }) => (
          <div key={label} className="card p-4 text-center">
            <div className="text-xl font-display font-bold" style={{ color }}>{value}</div>
            <div className="text-xs mt-1" style={{ color: 'var(--text-muted)' }}>{label}</div>
          </div>
        ))}
      </div>

      {/* Revenue Chart */}
      {revenueData.length > 0 && (
        <div className="card p-5 animate-in stagger-2">
          <h3 className="font-display font-semibold mb-4 flex items-center gap-2" style={{ color: 'var(--text-primary)' }}>
            <TrendingUp size={16} style={{ color: 'var(--saffron)' }} /> Revenue Trend
          </h3>
          <ResponsiveContainer width="100%" height={160}>
            <BarChart data={revenueData.map((d: any) => ({ month: getMonthName(d._id).split(' ')[0], revenue: d.revenue }))}>
              <XAxis dataKey="month" tick={{ fontSize: 11, fill: 'var(--text-muted)' }} axisLine={false} tickLine={false} />
              <YAxis tick={{ fontSize: 11, fill: 'var(--text-muted)' }} axisLine={false} tickLine={false} tickFormatter={v => `₹${(v / 1000).toFixed(0)}k`} />
              <Tooltip formatter={(v: any) => [formatCurrency(v), 'Revenue']} contentStyle={{ background: 'var(--bg-card)', border: '1px solid var(--border)', borderRadius: 8, fontSize: 12 }} />
              <Bar dataKey="revenue" fill="var(--saffron)" radius={[4, 4, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>
      )}

      {/* Filters */}
      <div className="flex flex-wrap gap-3 animate-in stagger-2">
        <input type="month" className="input w-auto" value={filterMonth} onChange={e => setFilterMonth(e.target.value)} />
        <select className="input w-auto" value={filterStatus} onChange={e => setFilterStatus(e.target.value)}>
          <option value="">All Status</option>
          {['Paid', 'Pending', 'Overdue'].map(s => <option key={s}>{s}</option>)}
        </select>
      </div>

      {/* Table */}
      <div className="card overflow-hidden animate-in stagger-3">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr style={{ background: 'var(--bg-secondary)', borderBottom: '1px solid var(--border)' }}>
                {['Student', 'Month', 'Amount', 'Method', 'Payment Date', 'Due Date', 'Status'].map(h => (
                  <th key={h} className="text-left px-4 py-3 text-xs font-semibold uppercase tracking-wide" style={{ color: 'var(--text-muted)' }}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {loading ? (
                [...Array(5)].map((_, i) => (
                  <tr key={i} className="table-row">
                    {[...Array(7)].map((_, j) => (
                      <td key={j} className="px-4 py-3"><div className="h-4 rounded animate-pulse" style={{ background: 'var(--bg-secondary)', width: 80 }} /></td>
                    ))}
                  </tr>
                ))
              ) : payments.length === 0 ? (
                <tr><td colSpan={7} className="text-center py-12 text-sm" style={{ color: 'var(--text-muted)' }}>No payment records found</td></tr>
              ) : payments.map(p => (
                <tr key={p._id} className="table-row">
                  <td className="px-4 py-3">
                    <div className="font-medium" style={{ color: 'var(--text-primary)' }}>{p.studentId?.name}</div>
                    <div className="text-xs" style={{ color: 'var(--text-muted)' }}>Seat {p.studentId?.seatNumber || 'N/A'}</div>
                  </td>
                  <td className="px-4 py-3" style={{ color: 'var(--text-secondary)' }}>{getMonthName(p.month)}</td>
                  <td className="px-4 py-3 font-medium font-mono" style={{ color: 'var(--text-primary)' }}>{formatCurrency(p.amount)}</td>
                  <td className="px-4 py-3 text-xs" style={{ color: 'var(--text-muted)' }}>{p.paymentMethod}</td>
                  <td className="px-4 py-3 text-xs" style={{ color: 'var(--text-muted)' }}>
                    {p.paymentDate ? formatDate(p.paymentDate) : '—'}
                  </td>
                  <td className="px-4 py-3 text-xs" style={{ color: p.status === 'Overdue' ? 'var(--red)' : 'var(--text-muted)' }}>
                    {formatDate(p.dueDate)}
                  </td>
                  <td className="px-4 py-3"><span className={`badge ${statusClass[p.status]}`}>{p.status}</span></td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {modal && <PaymentModal students={students} onClose={() => setModal(false)} onSaved={load} />}
    </div>
  )
}

export default function PaymentsPage() {
  return <AuthProvider><AppLayout><PaymentsContent /></AppLayout></AuthProvider>
}
