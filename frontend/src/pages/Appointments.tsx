import { useEffect, useState, type FormEvent } from 'react'
import { useSearchParams } from 'react-router'
import { api, messageFromError } from '../api/client'
import { useAuth } from '../auth/AuthContext'
import DoctorSchedule, { WEEK_DAYS } from '../components/DoctorSchedule'
import type { Appointment, Availability, Dentist, Patient, Service } from '../types'

function mondayFirstWeekday(datePart: string): number {
  // Calendar weekday calculation is based on the chosen date, not the user's clock.
  const date = new Date(`${datePart}T12:00:00Z`)
  return (date.getUTCDay() + 6) % 7
}

function minutesOfDay(timeText: string): number {
  const [hours, minutes] = timeText.split(':').map(Number)
  return hours * 60 + minutes
}

// Convert a selected Cairo wall-clock time into an actual UTC instant.
// This uses the browser's timezone database, including Egypt daylight-saving rules.
function cairoTimeToUtcIso(localDateTime: string): string {
  const [datePart, clockPart] = localDateTime.split('T')
  if (!datePart || !clockPart) throw new Error('Please choose an appointment date and time.')
  const [year, month, day] = datePart.split('-').map(Number)
  const [hour, minute] = clockPart.split(':').map(Number)
  if ([year, month, day, hour, minute].some((n) => !Number.isFinite(n))) {
    throw new Error('Please enter a valid appointment date and time.')
  }
  const desiredWall = Date.UTC(year, month - 1, day, hour, minute)
  const formatter = new Intl.DateTimeFormat('en-GB', {
    timeZone: 'Africa/Cairo',
    year: 'numeric', month: '2-digit', day: '2-digit',
    hour: '2-digit', minute: '2-digit', hourCycle: 'h23',
  })
  const cairoWallAt = (utcMillis: number) => {
    const values: Record<string, number> = {}
    for (const part of formatter.formatToParts(new Date(utcMillis))) {
      if (['year', 'month', 'day', 'hour', 'minute'].includes(part.type)) {
        values[part.type] = Number(part.value)
      }
    }
    return Date.UTC(values.year, values.month - 1, values.day, values.hour, values.minute)
  }
  let guess = desiredWall
  for (let tries = 0; tries < 4; tries++) {
    const delta = desiredWall - cairoWallAt(guess)
    if (delta === 0) return new Date(guess).toISOString()
    guess += delta
  }
  throw new Error('This Cairo local time is unavailable due to a daylight-saving clock change.')
}

export default function Appointments() {
  const { user } = useAuth()
  const patientMode = user?.role === 'patient'
  const [searchParams] = useSearchParams()
  const [patients, setPatients] = useState<Patient[]>([])
  const [dentists, setDentists] = useState<Dentist[]>([])
  const [services, setServices] = useState<Service[]>([])
  const [availability, setAvailability] = useState<Availability[]>([])
  const [appointments, setAppointments] = useState<Appointment[]>([])
  const [form, setForm] = useState({
    patient_id: searchParams.get('patient_id') ?? '',
    dentist_id: '',
    service_id: '',
    start_time: '',
    reason: '',
  })
  const [error, setError] = useState('')
  const [success, setSuccess] = useState('')
  const [busy, setBusy] = useState(false)
  const update = (name: keyof typeof form, value: string) => setForm((previous) => ({ ...previous, [name]: value }))
  const path = patientMode ? '/appointments/me' : '/appointments'
  const selectedDentistId = Number(form.dentist_id)
  const selectedDentist = dentists.find((doctor) => doctor.id === selectedDentistId)
  const doctorHours = availability.filter((slot) => slot.dentist_id === selectedDentistId)

  async function loadAppointments() {
    const response = await api.get<Appointment[]>(path)
    setAppointments(response.data)
  }

  useEffect(() => {
    const queries: Promise<unknown>[] = [
      api.get<Dentist[]>('/catalog/dentists').then((response) => setDentists(response.data)),
      api.get<Service[]>('/catalog/services').then((response) => setServices(response.data)),
      api.get<Availability[]>('/catalog/availability').then((response) => setAvailability(response.data)),
      loadAppointments(),
    ]
    if (!patientMode) queries.push(api.get<Patient[]>('/patients').then((response) => setPatients(response.data)))
    Promise.all(queries).catch((err) => setError(messageFromError(err)))
    // The user role is fixed for a mounted route.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [patientMode])

  const selectedService = services.find((service) => service.id === Number(form.service_id))
  const selectedDate = form.start_time.split('T')[0]
  const selectedDay = selectedDate && !Number.isNaN(new Date(`${selectedDate}T12:00:00`).getTime())
    ? mondayFirstWeekday(selectedDate) : null
  const slotsOnSelectedDay = selectedDay === null ? [] : doctorHours.filter((slot) => slot.day_of_week === selectedDay)

  async function book(e: FormEvent<HTMLFormElement>) {
    e.preventDefault()
    setError('')
    setSuccess('')
    if (!selectedDentist) {
      setError('Select a dentist before booking.')
      return
    }
    if (!form.start_time || selectedDay === null) {
      setError('Choose a valid appointment date and time.')
      return
    }
    if (slotsOnSelectedDay.length === 0) {
      setError(`${selectedDentist.name} does not work on ${WEEK_DAYS[selectedDay]}. Choose a listed working day.`)
      return
    }
    const startMinutes = minutesOfDay(form.start_time.split('T')[1])
    const endMinutes = startMinutes + (selectedService?.duration_minutes ?? 0)
    if (!selectedService || !slotsOnSelectedDay.some((slot) =>
      startMinutes >= minutesOfDay(slot.start_time) && endMinutes <= minutesOfDay(slot.end_time)
    )) {
      setError('The selected appointment (including service duration) must fit within the dentist working hours.')
      return
    }
    setBusy(true)
    try {
      const appointmentUtc = cairoTimeToUtcIso(form.start_time)
      const body = {
        dentist_id: selectedDentistId,
        service_id: Number(form.service_id),
        // Always interpret the chosen time in the clinic's Cairo timezone.
        start_time: appointmentUtc,
        reason: form.reason.trim() || null,
        ...(!patientMode ? { patient_id: Number(form.patient_id) } : {}),
      }
      await api.post(path, body)
      await loadAppointments()
      setSuccess('Appointment booked successfully.')
      update('start_time', '')
    } catch (err) {
      setError(messageFromError(err))
    } finally {
      setBusy(false)
    }
  }

  async function cancel(id: number) {
    setError('')
    setSuccess('')
    try {
      await api.post(`/appointments/${id}/cancel`)
      await loadAppointments()
      setSuccess('Appointment cancelled.')
    } catch (err) { setError(messageFromError(err)) }
  }

  async function complete(id: number, status: string) {
    setError('')
    setSuccess('')
    try {
      await api.patch(`/appointments/${id}/status`, { status })
      await loadAppointments()
      setSuccess('Appointment updated.')
    } catch (err) { setError(messageFromError(err)) }
  }

  return (
    <div className="panel">
      <div className="page-heading">
        <h1>{patientMode ? 'My Appointments' : 'Clinic Appointments'}</h1>
        <p>Check dentists' weekly working hours before booking a visit.</p>
      </div>

      {/* Patients, receptionists, dentists and admins can view the timetable. */}
      <DoctorSchedule dentists={dentists} availability={availability} />

      <h2 className="section-heading">Book an appointment</h2>
      <form className="form-grid" onSubmit={book}>
        {!patientMode && <label>Patient
          <select required value={form.patient_id} onChange={(e) => update('patient_id', e.target.value)}>
            <option value="">Select patient</option>
            {patients.map((patient) => <option key={patient.id} value={patient.id}>
              {patient.first_name} {patient.last_name} (#{patient.id})
            </option>)}
          </select>
        </label>}
        <label>Dentist
          <select required value={form.dentist_id} onChange={(e) => { update('dentist_id', e.target.value); setError('') }}>
            <option value="">Select dentist</option>
            {dentists.map((doctor) => <option key={doctor.id} value={doctor.id}>{doctor.name}</option>)}
          </select>
        </label>
        <label>Service
          <select required value={form.service_id} onChange={(e) => update('service_id', e.target.value)}>
            <option value="">Select service</option>
            {services.map((service) => <option key={service.id} value={service.id}>
              {service.name} ({service.duration_minutes} min)
            </option>)}
          </select>
        </label>
        <label>Appointment start (Cairo local time)
          <input required type="datetime-local" value={form.start_time} onChange={(e) => update('start_time', e.target.value)} />
        </label>
        <label>Reason (optional)
          <input maxLength={500} value={form.reason} onChange={(e) => update('reason', e.target.value)} />
        </label>
        {selectedDentist && <div className="schedule-selection-note span-all">
          <strong>{selectedDentist.name}</strong>
          {doctorHours.length === 0
            ? <p className="error">This dentist has no configured working hours yet.</p>
            : <p className="hint">Working days: {[...new Set(doctorHours.map((slot) => WEEK_DAYS[slot.day_of_week]))].join(', ')}.</p>}
          {selectedDay !== null && <p className="hint">
            Chosen date: {WEEK_DAYS[selectedDay]} — {slotsOnSelectedDay.length > 0
              ? slotsOnSelectedDay.map((slot) => `${slot.start_time.slice(0,5)}–${slot.end_time.slice(0,5)}`).join(', ')
              : 'Doctor is not working on this day'}
          </p>}
        </div>}
        <p className="hint span-all">
          Working hours repeat weekly in Africa/Cairo. Appointment duration must fit inside the selected shift.
          The server also checks existing bookings and free chairs.
        </p>
        {error && <p role="alert" className="error span-all">{error}</p>}
        {success && <p role="status" className="success span-all">{success}</p>}
        <button className="primary span-all" disabled={busy || dentists.length === 0 || services.length === 0 || (selectedDentistId > 0 && doctorHours.length === 0)}>
          {busy ? 'Booking...' : 'Book appointment'}
        </button>
      </form>

      <h2 className="section-heading">{patientMode ? 'Your visits' : 'All scheduled visits'}</h2>
      <div className="table-wrap"><table>
        <thead><tr><th>ID</th>{!patientMode && <th>Patient ID</th>}<th>Dentist</th><th>Service</th><th>Time</th><th>Status</th><th>Actions</th></tr></thead>
        <tbody>{appointments.map((appointment) => <tr key={appointment.id}>
          <td>#{appointment.id}</td>
          {!patientMode && <td>{appointment.patient_id}</td>}
          <td>{appointment.dentist_name}</td>
          <td>{appointment.service_name}</td>
          <td>{new Date(appointment.start_time).toLocaleString()}</td>
          <td>{appointment.status}</td>
          <td>{appointment.status === 'scheduled' && <>
            <button className="small secondary" onClick={() => cancel(appointment.id)}>Cancel</button>
            {!patientMode && <button className="small secondary" onClick={() => complete(appointment.id, 'completed')}>Complete</button>}
          </>}</td>
        </tr>)}</tbody>
      </table></div>
    </div>
  )
}
