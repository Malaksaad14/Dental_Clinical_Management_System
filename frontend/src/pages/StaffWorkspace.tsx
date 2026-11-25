import VoiceTextarea from '../components/VoiceTextarea'
import { useEffect, useState, type FormEvent } from 'react'
import { api, messageFromError } from '../api/client'
import { useAuth } from '../auth/AuthContext'
type QueueRow = {id:number; patient:string; dentist:string; service:string; start_time:string; status:string}
type ImagingRow = {id:number; patient:string; exam:string; indication:string; status:string; result:string|null}
export function DailyQueue(){
 const [rows,setRows]=useState<QueueRow[]>([]), [error,setError]=useState('')
 const load=()=>api.get<QueueRow[]>('/workspace/queue').then(r=>setRows(r.data)).catch(e=>setError(messageFromError(e)))
 useEffect(()=>{void load()},[])
 return <section className="panel"><div className="page-heading"><h1>Daily appointments</h1><p>{new Date().toLocaleDateString('en-GB',{timeZone:'Africa/Cairo',dateStyle:'full'})}</p></div><button className="secondary" onClick={()=>void load()}>Refresh</button>{error&&<p className="error">{error}</p>}<div className="table-wrap"><table><thead><tr><th>Time</th><th>Patient</th><th>Dentist</th><th>Service</th><th>Status</th></tr></thead><tbody>{rows.map(r=><tr key={r.id}><td>{new Date(r.start_time).toLocaleTimeString('en-GB',{timeZone:'Africa/Cairo',hour:'2-digit',minute:'2-digit'})}</td><td>{r.patient}</td><td>{r.dentist}</td><td>{r.service}</td><td>{r.status}</td></tr>)}</tbody></table></div>{!rows.length&&!error&&<p>No appointments to display.</p>}</section>
}
export function ImagingQueue(){
 const {user}=useAuth(); const [rows,setRows]=useState<ImagingRow[]>([]),[error,setError]=useState(''),[draft,setDraft]=useState<Record<number,string>>({}),[busy,setBusy]=useState(false)
 const load=()=>api.get<ImagingRow[]>('/workspace/imaging').then(r=>setRows(r.data)).catch(e=>setError(messageFromError(e)))
 useEffect(()=>{void load()},[])
 async function complete(id:number){setBusy(true);setError('');try{await api.patch(`/workspace/imaging/${id}`,{result:draft[id]});await load()}catch(e){setError(messageFromError(e))}finally{setBusy(false)}}
 return <section className="panel"><h1>Imaging requests</h1><button className="secondary" onClick={()=>void load()}>Refresh</button>{error&&<p className="error">{error}</p>}{rows.map(r=><article className="workflow-card" key={r.id}><h3>{r.patient} · {r.exam}</h3><p>{r.indication}</p><strong>{r.status}</strong>{r.result&&<p>{r.result}</p>}{r.status==='pending'&&(user?.role==='admin'||user?.staff_type==='radiologist')&&<form onSubmit={e=>{e.preventDefault();void complete(r.id)}}><label>Imaging report<textarea required value={draft[r.id]||''} onChange={e=>setDraft({...draft,[r.id]:e.target.value})}/></label><button className="primary" disabled={busy}>Complete request</button></form>}</article>)}{!rows.length&&!error&&<p>No imaging requests to display.</p>}</section>
}
export function ClinicalActions({ patientId, author }: { patientId: number; author: string }) {
  const { user } = useAuth()
  const [note, setNote] = useState('')
  const [exam, setExam] = useState('Panoramic X-ray')
  const [indication, setIndication] = useState('')
  const [noteRecording, setNoteRecording] = useState(false)
  const [indicationRecording, setIndicationRecording] = useState(false)
  const [message, setMessage] = useState('')
  const [notes, setNotes] = useState<{ id: number; note: string; created_at: string }[]>([])
  const [busy, setBusy] = useState(false)

  const load = () => api.get(`/api/v1/dental/patients/${patientId}/clinical-notes`)
    .then(r => setNotes(r.data))
    .catch(e => setMessage(messageFromError(e)))
  useEffect(() => {
    // Avoid showing an earlier patient's unsaved note after switching patients.
    setNote('')
    setIndication('')
    setNoteRecording(false)
    setIndicationRecording(false)
    setMessage('')
    setNotes([])
    let current = true
    api.get(`/api/v1/dental/patients/${patientId}/clinical-notes`)
      .then(r => { if (current) setNotes(r.data) })
      .catch(e => { if (current) setMessage(messageFromError(e)) })
    return () => { current = false }
  }, [patientId])

  async function submit(event: FormEvent, imaging: boolean) {
    event.preventDefault()
    if ((imaging && indicationRecording) || (!imaging && noteRecording)) {
      setMessage('Stop dictation and review the transcript before saving.')
      return
    }
    setBusy(true)
    setMessage('')
    try {
      if (imaging) {
        await api.post('/workspace/imaging', { patient_id: patientId, exam, indication: indication.trim() })
        setIndication('')
        setMessage('Imaging request sent to the radiology worklist.')
      } else {
        await api.post('/api/v1/dental/clinical-notes', {
          patient_id: patientId,
          staff_id: user?.role === 'admin' ? Number(author) : user?.id,
          note: note.trim(),
        })
        setNote('')
        await load()
        setMessage('Clinical note saved successfully.')
      }
    } catch (e) {
      setMessage(messageFromError(e))
    } finally {
      setBusy(false)
    }
  }

  return <div className="workflow-card">
    <h2>Clinical encounter</h2>
    <div className="workflow-grid">
      <form onSubmit={e => void submit(e, false)}>
        <VoiceTextarea
          key={`diagnosis-${patientId}`}
          id={`diagnosis-${patientId}`}
          label="Diagnosis / clinical note"
          value={note}
          onChange={setNote}
          onRecordingChange={setNoteRecording}
          placeholder="Describe findings, diagnosis and clinical assessment…"
          required
          maxLength={10000}
          disabled={busy}
        />
        <button className="primary" disabled={busy || noteRecording} type="submit">Save diagnosis</button>
      </form>
      <form onSubmit={e => void submit(e, true)}>
        <label htmlFor={`imaging-exam-${patientId}`}>Imaging exam</label>
        <select id={`imaging-exam-${patientId}`} value={exam} onChange={e => setExam(e.target.value)} disabled={busy}>
          {['Panoramic X-ray', 'Periapical X-ray', 'Bitewing X-ray', 'CBCT', 'Other'].map(x => <option key={x}>{x}</option>)}
        </select>
        <VoiceTextarea
          key={`imaging-indication-${patientId}`}
          id={`imaging-indication-${patientId}`}
          label="Clinical indication (reason for imaging)"
          value={indication}
          onChange={setIndication}
          onRecordingChange={setIndicationRecording}
          placeholder="Example: Evaluate suspected impacted wisdom tooth and surrounding bone."
          required
          maxLength={4000}
          disabled={busy}
        />
        <button className="primary" disabled={busy || indicationRecording} type="submit">Request imaging</button>
      </form>
    </div>
    {message && <p role="status">{message}</p>}
    <details>
      <summary>Previous clinical notes ({notes.length})</summary>
      {notes.map(n => <p key={n.id}>{n.created_at?.slice(0, 10)} — {n.note}</p>)}
    </details>
  </div>
}
