import { useEffect, useState } from 'react'
import { Link, useParams } from 'react-router'
import { useAuth } from '../auth/AuthContext'
import { api, messageFromError } from '../api/client'
import type { Invoice } from '../types'

const money = (value: string) => Number(value).toFixed(2)

export default function InvoiceDetail() {
  const { id } = useParams()
  const { user } = useAuth()
  const root = user?.role === 'admin' ? '/admin' : '/staff'
  const [invoice, setInvoice] = useState<Invoice | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  useEffect(() => {
    api.get<Invoice>(`/api/v1/invoices/${id}`)
      .then((res) => setInvoice(res.data))
      .catch((err) => setError(messageFromError(err)))
      .finally(() => setLoading(false))
  }, [id])

  return (
    <div className="panel">
      <div className="page-heading">
        <h1>{invoice ? invoice.invoice_number : 'Invoice'}</h1>
        <p><Link to={`${root}/billing`}>Back to all invoices</Link></p>
      </div>
      {error && <p className="error" role="alert">{error}</p>}
      {loading && <p>Loading...</p>}
      {invoice && (
        <>
          <p>
            Patient ID: {invoice.patient_id} | Date: {invoice.issue_date} | Status: {invoice.status.replace('_', ' ')}
          </p>

          <h2 className="section-heading">Items</h2>
          <table>
            <thead>
              <tr><th>Description</th><th>Qty</th><th>Unit price</th><th>Line total</th></tr>
            </thead>
            <tbody>
              {invoice.items.map((item) => (
                <tr key={item.id}>
                  <td>{item.description}</td>
                  <td>{item.quantity}</td>
                  <td>{money(item.unit_price)}</td>
                  <td>{money(item.line_total)}</td>
                </tr>
              ))}
            </tbody>
          </table>

          <p>
            Total: {money(invoice.total)} | Paid: {money(invoice.amount_paid)} | Balance: {money(invoice.balance_due)}
          </p>

          <h2 className="section-heading">Payments</h2>
          {invoice.payments.length === 0 ? <p className="hint">No payments yet.</p> : (
            <table>
              <thead>
                <tr><th>Reference</th><th>Date</th><th>Method</th><th>Amount</th></tr>
              </thead>
              <tbody>
                {invoice.payments.map((pay) => (
                  <tr key={pay.id}>
                    <td>{pay.reference}</td>
                    <td>{pay.paid_at.slice(0, 10)}</td>
                    <td>{pay.method}</td>
                    <td>{money(pay.amount)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </>
      )}
    </div>
  )
}
