import { useState, useEffect } from 'react'
import { GetServerSideProps } from 'next'
import { getSession } from 'next-auth/react'
import {
  EnvelopeIcon,
  EyeIcon,
  CursorArrowRaysIcon,
  ChartBarIcon,
} from '@heroicons/react/24/outline'
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
    <div className="card p-6">
      <div className="flex items-center">
        <div className={`text-${color}-500 mr-4`}>
          {icon}
        </div>
        <div>
          <div className="text-3xl font-bold text-gray-900">
            {value.toLocaleString()}{suffix}
          </div>
          <div className="text-sm text-gray-500">
            {title}
          </div>
        </div>
      </div>
    </div>
  )

  const getRateColor = (rate: number, type: 'open' | 'click') => {
    if (type === 'open') {
      return rate > 20 ? 'bg-green-100 text-green-800' : rate > 10 ? 'bg-yellow-100 text-yellow-800' : 'bg-gray-100 text-gray-800'
    } else {
      return rate > 5 ? 'bg-green-100 text-green-800' : rate > 2 ? 'bg-yellow-100 text-yellow-800' : 'bg-gray-100 text-gray-800'
    }
  }

  return (
    <ProtectedRoute>
      <Layout>
        <div>
          <h1 className="text-3xl font-bold text-gray-900 mb-2">
            Newsletter Analytics
          </h1>
          <p className="text-gray-600 mb-8">
            Track the performance of your newsletters
          </p>

          <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-4 mb-8">
            <StatCard
              title="Total Emails Sent"
              value={analytics.totalSent}
              icon={<EnvelopeIcon className="h-8 w-8" />}
              color="primary"
            />
            <StatCard
              title="Total Opens"
              value={analytics.totalOpened}
              icon={<EyeIcon className="h-8 w-8" />}
              color="green"
            />
            <StatCard
              title="Total Clicks"
              value={analytics.totalClicked}
              icon={<CursorArrowRaysIcon className="h-8 w-8" />}
              color="blue"
            />
            <StatCard
              title="Average Open Rate"
              value={Math.round(analytics.openRate)}
              icon={<ChartBarIcon className="h-8 w-8" />}
              color="orange"
              suffix="%"
            />
          </div>

          <div className="card p-6">
            <h2 className="text-xl font-semibold text-gray-900 mb-6">
              Recent Newsletter Performance
            </h2>
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Newsletter
                    </th>
                    <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Sent
                    </th>
                    <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Opens
                    </th>
                    <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Clicks
                    </th>
                    <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Open Rate
                    </th>
                    <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Click Rate
                    </th>
                    <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Date Sent
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {loading ? (
                    <tr>
                      <td colSpan={7} className="px-6 py-4 text-center text-gray-500">
                        Loading...
                      </td>
                    </tr>
                  ) : analytics.recentNewsletters.length === 0 ? (
                    <tr>
                      <td colSpan={7} className="px-6 py-4 text-center text-gray-500">
                        No newsletters sent yet
                      </td>
                    </tr>
                  ) : (
                    analytics.recentNewsletters.map((newsletter) => (
                      <tr key={newsletter.id}>
                        <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                          {newsletter.title}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 text-right">
                          {newsletter.total_sent}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 text-right">
                          {newsletter.total_opened}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 text-right">
                          {newsletter.total_clicked}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-right">
                          <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${getRateColor(newsletter.open_rate, 'open')}`}>
                            {Math.round(newsletter.open_rate)}%
                          </span>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-right">
                          <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${getRateColor(newsletter.click_rate, 'click')}`}>
                            {Math.round(newsletter.click_rate)}%
                          </span>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 text-right">
                          {newsletter.sent_at ? new Date(newsletter.sent_at).toLocaleDateString() : 'Not sent'}
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
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