import './DoctorSchedule.css'
import type { Availability, Dentist } from '../types'

export const WEEK_DAYS = [
  'Monday', 'Tuesday', 'Wednesday', 'Thursday',
  'Friday', 'Saturday', 'Sunday',
] as const

export function timeLabel(value: string): string {
  const [hours, minutes] = value.split(':').map(Number)
  if (!Number.isFinite(hours) || !Number.isFinite(minutes)) return value
  const period = hours < 12 ? 'AM' : 'PM'
  const hour12 = hours % 12 || 12
  return `${hour12}:${String(minutes).padStart(2, '0')} ${period}`
}

interface Props {
  dentists: Dentist[]
  availability: Availability[]
  dentistId?: number
}

export default function DoctorSchedule({
  dentists,
  availability,
  dentistId,
}: Props) {
  const doctors = dentistId
    ? dentists.filter((doctor) => doctor.id === dentistId)
    : dentists

  return (
    <section aria-label="Dentist weekly schedules">
      <div className="schedule-heading">
        <h2 className="section-heading">Dentists' weekly schedules</h2>
        <p className="hint">All hours are in Cairo time (Africa/Cairo).</p>
      </div>
      {doctors.length === 0 ? (
        <p className="hint">No active dentists are available yet.</p>
      ) : (
        <div className="schedule-grid">
          {doctors.map((doctor) => {
            const slots = availability
              .filter((slot) => slot.dentist_id === doctor.id)
              .sort((a, b) => a.day_of_week - b.day_of_week || a.start_time.localeCompare(b.start_time))
            return (
              <article className="schedule-card" key={doctor.id}>
                <h3>{doctor.name}</h3>
                {slots.length === 0 ? (
                  <p className="hint">No working hours configured yet.</p>
                ) : (
                  <table className="doctor-hours">
                    <thead><tr><th>Day</th><th>From</th><th>To</th></tr></thead>
                    <tbody>
                      {slots.map((slot) => (
                        <tr key={slot.id}>
                          <td>{WEEK_DAYS[slot.day_of_week] ?? 'Unknown day'}</td>
                          <td>{timeLabel(slot.start_time)}</td>
                          <td>{timeLabel(slot.end_time)}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                )}
              </article>
            )
          })}
        </div>
      )}
    </section>
  )
}
