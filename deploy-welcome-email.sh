#!/bin/bash

# Welcome Email Edge Function Deployment Script
# This script helps deploy the welcome email functionality to Supabase

echo "🚀 Deploying Welcome Email Edge Function to Supabase..."

# Check if Supabase CLI is installed
if ! command -v supabase &> /dev/null; then
    echo "❌ Supabase CLI not found. Installing..."
    npm install -g supabase
fi

# Check if user is logged in
if ! supabase status &> /dev/null; then
    echo "🔐 Please log in to Supabase..."
    supabase login
fi

# Deploy the function
echo "📦 Deploying send-welcome-email function..."
supabase functions deploy send-welcome-email

if [ $? -eq 0 ]; then
    echo "✅ Welcome email function deployed successfully!"
    echo ""
    echo "📋 Next steps:"
    echo "1. Set RESEND_API_KEY in your environment variables"
    echo "2. Test the signup flow with a new account"
    echo "3. Test the manual trigger from dashboard"
    echo "4. Check Edge Function logs in Supabase dashboard"
    echo ""
    echo "🔗 View your functions: https://supabase.com/dashboard/project/[YOUR_PROJECT_ID]/functions"
else
    echo "❌ Deployment failed. Please check the error messages above."
    echo ""
    echo "💡 Troubleshooting tips:"
    echo "- Make sure you're in the correct project directory"
    echo "- Check if you have the right permissions"
    echo "- Verify your Supabase project is set up correctly"
fi
