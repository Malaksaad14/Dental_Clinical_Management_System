import { useEffect, useState } from 'react'
import { loadReportData } from './reportData'

type ReportData = Awaited<ReturnType<typeof loadReportData>>

export default function ReportsPage() {
  const [from, setFrom] = useState('2026-11-01')
  const [to, setTo] = useState('2026-11-30')
  const [data, setData] = useState<ReportData | null>(null)
  const [failed, setFailed] = useState(false)

  useEffect(() => {
    const controller = new AbortController()
    loadReportData(controller.signal)
      .then(result => {
        if (!controller.signal.aborted) setData(result)
      })
      .catch(() => {
        if (!controller.signal.aborted) setFailed(true)
      })
    return () => controller.abort()
  }, [])

  if (failed) return <p role="alert">Could not load reports. Check the API and refresh.</p>
  if (!data) return <p role="status">Loading reports...</p>

  const inPeriod = (day: { date: string }) =>
    (!from || day.date >= from) && (!to || day.date <= to)

  const appointments = data[0].filter(inPeriod)
  const patientDays = data[1].filter(inPeriod)
  const paymentDays = data[2].filter(inPeriod)
  const totalPiastres = paymentDays.reduce(
    (sum, day) => sum + Math.round(Number(day.total_received) * 100), 0
  )
  const formattedPayments = (totalPiastres / 100).toLocaleString('en-US', {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  })
  const maxCompleted = appointments.reduce((max, day) => Math.max(max, day.completed), 1)

  return (
    <main>
      <h1>DentaCare Reports</h1>
      <fieldset>
        <legend>Reporting period</legend>
        <label>From <input type="date" value={from}
          onChange={event => setFrom(event.target.value)} /></label>
        {' '}
        <label>To <input type="date" value={to}
          onChange={event => setTo(event.target.value)} /></label>
      </fieldset>

      {from && to && from > to ? (
        <p role="alert">Choose an end date on or after the start date.</p>
      ) : (
        <>
          <h2>Appointments</h2>
          <p>Source: local PostgreSQL demo database</p>
          <dl>
            <dt>Completed appointments</dt>
            <dd>{appointments.reduce((sum, day) => sum + day.completed, 0)}</dd>
            <dt>Cancelled appointments</dt>
            <dd>{appointments.reduce((sum, day) => sum + day.cancelled, 0)}</dd>
            <dt>Scheduled appointments</dt>
            <dd>{appointments.reduce((sum, day) => sum + day.scheduled, 0)}</dd>
            <dt>No-show appointments</dt>
            <dd>{appointments.reduce((sum, day) => sum + day.no_show, 0)}</dd>
          </dl>

          <h2>Completed appointments by day</h2>
          {appointments.length === 0 && <p>No appointments in this period.</p>}
          {appointments.map(day => (
            <div key={day.date}>
              <time dateTime={day.date}>{day.date}</time>{' '}
              <meter aria-label={`Completed on ${day.date}`}
                min={0} max={maxCompleted} value={day.completed} />{' '}
              <strong>{day.completed}</strong>
            </div>
          ))}

          <h2>Patients and payments</h2>
          <p>Source: local PostgreSQL demo database</p>
          <dl>
            <dt>New patients</dt>
            <dd>{patientDays.reduce((sum, day) => sum + day.patients, 0)}</dd>
            <dt>Payments received</dt>
            <dd>EGP {formattedPayments}</dd>
          </dl>
        </>
      )}
    </main>
  )
}


