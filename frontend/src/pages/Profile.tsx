import { useEffect, useState, type FormEvent } from 'react'
import { api, messageFromError } from '../api/client'
import type { Patient } from '../types'

export default function Profile() {
  const [data,setData] = useState<Patient|null>(null)
  const [loading,setLoading] = useState(true)
  const [saving,setSaving] = useState(false)
  const [error,setError] = useState('')
  const [success,setSuccess] = useState('')
  useEffect(()=>{
    let alive=true
    api.get<Patient>('/patients/me').then(r=>{if(alive)setData(r.data)}).catch(err=>{if(alive)setError(messageFromError(err))}).finally(()=>{if(alive)setLoading(false)})
    return ()=>{alive=false}
  },[])
  if(loading) return <p>Loading profile...</p>
  if(!data) return <p className="error" role="alert">{error||'Patient profile not found'}</p>
  const fields: [keyof Patient,string][] = [['first_name','First name'],['last_name','Last name'],['phone','Phone'],['address','Address'],['emergency_contact','Emergency contact']]
  async function save(e:FormEvent<HTMLFormElement>) {
    e.preventDefault(); if(!data)return
    setSaving(true);setError('');setSuccess('')
    try {const r=await api.patch<Patient>('/patients/me',Object.fromEntries(fields.map(([key])=>[key,data[key]])));setData(r.data);setSuccess('Profile saved.')}
    catch(err){setError(messageFromError(err))}
    finally{setSaving(false)}
  }
  return <div className="panel"><div className="page-heading"><h1>My Profile</h1><p>Review and update your own contact information.</p></div>
    <div className="subtle-line">Email: {data.email} · Patient ID: {data.id}</div>
    <form className="form-grid" onSubmit={save}>{fields.map(([key,label])=><label key={key}>{label}<input value={(data[key] as string|null)??''} onChange={e=>setData(prev=>prev?{...prev,[key]:e.target.value}:null)} required={key==='first_name'||key==='last_name'}/></label>)}
      {error&&<p className="error span-all" role="alert">{error}</p>}{success&&<p className="success span-all" role="status">{success}</p>}
      <button className="primary span-all" disabled={saving}>{saving?'Saving...':'Save changes'}</button></form>
  </div>
}
