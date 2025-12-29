import { Link } from 'react-router'
import { TvMinimalPlay } from 'lucide-react'
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
        "no-underline",
        "flex items-center gap-2"
      )}
    >
      <TvMinimalPlay className="h-5 w-5 md:h-6 md:w-6 text-indigo-500 dark:text-indigo-400" />
      Video Clerk
    </Link>
  )
}
