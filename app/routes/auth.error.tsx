import { AuthForm } from '~/components/auth/auth-form'
import { AuthCard } from '~/components/auth/auth-card'
import { AuthTitle } from '~/components/auth/auth-title'
import { AuthLink } from '~/components/auth/auth-link'
import { useSearchParams } from 'react-router'
import { secondaryTextClasses } from '~/lib/utils'

export default function Page() {
  const [searchParams] = useSearchParams()
  const error = searchParams?.get('error')

  return (
    <AuthForm>
      <AuthCard>
        <AuthTitle>Sorry, something went wrong.</AuthTitle>
        {error ? (
          <p className={`text-sm mb-6 ${secondaryTextClasses}`}>
            Code error: {error}
          </p>
        ) : (
          <p className={`text-sm mb-6 ${secondaryTextClasses}`}>
            An unspecified error occurred.
          </p>
        )}
        <div className="text-center">
          <AuthLink to="/login">Return to login</AuthLink>
        </div>
      </AuthCard>
    </AuthForm>
  )
}
