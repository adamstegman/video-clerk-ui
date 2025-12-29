import { createClient } from '~/lib/supabase/client'
import { type EmailOtpType } from '@supabase/supabase-js'
import { useEffect, useState } from 'react'
import { useNavigate, useSearchParams } from 'react-router'
import { AuthForm } from '~/components/auth/auth-form'
import { AuthCard } from '~/components/auth/auth-card'
import { AuthTitle } from '~/components/auth/auth-title'
import { secondaryTextClasses } from '~/lib/utils'

export default function Page() {
  const [searchParams] = useSearchParams()
  const navigate = useNavigate()
  const [verifying, setVerifying] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    const token_hash = searchParams.get('token_hash')
    const type = searchParams.get('type') as EmailOtpType | null
    const next = searchParams.get('next') || '/app/settings'

    if (token_hash && type) {
      const supabase = createClient()
      supabase.auth
        .verifyOtp({
          type: type || 'email',
          token_hash,
        })
        .then(({ error }) => {
          if (error) {
            setError(error.message)
            navigate(`/auth/error?error=${encodeURIComponent(error.message)}`)
          } else {
            // Clear URL params and redirect
            window.history.replaceState({}, document.title, next)
            navigate(next)
          }
          setVerifying(false)
        })
    } else {
      setError('No token hash or type')
      navigate(`/auth/error?error=${encodeURIComponent('No token hash or type')}`)
      setVerifying(false)
    }
  }, [searchParams, navigate])

  if (verifying) {
    return (
      <AuthForm>
        <AuthCard>
          <AuthTitle>Authentication</AuthTitle>
          <p className={`text-sm ${secondaryTextClasses}`}>Confirming your magic link...</p>
        </AuthCard>
      </AuthForm>
    )
  }

  return null
}
