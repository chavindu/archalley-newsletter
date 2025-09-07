import { ReactNode, useState } from 'react'
import { useSession, signOut } from 'next-auth/react'
import {
  Bars3Icon,
  HomeIcon,
  EnvelopeIcon,
  MegaphoneIcon,
  UsersIcon,
  ChartBarIcon,
  Cog6ToothIcon,
  NewspaperIcon,
  AtSymbolIcon,
} from '@heroicons/react/24/outline'
import Link from 'next/link'
import { useRouter } from 'next/router'

interface LayoutProps {
  children: ReactNode
}

export default function Layout({ children }: LayoutProps) {
  const { data: session } = useSession()
  const router = useRouter()
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false)
  const [userMenuOpen, setUserMenuOpen] = useState(false)

  const handleSignOut = () => {
    signOut({ callbackUrl: '/' })
    setUserMenuOpen(false)
  }

  const menuItems = [
    { text: 'Dashboard', icon: HomeIcon, href: '/dashboard' },
    { text: 'Email Lists', icon: EnvelopeIcon, href: '/email-lists' },
    { text: 'Newsletters', icon: MegaphoneIcon, href: '/newsletters' },
    { text: 'WordPress Posts', icon: NewspaperIcon, href: '/wordpress-posts' },
    { text: 'WordPress Emails', icon: AtSymbolIcon, href: '/wordpress-emails' },
    { text: 'Analytics', icon: ChartBarIcon, href: '/analytics' },
  ]

  if (session?.user.role === 'superadmin') {
    menuItems.push({ text: 'Users', icon: UsersIcon, href: '/users' })
  }

  const getPageTitle = () => {
    switch (router.pathname) {
      case '/dashboard':
        return 'Dashboard'
      case '/email-lists':
        return 'Email Lists'
      case '/newsletters':
        return 'Newsletters'
      case '/wordpress-posts':
        return 'WordPress Posts'
      case '/wordpress-emails':
        return 'WordPress Emails'
      case '/analytics':
        return 'Analytics'
      case '/users':
        return 'Users'
      default:
        return 'Archalley Newsletter'
    }
  }

  return (
    <div className="flex h-screen bg-gray-50">
      {/* Mobile menu */}
      <div className={`fixed inset-0 z-50 lg:hidden ${mobileMenuOpen ? 'block' : 'hidden'}`}>
        <div className="fixed inset-0 bg-gray-600 bg-opacity-75" onClick={() => setMobileMenuOpen(false)} />
        <div className="fixed inset-y-0 left-0 flex w-64 flex-col bg-white shadow-xl">
          <div className="flex h-16 items-center justify-between px-4">
            <h1 className="text-xl font-semibold text-primary-500">Archalley Newsletter</h1>
            <button
              onClick={() => setMobileMenuOpen(false)}
              className="text-gray-400 hover:text-gray-600"
            >
              <Bars3Icon className="h-6 w-6" />
            </button>
          </div>
          <nav className="flex-1 px-4 py-4">
            <ul className="space-y-2">
              {menuItems.map((item) => {
                const Icon = item.icon
                const isActive = router.pathname === item.href
                return (
                  <li key={item.text}>
                    <Link
                      href={item.href}
                      className={`flex items-center px-3 py-2 rounded-md text-sm font-medium transition-colors ${
                        isActive
                          ? 'bg-primary-100 text-primary-700'
                          : 'text-gray-700 hover:bg-gray-100 hover:text-gray-900'
                      }`}
                    >
                      <Icon className={`mr-3 h-5 w-5 ${isActive ? 'text-primary-500' : 'text-gray-400'}`} />
                      {item.text}
                    </Link>
                  </li>
                )
              })}
            </ul>
          </nav>
        </div>
      </div>

      {/* Desktop sidebar */}
      <div className="hidden lg:flex lg:w-64 lg:flex-col lg:fixed lg:inset-y-0">
        <div className="flex flex-col flex-grow bg-white border-r border-gray-200">
          <div className="flex h-16 items-center px-4">
            <h1 className="text-xl font-semibold text-primary-500">Archalley Newsletter</h1>
          </div>
          <nav className="flex-1 px-4 py-4">
            <ul className="space-y-2">
              {menuItems.map((item) => {
                const Icon = item.icon
                const isActive = router.pathname === item.href
                return (
                  <li key={item.text}>
                    <Link
                      href={item.href}
                      className={`flex items-center px-3 py-2 rounded-md text-sm font-medium transition-colors ${
                        isActive
                          ? 'bg-primary-100 text-primary-700'
                          : 'text-gray-700 hover:bg-gray-100 hover:text-gray-900'
                      }`}
                    >
                      <Icon className={`mr-3 h-5 w-5 ${isActive ? 'text-primary-500' : 'text-gray-400'}`} />
                      {item.text}
                    </Link>
                  </li>
                )
              })}
            </ul>
          </nav>
        </div>
      </div>

      {/* Main content */}
      <div className="flex flex-col flex-1 lg:pl-64">
        {/* Top bar */}
        <header className="bg-white shadow-sm border-b border-gray-200">
          <div className="flex h-16 items-center justify-between px-4 sm:px-6 lg:px-8">
            <div className="flex items-center">
              <button
                onClick={() => setMobileMenuOpen(true)}
                className="text-gray-500 hover:text-gray-600 lg:hidden"
              >
                <Bars3Icon className="h-6 w-6" />
              </button>
              <h1 className="ml-2 text-xl font-semibold text-gray-900 lg:ml-0">{getPageTitle()}</h1>
            </div>
            
            {/* User menu */}
            <div className="relative">
              <button
                onClick={() => setUserMenuOpen(!userMenuOpen)}
                className="flex items-center text-sm rounded-full focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-500"
              >
                <div className="h-8 w-8 rounded-full bg-primary-500 flex items-center justify-center text-white font-medium">
                  {session?.user?.name?.charAt(0)}
                </div>
              </button>
              
              {userMenuOpen && (
                <div className="absolute right-0 mt-2 w-48 bg-white rounded-md shadow-lg py-1 z-50">
                  <div className="px-4 py-2 text-sm text-gray-700 border-b border-gray-200">
                    {session?.user?.name} ({session?.user?.role})
                  </div>
                  <button
                    onClick={handleSignOut}
                    className="block w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-100"
                  >
                    Sign Out
                  </button>
                </div>
              )}
            </div>
          </div>
        </header>

        {/* Page content */}
        <main className="flex-1 overflow-y-auto">
          <div className="py-6">
            <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
              {children}
            </div>
          </div>
        </main>

        {/* Footer */}
        <footer className="bg-white border-t border-gray-200 py-4">
          <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
            <div className="text-center text-sm text-gray-500">
              Designed & Developed by{' '}
              <a
                href="https://bitlab.lk"
                target="_blank"
                rel="noopener noreferrer"
                className="text-primary-500 hover:text-primary-600 transition-colors"
              >
                BitLab (Pvt) Ltd.
              </a>
            </div>
          </div>
        </footer>
      </div>
    </div>
  )
}