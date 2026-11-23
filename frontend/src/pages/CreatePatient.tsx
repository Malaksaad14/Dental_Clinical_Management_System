import { useState, type FormEvent } from 'react'
import { useNavigate } from 'react-router'
import { api, messageFromError } from '../api/client'

export default function CreatePatient() {
  const navigate = useNavigate()
  const [data, setData] = useState({ email:'', password:'', first_name:'', last_name:'', phone:'', date_of_birth:'', gender:'', address:'', national_id:'', emergency_contact:'' })
  const [error, setError] = useState('')
  const [success, setSuccess] = useState('')
  const [busy, setBusy] = useState(false)
  const update = (field: keyof typeof data, value: string) => setData(prev => ({ ...prev, [field]: value }))

  async function submit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault()
    setError(''); setSuccess(''); setBusy(true)
    try {
      const payload = Object.fromEntries(Object.entries(data).map(([key, value]) => [key, value.trim() || null]))
      const response = await api.post<{ id: number }>('/patients', payload)
      setSuccess(`Patient account created. Patient ID: ${response.data.id}. Share the initial login securely.`)
      setData({ email:'', password:'', first_name:'', last_name:'', phone:'', date_of_birth:'', gender:'', address:'', national_id:'', emergency_contact:'' })
    } catch (err) { setError(messageFromError(err)) }
    finally { setBusy(false) }
  }

  return <div className="panel"><div className="page-heading"><h1>Create Patient Account</h1><p>Reception and authorized staff create patient accounts. Patients cannot self-register.</p></div>
    <form className="form-grid" onSubmit={submit}>
      {([
        ['first_name','First name','text'], ['last_name','Last name','text'], ['email','Email','email'],
        ['password','Initial password','password'], ['phone','Phone','tel'], ['date_of_birth','Date of birth','date'],
        ['gender','Gender','text'], ['national_id','National ID (optional)','text'],
        ['address','Address','text'], ['emergency_contact','Emergency contact','text'],
      ] as [keyof typeof data,string,string][]).map(([field,label,type]) =>
        <label key={field}>{label}<input type={type} value={data[field]} onChange={e=>update(field,e.target.value)} required={['email','password','first_name','last_name'].includes(field)} minLength={field==='password'?8:undefined} autoComplete="off" /></label>
      )}
      {error && <p role="alert" className="error span-all">{error}</p>}
      {success && <p role="status" className="success span-all">{success}</p>}
      <div className="span-all action-row"><button type="submit" disabled={busy} className="primary">{busy?'Creating...':'Create patient account'}</button><button type="button" className="secondary" onClick={()=>navigate(-1)}>Back</button></div>
    </form>
  </div>
}
