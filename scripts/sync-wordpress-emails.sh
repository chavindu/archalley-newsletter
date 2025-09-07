#!/bin/bash

# WordPress Emails Sync Shell Script
# This script runs the WordPress emails sync cron job

echo "Starting WordPress emails sync..."

# Change to the scripts directory
cd "$(dirname "$0")"

# Run the Node.js script
node sync-wordpress-emails.js

echo "WordPress emails sync completed."
