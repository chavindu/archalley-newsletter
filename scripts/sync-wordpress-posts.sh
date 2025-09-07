#!/bin/bash

# WordPress Posts Sync Cron Job
# This script runs every hour to sync WordPress posts from archalley.com

# Set the base URL for the API
API_BASE_URL="http://localhost:3000"
SYNC_ENDPOINT="$API_BASE_URL/api/wordpress/sync-posts"

# Log file
LOG_FILE="/var/log/wordpress-sync.log"

# Function to log messages
log_message() {
    echo "$(date '+%Y-%m-%d %H:%M:%S') - $1" >> "$LOG_FILE"
}

# Function to sync WordPress posts
sync_posts() {
    log_message "Starting WordPress posts sync..."
    
    # Make the API call with automated sync header
    response=$(curl -s -w "%{http_code}" -X POST \
        -H "Content-Type: application/json" \
        -H "x-automated-sync: true" \
        "$SYNC_ENDPOINT")
    
    # Extract HTTP status code (last 3 characters)
    http_code="${response: -3}"
    
    # Extract response body (everything except last 3 characters)
    response_body="${response%???}"
    
    if [ "$http_code" -eq 200 ]; then
        log_message "Sync successful: $response_body"
    else
        log_message "Sync failed with HTTP $http_code: $response_body"
    fi
}

# Check if API is accessible
check_api() {
    if curl -s -f "$API_BASE_URL/api/health" > /dev/null 2>&1; then
        return 0
    else
        log_message "API is not accessible at $API_BASE_URL"
        return 1
    fi
}

# Main execution
main() {
    log_message "WordPress posts sync cron job started"
    
    # Check if API is accessible
    if ! check_api; then
        log_message "Cannot sync posts - API not accessible"
        exit 1
    fi
    
    # Perform the sync
    sync_posts
    
    log_message "WordPress posts sync cron job completed"
}

# Run the main function
main
