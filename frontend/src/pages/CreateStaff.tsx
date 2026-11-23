import { useState, type FormEvent } from 'react'
import { api, messageFromError } from '../api/client'
import type { StaffType } from '../types'

export default function CreateStaff() {
  const [data, setData] = useState({ email:'', password:'', first_name:'', last_name:'', staff_type:'receptionist' as StaffType, specialization:'', license_number:'', phone:'' })
  const [error, setError] = useState('')
  const [success, setSuccess] = useState('')
  const [busy, setBusy] = useState(false)
  const update = (key: keyof typeof data, value: string) => setData(prev => ({...prev,[key]:value}))

  async function submit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault(); setError('');setSuccess('');setBusy(true)
    try {
      await api.post('/admin/staff', {
        ...data, email:data.email.trim().toLowerCase(),
        specialization:data.specialization.trim() || null,
        license_number:data.license_number.trim() || null,
        phone:data.phone.trim() || null,
      })
      setSuccess('Staff account created successfully. Provide credentials through a secure channel.')
      setData({ email:'', password:'', first_name:'', last_name:'', staff_type:'receptionist', specialization:'', license_number:'', phone:'' })
    } catch(err) {setError(messageFromError(err))}
    finally {setBusy(false)}
  }

  return <div className="panel"><div className="page-heading"><h1>Create Staff Account</h1><p>Administrator only. A staff account always receives the clinical_staff role and the selected staff_type.</p></div>
    <form className="form-grid" onSubmit={submit}>
      {([['first_name','First name'],['last_name','Last name'],['email','Email'],['password','Initial password'],['phone','Phone'],['specialization','Specialization'],['license_number','License number']] as [keyof typeof data,string][]).map(([field,label]) => <label key={field}>{label}<input type={field==='email'?'email':field==='password'?'password':'text'} value={data[field]} onChange={e=>update(field,e.target.value)} required={['email','password','first_name','last_name'].includes(field)} minLength={field==='password'?8:undefined}/></label>)}
      <label>Staff type<select value={data.staff_type} onChange={e=>update('staff_type',e.target.value)}><option value="receptionist">Receptionist</option><option value="dentist">Dentist</option><option value="radiologist">Radiologist</option><option value="assistant">Assistant</option></select></label>
      {error&&<p role="alert" className="error span-all">{error}</p>}{success&&<p role="status" className="success span-all">{success}</p>}
      <button className="primary span-all" disabled={busy}>{busy?'Creating...':'Create staff account'}</button>
    </form>
  </div>
}
