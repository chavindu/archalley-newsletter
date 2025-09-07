#!/bin/bash

# WordPress Emails Integration Setup Script
# This script helps set up the WordPress emails integration

echo "WordPress Emails Integration Setup"
echo "================================="

# Check if we're in the right directory
if [ ! -f "package.json" ]; then
    echo "Error: Please run this script from the project root directory"
    exit 1
fi

echo "1. Setting up database schema..."
echo "   The email_lists and subscribers tables should already exist."
echo "   Target email list ID: b163441c-e44d-4461-b600-ebe79e39644f"
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
echo "   cd scripts && npm run start-emails"
echo ""
echo "   Option B - Windows Task Scheduler:"
echo "   Create a task to run scripts/sync-wordpress-emails.bat daily"
echo ""
echo "   Option C - Linux Cron Job:"
echo "   0 0 * * * /path/to/scripts/sync-wordpress-emails.sh"
echo ""

echo "4. Testing the integration..."
echo "   Start your Next.js server: npm run dev"
echo "   Visit: http://localhost:3000/wordpress-emails"
echo "   Click 'Sync Emails' to test the integration"
echo ""

echo "5. Manual sync test:"
echo "   curl -X POST -H 'x-automated-sync: true' http://localhost:3000/api/wordpress/sync-emails"
echo ""

echo "6. API Configuration:"
echo "   WordPress API URL: https://archalley.com/wp-json/bitlab-custom-api/v1/user-emails"
echo "   Secret Key: OpSAn1GqqhJJw5hpBM5NO1j5mJjlWykr"
echo "   Target Email List ID: b163441c-e44d-4461-b600-ebe79e39644f"
echo ""

echo "Setup complete! Check the WordPress Emails page for more details."
