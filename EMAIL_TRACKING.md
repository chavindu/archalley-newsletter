# Email Tracking Implementation

This document explains how email tracking is implemented in the Archalley Newsletter platform.

## Overview

The email tracking system tracks two main metrics:
1. **Email Opens** - When recipients open the email
2. **Email Clicks** - When recipients click on links within the email

## Components

### 1. API Endpoints

#### `/api/track/open`
- **Method**: GET
- **Parameters**: 
  - `newsletterId` - ID of the newsletter
  - `email` - Recipient's email address
- **Function**: Updates the `opened_at` timestamp in the analytics table
- **Response**: Returns a 1x1 transparent PNG pixel

#### `/api/track/click`
- **Method**: GET
- **Parameters**:
  - `newsletterId` - ID of the newsletter
  - `email` - Recipient's email address
  - `url` - The original URL being tracked
- **Function**: Updates the `clicked_at` timestamp and redirects to the original URL
- **Response**: HTTP 302 redirect to the original URL

### 2. Email Template Updates

The email template (`lib/email.ts`) has been updated to include:

#### Tracking Pixel
- A 1x1 transparent image is added to the bottom of each email
- The pixel URL includes the newsletter ID and recipient email
- When the email is opened, the pixel loads and triggers the tracking

#### Click Tracking
- All links in the email are wrapped with tracking URLs
- The tracking URL includes the newsletter ID, recipient email, and original URL
- When clicked, the tracking endpoint logs the click and redirects to the original URL

### 3. Database Schema

The existing `newsletter_analytics` table stores tracking data:
- `opened_at` - Timestamp when email was opened (initially NULL)
- `clicked_at` - Timestamp when any link was clicked (initially NULL)

## How It Works

### Email Open Tracking
1. Email is sent with a tracking pixel: `<img src="/api/track/open?newsletterId=123&email=user@example.com" />`
2. When email client loads images, it requests the pixel
3. The API endpoint updates the `opened_at` field in the database
4. A 1x1 transparent PNG is returned

### Email Click Tracking
1. Original link: `https://archalley.com/post/123`
2. Becomes: `/api/track/click?newsletterId=123&email=user@example.com&url=https%3A//archalley.com/post/123`
3. When clicked, the API logs the click and redirects to the original URL

## Privacy Considerations

- Tracking only occurs when images are loaded (opens) and links are clicked
- Users who have images disabled by default won't be tracked for opens
- The tracking is transparent to users - they still reach their intended destination
- No personal data beyond email and newsletter ID is transmitted

## Analytics Dashboard

The existing analytics dashboard (`pages/analytics.tsx`) will now show:
- Open rates based on `opened_at` timestamps
- Click rates based on `clicked_at` timestamps
- Per-newsletter performance metrics

## Testing

To test the tracking:
1. Send a test newsletter
2. Open the email in an email client
3. Click on any link in the email
4. Check the analytics dashboard to see the tracking data

## Environment Variables

Ensure `NEXTAUTH_URL` is properly set in your environment variables as it's used to generate the tracking URLs.
