import { NextApiRequest, NextApiResponse } from 'next'
import { getServerSession } from 'next-auth'
import { authOptions } from '../auth/[...nextauth]'
import { getSupabaseAdmin } from '@/lib/supabase'
import { createBackup } from '@/lib/backup-exporter'
import { uploadToOneDrive, deleteOldBackups } from '@/lib/onedrive-upload'

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'POST') {
    return res.status(405).json({ message: 'Method not allowed' })
  }

  let backupRunId: string | null = null

  try {
    // Check if this is a manual trigger or cron job
    const isManual = req.query.manual === '1'
    const isCron = req.headers['x-vercel-cron'] === '1'

    if (!isManual && !isCron) {
      return res.status(401).json({ message: 'Unauthorized' })
    }

    // For manual triggers, check superadmin auth
    if (isManual) {
      const session = await getServerSession(req, res, authOptions)
      if (!session || session.user.role !== 'superadmin') {
        return res.status(401).json({ message: 'Unauthorized' })
      }
    }

    const supabaseAdmin = getSupabaseAdmin()

    // Get backup settings
    const { data: settings, error: settingsError } = await supabaseAdmin
      .from('app_settings')
      .select('*')
      .single()

    if (settingsError) {
      console.error('Error fetching backup settings:', settingsError)
      return res.status(500).json({ 
        message: 'Database error fetching backup settings',
        error: settingsError.message 
      })
    }

    if (!settings) {
      console.error('No backup settings found in database')
      return res.status(500).json({ 
        message: 'No backup settings found. Please ensure the database schema has been applied.',
        details: 'The backup system requires app_settings table to be created with default values.'
      })
    }

    // Get superadmin users for OneDrive tokens
    const { data: superadmins, error: userError } = await supabaseAdmin
      .from('users')
      .select('id, email, name')
      .eq('role', 'superadmin')

    if (userError) {
      console.error('Error fetching superadmin users:', userError)
      return res.status(500).json({ 
        message: 'Database error fetching superadmin users',
        error: userError.message 
      })
    }

    if (!superadmins || superadmins.length === 0) {
      console.error('No superadmin users found in database')
      return res.status(500).json({ 
        message: 'No superadmin users found. Please ensure the database schema has been applied and a superadmin user exists.',
        details: 'The backup system requires a user with role="superadmin" to access OneDrive tokens.'
      })
    }

    // Find superadmin with OneDrive tokens, or use the first one
    let selectedSuperadmin = superadmins[0] // Default to first superadmin
    
    // Check if any superadmin has OAuth tokens
    const { data: oauthTokens } = await supabaseAdmin
      .from('oauth_tokens')
      .select('user_id')
      .eq('provider', 'microsoft')

    if (oauthTokens && oauthTokens.length > 0) {
      // Find superadmin that has OAuth tokens
      const superadminWithTokens = superadmins.find(sa => 
        oauthTokens.some(token => token.user_id === sa.id)
      )
      if (superadminWithTokens) {
        selectedSuperadmin = superadminWithTokens
      }
    }

    console.log(`Found ${superadmins.length} superadmin users, using:`, selectedSuperadmin.email)

    // Create backup run record
    console.log('Creating backup run record...')
    const { data: backupRun, error: runError } = await supabaseAdmin
      .from('backup_runs')
      .insert({
        status: 'running',
        started_at: new Date().toISOString(),
      })
      .select()
      .single()

    if (runError || !backupRun) {
      return res.status(500).json({ message: 'Failed to create backup run record' })
    }

    backupRunId = backupRun.id
    console.log('Backup run record created with ID:', backupRunId)

    // Create backup with timeout
    console.log('Starting backup creation...')
    const backupData = await Promise.race([
      createBackup(),
      new Promise((_, reject) => 
        setTimeout(() => reject(new Error('Backup creation timeout after 5 minutes')), 5 * 60 * 1000)
      )
    ]) as any
    console.log('Backup creation completed')

    // Upload to OneDrive
    console.log('Starting OneDrive upload...')
    const uploadResult = await uploadToOneDrive(
      backupData.buffer,
      backupData.fileName,
      settings.onedrive_backup_path,
      selectedSuperadmin.id
    )

    if (!uploadResult.success) {
      // Update backup run with failure
      await supabaseAdmin
        .from('backup_runs')
        .update({
          status: 'failed',
          finished_at: new Date().toISOString(),
          error: uploadResult.error,
        })
        .eq('id', backupRunId)

      return res.status(500).json({ 
        message: 'Backup upload failed',
        error: uploadResult.error 
      })
    }

    // Update backup run with success
    await supabaseAdmin
      .from('backup_runs')
      .update({
        status: 'success',
        finished_at: new Date().toISOString(),
        file_name: backupData.fileName,
        file_size_bytes: backupData.size,
      })
      .eq('id', backupRunId)

    // Clean up old backups
    await deleteOldBackups(
      settings.onedrive_backup_path,
      settings.backup_retention_days,
      selectedSuperadmin.id
    )

    res.status(200).json({
      message: 'Backup completed successfully',
      fileName: backupData.fileName,
      size: backupData.size,
      fileId: uploadResult.fileId,
      webUrl: uploadResult.webUrl
    })

  } catch (error) {
    console.error('Backup error:', error)

    // Update backup run with failure if we have an ID
    if (backupRunId) {
      const supabaseAdmin = getSupabaseAdmin()
      await supabaseAdmin
        .from('backup_runs')
        .update({
          status: 'failed',
          finished_at: new Date().toISOString(),
          error: error instanceof Error ? error.message : 'Unknown error',
        })
        .eq('id', backupRunId)
    }

    res.status(500).json({ 
      message: 'Backup failed',
      error: error instanceof Error ? error.message : 'Unknown error'
    })
  }
}
