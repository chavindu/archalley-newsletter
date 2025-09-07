import { useState, useEffect } from 'react'
import { GetServerSideProps } from 'next'
import { getSession } from 'next-auth/react'
import {
  EnvelopeIcon,
  MegaphoneIcon,
  UsersIcon,
  ChartBarIcon,
} from '@heroicons/react/24/outline'
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
    <div className="card p-6">
      <div className="flex items-center">
        <div className={`text-${color}-500 mr-4`}>
          {icon}
        </div>
        <div>
          <div className="text-3xl font-bold text-gray-900">
            {value}
          </div>
          <div className="text-sm text-gray-500">
            {title}
          </div>
        </div>
      </div>
    </div>
  )

  return (
    <ProtectedRoute>
      <Layout>
        <div>
          <h1 className="text-3xl font-bold text-gray-900 mb-2">
            Dashboard
          </h1>
          <p className="text-gray-600 mb-8">
            Welcome to Archalley Newsletter Management System
          </p>

          <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-4 mb-8">
            <StatCard
              title="Email Lists"
              value={stats.totalEmailLists}
              icon={<EnvelopeIcon className="h-8 w-8" />}
              color="primary"
            />
            <StatCard
              title="Active Subscribers"
              value={stats.totalSubscribers}
              icon={<UsersIcon className="h-8 w-8" />}
              color="green"
            />
            <StatCard
              title="Total Newsletters"
              value={stats.totalNewsletters}
              icon={<MegaphoneIcon className="h-8 w-8" />}
              color="blue"
            />
            <StatCard
              title="Sent Newsletters"
              value={stats.sentNewsletters}
              icon={<ChartBarIcon className="h-8 w-8" />}
              color="orange"
            />
          </div>

          <div className="card p-6">
            <h2 className="text-xl font-semibold text-gray-900 mb-4">
              Quick Start Guide
            </h2>
            <div className="space-y-3 text-gray-700">
              <p>1. Create email lists to organize your subscribers</p>
              <p>2. Import subscribers via CSV or add them manually</p>
              <p>3. Create newsletters by selecting blog posts from archalley.com</p>
              <p>4. Send newsletters to your selected email lists</p>
              <p>5. Track analytics to see how your newsletters perform</p>
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
