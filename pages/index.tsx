import { useState } from 'react'
import { GetServerSideProps } from 'next'
import { getSession } from 'next-auth/react'
import { 
  Container, 
  Box, 
  Paper, 
  Typography, 
  TextField, 
  Button, 
  Alert,
  CircularProgress,
  Grid
} from '@mui/material'
import { Email as EmailIcon, Send as SendIcon } from '@mui/icons-material'

export default function Home() {
  const [email, setEmail] = useState('')
  const [loading, setLoading] = useState(false)
  const [message, setMessage] = useState<{ type: 'success' | 'error', text: string } | null>(null)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    
    if (!email) {
      setMessage({ type: 'error', text: 'Please enter your email address' })
      return
    }

    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      setMessage({ type: 'error', text: 'Please enter a valid email address' })
      return
    }

    setLoading(true)
    setMessage(null)

    try {
      const response = await fetch('/api/subscribe', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          email,
          emailListId: 'c37db908-6b50-4dc2-8c80-0dd92bd72bb0',
        }),
      })

      const data = await response.json()

      if (response.ok) {
        if (data.status === 'already_subscribed') {
          setMessage({ type: 'error', text: 'You are already subscribed to our newsletter' })
        } else {
          setMessage({ type: 'success', text: data.message })
          setEmail('')
        }
      } else {
        setMessage({ type: 'error', text: data.message })
      }
    } catch (error) {
      setMessage({ type: 'error', text: 'Something went wrong. Please try again.' })
    } finally {
      setLoading(false)
    }
  }


  return (
    <Container maxWidth="md">
      <Box
        sx={{
          minHeight: '100vh',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          py: 4,
        }}
      >
        <Paper
          elevation={3}
          sx={{
            p: 4,
            width: '100%',
            textAlign: 'center',
            borderRadius: 2,
          }}
        >
          <Box sx={{ mb: 4 }}>
            <Typography 
              variant="h3" 
              component="h1" 
              gutterBottom 
              sx={{ 
                color: '#FFA500',
                fontWeight: 'bold',
                mb: 2
              }}
            >
              Archalley Newsletter
            </Typography>
            <Typography 
              variant="h5" 
              component="h2" 
              gutterBottom
              sx={{ 
                color: '#666',
                mb: 3
              }}
            >
              Stay Updated with the Latest News
            </Typography>
            <Typography 
              variant="body1" 
              sx={{ 
                color: '#888',
                maxWidth: '600px',
                mx: 'auto',
                lineHeight: 1.6
              }}
            >
              Subscribe to our newsletter and never miss important updates, 
              announcements, and exclusive content from Archalley.
            </Typography>
          </Box>

          <Box component="form" onSubmit={handleSubmit} sx={{ maxWidth: '500px', mx: 'auto' }}>
            <Grid container spacing={2}>
              <Grid item xs={12}>
                <TextField
                  fullWidth
                  type="email"
                  label="Email Address"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="Enter your email address"
                  variant="outlined"
                  InputProps={{
                    startAdornment: <EmailIcon sx={{ mr: 1, color: '#FFA500' }} />,
                  }}
                  sx={{
                    '& .MuiOutlinedInput-root': {
                      '&.Mui-focused fieldset': {
                        borderColor: '#FFA500',
                      },
                    },
                    '& .MuiInputLabel-root.Mui-focused': {
                      color: '#FFA500',
                    },
                  }}
                />
              </Grid>

              <Grid item xs={12}>
                <Button
                  type="submit"
                  variant="contained"
                  size="large"
                  fullWidth
                  disabled={loading}
                  startIcon={loading ? <CircularProgress size={20} /> : <SendIcon />}
                  sx={{
                    backgroundColor: '#FFA500',
                    '&:hover': {
                      backgroundColor: '#e69500',
                    },
                    py: 1.5,
                    fontSize: '1.1rem',
                    fontWeight: 'bold',
                  }}
                >
                  {loading ? 'Subscribing...' : 'Subscribe Now'}
                </Button>
              </Grid>
            </Grid>

            {message && (
              <Box sx={{ mt: 3 }}>
                <Alert 
                  severity={message.type} 
                  sx={{ 
                    textAlign: 'left',
                    '& .MuiAlert-icon': {
                      color: message.type === 'success' ? '#4caf50' : '#f44336'
                    }
                  }}
                >
                  {message.text}
                </Alert>
              </Box>
            )}
          </Box>

          <Box sx={{ mt: 4, pt: 3, borderTop: '1px solid #eee' }}>
            <Typography variant="body2" color="text.secondary">
              By subscribing, you agree to receive our newsletter. You can unsubscribe at any time.
            </Typography>
          </Box>
        </Paper>
      </Box>
    </Container>
  )
}

export const getServerSideProps: GetServerSideProps = async (context) => {
  const session = await getSession(context)

  // If user is logged in, redirect to dashboard
  if (session) {
    return {
      redirect: {
        destination: '/dashboard',
        permanent: false,
      },
    }
  }

  // Allow public access to homepage for subscription
  return {
    props: {},
  }
}
