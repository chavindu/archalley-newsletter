import { NextApiRequest, NextApiResponse } from 'next'
import { getServerSession } from 'next-auth'
import { authOptions } from '../../auth/[...nextauth]'

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'GET') {
    return res.status(405).json({ message: 'Method not allowed' })
  }

  try {
    // Check authentication
    const session = await getServerSession(req, res, authOptions)
    
    if (!session || session.user.role !== 'superadmin') {
      return res.status(401).json({ message: 'Unauthorized' })
    }

    const clientId = process.env.AZURE_AD_CLIENT_ID
    const tenantId = process.env.AZURE_AD_TENANT_ID
    const redirectUri = `${process.env.NEXTAUTH_URL}/api/onedrive/oauth/callback`

    if (!clientId || !tenantId) {
      return res.status(500).json({ message: 'Azure AD configuration missing' })
    }

    const scopes = [
      'Files.ReadWrite',
      'offline_access',
      'User.Read'
    ].join(' ')

    const state = Buffer.from(JSON.stringify({ 
      userId: session.user.id,
      timestamp: Date.now()
    })).toString('base64')

    const authUrl = new URL(`https://login.microsoftonline.com/${tenantId}/oauth2/v2.0/authorize`)
    authUrl.searchParams.set('client_id', clientId)
    authUrl.searchParams.set('response_type', 'code')
    authUrl.searchParams.set('redirect_uri', redirectUri)
    authUrl.searchParams.set('scope', scopes)
    authUrl.searchParams.set('state', state)
    authUrl.searchParams.set('response_mode', 'query')

    res.redirect(authUrl.toString())

  } catch (error) {
    console.error('OAuth start error:', error)
    res.status(500).json({ message: 'Internal server error' })
  }
}
