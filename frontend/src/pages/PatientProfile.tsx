
import { useEffect, useState, type FormEvent } from 'react'

import { useAuth } from '../context/AuthContext'
import { getApiError } from '../services/api'
import {
  getPatientProfile,
  updatePatientProfile,
  type PatientProfile as PatientProfileData,
} from '../services/patientService'

type EditableField =
  | 'first_name'
  | 'last_name'
  | 'phone'
  | 'address'
  | 'emergency_contact'

export default function PatientProfile() {
  const { token } = useAuth()

  const [profile, setProfile] =
    useState<PatientProfileData | null>(null)

  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState('')

  useEffect(() => {
    if (!token) return

    let cancelled = false

    getPatientProfile(token)
      .then((data) => {
        if (!cancelled) setProfile(data)
      })
      .catch((err) => {
        if (!cancelled) setError(getApiError(err))
      })
      .finally(() => {
        if (!cancelled) setLoading(false)
      })

    return () => {
      cancelled = true
    }
  }, [token])

  function changeField(field: EditableField, value: string) {
    setProfile((previous) =>
      previous ? { ...previous, [field]: value } : null
    )
  }

  async function handleSave(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    if (!profile || !token) return

    setSaving(true)
    setError('')
    setSuccess('')

    try {
      const updated = await updatePatientProfile(token, {
        first_name: profile.first_name.trim(),
        last_name: profile.last_name.trim(),
        phone: profile.phone?.trim() || null,
        address: profile.address?.trim() || null,
        emergency_contact:
          profile.emergency_contact?.trim() || null,
      })

      setProfile(updated)
      setSuccess('Profile updated successfully.')
    } catch (err) {
      setError(getApiError(err))
    } finally {
      setSaving(false)
    }
  }

  if (loading) return <p>Loading profile...</p>

  if (!profile) {
    return <p role="alert">{error || 'Profile not found.'}</p>
  }

  return (
    <section className="profile-card">
      <h1>My Profile</h1>
      <p>Update your personal information.</p>

      <form onSubmit={handleSave}>
        <label htmlFor="profile-first-name">First Name</label>
        <input
          id="profile-first-name"
          value={profile.first_name}
          onChange={(e) =>
            changeField('first_name', e.target.value)
          }
          required
        />

        <label htmlFor="profile-last-name">Last Name</label>
        <input
          id="profile-last-name"
          value={profile.last_name}
          onChange={(e) =>
            changeField('last_name', e.target.value)
          }
          required
        />

        <label htmlFor="profile-phone">Phone</label>
        <input
          id="profile-phone"
          type="tel"
          value={profile.phone ?? ''}
          onChange={(e) =>
            changeField('phone', e.target.value)
          }
        />

        <label htmlFor="profile-address">Address</label>
        <input
          id="profile-address"
          value={profile.address ?? ''}
          onChange={(e) =>
            changeField('address', e.target.value)
          }
        />

        <label htmlFor="profile-emergency">Emergency Contact</label>
        <input
          id="profile-emergency"
          value={profile.emergency_contact ?? ''}
          onChange={(e) =>
            changeField('emergency_contact', e.target.value)
          }
        />

        {error && <p className="error" role="alert">{error}</p>}
        {success && <p className="success" role="status">{success}</p>}

        <button disabled={saving} type="submit">
          {saving ? 'Saving...' : 'Save Changes'}
        </button>
      </form>
    </section>
  )
}
