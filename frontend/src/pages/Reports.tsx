import './Reports.css'
import { useEffect, useState } from 'react'
import { api, messageFromError } from '../api/client'

type Summary = {
  new_patients: number
  received: string
  appointments: Record<string, number>
  completed_by_day: Record<string, number>
}

const labels: Record<string, string> = {
  completed: 'Completed', scheduled: 'Scheduled', cancelled: 'Cancelled', no_show: 'No-show',
}
const money = new Intl.NumberFormat('en-EG', { style: 'currency', currency: 'EGP' })

function ReportBars({ rows }: { rows: [string, number][] }) {
  const peak = rows.reduce((highest, [, count]) => Math.max(highest, count), 1)
  return <ul className="report-bars">{rows.map(([label, count]) =>
    <li key={label}><span>{label}</span><span className="report-track" aria-hidden="true">
      <span style={{ width: `${100 * count / peak}%` }} />
    </span><strong>{count}</strong></li>)}</ul>
}

function downloadReport(summary: Summary, start: string, end: string) {
  const rows = [
    ['From', 'To', 'Metric', 'Day', 'Value', 'Unit'],
    [start, end, 'New patients', '', summary.new_patients, 'patients'],
    [start, end, 'Payments received', '', summary.received, 'EGP'],
    ...Object.entries(summary.appointments).map(([status, count]) =>
      [start, end, labels[status] ?? status, '', count, 'appointments']),
    ...Object.entries(summary.completed_by_day).sort().map(([day, count]) =>
      [start, end, 'Completed by day', day, count, 'appointments']),
  ]
  const csv = rows.map(row => row.map(value => '"' + String(value).replaceAll('"', '""') + '"').join(',')).join('\r\n')
  const url = URL.createObjectURL(new Blob(['\uFEFF', csv], { type: 'text/csv;charset=utf-8' }))
  const link = document.createElement('a')
  link.href = url
  link.download = `DentaCare-report-${start}-to-${end}.csv`
  document.body.appendChild(link)
  link.click()
  link.remove()
  window.setTimeout(() => URL.revokeObjectURL(url), 1000)
}

export default function Reports() {
  const today = new Intl.DateTimeFormat('en-CA', {
    timeZone: 'Africa/Cairo', year: 'numeric', month: '2-digit', day: '2-digit',
  }).format(new Date())
  const [start, setStart] = useState(today.slice(0, 8) + '01')
  const [end, setEnd] = useState(today)
  const [result, setResult] = useState<{ start: string; end: string; data: Summary } | null>(null)
  const summary = result?.start === start && result.end === end ? result.data : null
  const [error, setError] = useState('')
  const valid = Boolean(start && end && start <= end)

  useEffect(() => {
    const controller = new AbortController()
    setResult(null)
    setError('')
    if (valid) {
      api.get<Summary>('/reports/summary', { params: { start, end }, signal: controller.signal })
        .then(({ data }) => { if (!controller.signal.aborted) setResult({ start, end, data }) })
        .catch(err => { if (!controller.signal.aborted) setError(messageFromError(err)) })
    }
    return () => controller.abort()
  }, [start, end, valid])

  const days = Object.entries(summary?.completed_by_day ?? {})

  return <section className="panel">
    <div className="page-heading"><h1>Reports and statistics</h1>
      <button className="primary" disabled={!valid || !summary}
        onClick={() => summary && downloadReport(summary, start, end)}>Download report (CSV)</button></div>
    <div className="form-grid">
      <label>From<input type="date" value={start} onChange={e => setStart(e.target.value)} /></label>
      <label>To<input type="date" value={end} onChange={e => setEnd(e.target.value)} /></label>
    </div>
    {!valid && <p className="error">Choose a start date on or before the end date.</p>}
    {error && <p className="error" role="alert">{error}</p>}
    {valid && !summary && !error && <p role="status">Loading reports…</p>}
    {valid && summary && <>
      <h2 className="section-heading">Clinic activity</h2>
      <div className="card-grid">
        <div className="feature-card"><h3>New patients</h3><strong>{summary.new_patients}</strong></div>
        <div className="feature-card"><h3>Payments received</h3><strong>{money.format(Number(summary.received))}</strong></div>
      </div>
      <h2 className="section-heading">Appointment status</h2>
      <ReportBars rows={Object.entries(summary.appointments).map(([status, count]) => [labels[status] ?? status, count])} />
      <h2 className="section-heading">Completed appointments by day</h2>
      {days.length === 0 ? <p className="hint">No appointments in this period.</p> :
        <ReportBars rows={days.sort()} />}
    </>}
  </section>
}
