import { useEffect, useState } from 'react'
import { api, messageFromError } from '../api/client'
import type { Invoice } from '../types'

export default function MyBills() {
  const [invoices, setInvoices] = useState<Invoice[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  useEffect(() => {
    api.get<Invoice[]>('/api/v1/invoices/me')
      .then((res) => setInvoices(res.data))
      .catch((err) => setError(messageFromError(err)))
      .finally(() => setLoading(false))
  }, [])

  return (
    <div className="panel">
      <div className="page-heading">
        <h1>My Bills</h1>
        <p>Your invoices and payments.</p>
      </div>
      {error && <p className="error" role="alert">{error}</p>}
      {loading ? <p>Loading...</p> : invoices.length === 0 ? <p className="hint">No invoices yet.</p> : (
        <table>
          <thead>
            <tr>
              <th>Invoice</th>
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
                <td>{inv.invoice_number}</td>
                <td>{inv.issue_date}</td>
                <td>{Number(inv.total).toFixed(2)}</td>
                <td>{Number(inv.amount_paid).toFixed(2)}</td>
                <td>{Number(inv.balance_due).toFixed(2)}</td>
                <td>{inv.status.replace('_', ' ')}</td>
              </tr>
            ))}
          </tbody>
        </table>
      )}
    </div>
  )
}
