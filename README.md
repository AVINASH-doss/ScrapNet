# ScrapNet

> **Turn your scrap into value. Find a trusted collector nearby.**

ScrapNet is a hyperlocal two-sided marketplace connecting **Households** with recyclable scrap to **Verified Collectors (Scrappers)** who bid on materials, organize pickups, and minimize wasted travel.

---

## 🚀 Key Features

### For Households / Users
- **Easy Posting**: Upload scrap photos, choose categories, estimate quantities, and add preferred pickup times.
- **Offer Comparison**: Compare bids based on offered amount, scrapper ratings, distance, and completion history.
- **Privacy Protection**: Exact pickup address and contact details remain locked until you accept an offer.
- **Trust & Reviews**: Rate collectors after completion to maintain high community trust.

### For Scrappers / Collectors
- **Nearby Feed**: Filter listings by category, distance, and quantity within a customizable service radius.
- **Bidding System**: Submit prices, pickup times, and notes on listing cards.
- **Scrap Pooling**: View aggregated listings in a 700m radius to optimize collections and reduce fuel waste.
- **Reputation Profile**: Build a verified collector card detailing your completed pickups, earnings, and average rating.

---

## 🛠️ Tech Stack

- **Frontend**: React 19, TypeScript, Vite, Tailwind CSS 4
- **Database & Backend**: Supabase (PostgreSQL)
- **Authentication**: Supabase Auth (Role-based metadata routing)
- **Storage**: Supabase Storage (Avatars and listing photos)
- **Icons**: Lucide React

---

## 🔒 Security & Privacy (RLS)

We use PostgreSQL Row-Level Security (RLS) to enforce data privacy rules at the database level:
- **Private Data Protection**: Exact street addresses and telephone numbers are inaccessible to scrappers browsing the feed.
- **Offer Acceptance Reveal**: Supabase RLS policies release contact and location details only to the scrapper whose offer has been explicitly accepted by the household.

---

## 🏗️ Architecture Overview

```
                SCRAPNET
                    |
        -------------------------
        |                       |
      USER                   SCRAPPER
        |                       |
        -------- React ----------
                    |
              Supabase Client
                    |
        -------------------------
        |           |           |
      Auth       Database     Storage
        |           |           |
       RLS        PostgreSQL   Images/
                               Voice
```

For more details on implementation, see [Architecture & Workflows](file:///d:/ScrapNet/docs/architecture.md).

---

## ⚙️ Setup & Installation

### 1. Prerequisites
- Node.js (v18+)
- npm (v9+)
- A Supabase Project

### 2. Database Migration
1. Copy the contents of the database schema file from [001_initial_schema.sql](file:///d:/ScrapNet/supabase/migrations/001_initial_schema.sql).
2. Go to the SQL Editor in your Supabase Dashboard.
3. Paste and run the queries to create all enums, tables, indexes, RLS policies, and triggers.

### 3. Storage Setup
Create the following public storage buckets in your Supabase project:
1. `avatars` (Public)
2. `scrap-images` (Public)

### 4. Configuration
Create a `.env.local` file in the root directory:
```env
VITE_SUPABASE_URL=https://your-project.supabase.co
VITE_SUPABASE_ANON_KEY=your-anon-key-here
```

### 5. Install & Run
```bash
# Install dependencies
npm install

# Start development server
npm run dev
```

---

## 🎯 Demo Workflow

To run a 3-minute hackathon demo:
1. **User Sign Up**: Register a user account (e.g. `house@demo.com`) on the main page.
2. **User Profile**: Add a default address and contact number in profile page.
3. **List Scrap**: Create a new listing under "Paper" category, upload an image, and publish.
4. **Scrapper Sign Up**: Open an incognito browser window and register a scrapper account (e.g. `collector@demo.com`). Select "Continue as Scrapper".
5. **Discover Scrap**: In the scrapper dashboard, search nearby scrap, find the user's listing, and click **Make Offer** with a bid amount.
6. **Accept Offer**: Back in the user window, view the incoming offer and click **Accept**.
7. **Privacy Unlock**: Notice the exact address and phone number are now revealed to the scrapper.
8. **Pickup Flow**: In the scrapper window, transition the pickup status: `Accepted` ➔ `On the Way` ➔ `Arrived` ➔ `Completed`.
9. **Ratings**: Both users leave reviews, updating their profile star ratings.

---

## 🔮 Future Scope
- **WebUSB Integration**: Connect digital weighing scales directly to the application for tamper-proof weight validation.
- **Voice-to-Text Transcription**: Implement on-device transcription for voice notes.
- **Route Optimization**: Multi-stop path generation for scrappers picking up multiple pooled listings.
