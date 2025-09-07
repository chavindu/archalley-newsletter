import { useRouter } from 'next/router'
import { Box, Button, Paper, Typography, Container, Alert } from '@mui/material'
import Link from 'next/link'

export default function AuthError() {
  const router = useRouter()
  const { error } = router.query

  const getErrorMessage = (error: string | string[] | undefined) => {
    if (error === 'AccessDenied') {
      return 'Access denied. You are not authorized to access this application. Please contact the administrator.'
    }
    return 'An error occurred during authentication. Please try again.'
  }

  return (
    <Container maxWidth="sm">
      <Box
        sx={{
          minHeight: '100vh',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
        }}
      >
        <Paper
          elevation={3}
          sx={{
            p: 4,
            width: '100%',
            textAlign: 'center',
          }}
        >
          <Typography variant="h4" component="h1" gutterBottom color="#FFA500">
            Archalley Newsletter
          </Typography>
          
          <Alert severity="error" sx={{ mb: 3 }}>
            {getErrorMessage(error)}
          </Alert>
          
          <Link href="/login" passHref>
            <Button
              variant="contained"
              sx={{
                backgroundColor: '#FFA500',
                '&:hover': {
                  backgroundColor: '#e69500',
                },
              }}
            >
              Try Again
            </Button>
          </Link>
        </Paper>
      </Box>
    </Container>
  )
}
