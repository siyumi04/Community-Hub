import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import './EditProfile.css'
import { showPopup } from '../../utils/popup'
import { apiFetch, clearAuthData } from '../../services/apiClient'

const IT_NUMBER_PATTERN = /^IT\d{2}[A-Za-z0-9]{6}$/
const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
const FULL_NAME_PATTERN = /^[A-Za-z][A-Za-z' -]{2,49}$/

function EditProfile() {
  const navigate = useNavigate()
  const [profile, setProfile] = useState({
    id: '',
    fullName: '',
    email: '',
    itNumber: '',
    favoriteCommunity: '',
    bio: '',
    profilePicture: '',
  })
  const [deleting, setDeleting] = useState(false)
  const [fieldErrors, setFieldErrors] = useState({
    fullName: '',
    email: '',
    itNumber: '',
    favoriteCommunity: '',
    bio: '',
    profilePicture: '',
  })
  const [touched, setTouched] = useState({
    fullName: false,
    email: false,
    itNumber: false,
    favoriteCommunity: false,
    bio: false,
    profilePicture: false,
  })
  const [profileImage, setProfileImage] = useState('')
  const [profileImageName, setProfileImageName] = useState('No image selected')

  const validateField = (name, value) => {
    if (name === 'fullName') {
      const normalized = String(value).trim()
      if (!normalized) return 'Full name is required.'
      if (!FULL_NAME_PATTERN.test(normalized)) return 'Use 3-50 letters only.'
      return ''
    }

    if (name === 'email') {
      const normalized = String(value).trim().toLowerCase()
      if (!normalized) return 'Email is required.'
      if (!EMAIL_PATTERN.test(normalized)) return 'Please provide a valid email.'
      return ''
    }

    if (name === 'itNumber') {
      const normalized = String(value).trim().toUpperCase()
      if (!normalized) return 'IT Number is required.'
      if (!IT_NUMBER_PATTERN.test(normalized)) return 'Format should be like IT21ABC123.'
      return ''
    }

    if (name === 'favoriteCommunity') {
      if (String(value).trim().length > 60) return 'Favorite community should be 60 chars or fewer.'
      return ''
    }

    if (name === 'bio') {
      if (String(value).trim().length > 300) return 'Bio should be 300 characters or fewer.'
      return ''
    }

    if (name === 'profilePicture') {
      return ''
    }

    return ''
  }

  const validateAll = () => {
    const nextErrors = {
      fullName: validateField('fullName', profile.fullName),
      email: validateField('email', profile.email),
      itNumber: validateField('itNumber', profile.itNumber),
      favoriteCommunity: validateField('favoriteCommunity', profile.favoriteCommunity),
      bio: validateField('bio', profile.bio),
      profilePicture: fieldErrors.profilePicture,
    }
    setFieldErrors(nextErrors)
    return Object.values(nextErrors).every((value) => !value)
  }

  useEffect(() => {
    const loadStudentProfile = async () => {
      const storedStudent = localStorage.getItem('currentStudent')
      if (!storedStudent) {
        navigate('/login')
        return
      }

      try {
        const parsed = JSON.parse(storedStudent)
        const studentId = parsed._id || parsed.id || ''
        if (!studentId) return

        const response = await apiFetch(`/students/${studentId}`)
        if (response.status === 401) {
          showPopup('Your session has expired. Please sign in again.', 'error')
          navigate('/login')
          return
        }
        if (!response.ok) {
          throw new Error('Could not retrieve profile from database')
        }

        const result = await response.json()
        const student = result?.data
        if (!student) return

        setProfile({
          id: student._id || student.id || '',
          fullName: student.name || '',
          email: student.email || '',
          itNumber: student.itNumber || '',
          favoriteCommunity: student.favoriteCommunity || '',
          bio: student.bio || '',
          profilePicture: student.profilePicture || '',
        })

        if (student.profilePicture) {
          setProfileImage(student.profilePicture)
          setProfileImageName('Current profile picture')
        }

        localStorage.setItem('currentStudent', JSON.stringify(student))
        window.dispatchEvent(new Event('student-profile-updated'))
      } catch {
        showPopup('Unable to load profile data from database.', 'error')
      }
    }

    loadStudentProfile()
  }, [])

  const handleChange = (e) => {
    const { name, value } = e.target
    setProfile((prev) => ({ ...prev, [name]: value }))
    if (touched[name]) {
      setFieldErrors((prev) => ({ ...prev, [name]: validateField(name, value) }))
    }
  }

  const handleImageChange = (e) => {
    const file = e.target.files?.[0]
    if (!file) return

    if (!file.type.startsWith('image/')) {
      setFieldErrors((prev) => ({ ...prev, profilePicture: 'Please upload a valid image file.' }))
        setTouched((prev) => ({ ...prev, profilePicture: true }))
        showPopup('Please upload a valid image file.', 'error')
      return
    }

    if (file.size > 2 * 1024 * 1024) {
      setFieldErrors((prev) => ({ ...prev, profilePicture: 'Profile image must be 2MB or smaller.' }))
        setTouched((prev) => ({ ...prev, profilePicture: true }))
        showPopup('Profile image must be 2MB or smaller.', 'error')
      return
    }

    const reader = new FileReader()
    reader.onloadend = () => {
      const imageDataUrl = typeof reader.result === 'string' ? reader.result : ''
      if (!imageDataUrl) return

      setProfileImage(imageDataUrl)
      setProfileImageName(file.name)
      setProfile((prev) => ({ ...prev, profilePicture: imageDataUrl }))
      setTouched((prev) => ({ ...prev, profilePicture: true }))
      setFieldErrors((prev) => ({ ...prev, profilePicture: '' }))
      showPopup('Profile image selected successfully.', 'success')
    }
    reader.readAsDataURL(file)
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    setTouched({
      fullName: true,
      email: true,
      itNumber: true,
      favoriteCommunity: true,
      bio: true,
      profilePicture: true,
    })

    if (!validateAll()) {
      showPopup('Please fix the highlighted profile fields.', 'error')
      return
    }

    const fullName = profile.fullName.trim()
    const email = profile.email.trim().toLowerCase()
    const itNumber = profile.itNumber.trim().toUpperCase()

    try {
      const payload = {
        name: fullName,
        email,
        itNumber,
        profilePicture: profile.profilePicture,
        favoriteCommunity: profile.favoriteCommunity.trim(),
        bio: profile.bio.trim(),
      }

      if (profile.id) {
        const response = await apiFetch(`/students/${profile.id}`, {
          method: 'PUT',
          body: JSON.stringify(payload),
        })

        if (response.status === 401) {
          showPopup('Your session has expired. Please sign in again.', 'error')
          navigate('/login')
          return
        }

        if (!response.ok) {
          const errorData = await response.json().catch(() => ({}))
          throw new Error(errorData.message || 'Failed to update profile in database')
        }

        const result = await response.json()
        const updatedStudent = result?.data
        if (updatedStudent) {
          localStorage.setItem('currentStudent', JSON.stringify(updatedStudent))
          window.dispatchEvent(new Event('student-profile-updated'))
        }
      } else {
        throw new Error('No student is logged in')
      }

      showPopup('Profile updated successfully.', 'success')
    } catch (err) {
      showPopup(err.message || 'Failed to update profile.', 'error')
    }
  }

  const handleDeleteAccount = async () => {
    if (!profile.id) {
      showPopup('No student account found to delete.', 'error')
      return
    }

    const confirmed = window.confirm(
      'Are you sure you want to delete your account? This action cannot be undone.',
    )

    if (!confirmed) return

    setDeleting(true)

    try {
      const response = await apiFetch(`/students/${profile.id}`, {
        method: 'DELETE',
      })

      if (response.status === 401) {
        showPopup('Your session has expired. Please sign in again.', 'error')
        navigate('/login')
        return
      }

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}))
        throw new Error(errorData.message || 'Failed to delete account')
      }

      clearAuthData()
      showPopup('Account deleted successfully.', 'success')
      navigate('/')
    } catch (err) {
      showPopup(err.message || 'Failed to delete account.', 'error')
    } finally {
      setDeleting(false)
    }
  }

  return (
    <main className="edit-profile-page">
      <section className="edit-profile-card">
        <div className="edit-profile-header">
          <p>Edit Profile</p>
          <h1>Manage Your Student Profile</h1>
          <span>Update your details to personalize your community experience.</span>
        </div>

        <div className="profile-picture-editor">
          {profileImage ? (
            <img src={profileImage} alt="Profile preview" className="profile-preview" />
          ) : (
            <div className="profile-preview profile-placeholder">
              {(profile.fullName.trim().charAt(0) || 'U').toUpperCase()}
            </div>
          )}
          <div className="profile-picture-actions">
            <label htmlFor="profileImage" className="upload-photo-btn">Upload Photo</label>
            <input
              id="profileImage"
              type="file"
              accept="image/*"
              onChange={handleImageChange}
            />
            <span className="image-name">{profileImageName}</span>
          </div>
        </div>

        <form className="edit-profile-form" onSubmit={handleSubmit}>
          <div className="edit-row">
            <div className="edit-group">
              <label htmlFor="fullName">Full Name</label>
              <input
                id="fullName"
                type="text"
                name="fullName"
                value={profile.fullName}
                onChange={handleChange}
                onBlur={() => {
                  setTouched((prev) => ({ ...prev, fullName: true }))
                  setFieldErrors((prev) => ({ ...prev, fullName: validateField('fullName', profile.fullName) }))
                }}
                className={fieldErrors.fullName && touched.fullName ? 'input-error' : ''}
                placeholder="John Doe"
                required
              />
              {fieldErrors.fullName && touched.fullName && <p className="field-error">{fieldErrors.fullName}</p>}
            </div>
            <div className="edit-group">
              <label htmlFor="itNumber">IT Number</label>
              <input
                id="itNumber"
                type="text"
                name="itNumber"
                value={profile.itNumber}
                onChange={handleChange}
                onBlur={() => {
                  setTouched((prev) => ({ ...prev, itNumber: true }))
                  setFieldErrors((prev) => ({ ...prev, itNumber: validateField('itNumber', profile.itNumber) }))
                }}
                className={fieldErrors.itNumber && touched.itNumber ? 'input-error' : ''}
                placeholder="IT21XXXXXX"
                required
              />
              {fieldErrors.itNumber && touched.itNumber && <p className="field-error">{fieldErrors.itNumber}</p>}
            </div>
          </div>

          <div className="edit-row">
            <div className="edit-group">
              <label htmlFor="email">Email</label>
              <input
                id="email"
                type="email"
                name="email"
                value={profile.email}
                onChange={handleChange}
                onBlur={() => {
                  setTouched((prev) => ({ ...prev, email: true }))
                  setFieldErrors((prev) => ({ ...prev, email: validateField('email', profile.email) }))
                }}
                className={fieldErrors.email && touched.email ? 'input-error' : ''}
                placeholder="student@email.com"
                required
              />
              {fieldErrors.email && touched.email && <p className="field-error">{fieldErrors.email}</p>}
            </div>
            <div className="edit-group">
              <label htmlFor="favoriteCommunity">Favorite Community</label>
              <input
                id="favoriteCommunity"
                type="text"
                name="favoriteCommunity"
                value={profile.favoriteCommunity}
                onChange={handleChange}
                onBlur={() => {
                  setTouched((prev) => ({ ...prev, favoriteCommunity: true }))
                  setFieldErrors((prev) => ({
                    ...prev,
                    favoriteCommunity: validateField('favoriteCommunity', profile.favoriteCommunity),
                  }))
                }}
                className={fieldErrors.favoriteCommunity && touched.favoriteCommunity ? 'input-error' : ''}
                placeholder="Cricket Club"
              />
              {fieldErrors.favoriteCommunity && touched.favoriteCommunity && (
                <p className="field-error">{fieldErrors.favoriteCommunity}</p>
              )}
            </div>
          </div>

          <div className="edit-group">
            <label htmlFor="bio">Bio</label>
            <textarea
              id="bio"
              name="bio"
              value={profile.bio}
              onChange={handleChange}
              onBlur={() => {
                setTouched((prev) => ({ ...prev, bio: true }))
                setFieldErrors((prev) => ({ ...prev, bio: validateField('bio', profile.bio) }))
              }}
              className={fieldErrors.bio && touched.bio ? 'input-error' : ''}
              placeholder="Tell us about yourself..."
              rows={4}
            />
            {fieldErrors.bio && touched.bio && <p className="field-error">{fieldErrors.bio}</p>}
          </div>

          <button type="submit" className="save-profile-btn">Save Changes</button>
          <button
            type="button"
            className="delete-account-btn"
            onClick={handleDeleteAccount}
            disabled={deleting}
          >
            {deleting ? 'Deleting Account...' : 'Delete Account'}
          </button>
          {fieldErrors.profilePicture && touched.profilePicture && (
            <p className="saved-message error-message">{fieldErrors.profilePicture}</p>
          )}
        </form>
      </section>
    </main>
  )
}

export default EditProfile
