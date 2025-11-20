# 🌐 Custom Domain Setup Guide

Complete guide to connect your Railway app to `agentgrowthhub.ai` domain.

---

## 🎯 Recommendation: Use Subdomain

**Recommended**: `ai-video-generator.agentgrowthhub.ai` (subdomain)
- ✅ Easier to set up
- ✅ Cleaner URL structure
- ✅ Better for SEO
- ✅ No path conflicts

**Alternative**: `agentgrowthhub.ai/ai-video-generator` (subpath)
- ⚠️ Requires reverse proxy setup
- ⚠️ More complex configuration
- ⚠️ May conflict with existing routes

---

## 📋 Option 1: Subdomain Setup (`ai-video-generator.agentgrowthhub.ai`)

### STEP 1: Configure DNS in GoDaddy

1. **Log into GoDaddy**
   - Go to [godaddy.com](https://godaddy.com)
   - Sign in to your account
   - Go to **"My Products"** → Click **"DNS"** next to `agentgrowthhub.ai`

2. **Add CNAME Record**
   - Click **"Add"** or **"+ Add Record"**
   - **Type**: Select **"CNAME"**
   - **Name**: `ai-video-generator` (just the subdomain part, NOT the full domain)
   - **Value**: Your Railway domain (e.g., `sora-video-generator-production-7bb7.up.railway.app`)
   - **TTL**: `600` (or leave default)
   - Click **"Save"**

3. **Verify DNS Record**
   - Wait 5-10 minutes for DNS propagation
   - You can check with: `nslookup ai-video-generator.agentgrowthhub.ai`
   - Or use: [whatsmydns.net](https://www.whatsmydns.net/#CNAME/ai-video-generator.agentgrowthhub.ai)

### STEP 2: Configure Railway Custom Domain

1. **Go to Railway Dashboard**
   - Navigate to your Next.js service
   - Click **"Settings"** tab
   - Scroll to **"Networking"** section

2. **Add Custom Domain**
   - Click **"Add Domain"** or **"Custom Domain"**
   - Enter: `ai-video-generator.agentgrowthhub.ai`
   - Click **"Add"**

3. **Railway will provide DNS instructions**
   - Railway may show you a CNAME or A record to add
   - **If Railway shows a CNAME**: Use the one from Step 1 above
   - **If Railway shows an A record**: Update GoDaddy DNS with the A record instead

4. **Wait for SSL Certificate**
   - Railway automatically provisions SSL certificate via Let's Encrypt
   - This takes 5-15 minutes
   - Check Railway dashboard for "Certificate issued" status

### STEP 3: Update Environment Variables

**In Railway Dashboard → Your Service → Variables:**

1. **Update `NEXT_PUBLIC_APP_URL`**
   - Old: `https://sora-video-generator-production-7bb7.up.railway.app`
   - New: `https://ai-video-generator.agentgrowthhub.ai`
   - ⚠️ **Important**: Include `https://`, no trailing slash

2. **Redeploy** (Railway will auto-redeploy when you save variables)

### STEP 4: Update Stripe Webhook URL

1. **Go to Stripe Dashboard** (LIVE mode)
   - Navigate to **Developers** → **Webhooks**
   - Click on your production webhook endpoint

2. **Update Endpoint URL**
   - Old: `https://sora-video-generator-production-7bb7.up.railway.app/api/stripe/webhook`
   - New: `https://ai-video-generator.agentgrowthhub.ai/api/stripe/webhook`
   - Click **"Update endpoint"**

3. **Stripe will regenerate webhook secret** (optional but recommended)
   - Click **"Reveal"** next to Signing secret
   - Copy the new secret
   - Update `STRIPE_WEBHOOK_SECRET` in Railway

### STEP 5: Update n8n Callback URL (if needed)

If your n8n workflow has the callback URL hardcoded:

1. **Go to n8n Dashboard**
2. **Find your video generation workflow**
3. **Update HTTP Request node** that calls your callback:
   - Old: `https://sora-video-generator-production-7bb7.up.railway.app/api/videos/callback`
   - New: `https://ai-video-generator.agentgrowthhub.ai/api/videos/callback`
4. **Save and activate workflow**

### STEP 6: Test Everything

- [ ] Visit `https://ai-video-generator.agentgrowthhub.ai` - should load your app
- [ ] Test login/signup
- [ ] Test Stripe checkout (webhook should fire)
- [ ] Test video generation (n8n callback should work)
- [ ] Verify SSL certificate (green lock in browser)

---

## 📋 Option 2: Subpath Setup (`agentgrowthhub.ai/ai-video-generator`)

⚠️ **This is more complex and requires a reverse proxy**

### Why It's Complex:
- Railway doesn't natively support subpaths
- You need to run a reverse proxy (Nginx, Cloudflare, etc.)
- Your main site needs to proxy requests to Railway
- Next.js routing needs special configuration

### If You Still Want This Option:

**You'll need:**
1. A server running Nginx/Apache to proxy requests
2. Or use Cloudflare Workers/Pages Functions
3. Or use Vercel/Netlify for the main site with rewrites

**Example Nginx Config:**
```nginx
location /ai-video-generator {
    proxy_pass https://sora-video-generator-production-7bb7.up.railway.app;
    proxy_set_header Host $host;
    proxy_set_header X-Real-IP $remote_addr;
    proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
    proxy_set_header X-Forwarded-Proto $scheme;
    
    # Rewrite paths
    rewrite ^/ai-video-generator/(.*)$ /$1 break;
}
```

**Next.js Config Changes:**
You'd need to update `next.config.js` to handle the base path:

```javascript
module.exports = {
  basePath: '/ai-video-generator',
  // ... rest of config
}
```

**This affects:**
- All internal links
- API routes
- Static assets
- Stripe redirects
- n8n callbacks

**Recommendation**: Stick with Option 1 (subdomain) unless you have a specific reason for subpath.

---

## 🔧 Backend Changes Summary

### What Needs Updating:

| Item | Old Value | New Value |
|------|-----------|-----------|
| `NEXT_PUBLIC_APP_URL` | `https://sora-video-generator-production-7bb7.up.railway.app` | `https://ai-video-generator.agentgrowthhub.ai` |
| Stripe Webhook URL | `https://sora-video-generator-production-7bb7.up.railway.app/api/stripe/webhook` | `https://ai-video-generator.agentgrowthhub.ai/api/stripe/webhook` |
| n8n Callback URL | `https://sora-video-generator-production-7bb7.up.railway.app/api/videos/callback` | `https://ai-video-generator.agentgrowthhub.ai/api/videos/callback` |

### What Doesn't Need Changing:

- ✅ Database URLs (unchanged)
- ✅ JWT_SECRET (unchanged)
- ✅ Stripe API keys (unchanged)
- ✅ n8n webhook URLs (unchanged - they're incoming, not outgoing)
- ✅ Code itself (no changes needed)

---

## 🚨 Troubleshooting

### Issue: DNS Not Resolving

**Solution:**
- Wait 24-48 hours for full DNS propagation
- Check DNS with: `nslookup ai-video-generator.agentgrowthhub.ai`
- Verify CNAME record in GoDaddy matches Railway domain exactly

### Issue: SSL Certificate Not Issuing

**Solution:**
- Ensure DNS is fully propagated first
- Check Railway logs for certificate errors
- Try removing and re-adding domain in Railway
- Contact Railway support if issues persist

### Issue: Stripe Webhook Failing

**Solution:**
- Verify new webhook URL is correct
- Check `STRIPE_WEBHOOK_SECRET` matches new webhook
- Test webhook in Stripe Dashboard → Send test webhook
- Check Railway logs for webhook errors

### Issue: App Shows Old Domain

**Solution:**
- Clear browser cache
- Verify `NEXT_PUBLIC_APP_URL` is updated in Railway
- Redeploy service (Railway should auto-redeploy)
- Check Railway networking settings

---

## ✅ Final Checklist

- [ ] DNS CNAME record added in GoDaddy
- [ ] Custom domain added in Railway
- [ ] SSL certificate issued (check Railway dashboard)
- [ ] `NEXT_PUBLIC_APP_URL` updated in Railway
- [ ] Stripe webhook URL updated
- [ ] Stripe webhook secret updated (if regenerated)
- [ ] n8n callback URL updated (if hardcoded)
- [ ] Test app loads at new domain
- [ ] Test Stripe checkout works
- [ ] Test video generation works
- [ ] Test n8n callback receives requests

---

## 📞 Support Resources

- **Railway Custom Domains**: [docs.railway.app/guides/custom-domains](https://docs.railway.app/guides/custom-domains)
- **GoDaddy DNS Help**: [godaddy.com/help](https://www.godaddy.com/help)
- **Stripe Webhooks**: [stripe.com/docs/webhooks](https://stripe.com/docs/webhooks)

---

*Last updated: 2025-01-16*



