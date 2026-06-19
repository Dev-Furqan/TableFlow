#!/bin/bash
# Generate secure JWT secrets for production
echo "Generating secure JWT secrets..."
echo ""
echo "JWT_ACCESS_SECRET:"
node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"
echo ""
echo "JWT_REFRESH_SECRET:"
node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"
echo ""
echo "Copy these to your Vercel Environment Variables"
