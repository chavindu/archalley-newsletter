# WordPress Emails Integration

This system automatically fetches email addresses from archalley.com every 24 hours and syncs them to the email list with ID `b163441c-e44d-4461-b600-ebe79e39644f`.

## Features

- **Automated Sync**: Fetches emails from WordPress custom API every 24 hours
- **Smart Management**: Adds new subscribers and reactivates unsubscribed users
- **Management Interface**: View sync statistics and manage email list
- **Manual Sync**: Trigger sync manually from the admin interface
- **Detailed Logging**: Comprehensive logging of sync operations

## API Configuration

- **WordPress API URL**: `https://archalley.com/wp-json/bitlab-custom-api/v1/user-emails`
- **Secret Key**: `OpSAn1GqqhJJw5hpBM5NO1j5mJjlWykr`
- **Target Email List ID**: `b163441c-e44d-4461-b600-ebe79e39644f`

## API Endpoints

### `/api/wordpress/sync-emails` (POST)
- Fetches emails from WordPress API and syncs them to the target email list
- Can be called manually or via automated cron job
- Headers: `x-automated-sync: true` for automated calls
- Returns sync statistics (synced, updated, errors, total_fetched)

### `/api/wordpress/email-stats` (GET)
- Retrieves statistics for the target email list
- Returns total, active, unsubscribed, and bounced subscriber counts
- Requires authentication

## Automated Sync Setup

### Vercel Cron Jobs (Recommended for Production)

The WordPress emails sync is configured to run automatically on Vercel using cron jobs:

1. **Schedule**: Daily at 2:00 AM Sri Lankan Time (8:30 PM UTC)
2. **Configuration**: Defined in `vercel.json`
3. **Security**: Protected with `CRON_SECRET` environment variable
4. **Endpoint**: `/api/wordpress/sync-emails`

#### Environment Variables Required:
```bash
CRON_SECRET=your_random_cron_secret_key_at_least_16_characters
```

#### Manual Testing:
You can test the cron job locally by visiting:
```
http://localhost:3000/api/wordpress/sync-emails
```

### Alternative: Node.js Cron Job (For Development)

1. Install dependencies:
```bash
cd scripts
npm install
```

2. Start the cron job:
```bash
npm run start-emails
```

3. To run as a Windows service, use a tool like `pm2` or `node-windows`.

### Alternative: Windows Task Scheduler

1. Create a new task in Windows Task Scheduler
2. Set trigger to "Daily" at midnight
3. Set action to run `scripts/sync-wordpress-emails.bat`

### Alternative: Linux Cron Job

1. Add to crontab:
```bash
0 0 * * * /path/to/scripts/sync-wordpress-emails.sh
```

## Usage

### Manual Sync
- Visit the WordPress Emails page (`/wordpress-emails`)
- Click "Sync Emails" button to trigger manual sync
- View real-time sync statistics

### Automated Sync
- The system runs automatically every 24 hours at midnight UTC
- Check logs in `scripts/logs/wordpress-emails-sync.log`
- Monitor sync statistics in the admin interface

## Sync Behavior

1. **New Emails**: Added as active subscribers to the target email list
2. **Existing Active Subscribers**: Skipped (no changes)
3. **Previously Unsubscribed**: Reactivated and marked as active
4. **Bounced Emails**: Left unchanged (maintains bounce status)

## Logging

Sync operations are logged to:
- Console output
- Log file: `scripts/logs/wordpress-emails-sync.log`

Log entries include:
- Timestamp
- Sync start/completion
- Number of emails synced, updated, and errors
- Detailed error messages

## Error Handling

The system handles various error scenarios:
- Network connectivity issues
- API authentication failures
- Database connection problems
- Invalid email formats
- Duplicate email handling

## Monitoring

Monitor the integration through:
- Admin interface statistics
- Log files
- Email list subscriber counts
- Sync success/failure notifications

## Troubleshooting

### Common Issues

1. **API Access Denied**
   - Verify the secret key is correct
   - Check if the WordPress API endpoint is accessible

2. **Database Errors**
   - Ensure Supabase connection is configured
   - Verify email list ID exists in database

3. **Sync Not Running**
   - Check if cron job is active
   - Verify log files for error messages
   - Test manual sync from admin interface

### Testing

Test the integration:
```bash
# Manual sync test
curl -X POST -H 'x-automated-sync: true' http://localhost:3000/api/wordpress/sync-emails

# Check statistics
curl http://localhost:3000/api/wordpress/email-stats
```

## Security Considerations

- Secret key is stored in environment variables
- API endpoints require authentication for manual access
- Automated sync uses special header to bypass auth
- All database operations use prepared statements
- Email addresses are validated before storage
