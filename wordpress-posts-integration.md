# WordPress Posts Integration

This system automatically fetches WordPress posts from archalley.com every hour and stores them in the database for use in newsletters.

## Features

- **Automated Sync**: Fetches posts from WordPress REST API every hour
- **Database Storage**: Stores posts locally for faster access
- **Management Interface**: View and manage stored WordPress posts
- **Newsletter Integration**: Use stored posts when creating newsletters
- **Search & Filter**: Find posts by title, category, status, etc.

## Database Setup

1. Run the database schema to create the `wordpress_posts` table:

```sql
-- Execute the contents of lib/wordpress-posts-schema.sql
```

## API Endpoints

### `/api/wordpress/sync-posts` (POST)
- Fetches posts from WordPress API and stores them in database
- Can be called manually or via automated cron job
- Headers: `x-automated-sync: true` for automated calls

### `/api/wordpress/posts-stored` (GET)
- Retrieves stored WordPress posts with pagination and filtering
- Query parameters:
  - `page`: Page number (default: 1)
  - `limit`: Posts per page (default: 20)
  - `status`: Filter by status (active, archived, deleted)
  - `featured`: Show only featured posts (true/false)
  - `category`: Filter by category slug
  - `search`: Search in title and excerpt

## Automated Sync Setup

### Option 1: Node.js Cron Job (Recommended)

1. Install dependencies:
```bash
cd scripts
npm install
```

2. Start the cron job:
```bash
npm start
```

3. To run as a Windows service, use a tool like `pm2` or `node-windows`.

### Option 2: Windows Task Scheduler

1. Create a new task in Windows Task Scheduler
2. Set trigger to "Daily" with "Repeat task every: 1 hour"
3. Set action to run `scripts/sync-wordpress-posts.bat`

### Option 3: Linux Cron Job

1. Add to crontab:
```bash
0 * * * * /path/to/scripts/sync-wordpress-posts.sh
```

## Usage

### Manual Sync
- Visit the WordPress Posts page (`/wordpress-posts`)
- Click "Sync Posts" button to manually fetch latest posts

### Newsletter Creation
- When creating a newsletter, click "Fetch Posts"
- Select posts from the stored database
- Newsletter content is automatically generated

### Post Management
- View all stored posts with search and filtering
- See post status, categories, and publication dates
- Click "View" to open original WordPress post

## Configuration

### Environment Variables
- `API_BASE_URL`: Base URL for API calls (default: http://localhost:3000)
- `LOG_FILE`: Path to log file for sync operations

### WordPress API Configuration
- WordPress API URL: `https://archalley.com/wp-json/wp/v2`
- Fetches up to 50 latest posts per sync
- Includes embedded media and taxonomy data

## Monitoring

### Log Files
- Sync operations are logged to `logs/wordpress-sync.log`
- Includes timestamps, success/failure status, and error details

### Database Monitoring
- Check `wordpress_posts` table for stored posts
- Monitor sync frequency and success rates
- Track post updates and modifications

## Troubleshooting

### Common Issues

1. **API Not Accessible**
   - Ensure the Next.js server is running
   - Check firewall settings for port 3000
   - Verify API_BASE_URL configuration

2. **WordPress API Errors**
   - Check if archalley.com is accessible
   - Verify WordPress REST API is enabled
   - Check for rate limiting

3. **Database Errors**
   - Ensure database connection is working
   - Check table permissions
   - Verify schema is properly created

### Manual Testing

Test the sync manually:
```bash
curl -X POST -H "x-automated-sync: true" http://localhost:3000/api/wordpress/sync-posts
```

Check stored posts:
```bash
curl http://localhost:3000/api/wordpress/posts-stored
```
