import { useEffect, useState } from 'react'
import { Link } from 'react-router'
import { api, messageFromError } from '../api/client'
import { useAuth } from '../auth/AuthContext'
import type { Patient, Staff, User } from '../types'

export function PatientsDirectory() {
  const { user } = useAuth()
  const [rows,setRows] = useState<Patient[]>([])
  const [error,setError] = useState('')
  const load = () => api.get<Patient[]>('/patients').then(r=>setRows(r.data)).catch(e=>setError(messageFromError(e)))
  useEffect(()=>{void load()},[])
  const base = user?.role==='admin'?'/admin':'/staff'

  async function toggle(patient:Patient) {
    // Account status requires admin permissions; patient list has no active flag.
    if (!window.confirm(`Deactivate account for ${patient.email}?`)) return
    try {await api.patch(`/admin/users/${patient.user_id}/status`,{is_active:false});setError('Account deactivated. Reload for account status details.')}
    catch(e){setError(messageFromError(e))}
  }
  return <div className="panel"><div className="page-heading"><h1>Patients</h1><p>Patient details are visible only to authorized clinic staff.</p></div>
    <div className="action-row"><Link className="primary link-button" to={`${base}/patients/new`}>+ Create patient</Link></div>
    {error&&<p className="error" role="alert">{error}</p>}
    <div className="table-wrap"><table><thead><tr><th>Patient ID</th><th>Name</th><th>Email</th><th>Phone</th><th>Action</th></tr></thead><tbody>{rows.map(p=><tr key={p.id}><td>{p.id}</td><td>{p.first_name} {p.last_name}</td><td>{p.email}</td><td>{p.phone||'—'}</td><td><Link to={`${base}/appointments?patient_id=${p.id}`}>Book</Link> {user?.role==='admin'&&<button className="small secondary" onClick={()=>toggle(p)}>Deactivate</button>}</td></tr>)}</tbody></table></div>
  </div>
}

export function StaffDirectory() {
  const [rows,setRows] = useState<Staff[]>([])
  const [error,setError] = useState('')
  const load = () => api.get<Staff[]>('/admin/staff').then(r=>setRows(r.data)).catch(e=>setError(messageFromError(e)))
  useEffect(()=>{void load()},[])
  async function toggle(staff: Staff) {
    try {
      await api.patch(`/admin/users/${staff.user_id}/status`, {is_active:!staff.is_active})
      await load()
    } catch(e) {setError(messageFromError(e))}
  }
  return <div className="panel"><div className="page-heading"><h1>Staff Accounts</h1><p>Only administrators can manage staff accounts.</p></div><Link className="primary link-button" to="/admin/staff/new">+ Create staff</Link>
    {error&&<p className="error" role="alert">{error}</p>}
    <div className="table-wrap"><table><thead><tr><th>Name</th><th>Email</th><th>Type</th><th>Status</th><th>Action</th></tr></thead><tbody>{rows.map(s=><tr key={s.id}><td>{s.first_name} {s.last_name}</td><td>{s.email}</td><td>{s.staff_type}</td><td>{s.is_active?'Active':'Inactive'}</td><td><button className="small secondary" onClick={()=>toggle(s)}>{s.is_active?'Deactivate':'Activate'}</button></td></tr>)}</tbody></table></div>
  </div>
}


export function AccountsDirectory() {
  const [accounts,setAccounts]=useState<User[]>([])
  const [error,setError]=useState('')
  const load=()=>api.get<User[]>('/admin/users').then(r=>setAccounts(r.data)).catch(e=>setError(messageFromError(e)))
  useEffect(()=>{void load()},[])
  async function toggle(account:User) {
    try {await api.patch(`/admin/users/${account.id}/status`,{is_active:!account.is_active});await load()}
    catch(e){setError(messageFromError(e))}
  }
  return <div className="panel"><div className="page-heading"><h1>Manage All Accounts</h1><p>Admin can activate or deactivate staff and patient accounts.</p></div>
    {error&&<p className="error" role="alert">{error}</p>}
    <div className="table-wrap"><table><thead><tr><th>User ID</th><th>Email</th><th>Role</th><th>Staff type</th><th>Status</th><th>Action</th></tr></thead><tbody>{accounts.map(a=><tr key={a.id}><td>#{a.id}</td><td>{a.email}</td><td>{a.role}</td><td>{a.staff_type??'—'}</td><td>{a.is_active?'Active':'Inactive'}</td><td><button className="small secondary" disabled={a.role==='admin'&&a.is_active} onClick={()=>toggle(a)}>{a.is_active?'Deactivate':'Activate'}</button></td></tr>)}</tbody></table></div>
  </div>
}
