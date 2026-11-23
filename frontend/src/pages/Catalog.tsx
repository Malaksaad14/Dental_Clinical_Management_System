import { useEffect, useState, type FormEvent } from 'react'
import { api, messageFromError } from '../api/client'
import type { Availability, Chair, Dentist, Service } from '../types'

export default function Catalog() {
  const [services,setServices]=useState<Service[]>([])
  const [dentists,setDentists]=useState<Dentist[]>([])
  const [chairs,setChairs]=useState<Chair[]>([])
  const [avail,setAvail]=useState<Availability[]>([])
  const [newService,setNewService]=useState({code:'',name:'',category:'',price:'0',duration_minutes:'30'})
  const [newChair,setNewChair]=useState({name:'',room:''})
  const [newAvail,setNewAvail]=useState({dentist_id:'',day_of_week:'0',start_time:'09:00',end_time:'17:00'})
  const [error,setError]=useState('')
  const [success,setSuccess]=useState('')
  const refresh=async()=>{
    const [s,c,d,a]=await Promise.all([
      api.get<Service[]>('/catalog/services'),api.get<Chair[]>('/catalog/chairs'),
      api.get<Dentist[]>('/catalog/dentists'),api.get<Availability[]>('/catalog/availability'),
    ])
    setServices(s.data);setChairs(c.data);setDentists(d.data);setAvail(a.data)
  }
  useEffect(()=>{void refresh().catch(e=>setError(messageFromError(e)))},[])
  async function submit(e:FormEvent, route:string, data:object) {
    e.preventDefault();setError('');setSuccess('')
    try {await api.post(`/catalog/${route}`,data);await refresh();setSuccess('Saved successfully.')}
    catch(err){setError(messageFromError(err))}
  }
  return <div className="panel"><div className="page-heading"><h1>Clinic Setup</h1><p>Admin-only configuration used by patient appointment booking.</p></div>
    {error&&<p className="error" role="alert">{error}</p>}{success&&<p className="success" role="status">{success}</p>}
    <h2 className="section-heading">Services ({services.length})</h2>
    <form className="form-grid" onSubmit={e=>submit(e,'services',{...newService,price:Number(newService.price),duration_minutes:Number(newService.duration_minutes)})}>
      {(['code','name','category','price','duration_minutes'] as const).map(key=><label key={key}>{key.replaceAll('_',' ')}<input required={key!=='category'} type={key==='price'||key==='duration_minutes'?'number':'text'} min={key==='price'?'0':key==='duration_minutes'?'10':undefined} value={newService[key]} onChange={e=>setNewService(p=>({...p,[key]:e.target.value}))}/></label>)}
      <button className="primary span-all">Add service</button></form>
    <p className="hint">{services.map(s=>`${s.name} (${s.duration_minutes} min)`).join(' · ')||'No services yet'}</p>
    <h2 className="section-heading">Chairs ({chairs.length})</h2><form className="form-grid" onSubmit={e=>submit(e,'chairs',newChair)}><label>Chair name<input required value={newChair.name} onChange={e=>setNewChair(p=>({...p,name:e.target.value}))}/></label><label>Room<input value={newChair.room} onChange={e=>setNewChair(p=>({...p,room:e.target.value}))}/></label><button className="primary span-all">Add chair</button></form>
    <h2 className="section-heading">Dentist working hours ({avail.length})</h2><form className="form-grid" onSubmit={e=>submit(e,'availability',{...newAvail,dentist_id:Number(newAvail.dentist_id),day_of_week:Number(newAvail.day_of_week)})}>
      <label>Dentist<select required value={newAvail.dentist_id} onChange={e=>setNewAvail(p=>({...p,dentist_id:e.target.value}))}><option value="">Select dentist</option>{dentists.map(d=><option key={d.id} value={d.id}>{d.name}</option>)}</select></label>
      <label>Day<select value={newAvail.day_of_week} onChange={e=>setNewAvail(p=>({...p,day_of_week:e.target.value}))}>{['Monday','Tuesday','Wednesday','Thursday','Friday','Saturday','Sunday'].map((d,i)=><option key={i} value={i}>{d}</option>)}</select></label>
      <label>Start<input type="time" value={newAvail.start_time} onChange={e=>setNewAvail(p=>({...p,start_time:e.target.value}))}/></label>
      <label>End<input type="time" value={newAvail.end_time} onChange={e=>setNewAvail(p=>({...p,end_time:e.target.value}))}/></label>
      <button className="primary span-all">Add availability</button>
    </form><p className="hint">Create a dentist staff account before assigning working hours. Times refer to the clinic's Cairo timezone.</p>
  </div>
}
