import { useEffect, useState, type FormEvent } from 'react'
import { useSearchParams } from 'react-router'
import { api, messageFromError } from '../api/client'
import { useAuth } from '../auth/AuthContext'
import DoctorSchedule, { WEEK_DAYS } from '../components/DoctorSchedule'
import type { Appointment, Availability, Dentist, Patient, Service, Slot, SlotsResponse } from '../types'



// Convert a selected Cairo wall-clock time into an actual UTC instant.
// This uses the browser's timezone database, including Egypt daylight-saving rules.

const fmtTime = (iso: string) =>
  new Date(iso).toLocaleTimeString('en-GB', { timeZone: 'Africa/Cairo', hour: '2-digit', minute: '2-digit' })
const fmtDateTime = (iso: string) =>
  new Date(iso).toLocaleString('en-GB', { timeZone: 'Africa/Cairo', dateStyle: 'medium', timeStyle: 'short' })

const STATUS_STYLE: Record<string, { bg: string; fg: string }> = {
  scheduled: { bg: '#dbeafe', fg: '#1e40af' },
  completed: { bg: '#dcfce7', fg: '#166534' },
  cancelled: { bg: '#fee2e2', fg: '#991b1b' },
  no_show: { bg: '#fef3c7', fg: '#92400e' },
}

function StatusBadge({ status }: { status: string }) {
  const s = STATUS_STYLE[status] ?? { bg: '#e5e7eb', fg: '#374151' }
  return <span style={{ background: s.bg, color: s.fg, padding: '2px 10px', borderRadius: 999, fontSize: 12, fontWeight: 600 }}>
    {status.replace('_', ' ')}
  </span>
}

function SlotPicker({ dentistId, serviceId, onPick, selected }: {
  dentistId: number; serviceId: number; selected: string; onPick: (iso: string) => void
}) {
  const [day, setDay] = useState('')
  const [slots, setSlots] = useState<Slot[]>([])
  const [loading, setLoading] = useState(false)
  const [err, setErr] = useState('')
  

  useEffect(() => {
    setSlots([]); setErr('')
    if (!dentistId || !serviceId || !day) return
    setLoading(true)
    api.get<SlotsResponse>('/appointments/availability', { params: { dentist_id: dentistId, service_id: serviceId, day } })
      .then((r) => setSlots(r.data.slots))
      .catch((e) => setErr(messageFromError(e)))
      .finally(() => setLoading(false))
  }, [dentistId, serviceId, day])

  return (
    <div className="span-all">
      <label>Date
        <input type="date" value={day} onChange={(e) => setDay(e.target.value)} />
      </label>
      {loading && <p className="hint">Loading available times...</p>}
      {err && <p className="error">{err}</p>}
      {day && !loading && !err && slots.length === 0 && dentistId > 0 && serviceId > 0 &&
        <p className="hint">No available times on this day.</p>}
      <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8, marginTop: 8 }}>
        {slots.map((s) => (
          <button type="button" key={s.start_time}
            className={selected === s.start_time ? 'small primary' : 'small secondary'}
            onClick={() => onPick(s.start_time)}>
            {fmtTime(s.start_time)}
          </button>
        ))}
      </div>
    </div>
  )
}

export default function Appointments() {
  const { user } = useAuth()
  const patientMode = user?.role === 'patient'
  const isDoctor = user?.role === 'clinical_staff' && user?.staff_type === 'dentist'
  const canBook = user?.role === 'admin' || user?.staff_type === 'receptionist' || patientMode
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
  const [pickerKey, setPickerKey] = useState(0)
  const [statusFilter, setStatusFilter] = useState('')
  const [reschedId, setReschedId] = useState<number | null>(null)
  const [reschedSlot, setReschedSlot] = useState('')
  const reschedAp = appointments.find((a) => a.id === reschedId)
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

  async function book(e: FormEvent<HTMLFormElement>) {
    e.preventDefault()
    setError('')
    setSuccess('')
    if (!selectedDentist) { setError('Select a dentist before booking.'); return }
    if (!form.service_id) { setError('Select a service before booking.'); return }
    if (!form.start_time) { setError('Pick an available time slot.'); return }
    setBusy(true)
    try {
      const body = {
        dentist_id: selectedDentistId,
        service_id: Number(form.service_id),
        start_time: form.start_time,
        reason: form.reason.trim() || null,
        ...(!patientMode ? { patient_id: Number(form.patient_id) } : {}),
      }
      await api.post(path, body)
      await loadAppointments()
      setSuccess('Appointment booked successfully.')
      update('start_time', '')
      setPickerKey((k) => k + 1)
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
    async function confirmReschedule() {
    if (!reschedId || !reschedSlot) return
    setError(''); setSuccess('')
    try {
      await api.patch(`/appointments/${reschedId}/reschedule`, { start_time: reschedSlot })
      await loadAppointments()
      setSuccess('Appointment rescheduled.')
      setReschedId(null); setReschedSlot('')
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
        <p>{isDoctor ? 'Review scheduled patient visits, update consultation statuses, and manage consultations.' : 'Check dentists\' weekly working hours before booking a visit.'}</p>
      </div>

      {/* Only show doctor directory / timetable to patients, receptionists and admins */}
      {!isDoctor && <DoctorSchedule dentists={dentists} availability={availability} />}

      {canBook && (
        <>
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
              <select required value={form.dentist_id} onChange={(e) => { update('dentist_id', e.target.value); update('start_time', ''); setError('') }}>
                <option value="">Select dentist</option>
                {dentists.map((doctor) => <option key={doctor.id} value={doctor.id}>{doctor.name}</option>)}
              </select>
            </label>
            <label>Service
              <select required value={form.service_id} onChange={(e) => { update('service_id', e.target.value); update('start_time', '') }}>
                <option value="">Select service</option>
                {services.map((service) => <option key={service.id} value={service.id}>
                  {service.name} ({service.duration_minutes} min)
                </option>)}
              </select>
            </label>
            <SlotPicker key={pickerKey} dentistId={selectedDentistId} serviceId={Number(form.service_id)}
              selected={form.start_time} onPick={(iso) => update('start_time', iso)} />
            {form.start_time && <p className="hint span-all">Selected: {fmtDateTime(form.start_time)}</p>}
            <label>Reason (optional)
              <input maxLength={500} value={form.reason} onChange={(e) => update('reason', e.target.value)} />
            </label>
            {selectedDentist && <div className="schedule-selection-note span-all">
              <strong>{selectedDentist.name}</strong>
              {doctorHours.length === 0
                ? <p className="error">This dentist has no configured working hours yet.</p>
                : <p className="hint">Working days: {[...new Set(doctorHours.map((slot) => WEEK_DAYS[slot.day_of_week]))].join(', ')}.</p>}
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
        </>
      )}

      <h2 className="section-heading">{patientMode ? 'Your visits' : 'All scheduled visits'}</h2>

      <label style={{ maxWidth: 220 }}>Filter by status
        <select value={statusFilter} onChange={(e) => setStatusFilter(e.target.value)}>
          <option value="">All</option>
          <option value="scheduled">Scheduled</option>
          <option value="completed">Completed</option>
          <option value="cancelled">Cancelled</option>
          <option value="no_show">No show</option>
        </select>
      </label>

      {reschedAp && <div className="panel" style={{ margin: '12px 0' }}>
        <h3>Reschedule appointment #{reschedAp.id}</h3>
        <SlotPicker dentistId={reschedAp.dentist_id} serviceId={reschedAp.service_id}
          selected={reschedSlot} onPick={setReschedSlot} />
        <button className="small primary" disabled={!reschedSlot} onClick={confirmReschedule}>Confirm new time</button>
        <button className="small secondary" onClick={() => { setReschedId(null); setReschedSlot('') }}>Close</button>
      </div>}

      <div className="table-wrap"><table>
        <thead><tr><th>ID</th>{!patientMode && <th>Patient ID</th>}<th>Dentist</th><th>Service</th><th>Time</th><th>Status</th><th>Actions</th></tr></thead>
        <tbody>{appointments.filter((a) => !statusFilter || a.status === statusFilter).map((appointment) => <tr key={appointment.id}>
          <td>#{appointment.id}</td>
          {!patientMode && <td>{appointment.patient_id}</td>}
          <td>{appointment.dentist_name}</td>
          <td>{appointment.service_name}</td>
          <td>{fmtDateTime(appointment.start_time)}</td>
          <td><StatusBadge status={appointment.status} /></td>
          <td>{appointment.status === 'scheduled' && <>
            <button className="small secondary" onClick={() => { setReschedId(appointment.id); setReschedSlot('') }}>Reschedule</button>
            <button className="small secondary" onClick={() => cancel(appointment.id)}>Cancel</button>
            {!patientMode && <button className="small secondary" onClick={() => complete(appointment.id, 'completed')}>Complete</button>}
          </>}</td>
        </tr>)}</tbody>
      </table></div>
    </div>
  )
}