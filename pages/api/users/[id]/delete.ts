import { NextApiRequest, NextApiResponse } from 'next'
import { getServerSession } from 'next-auth'
import { authOptions } from '../../auth/[...nextauth]'
import { supabaseAdmin } from '@/lib/supabase'

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'DELETE') {
    return res.status(405).json({ message: 'Method not allowed' })
  }

  try {
    // Check authentication
    const session = await getServerSession(req, res, authOptions)
    
    if (!session || session.user.role !== 'superadmin') {
      return res.status(401).json({ message: 'Unauthorized' })
    }

    const { id } = req.query

    if (!id || typeof id !== 'string') {
      return res.status(400).json({ message: 'User ID is required' })
    }

    // First, check if this is the default super admin
    const { data: user, error: fetchError } = await supabaseAdmin
      .from('users')
      .select('email')
      .eq('id', id)
      .single()

    if (fetchError) {
      console.error('Error fetching user:', fetchError)
      return res.status(500).json({ message: 'Database error' })
    }

    if (!user) {
      return res.status(404).json({ message: 'User not found' })
    }

    if (user.email === 'chavindun@gmail.com') {
      return res.status(400).json({ message: 'Cannot delete the default super admin' })
    }

    // Delete user using service role (bypasses RLS)
    const { error } = await supabaseAdmin
      .from('users')
      .delete()
      .eq('id', id)

    if (error) {
      console.error('Database error:', error)
      return res.status(500).json({ message: 'Database error' })
    }

    res.status(200).json({ 
      message: 'User deleted successfully'
    })

  } catch (error) {
    console.error('User deletion error:', error)
    res.status(500).json({ message: 'Internal server error' })
  }
}
