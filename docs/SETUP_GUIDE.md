# Vita -- Complete Setup Guide

> **From prototype to production.** This guide walks through every integration,
> service, and configuration needed to take Vita from a local dev build to a
> live, production-grade social connection platform.

**Stack:** Next.js 16 (App Router) | Supabase | Tailwind CSS v4 | TypeScript

---

## Table of Contents

1. [Prerequisites](#1-prerequisites)
2. [Supabase Setup](#2-supabase-setup)
3. [Environment Variables](#3-environment-variables)
4. [Mapbox Setup](#4-mapbox-setup)
5. [Stripe Setup (Vita Gold)](#5-stripe-setup-vita-gold)
6. [AI Wingman Setup](#6-ai-wingman-setup)
7. [Push Notifications (Firebase)](#7-push-notifications-firebase)
8. [Identity Verification (Blue Tier)](#8-identity-verification-blue-tier)
9. [Error Monitoring (Sentry)](#9-error-monitoring-sentry)
10. [Deployment](#10-deployment)
11. [Post-Deployment Checklist](#11-post-deployment-checklist)

---

## 1. Prerequisites

Before you begin, make sure you have:

- **Node.js 20+** and **npm 10+** (or pnpm/yarn)
- **Git** installed and this repo cloned
- Accounts on: Supabase, Mapbox, Stripe, OpenAI (or Anthropic), Firebase, Sentry, Vercel
- A **Twilio** account for SMS OTP

```bash
# Verify your environment
node -v   # Should be >= 20.0.0
npm -v    # Should be >= 10.0.0

# Install dependencies
cd Vita-Social
npm install

# Start the dev server (prototype mode -- no env vars needed)
npm run dev
```

> **Note:** The app runs in "prototype mode" when Supabase env vars are missing.
> The Supabase clients in `src/lib/supabase/client.ts` and `server.ts` return
> `null`, and the middleware in `src/lib/supabase/middleware.ts` passes requests
> through without auth checks. This lets you develop UI without any backend.

---

## 2. Supabase Setup

### 2.1 Create a Supabase Project

1. Go to [supabase.com](https://supabase.com) and sign in.
2. Click **New Project**.
3. Choose your organization, then fill in:
   - **Name:** `vita-production` (or `vita-staging` for a staging env)
   - **Database Password:** Generate a strong password and **save it** -- you will need it for direct DB connections.
   - **Region:** Choose the region closest to your target users (e.g. `us-east-1` for US East).
4. Click **Create new project** and wait for provisioning (~2 minutes).

### 2.2 Copy Your API Credentials

Once the project is ready, go to **Settings > API** and copy:

| Value | Where to find it |
|---|---|
| **Project URL** | `Settings > API > Project URL` |
| **Anon (public) key** | `Settings > API > Project API keys > anon / public` |
| **Service role key** | `Settings > API > Project API keys > service_role` (keep this SECRET) |

Add them to your `.env.local`:

```env
NEXT_PUBLIC_SUPABASE_URL=https://your-project-ref.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
SUPABASE_SERVICE_ROLE_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
```

> **IMPORTANT:** The `service_role` key bypasses Row Level Security. Never
> expose it in client-side code. Only use it in server-side API routes and
> Server Actions.

### 2.3 Run SQL Migrations

Vita's database schema is defined in the `supabase/migrations/` directory. The
schema includes these core tables (mirrored by the types in
`src/types/database.ts`):

| Table | Purpose |
|---|---|
| `users` | User profiles (phone, name, photos, interests, verification, subscription) |
| `groups` | Community groups with privacy tiers |
| `group_memberships` | Membership join table with health ring tracking |
| `events` | Location-based events with GPS check-in |
| `check_ins` | GPS-verified attendance records |
| `matches` | Swipe actions (like, pass, super-like) |
| `conversations` | Chat conversation containers |
| `messages` | Individual chat messages |

**Option A -- Using the Supabase CLI (recommended):**

```bash
# Install the Supabase CLI
npm install -g supabase

# Login to Supabase
supabase login

# Link to your project
supabase link --project-ref YOUR_PROJECT_REF

# Run all pending migrations
supabase db push
```

**Option B -- Manual SQL via the Dashboard:**

If you don't have migrations files yet, run the following bootstrap SQL in the
Supabase **SQL Editor** (`Database > SQL Editor > New query`):

```sql
-- =============================================
-- Vita Database Schema
-- =============================================

-- Enable PostGIS for location queries
CREATE EXTENSION IF NOT EXISTS postgis;

-- Custom ENUM types
CREATE TYPE gender AS ENUM ('male', 'female', 'non-binary', 'other');
CREATE TYPE verification_level AS ENUM ('none', 'photo', 'id');
CREATE TYPE subscription_tier AS ENUM ('free', 'plus', 'premium');
CREATE TYPE privacy_tier AS ENUM ('public', 'private', 'secret');
CREATE TYPE group_role AS ENUM ('member', 'moderator', 'admin', 'owner');
CREATE TYPE event_visibility AS ENUM ('public', 'group', 'private');
CREATE TYPE swipe_action AS ENUM ('like', 'pass', 'super-like');
CREATE TYPE message_type AS ENUM ('text', 'image', 'system');

-- ── Users ──
CREATE TABLE users (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  phone_number TEXT UNIQUE NOT NULL,
  first_name TEXT NOT NULL,
  birthdate DATE NOT NULL,
  gender gender NOT NULL DEFAULT 'other',
  bio TEXT,
  verification_level verification_level NOT NULL DEFAULT 'none',
  location GEOGRAPHY(POINT, 4326),
  last_active_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  subscription_tier subscription_tier NOT NULL DEFAULT 'free',
  avatar_url TEXT,
  photos TEXT[] NOT NULL DEFAULT '{}',
  interests TEXT[] NOT NULL DEFAULT '{}'
);

-- ── Groups ──
CREATE TABLE groups (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  description TEXT,
  privacy_tier privacy_tier NOT NULL DEFAULT 'public',
  cover_image_url TEXT,
  member_count INT NOT NULL DEFAULT 0,
  location GEOGRAPHY(POINT, 4326),
  created_by UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- ── Group Memberships ──
CREATE TABLE group_memberships (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  group_id UUID NOT NULL REFERENCES groups(id) ON DELETE CASCADE,
  role group_role NOT NULL DEFAULT 'member',
  health_reset_at TIMESTAMPTZ,
  joined_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  vouched_by UUID REFERENCES users(id),
  UNIQUE(user_id, group_id)
);

-- ── Events ──
CREATE TABLE events (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  title TEXT NOT NULL,
  description TEXT,
  location GEOGRAPHY(POINT, 4326) NOT NULL,
  location_name TEXT NOT NULL,
  starts_at TIMESTAMPTZ NOT NULL,
  ends_at TIMESTAMPTZ NOT NULL,
  visibility event_visibility NOT NULL DEFAULT 'public',
  max_capacity INT,
  check_in_radius_miles DOUBLE PRECISION NOT NULL DEFAULT 1.0,
  host_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  group_id UUID REFERENCES groups(id) ON DELETE SET NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- ── Check-ins ──
CREATE TABLE check_ins (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  event_id UUID NOT NULL REFERENCES events(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  location GEOGRAPHY(POINT, 4326) NOT NULL,
  verified BOOLEAN NOT NULL DEFAULT false,
  checked_in_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE(event_id, user_id)
);

-- ── Matches ──
CREATE TABLE matches (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  target_user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  action swipe_action NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE(user_id, target_user_id)
);

-- ── Conversations ──
CREATE TABLE conversations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  participant_ids UUID[] NOT NULL,
  last_message_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- ── Messages ──
CREATE TABLE messages (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  conversation_id UUID NOT NULL REFERENCES conversations(id) ON DELETE CASCADE,
  sender_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  content TEXT NOT NULL,
  message_type message_type NOT NULL DEFAULT 'text',
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  read_at TIMESTAMPTZ
);

-- ── Indexes ──
CREATE INDEX idx_users_location ON users USING GIST (location);
CREATE INDEX idx_events_location ON events USING GIST (location);
CREATE INDEX idx_events_starts_at ON events (starts_at);
CREATE INDEX idx_messages_conversation ON messages (conversation_id, created_at);
CREATE INDEX idx_matches_user ON matches (user_id, target_user_id);
CREATE INDEX idx_group_memberships_user ON group_memberships (user_id);
CREATE INDEX idx_group_memberships_group ON group_memberships (group_id);
CREATE INDEX idx_check_ins_event ON check_ins (event_id);
```

### 2.4 Enable Row Level Security (RLS)

RLS is **critical** -- without it, any authenticated user can read/write any
row. Run these policies in the SQL Editor:

```sql
-- Enable RLS on every table
ALTER TABLE users ENABLE ROW LEVEL SECURITY;
ALTER TABLE groups ENABLE ROW LEVEL SECURITY;
ALTER TABLE group_memberships ENABLE ROW LEVEL SECURITY;
ALTER TABLE events ENABLE ROW LEVEL SECURITY;
ALTER TABLE check_ins ENABLE ROW LEVEL SECURITY;
ALTER TABLE matches ENABLE ROW LEVEL SECURITY;
ALTER TABLE conversations ENABLE ROW LEVEL SECURITY;
ALTER TABLE messages ENABLE ROW LEVEL SECURITY;

-- ── Users ──
-- Users can read any profile (discovery requires it)
CREATE POLICY "Users are viewable by authenticated users"
  ON users FOR SELECT
  TO authenticated
  USING (true);

-- Users can update only their own profile
CREATE POLICY "Users can update own profile"
  ON users FOR UPDATE
  TO authenticated
  USING (auth.uid() = id)
  WITH CHECK (auth.uid() = id);

-- Users are inserted via auth trigger (see below)
CREATE POLICY "Users can insert own profile"
  ON users FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = id);

-- ── Matches ──
CREATE POLICY "Users can insert own matches"
  ON matches FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can view own matches"
  ON matches FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id OR auth.uid() = target_user_id);

-- ── Conversations ──
CREATE POLICY "Users can view own conversations"
  ON conversations FOR SELECT
  TO authenticated
  USING (auth.uid() = ANY(participant_ids));

CREATE POLICY "Users can insert conversations they participate in"
  ON conversations FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = ANY(participant_ids));

-- ── Messages ──
CREATE POLICY "Users can view messages in their conversations"
  ON messages FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM conversations
      WHERE conversations.id = messages.conversation_id
        AND auth.uid() = ANY(conversations.participant_ids)
    )
  );

CREATE POLICY "Users can send messages in their conversations"
  ON messages FOR INSERT
  TO authenticated
  WITH CHECK (
    auth.uid() = sender_id
    AND EXISTS (
      SELECT 1 FROM conversations
      WHERE conversations.id = messages.conversation_id
        AND auth.uid() = ANY(conversations.participant_ids)
    )
  );

-- ── Groups ──
CREATE POLICY "Public groups are viewable by all authenticated users"
  ON groups FOR SELECT
  TO authenticated
  USING (privacy_tier = 'public' OR EXISTS (
    SELECT 1 FROM group_memberships
    WHERE group_memberships.group_id = groups.id
      AND group_memberships.user_id = auth.uid()
  ));

CREATE POLICY "Authenticated users can create groups"
  ON groups FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = created_by);

-- ── Group Memberships ──
CREATE POLICY "Members can view memberships in their groups"
  ON group_memberships FOR SELECT
  TO authenticated
  USING (
    user_id = auth.uid()
    OR EXISTS (
      SELECT 1 FROM group_memberships gm
      WHERE gm.group_id = group_memberships.group_id
        AND gm.user_id = auth.uid()
    )
  );

CREATE POLICY "Users can join public groups"
  ON group_memberships FOR INSERT
  TO authenticated
  WITH CHECK (
    auth.uid() = user_id
    AND EXISTS (
      SELECT 1 FROM groups
      WHERE groups.id = group_memberships.group_id
        AND groups.privacy_tier = 'public'
    )
  );

-- ── Events ──
CREATE POLICY "Public events are viewable by all"
  ON events FOR SELECT
  TO authenticated
  USING (visibility = 'public' OR host_id = auth.uid() OR EXISTS (
    SELECT 1 FROM group_memberships
    WHERE group_memberships.group_id = events.group_id
      AND group_memberships.user_id = auth.uid()
  ));

CREATE POLICY "Authenticated users can create events"
  ON events FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = host_id);

-- ── Check-ins ──
CREATE POLICY "Users can insert own check-ins"
  ON check_ins FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can view check-ins for events they attend or host"
  ON check_ins FOR SELECT
  TO authenticated
  USING (
    user_id = auth.uid()
    OR EXISTS (
      SELECT 1 FROM events
      WHERE events.id = check_ins.event_id
        AND events.host_id = auth.uid()
    )
  );
```

### 2.5 Enable Realtime

Vita uses Supabase Realtime for live chat in the messages tab. Enable it for
the `messages` and `conversations` tables:

1. Go to **Database > Replication** in the Supabase Dashboard.
2. Under **Realtime**, toggle ON these tables:
   - `messages`
   - `conversations`

Or run via SQL:

```sql
-- Enable Realtime for messages
ALTER PUBLICATION supabase_realtime ADD TABLE messages;

-- Enable Realtime for conversations
ALTER PUBLICATION supabase_realtime ADD TABLE conversations;
```

### 2.6 Configure Supabase Auth (Phone OTP via Twilio)

Vita uses **phone number authentication** with SMS OTP -- no email/password.
The login flow is defined in `src/app/(auth)/login/page.tsx` and the OTP
verification is in `src/app/(auth)/verify/page.tsx`.

#### Step 1: Set Up a Twilio Account

1. Go to [twilio.com](https://www.twilio.com/) and create an account.
2. From the **Twilio Console**, note your:
   - **Account SID** (starts with `AC`)
   - **Auth Token**
3. Go to **Messaging > Services** and create a new Messaging Service.
   - Give it a name like `Vita Auth`.
   - Add a phone number as a sender (buy one if needed, or use the trial number).
   - Note the **Messaging Service SID** (starts with `MG`).
4. **For production:** Upgrade from trial so SMS is not restricted to verified numbers.

#### Step 2: Configure Phone Auth in Supabase

1. In the Supabase Dashboard, go to **Authentication > Providers**.
2. Enable the **Phone** provider.
3. Select **Twilio** as the SMS provider.
4. Enter your Twilio credentials:
   - **Account SID:** `ACxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx`
   - **Auth Token:** `xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx`
   - **Messaging Service SID:** `MGxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx`
5. Set **OTP expiry** to `300` seconds (5 minutes).
6. Customize the **SMS message body**:
   ```
   Your Vita verification code is: {{ .Code }}
   ```
7. Click **Save**.

#### Step 3: Configure Redirect URLs

In **Authentication > URL Configuration**:

- **Site URL:** `https://your-domain.com` (production) or `http://localhost:3000` (dev)
- **Redirect URLs (allow list):**
  ```
  http://localhost:3000/**
  https://your-domain.com/**
  https://*.vercel.app/**
  ```

### 2.7 Set Up Supabase Storage

Vita uses Supabase Storage for user avatars (1 per user) and profile photos
(1-6 per user, defined by `MAX_PHOTOS` in `src/lib/constants.ts`).

#### Create Buckets

In the Supabase Dashboard, go to **Storage** and create two buckets:

| Bucket | Public | Description |
|---|---|---|
| `avatars` | Yes | User profile avatars |
| `photos` | Yes | User profile photos (up to 6) |

Or via SQL:

```sql
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES
  ('avatars', 'avatars', true, 5242880, ARRAY['image/jpeg', 'image/png', 'image/webp']),
  ('photos', 'photos', true, 5242880, ARRAY['image/jpeg', 'image/png', 'image/webp']);
```

> **5242880 bytes = 5 MB.** This keeps uploads reasonable for mobile users on
> cellular connections.

#### Storage Policies

```sql
-- Avatars: anyone can view, authenticated users upload their own
CREATE POLICY "Avatar images are publicly accessible"
  ON storage.objects FOR SELECT
  USING (bucket_id = 'avatars');

CREATE POLICY "Users can upload their own avatar"
  ON storage.objects FOR INSERT
  TO authenticated
  WITH CHECK (
    bucket_id = 'avatars'
    AND (storage.foldername(name))[1] = auth.uid()::text
  );

CREATE POLICY "Users can update their own avatar"
  ON storage.objects FOR UPDATE
  TO authenticated
  USING (
    bucket_id = 'avatars'
    AND (storage.foldername(name))[1] = auth.uid()::text
  );

CREATE POLICY "Users can delete their own avatar"
  ON storage.objects FOR DELETE
  TO authenticated
  USING (
    bucket_id = 'avatars'
    AND (storage.foldername(name))[1] = auth.uid()::text
  );

-- Photos: anyone can view, authenticated users manage their own
CREATE POLICY "Photo images are publicly accessible"
  ON storage.objects FOR SELECT
  USING (bucket_id = 'photos');

CREATE POLICY "Users can upload their own photos"
  ON storage.objects FOR INSERT
  TO authenticated
  WITH CHECK (
    bucket_id = 'photos'
    AND (storage.foldername(name))[1] = auth.uid()::text
  );

CREATE POLICY "Users can update their own photos"
  ON storage.objects FOR UPDATE
  TO authenticated
  USING (
    bucket_id = 'photos'
    AND (storage.foldername(name))[1] = auth.uid()::text
  );

CREATE POLICY "Users can delete their own photos"
  ON storage.objects FOR DELETE
  TO authenticated
  USING (
    bucket_id = 'photos'
    AND (storage.foldername(name))[1] = auth.uid()::text
  );
```

> **Upload path convention:** Store files as `{user_id}/filename.jpg` so the
> RLS policies above work correctly. Example:
> `avatars/550e8400-e29b-41d4-a716-446655440000/avatar.jpg`

---

## 3. Environment Variables

Create a `.env.local` file at the project root. Here is the complete list of
every variable the app needs:

```env
# ─── Supabase ───
NEXT_PUBLIC_SUPABASE_URL=https://your-project-ref.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJhbGciOi...
SUPABASE_SERVICE_ROLE_KEY=eyJhbGciOi...

# ─── Mapbox ───
NEXT_PUBLIC_MAPBOX_TOKEN=pk.eyJ1Ijoi...

# ─── Stripe (Vita Gold subscriptions) ───
NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY=pk_test_...
STRIPE_SECRET_KEY=sk_test_...
STRIPE_WEBHOOK_SECRET=whsec_...

# ─── AI Wingman ───
OPENAI_API_KEY=sk-...

# ─── Firebase Cloud Messaging (Push Notifications) ───
NEXT_PUBLIC_FIREBASE_CONFIG={"apiKey":"...","authDomain":"...","projectId":"...","storageBucket":"...","messagingSenderId":"...","appId":"..."}

# ─── Sentry (Error Monitoring) ───
SENTRY_DSN=https://examplePublicKey@o0.ingest.sentry.io/0
SENTRY_AUTH_TOKEN=sntrys_...

# ─── Identity Verification (optional, for Blue tier) ───
PERSONA_API_KEY=persona_...
PERSONA_TEMPLATE_ID=itmpl_...
```

> **Prefix convention:** Variables prefixed with `NEXT_PUBLIC_` are exposed to
> the browser. Everything else stays server-side only. Never put secret keys
> behind `NEXT_PUBLIC_`.

---

## 4. Mapbox Setup

The map page at `src/app/(main)/map/page.tsx` currently renders a placeholder
CSS "fake map" background. To integrate a real interactive map:

### 4.1 Create a Mapbox Account

1. Go to [mapbox.com](https://www.mapbox.com/) and sign up.
2. Go to your **Account** page.
3. Copy your **Default public token** (starts with `pk.`).
4. Add it to `.env.local`:
   ```env
   NEXT_PUBLIC_MAPBOX_TOKEN=pk.eyJ1IjoieW91ci11c2VybmFtZSIsImEiOiJjbGFi...
   ```

### 4.2 Install Dependencies

```bash
npm install mapbox-gl
npm install -D @types/mapbox-gl
```

### 4.3 Integration Notes

The map page in `src/app/(main)/map/page.tsx` currently uses a static CSS
background with positioned event pins. To replace it with a live Mapbox map:

1. **Replace the fake map `<div>`** (the one with the gradient background and
   CSS grid overlay) with a Mapbox GL JS `<Map>` container.

2. **Use a wrapper component** for Mapbox GL since it requires `"use client"` and
   direct DOM access:

```tsx
// src/components/map/mapbox-map.tsx
"use client";

import { useEffect, useRef } from "react";
import mapboxgl from "mapbox-gl";
import "mapbox-gl/dist/mapbox-gl.css";

mapboxgl.accessToken = process.env.NEXT_PUBLIC_MAPBOX_TOKEN!;

interface MapboxMapProps {
  onMapReady?: (map: mapboxgl.Map) => void;
  className?: string;
}

export function MapboxMap({ onMapReady, className }: MapboxMapProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const mapRef = useRef<mapboxgl.Map | null>(null);

  useEffect(() => {
    if (!containerRef.current || mapRef.current) return;

    const map = new mapboxgl.Map({
      container: containerRef.current,
      style: "mapbox://styles/mapbox/light-v11",
      center: [-73.935242, 40.73061], // Default: NYC
      zoom: 13,
    });

    map.addControl(
      new mapboxgl.GeolocateControl({
        positionOptions: { enableHighAccuracy: true },
        trackUserLocation: true,
      })
    );

    mapRef.current = map;
    onMapReady?.(map);

    return () => { map.remove(); };
  }, [onMapReady]);

  return <div ref={containerRef} className={className} />;
}
```

3. **Event pins** from `src/components/map/event-pin.tsx` should be converted
   to Mapbox markers using `mapboxgl.Marker` with custom HTML elements, placed
   at each event's `GeoPoint` coordinates.

4. **Map style recommendation:** Use `mapbox://styles/mapbox/light-v11` for
   light mode and `mapbox://styles/mapbox/dark-v11` for dark mode to match
   Vita's clean Swiss-design aesthetic.

> **Pricing note:** Mapbox offers 50,000 free map loads/month. Beyond that,
> pricing is $5 per 1,000 loads. Monitor usage in your Mapbox dashboard.

---

## 5. Stripe Setup (Vita Gold)

Vita Gold is the premium subscription tier at **$9.99/month** (with a 7-day
free trial), as defined in the `GoldUpsell` component at
`src/components/profile/gold-upsell.tsx`. Benefits include unlimited super
likes, profile view insights, super vouch, and priority discovery.

### 5.1 Create a Stripe Account

1. Go to [stripe.com](https://stripe.com) and create an account.
2. Complete business verification for production payouts.
3. Copy your keys from **Developers > API keys**:
   - **Publishable key** (starts with `pk_test_` or `pk_live_`)
   - **Secret key** (starts with `sk_test_` or `sk_live_`)

### 5.2 Create the Vita Gold Product

In the Stripe Dashboard, go to **Products > + Add product**:

| Field | Value |
|---|---|
| **Name** | Vita Gold |
| **Description** | Premium subscription with unlimited super likes, profile view insights, super vouch, and priority discovery. |
| **Pricing model** | Recurring |
| **Amount** | $9.99 |
| **Billing period** | Monthly |
| **Free trial** | 7 days |

Note the **Price ID** (starts with `price_`). You will need it in your
checkout code.

Or create via the Stripe CLI:

```bash
# Install the Stripe CLI
# macOS: brew install stripe/stripe-cli/stripe
# Windows: scoop install stripe

stripe products create \
  --name="Vita Gold" \
  --description="Premium subscription with unlimited super likes, profile view insights, super vouch, and priority discovery."

# Note the product ID (prod_xxx), then create the price:
stripe prices create \
  --product=prod_xxx \
  --unit-amount=999 \
  --currency=usd \
  --recurring[interval]=month \
  --recurring[trial-period-days]=7
```

### 5.3 Create the Webhook Endpoint

Create an API route at `src/app/api/webhooks/stripe/route.ts`:

```typescript
// src/app/api/webhooks/stripe/route.ts
import { NextRequest, NextResponse } from "next/server";
import Stripe from "stripe";

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!);
const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET!;

export async function POST(req: NextRequest) {
  const body = await req.text();
  const sig = req.headers.get("stripe-signature")!;

  let event: Stripe.Event;

  try {
    event = stripe.webhooks.constructEvent(body, sig, webhookSecret);
  } catch (err) {
    console.error("Webhook signature verification failed:", err);
    return NextResponse.json({ error: "Invalid signature" }, { status: 400 });
  }

  switch (event.type) {
    case "customer.subscription.created":
    case "customer.subscription.updated": {
      const subscription = event.data.object as Stripe.Subscription;
      const customerId = subscription.customer as string;

      // Look up Supabase user by Stripe customer ID
      // Update their subscription_tier to 'premium'
      // Example:
      // await supabaseAdmin.from('users')
      //   .update({ subscription_tier: 'premium' })
      //   .eq('stripe_customer_id', customerId);
      break;
    }
    case "customer.subscription.deleted": {
      const subscription = event.data.object as Stripe.Subscription;
      const customerId = subscription.customer as string;

      // Downgrade user back to 'free'
      // await supabaseAdmin.from('users')
      //   .update({ subscription_tier: 'free' })
      //   .eq('stripe_customer_id', customerId);
      break;
    }
    case "invoice.payment_failed": {
      // Handle failed payment -- notify user, retry logic
      break;
    }
  }

  return NextResponse.json({ received: true });
}
```

> **Note:** You will need to add a `stripe_customer_id` column to the `users`
> table to link Supabase users to Stripe customers:
> ```sql
> ALTER TABLE users ADD COLUMN stripe_customer_id TEXT UNIQUE;
> ```

### 5.4 Register the Webhook in Stripe

**For production:**

1. Go to **Developers > Webhooks** in Stripe Dashboard.
2. Click **Add endpoint**.
3. Enter your URL: `https://your-domain.com/api/webhooks/stripe`
4. Select events to listen for:
   - `customer.subscription.created`
   - `customer.subscription.updated`
   - `customer.subscription.deleted`
   - `invoice.payment_failed`
5. Copy the **Signing secret** (starts with `whsec_`) to your env vars.

**For local development:**

```bash
# Forward Stripe webhooks to your local server
stripe listen --forward-to localhost:3000/api/webhooks/stripe

# The CLI will print a webhook signing secret -- copy it:
# > Ready! Your webhook signing secret is whsec_xxxxx
```

Add the webhook secret to `.env.local`:

```env
STRIPE_WEBHOOK_SECRET=whsec_xxxxx
```

### 5.5 Configure the Customer Portal

For users to manage their subscription (cancel, update payment method):

1. In Stripe Dashboard, go to **Settings > Billing > Customer portal**.
2. Enable:
   - Cancel subscription
   - Update payment method
   - View invoices
3. Customize the branding to match Vita (navy primary color `#1A365D`).

### 5.6 Install the Stripe SDK

```bash
npm install stripe @stripe/stripe-js
```

---

## 6. AI Wingman Setup

The AI Wingman feature generates context-aware icebreaker suggestions in new
conversations. The component is at `src/components/messages/ai-icebreaker.tsx`
and currently uses a static interest-to-prompt map. To make it dynamic with AI:

### 6.1 Get an API Key

**Option A -- OpenAI:**

1. Go to [platform.openai.com](https://platform.openai.com).
2. Go to **API keys** and create a new secret key.
3. Add to `.env.local`:
   ```env
   OPENAI_API_KEY=sk-...
   ```

**Option B -- Anthropic (Claude):**

1. Go to [console.anthropic.com](https://console.anthropic.com).
2. Create an API key.
3. Add to `.env.local`:
   ```env
   ANTHROPIC_API_KEY=sk-ant-...
   ```

### 6.2 Install the SDK

```bash
# For OpenAI
npm install openai

# For Anthropic
npm install @anthropic-ai/sdk
```

### 6.3 Create the API Route

Create `src/app/api/ai/icebreaker/route.ts`:

```typescript
// src/app/api/ai/icebreaker/route.ts
import { NextRequest, NextResponse } from "next/server";
import OpenAI from "openai";

const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });

export async function POST(req: NextRequest) {
  try {
    const { sharedInterests, userBio, targetBio } = await req.json();

    const completion = await openai.chat.completions.create({
      model: "gpt-4o-mini",
      temperature: 0.9,
      max_tokens: 300,
      messages: [
        {
          role: "system",
          content: `You are Vita's AI Wingman -- a warm, witty conversation starter
for a social connection app. Your job is to generate 3 icebreaker messages that
feel natural, playful, and specific to the users' shared interests.

Rules:
- Keep each suggestion under 120 characters
- Be warm and genuine, never cheesy or generic
- Reference specific shared interests when possible
- Vary the tone: one playful, one thoughtful, one activity-suggestion
- Never be inappropriate or overly forward
- Format: Return ONLY a JSON array of 3 strings, no other text`,
        },
        {
          role: "user",
          content: `Shared interests: ${sharedInterests.join(", ")}
User's bio: ${userBio || "Not provided"}
Match's bio: ${targetBio || "Not provided"}

Generate 3 icebreakers:`,
        },
      ],
    });

    const content = completion.choices[0].message.content || "[]";
    const suggestions = JSON.parse(content);

    return NextResponse.json({ suggestions });
  } catch (error) {
    console.error("AI Icebreaker error:", error);
    // Fall back to static suggestions so the feature never fully breaks
    return NextResponse.json({
      suggestions: [
        "What's the best thing that happened to you this week?",
        "If you could teleport anywhere right now, where would you go?",
        "What's something you're really passionate about?",
      ],
    });
  }
}
```

### 6.4 Update the Icebreaker Component

Modify `src/components/messages/ai-icebreaker.tsx` to call the API route
instead of using the static `generateIcebreakers` function:

```typescript
// Inside AiIcebreaker component, replace the static prompts with:
const [prompts, setPrompts] = useState<string[]>([]);
const [loading, setLoading] = useState(true);

useEffect(() => {
  async function fetchIcebreakers() {
    try {
      const res = await fetch("/api/ai/icebreaker", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ sharedInterests }),
      });
      const data = await res.json();
      setPrompts(data.suggestions);
    } catch {
      // Fall back to static prompts
      setPrompts(generateIcebreakers(sharedInterests));
    } finally {
      setLoading(false);
    }
  }
  fetchIcebreakers();
}, [sharedInterests]);
```

> **Cost note:** Using `gpt-4o-mini`, each icebreaker request costs roughly
> $0.0003. At 10,000 daily conversations, that is about $3/day.

---

## 7. Push Notifications (Firebase)

Push notifications alert users about new matches, messages, event reminders,
and health ring warnings.

### 7.1 Create a Firebase Project

1. Go to [console.firebase.google.com](https://console.firebase.google.com).
2. Click **Add project** and name it `vita-app`.
3. Disable Google Analytics (optional for now).
4. Once created, go to **Project settings > General**.
5. Under **Your apps**, click the web icon (`</>`) to register a web app.
   - App nickname: `vita-web`
   - Skip Firebase Hosting.
6. Copy the **Firebase config** object:

```javascript
const firebaseConfig = {
  apiKey: "AIzaSy...",
  authDomain: "vita-app.firebaseapp.com",
  projectId: "vita-app",
  storageBucket: "vita-app.appspot.com",
  messagingSenderId: "123456789",
  appId: "1:123456789:web:abcdef"
};
```

7. Stringify it and add to `.env.local`:

```env
NEXT_PUBLIC_FIREBASE_CONFIG={"apiKey":"AIzaSy...","authDomain":"vita-app.firebaseapp.com","projectId":"vita-app","storageBucket":"vita-app.appspot.com","messagingSenderId":"123456789","appId":"1:123456789:web:abcdef"}
```

### 7.2 Enable Cloud Messaging

1. In Firebase Console, go to **Project settings > Cloud Messaging**.
2. Under **Web Push certificates**, click **Generate key pair**.
3. Copy the **VAPID key** -- you will need it when subscribing to push.

### 7.3 Install Firebase SDK

```bash
npm install firebase
```

### 7.4 Create the Firebase Client

```typescript
// src/lib/firebase.ts
import { initializeApp, getApps } from "firebase/app";
import { getMessaging, getToken, onMessage } from "firebase/messaging";

const firebaseConfig = JSON.parse(
  process.env.NEXT_PUBLIC_FIREBASE_CONFIG || "{}"
);

const app = getApps().length === 0 ? initializeApp(firebaseConfig) : getApps()[0];

export async function requestNotificationPermission(): Promise<string | null> {
  try {
    const permission = await Notification.requestPermission();
    if (permission !== "granted") return null;

    const messaging = getMessaging(app);
    const token = await getToken(messaging, {
      vapidKey: "YOUR_VAPID_KEY_HERE",
    });

    return token;
  } catch (error) {
    console.error("Push notification error:", error);
    return null;
  }
}

export function onForegroundMessage(callback: (payload: unknown) => void) {
  const messaging = getMessaging(app);
  return onMessage(messaging, callback);
}
```

### 7.5 Create the Service Worker

Create `public/firebase-messaging-sw.js`:

```javascript
// public/firebase-messaging-sw.js
importScripts("https://www.gstatic.com/firebasejs/10.12.0/firebase-app-compat.js");
importScripts("https://www.gstatic.com/firebasejs/10.12.0/firebase-messaging-compat.js");

firebase.initializeApp({
  apiKey: "YOUR_API_KEY",
  authDomain: "vita-app.firebaseapp.com",
  projectId: "vita-app",
  storageBucket: "vita-app.appspot.com",
  messagingSenderId: "YOUR_SENDER_ID",
  appId: "YOUR_APP_ID",
});

const messaging = firebase.messaging();

messaging.onBackgroundMessage((payload) => {
  const { title, body, icon } = payload.notification || {};

  self.registration.showNotification(title || "Vita", {
    body: body || "You have a new notification",
    icon: icon || "/icon-192x192.png",
    badge: "/badge-72x72.png",
    data: payload.data,
    actions: [
      { action: "open", title: "Open" },
      { action: "dismiss", title: "Dismiss" },
    ],
  });
});

self.addEventListener("notificationclick", (event) => {
  event.notification.close();

  if (event.action === "open" || !event.action) {
    const url = event.notification.data?.url || "/messages";
    event.waitUntil(clients.openWindow(url));
  }
});
```

> **Important:** The service worker file MUST be at the root of the `public/`
> directory so it is served at `/firebase-messaging-sw.js`. This is a
> requirement of the Firebase Messaging SDK.

### 7.6 Store FCM Tokens in Supabase

Add a column for the push token:

```sql
ALTER TABLE users ADD COLUMN fcm_token TEXT;
```

When a user grants notification permission, save their token:

```typescript
const token = await requestNotificationPermission();
if (token) {
  await supabase.from("users").update({ fcm_token: token }).eq("id", userId);
}
```

### 7.7 Send Notifications from the Backend

Use the Firebase Admin SDK in your API routes to send targeted notifications:

```bash
npm install firebase-admin
```

```typescript
// src/lib/firebase-admin.ts
import admin from "firebase-admin";

if (!admin.apps.length) {
  admin.initializeApp({
    credential: admin.credential.cert({
      projectId: "vita-app",
      clientEmail: "firebase-adminsdk@vita-app.iam.gserviceaccount.com",
      privateKey: process.env.FIREBASE_ADMIN_PRIVATE_KEY?.replace(/\\n/g, "\n"),
    }),
  });
}

export async function sendPushNotification(
  fcmToken: string,
  title: string,
  body: string,
  data?: Record<string, string>
) {
  return admin.messaging().send({
    token: fcmToken,
    notification: { title, body },
    data,
    webpush: {
      fcmOptions: { link: data?.url || "https://your-domain.com" },
    },
  });
}
```

---

## 8. Identity Verification (Blue Tier)

Vita's verification system has three tiers (defined in
`src/components/profile/verification-card.tsx`):

| Tier | Badge | How |
|---|---|---|
| **Green** | Photo verified | Selfie comparison |
| **Blue** | ID verified | Government ID + KYC |
| **Gold** | Premium | Paid subscription (Stripe) |

For **Blue tier** (ID verification), integrate a KYC provider.

### 8.1 Recommended Provider: Persona

[Persona](https://withpersona.com/) is purpose-built for identity
verification and is widely used in social/dating apps.

1. Create an account at [withpersona.com](https://withpersona.com).
2. Create an **Inquiry Template** with these verification steps:
   - Government ID scan (front + back)
   - Selfie with liveness detection
   - Data cross-reference
3. Copy your:
   - **API Key** (add as `PERSONA_API_KEY` in env vars)
   - **Template ID** (add as `PERSONA_TEMPLATE_ID`)

### 8.2 Create the Verification Flow

```typescript
// src/app/api/verification/start/route.ts
import { NextRequest, NextResponse } from "next/server";

export async function POST(req: NextRequest) {
  const { userId } = await req.json();

  const response = await fetch("https://withpersona.com/api/v1/inquiries", {
    method: "POST",
    headers: {
      "Authorization": `Bearer ${process.env.PERSONA_API_KEY}`,
      "Content-Type": "application/json",
      "Persona-Version": "2023-01-05",
    },
    body: JSON.stringify({
      data: {
        attributes: {
          "inquiry-template-id": process.env.PERSONA_TEMPLATE_ID,
          "reference-id": userId,
        },
      },
    }),
  });

  const data = await response.json();
  const inquiryId = data.data.id;

  return NextResponse.json({ inquiryId });
}
```

### 8.3 Handle the Verification Webhook

Persona sends a webhook when verification completes:

```typescript
// src/app/api/webhooks/persona/route.ts
import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

export async function POST(req: NextRequest) {
  const body = await req.json();
  const event = body.data;

  if (event.attributes.status === "completed") {
    const userId = event.attributes["reference-id"];

    // Upgrade user to "id" verification level (Blue badge)
    await supabaseAdmin
      .from("users")
      .update({ verification_level: "id" })
      .eq("id", userId);
  }

  if (event.attributes.status === "failed") {
    // Optionally notify the user or log the failure
    console.log("Verification failed for:", event.attributes["reference-id"]);
  }

  return NextResponse.json({ received: true });
}
```

### 8.4 Alternative: Jumio

[Jumio](https://www.jumio.com/) is another solid option with similar
capabilities. The integration pattern is identical -- embed their SDK for the
client-side capture, receive results via webhook, and update the user's
`verification_level` in Supabase.

---

## 9. Error Monitoring (Sentry)

### 9.1 Create a Sentry Project

1. Go to [sentry.io](https://sentry.io) and create an account.
2. Create a new project:
   - **Platform:** Next.js
   - **Project name:** `vita-app`
3. Copy your **DSN** from **Settings > Client Keys (DSN)**.

### 9.2 Install and Configure

```bash
npx @sentry/wizard@latest -i nextjs
```

This wizard will:
- Install `@sentry/nextjs`
- Create `sentry.client.config.ts`, `sentry.server.config.ts`, and `sentry.edge.config.ts`
- Update `next.config.ts` to wrap with `withSentryConfig`
- Create a global error page at `src/app/global-error.tsx`

### 9.3 Configure the DSN

```env
SENTRY_DSN=https://examplePublicKey@o0.ingest.sentry.io/0
SENTRY_AUTH_TOKEN=sntrys_...
```

### 9.4 Sentry Configuration

Your `sentry.client.config.ts` should look like:

```typescript
// sentry.client.config.ts
import * as Sentry from "@sentry/nextjs";

Sentry.init({
  dsn: process.env.SENTRY_DSN,
  environment: process.env.NODE_ENV,
  tracesSampleRate: 1.0,        // Capture 100% of transactions in dev
  replaysSessionSampleRate: 0.1, // Capture 10% of sessions
  replaysOnErrorSampleRate: 1.0, // Always capture replays on error
  integrations: [
    Sentry.replayIntegration(),
  ],
});
```

### 9.5 Source Maps for Production

Update `next.config.ts` to upload source maps:

```typescript
// next.config.ts
import { withSentryConfig } from "@sentry/nextjs";
import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  /* your existing config */
};

export default withSentryConfig(nextConfig, {
  org: "your-sentry-org",
  project: "vita-app",
  authToken: process.env.SENTRY_AUTH_TOKEN,
  silent: true,      // Suppress CLI output during build
  hideSourceMaps: true, // Don't expose source maps publicly
});
```

---

## 10. Deployment

### 10.1 Deploy to Vercel

Vita is a Next.js 16 app, and Vercel is the recommended deployment target.

```bash
# Install Vercel CLI
npm install -g vercel

# Login
vercel login

# Deploy (follow the prompts)
vercel

# Deploy to production
vercel --prod
```

Or connect via the Vercel Dashboard:

1. Go to [vercel.com](https://vercel.com) and import a new project.
2. Select your GitHub/GitLab/Bitbucket repository.
3. Vercel auto-detects the Next.js framework.
4. Click **Deploy**.

### 10.2 Configure Environment Variables in Vercel

In the Vercel Dashboard, go to your project's **Settings > Environment Variables** and add every variable from the `.env.local` list above.

> **Tip:** Use different values for **Production**, **Preview**, and
> **Development** environments. For example, use Stripe test keys for Preview
> and live keys for Production.

| Variable | Production | Preview | Development |
|---|---|---|---|
| `NEXT_PUBLIC_SUPABASE_URL` | Production Supabase | Staging Supabase | localhost |
| `STRIPE_SECRET_KEY` | `sk_live_...` | `sk_test_...` | `sk_test_...` |
| ... | ... | ... | ... |

### 10.3 Custom Domain Setup

1. In Vercel, go to **Settings > Domains**.
2. Add your domain: `vita.app` (or your chosen domain).
3. Vercel will provide DNS records to add:
   - **A record:** `76.76.21.21`
   - **CNAME record:** `cname.vercel-dns.com`
4. Add a `www` subdomain redirect if desired.
5. SSL is automatic.

> **Remember:** Update the Supabase redirect URL list
> (Authentication > URL Configuration) and the Stripe webhook URL to use your
> production domain.

### 10.4 Edge Function Regions

For optimal latency, configure Vercel to run edge functions close to your users:

```typescript
// next.config.ts
const nextConfig: NextConfig = {
  experimental: {
    // Run middleware at the edge closest to users
  },
};
```

In individual API routes, you can set the runtime and preferred region:

```typescript
// src/app/api/ai/icebreaker/route.ts
export const runtime = "edge";
export const preferredRegion = ["iad1", "sfo1"]; // US East + West
```

---

## 11. Post-Deployment Checklist

After your first deployment, work through this checklist to harden the app for
real users.

### 11.1 Enable Supabase Connection Pooling (PgBouncer)

Serverless environments (like Vercel) can exhaust database connections. Enable
PgBouncer in Supabase:

1. Go to **Settings > Database** in Supabase Dashboard.
2. Under **Connection Pooling**, note the pooler connection string.
3. Use the **Transaction mode** pooler string for serverless functions.

### 11.2 Set Up Database Backups

Supabase Pro plan includes automatic daily backups. To enable point-in-time
recovery (PITR):

1. Go to **Settings > Database > Backups**.
2. Enable **Point-in-Time Recovery** (requires Pro plan).
3. Set retention period (7 days recommended minimum).

### 11.3 Configure Rate Limiting

Protect your API routes from abuse. Add rate limiting middleware:

```typescript
// src/lib/rate-limit.ts
const rateLimitMap = new Map<string, { count: number; lastReset: number }>();

export function rateLimit(
  identifier: string,
  limit: number = 10,
  windowMs: number = 60_000
): boolean {
  const now = Date.now();
  const entry = rateLimitMap.get(identifier);

  if (!entry || now - entry.lastReset > windowMs) {
    rateLimitMap.set(identifier, { count: 1, lastReset: now });
    return true;
  }

  if (entry.count >= limit) return false;

  entry.count++;
  return true;
}
```

Apply to sensitive routes:

```typescript
// In any API route
const ip = req.headers.get("x-forwarded-for") || "unknown";
if (!rateLimit(ip, 5, 60_000)) {
  return NextResponse.json({ error: "Too many requests" }, { status: 429 });
}
```

> **For production scale:** Use Vercel's built-in Edge rate limiting or an
> external service like Upstash Redis with `@upstash/ratelimit`.

### 11.4 Set Up Supabase Dashboard Alerts

1. In Supabase Dashboard, go to **Settings > Monitoring**.
2. Configure alerts for:
   - Database CPU usage > 80%
   - Connection count > 80% of limit
   - Storage usage approaching limit
   - Auth rate limits being hit

### 11.5 CORS Configuration

If you need to restrict API access, configure CORS in your API routes:

```typescript
// src/app/api/webhooks/stripe/route.ts
export async function OPTIONS() {
  return new NextResponse(null, {
    status: 200,
    headers: {
      "Access-Control-Allow-Origin": "https://your-domain.com",
      "Access-Control-Allow-Methods": "POST, OPTIONS",
      "Access-Control-Allow-Headers": "Content-Type, stripe-signature",
    },
  });
}
```

### 11.6 Content Security Policy Headers

Add CSP headers in `next.config.ts` to protect against XSS:

```typescript
// next.config.ts
const nextConfig: NextConfig = {
  async headers() {
    return [
      {
        source: "/(.*)",
        headers: [
          {
            key: "Content-Security-Policy",
            value: [
              "default-src 'self'",
              "script-src 'self' 'unsafe-inline' 'unsafe-eval' https://*.firebaseio.com https://*.stripe.com https://api.mapbox.com",
              "style-src 'self' 'unsafe-inline' https://api.mapbox.com",
              "img-src 'self' data: blob: https://*.supabase.co https://api.mapbox.com https://*.mapbox.com",
              "font-src 'self' data:",
              "connect-src 'self' https://*.supabase.co wss://*.supabase.co https://api.openai.com https://api.mapbox.com https://*.mapbox.com https://*.stripe.com https://*.sentry.io https://firebaseinstallations.googleapis.com https://fcmregistrations.googleapis.com",
              "frame-src 'self' https://*.stripe.com https://withpersona.com",
              "worker-src 'self' blob:",
            ].join("; "),
          },
          {
            key: "X-Frame-Options",
            value: "DENY",
          },
          {
            key: "X-Content-Type-Options",
            value: "nosniff",
          },
          {
            key: "Referrer-Policy",
            value: "strict-origin-when-cross-origin",
          },
          {
            key: "Permissions-Policy",
            value: "camera=(self), microphone=(), geolocation=(self)",
          },
        ],
      },
    ];
  },
};
```

### 11.7 Final Verification

Run through this final checklist before announcing your launch:

- [ ] **Auth flow works end-to-end:** Phone OTP sign-up, verify, onboarding, session refresh
- [ ] **RLS is enabled on every table** -- test with the Supabase SQL editor as an anon user
- [ ] **Storage uploads work:** Try uploading a profile photo from mobile
- [ ] **Realtime chat works:** Open two browser tabs, send messages between users
- [ ] **Stripe subscription flow:** Test the full trial -> active -> cancel cycle
- [ ] **Push notifications fire:** Send a test notification from Firebase Console
- [ ] **Map loads with event pins:** Verify Mapbox renders on mobile devices
- [ ] **AI icebreakers generate:** Open a new conversation and check suggestions
- [ ] **Error monitoring captures:** Trigger a test error and verify it appears in Sentry
- [ ] **Mobile responsiveness:** Test on iOS Safari and Android Chrome
- [ ] **Performance:** Run Lighthouse -- aim for 90+ on Performance and Accessibility
- [ ] **Environment variables:** Double-check that no `sk_test_` keys are in production

---

## Quick Reference: Key File Paths

| File | Purpose |
|---|---|
| `src/lib/supabase/client.ts` | Browser Supabase client |
| `src/lib/supabase/server.ts` | Server Component Supabase client |
| `src/lib/supabase/middleware.ts` | Session refresh middleware |
| `src/middleware.ts` | Next.js middleware entry |
| `src/types/database.ts` | TypeScript types for all tables |
| `src/lib/constants.ts` | Colors, health ring thresholds, app config |
| `src/stores/auth-store.ts` | Zustand auth state |
| `src/app/(auth)/login/page.tsx` | Phone number login |
| `src/app/(auth)/verify/page.tsx` | OTP verification |
| `src/app/(main)/map/page.tsx` | Map page (needs Mapbox integration) |
| `src/components/messages/ai-icebreaker.tsx` | AI Wingman component |
| `src/components/profile/gold-upsell.tsx` | Vita Gold subscription CTA |
| `src/components/profile/verification-card.tsx` | Verification tier progress |
| `public/firebase-messaging-sw.js` | Push notification service worker |

---

*Last updated: February 2026*
