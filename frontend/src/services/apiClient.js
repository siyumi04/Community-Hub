const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:5000/api'
const AUTH_TOKEN_KEY = 'authToken'

export const getAuthToken = () => localStorage.getItem(AUTH_TOKEN_KEY) || ''

export const setAuthToken = (token) => {
	if (!token) return
	localStorage.setItem(AUTH_TOKEN_KEY, token)
}

export const clearAuthData = () => {
	localStorage.removeItem(AUTH_TOKEN_KEY)
	localStorage.removeItem('currentStudent')
	window.dispatchEvent(new Event('student-profile-updated'))
}

const normalizePath = (path) => {
	if (!path) return ''
	return path.startsWith('/') ? path : `/${path}`
}

export const apiFetch = async (path, options = {}) => {
	const token = getAuthToken()
	const requestHeaders = {
		...(options.headers || {}),
	}

	if (!requestHeaders['Content-Type'] && !(options.body instanceof FormData)) {
		requestHeaders['Content-Type'] = 'application/json'
	}

	if (token && !requestHeaders.Authorization) {
		requestHeaders.Authorization = `Bearer ${token}`
	}

	const response = await fetch(`${API_BASE_URL}${normalizePath(path)}`, {
		...options,
		headers: requestHeaders,
	})

	if (response.status === 401) {
		clearAuthData()
	}

	return response
}
