export type Role = 'admin' | 'clinical_staff' | 'patient'
export type StaffType = 'dentist' | 'radiologist' | 'assistant' | 'receptionist'

export interface User {
  id: number
  email: string
  role: Role
  is_active: boolean
  staff_type: StaffType | null
}

export interface Patient {
  id: number
  user_id: number
  email: string
  first_name: string
  last_name: string
  date_of_birth: string | null
  gender: string | null
  phone: string | null
  address: string | null
  national_id: string | null
  emergency_contact: string | null
}

export interface Staff {
  id: number
  user_id: number
  email: string
  first_name: string
  last_name: string
  staff_type: StaffType
  specialization: string | null
  license_number: string | null
  phone: string | null
  is_active: boolean
}

export interface Service {
  id: number
  code: string
  name: string
  category: string | null
  price: string
  duration_minutes: number
}

export interface Dentist { id: number; name: string }
export interface Chair { id: number; name: string; room: string | null; is_active: boolean }
export interface Availability { id: number; dentist_id: number; day_of_week: number; start_time: string; end_time: string }

export interface Appointment {
  id: number
  patient_id: number
  dentist_id: number
  dentist_name: string
  chair_id: number
  service_id: number
  service_name: string
  start_time: string
  end_time: string
  status: string
  reason: string | null
}

export interface MedicalHistory {
  id: number
  patient_id: number
  conditions: string | null
  allergies: string | null
  current_medications: string | null
  dental_history: string | null
  updated_at: string
}

export interface ToothRecord {
  id: number
  patient_id: number
  recorded_by: number
  tooth_number: number
  surface: string | null
  condition: string
  notes: string | null
  recorded_at: string
}

export interface HistoryData {
  medical: MedicalHistory | null
  tooth_records: ToothRecord[]
}
