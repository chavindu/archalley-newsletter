const cron = require('node-cron')
const fetch = require('node-fetch')

// Configuration
const API_BASE_URL = process.env.API_BASE_URL || 'http://localhost:3000'
const SYNC_ENDPOINT = `${API_BASE_URL}/api/wordpress/sync-emails`
const LOG_FILE = process.env.LOG_FILE || './logs/wordpress-emails-sync.log'

// Ensure logs directory exists
const fs = require('fs')
const path = require('path')
const logDir = path.dirname(LOG_FILE)
if (!fs.existsSync(logDir)) {
  fs.mkdirSync(logDir, { recursive: true })
}

// Logging function
function logMessage(message) {
  const timestamp = new Date().toISOString()
  const logEntry = `${timestamp} - ${message}\n`
  
  console.log(logEntry.trim())
  fs.appendFileSync(LOG_FILE, logEntry)
}

// Sync WordPress emails
async function syncEmails() {
  try {
    logMessage('Starting WordPress emails sync...')
    
    const response = await fetch(SYNC_ENDPOINT, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-automated-sync': 'true'
      }
    })
    
    const result = await response.json()
    
    if (response.ok) {
      logMessage(`Sync successful: ${result.message}`)
      logMessage(`Synced: ${result.synced}, Updated: ${result.updated}, Errors: ${result.errors}`)
      logMessage(`Total fetched: ${result.total_fetched}`)
    } else {
      logMessage(`Sync failed: ${result.message}`)
    }
  } catch (error) {
    logMessage(`Sync error: ${error.message}`)
  }
}

// Check if API is accessible
async function checkAPI() {
  try {
    const response = await fetch(`${API_BASE_URL}/api/health`)
    return response.ok
  } catch (error) {
    logMessage(`API check failed: ${error.message}`)
    return false
  }
}

// Main execution
async function main() {
  logMessage('WordPress emails sync cron job started')
  
  // Check if API is accessible
  const apiAccessible = await checkAPI()
  if (!apiAccessible) {
    logMessage('Cannot sync emails - API not accessible')
    return
  }
  
  // Perform the sync
  await syncEmails()
  
  logMessage('WordPress emails sync cron job completed')
}

// Schedule the cron job to run every 24 hours
// Cron expression: '0 0 * * *' means at midnight (00:00) every day
cron.schedule('0 0 * * *', async () => {
  await main()
}, {
  scheduled: true,
  timezone: "UTC"
})

logMessage('WordPress emails sync cron job scheduler started - running every 24 hours at midnight UTC')

// Keep the process running
process.on('SIGINT', () => {
  logMessage('WordPress emails sync cron job scheduler stopped')
  process.exit(0)
})

// Run once immediately on startup (optional)
// main()
