# Archalley Newsletter System - Administrator Standard Operating Procedures (SOP)

## Table of Contents
1. [System Overview](#system-overview)
2. [Getting Started](#getting-started)
3. [User Management](#user-management)
4. [Email List Management](#email-list-management)
5. [Newsletter Creation & Management](#newsletter-creation--management)
6. [WordPress Integration](#wordpress-integration)
7. [Ad Banner Management](#ad-banner-management)
8. [Analytics & Tracking](#analytics--tracking)
9. [System Configuration](#system-configuration)
10. [Troubleshooting](#troubleshooting)
11. [Maintenance Tasks](#maintenance-tasks)

---

## System Overview

The Archalley Newsletter System is a comprehensive email marketing platform that integrates with WordPress to automatically sync blog posts and create newsletters. The system provides:

- **User Management**: Admin and superadmin roles with Google OAuth authentication
- **Email List Management**: Organize subscribers into multiple lists
- **Newsletter Creation**: Automated newsletter generation from WordPress posts
- **WordPress Integration**: Automatic sync of posts and email subscribers
- **Ad Banner Management**: Include promotional banners in newsletters
- **Analytics**: Track open rates, click rates, and subscriber engagement
- **Automated Scheduling**: Send newsletters immediately or schedule for later

### System Architecture
- **Frontend**: Next.js with React and TypeScript
- **Backend**: Next.js API routes
- **Database**: Supabase (PostgreSQL)
- **Authentication**: NextAuth.js with Google OAuth
- **Email Delivery**: SMTP (configurable)
- **File Storage**: Vercel Blob for ad banner images

---

## Getting Started

### Accessing the System

1. Navigate to the admin portal URL
2. Click "Sign in with Google"
3. Use your authorized Google account to log in

*[Screenshot placeholder: Login screen]*

### Dashboard Overview

After logging in, you'll see the main dashboard with:
- **Email Lists**: Total number of email lists
- **Active Subscribers**: Current active subscriber count
- **Total Newsletters**: All newsletters created
- **Sent Newsletters**: Successfully sent newsletters

*[Screenshot placeholder: Dashboard overview]*

### Navigation Menu

The left sidebar provides access to:
- **Dashboard**: System overview and quick stats
- **Email Lists**: Manage subscriber lists
- **Newsletters**: Create and manage newsletters
- **WordPress Emails**: View WordPress subscriber sync
- **WordPress Posts**: View synced blog posts
- **Ad Banners**: Manage promotional banners
- **Analytics**: View newsletter performance
- **Users**: Manage admin users (superadmin only)

*[Screenshot placeholder: Navigation sidebar]*

---

## User Management

### User Roles

**Admin**:
- Create and manage newsletters
- Manage email lists and subscribers
- View analytics
- Manage ad banners

**Superadmin**:
- All admin privileges
- Create and manage other admin users
- Access to system configuration

### Adding New Admin Users

*Note: Only superadmins can add new users*

1. Navigate to **Users** in the sidebar
2. Click **"Add User"** button
3. Fill in the user details:
   - **Email**: Must be a valid Google account
   - **Name**: User's display name
   - **Role**: Select Admin or Superadmin
4. Click **"Save"**

*[Screenshot placeholder: Add user form]*

### Managing Existing Users

1. Go to **Users** page
2. View list of all users with their roles
3. Use the edit icon to modify user details
4. Use the delete icon to remove users (with confirmation)

*[Screenshot placeholder: Users list]*

**Important Notes**:
- Users must have a Google account to sign in
- Only pre-registered users can access the system
- The default superadmin is configured in the database

---

## Email List Management

### Creating Email Lists

1. Navigate to **Email Lists**
2. Click **"New Email List"**
3. Fill in the details:
   - **Name**: Descriptive name for the list
   - **Description**: Optional description
4. Click **"Save"**

*[Screenshot placeholder: Create email list form]*

### Managing Subscribers

#### Adding Individual Subscribers

1. Go to **Email Lists**
2. Click on the email list name
3. Click **"Add Subscriber"**
4. Enter the email address
5. Click **"Add"**

*[Screenshot placeholder: Add subscriber form]*

#### Importing Subscribers via CSV

1. From the email list page, click **"Import CSV"**
2. Download the CSV template if needed
3. Upload your CSV file with email addresses
4. Review the import preview
5. Click **"Import"** to confirm

*[Screenshot placeholder: CSV import interface]*

**CSV Format Requirements**:
```csv
email
subscriber1@example.com
subscriber2@example.com
```

#### Managing Subscriber Status

Subscribers can have the following statuses:
- **Active**: Will receive newsletters
- **Unsubscribed**: Opted out of emails
- **Bounced**: Email delivery failed

You can manually change subscriber status from the subscriber list.

*[Screenshot placeholder: Subscriber management]*

### WordPress Email Integration

The system automatically syncs email subscribers from WordPress:

1. Go to **WordPress Emails** to view synced subscribers
2. Click **"Sync Now"** to manually trigger synchronization
3. View sync statistics and logs

*[Screenshot placeholder: WordPress emails sync]*

---

## Newsletter Creation & Management

### Creating a New Newsletter

1. Navigate to **Newsletters**
2. Click **"New Newsletter"**
3. Enter newsletter title
4. Select WordPress posts to include
5. Choose email lists to send to
6. Select send options (immediate or scheduled)
7. Click **"Save & Send"** or **"Schedule"**

*[Screenshot placeholder: Newsletter creation form]*

### Post Selection Process

#### Filtering Posts by Category

1. In the newsletter creation form, view available WordPress posts
2. Use category filters to narrow down posts
3. Categories are automatically synced from WordPress

*[Screenshot placeholder: Post category filters]*

#### Selecting Posts for Newsletter

1. Browse through available posts
2. Click the checkbox next to posts you want to include
3. Selected posts will appear in the "Selected Posts" section
4. You can reorder posts by dragging them

*[Screenshot placeholder: Post selection interface]*

### Email List Selection

1. In the newsletter form, choose which email lists to send to
2. Multiple lists can be selected
3. The system will automatically deduplicate subscribers across lists

*[Screenshot placeholder: Email list selection]*

### Send Options

#### Send Immediately
- Select "Send Now" option
- Newsletter will be sent as soon as you save it

#### Schedule for Later
- Select "Schedule" option
- Choose date and time for sending
- Newsletter status will be "Scheduled" until sent

*[Screenshot placeholder: Send options]*

### Managing Existing Newsletters

#### Newsletter Status Types
- **Draft**: Not yet sent
- **Scheduled**: Waiting to be sent at specified time
- **Sent**: Successfully delivered

#### Newsletter Actions

From the newsletters list, you can:
- **Edit**: Modify draft newsletters
- **View**: Preview sent newsletters
- **Resend**: Send again to the same lists
- **Delete**: Remove newsletter (with confirmation)

*[Screenshot placeholder: Newsletter management]*

### Newsletter Content Structure

Newsletters automatically include:
1. **Header**: Archalley branding and logo
2. **Selected Posts**: With featured images, titles, and excerpts
3. **Ad Banner**: If selected (optional)
4. **Footer**: Unsubscribe links and social media
5. **Tracking Pixels**: For analytics

---

## WordPress Integration

### Automatic Post Synchronization

The system automatically syncs WordPress posts:

1. **Scheduled Sync**: Runs automatically via cron jobs
2. **Manual Sync**: Available from WordPress Posts page
3. **Real-time**: New posts appear in the system within hours

#### Viewing Synced Posts

1. Go to **WordPress Posts**
2. View all synced posts with:
   - Title and excerpt
   - Publication date
   - Featured image
   - Categories
   - Sync status

*[Screenshot placeholder: WordPress posts list]*

#### Manual Post Sync

1. From WordPress Posts page
2. Click **"Sync Now"**
3. View sync progress and results
4. Check logs for any errors

*[Screenshot placeholder: Manual sync interface]*

### WordPress Email Sync

The system syncs email subscribers from WordPress:

1. **Target Email List**: Configured in system settings
2. **Sync Frequency**: Automated via cron jobs
3. **Duplicate Handling**: Automatically managed
4. **Status Management**: Reactivates unsubscribed users if they re-subscribe on WordPress

#### Monitoring Email Sync

1. Go to **WordPress Emails**
2. View sync statistics:
   - Total fetched from WordPress
   - New subscribers added
   - Existing subscribers updated
   - Sync errors
3. Check sync logs for details

*[Screenshot placeholder: Email sync statistics]*

### Sync Configuration

WordPress integration requires:
- WordPress REST API access
- Email API endpoint configuration
- Cron job setup for automated syncing
- Security tokens for authentication

---

## Ad Banner Management

### Creating Ad Banners

1. Navigate to **Ad Banners**
2. Click **"New Ad Banner"**
3. Fill in banner details:
   - **Company Name**: Advertiser name
   - **Target URL**: Where clicks should go
   - **Alt Text**: Accessibility description
   - **Status**: Active/Inactive
   - **Start Date**: When banner becomes active (optional)
   - **End Date**: When banner expires (optional)
4. Upload banner image
5. Click **"Save"**

*[Screenshot placeholder: Create ad banner form]*

### Image Requirements

- **Aspect Ratio**: 34:9 (automatically enforced)
- **File Size**: Maximum 2MB
- **Formats**: PNG, JPEG, JPG, WebP, GIF
- **Output**: Automatically resized to 600px width

*[Screenshot placeholder: Image upload interface]*

### Managing Ad Banners

#### Banner Status Management

- **Active**: Available for selection in newsletters
- **Inactive**: Hidden from newsletter selection
- **Date-based**: Automatically active/inactive based on start/end dates

#### Banner Actions

From the ad banners list:
- **Edit**: Modify banner details and image
- **View**: Preview banner appearance
- **Delete**: Remove banner (soft delete)
- **Status Toggle**: Quick activate/deactivate

*[Screenshot placeholder: Ad banner management]*

### Using Ad Banners in Newsletters

1. During newsletter creation
2. In the "Ad Banner" section
3. Select from available active banners
4. Preview banner placement in newsletter
5. Banner appears between post content and footer

*[Screenshot placeholder: Ad banner selection in newsletter]*

---

## Analytics & Tracking

### Accessing Analytics

1. Navigate to **Analytics** from the sidebar
2. View comprehensive newsletter performance data

*[Screenshot placeholder: Analytics dashboard]*

### Key Metrics

#### Overall Statistics
- **Total Emails Sent**: Across all newsletters
- **Total Opens**: Unique email opens
- **Total Clicks**: Link clicks within newsletters
- **Average Open Rate**: Percentage across all campaigns

#### Newsletter-Specific Analytics
- **Individual Performance**: Per-newsletter statistics
- **Open Rate**: Percentage of recipients who opened
- **Click Rate**: Percentage who clicked links
- **Send Date**: When newsletter was delivered

*[Screenshot placeholder: Analytics metrics]*

### Understanding Tracking

#### Open Tracking
- Uses invisible tracking pixels
- Records when emails are opened
- Shows in analytics within minutes

#### Click Tracking
- All links are automatically tracked
- Redirects through tracking system
- Records click events and destinations

#### Unsubscribe Tracking
- Automatic unsubscribe link in every email
- Updates subscriber status immediately
- Tracked in analytics

### Interpreting Performance Data

#### Good Performance Indicators
- **Open Rate**: 20%+ is generally good
- **Click Rate**: 2-5% is typical
- **Growth**: Increasing subscriber base
- **Engagement**: Consistent opens/clicks

#### Performance Optimization
- **Subject Lines**: Test different approaches
- **Send Times**: Experiment with timing
- **Content**: Monitor which posts perform best
- **Frequency**: Avoid over-sending

*[Screenshot placeholder: Performance trends]*

---

## System Configuration

### Environment Variables

The system requires several environment variables to be configured:

#### Database Configuration
```env
NEXT_PUBLIC_SUPABASE_URL=your_supabase_project_url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key
SUPABASE_SERVICE_ROLE_KEY=your_supabase_service_role_key
```

#### Authentication
```env
NEXTAUTH_URL=https://yourdomain.com
NEXTAUTH_SECRET=your_nextauth_secret_key
GOOGLE_CLIENT_ID=your_google_client_id
GOOGLE_CLIENT_SECRET=your_google_client_secret
```

#### Email Configuration
```env
SMTP_SERVER=smtp.gmail.com
SMTP_PORT=587
SMTP_USERNAME=your_email@gmail.com
SMTP_PASSWORD=your_app_password
FROM_EMAIL=your_email@gmail.com
FROM_NAME=Archalley Newsletter
```

#### WordPress Integration
```env
WORDPRESS_EMAIL_SECRET=your_wordpress_email_secret
```

#### Security
```env
CRON_SECRET=your_random_cron_secret_key
BLOB_READ_WRITE_TOKEN=your_vercel_blob_token
```

### Database Setup

The system uses Supabase with the following main tables:
- **users**: Admin user management
- **email_lists**: Email list organization
- **subscribers**: Email subscriber data
- **newsletters**: Newsletter content and metadata
- **newsletter_analytics**: Tracking data
- **ad_banners**: Advertisement management
- **wordpress_posts**: Synced WordPress content

### SMTP Configuration

For email delivery, configure SMTP settings:

1. **Gmail Setup**:
   - Enable 2-factor authentication
   - Generate app-specific password
   - Use app password in SMTP_PASSWORD

2. **Other Providers**:
   - Update SMTP_SERVER and SMTP_PORT
   - Adjust authentication method if needed

### Cron Job Setup

For automated WordPress syncing:

1. **Vercel Deployment**: Automatic cron jobs
2. **Manual Setup**: Configure external cron service
3. **Monitoring**: Check sync logs regularly

---

## Troubleshooting

### Common Issues

#### Login Problems

**Issue**: "Access denied" error during login
**Solution**: 
1. Verify user email is registered in system
2. Check Google OAuth configuration
3. Ensure user has correct role assigned

*[Screenshot placeholder: Access denied error]*

#### Email Delivery Issues

**Issue**: Newsletters not being sent
**Solution**:
1. Check SMTP configuration
2. Verify email credentials
3. Check subscriber email validity
4. Review email provider limits

#### WordPress Sync Problems

**Issue**: Posts not syncing from WordPress
**Solution**:
1. Verify WordPress API accessibility
2. Check authentication tokens
3. Review cron job configuration
4. Check WordPress API permissions

#### Database Connection Issues

**Issue**: "Database error" messages
**Solution**:
1. Verify Supabase configuration
2. Check API keys and URLs
3. Review database permissions
4. Check Row Level Security policies

### Error Messages

#### "Unauthorized" Errors
- Check user authentication status
- Verify user role permissions
- Re-login if session expired

#### "Database Error" Messages
- Check network connectivity
- Verify database credentials
- Review query parameters

#### "SMTP Error" Messages
- Verify email server settings
- Check authentication credentials
- Review email content for spam triggers

### Performance Issues

#### Slow Newsletter Creation
- Check WordPress API response time
- Optimize image sizes
- Review database query performance

#### Slow Email Sending
- Check SMTP server performance
- Review email list sizes
- Consider batch sending optimization

---

## Maintenance Tasks

### Daily Tasks

#### Monitor System Health
1. Check dashboard for unusual metrics
2. Review any error notifications
3. Verify recent newsletter deliveries

#### Review Analytics
1. Check open and click rates
2. Monitor subscriber growth
3. Identify performance trends

### Weekly Tasks

#### WordPress Sync Verification
1. Verify posts are syncing correctly
2. Check for sync errors in logs
3. Manually sync if needed

#### Subscriber List Maintenance
1. Review bounced emails
2. Clean up invalid addresses
3. Monitor unsubscribe rates

#### Ad Banner Review
1. Check active banner performance
2. Update expired banners
3. Review upcoming campaigns

### Monthly Tasks

#### Performance Analysis
1. Generate monthly analytics report
2. Compare performance trends
3. Identify optimization opportunities

#### User Account Review
1. Review admin user access
2. Update user permissions if needed
3. Remove inactive accounts

#### System Updates
1. Review system logs for issues
2. Check for security updates
3. Backup important data

### Quarterly Tasks

#### Comprehensive System Review
1. Analyze overall system performance
2. Review and update SOPs
3. Plan system improvements

#### Security Audit
1. Review user access logs
2. Update authentication settings
3. Review API security

#### Data Cleanup
1. Archive old newsletters
2. Clean up old analytics data
3. Optimize database performance

---

## Best Practices

### Newsletter Creation
- Keep subject lines concise and engaging
- Include 3-5 high-quality posts per newsletter
- Test newsletters before sending
- Maintain consistent branding

### List Management
- Regularly clean bounced emails
- Segment lists by subscriber interests
- Monitor unsubscribe rates
- Respect subscriber preferences

### Performance Optimization
- Send newsletters at optimal times
- A/B test subject lines
- Monitor engagement metrics
- Adjust frequency based on performance

### Security
- Regularly update passwords
- Monitor user access logs
- Keep software updated
- Backup data regularly

---

## Support and Contact

For technical issues or questions about this SOP:

1. **System Logs**: Check application logs first
2. **Documentation**: Review this SOP document
3. **Database Logs**: Check Supabase logs for errors
4. **Email Logs**: Review SMTP delivery logs

### Emergency Procedures

In case of system outages:

1. **Check Service Status**: Verify all services are running
2. **Database Connectivity**: Test Supabase connection
3. **Email Service**: Verify SMTP functionality
4. **WordPress API**: Check WordPress site accessibility

---

## Appendix

### Keyboard Shortcuts
- **Ctrl+S**: Save forms
- **Ctrl+Enter**: Send newsletter (in creation form)
- **Escape**: Close modals and dialogs

### API Endpoints

Key API endpoints for integration:
- `/api/newsletters`: Newsletter management
- `/api/email-lists`: Email list operations
- `/api/wordpress/sync-posts`: WordPress post sync
- `/api/wordpress/sync-emails`: WordPress email sync
- `/api/analytics`: Performance data

### Database Schema

Main tables and relationships:
- Users → Newsletters (created_by)
- Email Lists → Subscribers (email_list_id)
- Newsletters → Newsletter Analytics (newsletter_id)
- Ad Banners → Newsletters (ad_banner_id)

---

*This SOP document should be updated regularly to reflect system changes and improvements. Last updated: [Current Date]*
