import { createClient } from '~/lib/supabase/client'
import { AuthForm } from '~/components/auth/auth-form'
import { AuthCard } from '~/components/auth/auth-card'
import { AuthTitle } from '~/components/auth/auth-title'
import { AuthDescription } from '~/components/auth/auth-description'
import { AuthInput } from '~/components/auth/auth-input'
import { AuthButton } from '~/components/auth/auth-button'
import { AuthLink } from '~/components/auth/auth-link'
import { AuthError } from '~/components/auth/auth-error'
import { useSearchParams } from 'react-router'
import { useState } from 'react'
import type { FormEvent } from 'react'
import { secondaryTextClasses } from '~/lib/utils'

export default function ForgotPassword() {
  const [searchParams, setSearchParams] = useSearchParams()
  const [email, setEmail] = useState('')
  const [error, setError] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)

  const success = !!searchParams.has('success')

  const handleSubmit = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    setLoading(true)
    setError(null)

    const supabase = createClient()
    const origin = window.location.origin

    const { error } = await supabase.auth.resetPasswordForEmail(email, {
      redirectTo: `${origin}/auth/confirm?next=/update-password`,
    })

    if (error) {
      setError(error.message)
      setLoading(false)
    } else {
      setSearchParams({ success: 'true' })
      setLoading(false)
    }
  }

  return (
    <AuthForm>
      <AuthCard>
        {success ? (
          <>
            <AuthTitle>Check Your Email</AuthTitle>
            <AuthDescription>Password reset instructions sent</AuthDescription>
            <p className={`text-sm ${secondaryTextClasses}`}>
              If you registered using your email and password, you will receive a password reset
              email.
            </p>
          </>
        ) : (
          <>
            <AuthTitle>Reset Your Password</AuthTitle>
            <AuthDescription>
              Type in your email and we&apos;ll send you a link to reset your password
            </AuthDescription>
            <form onSubmit={handleSubmit}>
              <AuthInput
                label="Email"
                type="email"
                placeholder="me@example.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
              />
              <AuthError message={error} />
              <AuthButton type="submit" fullWidth disabled={loading}>
                {loading ? 'Sending...' : 'Send reset email'}
              </AuthButton>
              <div className="mt-6 text-center text-sm text-zinc-600 dark:text-zinc-400">
                Already have an account? <AuthLink to="/login">Login</AuthLink>
              </div>
            </form>
          </>
        )}
      </AuthCard>
    </AuthForm>
  )
}
