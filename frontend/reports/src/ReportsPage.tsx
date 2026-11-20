import { useState } from 'react'

const dailyReports = [
  { date: '2026-11-01', patients: 3, completed: 5, cancelled: 1, scheduled: 2, payments: 1200 },
  { date: '2026-11-10', patients: 4, completed: 6, cancelled: 0, scheduled: 3, payments: 1500 },
  { date: '2026-11-20', patients: 5, completed: 7, cancelled: 2, scheduled: 1, payments: 1800 },
]

export default function ReportsPage() {
  const [from, setFrom] = useState('2026-11-01')
  const [to, setTo] = useState('2026-11-30')
  const invalidRange = Boolean(from && to && from > to)

  const selectedDays = dailyReports.filter(
    (day) => (!from || day.date >= from) && (!to || day.date <= to)
  )

  const patients = selectedDays.reduce((sum, day) => sum + day.patients, 0)
  const completed = selectedDays.reduce((sum, day) => sum + day.completed, 0)
  const payments = selectedDays.reduce((sum, day) => sum + day.payments, 0)

  return (
    <main>
      <h1>DentaCare Reports</h1>
      <p>Sample data for November 2026</p>

      <fieldset>
        <legend>Reporting period</legend>
        <label>
          From <input type="date" value={from}
            onChange={(event) => setFrom(event.target.value)} />
        </label>
        {' '}
        <label>
          To <input type="date" value={to}
            onChange={(event) => setTo(event.target.value)} />
        </label>
      </fieldset>

      {invalidRange ? (
        <p role="alert">Choose an end date on or after the start date.</p>
      ) : (
        <dl>
          <dt>New patients</dt>
          <dd>{patients}</dd>
          <dt>Completed appointments</dt>
          <dd>{completed}</dd>
          <dt>Cancelled appointments</dt>
          <dd>{selectedDays.reduce((sum, day) => sum + day.cancelled, 0)}</dd>
          <dt>Scheduled appointments</dt>
          <dd>{selectedDays.reduce((sum, day) => sum + day.scheduled, 0)}</dd>
          <dt>Payments received</dt>
          <dd>EGP {payments.toLocaleString('en-US')}</dd>
        </dl>
      )}
          {!invalidRange && (
        <section aria-label="Completed appointments by day">
          <h2>Completed appointments by day</h2>
          {selectedDays.length === 0 ? (
            <p>No sample data for this period.</p>
          ) : (
            <ul style={{ listStyle: 'none', padding: 0 }}>
              {selectedDays.map((day) => (
                <li key={day.date} style={{
                  display: 'grid',
                  gridTemplateColumns: '7rem 1fr 2rem',
                  alignItems: 'center',
                  gap: '0.75rem',
                  margin: '0.75rem auto',
                  maxWidth: '32rem',
                }}>
                  <time dateTime={day.date}>{day.date}</time>
                  <span aria-hidden="true" style={{
                    background: '#2563eb',
                    height: '1rem',
                    borderRadius: '4px',
                    width: `${100 * day.completed / Math.max(1, ...dailyReports.map(d => d.completed))}%`,
                  }} />
                  <strong>{day.completed}</strong>
                </li>
              ))}
            </ul>
          )}
        </section>
      )}
    </main>
  )
}



