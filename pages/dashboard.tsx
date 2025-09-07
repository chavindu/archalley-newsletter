import { useState, useEffect } from 'react'
import { GetServerSideProps } from 'next'
import { getSession } from 'next-auth/react'
import {
  Box,
  Card,
  CardContent,
  Typography,
  Grid,
  Paper,
} from '@mui/material'
import {
  Email as EmailIcon,
  Campaign as CampaignIcon,
  People as PeopleIcon,
  TrendingUp as TrendingUpIcon,
} from '@mui/icons-material'
import Layout from '@/components/Layout'
import ProtectedRoute from '@/components/ProtectedRoute'
import { supabase } from '@/lib/supabase'

interface DashboardStats {
  totalEmailLists: number
  totalSubscribers: number
  totalNewsletters: number
  sentNewsletters: number
}

export default function Dashboard() {
  const [stats, setStats] = useState<DashboardStats>({
    totalEmailLists: 0,
    totalSubscribers: 0,
    totalNewsletters: 0,
    sentNewsletters: 0,
  })

  useEffect(() => {
    fetchStats()
  }, [])

  const fetchStats = async () => {
    try {
      const [emailListsResult, subscribersResult, newslettersResult, sentNewslettersResult] = await Promise.all([
        supabase.from('email_lists').select('id', { count: 'exact' }),
        supabase.from('subscribers').select('id', { count: 'exact' }).eq('status', 'active'),
        supabase.from('newsletters').select('id', { count: 'exact' }),
        supabase.from('newsletters').select('id', { count: 'exact' }).eq('status', 'sent'),
      ])

      setStats({
        totalEmailLists: emailListsResult.count || 0,
        totalSubscribers: subscribersResult.count || 0,
        totalNewsletters: newslettersResult.count || 0,
        sentNewsletters: sentNewslettersResult.count || 0,
      })
    } catch (error) {
      console.error('Error fetching stats:', error)
    }
  }

  const StatCard = ({ title, value, icon, color }: { title: string; value: number; icon: React.ReactNode; color: string }) => (
    <Card>
      <CardContent>
        <Box sx={{ display: 'flex', alignItems: 'center' }}>
          <Box sx={{ color, mr: 2 }}>
            {icon}
          </Box>
          <Box>
            <Typography variant="h4" component="div">
              {value}
            </Typography>
            <Typography variant="body2" color="text.secondary">
              {title}
            </Typography>
          </Box>
        </Box>
      </CardContent>
    </Card>
  )

  return (
    <ProtectedRoute>
      <Layout>
        <Box>
          <Typography variant="h4" component="h1" gutterBottom>
            Dashboard
          </Typography>
          <Typography variant="body1" color="text.secondary" gutterBottom>
            Welcome to Archalley Newsletter Management System
          </Typography>

          <Grid container spacing={3} sx={{ mt: 2 }}>
            <Grid item xs={12} sm={6} md={3}>
              <StatCard
                title="Email Lists"
                value={stats.totalEmailLists}
                icon={<EmailIcon fontSize="large" />}
                color="#FFA500"
              />
            </Grid>
            <Grid item xs={12} sm={6} md={3}>
              <StatCard
                title="Active Subscribers"
                value={stats.totalSubscribers}
                icon={<PeopleIcon fontSize="large" />}
                color="#4caf50"
              />
            </Grid>
            <Grid item xs={12} sm={6} md={3}>
              <StatCard
                title="Total Newsletters"
                value={stats.totalNewsletters}
                icon={<CampaignIcon fontSize="large" />}
                color="#2196f3"
              />
            </Grid>
            <Grid item xs={12} sm={6} md={3}>
              <StatCard
                title="Sent Newsletters"
                value={stats.sentNewsletters}
                icon={<TrendingUpIcon fontSize="large" />}
                color="#ff9800"
              />
            </Grid>
          </Grid>

          <Box sx={{ mt: 4 }}>
            <Paper sx={{ p: 3 }}>
              <Typography variant="h6" gutterBottom>
                Quick Start Guide
              </Typography>
              <Typography variant="body1" paragraph>
                1. Create email lists to organize your subscribers
              </Typography>
              <Typography variant="body1" paragraph>
                2. Import subscribers via CSV or add them manually
              </Typography>
              <Typography variant="body1" paragraph>
                3. Create newsletters by selecting blog posts from archalley.com
              </Typography>
              <Typography variant="body1" paragraph>
                4. Send newsletters to your selected email lists
              </Typography>
              <Typography variant="body1">
                5. Track analytics to see how your newsletters perform
              </Typography>
            </Paper>
          </Box>
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
