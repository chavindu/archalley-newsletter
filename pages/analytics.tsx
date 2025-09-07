import { useState, useEffect } from 'react'
import { GetServerSideProps } from 'next'
import { getSession } from 'next-auth/react'
import {
  Box,
  Card,
  CardContent,
  Typography,
  Grid,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Paper,
  Chip,
} from '@mui/material'
import {
  TrendingUp as TrendingUpIcon,
  Email as EmailIcon,
  Visibility as VisibilityIcon,
  TouchApp as ClickIcon,
} from '@mui/icons-material'
import Layout from '@/components/Layout'
import ProtectedRoute from '@/components/ProtectedRoute'
import { supabase } from '@/lib/supabase'

interface AnalyticsData {
  totalSent: number
  totalOpened: number
  totalClicked: number
  openRate: number
  clickRate: number
  recentNewsletters: Array<{
    id: string
    title: string
    sent_at: string
    total_sent: number
    total_opened: number
    total_clicked: number
    open_rate: number
    click_rate: number
  }>
}

export default function Analytics() {
  const [analytics, setAnalytics] = useState<AnalyticsData>({
    totalSent: 0,
    totalOpened: 0,
    totalClicked: 0,
    openRate: 0,
    clickRate: 0,
    recentNewsletters: [],
  })
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetchAnalytics()
  }, [])

  const fetchAnalytics = async () => {
    try {
      // Get overall stats
      const { data: totalStats, error: totalError } = await supabase
        .from('newsletter_analytics')
        .select('opened_at, clicked_at')

      if (totalError) throw totalError

      const totalSent = totalStats?.length || 0
      const totalOpened = totalStats?.filter(stat => stat.opened_at).length || 0
      const totalClicked = totalStats?.filter(stat => stat.clicked_at).length || 0

      // Get newsletter-specific stats
      const { data: newsletters, error: newslettersError } = await supabase
        .from('newsletters')
        .select(`
          id,
          title,
          sent_at,
          newsletter_analytics(opened_at, clicked_at)
        `)
        .eq('status', 'sent')
        .order('sent_at', { ascending: false })
        .limit(10)

      if (newslettersError) throw newslettersError

      const recentNewsletters = newsletters?.map(newsletter => {
        const analytics = newsletter.newsletter_analytics || []
        const sent = analytics.length
        const opened = analytics.filter((a: any) => a.opened_at).length
        const clicked = analytics.filter((a: any) => a.clicked_at).length

        return {
          id: newsletter.id,
          title: newsletter.title,
          sent_at: newsletter.sent_at,
          total_sent: sent,
          total_opened: opened,
          total_clicked: clicked,
          open_rate: sent > 0 ? (opened / sent) * 100 : 0,
          click_rate: sent > 0 ? (clicked / sent) * 100 : 0,
        }
      }) || []

      setAnalytics({
        totalSent,
        totalOpened,
        totalClicked,
        openRate: totalSent > 0 ? (totalOpened / totalSent) * 100 : 0,
        clickRate: totalSent > 0 ? (totalClicked / totalSent) * 100 : 0,
        recentNewsletters,
      })
    } catch (error) {
      console.error('Error fetching analytics:', error)
    } finally {
      setLoading(false)
    }
  }

  const StatCard = ({ 
    title, 
    value, 
    icon, 
    color, 
    suffix = '' 
  }: { 
    title: string
    value: number
    icon: React.ReactNode
    color: string
    suffix?: string
  }) => (
    <Card>
      <CardContent>
        <Box sx={{ display: 'flex', alignItems: 'center' }}>
          <Box sx={{ color, mr: 2 }}>
            {icon}
          </Box>
          <Box>
            <Typography variant="h4" component="div">
              {value.toLocaleString()}{suffix}
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
            Newsletter Analytics
          </Typography>
          <Typography variant="body1" color="text.secondary" gutterBottom>
            Track the performance of your newsletters
          </Typography>

          <Grid container spacing={3} sx={{ mt: 2 }}>
            <Grid item xs={12} sm={6} md={3}>
              <StatCard
                title="Total Emails Sent"
                value={analytics.totalSent}
                icon={<EmailIcon fontSize="large" />}
                color="#FFA500"
              />
            </Grid>
            <Grid item xs={12} sm={6} md={3}>
              <StatCard
                title="Total Opens"
                value={analytics.totalOpened}
                icon={<VisibilityIcon fontSize="large" />}
                color="#4caf50"
              />
            </Grid>
            <Grid item xs={12} sm={6} md={3}>
              <StatCard
                title="Total Clicks"
                value={analytics.totalClicked}
                icon={<ClickIcon fontSize="large" />}
                color="#2196f3"
              />
            </Grid>
            <Grid item xs={12} sm={6} md={3}>
              <StatCard
                title="Average Open Rate"
                value={Math.round(analytics.openRate)}
                icon={<TrendingUpIcon fontSize="large" />}
                color="#ff9800"
                suffix="%"
              />
            </Grid>
          </Grid>

          <Box sx={{ mt: 4 }}>
            <Card>
              <CardContent>
                <Typography variant="h6" gutterBottom>
                  Recent Newsletter Performance
                </Typography>
                <TableContainer component={Paper} variant="outlined">
                  <Table>
                    <TableHead>
                      <TableRow>
                        <TableCell>Newsletter</TableCell>
                        <TableCell align="right">Sent</TableCell>
                        <TableCell align="right">Opens</TableCell>
                        <TableCell align="right">Clicks</TableCell>
                        <TableCell align="right">Open Rate</TableCell>
                        <TableCell align="right">Click Rate</TableCell>
                        <TableCell align="right">Date Sent</TableCell>
                      </TableRow>
                    </TableHead>
                    <TableBody>
                      {loading ? (
                        <TableRow>
                          <TableCell colSpan={7} align="center">
                            Loading...
                          </TableCell>
                        </TableRow>
                      ) : analytics.recentNewsletters.length === 0 ? (
                        <TableRow>
                          <TableCell colSpan={7} align="center">
                            No newsletters sent yet
                          </TableCell>
                        </TableRow>
                      ) : (
                        analytics.recentNewsletters.map((newsletter) => (
                          <TableRow key={newsletter.id}>
                            <TableCell component="th" scope="row">
                              {newsletter.title}
                            </TableCell>
                            <TableCell align="right">
                              {newsletter.total_sent}
                            </TableCell>
                            <TableCell align="right">
                              {newsletter.total_opened}
                            </TableCell>
                            <TableCell align="right">
                              {newsletter.total_clicked}
                            </TableCell>
                            <TableCell align="right">
                              <Chip
                                label={`${Math.round(newsletter.open_rate)}%`}
                                size="small"
                                color={newsletter.open_rate > 20 ? 'success' : newsletter.open_rate > 10 ? 'warning' : 'default'}
                              />
                            </TableCell>
                            <TableCell align="right">
                              <Chip
                                label={`${Math.round(newsletter.click_rate)}%`}
                                size="small"
                                color={newsletter.click_rate > 5 ? 'success' : newsletter.click_rate > 2 ? 'warning' : 'default'}
                              />
                            </TableCell>
                            <TableCell align="right">
                              {newsletter.sent_at ? new Date(newsletter.sent_at).toLocaleDateString() : 'Not sent'}
                            </TableCell>
                          </TableRow>
                        ))
                      )}
                    </TableBody>
                  </Table>
                </TableContainer>
              </CardContent>
            </Card>
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
