import { useEffect, useState, type FormEvent } from 'react'
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
  const [success, setSuccess] = useState('')
  const [amount, setAmount] = useState('')
  const [method, setMethod] = useState('cash')
  const [saving, setSaving] = useState(false)

  function load() {
    return api.get<Invoice>(`/api/v1/invoices/${id}`).then((res) => setInvoice(res.data))
  }

  useEffect(() => {
    load()
      .catch((err) => setError(messageFromError(err)))
      .finally(() => setLoading(false))
  }, [id])

  async function recordPayment(e: FormEvent<HTMLFormElement>) {
    e.preventDefault()
    setError('')
    setSuccess('')
    setSaving(true)
    try {
      await api.post(`/api/v1/invoices/${id}/payments`, { amount: Number(amount), method })
      await load()
      setAmount('')
      setSuccess('Payment recorded.')
    } catch (err) {
      setError(messageFromError(err))
    } finally {
      setSaving(false)
    }
  }

  const canPay = invoice?.status === 'unpaid' || invoice?.status === 'partially_paid'

  return (
    <div className="panel">
      <div className="page-heading">
        <h1>{invoice ? invoice.invoice_number : 'Invoice'}</h1>
        <p><Link to={`${root}/billing`}>Back to all invoices</Link></p>
      </div>
      {error && <p className="error" role="alert">{error}</p>}
      {success && <p className="success" role="status">{success}</p>}
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

          {canPay && (
            <>
              <h2 className="section-heading">Record payment</h2>
              <form className="form-grid" onSubmit={recordPayment}>
                <label>Amount
                  <input
                    required
                    type="number"
                    min="0.01"
                    step="0.01"
                    value={amount}
                    onChange={(e) => setAmount(e.target.value)}
                  />
                </label>
                <label>Method
                  <select value={method} onChange={(e) => setMethod(e.target.value)}>
                    <option value="cash">Cash</option>
                    <option value="card">Card</option>
                    <option value="online">Online</option>
                  </select>
                </label>
                <button className="primary span-all" type="submit" disabled={saving}>
                  {saving ? 'Saving...' : 'Record payment'}
                </button>
              </form>
            </>
          )}
        </>
      )}
    </div>
  )
}
