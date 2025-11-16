# Production Deployment Guide - Railway

This guide will walk you through deploying your Sora Video Generator app to Railway.

## Prerequisites

- Railway account (you already have this)
- GitHub account (for code hosting)
- Stripe account (already set up)

---

## STEP 1: Initialize Git Repository

1. **Open Terminal** in your project directory

2. **Initialize Git** (if not already done):
   ```bash
   git init
   git add .
   git commit -m "Initial commit - Ready for production"
   ```

3. **Create GitHub Repository**:
   - Go to [github.com](https://github.com)
   - Click "New repository"
   - Name it: `sora-video-generator` (or any name you prefer)
   - **Don't** initialize with README
   - Click "Create repository"

4. **Push to GitHub**:
   ```bash
   git remote add origin https://github.com/YOUR_USERNAME/YOUR_REPO_NAME.git
   git branch -M main
   git push -u origin main
   ```
   Replace `YOUR_USERNAME` and `YOUR_REPO_NAME` with your actual GitHub username and repository name.

---

## STEP 2: Deploy to Railway

### Option A: Deploy from GitHub (Recommended)

1. **Go to Railway Dashboard**
   - Visit [railway.app](https://railway.app)
   - Log in to your account

2. **Create New Project**
   - Click "New Project"
   - Select "Deploy from GitHub repo"
   - Authorize Railway to access your GitHub (if first time)
   - Select your repository: `sora-video-generator`
   - Click "Deploy Now"

3. **Railway will automatically**:
   - Detect it's a Next.js app
   - Start building
   - Deploy your app

### Option B: Deploy from CLI

1. **Install Railway CLI**:
   ```bash
   npm i -g @railway/cli
   railway login
   ```

2. **Deploy**:
   ```bash
   railway init
   railway up
   ```

---

## STEP 3: Configure Environment Variables

Once your app is deploying, you need to add environment variables:

1. **In Railway Dashboard**:
   - Click on your **Next.js service** (not PostgreSQL)
   - Go to "Variables" tab
   - Click "New Variable"

2. **Add these variables one by one**:

   ```
   DATABASE_URL
   ```
   - Value: Copy from your PostgreSQL service
   - In Railway: Click PostgreSQL service → Variables → Copy `DATABASE_URL`

   ```
   JWT_SECRET
   ```
   - Value: `b67eeb38e105fb336d08384767a166922a551b899ba23751177e14f14d205fcb7b313e5908c58e1782c35176b6be3296690845369fb43602ba8fcb801e9beb64`
   - (Use the same one from your .env.local)

   ```
   STRIPE_SECRET_KEY
   ```
   - Value: Your Stripe secret key (starts with `sk_live_` or `rk_live_`)
   - From Stripe Dashboard → Developers → API keys

   ```
   STRIPE_PUBLISHABLE_KEY
   ```
   - Value: Your Stripe publishable key (starts with `pk_live_`)
   - From Stripe Dashboard → Developers → API keys

   ```
   STRIPE_WEBHOOK_SECRET
   ```
   - Value: We'll get this after setting up webhook (leave empty for now)

   ```
   N8N_WEBHOOK_URL
   ```
   - Value: `https://siddharthsur.app.n8n.cloud/webhook/04a68a3e-772a-4a57-9b6e-8f583e76f024`

   ```
   NEXT_PUBLIC_APP_URL
   ```
   - Value: Your Railway app URL (we'll update this after deployment)
   - Format: `https://your-app-name.up.railway.app`
   - **Get this from Railway dashboard after deployment**

3. **Link PostgreSQL Service**:
   - In your Next.js service settings
   - Go to "Settings" → "Service" → "Connect to PostgreSQL"
   - Select your PostgreSQL service
   - Railway will automatically add `DATABASE_URL` (you can remove the manual one if duplicate)

---

## STEP 4: Get Your Production URL

1. **In Railway Dashboard**:
   - Click on your Next.js service
   - Go to "Settings" tab
   - Find "Generate Domain" or check "Networking" tab
   - Your URL will be: `https://your-app-name.up.railway.app`
   - **Copy this URL!**

2. **Update NEXT_PUBLIC_APP_URL**:
   - Go back to Variables
   - Update `NEXT_PUBLIC_APP_URL` with your Railway URL
   - Example: `https://sora-video-generator.up.railway.app`

---

## STEP 5: Set Up Stripe Webhook

1. **Go to Stripe Dashboard**:
   - Visit [dashboard.stripe.com](https://dashboard.stripe.com)
   - Make sure you're in **Live mode** (toggle in top right)

2. **Create Webhook Endpoint**:
   - Go to "Developers" → "Webhooks"
   - Click "Add endpoint"

3. **Configure Webhook**:
   - **Endpoint URL**: `https://your-railway-url.up.railway.app/api/stripe/webhook`
   - Replace `your-railway-url` with your actual Railway URL
   - **Description**: "Sora Video Credits - Production"
   - Click "Select events"

4. **Select Event**:
   - Check: `checkout.session.completed`
   - Click "Add events"

5. **Get Webhook Secret**:
   - After creating, click on your webhook endpoint
   - Find "Signing secret"
   - Click "Reveal" and copy it (starts with `whsec_`)

6. **Add to Railway**:
   - Go back to Railway → Your Next.js service → Variables
   - Update `STRIPE_WEBHOOK_SECRET` with the secret you just copied

---

## STEP 6: Run Database Migrations

Your database schema should already be set up, but let's verify:

1. **Option A: Use Railway CLI**:
   ```bash
   railway run npm run db:push
   ```

2. **Option B: Use Prisma Studio** (if needed):
   ```bash
   railway run npm run db:studio
   ```

---

## STEP 7: Create Production Users

You'll need to create users in production:

1. **Using Railway CLI**:
   ```bash
   railway run npm run create-users
   ```

2. **Or manually via Prisma Studio**:
   ```bash
   railway run npm run db:studio
   ```
   - This opens Prisma Studio in your browser
   - Navigate to User model
   - Create users manually

---

## STEP 8: Test Your Deployment

1. **Visit Your App**:
   - Go to: `https://your-railway-url.up.railway.app`
   - You should see the login page

2. **Test Login**:
   - Use credentials from `create-users.ts`
   - Should redirect to dashboard

3. **Test Stripe**:
   - Click "Buy Credits"
   - Use Stripe test card: `4242 4242 4242 4242`
   - Complete checkout
   - Verify credits are added

4. **Test Video Generation**:
   - Submit a video generation request
   - Verify it calls n8n webhook
   - Check video dashboard for status

---

## Troubleshooting

### App Won't Build

- Check Railway logs: Click service → "Deployments" → View logs
- Common issues:
  - Missing environment variables
  - Database connection issues
  - Build errors

### Database Connection Issues

- Verify `DATABASE_URL` is correct
- Make sure PostgreSQL service is running
- Check if service is linked in Railway

### Stripe Webhook Not Working

- Verify webhook URL is correct
- Check `STRIPE_WEBHOOK_SECRET` matches Stripe dashboard
- View Railway logs for webhook errors
- Test webhook in Stripe dashboard → Webhooks → Send test webhook

### 404 Errors

- Make sure `NEXT_PUBLIC_APP_URL` is set correctly
- Check Railway domain is generated
- Verify app is deployed successfully

---

## Next Steps

- Set up custom domain (optional)
- Configure monitoring/analytics
- Set up error tracking (Sentry, etc.)
- Add CI/CD for automatic deployments

---

## Quick Reference

**Railway Dashboard**: [railway.app](https://railway.app)  
**Stripe Dashboard**: [dashboard.stripe.com](https://dashboard.stripe.com)  
**Your App URL**: `https://your-app-name.up.railway.app`

