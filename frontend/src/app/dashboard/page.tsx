'use client'
import { useEffect, useState } from 'react'
import { Users, Grid3x3, IndianRupee, TrendingUp, AlertTriangle, Bell, Send, CheckCircle2, Clock } from 'lucide-react'
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, PieChart, Pie, Cell } from 'recharts'
import AppLayout from '@/components/layout/AppLayout'
import { AuthProvider } from '@/lib/auth'
import { dashboardAPI, notificationsAPI } from '@/lib/api'
import { formatCurrency, formatDate, getMonthName } from '@/lib/utils'
import toast from 'react-hot-toast'

const PIE_COLORS = ['#ff7d0f', '#3949ab', '#2d7a4f']

function DashboardContent() {
  const [data, setData] = useState<any>(null)
  const [notifications, setNotifications] = useState<any[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    Promise.all([dashboardAPI.get(), notificationsAPI.getAll()])
      .then(([d, n]) => {
        setData(d.data)
        setNotifications(n.data.notifications)
      })
      .catch(() => toast.error('Failed to load dashboard'))
      .finally(() => setLoading(false))
  }, [])

  const sendReminder = async (studentId: string) => {
    try {
      await notificationsAPI.sendReminder(studentId, 'whatsapp')
      toast.success('Reminder sent (mock)!')
    } catch { toast.error('Failed to send') }
  }

  if (loading) return (
    <div className="flex items-center justify-center h-64">
      <div className="text-center">
        <div className="w-8 h-8 rounded-full border-2 border-t-transparent animate-spin mx-auto mb-3" style={{ borderColor: 'var(--saffron)', borderTopColor: 'transparent' }} />
        <p style={{ color: 'var(--text-muted)' }}>Loading dashboard...</p>
      </div>
    </div>
  )

  const { stats, revenueData, shiftDistribution, overdueStudents } = data || {}

  const pieData = shiftDistribution?.map((d: any) => ({ name: d._id, value: d.count })) || []

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="animate-in">
        <h1 className="text-2xl font-display font-bold" style={{ color: 'var(--text-primary)' }}>Dashboard</h1>
        <p className="text-sm mt-0.5" style={{ color: 'var(--text-muted)' }}>
          {new Date().toLocaleDateString('en-IN', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' })}
        </p>
      </div>

      {/* Stat Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {[
          { label: 'Total Students', value: stats?.totalStudents || 0, icon: Users, color: 'var(--saffron)', bg: 'var(--saffron-light)', delay: 'stagger-1' },
          { label: 'Seats Occupied', value: `${stats?.occupiedSeats || 0} / ${stats?.totalSeats || 0}`, icon: Grid3x3, color: 'var(--green)', bg: 'var(--green-light)', delay: 'stagger-2' },
          { label: 'Monthly Revenue', value: formatCurrency(stats?.monthlyRevenue || 0), icon: IndianRupee, color: '#3949ab', bg: '#e8eaf6', delay: 'stagger-3' },
          { label: 'Today Present', value: stats?.todayAttendance || 0, icon: CheckCircle2, color: '#2e7d32', bg: '#e8f5e9', delay: 'stagger-4' },
        ].map(({ label, value, icon: Icon, color, bg, delay }) => (
          <div key={label} className={`stat-card corner-decoration relative overflow-hidden animate-in ${delay}`}>
            <div className="flex items-center justify-between">
              <div className="w-9 h-9 rounded-lg flex items-center justify-center" style={{ background: bg }}>
                <Icon size={18} style={{ color }} />
              </div>
            </div>
            <div className="mt-3">
              <div className="text-2xl font-display font-bold" style={{ color: 'var(--text-primary)' }}>{value}</div>
              <div className="text-xs mt-0.5" style={{ color: 'var(--text-muted)' }}>{label}</div>
            </div>
          </div>
        ))}
      </div>

      {/* Payment Status Row */}
      <div className="grid grid-cols-3 gap-4 animate-in stagger-2">
        <div className="card p-4 flex items-center gap-3">
          <div className="w-2 h-10 rounded-full" style={{ background: 'var(--green)' }} />
          <div>
            <div className="text-xl font-display font-bold" style={{ color: 'var(--text-primary)' }}>{stats?.paidThisMonth || 0}</div>
            <div className="text-xs" style={{ color: 'var(--text-muted)' }}>Paid this month</div>
          </div>
        </div>
        <div className="card p-4 flex items-center gap-3">
          <div className="w-2 h-10 rounded-full" style={{ background: 'var(--amber)' }} />
          <div>
            <div className="text-xl font-display font-bold" style={{ color: 'var(--text-primary)' }}>{stats?.pendingPayments || 0}</div>
            <div className="text-xs" style={{ color: 'var(--text-muted)' }}>Pending</div>
          </div>
        </div>
        <div className="card p-4 flex items-center gap-3">
          <div className="w-2 h-10 rounded-full" style={{ background: 'var(--red)' }} />
          <div>
            <div className="text-xl font-display font-bold" style={{ color: 'var(--text-primary)' }}>{stats?.overduePayments || 0}</div>
            <div className="text-xs" style={{ color: 'var(--text-muted)' }}>Overdue</div>
          </div>
        </div>
      </div>

      {/* Charts Row */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 animate-in stagger-3">
        {/* Revenue Chart */}
        <div className="card p-5 lg:col-span-2">
          <h3 className="font-display font-semibold mb-4" style={{ color: 'var(--text-primary)' }}>Monthly Revenue</h3>
          {revenueData?.length > 0 ? (
            <ResponsiveContainer width="100%" height={200}>
              <BarChart data={revenueData.map((d: any) => ({ month: getMonthName(d._id).split(' ')[0], revenue: d.revenue }))}>
                <XAxis dataKey="month" tick={{ fontSize: 11, fill: 'var(--text-muted)' }} axisLine={false} tickLine={false} />
                <YAxis tick={{ fontSize: 11, fill: 'var(--text-muted)' }} axisLine={false} tickLine={false} tickFormatter={v => `₹${(v/1000).toFixed(0)}k`} />
                <Tooltip formatter={(v: any) => [formatCurrency(v), 'Revenue']}
                  contentStyle={{ background: 'var(--bg-card)', border: '1px solid var(--border)', borderRadius: 8, fontSize: 12 }} />
                <Bar dataKey="revenue" fill="var(--saffron)" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          ) : <div className="h-48 flex items-center justify-center text-sm" style={{ color: 'var(--text-muted)' }}>No revenue data yet</div>}
        </div>

        {/* Shift Distribution */}
        <div className="card p-5">
          <h3 className="font-display font-semibold mb-4" style={{ color: 'var(--text-primary)' }}>Shift Split</h3>
          {pieData.length > 0 ? (
            <>
              <ResponsiveContainer width="100%" height={140}>
                <PieChart>
                  <Pie data={pieData} cx="50%" cy="50%" innerRadius={40} outerRadius={65} dataKey="value" paddingAngle={3}>
                    {pieData.map((_: any, i: number) => <Cell key={i} fill={PIE_COLORS[i % PIE_COLORS.length]} />)}
                  </Pie>
                  <Tooltip contentStyle={{ background: 'var(--bg-card)', border: '1px solid var(--border)', borderRadius: 8, fontSize: 12 }} />
                </PieChart>
              </ResponsiveContainer>
              <div className="space-y-1.5 mt-2">
                {pieData.map((d: any, i: number) => (
                  <div key={d.name} className="flex items-center justify-between text-xs">
                    <div className="flex items-center gap-2">
                      <div className="w-2.5 h-2.5 rounded-full" style={{ background: PIE_COLORS[i] }} />
                      <span style={{ color: 'var(--text-secondary)' }}>{d.name}</span>
                    </div>
                    <span className="font-medium" style={{ color: 'var(--text-primary)' }}>{d.value}</span>
                  </div>
                ))}
              </div>
            </>
          ) : <div className="h-40 flex items-center justify-center text-sm" style={{ color: 'var(--text-muted)' }}>No data</div>}
        </div>
      </div>

      {/* Overdue Alerts */}
      {overdueStudents?.length > 0 && (
        <div className="card p-5 animate-in stagger-4">
          <div className="flex items-center gap-2 mb-4">
            <AlertTriangle size={18} style={{ color: 'var(--red)' }} />
            <h3 className="font-display font-semibold" style={{ color: 'var(--text-primary)' }}>Overdue Fee Alerts</h3>
            <span className="badge badge-overdue ml-auto">{overdueStudents.length}</span>
          </div>
          <div className="space-y-2">
            {overdueStudents.map((s: any) => (
              <div key={s._id} className="flex items-center justify-between p-3 rounded-lg" style={{ background: 'var(--red-light)' }}>
                <div>
                  <div className="text-sm font-medium" style={{ color: 'var(--text-primary)' }}>{s.name}</div>
                  <div className="text-xs" style={{ color: 'var(--text-muted)' }}>
                    📱 {s.phone} • Seat {s.seatNumber || 'N/A'} • Due: {formatDate(s.dueDate)}
                  </div>
                </div>
                <button onClick={() => sendReminder(s._id)} className="btn-danger text-xs px-3 py-1.5 gap-1">
                  <Send size={12} /> Remind
                </button>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}

export default function DashboardPage() {
  return <AuthProvider><AppLayout><DashboardContent /></AppLayout></AuthProvider>
}
