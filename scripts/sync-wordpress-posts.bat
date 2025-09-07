@echo off
REM WordPress Posts Sync Cron Job for Windows
REM This script runs every hour to sync WordPress posts from archalley.com

setlocal enabledelayedexpansion

REM Set the base URL for the API
set API_BASE_URL=http://localhost:3000
set SYNC_ENDPOINT=%API_BASE_URL%/api/wordpress/sync-posts

REM Log file
set LOG_FILE=C:\inetpub\wwwroot\archalley-newsletter\logs\wordpress-sync.log

REM Create logs directory if it doesn't exist
if not exist "C:\inetpub\wwwroot\archalley-newsletter\logs" mkdir "C:\inetpub\wwwroot\archalley-newsletter\logs"

REM Function to log messages
:log_message
echo %date% %time% - %~1 >> "%LOG_FILE%"
goto :eof

REM Function to sync WordPress posts
:sync_posts
call :log_message "Starting WordPress posts sync..."

REM Make the API call with automated sync header
curl -s -w "%%{http_code}" -X POST -H "Content-Type: application/json" -H "x-automated-sync: true" "%SYNC_ENDPOINT%" > temp_response.txt 2>nul

REM Extract HTTP status code (last 3 characters)
for /f %%i in ('powershell -command "(Get-Content temp_response.txt -Raw).Length"') do set response_length=%%i
set /a status_code_start=%response_length%-3
for /f "skip=%status_code_start%" %%i in (temp_response.txt) do set http_code=%%i

REM Extract response body (everything except last 3 characters)
set /a body_length=%response_length%-3
for /f "tokens=1*" %%i in ('powershell -command "Get-Content temp_response.txt -Raw | Select-Object -First 1 | ForEach-Object { $_.Substring(0, %body_length%) }"') do set response_body=%%i

if "%http_code%"=="200" (
    call :log_message "Sync successful: %response_body%"
) else (
    call :log_message "Sync failed with HTTP %http_code%: %response_body%"
)

REM Clean up temp file
del temp_response.txt 2>nul
goto :eof

REM Check if API is accessible
:check_api
curl -s -f "%API_BASE_URL%/api/health" >nul 2>&1
if %errorlevel% equ 0 (
    goto :eof
) else (
    call :log_message "API is not accessible at %API_BASE_URL%"
    exit /b 1
)

REM Main execution
:main
call :log_message "WordPress posts sync cron job started"

REM Check if API is accessible
call :check_api
if %errorlevel% neq 0 (
    call :log_message "Cannot sync posts - API not accessible"
    exit /b 1
)

REM Perform the sync
call :sync_posts

call :log_message "WordPress posts sync cron job completed"
goto :eof

REM Run the main function
call :main
