import { ReactNode, useEffect } from 'react'
import { useSession } from 'next-auth/react'
import { useRouter } from 'next/router'
import { Box, CircularProgress } from '@mui/material'

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
      <Box
        sx={{
          display: 'flex',
          justifyContent: 'center',
          alignItems: 'center',
          minHeight: '100vh',
        }}
      >
        <CircularProgress />
      </Box>
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
