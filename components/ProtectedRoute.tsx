import { ReactNode, useEffect } from 'react'
import { useSession } from 'next-auth/react'
import { useRouter } from 'next/router'

interface ProtectedRouteProps {
  children: ReactNode
  requireSuperAdmin?: boolean
}

export default function ProtectedRoute({ children, requireSuperAdmin = false }: ProtectedRouteProps) {
  const { data: session, status } = useSession()
  const router = useRouter()

  useEffect(() => {
    if (status === 'loading') return // Still loading

    if (!session) {
      router.push('/login')
      return
    }

    if (requireSuperAdmin && session.user.role !== 'superadmin') {
      router.push('/dashboard')
      return
    }
  }, [session, status, router, requireSuperAdmin])

  if (status === 'loading') {
    return (
      <div className="flex justify-center items-center min-h-screen">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary-500"></div>
      </div>
    )
  }

  if (!session) {
    return null
  }

  if (requireSuperAdmin && session.user.role !== 'superadmin') {
    return null
  }

  return <>{children}</>
}
