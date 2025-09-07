#!/bin/bash

# WordPress Posts Integration Setup Script
# This script helps set up the WordPress posts integration

echo "WordPress Posts Integration Setup"
echo "================================"

# Check if we're in the right directory
if [ ! -f "package.json" ]; then
    echo "Error: Please run this script from the project root directory"
    exit 1
fi

echo "1. Setting up database schema..."
echo "   Please run the SQL commands from lib/wordpress-posts-schema.sql"
echo "   in your PostgreSQL database to create the wordpress_posts table."
echo ""

echo "2. Installing cron job dependencies..."
if [ -d "scripts" ]; then
    cd scripts
    if [ -f "package.json" ]; then
        npm install
        echo "   ✓ Dependencies installed"
    else
        echo "   ⚠ No package.json found in scripts directory"
    fi
    cd ..
else
    echo "   ⚠ Scripts directory not found"
fi

echo ""
echo "3. Setting up automated sync..."
echo "   Choose your preferred method:"
echo ""
echo "   Option A - Node.js Cron Job (Recommended):"
echo "   cd scripts && npm start"
echo ""
echo "   Option B - Windows Task Scheduler:"
echo "   Create a task to run scripts/sync-wordpress-posts.bat every hour"
echo ""
echo "   Option C - Linux Cron Job:"
echo "   0 * * * * /path/to/scripts/sync-wordpress-posts.sh"
echo ""

echo "4. Testing the integration..."
echo "   Start your Next.js server: npm run dev"
echo "   Visit: http://localhost:3000/wordpress-posts"
echo "   Click 'Sync Posts' to test the integration"
echo ""

echo "5. Manual sync test:"
echo "   curl -X POST -H 'x-automated-sync: true' http://localhost:3000/api/wordpress/sync-posts"
echo ""

echo "Setup complete! Check the documentation in wordpress-posts-integration.md for more details."
