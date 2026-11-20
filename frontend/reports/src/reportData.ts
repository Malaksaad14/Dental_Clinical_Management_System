type AppointmentDay = {
  date: string
  completed: number
  cancelled: number
  scheduled: number
  no_show: number
}

type SampleDay = {
  date: string
  patients: number
  payments: number
}

async function readReport<T>(url: string, signal: AbortSignal): Promise<T> {
  const response = await fetch(url, { signal })
  if (!response.ok) throw new Error(`Could not load ${url}`)
  return response.json()
}

export function loadReportData(signal: AbortSignal) {
  return Promise.all([
    readReport<AppointmentDay[]>('/api/reports/appointments', signal),
    readReport<SampleDay[]>('/api/reports/daily', signal),
  ])
}
