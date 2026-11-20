type PaymentDay = {
  date: string
  payment_count: number
  total_received: string
}

type AppointmentDay = {
  date: string
  completed: number
  cancelled: number
  scheduled: number
  no_show: number
}

type PatientDay = {
  date: string
  patients: number
}

async function readReport<T>(url: string, signal: AbortSignal): Promise<T> {
  const response = await fetch(url, { signal })
  if (!response.ok) throw new Error(`Could not load ${url}`)
  return response.json()
}

export function loadReportData(signal: AbortSignal) {
  return Promise.all([
    readReport<AppointmentDay[]>('/api/reports/appointments', signal),
    readReport<PatientDay[]>('/api/reports/patients', signal),
    readReport<PaymentDay[]>('/api/reports/payments', signal),
  ])
}


