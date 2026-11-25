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

export default function Reports() {
  const today = new Intl.DateTimeFormat('en-CA', {
    timeZone: 'Africa/Cairo', year: 'numeric', month: '2-digit', day: '2-digit',
  }).format(new Date())
  const [start, setStart] = useState(today.slice(0, 8) + '01')
  const [end, setEnd] = useState(today)
  const [summary, setSummary] = useState<Summary | null>(null)
  const [error, setError] = useState('')
  const valid = Boolean(start && end && start <= end)

  useEffect(() => {
    const controller = new AbortController()
    setSummary(null)
    setError('')
    if (valid) {
      api.get<Summary>('/reports/summary', { params: { start, end }, signal: controller.signal })
        .then(({ data }) => { if (!controller.signal.aborted) setSummary(data) })
        .catch(err => { if (!controller.signal.aborted) setError(messageFromError(err)) })
    }
    return () => controller.abort()
  }, [start, end, valid])

  const days = Object.entries(summary?.completed_by_day ?? {})
  const max = Math.max(1, ...days.map(([, count]) => count))
  return <section className="panel">
    <div className="page-heading"><h1>Reports and statistics</h1></div>
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
      <div className="card-grid">{Object.entries(summary.appointments).map(([status, count]) =>
        <div className="feature-card" key={status}><h3>{labels[status] ?? status}</h3><strong>{count}</strong></div>)}</div>
      <h2 className="section-heading">Completed appointments by day</h2>
      {days.length === 0 ? <p className="hint">No appointments in this period.</p> :
        <table><thead><tr><th>Date</th><th>Completed</th></tr></thead>
          <tbody>{days.map(([day, count]) => <tr key={day}><td>{day}</td>
            <td><meter aria-label={day} min={0} max={max} value={count} /> {count}</td></tr>)}</tbody></table>}
    </>}
  </section>
}
