import { Link } from 'react-router'
import { cn, primaryHeadingClasses } from '~/lib/utils'

export function AuthLogo() {
  return (
    <Link
      to="/"
      className={cn(
        "absolute top-6 left-6 md:top-8 md:left-8",
        "text-xl md:text-2xl font-bold",
        primaryHeadingClasses,
        "hover:opacity-80 transition-opacity",
        "no-underline"
      )}
    >
      Video Clerk
    </Link>
  )
}
