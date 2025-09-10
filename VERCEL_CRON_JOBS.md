# Vercel Cron Jobs Configuration

This document explains how the WordPress sync cron jobs are configured for Vercel deployment.

## Overview

The Archalley Newsletter system uses Vercel's cron jobs feature to automatically sync WordPress content. This replaces the previous Node.js cron implementations for production deployment.

## Cron Job Schedule

### WordPress Posts Sync
- **Schedule**: Daily at 3:00 AM Sri Lankan Time
- **UTC Time**: 9:30 PM UTC (21:30)
- **Cron Expression**: `30 21 * * *`
- **Endpoint**: `/api/wordpress/sync-posts`

### WordPress Emails Sync
- **Schedule**: Daily at 2:00 AM Sri Lankan Time  
- **UTC Time**: 8:30 PM UTC (20:30)
- **Cron Expression**: `30 20 * * *`
- **Endpoint**: `/api/wordpress/sync-emails`

## Configuration Files

### vercel.json
```json
{
  "$schema": "https://openapi.vercel.sh/vercel.json",
  "crons": [
    {
      "path": "/api/wordpress/sync-posts",
      "schedule": "30 21 * * *"
    },
    {
      "path": "/api/wordpress/sync-emails", 
      "schedule": "30 20 * * *"
    }
  ]
}
```

## Security

Both cron jobs are secured using Vercel's `CRON_SECRET` environment variable:

1. Set `CRON_SECRET` in your Vercel project environment variables
2. Use a random string of at least 16 characters
3. The API endpoints verify the `Authorization: Bearer {CRON_SECRET}` header

## Environment Variables Required

```bash
CRON_SECRET=your_random_cron_secret_key_at_least_16_characters
```

## Deployment

1. Ensure `vercel.json` is in your project root
2. Set the `CRON_SECRET` environment variable in Vercel
3. Deploy your project
4. Verify cron jobs are active in Vercel Dashboard → Settings → Cron Jobs

## Monitoring

- View cron job logs in Vercel Dashboard → Functions → Logs
- Filter by `requestPath:/api/wordpress/sync-posts` or `requestPath:/api/wordpress/sync-emails`
- Check execution status and any errors

## Manual Testing

You can test the cron jobs locally by making requests to:
- `GET/POST http://localhost:3000/api/wordpress/sync-posts`
- `GET/POST http://localhost:3000/api/wordpress/sync-emails`

**Note**: Vercel cron jobs use GET requests, while manual testing can use either GET or POST.

## Time Zone Conversion

Sri Lanka Standard Time (SLST) is UTC+05:30 and does not observe daylight saving time.

- 3:00 AM SLST = 9:30 PM UTC (previous day)
- 2:00 AM SLST = 8:30 PM UTC (previous day)

## References

- [Vercel Cron Jobs Documentation](https://vercel.com/docs/cron-jobs)
- [Managing Cron Jobs](https://vercel.com/docs/cron-jobs/manage-cron-jobs)
- [Cron Expressions](https://vercel.com/docs/cron-jobs#cron-expressions)
