import { createClient } from '~/lib/supabase/client'
import { AuthForm } from '~/components/auth/auth-form'
import { AuthCard } from '~/components/auth/auth-card'
import { AuthTitle } from '~/components/auth/auth-title'
import { AuthDescription } from '~/components/auth/auth-description'
import { AuthInput } from '~/components/auth/auth-input'
import { AuthButton } from '~/components/auth/auth-button'
import { AuthError } from '~/components/auth/auth-error'
import { useNavigate } from 'react-router'
import { useState } from 'react'
import type { FormEvent } from 'react'

export default function Page() {
  const navigate = useNavigate()
  const [password, setPassword] = useState('')
  const [error, setError] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)

  const handleSubmit = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    setLoading(true)
    setError(null)

    if (!password) {
      setError('Password is required')
      setLoading(false)
      return
    }

    const supabase = createClient()
    const { error } = await supabase.auth.updateUser({ password: password })

    if (error) {
      setError(error.message)
      setLoading(false)
    } else {
      navigate('/app/settings')
    }
  }

  return (
    <AuthForm>
      <AuthCard>
        <AuthTitle>Reset Your Password</AuthTitle>
        <AuthDescription>Please enter your new password below.</AuthDescription>
        <form onSubmit={handleSubmit}>
          <AuthInput
            label="New password"
            type="password"
            placeholder="New password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
          />
          <AuthError message={error} />
          <AuthButton type="submit" fullWidth disabled={loading}>
            {loading ? 'Saving...' : 'Save new password'}
          </AuthButton>
        </form>
      </AuthCard>
    </AuthForm>
  )
}
