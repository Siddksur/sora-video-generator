# Sora Video Generator App

A Next.js web application for generating Sora videos via n8n automation with Stripe credit purchases.

## Features

- User authentication (username/password)
- Credit purchase system via Stripe
- Video generation form submission
- Real-time progress tracking
- Video dashboard with history
- Video preview and download

## Setup Instructions

### 1. Install Dependencies

```bash
npm install
```

### 2. Set Up Environment Variables

Copy `.env.local.example` to `.env.local` and fill in all values:

```bash
cp .env.local.example .env.local
```

Required variables:
- `DATABASE_URL` - PostgreSQL connection string
- `JWT_SECRET` - Random secret string for JWT tokens
- `STRIPE_SECRET_KEY` - From Stripe dashboard
- `STRIPE_PUBLISHABLE_KEY` - From Stripe dashboard
- `STRIPE_WEBHOOK_SECRET` - From Stripe webhook settings
- `N8N_WEBHOOK_URL` - Your n8n webhook URL
- `NEXT_PUBLIC_APP_URL` - Your app URL (http://localhost:3000 for dev)

### 3. Set Up Database

```bash
# Generate Prisma client
npm run db:generate

# Push schema to database
npm run db:push
```

### 4. Create Initial Users

Edit `scripts/create-users.ts` with your user credentials, then run:

```bash
npx ts-node scripts/create-users.ts
```

### 5. Run Development Server

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) in your browser.

## Stripe Setup

1. Go to [stripe.com](https://stripe.com) and create an account
2. Navigate to Developers > API keys
3. Copy your test keys to `.env.local`
4. Set up webhook endpoint:
   - URL: `https://your-domain.com/api/stripe/webhook`
   - Event: `checkout.session.completed`
   - Copy webhook secret to `.env.local`

## Database Setup

### Option 1: Railway

1. Go to [railway.app](https://railway.app)
2. Create new project > Deploy PostgreSQL
3. Copy connection string to `.env.local`

### Option 2: Neon

1. Go to [neon.tech](https://neon.tech)
2. Create new project
3. Copy connection string to `.env.local`

## n8n Integration

Your n8n workflow should:

1. Receive webhook with format:
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

2. Process video generation

3. Call callback URL with result:
```json
{
  "video_url": "string",
  "status": "completed",
  "n8n_task_id": "string"
}
```

## Deployment

### Vercel (Recommended)

1. Push code to GitHub
2. Go to [vercel.com](https://vercel.com)
3. Import your repository
4. Add environment variables
5. Deploy

### Iframe Integration

Add to your existing webapp:

```html
<iframe 
  src="https://your-app.vercel.app" 
  width="100%" 
  height="800px" 
  frameborder="0"
  style="border: none; border-radius: 10px;">
</iframe>
```

## Credit Packages

- 5 credits = $5.00
- 10 credits = $9.70
- 20 credits = $18.00
- 50 credits = $40.00

Each video generation costs 5 credits.

