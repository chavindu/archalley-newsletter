import { GetServerSideProps } from 'next'
import { getSession, signIn } from 'next-auth/react'
import { Box, Button, Paper, Typography, Container } from '@mui/material'
import GoogleIcon from '@mui/icons-material/Google'

export default function Login() {
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
          <Typography variant="h6" component="h2" gutterBottom>
            Admin Portal
          </Typography>
          <Typography variant="body1" sx={{ mb: 4 }}>
            Sign in to manage newsletters and email lists
          </Typography>
          
          <Button
            variant="contained"
            size="large"
            startIcon={<GoogleIcon />}
            onClick={() => signIn('google', { callbackUrl: '/dashboard' })}
            sx={{
              backgroundColor: '#FFA500',
              '&:hover': {
                backgroundColor: '#e69500',
              },
              py: 1.5,
              px: 3,
            }}
          >
            Sign in with Google
          </Button>
        </Paper>
      </Box>
    </Container>
  )
}

export const getServerSideProps: GetServerSideProps = async (context) => {
  const session = await getSession(context)

  if (session) {
    return {
      redirect: {
        destination: '/dashboard',
        permanent: false,
      },
    }
  }

  return {
    props: {},
  }
}
