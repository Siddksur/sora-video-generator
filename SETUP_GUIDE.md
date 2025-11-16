# Complete Setup Guide - Step by Step

This guide will walk you through setting up your Sora Video Generator app from scratch.

## Prerequisites

- Node.js 18+ installed
- A code editor (VS Code recommended)
- A GitHub account (for deployment)

---

## PHASE 1: Database Setup (PostgreSQL)

### Option A: Railway (Recommended for beginners)

1. **Go to Railway.app**
   - Visit [railway.app](https://railway.app)
   - Click "Start a New Project" or "Login"

2. **Deploy PostgreSQL**
   - Click "New Project"
   - Select "Deploy PostgreSQL"
   - Wait for it to deploy (takes ~30 seconds)

3. **Get Connection String**
   - Click on your PostgreSQL service
   - Go to the "Variables" tab
   - Find `DATABASE_URL`
   - Click "Copy" to copy the connection string
   - **Save this somewhere safe!**

### Option B: Neon (Alternative)

1. **Go to Neon.tech**
   - Visit [neon.tech](https://neon.tech)
   - Sign up for a free account

2. **Create Project**
   - Click "Create Project"
   - Choose a name and region
   - Click "Create Project"

3. **Get Connection String**
   - In your project dashboard, find "Connection string"
   - Copy the connection string
   - **Save this somewhere safe!**

---

## PHASE 2: Stripe Setup

### Step 1: Create Stripe Account

1. **Go to Stripe.com**
   - Visit [stripe.com](https://stripe.com)
   - Click "Sign up" (top right)
   - Complete registration

2. **Access Dashboard**
   - After signing up, you'll be in the Dashboard
   - Make sure you're in "Test mode" (toggle in top right)

### Step 2: Get API Keys

1. **Navigate to API Keys**
   - Click "Developers" in the left sidebar
   - Click "API keys"

2. **Copy Keys**
   - **Publishable key**: Copy the "Publishable key" (starts with `pk_test_`)
   - **Secret key**: Click "Reveal test key" and copy (starts with `sk_test_`)
   - **Save both keys!**

### Step 3: Set Up Webhook

1. **Create Webhook Endpoint**
   - Still in Developers section, click "Webhooks"
   - Click "Add endpoint"

2. **Configure Webhook**
   - **Endpoint URL**: For local development, use: `http://localhost:3000/api/stripe/webhook`
   - For production, use: `https://your-domain.com/api/stripe/webhook`
   - **Description**: "Sora Video Credits"
   - Click "Select events"

3. **Select Event**
   - Check "checkout.session.completed"
   - Click "Add events"

4. **Get Webhook Secret**
   - After creating, click on your webhook endpoint
   - Find "Signing secret" (starts with `whsec_`)
   - Click "Reveal" and copy it
   - **Save this secret!**

---

## PHASE 3: Project Installation

### Step 1: Install Dependencies

Open your terminal in the project directory and run:

```bash
npm install
```

This will install all required packages. Wait for it to complete (may take 2-3 minutes).

### Step 2: Environment Setup

1. **Create `.env.local` file**
   - In your project root, create a file named `.env.local`
   - Copy the contents from `env.example`

2. **Fill in Environment Variables**

   Open `.env.local` and fill in:

   ```env
   # Database - Paste your connection string from Railway/Neon
   DATABASE_URL="postgresql://user:password@host:5432/database?schema=public"

   # JWT Secret - Generate a random string (you can use: openssl rand -base64 32)
   JWT_SECRET="your-super-secret-jwt-key-change-this-in-production"

   # Stripe - Paste your keys from Stripe dashboard
   STRIPE_SECRET_KEY="sk_test_..."
   STRIPE_PUBLISHABLE_KEY="pk_test_..."
   STRIPE_WEBHOOK_SECRET="whsec_..."

   # n8n Webhook - Your existing webhook URL
   N8N_WEBHOOK_URL="https://siddharthsur.app.n8n.cloud/webhook/04a68a3e-772a-4a57-9b6e-8f583e76f024"

   # App URL - For local development
   NEXT_PUBLIC_APP_URL="http://localhost:3000"
   ```

   **Important**: Replace all placeholder values with your actual values!

### Step 3: Database Setup

1. **Generate Prisma Client**
   ```bash
   npm run db:generate
   ```

2. **Push Schema to Database**
   ```bash
   npm run db:push
   ```

   This creates all the tables in your database.

3. **(Optional) View Database**
   ```bash
   npm run db:studio
   ```
   This opens a visual database browser at http://localhost:5555

---

## PHASE 4: Create Initial Users

Since there's no registration page, you need to create users manually.

### Step 1: Edit User Creation Script

1. Open `scripts/create-users.ts`
2. Edit the `users` array with your actual user credentials:

```typescript
const users = [
  {
    username: 'client1',
    email: 'client1@example.com',
    password: 'password123', // Change this!
  },
  {
    username: 'client2',
    email: 'client2@example.com',
    password: 'password123', // Change this!
  },
  // Add more users as needed
]
```

**Important**: Change the passwords to secure ones!

### Step 2: Run User Creation Script

```bash
npm run create-users
```

You should see output like:
```
✓ Created/Updated user: client1 (client1@example.com)
✓ Created/Updated user: client2 (client2@example.com)
```

---

## PHASE 5: n8n Integration Updates

You need to modify your existing n8n workflow to work with this app.

### Step 1: Update Webhook Input

Your n8n webhook should expect this format:

```json
{
  "video_id": "string",
  "user_id": "string",
  "user_email": "string",
  "video_prompt": "string",
  "additional_details": "string",
  "callback_url": "string"
}
```

### Step 2: Add Callback Node

At the end of your n8n workflow, add an HTTP Request node:

1. **Method**: POST
2. **URL**: `{{ $json.callback_url }}`
3. **Body** (JSON):
```json
{
  "video_url": "{{ $json.video_url }}",
  "status": "completed",
  "n8n_task_id": "{{ $json.taskId }}"
}
```

This will notify your app when the video is ready.

---

## PHASE 6: Run the App

### Development Mode

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) in your browser.

### Test Login

1. Use one of the usernames/passwords you created
2. You should see the dashboard with 0 credits
3. Click "Buy Credits" to test Stripe integration

---

## PHASE 7: Deployment

### Option 1: Vercel (Recommended)

1. **Push to GitHub**
   - Create a new repository on GitHub
   - Push your code:
     ```bash
     git init
     git add .
     git commit -m "Initial commit"
     git remote add origin https://github.com/yourusername/your-repo.git
     git push -u origin main
     ```

2. **Deploy on Vercel**
   - Go to [vercel.com](https://vercel.com)
   - Click "Sign up" and connect your GitHub
   - Click "Add New Project"
   - Select your repository
   - Click "Import"

3. **Configure Environment Variables**
   - In Vercel project settings, go to "Environment Variables"
   - Add all variables from your `.env.local`:
     - `DATABASE_URL`
     - `JWT_SECRET`
     - `STRIPE_SECRET_KEY`
     - `STRIPE_PUBLISHABLE_KEY`
     - `STRIPE_WEBHOOK_SECRET`
     - `N8N_WEBHOOK_URL`
     - `NEXT_PUBLIC_APP_URL` (use your Vercel URL: `https://your-app.vercel.app`)

4. **Deploy**
   - Click "Deploy"
   - Wait for deployment to complete
   - Your app will be live!

5. **Update Stripe Webhook**
   - Go back to Stripe dashboard
   - Edit your webhook endpoint
   - Update URL to: `https://your-app.vercel.app/api/stripe/webhook`
   - Save

### Option 2: Railway

1. **Create New Project**
   - Go to [railway.app](https://railway.app)
   - Click "New Project"
   - Select "Deploy from GitHub repo"

2. **Configure**
   - Select your repository
   - Railway will auto-detect Next.js
   - Add environment variables in Railway dashboard
   - Deploy

---

## PHASE 8: Iframe Integration

Once deployed, add this iframe to your existing webapp:

```html
<iframe 
  src="https://your-app.vercel.app" 
  width="100%" 
  height="800px" 
  frameborder="0"
  style="border: none; border-radius: 10px;">
</iframe>
```

Replace `https://your-app.vercel.app` with your actual deployment URL.

---

## Troubleshooting

### Database Connection Issues

- Verify your `DATABASE_URL` is correct
- Make sure your database is running
- Check if your IP is whitelisted (for some providers)

### Stripe Webhook Not Working

- Make sure webhook URL is correct
- Verify `STRIPE_WEBHOOK_SECRET` matches Stripe dashboard
- Check Vercel logs for webhook errors
- Use Stripe CLI for local testing: `stripe listen --forward-to localhost:3000/api/stripe/webhook`

### Video Generation Not Working

- Verify `N8N_WEBHOOK_URL` is correct
- Check n8n workflow is receiving the webhook
- Verify callback URL is accessible from n8n
- Check browser console and server logs for errors

### Login Issues

- Make sure users are created: `npm run create-users`
- Verify JWT_SECRET is set
- Check database connection

---

## Support

If you encounter issues:
1. Check the browser console (F12)
2. Check server logs (terminal or Vercel logs)
3. Verify all environment variables are set correctly
4. Make sure database is accessible

---

## Next Steps

- Customize the UI styling
- Add email notifications
- Add more credit packages
- Implement user registration (if needed)
- Add admin dashboard

