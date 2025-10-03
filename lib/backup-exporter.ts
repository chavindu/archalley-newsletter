import archiver from 'archiver'
import { getSupabaseAdmin } from '@/lib/supabase'
import Papa from 'papaparse'

export interface BackupData {
  buffer: Buffer
  fileName: string
  size: number
}

export async function createBackup(): Promise<BackupData> {
  console.log('Starting backup creation...')
  const supabaseAdmin = getSupabaseAdmin()
  
  // Tables to backup
  const tables = [
    'users',
    'email_lists', 
    'subscribers',
    'newsletters',
    'newsletter_analytics',
    'ad_banners',
    'app_settings',
    'oauth_tokens',
    'backup_runs'
  ]

  console.log(`Will backup ${tables.length} tables:`, tables)

  // Create archive
  const archive = archiver('zip', { zlib: { level: 9 } })
  const chunks: Buffer[] = []
  let isFinalized = false

  archive.on('data', (chunk) => {
    chunks.push(chunk)
  })

  archive.on('end', () => {
    console.log('Archive finalized, total chunks:', chunks.length)
    isFinalized = true
  })

  archive.on('error', (err) => {
    console.error('Archive error:', err)
    throw err
  })

  // Export each table
  for (const tableName of tables) {
    try {
      console.log(`Processing table: ${tableName}`)
      
      // Get all data from table with pagination
      let allData: any[] = []
      let from = 0
      const pageSize = 1000
      let hasMore = true

      while (hasMore) {
        const { data, error } = await supabaseAdmin
          .from(tableName)
          .select('*')
          .range(from, from + pageSize - 1)

        if (error) {
          console.error(`Error fetching ${tableName}:`, error)
          break
        }

        if (data && data.length > 0) {
          allData = allData.concat(data)
          from += pageSize
          hasMore = data.length === pageSize
        } else {
          hasMore = false
        }
      }

      console.log(`Table ${tableName}: ${allData.length} records`)

      // Add JSON file
      const jsonData = JSON.stringify(allData, null, 2)
      archive.append(jsonData, { name: `${tableName}.json` })

      // Add CSV file
      if (allData.length > 0) {
        const csvData = Papa.unparse(allData)
        archive.append(csvData, { name: `${tableName}.csv` })
      } else {
        // Empty CSV with headers if no data
        const csvData = Papa.unparse([])
        archive.append(csvData, { name: `${tableName}.csv` })
      }

    } catch (error) {
      console.error(`Error processing table ${tableName}:`, error)
      // Continue with other tables
    }
  }

  // Add metadata file
  console.log('Adding metadata file...')
  const metadata = {
    export_date: new Date().toISOString(),
    tables_exported: tables,
    version: '1.0'
  }
  archive.append(JSON.stringify(metadata, null, 2), { name: 'metadata.json' })

  // Finalize archive
  console.log('Finalizing archive...')
  await archive.finalize()

  // Wait for all chunks to be collected
  console.log('Waiting for archive to complete...')
  await new Promise<void>((resolve) => {
    if (isFinalized) {
      resolve()
    } else {
      archive.on('end', () => resolve())
    }
  })

  // Combine chunks into buffer
  console.log('Combining chunks into buffer...')
  const buffer = Buffer.concat(chunks)
  const fileName = `backup-${new Date().toISOString().replace(/[:.]/g, '-').slice(0, 19)}Z.zip`

  console.log(`Backup created: ${fileName}, size: ${buffer.length} bytes`)

  return {
    buffer,
    fileName,
    size: buffer.length
  }
}
