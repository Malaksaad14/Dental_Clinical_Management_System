import './DoctorSchedule.css'
import Icon from './Icon'
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

export default function DoctorSchedule({ dentists, availability, dentistId }: Props) {
  const doctors = dentistId ? dentists.filter((doctor) => doctor.id === dentistId) : dentists

  return <section className="doctor-schedules" aria-label="Dentist weekly schedules">
    <div className="schedule-heading">
      <div><span className="eyebrow">WEEKLY AVAILABILITY</span><h2 className="section-heading">Meet your doctors</h2><p className="hint">Explore each dentist’s regular working days and hours.</p></div>
      <div className="schedule-timezone"><Icon name="clock" size={16}/> Cairo time (GMT+2/+3)</div>
    </div>
    {doctors.length === 0 ? (
      <div className="schedule-empty"><Icon name="calendar" size={25}/><p>No active dentists are available yet.</p></div>
    ) : (
      <div className="schedule-grid">
        {doctors.map((doctor) => {
          const slots = availability
            .filter((slot) => slot.dentist_id === doctor.id)
            .sort((a, b) => a.day_of_week - b.day_of_week || a.start_time.localeCompare(b.start_time))
          const uniqueDays = new Set(slots.map((slot) => slot.day_of_week)).size
          const initials = doctor.name.trim().split(/\s+/).slice(0, 2).map((part) => part[0]?.toUpperCase() ?? '').join('') || 'DR'
          return <article className="schedule-card" key={doctor.id}>
            <div className="schedule-card-header">
              <div className="doctor-avatar">{initials}</div>
              <div className="doctor-header-info"><h3>{doctor.name}</h3><span>Dental care team</span></div>
            </div>
            <div className="doctor-card-meta"><Icon name="calendar" size={15}/>{uniqueDays ? `${uniqueDays} working ${uniqueDays === 1 ? 'day' : 'days'} each week` : 'Schedule not set'}</div>
            {slots.length === 0 ? <p className="schedule-no-hours">Working hours have not been configured yet.</p> : (
              <div className="doctor-hours-list">
                {slots.map((slot) => <div className="doctor-hour-row" key={slot.id}>
                  <span className="day-badge">{WEEK_DAYS[slot.day_of_week] ?? 'Unknown'}</span>
                  <span className="time-range">{timeLabel(slot.start_time)} <span className="time-dash">–</span> {timeLabel(slot.end_time)}</span>
                </div>)}
              </div>
            )}
          </article>
        })}
      </div>
    )}
  </section>
}
