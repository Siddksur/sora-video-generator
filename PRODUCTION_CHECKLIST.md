# 🚀 Production Deployment Checklist

Complete guide to take your Sora Video Generator app live in production.

---

## ⚠️ CRITICAL: Switch to Live Mode

**Before anything else, switch from Test Mode to Live Mode in all services:**

1. **Stripe**: Dashboard → Toggle "Test mode" to "Live mode" (top right)
2. **n8n**: Use production webhook URLs (not `/webhook-test/`)

---

## 📋 Pre-Deployment Checklist

### ✅ 1. Code & Repository
- [ ] All code is committed to Git
- [ ] Code is pushed to GitHub
- [ ] No test/debug code remaining
- [ ] All environment variables are documented in `env.example`

### ✅ 2. Database
- [ ] Production PostgreSQL database is created (Railway/Neon/etc.)
- [ ] Database migrations are ready
- [ ] Backup strategy is in place

### ✅ 3. Stripe Account
- [ ] Stripe account is fully activated (verified)
- [ ] Live API keys are available
- [ ] Business details are completed
- [ ] Bank account is connected for payouts

### ✅ 4. n8n Workflows
- [ ] Production webhooks are created (not test webhooks)
- [ ] Video generation workflow is tested in production
- [ ] Prompt enhancement workflow is tested in production
- [ ] Workflows have proper error handling

---

## 🔧 STEP 1: Environment Variables Setup

**In Railway Dashboard → Your Next.js Service → Variables Tab:**

### Required Variables:

| Variable | Description | Where to Get It |
|----------|-------------|-----------------|
| `DATABASE_URL` | PostgreSQL connection string | Railway PostgreSQL service → Variables |
| `JWT_SECRET` | Random secret string (min 32 chars) | Generate: `openssl rand -base64 32` |
| `STRIPE_SECRET_KEY` | **LIVE** Stripe secret key | Stripe Dashboard → Developers → API keys (LIVE mode) |
| `STRIPE_PUBLISHABLE_KEY` | **LIVE** Stripe publishable key | Stripe Dashboard → Developers → API keys (LIVE mode) |
| `STRIPE_WEBHOOK_SECRET` | Stripe webhook signing secret | See Step 3 below |
| `N8N_WEBHOOK_URL` | Production n8n webhook URL | Your n8n instance (replace `/webhook-test/` with `/webhook/`) |
| `N8N_PROMPT_ENHANCE_WEBHOOK_URL` | Prompt enhancement webhook | Your n8n instance |
| `NEXT_PUBLIC_APP_URL` | Your production app URL | Railway Dashboard → Service → Networking |

### Important Notes:

1. **STRIPE KEYS MUST BE LIVE KEYS:**
   - ✅ Starts with `sk_live_` (not `sk_test_`)
   - ✅ Starts with `pk_live_` (not `pk_test_`)
   - ⚠️ Test keys will NOT work in production!

2. **N8N WEBHOOKS MUST BE PRODUCTION:**
   - ❌ Don't use: `/webhook-test/...`
   - ✅ Use: `/webhook/...`

3. **NEXT_PUBLIC_APP_URL:**
   - Format: `https://your-app-name.up.railway.app`
   - Must include `https://` (not `http://`)
   - No trailing slash

---

## 🔐 STEP 2: Generate JWT Secret

If you don't have a JWT secret yet, generate one:

```bash
openssl rand -base64 32
```

Copy the output and use it for `JWT_SECRET` in Railway.

---

## 💳 STEP 3: Stripe Production Setup

### 3.1 Switch to Live Mode

1. Go to [Stripe Dashboard](https://dashboard.stripe.com)
2. **Toggle "Test mode" to "Live mode"** (top right corner)
3. ⚠️ **Confirm you're in Live mode** before proceeding

### 3.2 Get Live API Keys

1. Go to **Developers** → **API keys**
2. Copy **Publishable key** (starts with `pk_live_`)
3. Click **"Reveal live key token"** and copy **Secret key** (starts with `sk_live_`)
4. Add both to Railway environment variables

### 3.3 Set Up Production Webhook

1. In Stripe Dashboard (LIVE mode), go to **Developers** → **Webhooks**
2. Click **"Add endpoint"**
3. **Endpoint URL**: `https://your-railway-url.up.railway.app/api/stripe/webhook`
   - Replace `your-railway-url` with your actual Railway domain
   - Example: `https://sora-video-generator-production-7bb7.up.railway.app/api/stripe/webhook`
4. **Description**: "Sora Video Credits - Production"
5. Click **"Select events"**
6. Check: **`checkout.session.completed`**
7. Click **"Add events"**
8. Click **"Add endpoint"**

### 3.4 Get Webhook Secret

1. Click on your newly created webhook endpoint
2. Find **"Signing secret"** section
3. Click **"Reveal"** next to the secret
4. Copy the secret (starts with `whsec_`)
5. Add to Railway: `STRIPE_WEBHOOK_SECRET`

⚠️ **IMPORTANT**: 
- Each webhook endpoint has its own unique secret
- The secret from your TEST webhook won't work for LIVE
- You MUST create a new webhook in LIVE mode

---

## 🔗 STEP 4: n8n Production Webhooks

### 4.1 Video Generation Webhook

Make sure your production webhook URL is:
- ✅ `https://siddharthsur.app.n8n.cloud/webhook/[your-webhook-id]`
- ❌ NOT `/webhook-test/`

Update `N8N_WEBHOOK_URL` in Railway with your production webhook.

### 4.2 Prompt Enhancement Webhook

Verify your prompt enhancement webhook:
- ✅ `https://siddharthsur.app.n8n.cloud/webhook/[your-webhook-id]`
- ❌ NOT `/webhook-test/`

Update `N8N_PROMPT_ENHANCE_WEBHOOK_URL` in Railway if needed.

---

## 🌐 STEP 5: Update NEXT_PUBLIC_APP_URL

1. Go to Railway Dashboard → Your Next.js service
2. Go to **"Networking"** or **"Settings"** tab
3. Find your generated domain (e.g., `https://sora-video-generator-production-7bb7.up.railway.app`)
4. Copy the full URL with `https://`
5. Go to **Variables** tab
6. Update `NEXT_PUBLIC_APP_URL` with this URL
7. **Redeploy** your service after updating (Railway will auto-redeploy)

---

## 🗄️ STEP 6: Database Setup

### 6.1 Push Schema to Production Database

```bash
# Using Railway CLI
railway run npm run db:push

# Or connect to your database directly and run:
npx prisma db push --skip-generate
```

### 6.2 Verify Database Connection

Check Railway logs to ensure database connection is successful.

---

## 👥 STEP 7: Create Production Users

### Option A: Using Script (Recommended)

1. Update `scripts/create-users.ts` with production user credentials
2. Run:

```bash
railway run npm run create-users
```

### Option B: Using Prisma Studio

```bash
railway run npm run db:studio
```

Then create users manually through the web interface.

⚠️ **Security Note**: 
- Use strong passwords for production users
- Store credentials securely
- Consider implementing password reset functionality

---

## ✅ STEP 8: Testing Checklist

Test each feature thoroughly before announcing launch:

### 8.1 Authentication
- [ ] User can register new account
- [ ] User can login with existing account
- [ ] Login redirects to dashboard
- [ ] Logout works correctly
- [ ] Protected routes require authentication

### 8.2 Stripe Integration
- [ ] Credit purchase button opens Stripe checkout
- [ ] All credit packages are visible (5, 10, 20, 50 credits)
- [ ] Stripe checkout processes payment successfully
- [ ] After payment, user is redirected back to app
- [ ] Credits are added to user account automatically
- [ ] Transaction appears in Stripe Dashboard (LIVE mode)
- [ ] Webhook receives `checkout.session.completed` event

### 8.3 Video Generation
- [ ] User can enter prompt
- [ ] "Generate AI Prompt" button works
- [ ] Enhanced prompt appears and is editable
- [ ] Video generation form submits successfully
- [ ] 5 credits are deducted from user account
- [ ] Video request appears in dashboard with "pending" status
- [ ] n8n webhook is called with correct data
- [ ] Callback URL is correct in n8n payload

### 8.4 n8n Callback
- [ ] n8n can successfully POST to `/api/videos/callback`
- [ ] Video status updates from "pending" to "processing"
- [ ] Video status updates from "processing" to "completed"
- [ ] Video URL is saved correctly
- [ ] Email notification is sent (if enabled)

### 8.5 Video Dashboard
- [ ] Video preview plays correctly
- [ ] "Download Video" button downloads file
- [ ] "Ads Manager" button opens Facebook Ads Manager
- [ ] Stale videos show appropriate warning
- [ ] Delete button works for non-completed videos

### 8.6 Error Handling
- [ ] Insufficient credits shows error message
- [ ] Network errors show user-friendly messages
- [ ] Stripe errors are handled gracefully
- [ ] n8n webhook errors don't crash the app

---

## 🔍 STEP 9: Monitoring & Logs

### Railway Logs

1. Go to Railway Dashboard → Your service
2. Click **"Deployments"** tab
3. View logs for any errors or warnings
4. Set up log alerts if needed

### Stripe Dashboard

1. Monitor **Payments** → **All payments** for successful transactions
2. Check **Developers** → **Webhooks** → **Events** for webhook deliveries
3. Watch for failed webhook deliveries

### n8n Monitoring

1. Check n8n workflow execution history
2. Monitor for failed workflows
3. Verify webhook responses

---

## 🚨 Common Issues & Solutions

### Issue: Stripe Webhook Not Receiving Events

**Solution:**
- Verify webhook URL is correct in Stripe Dashboard
- Check `STRIPE_WEBHOOK_SECRET` matches the signing secret
- Ensure webhook is created in **LIVE mode**, not test mode
- Check Railway logs for webhook errors
- Test webhook in Stripe Dashboard → Webhooks → Send test webhook

### Issue: Credits Not Added After Payment

**Solution:**
- Check Railway logs for webhook processing errors
- Verify `STRIPE_WEBHOOK_SECRET` is correct
- Ensure database connection is working
- Check Stripe webhook events for `checkout.session.completed`

### Issue: n8n Webhook Returns 404

**Solution:**
- Verify webhook URL uses `/webhook/` not `/webhook-test/`
- Check n8n workflow is active (not paused)
- Verify webhook node is configured for POST requests
- Check n8n logs for errors

### Issue: Database Connection Errors

**Solution:**
- Verify `DATABASE_URL` in Railway is correct
- Check PostgreSQL service is running
- Ensure database service is linked to Next.js service
- Try reconnecting: Railway → Service → Settings → Connect to PostgreSQL

### Issue: App Shows "Invalid URL" Errors

**Solution:**
- Verify `NEXT_PUBLIC_APP_URL` includes `https://`
- Ensure no trailing slash: `https://app.up.railway.app` (not `https://app.up.railway.app/`)
- Redeploy after updating `NEXT_PUBLIC_APP_URL`

---

## 🔒 Security Checklist

- [ ] `JWT_SECRET` is at least 32 characters and random
- [ ] All environment variables are set in Railway (not in code)
- [ ] `.env.local` is in `.gitignore` (no secrets in Git)
- [ ] Database connection uses SSL (Railway PostgreSQL does this by default)
- [ ] Stripe webhook verification is enabled (checks `STRIPE_WEBHOOK_SECRET`)
- [ ] User passwords are hashed (using bcrypt)
- [ ] API routes validate authentication tokens
- [ ] HTTPS is enforced (Railway provides this automatically)

---

## 📊 Post-Launch Tasks

### Immediate (Day 1)
- [ ] Monitor error logs closely
- [ ] Test all payment flows
- [ ] Verify first video generation works end-to-end
- [ ] Check Stripe webhook deliveries are successful

### Week 1
- [ ] Set up error tracking (Sentry, LogRocket, etc.)
- [ ] Monitor Stripe dashboard for chargebacks/issues
- [ ] Track video generation success rate
- [ ] Gather user feedback

### Ongoing
- [ ] Regular database backups
- [ ] Monitor Railway usage/billing
- [ ] Monitor Stripe transaction fees
- [ ] Review and optimize n8n workflows
- [ ] Update dependencies regularly

---

## 🆘 Emergency Contacts & Resources

- **Railway Support**: [railway.app/dashboard](https://railway.app/dashboard) → Support
- **Stripe Support**: [support.stripe.com](https://support.stripe.com)
- **n8n Support**: [n8n.io/community](https://n8n.io/community)

---

## ✅ Final Pre-Launch Sign-Off

- [ ] All environment variables are set correctly
- [ ] All tests pass (see Step 8)
- [ ] Stripe webhook is configured and tested
- [ ] n8n webhooks are production URLs
- [ ] Database is migrated and has initial users
- [ ] App URL is accessible
- [ ] All features work end-to-end
- [ ] Error handling is tested
- [ ] Monitoring is set up

**🚀 Ready to launch!**

---

## Quick Reference

**Your Production URL**: `https://[your-railway-domain].up.railway.app`  
**Stripe Dashboard**: [dashboard.stripe.com](https://dashboard.stripe.com) (LIVE mode)  
**Railway Dashboard**: [railway.app/dashboard](https://railway.app/dashboard)  
**n8n Dashboard**: [siddharthsur.app.n8n.cloud](https://siddharthsur.app.n8n.cloud)

**Critical URLs**:
- Stripe Webhook: `https://[your-app-url]/api/stripe/webhook`
- n8n Callback: `https://[your-app-url]/api/videos/callback`

---

*Last updated: 2025-01-16*





