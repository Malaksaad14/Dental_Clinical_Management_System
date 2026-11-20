
import axios from 'axios'

// Base URL of the FastAPI backend
export const api = axios.create({
  baseURL: 'http://127.0.0.1:8000',
  timeout: 10000,
})

// Convert API errors to user-friendly messages
export function getApiError(error: unknown): string {
  if (axios.isAxiosError(error)) {
    const detail = error.response?.data?.detail

    if (typeof detail === 'string') {
      return detail
    }

    if (error.response?.status === 422) {
      return 'Please check the entered information.'
    }

    if (!error.response) {
      return 'Cannot connect to the server.'
    }
  }

  return 'Something went wrong. Please try again.'
}
