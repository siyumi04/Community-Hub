import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import './EditProfile.css'
import { showPopup, showConfirm } from '../../utils/popup'
import { apiFetch, clearAuthData } from '../../services/apiClient'

const IT_NUMBER_PATTERN = /^IT\d{2}[A-Za-z0-9]{4,12}$/
const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
const FULL_NAME_PATTERN = /^[A-Za-z][A-Za-z.' -]{1,79}$/

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
    joinedCommunities: [],
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

  const saveProfilePictureToDb = async (compressedDataUrl) => {
    if (!profile.id) {
      throw new Error('No student is logged in')
    }

    const response = await apiFetch(`/students/${profile.id}/profile-picture`, {
      method: 'PATCH',
      body: JSON.stringify({ profilePicture: compressedDataUrl }),
    })

    if (response.status === 401 || response.status === 403) {
      clearAuthData()
      navigate('/login')
      throw new Error('Your session has expired. Please sign in again.')
    }

    if (!response.ok) {
      const errorData = await response.json().catch(() => null)
      const backendMessage = errorData?.message || errorData?.error || ''
      throw new Error(
        backendMessage
          ? `Profile image save failed (${response.status}): ${backendMessage}`
          : `Profile image save failed (${response.status})`
      )
    }

    const result = await response.json()
    const updatedStudent = result?.data

    if (updatedStudent) {
      localStorage.removeItem('currentAdmin')
      localStorage.setItem('currentStudent', JSON.stringify(updatedStudent))
      window.dispatchEvent(new Event('student-profile-updated'))
      window.dispatchEvent(new Event('admin-profile-updated'))
    }

    return updatedStudent
  }

  const validateField = (name, value) => {
    if (name === 'fullName') {
      const normalized = String(value).trim()
      if (!normalized) return 'Full name is required.'
      if (!FULL_NAME_PATTERN.test(normalized)) return 'Use 2-80 chars (letters, spaces, apostrophe, dot, hyphen).'
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
      if (!IT_NUMBER_PATTERN.test(normalized)) return 'Format should start with IT (example: IT21ABC123).'
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
          clearAuthData()
          navigate('/login')
          return
        }
        if (response.status === 403 || response.status === 404) {
          showPopup('Your account session is out of sync. Please sign in again.', 'error')
          clearAuthData()
          navigate('/login')
          return
        }
        if (!response.ok) {
          throw new Error('Could not retrieve profile from database')
        }

        const result = await response.json()
        const student = result?.data
        if (!student) return

        const resolvedProfilePicture = student.profilePicture || ''

        setProfile({
          id: student._id || student.id || '',
          fullName: student.name || '',
          email: student.email || '',
          itNumber: student.itNumber || '',
          favoriteCommunity: student.favoriteCommunity || '',
          bio: student.bio || '',
          profilePicture: resolvedProfilePicture,
          joinedCommunities: student.joinedCommunities || [],
        })

        if (resolvedProfilePicture) {
          setProfileImage(resolvedProfilePicture)
          setProfileImageName('Current profile picture')
        } else {
          setProfileImage('')
          setProfileImageName('No image selected')
        }

        const merged = {
          ...student,
          profilePicture: resolvedProfilePicture,
        }
        localStorage.setItem('currentStudent', JSON.stringify(merged))
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

    const resetPicker = () => {
      e.target.value = ''
    }

    if (!file.type.startsWith('image/')) {
      setFieldErrors((prev) => ({ ...prev, profilePicture: 'Please upload a valid image file.' }))
      setTouched((prev) => ({ ...prev, profilePicture: true }))
      showPopup('Please upload a valid image file.', 'error')
      resetPicker()
      return
    }

    // Large photos are compressed before save; keep a generous upper bound for source files.
    if (file.size > 8 * 1024 * 1024) {
      setFieldErrors((prev) => ({ ...prev, profilePicture: 'Profile image must be 8MB or smaller.' }))
      setTouched((prev) => ({ ...prev, profilePicture: true }))
      showPopup('Profile image must be 8MB or smaller.', 'error')
      resetPicker()
      return
    }

    const reader = new FileReader()

    reader.onerror = () => {
      setFieldErrors((prev) => ({ ...prev, profilePicture: 'Unable to read this image file.' }))
      setTouched((prev) => ({ ...prev, profilePicture: true }))
      showPopup('Unable to read this image file.', 'error')
      resetPicker()
    }

    reader.onloadend = () => {
      let imageDataUrl = typeof reader.result === 'string' ? reader.result : ''
      if (!imageDataUrl) return

      // Compress image before saving to DB
      const img = new Image()

      img.onerror = () => {
        setFieldErrors((prev) => ({ ...prev, profilePicture: 'Unsupported image format. Try JPG or PNG.' }))
        setTouched((prev) => ({ ...prev, profilePicture: true }))
        showPopup('Unsupported image format. Try JPG or PNG.', 'error')
        resetPicker()
      }

      img.onload = () => {
        const canvas = document.createElement('canvas')
        const maxWidth = 500
        const maxHeight = 500
        let width = img.width
        let height = img.height

        if (width > height) {
          if (width > maxWidth) {
            height *= maxWidth / width
            width = maxWidth
          }
        } else {
          if (height > maxHeight) {
            width *= maxHeight / height
            height = maxHeight
          }
        }

        canvas.width = width
        canvas.height = height
        const ctx = canvas.getContext('2d')
        if (!ctx) {
          setFieldErrors((prev) => ({ ...prev, profilePicture: 'Could not process image on this browser.' }))
          setTouched((prev) => ({ ...prev, profilePicture: true }))
          showPopup('Could not process image on this browser.', 'error')
          resetPicker()
          return
        }

        ctx.drawImage(img, 0, 0, width, height)

        // Compress to JPEG and keep payload safely below backend/body limits.
        let quality = 0.82
        let compressedDataUrl = canvas.toDataURL('image/jpeg', quality)
        const maxDataUrlLength = 900_000
        while (compressedDataUrl.length > maxDataUrlLength && quality > 0.5) {
          quality -= 0.08
          compressedDataUrl = canvas.toDataURL('image/jpeg', quality)
        }

        if (compressedDataUrl.length > maxDataUrlLength) {
          setFieldErrors((prev) => ({ ...prev, profilePicture: 'Image is too large after compression. Choose a smaller image.' }))
          setTouched((prev) => ({ ...prev, profilePicture: true }))
          showPopup('Image is too large after compression. Choose a smaller image.', 'error')
          resetPicker()
          return
        }
        
        ;(async () => {
          try {
            const updatedStudent = await saveProfilePictureToDb(compressedDataUrl)
            const savedProfilePicture = updatedStudent?.profilePicture || compressedDataUrl

            setProfileImage(savedProfilePicture)
            setProfileImageName(file.name)
            setProfile((prev) => ({ ...prev, profilePicture: savedProfilePicture }))
            setTouched((prev) => ({ ...prev, profilePicture: true }))
            setFieldErrors((prev) => ({ ...prev, profilePicture: '' }))
            showPopup('Profile image saved to database successfully.', 'success')
          } catch (error) {
            setFieldErrors((prev) => ({ ...prev, profilePicture: error.message || 'Failed to save profile image.' }))
            setTouched((prev) => ({ ...prev, profilePicture: true }))
            showPopup(error.message || 'Failed to save profile image.', 'error')
          }
        })()
      }
      img.src = imageDataUrl
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
    const resolvedProfilePicture = profileImage || profile.profilePicture || ''

    try {
      const payload = {
        name: fullName,
        email,
        itNumber,
        profilePicture: resolvedProfilePicture,
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
          clearAuthData()
          navigate('/login')
          return
        }
        if (response.status === 403 || response.status === 404) {
          showPopup('Your account session is out of sync. Please sign in again.', 'error')
          clearAuthData()
          navigate('/login')
          return
        }

        if (!response.ok) {
          const errorData = await response.json().catch(() => null)
          const backendMessage = errorData?.message || errorData?.error || ''
          throw new Error(
            backendMessage
              ? `Update failed (${response.status}): ${backendMessage}`
              : `Update failed (${response.status} ${response.statusText || 'Request Error'})`
          )
        }

        const result = await response.json()
        const updatedStudent = result?.data
        if (updatedStudent) {
          const merged = {
            ...updatedStudent,
            profilePicture: updatedStudent.profilePicture || '',
          }

          setProfile((prev) => ({
            ...prev,
            profilePicture: merged.profilePicture,
          }))
          setProfileImage(merged.profilePicture || '')
          setProfileImageName(merged.profilePicture ? 'Current profile picture' : 'No image selected')

          localStorage.removeItem('currentAdmin')
          localStorage.setItem('currentStudent', JSON.stringify(merged))
          window.dispatchEvent(new Event('student-profile-updated'))
          window.dispatchEvent(new Event('admin-profile-updated'))
        }
      } else {
        throw new Error('No student is logged in')
      }

      showPopup('Profile updated successfully.', 'success')
    } catch (err) {
      const fallbackMessage = err?.name === 'TypeError'
        ? 'Could not connect to server. Please check backend is running.'
        : 'Failed to update profile.'
      showPopup(err.message || fallbackMessage, 'error')
    }
  }

  const handleDeleteAccount = async () => {
    if (!profile.id) {
      showPopup('No student account found to delete.', 'error')
      return
    }

    const confirmed = await showConfirm({
      title: 'Delete Account?',
      text: 'This action cannot be undone. All your data will be permanently removed.',
      confirmText: 'Yes, Delete',
      cancelText: 'Cancel',
      icon: 'warning',
    })

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

          {/* Joined Communities Section - Read Only */}
          {profile.joinedCommunities && profile.joinedCommunities.length > 0 && (
            <div className="edit-group">
              <label>Joined Communities</label>
              <div className="joined-communities-container">
                {profile.joinedCommunities.map((community, index) => (
                  <div key={index} className="community-badge">
                    <div className="community-badge-header">
                      <span className="community-name">{community.communityName}</span>
                    </div>
                    <div className="community-badge-content">
                      <div className="badge-item">
                        <span className="badge-label">Member ID:</span>
                        <span className="badge-value">{community.memberId}</span>
                      </div>
                      <div className="badge-item">
                        <span className="badge-label">Year:</span>
                        <span className="badge-value">{community.year}</span>
                      </div>
                      <div className="badge-item">
                        <span className="badge-label">Joined:</span>
                        <span className="badge-value">
                          {new Date(community.joinedAt).toLocaleDateString()}
                        </span>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
              <p className="info-text">* Read-only. Your membership information cannot be edited.</p>
            </div>
          )}

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
