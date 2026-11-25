import { useEffect, useState } from 'react'
import { Link } from 'react-router'
import { useAuth } from '../auth/AuthContext'
import { api, messageFromError } from '../api/client'
import type { Invoice } from '../types'

const money = (value: string) => Number(value).toFixed(2)

export default function Invoices() {
  const { user } = useAuth()
  const root = user?.role === 'admin' ? '/admin' : '/staff'
  const [invoices, setInvoices] = useState<Invoice[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [names, setNames] = useState<Record<string, string>>({})

  useEffect(() => {
    api.get<Invoice[]>('/api/v1/invoices')
      .then((res) => setInvoices(res.data))
      .catch((err) => setError(messageFromError(err)))
      .finally(() => setLoading(false))
  }, [])

  useEffect(() => {
    api.get<{ id: number; first_name: string; last_name: string }[]>('/patients')
      .then((res) => {
        const m: Record<string, string> = {}
        res.data.forEach((pt) => { m[String(pt.id)] = pt.first_name + ' ' + pt.last_name })
        setNames(m)
      })
      .catch(() => {})
  }, [])

  return (
    <div className="panel">
      <div className="page-heading">
        <h1>Billing</h1>
        <p>All patient invoices.</p>
        <p><Link className="primary" to={`${root}/billing/new`}>New invoice</Link></p>
      </div>
      {error && <p className="error" role="alert">{error}</p>}
      {loading ? <p>Loading...</p> : invoices.length === 0 ? <p className="hint">No invoices yet.</p> : (
        <table>
          <thead>
            <tr>
              <th>Invoice</th>
              <th>Patient</th>
              <th>Date</th>
              <th>Total</th>
              <th>Paid</th>
              <th>Balance</th>
              <th>Status</th>
            </tr>
          </thead>
          <tbody>
            {invoices.map((inv) => (
              <tr key={inv.id}>
                <td><Link to={`${root}/billing/${inv.id}`}>{inv.invoice_number}</Link></td>
                <td>{names[String(inv.patient_id)] ?? inv.patient_id}</td>
                <td>{inv.issue_date}</td>
                <td>{money(inv.total)}</td>
                <td>{money(inv.amount_paid)}</td>
                <td>{money(inv.balance_due)}</td>
                <td>{inv.status.replace('_', ' ')}</td>
              </tr>
            ))}
          </tbody>
        </table>
      )}
    </div>
  )
}
