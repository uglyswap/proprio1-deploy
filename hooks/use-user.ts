import { useSession } from 'next-auth/react'
import { useEffect, useState } from 'react'

export interface UserData {
  id: string
  email: string
  name: string | null
  image: string | null
}

export function useUser() {
  const { data: session, status } = useSession()
  const [user, setUser] = useState<UserData | null>(null)

  useEffect(() => {
    if (session?.user) {
      setUser({
        id: session.user.id,
        email: session.user.email!,
        name: session.user.name,
        image: session.user.image,
      })
    } else {
      setUser(null)
    }
  }, [session])

  return {
    user,
    isLoading: status === 'loading',
    isAuthenticated: !!session,
  }
}
