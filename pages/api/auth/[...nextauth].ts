import NextAuth, { NextAuthOptions } from 'next-auth'
import GoogleProvider from 'next-auth/providers/google'
import { supabase } from '@/lib/supabase'

export const authOptions: NextAuthOptions = {
  providers: [
    GoogleProvider({
      clientId: process.env.GOOGLE_CLIENT_ID!,
      clientSecret: process.env.GOOGLE_CLIENT_SECRET!,
    }),
  ],
  callbacks: {
    async signIn({ user, account, profile }) {
      if (account?.provider === 'google') {
        try {
          // Check if user exists in our database
          const { data: existingUser, error } = await supabase
            .from('users')
            .select('*')
            .eq('email', user.email)
            .single()

          if (error && error.code !== 'PGRST116') {
            console.error('Error checking user:', error)
            return false
          }

          // Only allow registered users to sign in
          if (!existingUser) {
            console.log('User not registered:', user.email)
            return false
          }

          return true
        } catch (error) {
          console.error('Sign in error:', error)
          return false
        }
      }
      return false
    },
    async session({ session, token }) {
      if (session?.user?.email) {
        try {
          const { data: user, error } = await supabase
            .from('users')
            .select('*')
            .eq('email', session.user.email)
            .single()

          if (!error && user) {
            session.user.role = user.role
            session.user.id = user.id
          }
        } catch (error) {
          console.error('Session callback error:', error)
        }
      }
      return session
    },
  },
  pages: {
    signIn: '/login',
    error: '/auth/error',
  },
  session: {
    strategy: 'jwt',
  },
}

declare module 'next-auth' {
  interface Session {
    user: {
      id: string
      email: string
      name: string
      role: 'admin' | 'superadmin'
    }
  }
}

export default NextAuth(authOptions)
