import { ClinicalActions } from './StaffWorkspace'
import { useEffect, useState, type FormEvent } from 'react'
import { useLocation } from 'react-router'
import { api, messageFromError } from '../api/client'
import { useAuth } from '../auth/AuthContext'
import type { HistoryData, Patient } from '../types'
// @ts-ignore
import DentalChart from '../components/DentalChart'
// @ts-ignore
import TreatmentPlanList from '../components/TreatmentPlanList'
// @ts-ignore
import PrescriptionsList from '../components/PrescriptionsList'

const emptyHistory = { conditions: '', allergies: '', current_medications: '', dental_history: '' }

export default function History({ initialTab }: { initialTab?: 'chart' | 'plans' | 'prescriptions' | 'medical' }) {
  const { user } = useAuth()
  const location = useLocation()
  const patientMode = user?.role === 'patient'
  const clinical = user?.role === 'admin' || (user?.role === 'clinical_staff' && user.staff_type === 'dentist')

  const [author,setAuthor]=useState('')
  const [authors,setAuthors]=useState<{id:number;name:string}[]>([])
  useEffect(()=>{if(user?.role==='admin') api.get('/catalog/dentists').then(r=>setAuthors(r.data)).catch(()=>{})},[user?.role])
  const [patients, setPatients] = useState<Patient[]>([])
  const [patientId, setPatientId] = useState(new URLSearchParams(location.search).get('patient_id') || '')
  const [currentPatient, setCurrentPatient] = useState<Patient | null>(null)
  const [activeTab, setActiveTab] = useState<'chart' | 'plans' | 'prescriptions' | 'medical'>(initialTab || 'chart')

  // Sync active tab when navigating between patient sidebar links
  useEffect(() => {
    if (initialTab) setActiveTab(initialTab)
  }, [initialTab, location.pathname])

  // Clinical records state
  const [teethData, setTeethData] = useState<Record<number, any[]>>({})
  const [plans, setPlans] = useState<any[]>([])
  const [prescriptions, setPrescriptions] = useState<any[]>([])
  const [data, setData] = useState<HistoryData | null>(null)
  const [fields, setFields] = useState(emptyHistory)

  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState('')

  // Toast notification
  const [toast, setToast] = useState<string | null>(null)
  const showToast = (msg: string) => {
    setToast(msg)
    setTimeout(() => setToast(null), 3500)
  }

  // Initial patient list / patient profile
  useEffect(() => {
    if (patientMode) {
      api.get<Patient>('/patients/me')
        .then((r) => {
          setPatientId(String(r.data.id))
          setCurrentPatient(r.data)
        })
        .catch((err) => setError(messageFromError(err)))
    } else {
      api.get<Patient[]>('/patients')
        .then((r) => {
          setPatients(r.data)
          if (patientId) setCurrentPatient(r.data.find(p=>String(p.id)===patientId)||null)
          if (r.data.length > 0 && !patientId) {
            setPatientId(String(r.data[0].id))
            setCurrentPatient(r.data[0])
          }
        })
        .catch((err) => setError(messageFromError(err)))
    }
  }, [patientMode])

  // Update current patient object when patientId changes in dropdown
  const handleSelectPatient = (idStr: string) => {
    setTeethData({}); setPlans([]); setPrescriptions([]); setData(null); setFields(emptyHistory)
    setPatientId(idStr)
    const p = patients.find((x) => String(x.id) === idStr) || null
    setCurrentPatient(p)
  }

  // Load all patient clinical data
  const loadClinicalData = async (targetId: string, active: () => boolean = () => true) => {
    if (!targetId) return
    setLoading(true)
    setError('')
    try {
      const [chartRes, plansRes, rxRes, historyRes] = await Promise.allSettled([
        api.get<{ teeth: Record<number, any[]> }>(`/api/v1/dental/patients/${targetId}/chart`),
        api.get<any[]>(`/api/v1/treatment-plans/patients/${targetId}`),
        api.get<any[]>(`/api/v1/prescriptions/patients/${targetId}`),
        api.get<HistoryData>(patientMode ? '/history/me' : `/history/patients/${targetId}`)
      ])

      if (!active()) return
      if ([chartRes,plansRes,rxRes,historyRes].some(r=>r.status==='rejected')) setError('Some clinical records could not be loaded.')
      if (chartRes.status === 'fulfilled') {
        setTeethData(chartRes.value.data.teeth || {})
      }
      if (plansRes.status === 'fulfilled') {
        setPlans(plansRes.value.data || [])
      }
      if (rxRes.status === 'fulfilled') {
        setPrescriptions(rxRes.value.data || [])
      }
      if (historyRes.status === 'fulfilled') {
        const hData = historyRes.value.data
        setData(hData)
        // Keep input textareas blank so they do not stay pre-filled with old data
      }
    } catch (err) {
      setError(messageFromError(err))
    } finally {
      if(active()) setLoading(false)
    }
  }

  useEffect(() => {
    let active = true
    if (patientId) loadClinicalData(patientId, () => active)
    return () => { active = false }
  }, [patientId, patientMode])

  // --- Handlers ---
  const handleSaveToothRecord = async (record: { tooth_number: number; condition: string; surface?: string; notes?: string }) => {
    if (!patientId) return
    // Optimistic update so the tooth changes color immediately
    const optimistic = {
      id: Date.now(),
      patient_id: Number(patientId),
      tooth_number: record.tooth_number,
      condition: record.condition,
      surface: record.surface || 'Whole Tooth',
      notes: record.notes || '',
      recorded_at: new Date().toISOString()
    }
    setTeethData((prev) => ({
      ...prev,
      [record.tooth_number]: [optimistic, ...(prev[record.tooth_number] || [])]
    }))

    try {
      await api.post('/api/v1/dental/tooth-records', {
        patient_id: Number(patientId),
        recorded_by: user?.role==='admin' ? Number(author) : user?.id,
        ...record
      })
      showToast(`Tooth #${record.tooth_number} saved (${record.condition})!`)
      // Refresh chart from PostgreSQL
      const res = await api.get<{ teeth: Record<number, any[]> }>(`/api/v1/dental/patients/${patientId}/chart`)
      setTeethData(res.data.teeth || {})
    } catch (err) {
      showToast('Error saving tooth condition: ' + messageFromError(err))
      const res = await api.get<{ teeth: Record<number, any[]> }>(`/api/v1/dental/patients/${patientId}/chart`)
      setTeethData(res.data.teeth || {})
    }
  }

  const handleDeleteToothRecord = async (recordId: number) => {
    try {
      await api.delete(`/api/v1/dental/tooth-records/${recordId}`)
      showToast('Tooth record deleted.')
      if (patientId) {
        const res = await api.get<{ teeth: Record<number, any[]> }>(`/api/v1/dental/patients/${patientId}/chart`)
        setTeethData(res.data.teeth || {})
      }
    } catch (err) {
      showToast('Error deleting record: ' + messageFromError(err))
    }
  }

  const handleCreatePlan = async (planData: any) => {
    if (!patientId) return
    try {
      await api.post('/api/v1/treatment-plans', {
        patient_id: Number(patientId),
        dentist_id: user?.role==='admin' ? Number(author) : user?.id,
        ...planData
      })
      showToast('Treatment plan created successfully!')
      const res = await api.get<any[]>(`/api/v1/treatment-plans/patients/${patientId}`)
      setPlans(res.data || [])
    } catch (err) {
      showToast('Error creating plan: ' + messageFromError(err))
    }
  }

  const handleUpdatePlanItem = async (itemId: number, status: string) => {
    try {
      await api.patch(`/api/v1/treatment-plans/items/${itemId}`, { status })
      showToast(`Procedure updated to ${status}`)
      if (patientId) {
        const res = await api.get<any[]>(`/api/v1/treatment-plans/patients/${patientId}`)
        setPlans(res.data || [])
      }
    } catch (err) {
      showToast('Error updating item: ' + messageFromError(err))
    }
  }

  const handleDeletePlan = async (planId: number) => {
    if (!window.confirm('Are you sure you want to delete this treatment plan?')) return
    try {
      await api.delete(`/api/v1/treatment-plans/${planId}`)
      showToast('Treatment plan deleted.')
      if (patientId) {
        const res = await api.get<any[]>(`/api/v1/treatment-plans/patients/${patientId}`)
        setPlans(res.data || [])
      }
    } catch (err) {
      showToast('Error deleting plan: ' + messageFromError(err))
    }
  }

  const handleUpdatePlan = async (planId: number, updateData: any) => {
    try {
      await api.patch(`/api/v1/treatment-plans/${planId}`, updateData)
      showToast('Treatment plan updated.')
      if (patientId) {
        const res = await api.get<any[]>(`/api/v1/treatment-plans/patients/${patientId}`)
        setPlans(res.data || [])
      }
    } catch (err) {
      showToast('Error updating plan: ' + messageFromError(err))
    }
  }

  const handleCreatePrescription = async (rxData: any) => {
    if (!patientId) return
    try {
      await api.post('/api/v1/prescriptions', {
        patient_id: Number(patientId),
        dentist_id: user?.role==='admin' ? Number(author) : user?.id,
        ...rxData
      })
      showToast('Prescription issued successfully!')
      const res = await api.get<any[]>(`/api/v1/prescriptions/patients/${patientId}`)
      setPrescriptions(res.data || [])
    } catch (err) {
      showToast('Error issuing prescription: ' + messageFromError(err))
    }
  }

  const handleDeletePrescription = async (prescriptionId: number) => {
    if (!window.confirm('Are you sure you want to delete this prescription?')) return
    try {
      await api.delete(`/api/v1/prescriptions/${prescriptionId}`)
      showToast('Prescription deleted.')
      if (patientId) {
        const res = await api.get<any[]>(`/api/v1/prescriptions/patients/${patientId}`)
        setPrescriptions(res.data || [])
      }
    } catch (err) {
      showToast('Error deleting prescription: ' + messageFromError(err))
    }
  }

  const handleUpdatePrescription = async (prescriptionId: number, updateData: any) => {
    try {
      await api.patch(`/api/v1/prescriptions/${prescriptionId}`, updateData)
      showToast('Prescription updated.')
      if (patientId) {
        const res = await api.get<any[]>(`/api/v1/prescriptions/patients/${patientId}`)
        setPrescriptions(res.data || [])
      }
    } catch (err) {
      showToast('Error updating prescription: ' + messageFromError(err))
    }
  }

  const handleSaveMedical = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    setError('')
    setSuccess('')
    try {
      await api.put(`/history/patients/${patientId}/medical`, fields)
      setSuccess('Medical background saved.')
      const r = await api.get<HistoryData>(`/history/patients/${patientId}`)
      setData(r.data)
      setFields(emptyHistory) // Clear input textareas after saving
    } catch (err) {
      setError(messageFromError(err))
    }
  }

  return (
    <div className="panel" style={{ padding: '24px 28px' }}>
      {/* Toast Alert */}
      {toast && (
        <div className="fixed bottom-6 right-6 z-50 bg-slate-900 text-white px-5 py-3 rounded-2xl shadow-2xl text-xs font-semibold flex items-center gap-2 border border-slate-700 animate-in fade-in slide-in-from-bottom-3">
          <span>✨</span>
          <span>{toast}</span>
        </div>
      )}

      {/* Page Heading & Patient Selector */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '16px', flexWrap: 'wrap', marginBottom: '16px' }}>
        <h1 style={{ margin: 0, fontSize: '24px', fontWeight: 800, color: '#173645', letterSpacing: '-0.035em' }}>
          Electronic Dental Records
        </h1>

        {!patientMode && (
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            <span style={{ fontSize: '12.5px', fontWeight: 700, color: '#456172', whiteSpace: 'nowrap' }}>
              Selected Patient:
            </span>
            <select
              value={patientId}
              onChange={(e) => handleSelectPatient(e.target.value)}
              style={{ minWidth: '220px', minHeight: '38px', padding: '6px 12px', background: '#fff', fontWeight: 600, borderRadius: '8px', border: '1px solid #cdd8e4', fontSize: '13px' }}
            >
              <option value="">-- Choose patient --</option>
              {patients.map((p) => (
                <option key={p.id} value={p.id}>
                  {p.first_name} {p.last_name} (#{p.id})
                </option>
              ))}
            </select>
          </div>
        )}
      </div>

      {currentPatient && (
        <div className="subtle-line" style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '8px', margin: '0 0 16px 0', padding: '10px 16px' }}>
          <div>
            <strong>Patient:</strong> {currentPatient.first_name} {currentPatient.last_name} (ID #{currentPatient.id})
            {currentPatient.phone && <span> · Phone: {currentPatient.phone}</span>}
            {currentPatient.gender && <span> · Gender: {currentPatient.gender}</span>}
          </div>
          <span style={{ fontSize: '11px', color: '#138b7e', fontWeight: 700 }}>
            ● Active Clinical File
          </span>
        </div>
      )}

      {loading && <p className="muted" style={{ padding: '8px 0' }}>Loading patient clinical records...</p>}
      {error && <p className="error" role="alert">{error}</p>}
      {success && <p className="success" role="status">{success}</p>}

      {user?.role==='admin' && <label>Clinical author<select value={author} onChange={e=>setAuthor(e.target.value)}><option value="">Select dentist</option>{authors.map(a=><option key={a.id} value={a.id}>{a.name}</option>)}</select></label>}
      {clinical && !patientMode && patientId && <ClinicalActions key={patientId} patientId={Number(patientId)} author={author}/>}
      {/* Navigation Tabs */}
      <div style={{ display: 'flex', borderBottom: '2px solid #e5edf0', gap: '10px', marginTop: '14px', flexWrap: 'wrap' }}>
        <button
          type="button"
          onClick={() => setActiveTab('chart')}
          style={{
            padding: '10px 18px',
            fontSize: '13.5px',
            fontWeight: activeTab === 'chart' ? 800 : 600,
            color: activeTab === 'chart' ? '#0c8e87' : '#6b8290',
            borderBottom: activeTab === 'chart' ? '3px solid #0c8e87' : '3px solid transparent',
            marginBottom: '-2px',
            background: 'transparent',
            borderTop: 0,
            borderLeft: 0,
            borderRight: 0,
            cursor: 'pointer'
          }}
        >
          🦷 Dental Anatomy Chart
        </button>

        <button
          type="button"
          onClick={() => setActiveTab('plans')}
          style={{
            padding: '10px 18px',
            fontSize: '13.5px',
            fontWeight: activeTab === 'plans' ? 800 : 600,
            color: activeTab === 'plans' ? '#0c8e87' : '#6b8290',
            borderBottom: activeTab === 'plans' ? '3px solid #0c8e87' : '3px solid transparent',
            marginBottom: '-2px',
            background: 'transparent',
            borderTop: 0,
            borderLeft: 0,
            borderRight: 0,
            cursor: 'pointer'
          }}
        >
          📋 Treatment Plans ({plans.length})
        </button>

        <button
          type="button"
          onClick={() => setActiveTab('prescriptions')}
          style={{
            padding: '10px 18px',
            fontSize: '13.5px',
            fontWeight: activeTab === 'prescriptions' ? 800 : 600,
            color: activeTab === 'prescriptions' ? '#0c8e87' : '#6b8290',
            borderBottom: activeTab === 'prescriptions' ? '3px solid #0c8e87' : '3px solid transparent',
            marginBottom: '-2px',
            background: 'transparent',
            borderTop: 0,
            borderLeft: 0,
            borderRight: 0,
            cursor: 'pointer'
          }}
        >
          💊 Prescriptions ({prescriptions.length})
        </button>

        <button
          type="button"
          onClick={() => setActiveTab('medical')}
          style={{
            padding: '10px 18px',
            fontSize: '13.5px',
            fontWeight: activeTab === 'medical' ? 800 : 600,
            color: activeTab === 'medical' ? '#0c8e87' : '#6b8290',
            borderBottom: activeTab === 'medical' ? '3px solid #0c8e87' : '3px solid transparent',
            marginBottom: '-2px',
            background: 'transparent',
            borderTop: 0,
            borderLeft: 0,
            borderRight: 0,
            cursor: 'pointer'
          }}
        >
          📄 Medical Background
        </button>
      </div>

      {/* Tab 1: Dental Anatomy Chart */}
      {activeTab === 'chart' && (
        <div style={{ marginTop: '20px' }}>
          <DentalChart
            teethData={teethData}
            onSaveRecord={handleSaveToothRecord}
            onDeleteRecord={handleDeleteToothRecord}
            onAddToPlan={() => setActiveTab('plans')}
            readOnly={patientMode}
          />
        </div>
      )}

      {/* Tab 2: Treatment Plans */}
      {activeTab === 'plans' && (
        <div style={{ marginTop: '20px' }}>
          <TreatmentPlanList
            plans={plans}
            onCreatePlan={handleCreatePlan}
            onUpdateItemStatus={handleUpdatePlanItem}
            onDeletePlan={handleDeletePlan}
            onUpdatePlan={handleUpdatePlan}
            readOnly={patientMode}
          />
        </div>
      )}

      {/* Tab 3: Prescriptions */}
      {activeTab === 'prescriptions' && (
        <div style={{ marginTop: '20px' }}>
          <PrescriptionsList
            prescriptions={prescriptions}
            onCreatePrescription={handleCreatePrescription}
            onDeletePrescription={handleDeletePrescription}
            onUpdatePrescription={handleUpdatePrescription}
            readOnly={patientMode}
          />
        </div>
      )}

      {/* Tab 4: Medical History Background */}
      {activeTab === 'medical' && (
        <div style={{ marginTop: '20px' }}>
          {data && (
            <div className="info-grid">
              {(Object.keys(emptyHistory) as (keyof typeof emptyHistory)[]).map((key) => (
                <div className="info-field" key={key}>
                  <small>{key.replaceAll('_', ' ')}</small>
                  <p>{data.medical?.[key] ?? 'Not recorded'}</p>
                </div>
              ))}
            </div>
          )}

          {clinical && !patientMode && (
            <div style={{ marginTop: '30px' }}>
              <h2 className="section-heading">Update medical background</h2>
              <form onSubmit={handleSaveMedical} className="form-grid">
                {(Object.keys(emptyHistory) as (keyof typeof emptyHistory)[]).map((key) => (
                  <label key={key}>
                    {key.replaceAll('_', ' ')}
                    <textarea
                      rows={3}
                      value={fields[key]}
                      onChange={(e) => setFields((prev) => ({ ...prev, [key]: e.target.value }))}
                    />
                  </label>
                ))}
                <button className="primary span-all" type="submit">
                  Save medical history
                </button>
              </form>
            </div>
          )}
        </div>
      )}
    </div>
  )
}
