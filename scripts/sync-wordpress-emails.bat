@echo off
REM WordPress Emails Sync Batch Script
REM This script runs the WordPress emails sync cron job

echo Starting WordPress emails sync...

REM Change to the scripts directory
cd /d "%~dp0"

REM Run the Node.js script
node sync-wordpress-emails.js

echo WordPress emails sync completed.
pause
