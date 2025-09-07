import { useState } from 'react'
import { GetServerSideProps } from 'next'
import { getSession } from 'next-auth/react'
import {
  Box,
  Button,
  Card,
  CardContent,
  Typography,
  TextField,
  Alert,
  CircularProgress,
} from '@mui/material'
import Layout from '@/components/Layout'
import ProtectedRoute from '@/components/ProtectedRoute'

export default function TestEmail() {
  const [email, setEmail] = useState('')
  const [loading, setLoading] = useState(false)
  const [result, setResult] = useState<any>(null)

  const testEmail = async () => {
    if (!email) {
      setResult({ success: false, error: 'Please enter an email address' })
      return
    }

    setLoading(true)
    setResult(null)

    try {
      const response = await fetch('/api/test-smtp', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ to: email }),
      })

      const data = await response.json()
      setResult(data)
    } catch (error) {
      setResult({ success: false, error: 'Network error' })
    } finally {
      setLoading(false)
    }
  }

  return (
    <ProtectedRoute>
      <Layout>
        <Box>
          <Typography variant="h4" component="h1" gutterBottom>
            Test Email Sending
          </Typography>
          <Typography variant="body1" color="text.secondary" gutterBottom>
            Test the SMTP configuration and email sending functionality
          </Typography>

          <Card sx={{ mt: 3, maxWidth: 600 }}>
            <CardContent>
              <Typography variant="h6" gutterBottom>
                Send Test Email
              </Typography>
              <TextField
                fullWidth
                label="Email Address"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="Enter email address to test"
                sx={{ mb: 2 }}
              />
              <Button
                variant="contained"
                onClick={testEmail}
                disabled={loading}
                startIcon={loading ? <CircularProgress size={20} /> : null}
              >
                {loading ? 'Sending...' : 'Send Test Email'}
              </Button>

              {result && (
                <Box sx={{ mt: 2 }}>
                  {result.success ? (
                    <Alert severity="success">
                      <Typography variant="body2">
                        <strong>Success!</strong> Test email sent successfully.
                      </Typography>
                      {result.messageId && (
                        <Typography variant="caption" display="block">
                          Message ID: {result.messageId}
                        </Typography>
                      )}
                    </Alert>
                  ) : (
                    <Alert severity="error">
                      <Typography variant="body2">
                        <strong>Error:</strong> {result.error}
                      </Typography>
                      {result.details && (
                        <Typography variant="caption" display="block">
                          Details: {JSON.stringify(result.details)}
                        </Typography>
                      )}
                    </Alert>
                  )}
                </Box>
              )}
            </CardContent>
          </Card>

          <Card sx={{ mt: 3 }}>
            <CardContent>
              <Typography variant="h6" gutterBottom>
                Troubleshooting Steps
              </Typography>
              <Typography variant="body2" component="div">
                <ol>
                  <li>Check your <code>.env.local</code> file has correct SMTP credentials</li>
                  <li>Verify the SMTP server settings are correct</li>
                  <li>Test with a simple email address first</li>
                  <li>Check the server console for detailed error messages</li>
                  <li>Ensure your email provider allows SMTP connections</li>
                </ol>
              </Typography>
            </CardContent>
          </Card>
        </Box>
      </Layout>
    </ProtectedRoute>
  )
}

export const getServerSideProps: GetServerSideProps = async (context) => {
  const session = await getSession(context)

  if (!session) {
    return {
      redirect: {
        destination: '/login',
        permanent: false,
      },
    }
  }

  return {
    props: {},
  }
}
