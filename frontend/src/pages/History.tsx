import { useEffect, useState, type FormEvent } from 'react'
import { api, messageFromError } from '../api/client'
import { useAuth } from '../auth/AuthContext'
import type { HistoryData, Patient } from '../types'

const emptyHistory = { conditions:'', allergies:'', current_medications:'', dental_history:'' }

export default function History() {
  const {user}=useAuth()
  const patientMode=user?.role==='patient'
  const clinical=user?.role==='admin'||(user?.role==='clinical_staff'&&user.staff_type!=='receptionist')
  const [patients,setPatients]=useState<Patient[]>([])
  const [patientId,setPatientId]=useState('')
  const [data,setData]=useState<HistoryData|null>(null)
  const [fields,setFields]=useState(emptyHistory)
  const [error,setError]=useState('')
  const [success,setSuccess]=useState('')
  const [loading,setLoading]=useState(false)

  useEffect(()=>{
    if(!patientMode) api.get<Patient[]>('/patients').then(r=>setPatients(r.data)).catch(err=>setError(messageFromError(err)))
  },[patientMode])

  useEffect(()=>{
    if(!patientMode&&!patientId){setData(null);return}
    let active=true
    setLoading(true);setError('')
    api.get<HistoryData>(patientMode?'/history/me':`/history/patients/${patientId}`)
      .then(r=>{if(active){setData(r.data);setFields({conditions:r.data.medical?.conditions??'',allergies:r.data.medical?.allergies??'',current_medications:r.data.medical?.current_medications??'',dental_history:r.data.medical?.dental_history??''})}})
      .catch(err=>{if(active)setError(messageFromError(err))})
      .finally(()=>{if(active)setLoading(false)})
    return ()=>{active=false}
  },[patientMode,patientId])

  async function save(e:FormEvent<HTMLFormElement>) {
    e.preventDefault();setError('');setSuccess('')
    try {await api.put(`/history/patients/${patientId}/medical`,fields);setSuccess('Medical history saved.');const r=await api.get<HistoryData>(`/history/patients/${patientId}`);setData(r.data)}
    catch(err){setError(messageFromError(err))}
  }
  return <div className="panel"><div className="page-heading"><h1>Medical & Dental History</h1><p>{patientMode?'Read-only access to your own clinical history.':'Authorized clinical team members can view patient history.'}</p></div>
    {!patientMode&&<label>Select patient<select value={patientId} onChange={e=>setPatientId(e.target.value)}><option value="">Select patient</option>{patients.map(p=><option key={p.id} value={p.id}>{p.first_name} {p.last_name} (#{p.id})</option>)}</select></label>}
    {loading&&<p>Loading...</p>}{error&&<p className="error" role="alert">{error}</p>}{success&&<p className="success" role="status">{success}</p>}
    {data&&<><div className="info-grid">{(Object.keys(emptyHistory) as (keyof typeof emptyHistory)[]).map(key=><div className="info-field" key={key}><small>{key.replaceAll('_',' ')}</small><p>{data.medical?.[key]??'Not recorded'}</p></div>)}</div>
      <h2 className="section-heading">Dental chart entries</h2>{data.tooth_records.length===0?<p className="muted">No dental chart entries yet.</p>:<div className="table-wrap"><table><thead><tr><th>Tooth</th><th>Surface</th><th>Condition</th><th>Notes</th><th>Date</th></tr></thead><tbody>{data.tooth_records.map(t=><tr key={t.id}><td>{t.tooth_number}</td><td>{t.surface??'—'}</td><td>{t.condition}</td><td>{t.notes??'—'}</td><td>{new Date(t.recorded_at).toLocaleDateString()}</td></tr>)}</tbody></table></div>}
      {clinical&&!patientMode&&<><h2 className="section-heading">Update medical background</h2><form onSubmit={save} className="form-grid">{(Object.keys(emptyHistory) as (keyof typeof emptyHistory)[]).map(key=><label key={key}>{key.replaceAll('_',' ')}<textarea rows={3} value={fields[key]} onChange={e=>setFields(prev=>({...prev,[key]:e.target.value}))}/></label>)}<button className="primary span-all">Save medical history</button></form></>}
    </>}
  </div>
}
