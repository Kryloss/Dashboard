# Welcome Email Edge Function Deployment Script (PowerShell)
# This script helps deploy the welcome email functionality to Supabase

Write-Host "🚀 Deploying Welcome Email Edge Function to Supabase..." -ForegroundColor Green

# Check if Supabase CLI is installed
try {
    $supabaseVersion = supabase --version 2>$null
    if ($LASTEXITCODE -ne 0) {
        throw "Supabase CLI not found"
    }
    Write-Host "✅ Supabase CLI found: $supabaseVersion" -ForegroundColor Green
} catch {
    Write-Host "❌ Supabase CLI not found. Installing..." -ForegroundColor Red
    npm install -g supabase
}

# Check if user is logged in
try {
    $status = supabase status 2>$null
    if ($LASTEXITCODE -ne 0) {
        Write-Host "🔐 Please log in to Supabase..." -ForegroundColor Yellow
        supabase login
    } else {
        Write-Host "✅ Already logged in to Supabase" -ForegroundColor Green
    }
} catch {
    Write-Host "🔐 Please log in to Supabase..." -ForegroundColor Yellow
    supabase login
}

# Deploy the function
Write-Host "📦 Deploying send-welcome-email function..." -ForegroundColor Blue
supabase functions deploy send-welcome-email

if ($LASTEXITCODE -eq 0) {
    Write-Host "✅ Welcome email function deployed successfully!" -ForegroundColor Green
    Write-Host ""
    Write-Host "📋 Next steps:" -ForegroundColor Cyan
    Write-Host "1. Set RESEND_API_KEY in your environment variables" -ForegroundColor White
    Write-Host "2. Test the signup flow with a new account" -ForegroundColor White
    Write-Host "3. Test the manual trigger from dashboard" -ForegroundColor White
    Write-Host "4. Check Edge Function logs in Supabase dashboard" -ForegroundColor White
    Write-Host ""
    Write-Host "🔗 View your functions: https://supabase.com/dashboard/project/[YOUR_PROJECT_ID]/functions" -ForegroundColor Blue
} else {
    Write-Host "❌ Deployment failed. Please check the error messages above." -ForegroundColor Red
    Write-Host ""
    Write-Host "💡 Troubleshooting tips:" -ForegroundColor Yellow
    Write-Host "- Make sure you're in the correct project directory" -ForegroundColor White
    Write-Host "- Check if you have the right permissions" -ForegroundColor White
    Write-Host "- Verify your Supabase project is set up correctly" -ForegroundColor White
}
