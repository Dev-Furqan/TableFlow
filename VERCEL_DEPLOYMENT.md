# Vercel Deployment Guide

This guide walks you through deploying your TableFlow POS application to Vercel.

## Prerequisites

- Vercel account (https://vercel.com)
- MongoDB Atlas cluster (https://www.mongodb.com/cloud/atlas)
- Git repository pushed to GitHub, GitLab, or Bitbucket

## Step 1: Prepare Your Repository

1. Make sure all changes are committed to git:
   ```bash
   git add .
   git commit -m "Prepare for Vercel deployment"
   git push origin main
   ```

2. Ensure `.env.local` and any actual environment files are in `.gitignore`:
   ```bash
   # Already included in .gitignore
   ```

## Step 2: Set Up MongoDB Atlas

1. Go to [MongoDB Atlas](https://www.mongodb.com/cloud/atlas)
2. Create a new cluster or use an existing one
3. Create a database user with a strong password
4. Get your connection string: `mongodb+srv://username:password@cluster.mongodb.net/tableflow_pos`
5. Save this for later - you'll need it for environment variables

## Step 3: Generate Secure Secrets

Generate secure JWT secrets for production:

```bash
# On your local machine, run this to generate secure secrets:
node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"
```

Run this command twice to get two different secrets for:
- `JWT_ACCESS_SECRET`
- `JWT_REFRESH_SECRET`

## Step 4: Deploy to Vercel

### Option A: Using Vercel Dashboard

1. Go to [Vercel Dashboard](https://vercel.com/dashboard)
2. Click "Add New..." > "Project"
3. Import your GitHub/GitLab/Bitbucket repository
4. Select the repository for TableFlow POS
5. Accept default settings and click "Deploy"

### Option B: Using Vercel CLI

```bash
# Install Vercel CLI (if not already installed)
npm i -g vercel

# Login to Vercel
vercel login

# Deploy from your project directory
cd e:\Point Of Sale
vercel --prod
```

## Step 5: Configure Environment Variables

After deployment starts:

1. Go to your project settings in Vercel Dashboard
2. Navigate to "Settings" > "Environment Variables"
3. Add the following variables:

   ```
   NODE_ENV = production
   
   MONGODB_URI = mongodb+srv://username:password@cluster.mongodb.net/tableflow_pos?retryWrites=true&w=majority
   
   JWT_ACCESS_SECRET = (your generated secret from Step 3)
   
   JWT_REFRESH_SECRET = (your generated secret from Step 3)
   
   CLIENT_URL = https://your-domain.vercel.app
   
   ACCESS_TOKEN_MINUTES = 15
   
   REFRESH_TOKEN_DAYS = 7
   
   VITE_API_URL = https://your-domain.vercel.app/api
   
   VITE_SOCKET_URL = https://your-domain.vercel.app
   ```

   Note: Replace `your-domain` with your actual Vercel project name

4. Click "Save"

## Step 6: Redeploy

After adding environment variables:

1. In Vercel Dashboard, go to "Deployments"
2. Click on the latest deployment
3. Click "Redeploy" to rebuild with the new environment variables

## Step 7: Configure Custom Domain (Optional)

1. In Vercel Project Settings > "Domains"
2. Add your custom domain
3. Follow the DNS configuration steps provided by Vercel

## Troubleshooting

### Build Fails
- Check that all environment variables are set correctly
- Verify MongoDB connection string is valid
- Check build logs in Vercel Dashboard

### API Routes Not Working
- Ensure `vercel.json` routes configuration is correct
- Check server logs for errors
- Verify `CLIENT_URL` is set correctly

### Socket.io Connection Issues
- Verify `VITE_SOCKET_URL` matches your deployed domain
- Check that Socket.io is configured for production (already done)
- Review browser console for connection errors

### Database Connection Issues
- Verify MongoDB Atlas IP whitelist includes Vercel's IP ranges (or allow all IPs: 0.0.0.0/0 for testing)
- Test your connection string locally before deploying
- Check MongoDB Atlas network access settings

## Production Checklist

- [ ] All environment variables configured in Vercel
- [ ] MongoDB Atlas cluster created and whitelisted
- [ ] JWT secrets are unique and secure
- [ ] `CLIENT_URL` and `VITE_API_URL` point to production domain
- [ ] Vercel deployment shows as "Ready"
- [ ] Test login functionality
- [ ] Test API endpoints
- [ ] Test Socket.io real-time features

## Monitoring & Logs

Monitor your deployment:

1. **Vercel Logs**: Check real-time logs in Vercel Dashboard > Deployments
2. **Database**: Monitor MongoDB Atlas dashboard for connection issues
3. **Performance**: Use Vercel Analytics to track performance

## Performance Optimization

For production, consider:

1. Enable caching headers in `vercel.json`
2. Optimize database queries
3. Use CDN for static assets (already handled by Vercel)
4. Monitor and optimize bundle size

## SSL/HTTPS

Vercel automatically provides SSL certificates for all deployments. Your app is secure by default.

## Additional Resources

- [Vercel Documentation](https://vercel.com/docs)
- [MongoDB Atlas Documentation](https://docs.mongodb.com/atlas/)
- [Node.js on Vercel](https://vercel.com/docs/concepts/functions/serverless-functions)
