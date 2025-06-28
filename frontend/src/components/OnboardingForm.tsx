import { useState, useEffect } from 'react'
import { useAuth } from '../hooks'
import { useNavigate } from 'react-router'
import { createUser, type CreateUserRequest } from '../services/users'
import { getAllSkills, type Skill } from '../services/skills'

interface OnboardingData {
  first_name: string
  last_name: string
  birthdate: string
  gender: 'M' | 'F' | 'O'
  linkedin_url: string
  skills_to_teach: string[]
  skills_to_learn: string[]
}

interface ValidationErrors {
  first_name?: string
  last_name?: string
  birthdate?: string
  gender?: string
  linkedin_url?: string
  skills?: string
}

export const OnboardingForm = () => {
  const { refreshUserProfile } = useAuth()
  const navigate = useNavigate()
  const [formData, setFormData] = useState<OnboardingData>({
    first_name: '',
    last_name: '',
    birthdate: '',
    gender: 'M',
    linkedin_url: '',
    skills_to_teach: [],
    skills_to_learn: []
  })
  const [availableSkills, setAvailableSkills] = useState<Skill[]>([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState(false)
  const [skillsLoading, setSkillsLoading] = useState(true)
  const [validationErrors, setValidationErrors] = useState<ValidationErrors>({})
  const [touched, setTouched] = useState<Record<string, boolean>>({})

  // Fetch available skills on component mount
  useEffect(() => {
    const fetchSkills = async () => {
      try {
        const skills = await getAllSkills()
        setAvailableSkills(skills)
      } catch (err) {
        console.error('Failed to fetch skills:', err)
        setError('Failed to load skills. Please refresh the page.')
      } finally {
        setSkillsLoading(false)
      }
    }

    fetchSkills()
  }, [])

  const validateField = (name: string, value: string | string[]) => {
    const errors: ValidationErrors = {}

    switch (name) {
      case 'first_name':
        if (!value || (typeof value === 'string' && value.trim().length < 2)) {
          errors.first_name = 'First name must be at least 2 characters long'
        }
        break
      
      case 'last_name':
        if (!value || (typeof value === 'string' && value.trim().length < 2)) {
          errors.last_name = 'Last name must be at least 2 characters long'
        }
        break
      
      case 'birthdate':
        if (!value) {
          errors.birthdate = 'Birthdate is required'
        } else if (typeof value === 'string') {
          const today = new Date()
          const birthDate = new Date(value)
          let age = today.getFullYear() - birthDate.getFullYear()
          const monthDiff = today.getMonth() - birthDate.getMonth()
          
          if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birthDate.getDate())) {
            age--
          }
          
          if (birthDate > today) {
            errors.birthdate = 'Birthdate cannot be in the future'
          } else if (age <= 0) {
            errors.birthdate = 'You must be at least 1 year old'
          } else if (age > 120) {
            errors.birthdate = 'Please enter a valid birthdate'
          }
        }
        break
      

      
      case 'linkedin_url':
        if (!value || (typeof value === 'string' && value.trim() === '')) {
          errors.linkedin_url = 'LinkedIn URL is required'
        } else if (typeof value === 'string') {
          const linkedinPattern = /^https?:\/\/(www\.)?linkedin\.com\/in\/[a-zA-Z0-9-]+\/?$/
          if (!linkedinPattern.test(value.trim())) {
            errors.linkedin_url = 'Please enter a valid LinkedIn profile URL'
          }
        }
        break
    }

    return errors
  }

  const validateForm = () => {
    let allErrors: ValidationErrors = {}

    // Validate all fields
    Object.keys(formData).forEach(key => {
      const fieldErrors = validateField(key, formData[key as keyof OnboardingData])
      allErrors = { ...allErrors, ...fieldErrors }
    })

    // Validate that user has selected at least one skill to teach or learn
    if (formData.skills_to_teach.length === 0 && formData.skills_to_learn.length === 0) {
      allErrors.skills = 'Please select at least one skill to teach or learn'
    }

    setValidationErrors(allErrors)
    return Object.keys(allErrors).length === 0
  }

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value } = e.target
    setFormData(prev => ({
      ...prev,
      [name]: value
    }))

    // Mark field as touched
    setTouched(prev => ({ ...prev, [name]: true }))

    // Validate field in real-time if it's been touched
    if (touched[name]) {
      const fieldErrors = validateField(name, value)
      setValidationErrors(prev => ({
        ...prev,
        ...fieldErrors,
        // Clear error if field is now valid
        ...(Object.keys(fieldErrors).length === 0 && { [name]: undefined })
      }))
    }
  }

  const handleSkillToggle = (skillName: string, skillType: 'teach' | 'learn') => {
    const fieldName = skillType === 'teach' ? 'skills_to_teach' : 'skills_to_learn'
    
    setFormData(prev => {
      const currentSkills = prev[fieldName]
      const isSelected = currentSkills.includes(skillName)
      
      const newData = {
        ...prev,
        [fieldName]: isSelected 
          ? currentSkills.filter(s => s !== skillName)
          : [...currentSkills, skillName]
      }

      // Clear skills validation error if user has now selected skills
      if (newData.skills_to_teach.length > 0 || newData.skills_to_learn.length > 0) {
        setValidationErrors(prev => ({ ...prev, skills: undefined }))
      }

      return newData
    })

    // Mark skills as touched
    setTouched(prev => ({ ...prev, skills: true }))
  }

  const handleBlur = (e: React.FocusEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value } = e.target
    setTouched(prev => ({ ...prev, [name]: true }))
    
    // Validate field on blur
    const fieldErrors = validateField(name, value)
    setValidationErrors(prev => ({
      ...prev,
      ...fieldErrors,
      // Clear error if field is now valid
      ...(Object.keys(fieldErrors).length === 0 && { [name]: undefined })
    }))
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    
    // Mark all fields as touched
    const allFields = Object.keys(formData).reduce((acc, key) => ({ ...acc, [key]: true }), {})
    setTouched({ ...allFields, skills: true })

    // Validate entire form
    if (!validateForm()) {
      setError('Please fix the validation errors before submitting')
      return
    }

    setLoading(true)
    setError(null)

    try {
      // Convert form data to API request format
      const userData: CreateUserRequest = {
        first_name: formData.first_name.trim(),
        last_name: formData.last_name.trim(),
        birthdate: formData.birthdate,
        gender: formData.gender,
        linkedin_url: formData.linkedin_url.trim(),
        skills_to_teach: formData.skills_to_teach.length > 0 ? formData.skills_to_teach : undefined,
        skills_to_learn: formData.skills_to_learn.length > 0 ? formData.skills_to_learn : undefined
      }

      const data = await createUser(userData)

      setSuccess(true)
      console.log('✅ User created successfully:', data)
      
      if (data.linkedin_job_queued) {
        console.log('📊 LinkedIn data extraction job queued')
      }

      // Refresh user profile to get updated onboarding status
      await refreshUserProfile()
      
      navigate('/')

    } catch (err: any) {
      // Handle axios errors
      const errorMessage = err.response?.data?.error || err.message || 'An unexpected error occurred'
      setError(errorMessage)
    } finally {
      setLoading(false)
    }
  }

  const isFormValid = Object.keys(validationErrors).every(key => !validationErrors[key as keyof ValidationErrors])

  return (
    <div className="min-h-screen flex items-center justify-center bg-base-200 p-4">
      <div className="card w-full max-w-2xl bg-base-100 shadow-xl">
        <div className="card-body">
          <h2 className="card-title justify-center text-2xl font-bold">
            Complete Your Profile
          </h2>
          
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="form-control">
              <label className="label">
                <span className="label-text">First Name</span>
              </label>
              <input
                type="text"
                name="first_name"
                placeholder="Enter your first name"
                className={`input input-bordered ${touched.first_name && validationErrors.first_name ? 'input-error' : ''}`}
                value={formData.first_name}
                onChange={handleInputChange}
                onBlur={handleBlur}
                required
              />
              {touched.first_name && validationErrors.first_name && (
                <label className="label">
                  <span className="label-text-alt text-error">{validationErrors.first_name}</span>
                </label>
              )}
            </div>
            
            <div className="form-control">
              <label className="label">
                <span className="label-text">Last Name</span>
              </label>
              <input
                type="text"
                name="last_name"
                placeholder="Enter your last name"
                className={`input input-bordered ${touched.last_name && validationErrors.last_name ? 'input-error' : ''}`}
                value={formData.last_name}
                onChange={handleInputChange}
                onBlur={handleBlur}
                required
              />
              {touched.last_name && validationErrors.last_name && (
                <label className="label">
                  <span className="label-text-alt text-error">{validationErrors.last_name}</span>
                </label>
              )}
            </div>

            <div className="form-control">
              <label className="label">
                <span className="label-text">Birthdate</span>
              </label>
              <input
                type="date"
                name="birthdate"
                className={`input input-bordered ${touched.birthdate && validationErrors.birthdate ? 'input-error' : ''}`}
                value={formData.birthdate}
                onChange={handleInputChange}
                onBlur={handleBlur}
                required
              />
              {touched.birthdate && validationErrors.birthdate && (
                <label className="label">
                  <span className="label-text-alt text-error">{validationErrors.birthdate}</span>
                </label>
              )}
            </div>

            <div className="form-control">
              <label className="label">
                <span className="label-text">Gender</span>
              </label>
              <select
                name="gender"
                className="select select-bordered"
                value={formData.gender}
                onChange={handleInputChange}
                required
              >
                <option value="M">Male</option>
                <option value="F">Female</option>
                <option value="O">Other</option>
              </select>
            </div>



            <div className="form-control">
              <label className="label">
                <span className="label-text">LinkedIn URL</span>
              </label>
              <input
                type="url"
                name="linkedin_url"
                placeholder="https://linkedin.com/in/your-profile"
                className={`input input-bordered ${touched.linkedin_url && validationErrors.linkedin_url ? 'input-error' : ''}`}
                value={formData.linkedin_url}
                onChange={handleInputChange}
                onBlur={handleBlur}
                required
              />
              {touched.linkedin_url && validationErrors.linkedin_url && (
                <label className="label">
                  <span className="label-text-alt text-error">{validationErrors.linkedin_url}</span>
                </label>
              )}
            </div>

            {/* Skills to Teach */}
            <div className="form-control">
              <label className="label">
                <span className="label-text">Skills I can teach</span>
              </label>
              {skillsLoading ? (
                <div className="flex justify-center p-4">
                  <span className="loading loading-spinner loading-md"></span>
                </div>
              ) : (
                <div className={`grid grid-cols-2 gap-2 max-h-40 overflow-y-auto border rounded-lg p-3 ${touched.skills && validationErrors.skills ? 'border-error' : ''}`}>
                  {availableSkills.map((skill) => (
                    <label key={skill.id} className="cursor-pointer label justify-start">
                      <input
                        type="checkbox"
                        className="checkbox checkbox-sm mr-2"
                        checked={formData.skills_to_teach.includes(skill.name)}
                        onChange={() => handleSkillToggle(skill.name, 'teach')}
                      />
                      <span className="label-text text-sm">{skill.name}</span>
                    </label>
                  ))}
                </div>
              )}
            </div>

            {/* Skills to Learn */}
            <div className="form-control">
              <label className="label">
                <span className="label-text">Skills I want to learn</span>
              </label>
              {skillsLoading ? (
                <div className="flex justify-center p-4">
                  <span className="loading loading-spinner loading-md"></span>
                </div>
              ) : (
                <div className={`grid grid-cols-2 gap-2 max-h-40 overflow-y-auto border rounded-lg p-3 ${touched.skills && validationErrors.skills ? 'border-error' : ''}`}>
                  {availableSkills.map((skill) => (
                    <label key={skill.id} className="cursor-pointer label justify-start">
                      <input
                        type="checkbox"
                        className="checkbox checkbox-sm mr-2"
                        checked={formData.skills_to_learn.includes(skill.name)}
                        onChange={() => handleSkillToggle(skill.name, 'learn')}
                      />
                      <span className="label-text text-sm">{skill.name}</span>
                    </label>
                  ))}
                </div>
              )}
              {touched.skills && validationErrors.skills && (
                <label className="label">
                  <span className="label-text-alt text-error">{validationErrors.skills}</span>
                </label>
              )}
            </div>

            {error && (
              <div className="alert alert-error">
                <span>{error}</span>
              </div>
            )}

            {success && (
              <div className="alert alert-success">
                <span>Profile created successfully!</span>
              </div>
            )}

            <div className="form-control mt-6">
              <button 
                type="submit" 
                className={`btn btn-primary ${loading ? 'loading' : ''}`}
                disabled={loading || success || !isFormValid}
              >
                {loading ? 'Creating Profile...' : 'Complete Profile'}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  )
} 