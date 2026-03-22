export const formatCurrency = (amount: number) =>
  new Intl.NumberFormat('en-IN', { style: 'currency', currency: 'INR', maximumFractionDigits: 0 }).format(amount)

export const formatDate = (date: string | Date) =>
  new Date(date).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' })

export const formatDateShort = (date: string | Date) =>
  new Date(date).toLocaleDateString('en-IN', { day: '2-digit', month: 'short' })

export const getCurrentMonth = () => {
  const d = new Date()
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`
}

export const getCurrentDate = () => new Date().toISOString().split('T')[0]

export const getMonthName = (monthStr: string) => {
  const [y, m] = monthStr.split('-')
  return new Date(parseInt(y), parseInt(m) - 1).toLocaleDateString('en-IN', { month: 'long', year: 'numeric' })
}

export const isOverdue = (dueDate: string | Date) => new Date(dueDate) < new Date()

export const shiftLabel: Record<string, string> = {
  Morning: '🌅 Morning (6AM–2PM)',
  Evening: '🌆 Evening (2PM–10PM)',
  'Full Day': '☀️ Full Day',
}

export const shiftFee: Record<string, number> = {
  Morning: 800,
  Evening: 800,
  'Full Day': 1500,
}

export const downloadBlob = (blob: Blob, filename: string) => {
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url; a.download = filename; a.click()
  URL.revokeObjectURL(url)
}
