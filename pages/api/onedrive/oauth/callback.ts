import { NextApiRequest, NextApiResponse } from 'next'
import { getSupabaseAdmin } from '@/lib/supabase'
import { encryptToken } from '@/lib/utils'

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'GET') {
    return res.status(405).json({ message: 'Method not allowed' })
  }

  try {
    const { code, state, error } = req.query

    if (error) {
      console.error('OAuth error:', error)
      return res.redirect('/admin/backups?error=oauth_failed')
    }

    if (!code || !state) {
      return res.status(400).json({ message: 'Missing code or state' })
    }

    // Decode state to get user info
    let stateData
    try {
      stateData = JSON.parse(Buffer.from(state as string, 'base64').toString())
    } catch {
      return res.status(400).json({ message: 'Invalid state' })
    }

    const { userId } = stateData

    // Exchange code for tokens
    const clientId = process.env.AZURE_AD_CLIENT_ID
    const clientSecret = process.env.AZURE_AD_CLIENT_SECRET
    const tenantId = process.env.AZURE_AD_TENANT_ID
    const redirectUri = `${process.env.NEXTAUTH_URL}/api/onedrive/oauth/callback`

    if (!clientId || !clientSecret || !tenantId) {
      return res.status(500).json({ message: 'Azure AD configuration missing' })
    }

    const tokenResponse = await fetch(`https://login.microsoftonline.com/${tenantId}/oauth2/v2.0/token`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
      },
      body: new URLSearchParams({
        client_id: clientId,
        client_secret: clientSecret,
        code: code as string,
        redirect_uri: redirectUri,
        grant_type: 'authorization_code',
      }),
    })

    if (!tokenResponse.ok) {
      const errorData = await tokenResponse.text()
      console.error('Token exchange failed:', errorData)
      return res.redirect('/admin/backups?error=token_exchange_failed')
    }

    const tokenData = await tokenResponse.json()
    const { access_token, refresh_token, expires_in } = tokenData

    // Calculate expiration time
    const expiresAt = new Date(Date.now() + (expires_in * 1000))

    // Encrypt tokens
    const encryptedAccessToken = await encryptToken(access_token)
    const encryptedRefreshToken = await encryptToken(refresh_token)

    // Store tokens in database
    const supabaseAdmin = getSupabaseAdmin()
    const { error: dbError } = await supabaseAdmin
      .from('oauth_tokens')
      .upsert({
        provider: 'microsoft',
        user_id: userId,
        access_token: encryptedAccessToken,
        refresh_token: encryptedRefreshToken,
        expires_at: expiresAt.toISOString(),
        updated_at: new Date().toISOString(),
      })

    if (dbError) {
      console.error('Database error:', dbError)
      return res.redirect('/admin/backups?error=storage_failed')
    }

    res.redirect('/admin/backups?success=connected')

  } catch (error) {
    console.error('OAuth callback error:', error)
    res.redirect('/admin/backups?error=callback_failed')
  }
}
