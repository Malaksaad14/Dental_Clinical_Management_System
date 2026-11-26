import { BrowserRouter, Navigate, Route, Routes } from 'react-router'
import { AuthProvider, useAuth } from './auth/AuthContext'
import { RoleRoute } from './auth/RoleRoute'
import StaffRoute from './auth/StaffRoute'
import { DailyQueue, ImagingQueue } from './pages/StaffWorkspace'
import Layout from './components/Layout'
import Login from './pages/Login'
import Dashboard from './pages/Dashboard'
import CreatePatient from './pages/CreatePatient'
import CreateStaff from './pages/CreateStaff'
import { AccountsDirectory, PatientsDirectory, StaffDirectory } from './pages/Directory'
import Profile from './pages/Profile'
import Appointments from './pages/Appointments'
import History from './pages/History'
import Reports from './pages/Reports'
import Catalog from './pages/Catalog'
import ModulePending from './pages/ModulePending'
import MyBills from './pages/MyBills'
import Invoices from './pages/Invoices'
import InvoiceDetail from './pages/InvoiceDetail'
import InvoiceNew from './pages/InvoiceNew'

function Home(){
  const {user,initializing}=useAuth()
  if(initializing)return <div className="center">Restoring session...</div>
  return <Navigate replace to={!user?'/login':user.role==='admin'?'/admin':user.role==='clinical_staff'?'/staff':'/patient'}/>
}

export default function App(){
  return <BrowserRouter><AuthProvider><Routes>
    <Route path="/" element={<Home/>}/>
    <Route path="/login" element={<Login/>}/>
    <Route path="/register" element={<Navigate to="/login" replace/>}/>

    <Route element={<RoleRoute allowed={['patient']}/> }>
      <Route element={<Layout/>}>
        <Route path="/patient" element={<Dashboard/>}/>
        <Route path="/patient/profile" element={<Profile/>}/>
        <Route path="/patient/appointments" element={<Appointments/>}/>
        <Route path="/patient/history" element={<History initialTab="medical"/>}/>
        <Route path="/patient/treatment-plans" element={<History initialTab="plans"/>}/>
        <Route path="/patient/prescriptions" element={<History initialTab="prescriptions"/>}/>
        <Route path="/patient/billing" element={<MyBills/>}/>
        <Route path="/patient/:section" element={<ModulePending/>}/>
      </Route>
    </Route>

    <Route element={<RoleRoute allowed={['clinical_staff']}/> }>
      <Route element={<Layout/>}>
        <Route path="/staff" element={<Dashboard/>}/>
        <Route element={<StaffRoute types={['dentist','receptionist']}/>}>
        <Route path="/staff/patients" element={<PatientsDirectory/>}/>
        </Route>
        <Route element={<StaffRoute types={['receptionist']}/>}>
        <Route path="/staff/patients/new" element={<CreatePatient/>}/>
        <Route path="/staff/billing" element={<Invoices/>}/>
        <Route path="/staff/billing/new" element={<InvoiceNew/>}/>
        <Route path="/staff/billing/:id" element={<InvoiceDetail/>}/>
        </Route>
        <Route element={<StaffRoute types={['dentist']}/>}><Route path="/staff/history" element={<History/>}/></Route>
        <Route element={<StaffRoute types={['assistant']}/>}><Route path="/staff/queue" element={<DailyQueue/>}/></Route>
        <Route element={<StaffRoute types={['dentist','radiologist']}/>}><Route path="/staff/imaging" element={<ImagingQueue/>}/></Route>
      </Route>
    </Route>

    <Route element={<RoleRoute allowed={['admin']}/> }>
      <Route element={<Layout/>}>
        <Route path="/admin" element={<Dashboard/>}/>
        <Route path="/admin/patients" element={<PatientsDirectory/>}/>
        <Route path="/admin/patients/new" element={<CreatePatient/>}/>
        <Route path="/admin/staff" element={<StaffDirectory/>}/>
        <Route path="/admin/staff/new" element={<CreateStaff/>}/>
        <Route path="/admin/accounts" element={<AccountsDirectory/>}/>
        <Route path="/admin/appointments" element={<Appointments/>}/>
        <Route path="/admin/history" element={<History/>}/>
        <Route path="/admin/imaging" element={<ImagingQueue/>}/>
        <Route path="/admin/reports" element={<Reports/>}/>
        <Route path="/admin/catalog" element={<Catalog/>}/>
        <Route path="/admin/billing" element={<Invoices/>}/>
        <Route path="/admin/billing/new" element={<InvoiceNew/>}/>
        <Route path="/admin/billing/:id" element={<InvoiceDetail/>}/>
      </Route>
    </Route>

    <Route path="*" element={<Navigate to="/" replace/>}/>
  </Routes></AuthProvider></BrowserRouter>
}
