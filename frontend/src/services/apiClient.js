import axios from 'axios'
import { API_BASE_URL } from '../utils/constants'

const apiClient = axios.create({
  baseURL: API_BASE_URL
})

export const getAuthToken = () => localStorage.getItem('token')

export const setAuthToken = (token) => {
  localStorage.setItem('token', token)
}

export const clearAuthData = () => {
  localStorage.removeItem('token')
  localStorage.removeItem('currentStudent')
}

export const apiFetch = (path, options = {}) => {
  const token = getAuthToken()
  const headers = {
    'Content-Type': 'application/json',
    ...(token ? { Authorization: `Bearer ${token}` } : {}),
    ...(options.headers || {}),
  }
  return fetch(`${API_BASE_URL}${path}`, {
    ...options,
    headers,
  })
}

export default apiClient