import { createClient } from '~/lib/supabase/client'
import { AuthForm } from '~/components/auth/auth-form'
import { AuthCard } from '~/components/auth/auth-card'
import { AuthTitle } from '~/components/auth/auth-title'
import { AuthDescription } from '~/components/auth/auth-description'
import { AuthInput } from '~/components/auth/auth-input'
import { AuthButton } from '~/components/auth/auth-button'
import { AuthLink } from '~/components/auth/auth-link'
import { AuthError } from '~/components/auth/auth-error'
import { useNavigate, useSearchParams } from 'react-router'
import { useState } from 'react'
import type { FormEvent } from 'react'

export default function Login() {
  const navigate = useNavigate()
  const [searchParams] = useSearchParams()
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)

  const handleSubmit = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    setLoading(true)
    setError(null)

    const supabase = createClient()
    const { error } = await supabase.auth.signInWithPassword({
      email,
      password,
    })

    if (error) {
      setError(error.message)
      setLoading(false)
    } else {
      // Redirect to returnTo query parameter or default to '/app'
      const returnTo = searchParams.get('returnTo') || '/app'
      // Ensure the returnTo path starts with '/' for security
      const redirectPath = returnTo.startsWith('/') ? returnTo : '/app'
      navigate(redirectPath)
    }
  }

  return (
    <AuthForm>
      <AuthCard>
        <AuthTitle>Login</AuthTitle>
        <AuthDescription>Enter your email below to login to your account</AuthDescription>
        <form onSubmit={handleSubmit}>
          <AuthInput
            label="Email"
            type="email"
            placeholder="me@example.com"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
          />
          <div className="mb-4">
            <div className="flex items-center justify-between mb-2">
              <label
                htmlFor="password"
                className="block text-sm font-medium text-zinc-700 dark:text-zinc-300"
              >
                Password
              </label>
              <AuthLink to="/forgot-password" className="text-sm">
                Forgot your password?
              </AuthLink>
            </div>
            <AuthInput
              id="password"
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
            />
          </div>
          <AuthError message={error} />
          <AuthButton type="submit" fullWidth disabled={loading}>
            {loading ? 'Logging in...' : 'Login'}
          </AuthButton>
        </form>
      </AuthCard>
    </AuthForm>
  )
}
