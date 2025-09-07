import { NextApiRequest, NextApiResponse } from 'next'
import { getServerSession } from 'next-auth'
import { authOptions } from '../auth/[...nextauth]'
import { getSupabaseAdmin } from '@/lib/supabase'

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'PUT') {
    return res.status(405).json({ message: 'Method not allowed' })
  }

  try {
    // Check authentication
    const session = await getServerSession(req, res, authOptions)
    
    if (!session || session.user.role !== 'superadmin') {
      return res.status(401).json({ message: 'Unauthorized' })
    }

    const { id, email, name, role } = req.body

    // Validate required fields
    if (!id || !email || !name || !role) {
      return res.status(400).json({ message: 'Missing required fields' })
    }

    // Validate email format
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      return res.status(400).json({ message: 'Invalid email format' })
    }

    // Validate role
    if (!['admin', 'superadmin'].includes(role)) {
      return res.status(400).json({ message: 'Invalid role' })
    }

    // Update user using service role (bypasses RLS)
    const supabaseAdmin = getSupabaseAdmin()
    const { data, error } = await supabaseAdmin
      .from('users')
      .update({
        email: email.toLowerCase().trim(),
        name: name.trim(),
        role: role,
      })
      .eq('id', id)
      .select()
      .single()

    if (error) {
      if (error.code === '23505') {
        return res.status(409).json({ message: 'A user with this email already exists' })
      }
      console.error('Database error:', error)
      return res.status(500).json({ message: 'Database error' })
    }

    if (!data) {
      return res.status(404).json({ message: 'User not found' })
    }

    res.status(200).json({ 
      message: 'User updated successfully',
      user: data
    })

  } catch (error) {
    console.error('User update error:', error)
    res.status(500).json({ message: 'Internal server error' })
  }
}
