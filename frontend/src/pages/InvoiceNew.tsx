import { useEffect, useState, type FormEvent } from 'react'
import { Link, useNavigate } from 'react-router'
import { useAuth } from '../auth/AuthContext'
import { api, messageFromError } from '../api/client'
import type { Invoice } from '../types'

type PatientOption = { id: number; first_name: string; last_name: string }
type ServiceOption = { id: number; name: string; price: string }
type ItemRow = { service_id: string; quantity: string }

export default function InvoiceNew() {
  const { user } = useAuth()
  const navigate = useNavigate()
  const root = user?.role === 'admin' ? '/admin' : '/staff'
  const [patients, setPatients] = useState<PatientOption[]>([])
  const [services, setServices] = useState<ServiceOption[]>([])
  const [patientId, setPatientId] = useState('')
  const [search, setSearch] = useState('')
  const [items, setItems] = useState<ItemRow[]>([{ service_id: '', quantity: '1' }])
  const [error, setError] = useState('')
  const [saving, setSaving] = useState(false)

  useEffect(() => {
    Promise.all([
      api.get<PatientOption[]>('/patients'),
      api.get<ServiceOption[]>('/catalog/services'),
    ])
      .then(([p, s]) => {
        setPatients(p.data)
        setServices(s.data)
      })
      .catch((err) => setError(messageFromError(err)))
  }, [])

  const shown = patients.filter((p) => `${p.first_name} ${p.last_name}`.toLowerCase().includes(search.toLowerCase()))

  function updateItem(index: number, field: keyof ItemRow, value: string) {
    setItems(items.map((it, i) => (i === index ? { ...it, [field]: value } : it)))
  }

  function addItem() {
    setItems([...items, { service_id: '', quantity: '1' }])
  }

  function removeItem(index: number) {
    setItems(items.filter((_, i) => i !== index))
  }

  async function submit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault()
    setError('')
    setSaving(true)
    try {
      const res = await api.post<Invoice>('/api/v1/invoices', {
        patient_id: Number(patientId),
        items: items.map((it) => ({
          service_id: Number(it.service_id),
          quantity: Number(it.quantity),
        })),
      })
      navigate(`${root}/billing/${res.data.id}`)
    } catch (err) {
      setError(messageFromError(err))
    } finally {
      setSaving(false)
    }
  }

  return (
    <div className="panel">
      <div className="page-heading">
        <h1>New invoice</h1>
        <p><Link to={`${root}/billing`}>Back to all invoices</Link></p>
      </div>
      {error && <p className="error" role="alert">{error}</p>}
      <form className="form-grid" onSubmit={submit}>
        <label className="span-all">
          Patient
          <input type="text" placeholder="Type to search by name" value={search} onChange={(e) => setSearch(e.target.value)} />
          <select value={patientId} onChange={(e) => setPatientId(e.target.value)} required>
            <option value="">Select a patient</option>
            {shown.map((p) => (
              <option key={p.id} value={p.id}>{p.first_name} {p.last_name}</option>
            ))}
          </select>
        </label>

        {items.map((item, index) => (
          <div className="span-all" key={index}>
            <label>
              Service
              <select
                value={item.service_id}
                onChange={(e) => updateItem(index, 'service_id', e.target.value)}
                required
              >
                <option value="">Select a service</option>
                {services.map((s) => (
                  <option key={s.id} value={s.id}>{s.name} - {Number(s.price).toFixed(2)}</option>
                ))}
              </select>
            </label>
            <label>
              Quantity
              <input
                type="number"
                min="1"
                value={item.quantity}
                onChange={(e) => updateItem(index, 'quantity', e.target.value)}
                required
              />
            </label>
            {items.length > 1 && (
              <button className="secondary" type="button" onClick={() => removeItem(index)}>
                Remove item
              </button>
            )}
          </div>
        ))}

        <button className="secondary span-all" type="button" onClick={addItem}>
          Add another item
        </button>
        <button className="primary span-all" type="submit" disabled={saving}>
          {saving ? 'Saving...' : 'Create invoice'}
        </button>
      </form>
    </div>
  )
}