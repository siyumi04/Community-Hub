import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { COMMUNITY_FORM_FIELDS } from '../utils/constants';

const JoinForm = ({ communityId, communityName, onClose, onSuccess }) => {
  const navigate = useNavigate();

  // Common fields state
  const [fullName, setFullName] = useState('');
  const [studentId, setStudentId] = useState('');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [year, setYear] = useState('');
  const [whyJoin, setWhyJoin] = useState('');

  // Unique fields state
  const [uniqueFields, setUniqueFields] = useState({});

  // Touched fields for error display
  const [touched, setTouched] = useState({});

  // Success popup state
  const [showSuccess, setShowSuccess] = useState(false);

  // Get community-specific config
  const communityConfig = COMMUNITY_FORM_FIELDS[communityId] || {};
  const uniqueFieldsList = communityConfig.uniqueFields || [];

  // Validation functions
  const validateFullName = (value) => {
    return /^[a-zA-Z\s]{3,}$/.test(value);
  };

  const validateStudentId = (value) => {
    return /^(IT|EN|BS|HS)\d{8}$/i.test(value);
  };

  const getStudentIdPrefix = (value) => {
    const match = value.match(/^([a-z]{2})/i);
    return match ? match[1].toUpperCase() : '';
  };



  const validateEmail = (value, studentIdValue = studentId) => {
    const prefix = getStudentIdPrefix(studentIdValue).toLowerCase();
    const pattern = `^[^\s@]+@my\\.sliit\\.lk$`;
    const baseValid = new RegExp(pattern).test(value);
    
    if (!baseValid) return false;
    
    // Check if email starts with the same prefix as student ID
    if (studentIdValue) {
      return value.toLowerCase().startsWith(prefix);
    }
    return true;
  };

  const validatePhone = (value) => {
    return /^\d{10}$/.test(value);
  };

  const validateMinLength = (value, min) => {
    return value.trim().length >= min;
  };

  // Field-level validation
  const isFieldValid = (fieldName, value) => {
    if (!touched[fieldName]) return null; // Show nothing if not touched

    switch (fieldName) {
      case 'fullName':
        return validateFullName(value) ? true : false;
      case 'studentId':
        return validateStudentId(value) ? true : false;
      case 'email':
        return validateEmail(value, studentId) ? true : false;
      case 'phone':
        return validatePhone(value) ? true : false;
      case 'year':
        return value ? true : false;
      case 'whyJoin':
        // Optional field - always valid
        return true;
      default:
        return uniqueFields[fieldName] ? true : false;
    }
  };

  // Check if entire form is valid
  const isFormValid = () => {
    const uniqueFieldsValid = uniqueFieldsList.every(
      (field) => uniqueFields[field.name] && uniqueFields[field.name].trim() !== ''
    );
    return (
      validateFullName(fullName) &&
      validateStudentId(studentId) &&
      validateEmail(email, studentId) &&
      validatePhone(phone) &&
      year &&
      uniqueFieldsValid
    );
  };

  const handleUniqueFieldChange = (fieldName, value) => {
    setUniqueFields((prev) => ({ ...prev, [fieldName]: value }));
    setTouched((prev) => ({ ...prev, [fieldName]: true }));
  };

  const handleBlur = (fieldName) => {
    setTouched((prev) => ({ ...prev, [fieldName]: true }));
  };

  const handleStudentIdChange = (value) => {
    const uppercaseValue = value.toUpperCase();
    setStudentId(uppercaseValue);
  };

  const handleSubmit = (e) => {
    e.preventDefault();

    // Mark all fields as touched to show errors
    setTouched({
      fullName: true,
      studentId: true,
      email: true,
      phone: true,
      year: true,
      whyJoin: true,
      ...Object.fromEntries(
        uniqueFieldsList.map((f) => [f.name, true])
      ),
    });

    // Validate all
    if (!isFormValid()) return;

    // Prepare submission data
    const formData = {
      communityId,
      fullName,
      studentId,
      email,
      phone,
      year,
      whyJoin,
      ...uniqueFields,
    };

    console.log('✅ Form submitted:', formData);
    // TODO: Replace with API call later

    // Show success popup, then navigate after delay
    setShowSuccess(true);
    setTimeout(() => {
      setShowSuccess(false);
      navigate(`/communities/${communityId}/member`);
    }, 2500);
  };

  return (
    <>
      {/* Backdrop */}
      <div
        className="fixed inset-0 bg-black/60 backdrop-blur-md z-[110]"
        onClick={onClose}
      />

      {/* Modal */}
      <div className="fixed inset-0 z-[120] flex items-center justify-center p-4">
        <div
          className="rounded-2xl shadow-2xl max-w-2xl w-full max-h-[90vh] flex flex-col border-[3px] border-indigo-400"
          style={{
            background: 'rgba(15, 23, 42, 0.55)',
            backdropFilter: 'blur(18px)',
            WebkitBackdropFilter: 'blur(18px)',
          }}
        >

          {/* Header */}
          <div className="relative flex justify-center items-center p-6 border-b border-white/20">
            <h2 className="text-2xl font-bold text-white text-center">
              Join {communityName}
            </h2>
            <button
              onClick={() => onClose(false)}
              className="text-white/60 hover:text-white text-2xl transition absolute right-6"
            >
              ✕
            </button>
          </div>

          {/* Form Content */}
          <form
            onSubmit={handleSubmit}
            className="overflow-y-auto flex-1 p-8 pt-12"
          >
            {/* 2-Column Grid for Common Fields */}
            <div className="grid grid-cols-2 gap-5 mb-8">

            {/* Full Name */}
            <div>
              <label className="block text-center text-sm font-semibold text-white/90 mb-2">
                Full Name *
              </label>
              <input
                type="text"
                value={fullName}
                onChange={(e) => setFullName(e.target.value)}
                onBlur={() => handleBlur('fullName')}
                placeholder="e.g. John Doe"
                className={`w-full px-4 py-2 border-2 rounded-lg focus:outline-none transition backdrop-blur-sm ${
                  fullName ? 'text-white not-italic' : ''
                } ${
                  isFieldValid('fullName', fullName) === true
                    ? 'border-green-500'
                    : isFieldValid('fullName', fullName) === false
                    ? 'border-red-500'
                    : 'border-white/20'
                }`}
                style={{
                  background: 'rgba(30, 41, 59, 0.3)',
                  backdropFilter: 'blur(8px)',
                  WebkitBackdropFilter: 'blur(8px)',
                  fontStyle: fullName ? 'normal' : 'italic',
                  color: fullName ? '#f1f5f9' : '#cbd5e1',
                }}
              />
              {isFieldValid('fullName', fullName) === false && (
                <p className="text-red-500 text-sm mt-1">
                  Full name must be at least 3 letters (letters only)
                </p>
              )}
            </div>

            {/* Student ID */}
            <div>
              <label className="block text-center text-sm font-semibold text-white/90 mb-2">
                Student ID *
              </label>
              <input
                type="text"
                value={studentId}
                onChange={(e) => handleStudentIdChange(e.target.value)}
                onBlur={() => handleBlur('studentId')}
                placeholder="e.g. IT21123456"
                maxLength="10"
                className={`w-full px-4 py-2 border-2 rounded-lg focus:outline-none transition backdrop-blur-sm ${
                  studentId ? 'text-white not-italic' : ''
                } ${
                  isFieldValid('studentId', studentId) === true
                    ? 'border-green-500'
                    : isFieldValid('studentId', studentId) === false
                    ? 'border-red-500'
                    : 'border-white/20'
                }`}
                style={{
                  background: 'rgba(30, 41, 59, 0.3)',
                  backdropFilter: 'blur(8px)',
                  WebkitBackdropFilter: 'blur(8px)',
                  fontStyle: studentId ? 'normal' : 'italic',
                  color: studentId ? '#f1f5f9' : '#cbd5e1',
                }}
              />
              {isFieldValid('studentId', studentId) === false && (
                <p className="text-red-500 text-sm mt-1">
                  Format: IT/EN/BS/HS + 8 digits (10 chars total)
                </p>
              )}
            </div>

            {/* Email */}
            <div>
              <label className="block text-center text-sm font-semibold text-white/90 mb-2">
                Email (SLIIT) *
              </label>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                onBlur={() => handleBlur('email')}
                placeholder={studentId ? `${getStudentIdPrefix(studentId).toLowerCase()}21xxxxxx@my.sliit.lk` : "e.g. it21xxxxxx@my.sliit.lk"}
                className={`w-full px-4 py-2 border-2 rounded-lg focus:outline-none transition backdrop-blur-sm ${
                  email ? 'text-white not-italic' : ''
                } ${
                  isFieldValid('email', email) === true
                    ? 'border-green-500'
                    : isFieldValid('email', email) === false
                    ? 'border-red-500'
                    : 'border-white/20'
                }`}
                style={{
                  background: 'rgba(30, 41, 59, 0.3)',
                  backdropFilter: 'blur(8px)',
                  WebkitBackdropFilter: 'blur(8px)',
                  fontStyle: email ? 'normal' : 'italic',
                  color: email ? '#f1f5f9' : '#cbd5e1',
                }}
              />
              {isFieldValid('email', email) === false && (
                <p className="text-red-500 text-sm mt-1">
                  Must match ID prefix and end with @my.sliit.lk
                </p>
              )}
            </div>

            {/* Phone */}
            <div>
              <label className="block text-center text-sm font-semibold text-white/90 mb-2">
                Phone Number *
              </label>
              <input
                type="tel"
                value={phone}
                onChange={(e) => setPhone(e.target.value.replace(/\D/g, ''))}
                onBlur={() => handleBlur('phone')}
                placeholder="e.g. 0701234567"
                maxLength="10"
                className={`w-full px-4 py-2 border-2 rounded-lg focus:outline-none transition backdrop-blur-sm ${
                  phone ? 'text-white not-italic' : ''
                } ${
                  isFieldValid('phone', phone) === true
                    ? 'border-green-500'
                    : isFieldValid('phone', phone) === false
                    ? 'border-red-500'
                    : 'border-white/20'
                }`}
                style={{
                  background: 'rgba(30, 41, 59, 0.3)',
                  backdropFilter: 'blur(8px)',
                  WebkitBackdropFilter: 'blur(8px)',
                  fontStyle: phone ? 'normal' : 'italic',
                  color: phone ? '#f1f5f9' : '#cbd5e1',
                }}
              />
              {isFieldValid('phone', phone) === false && (
                <p className="text-red-500 text-sm mt-1">
                  Exactly 10 digits
                </p>
              )}
            </div>

            {/* Year of Study */}
            <div className="col-span-2">
              <label className="block text-center text-sm font-semibold text-white/90 mb-2">
                Year of Study *
              </label>
              <select
                value={year}
                onChange={(e) => setYear(e.target.value)}
                onBlur={() => handleBlur('year')}
                className={`w-full px-4 py-2 border-2 rounded-lg focus:outline-none transition backdrop-blur-sm ${
                  year ? 'text-white' : 'text-white/50'
                } ${
                  isFieldValid('year', year) === true
                    ? 'border-green-500'
                    : isFieldValid('year', year) === false
                    ? 'border-red-500'
                    : 'border-white/20'
                }`}
                style={{
                  background: 'rgba(30, 41, 59, 0.6)',
                  backdropFilter: 'blur(8px)',
                  WebkitBackdropFilter: 'blur(8px)',
                  color: year ? '#f1f5f9' : '#cbd5e1',
                }}
              >
                <option value="" style={{ background: '#1e293b', color: '#cbd5e1' }}>Select Year</option>
                <option value="Year 1" style={{ background: '#1e293b', color: '#f1f5f9' }}>Year 1</option>
                <option value="Year 2" style={{ background: '#1e293b', color: '#f1f5f9' }}>Year 2</option>
                <option value="Year 3" style={{ background: '#1e293b', color: '#f1f5f9' }}>Year 3</option>
                <option value="Year 4" style={{ background: '#1e293b', color: '#f1f5f9' }}>Year 4</option>
              </select>
              {isFieldValid('year', year) === false && (
                <p className="text-red-500 text-sm mt-1">
                  Please select year
                </p>
              )}
            </div>

            </div>

            {/* Why Join (Optional, Full Width) */}
            <div className="mb-8 col-span-2">
              <label className="block text-center text-sm font-semibold text-white/90 mb-2">
                Why do you want to join? (Optional)
              </label>
              <textarea
                value={whyJoin}
                onChange={(e) => setWhyJoin(e.target.value)}
                onBlur={() => handleBlur('whyJoin')}
                placeholder="Tell us why you're interested in joining this community..."
                rows="4"
                className={`w-full px-4 py-2 border-2 rounded-lg focus:outline-none transition resize-none backdrop-blur-sm ${
                  whyJoin ? 'text-white not-italic' : ''
                } ${
                  isFieldValid('whyJoin', whyJoin) === true
                    ? 'border-green-500'
                    : isFieldValid('whyJoin', whyJoin) === false
                    ? 'border-red-500'
                    : 'border-white/20'
                }`}
                style={{
                  background: 'rgba(30, 41, 59, 0.3)',
                  backdropFilter: 'blur(8px)',
                  WebkitBackdropFilter: 'blur(8px)',
                  fontStyle: whyJoin ? 'normal' : 'italic',
                  color: whyJoin ? '#f1f5f9' : '#cbd5e1',
                }}
              />
            </div>

            {/* UNIQUE COMMUNITY FIELDS */}
            <div className="col-span-2">

            {uniqueFieldsList.map((field) => {
              const fieldValue = uniqueFields[field.name] || '';
              const isValid = isFieldValid(field.name, fieldValue);

              return (
                <div key={field.name} className="mb-6">
                  {field.type === 'dropdown' && (
                    <>
                      <label className="block text-center text-sm font-semibold text-white/90 mb-2">
                        {field.label} *
                      </label>
                      <select
                        value={fieldValue}
                        onChange={(e) =>
                          handleUniqueFieldChange(field.name, e.target.value)
                        }
                        onBlur={() => handleBlur(field.name)}
                        className={`w-full px-4 py-2 border-2 rounded-lg focus:outline-none transition backdrop-blur-sm ${
                          fieldValue ? 'text-white' : 'text-white/50'
                        } ${
                          isValid === true
                            ? 'border-green-500'
                            : isValid === false
                            ? 'border-red-500'
                            : 'border-white/20'
                        }`}
                        style={{
                          background: 'rgba(30, 41, 59, 0.6)',
                          backdropFilter: 'blur(8px)',
                          WebkitBackdropFilter: 'blur(8px)',
                          color: fieldValue ? '#f1f5f9' : '#cbd5e1',
                        }}
                      >
                        <option value="" style={{ background: '#1e293b', color: '#cbd5e1' }}>Select {field.label}</option>
                        {field.options.map((opt) => (
                          <option key={opt} value={opt} style={{ background: '#1e293b', color: '#f1f5f9' }}>
                            {opt}
                          </option>
                        ))}
                      </select>
                      {isValid === false && (
                        <p className="text-red-500 text-sm mt-1">
                          Please select an option
                        </p>
                      )}
                    </>
                  )}

                  {field.type === 'radio' && (
                    <>
                      <label className="block text-center text-sm font-semibold text-white/90 mb-2">
                        {field.label} *
                      </label>
                      <div className="flex gap-4">
                        {field.options.map((opt) => (
                          <label
                            key={opt}
                            className={`flex items-center gap-2 cursor-pointer transition ${
                              fieldValue === opt ? 'text-white' : 'text-white/50'
                            }`}
                          >
                            <input
                              type="radio"
                              name={field.name}
                              value={opt}
                              checked={fieldValue === opt}
                              onChange={(e) =>
                                handleUniqueFieldChange(field.name, e.target.value)
                              }
                              onBlur={() => handleBlur(field.name)}
                              className="w-4 h-4"
                              style={{
                                accentColor: fieldValue === opt ? '#1e293b' : '#d1d5db',
                              }}
                            />
                            <span>{opt}</span>
                          </label>
                        ))}
                      </div>
                      {isValid === false && (
                        <p className="text-red-500 text-sm mt-1">
                          Please select an option
                        </p>
                      )}
                    </>
                  )}

                  {field.type === 'textarea' && (
                    <>
                      <label className="block text-center text-sm font-semibold text-white/90 mb-2">
                        {field.label} (min 15 characters) *
                      </label>
                      <textarea
                        value={fieldValue}
                        onChange={(e) =>
                          handleUniqueFieldChange(field.name, e.target.value)
                        }
                        onBlur={() => handleBlur(field.name)}
                        placeholder={field.placeholder || ''}
                        rows="3"
                        className={`w-full px-4 py-2 border-2 rounded-lg focus:outline-none transition resize-none backdrop-blur-sm ${
                          fieldValue ? 'text-white not-italic' : ''
                        } ${
                          isValid === true
                            ? 'border-green-500'
                            : isValid === false
                            ? 'border-red-500'
                            : 'border-white/20'
                        }`}
                        style={{
                          background: 'rgba(30, 41, 59, 0.3)',
                          backdropFilter: 'blur(8px)',
                          WebkitBackdropFilter: 'blur(8px)',
                          fontStyle: fieldValue ? 'normal' : 'italic',
                          color: fieldValue ? '#f1f5f9' : '#cbd5e1',
                        }}
                      />
                      {isValid === false && (
                        <p className="text-red-500 text-sm mt-1">
                          Please enter at least 15 characters
                        </p>
                      )}
                    </>
                  )}

                  {field.type === 'text' && (
                    <>
                      <label className="block text-center text-sm font-semibold text-white/90 mb-2">
                        {field.label} *
                      </label>
                      <input
                        type="text"
                        value={fieldValue}
                        onChange={(e) =>
                          handleUniqueFieldChange(field.name, e.target.value)
                        }
                        onBlur={() => handleBlur(field.name)}
                        placeholder={field.placeholder || ''}
                        className={`w-full px-4 py-2 border-2 rounded-lg focus:outline-none transition backdrop-blur-sm ${
                          fieldValue ? 'text-white not-italic' : ''
                        } ${
                          isValid === true
                            ? 'border-green-500'
                            : isValid === false
                            ? 'border-red-500'
                            : 'border-white/20'
                        }`}
                        style={{
                          background: 'rgba(30, 41, 59, 0.3)',
                          backdropFilter: 'blur(8px)',
                          WebkitBackdropFilter: 'blur(8px)',
                          fontStyle: fieldValue ? 'normal' : 'italic',
                          color: fieldValue ? '#f1f5f9' : '#cbd5e1',
                        }}
                      />
                      {isValid === false && (
                        <p className="text-red-500 text-sm mt-1">
                          This field is required
                        </p>
                      )}
                    </>
                  )}
                </div>
              );
            })}
            </div>
          </form>

          {/* Footer */}
          <div className="border-t border-white/20 p-6 flex gap-3">
            <button
              onClick={() => onClose(false)}
              className="flex-1 px-4 py-2 border-2 border-white/30 text-white/80 rounded-lg font-semibold hover:bg-white/10 transition"
            >
              Cancel
            </button>
            <button
              onClick={handleSubmit}
              className="flex-1 px-4 py-2 bg-indigo-600 text-white rounded-lg font-semibold hover:bg-indigo-500 transition"
            >
              Submit Request
            </button>
          </div>
        </div>
      </div>

      {/* Success Popup */}
      {showSuccess && (
        <div className="fixed inset-0 z-[200] flex items-center justify-center">
          <div
            className="bg-white rounded-2xl shadow-2xl px-12 py-10 flex flex-col items-center gap-4 border-2 border-green-200"
            style={{
              animation: 'successPop 0.4s cubic-bezier(0.175, 0.885, 0.32, 1.275)',
            }}
          >
            {/* Animated checkmark circle */}
            <div
              className="w-20 h-20 rounded-full bg-green-100 flex items-center justify-center border-4 border-green-400"
              style={{ animation: 'successBounce 0.5s ease 0.2s both' }}
            >
              <svg
                className="w-10 h-10 text-green-500"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
                style={{ animation: 'checkDraw 0.4s ease 0.4s both' }}
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={3}
                  d="M5 13l4 4L19 7"
                />
              </svg>
            </div>

            {/* Text */}
            <div className="text-center">
              <h3 className="text-2xl font-bold text-slate-800 mb-1">
                Request Submitted!
              </h3>
              <p className="text-slate-500 text-sm">
                Your request to join <span className="font-semibold text-indigo-600">{communityName}</span> has been sent.
              </p>
              <p className="text-slate-400 text-xs mt-2">Redirecting you now...</p>
            </div>

            {/* Progress bar */}
            <div className="w-48 h-1.5 bg-slate-100 rounded-full overflow-hidden mt-2">
              <div
                className="h-full bg-green-400 rounded-full"
                style={{ animation: 'progressBar 2.5s linear forwards' }}
              />
            </div>
          </div>
        </div>
      )}

      {/* Keyframe styles */}
      <style>{`
        @keyframes successPop {
          from { opacity: 0; transform: scale(0.7); }
          to   { opacity: 1; transform: scale(1); }
        }
        @keyframes successBounce {
          0%   { transform: scale(0); opacity: 0; }
          60%  { transform: scale(1.2); }
          100% { transform: scale(1); opacity: 1; }
        }
        @keyframes checkDraw {
          from { opacity: 0; transform: scale(0.5); }
          to   { opacity: 1; transform: scale(1); }
        }
        @keyframes progressBar {
          from { width: 0%; }
          to   { width: 100%; }
        }
      `}</style>
    </>
  );
};

export default JoinForm;