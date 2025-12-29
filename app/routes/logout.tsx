import { createClient } from '~/lib/supabase/client'
import { useEffect } from 'react'
import { useNavigate } from 'react-router'

export default function Logout() {
  const navigate = useNavigate()

  useEffect(() => {
    const supabase = createClient()
    supabase.auth.signOut().then(({ error }) => {
      if (error) {
        console.error(error)
      }
      navigate('/')
    });
  }, [navigate])

  return null
}
