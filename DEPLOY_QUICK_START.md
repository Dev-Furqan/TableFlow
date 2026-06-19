# Quick Start: Deploy to Vercel in 5 Minutes

## 1. Prepare Your Code
```bash
git add .
git commit -m "Ready for Vercel deployment"
git push
```

## 2. Create MongoDB Atlas Account
- Sign up at https://www.mongodb.com/cloud/atlas
- Create a free cluster
- Add a database user
- Copy your connection string

## 3. Deploy to Vercel
Option A - Dashboard:
- Go to https://vercel.com/new
- Connect your Git repository
- Click Import and Deploy

Option B - CLI:
```bash
npm i -g vercel
vercel --prod
```

## 4. Add Environment Variables in Vercel Dashboard
Settings > Environment Variables

Copy and fill these values:

```
NODE_ENV=production

MONGODB_URI=mongodb+srv://username:password@cluster.mongodb.net/tableflow_pos?retryWrites=true&w=majority

JWT_ACCESS_SECRET=(run: node -e "console.log(require('crypto').randomBytes(32).toString('hex'))")

JWT_REFRESH_SECRET=(run: node -e "console.log(require('crypto').randomBytes(32).toString('hex'))")

CLIENT_URL=https://your-project.vercel.app

VITE_API_URL=https://your-project.vercel.app/api

VITE_SOCKET_URL=https://your-project.vercel.app
```

## 5. Redeploy
Click the latest deployment > "Redeploy" to apply environment variables

## Done! ✅
Your app is live at `https://your-project.vercel.app`

---

## Important: MongoDB Whitelist

Make sure to add Vercel's IP range to MongoDB Atlas:
1. Go to MongoDB Atlas > Network Access
2. Click "Add IP Address"  
3. Enter `0.0.0.0/0` (allow all) for testing, or [Vercel IPs](https://vercel.com/docs/concepts/edge-network/regions-and-edge-middleware#serverless-regions) for production

---

## Troubleshooting

**Build fails?**
- Check Environment Variables are set
- Verify MONGODB_URI is correct
- Check build logs in Deployments tab

**API 502 errors?**
- Check server logs in Deployments > Runtime logs
- Verify database connection
- Check CLIENT_URL is correct

**Pages 404?**
- Verify vercel.json routes are correct
- Check client build output in .vercelignore

---

For detailed guide, see: [VERCEL_DEPLOYMENT.md](./VERCEL_DEPLOYMENT.md)
