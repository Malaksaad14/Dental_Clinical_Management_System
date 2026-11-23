import { useEffect, useState, type FormEvent } from 'react'
import { api, messageFromError } from '../api/client'
import DoctorSchedule, { WEEK_DAYS } from '../components/DoctorSchedule'
import type { Availability, Chair, Dentist, Service } from '../types'

type DayEditor = {
  day_of_week: number
  enabled: boolean
  start_time: string
  end_time: string
}

function emptyWeek(): DayEditor[] {
  return WEEK_DAYS.map((_, day_of_week) => ({
    day_of_week,
    enabled: false,
    start_time: '09:00',
    end_time: '17:00',
  }))
}

export default function Catalog() {
  const [services, setServices] = useState<Service[]>([])
  const [dentists, setDentists] = useState<Dentist[]>([])
  const [chairs, setChairs] = useState<Chair[]>([])
  const [availability, setAvailability] = useState<Availability[]>([])

  const [newService, setNewService] = useState({ code: '', name: '', category: '', price: '0', duration_minutes: '30' })
  const [newChair, setNewChair] = useState({ name: '', room: '' })

  const [dentistId, setDentistId] = useState('')
  const [week, setWeek] = useState<DayEditor[]>(emptyWeek)
  const [savingWeek, setSavingWeek] = useState(false)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState('')

  async function refresh() {
    const [servicesRes, chairsRes, dentistsRes, hoursRes] = await Promise.all([
      api.get<Service[]>('/catalog/services'),
      api.get<Chair[]>('/catalog/chairs'),
      api.get<Dentist[]>('/catalog/dentists'),
      api.get<Availability[]>('/catalog/availability'),
    ])
    setServices(servicesRes.data)
    setChairs(chairsRes.data)
    setDentists(dentistsRes.data)
    setAvailability(hoursRes.data)
  }

  useEffect(() => {
    void refresh().catch((err) => setError(messageFromError(err)))
  }, [])

  // Editing a doctor loads their existing schedule (one time range per weekday).
  useEffect(() => {
    if (!dentistId) {
      setWeek(emptyWeek())
      return
    }
    const current = availability.filter((row) => row.dentist_id === Number(dentistId))
    setWeek(WEEK_DAYS.map((_, day_of_week) => {
      const saved = current.find((row) => row.day_of_week === day_of_week)
      return {
        day_of_week,
        enabled: Boolean(saved),
        start_time: saved?.start_time.slice(0, 5) ?? '09:00',
        end_time: saved?.end_time.slice(0, 5) ?? '17:00',
      }
    }))
  }, [dentistId, availability])

  async function submit(e: FormEvent<HTMLFormElement>, route: string, data: object) {
    e.preventDefault()
    setError('')
    setSuccess('')
    try {
      await api.post(`/catalog/${route}`, data)
      await refresh()
      setSuccess('Saved successfully.')
    } catch (err) {
      setError(messageFromError(err))
    }
  }

  function changeDay(day: number, changes: Partial<DayEditor>) {
    setWeek((old) => old.map((row) => row.day_of_week === day ? { ...row, ...changes } : row))
  }

  async function saveWeeklySchedule(e: FormEvent<HTMLFormElement>) {
    e.preventDefault()
    setError('')
    setSuccess('')
    if (!dentistId) {
      setError('Select a dentist first.')
      return
    }
    const days = week.filter((day) => day.enabled).map(({ day_of_week, start_time, end_time }) => ({
      day_of_week,
      start_time,
      end_time,
    }))
    if (days.length === 0) {
      setError('Choose at least one working day.')
      return
    }
    if (days.some((day) => day.end_time <= day.start_time)) {
      setError('End time must be after start time for each selected day.')
      return
    }
    setSavingWeek(true)
    try {
      // Replaces the chosen dentist's weekly schedule in one transaction.
      await api.put('/catalog/availability/weekly', {
        dentist_id: Number(dentistId),
        days,
      })
      await refresh()
      setSuccess('Weekly working hours saved successfully.')
    } catch (err) {
      setError(messageFromError(err))
    } finally {
      setSavingWeek(false)
    }
  }

  const duplicateExistingDays = (() => {
    const seen = new Set<number>()
    return availability.some((row) => {
      if (row.dentist_id !== Number(dentistId)) return false
      if (seen.has(row.day_of_week)) return true
      seen.add(row.day_of_week)
      return false
    })
  })()

  return (
    <div className="panel">
      <div className="page-heading">
        <h1>Clinic Setup</h1>
        <p>Admin-only configuration for patient appointment booking.</p>
      </div>
      {error && <p className="error" role="alert">{error}</p>}
      {success && <p className="success" role="status">{success}</p>}

      <h2 className="section-heading">Services ({services.length})</h2>
      <form className="form-grid" onSubmit={(e) => submit(e, 'services', {
        ...newService,
        price: Number(newService.price),
        duration_minutes: Number(newService.duration_minutes),
      })}>
        {(['code', 'name', 'category', 'price', 'duration_minutes'] as const).map((key) => (
          <label key={key}>
            {key.replaceAll('_', ' ')}
            <input
              required={key !== 'category'}
              type={key === 'price' || key === 'duration_minutes' ? 'number' : 'text'}
              min={key === 'price' ? '0' : key === 'duration_minutes' ? '10' : undefined}
              value={newService[key]}
              onChange={(e) => setNewService((old) => ({ ...old, [key]: e.target.value }))}
            />
          </label>
        ))}
        <button className="primary span-all">Add service</button>
      </form>
      <p className="hint">{services.map((service) => `${service.name} (${service.duration_minutes} min)`).join(' · ') || 'No services yet'}</p>

      <h2 className="section-heading">Chairs ({chairs.length})</h2>
      <form className="form-grid" onSubmit={(e) => submit(e, 'chairs', newChair)}>
        <label>Chair name
          <input required value={newChair.name} onChange={(e) => setNewChair((old) => ({ ...old, name: e.target.value }))} />
        </label>
        <label>Room
          <input value={newChair.room} onChange={(e) => setNewChair((old) => ({ ...old, room: e.target.value }))} />
        </label>
        <button className="primary span-all">Add chair</button>
      </form>

      <h2 className="section-heading">Edit dentist weekly working hours</h2>
      <p className="hint">Select one dentist, check multiple days, and set different start/end times for each day.</p>
      <form onSubmit={saveWeeklySchedule}>
        <label className="schedule-dentist-select">
          Dentist
          <select required value={dentistId} onChange={(e) => setDentistId(e.target.value)}>
            <option value="">Select dentist</option>
            {dentists.map((doctor) => <option key={doctor.id} value={doctor.id}>{doctor.name}</option>)}
          </select>
        </label>
        {duplicateExistingDays && (
          <p className="hint">This dentist currently has multiple shifts on the same weekday. Saving will keep one working period per selected day.</p>
        )}
        <div className="weekly-editor">
          {week.map((day) => (
            <div className="weekly-day" key={day.day_of_week}>
              <label className="weekly-checkbox">
                <input
                  type="checkbox"
                  checked={day.enabled}
                  disabled={!dentistId}
                  onChange={(e) => changeDay(day.day_of_week, { enabled: e.target.checked })}
                />
                <span>{WEEK_DAYS[day.day_of_week]}</span>
              </label>
              <label>From
                <input
                  type="time"
                  disabled={!dentistId || !day.enabled}
                  required={day.enabled}
                  value={day.start_time}
                  onChange={(e) => changeDay(day.day_of_week, { start_time: e.target.value })}
                />
              </label>
              <label>To
                <input
                  type="time"
                  disabled={!dentistId || !day.enabled}
                  required={day.enabled}
                  value={day.end_time}
                  onChange={(e) => changeDay(day.day_of_week, { end_time: e.target.value })}
                />
              </label>
            </div>
          ))}
        </div>
        <p className="hint">The times are Cairo local time. Saving replaces this doctor's weekly schedule. Existing future bookings are protected.</p>
        <button className="primary" type="submit" disabled={!dentistId || savingWeek}>
          {savingWeek ? 'Saving schedule...' : 'Save weekly schedule'}
        </button>
      </form>

      <DoctorSchedule dentists={dentists} availability={availability} />
    </div>
  )
}
