import { useEffect, useState, type FormEvent } from 'react'
import { useSearchParams } from 'react-router'
import { api, messageFromError } from '../api/client'
import { useAuth } from '../auth/AuthContext'
import type { Appointment, Dentist, Patient, Service } from '../types'

export default function Appointments() {
  const { user } = useAuth()
  const patientMode = user?.role==='patient'
  const [searchParams] = useSearchParams()
  const [patients,setPatients]=useState<Patient[]>([])
  const [dentists,setDentists]=useState<Dentist[]>([])
  const [services,setServices]=useState<Service[]>([])
  const [appointments,setAppointments]=useState<Appointment[]>([])
  const [form,setForm] = useState({patient_id:searchParams.get('patient_id')??'',dentist_id:'',service_id:'',start_time:'',reason:''})
  const [error,setError]=useState('')
  const [success,setSuccess]=useState('')
  const [busy,setBusy]=useState(false)
  const update=(name:keyof typeof form,value:string)=>setForm(prev=>({...prev,[name]:value}))
  const path=patientMode?'/appointments/me':'/appointments'

  const loadAppointments = async()=>{const r=await api.get<Appointment[]>(path);setAppointments(r.data)}
  useEffect(()=>{
    const queries: Promise<unknown>[]=[
      api.get<Dentist[]>('/catalog/dentists').then(r=>setDentists(r.data)),
      api.get<Service[]>('/catalog/services').then(r=>setServices(r.data)),
      loadAppointments(),
    ]
    if(!patientMode) queries.push(api.get<Patient[]>('/patients').then(r=>setPatients(r.data)))
    Promise.all(queries).catch(err=>setError(messageFromError(err)))
  // The mode is fixed for a mounted route.
  // eslint-disable-next-line react-hooks/exhaustive-deps
  },[patientMode])

  async function book(e:FormEvent<HTMLFormElement>) {
    e.preventDefault();setError('');setSuccess('');setBusy(true)
    try {
      const body={
        dentist_id:Number(form.dentist_id),service_id:Number(form.service_id),
        start_time:new Date(form.start_time).toISOString(),reason:form.reason.trim()||null,
        ...(!patientMode?{patient_id:Number(form.patient_id)}:{}),
      }
      await api.post(path,body)
      await loadAppointments()
      setSuccess('Appointment booked successfully.')
      update('start_time','')
    } catch (err){setError(messageFromError(err))}
    finally{setBusy(false)}
  }

  async function cancel(id:number) {
    setError('');setSuccess('')
    try {await api.post(`/appointments/${id}/cancel`);await loadAppointments();setSuccess('Appointment cancelled.')}
    catch(err){setError(messageFromError(err))}
  }

  async function complete(id:number,status:string) {
    setError('');setSuccess('')
    try {await api.patch(`/appointments/${id}/status`,{status});await loadAppointments();setSuccess('Appointment updated.')}
    catch(err){setError(messageFromError(err))}
  }

  return <div className="panel"><div className="page-heading"><h1>{patientMode?'My Appointments':'Clinic Appointments'}</h1><p>Book a new visit using a dentist's availability and a clinic service.</p></div>
    <form className="form-grid" onSubmit={book}>
      {!patientMode&&<label>Patient<select required value={form.patient_id} onChange={e=>update('patient_id',e.target.value)}><option value="">Select patient</option>{patients.map(p=><option key={p.id} value={p.id}>{p.first_name} {p.last_name} (#{p.id})</option>)}</select></label>}
      <label>Dentist<select required value={form.dentist_id} onChange={e=>update('dentist_id',e.target.value)}><option value="">Select dentist</option>{dentists.map(d=><option key={d.id} value={d.id}>{d.name}</option>)}</select></label>
      <label>Service<select required value={form.service_id} onChange={e=>update('service_id',e.target.value)}><option value="">Select service</option>{services.map(s=><option key={s.id} value={s.id}>{s.name} ({s.duration_minutes} min)</option>)}</select></label>
      <label>Start time (clinic local)<input required type="datetime-local" value={form.start_time} onChange={e=>update('start_time',e.target.value)}/></label>
      <label>Reason (optional)<input value={form.reason} maxLength={500} onChange={e=>update('reason',e.target.value)}/></label>
      <p className="hint span-all">Time slots must be inside the dentist's availability and have an unoccupied chair. The backend validates overlaps.</p>
      {error&&<p role="alert" className="error span-all">{error}</p>}{success&&<p role="status" className="success span-all">{success}</p>}
      <button className="primary span-all" disabled={busy||dentists.length===0||services.length===0}>{busy?'Booking...':'Book appointment'}</button>
    </form>
    <h2 className="section-heading">{patientMode?'Your visits':'All scheduled visits'}</h2>
    <div className="table-wrap"><table><thead><tr><th>ID</th>{!patientMode&&<th>Patient ID</th>}<th>Dentist</th><th>Service</th><th>Time</th><th>Status</th><th>Actions</th></tr></thead><tbody>{appointments.map(a=><tr key={a.id}><td>#{a.id}</td>{!patientMode&&<td>{a.patient_id}</td>}<td>{a.dentist_name}</td><td>{a.service_name}</td><td>{new Date(a.start_time).toLocaleString()}</td><td>{a.status}</td><td>{a.status==='scheduled'&&<><button className="small secondary" onClick={()=>cancel(a.id)}>Cancel</button>{!patientMode&&<button className="small secondary" onClick={()=>complete(a.id,'completed')}>Complete</button>}</>}</td></tr>)}</tbody></table></div>
  </div>
}
