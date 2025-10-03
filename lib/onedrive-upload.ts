import { decryptToken } from '@/lib/utils'
import { getSupabaseAdmin } from '@/lib/supabase'

export interface GraphUploadResult {
  success: boolean
  fileId?: string
  webUrl?: string
  error?: string
}

export async function uploadToOneDrive(
  buffer: Buffer,
  fileName: string,
  backupPath: string,
  userId: string
): Promise<GraphUploadResult> {
  try {
    console.log(`Starting OneDrive upload: ${fileName} (${buffer.length} bytes) to ${backupPath}`)
    
    // Get and decrypt tokens
    const supabaseAdmin = getSupabaseAdmin()
    const { data: tokenData, error: tokenError } = await supabaseAdmin
      .from('oauth_tokens')
      .select('access_token, refresh_token, expires_at')
      .eq('provider', 'microsoft')
      .eq('user_id', userId)
      .single()

    if (tokenError || !tokenData) {
      console.error('No OneDrive tokens found:', tokenError)
      return { success: false, error: 'No OneDrive tokens found' }
    }

    console.log('Found OAuth tokens, checking expiration...')
    
    // Check if token is expired and refresh if needed
    let accessToken = await decryptToken(tokenData.access_token)
    const expiresAt = new Date(tokenData.expires_at)
    
    console.log(`Token expires at: ${expiresAt.toISOString()}, current time: ${new Date().toISOString()}`)
    
    if (expiresAt <= new Date()) {
      console.log('Token expired, refreshing...')
      const refreshResult = await refreshAccessToken(tokenData.refresh_token, userId)
      if (!refreshResult.success) {
        console.error('Failed to refresh access token')
        return { success: false, error: 'Failed to refresh access token' }
      }
      accessToken = refreshResult.accessToken!
      console.log('Token refreshed successfully')
    } else {
      console.log('Token is still valid')
    }

    // Try to upload directly - OneDrive will create folders as needed
    const filePath = `${backupPath}/${fileName}`
    console.log(`Attempting direct upload to: ${filePath}`)
    
    if (buffer.length > 4 * 1024 * 1024) {
      console.log('Using large file upload (chunked)')
      return await uploadLargeFile(buffer, filePath, accessToken)
    } else {
      console.log('Using small file upload (direct)')
      return await uploadSmallFile(buffer, filePath, accessToken)
    }

  } catch (error) {
    console.error('OneDrive upload error:', error)
    return { success: false, error: `Upload failed: ${error instanceof Error ? error.message : 'Unknown error'}` }
  }
}

async function refreshAccessToken(refreshToken: string, userId: string): Promise<{ success: boolean; accessToken?: string }> {
  try {
    const decryptedRefreshToken = await decryptToken(refreshToken)
    const clientId = process.env.AZURE_AD_CLIENT_ID
    const clientSecret = process.env.AZURE_AD_CLIENT_SECRET
    const tenantId = process.env.AZURE_AD_TENANT_ID

    const response = await fetch(`https://login.microsoftonline.com/${tenantId}/oauth2/v2.0/token`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
      },
      body: new URLSearchParams({
        client_id: clientId!,
        client_secret: clientSecret!,
        refresh_token: decryptedRefreshToken,
        grant_type: 'refresh_token',
      }),
    })

    if (!response.ok) {
      return { success: false }
    }

    const tokenData = await response.json()
    const { access_token, refresh_token: new_refresh_token, expires_in } = tokenData

    // Update tokens in database
    const supabaseAdmin = getSupabaseAdmin()
    const { encryptToken } = await import('@/lib/utils')
    
    const encryptedAccessToken = await encryptToken(access_token)
    const encryptedRefreshToken = await encryptToken(new_refresh_token)
    const expiresAt = new Date(Date.now() + (expires_in * 1000))

    await supabaseAdmin
      .from('oauth_tokens')
      .update({
        access_token: encryptedAccessToken,
        refresh_token: encryptedRefreshToken,
        expires_at: expiresAt.toISOString(),
        updated_at: new Date().toISOString(),
      })
      .eq('provider', 'microsoft')
      .eq('user_id', userId)

    return { success: true, accessToken: access_token }

  } catch (error) {
    console.error('Token refresh error:', error)
    return { success: false }
  }
}

async function ensureFolderExists(folderPath: string, accessToken: string): Promise<{ success: boolean; error?: string }> {
  try {
    console.log(`Ensuring folder path exists: ${folderPath}`)
    
    // Try to access the folder directly first
    const normalizedPath = folderPath.replace(/^\//, '') // Remove leading slash
    console.log(`Checking folder directly: /${normalizedPath}`)
    
    const checkResponse = await fetch(`https://graph.microsoft.com/v1.0/me/drive/root:/${normalizedPath}`, {
      headers: {
        'Authorization': `Bearer ${accessToken}`,
      },
    })

    console.log(`Direct check response status: ${checkResponse.status}`)

    if (checkResponse.status === 200) {
      console.log(`Folder already exists: /${normalizedPath}`)
      return { success: true }
    }

    if (checkResponse.status === 404) {
      console.log('Folder does not exist, creating...')
      
      // Use the special folder creation endpoint
      const createResponse = await fetch(`https://graph.microsoft.com/v1.0/me/drive/root/children`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${accessToken}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          name: normalizedPath.split('/').pop(), // Get the last part as folder name
          folder: {},
          '@microsoft.graph.conflictBehavior': 'rename'
        }),
      })

      console.log(`Create response status: ${createResponse.status}`)

      if (!createResponse.ok) {
        const errorData = await createResponse.text()
        console.error(`Failed to create folder:`, errorData)
        
        // If folder creation fails, try to create in root and then move/access
        console.log('Trying alternative approach - creating folder in root...')
        return await createFolderInRoot(normalizedPath, accessToken)
      }

      console.log(`Folder created successfully: /${normalizedPath}`)
      return { success: true }
    }

    const errorData = await checkResponse.text()
    console.error(`Failed to check folder:`, errorData)
    return { success: false, error: `Failed to check folder: ${errorData}` }

  } catch (error) {
    console.error('Folder creation error:', error)
    return { success: false, error: `Folder creation failed: ${error instanceof Error ? error.message : 'Unknown error'}` }
  }
}

async function createFolderInRoot(folderPath: string, accessToken: string): Promise<{ success: boolean; error?: string }> {
  try {
    console.log(`Creating folder in root: ${folderPath}`)
    
    // For now, just return success - we'll try to upload directly
    // The upload will create the folder structure if needed
    console.log('Skipping folder creation, will let upload create structure')
    return { success: true }
    
  } catch (error) {
    console.error('Root folder creation error:', error)
    return { success: false, error: `Root folder creation failed: ${error instanceof Error ? error.message : 'Unknown error'}` }
  }
}

async function uploadSmallFile(buffer: Buffer, filePath: string, accessToken: string): Promise<GraphUploadResult> {
  try {
    console.log(`Uploading small file: ${filePath} (${buffer.length} bytes)`)
    
    // Normalize the path - remove leading slash if present
    const normalizedPath = filePath.replace(/^\//, '')
    console.log(`Normalized path: ${normalizedPath}`)
    
    const response = await fetch(`https://graph.microsoft.com/v1.0/me/drive/root:/${normalizedPath}:/content`, {
      method: 'PUT',
      headers: {
        'Authorization': `Bearer ${accessToken}`,
        'Content-Type': 'application/octet-stream',
      },
      body: new Uint8Array(buffer),
    })

    console.log(`Upload response status: ${response.status}`)

    if (!response.ok) {
      const errorData = await response.text()
      console.error('Upload failed with response:', errorData)
      
      // If upload fails due to folder not existing, try to create the folder first
      if (response.status === 409 || response.status === 400) {
        console.log('Upload failed, trying to create folder structure first...')
        const folderResult = await ensureFolderExists(filePath.substring(0, filePath.lastIndexOf('/')), accessToken)
        if (folderResult.success) {
          console.log('Folder created, retrying upload...')
          // Retry the upload
          const retryResponse = await fetch(`https://graph.microsoft.com/v1.0/me/drive/root:/${normalizedPath}:/content`, {
            method: 'PUT',
            headers: {
              'Authorization': `Bearer ${accessToken}`,
              'Content-Type': 'application/octet-stream',
            },
            body: new Uint8Array(buffer),
          })
          
          if (retryResponse.ok) {
            const result = await retryResponse.json()
            console.log('Retry upload successful:', result.id)
            return {
              success: true,
              fileId: result.id,
              webUrl: result.webUrl
            }
          }
        }
      }
      
      return { success: false, error: `Upload failed: ${errorData}` }
    }

    const result = await response.json()
    console.log('Upload successful:', result.id)
    return {
      success: true,
      fileId: result.id,
      webUrl: result.webUrl
    }

  } catch (error) {
    console.error('Small file upload error:', error)
    return { success: false, error: `Upload failed: ${error instanceof Error ? error.message : 'Unknown error'}` }
  }
}

async function uploadLargeFile(buffer: Buffer, filePath: string, accessToken: string): Promise<GraphUploadResult> {
  try {
    // Create upload session
    const sessionResponse = await fetch(`https://graph.microsoft.com/v1.0/me/drive/root:${filePath}:/createUploadSession`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${accessToken}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        '@microsoft.graph.conflictBehavior': 'replace'
      }),
    })

    if (!sessionResponse.ok) {
      const errorData = await sessionResponse.text()
      return { success: false, error: `Failed to create upload session: ${errorData}` }
    }

    const sessionData = await sessionResponse.json()
    const uploadUrl = sessionData.uploadUrl

    // Upload in chunks
    const chunkSize = 4 * 1024 * 1024 // 4MB chunks
    let offset = 0

    while (offset < buffer.length) {
      const end = Math.min(offset + chunkSize, buffer.length)
      const chunk = buffer.subarray(offset, end)
      
      const chunkResponse = await fetch(uploadUrl, {
        method: 'PUT',
        headers: {
          'Content-Length': chunk.length.toString(),
          'Content-Range': `bytes ${offset}-${end - 1}/${buffer.length}`,
        },
        body: new Uint8Array(chunk),
      })

      if (!chunkResponse.ok) {
        const errorData = await chunkResponse.text()
        return { success: false, error: `Chunk upload failed: ${errorData}` }
      }

      offset = end
    }

    // Get file info
    const fileResponse = await fetch(`https://graph.microsoft.com/v1.0/me/drive/root:${filePath}`, {
      headers: {
        'Authorization': `Bearer ${accessToken}`,
      },
    })

    if (!fileResponse.ok) {
      return { success: false, error: 'Failed to get file info after upload' }
    }

    const fileData = await fileResponse.json()
    return {
      success: true,
      fileId: fileData.id,
      webUrl: fileData.webUrl
    }

  } catch (error) {
    console.error('Large file upload error:', error)
    return { success: false, error: 'Upload failed' }
  }
}

export async function deleteOldBackups(backupPath: string, retentionDays: number, userId: string): Promise<void> {
  try {
    // Get access token
    const supabaseAdmin = getSupabaseAdmin()
    const { data: tokenData } = await supabaseAdmin
      .from('oauth_tokens')
      .select('access_token, expires_at')
      .eq('provider', 'microsoft')
      .eq('user_id', userId)
      .single()

    if (!tokenData) return

    let accessToken = await decryptToken(tokenData.access_token)
    const expiresAt = new Date(tokenData.expires_at)
    
    if (expiresAt <= new Date()) {
      const refreshResult = await refreshAccessToken(tokenData.access_token, userId)
      if (!refreshResult.success) return
      accessToken = refreshResult.accessToken!
    }

    // List files in backup folder
    const listResponse = await fetch(`https://graph.microsoft.com/v1.0/me/drive/root:${backupPath}:/children`, {
      headers: {
        'Authorization': `Bearer ${accessToken}`,
      },
    })

    if (!listResponse.ok) return

    const listData = await listResponse.json()
    const cutoffDate = new Date(Date.now() - (retentionDays * 24 * 60 * 60 * 1000))

    // Delete old backup files
    for (const item of listData.value) {
      if (item.name.startsWith('backup-') && item.name.endsWith('.zip')) {
        const createdDate = new Date(item.createdDateTime)
        if (createdDate < cutoffDate) {
          await fetch(`https://graph.microsoft.com/v1.0/me/drive/items/${item.id}`, {
            method: 'DELETE',
            headers: {
              'Authorization': `Bearer ${accessToken}`,
            },
          })
        }
      }
    }

  } catch (error) {
    console.error('Delete old backups error:', error)
  }
}
