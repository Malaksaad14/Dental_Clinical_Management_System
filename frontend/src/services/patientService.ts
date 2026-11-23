
import { api } from './api'

export interface PatientProfile {
  id: number
  first_name: string
  last_name: string
  date_of_birth: string | null
  gender: string | null
  phone: string | null
  address: string | null
  national_id: string | null
  emergency_contact: string | null
}

export type PatientProfileChanges = Pick<
  PatientProfile,
  | 'first_name'
  | 'last_name'
  | 'phone'
  | 'address'
  | 'emergency_contact'
>

export async function getPatientProfile(
  token: string
): Promise<PatientProfile> {
  const response = await api.get<PatientProfile>(
    '/patients/me',
    {
      headers: {
        Authorization: `Bearer ${token}`,
      },
    }
  )

  return response.data
}

export async function updatePatientProfile(
  token: string,
  changes: PatientProfileChanges
): Promise<PatientProfile> {
  const response = await api.patch<PatientProfile>(
    '/patients/me',
    changes,
    {
      headers: {
        Authorization: `Bearer ${token}`,
      },
    }
  )

  return response.data
}
