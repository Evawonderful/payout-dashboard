# Payout Analytics Dashboard

A real-time dashboard for monitoring payout transactions, margins, and platform performance.

## Prerequisites

- Node.js 14+ 
- npm or yarn
- Supabase account 

## Quick Start

### 1. Clone and Install

```bash
# Clone the repository
git clone https://github.com/Evawonderful/payout-dashboard.git
cd payout-dashboard

# Install dependencies
npm install
```

### 2. Set Up Supabase

#### Create Supabase Project
1. Go to [supabase.com](https://supabase.com) and create account
2. Create new project
3. Copy your **Project URL** and **anon key** from Settings → API

#### Create Database Table
1. In Supabase, go to SQL Editor
2. Run this command:

```sql
CREATE TABLE payouts (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  date DATE NOT NULL,
  customer_name TEXT NOT NULL,
  beneficiary TEXT,
  customer_type TEXT,
  country TEXT NOT NULL,
  currency TEXT NOT NULL,
  amount_in_currency NUMERIC(15,2),
  usd_equivalent NUMERIC(15,2) NOT NULL,
  status TEXT,
  final_status TEXT,
  platform TEXT NOT NULL,
  online_offline TEXT,
  wallet_debit_usd NUMERIC(15,2) NOT NULL,
  extra_fees_usd NUMERIC(15,2) DEFAULT 0,
  platform_charges_usd NUMERIC(15,2) DEFAULT 0,
  profit_usd NUMERIC(15,2) GENERATED ALWAYS AS 
    (wallet_debit_usd - usd_equivalent - extra_fees_usd - platform_charges_usd) STORED,
  margin_percent NUMERIC(5,2) GENERATED ALWAYS AS 
    ((wallet_debit_usd - usd_equivalent - extra_fees_usd - platform_charges_usd) / 
     NULLIF(wallet_debit_usd, 0) * 100) STORED,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_payouts_date ON payouts(date DESC);
CREATE INDEX idx_payouts_country ON payouts(country);
CREATE INDEX idx_payouts_platform ON payouts(platform);

ALTER TABLE payouts ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Allow all access" ON payouts FOR ALL USING (true);
```

#### Import CSV Data
1. Table Editor → payouts → Insert → Import CSV
2. Upload your CSV file with headers matching the database columns

### 3. Configure Environment

Create `.env` file in project root:

```bash
REACT_APP_SUPABASE_URL=https://your-project.supabase.co
REACT_APP_SUPABASE_ANON_KEY=your-anon-key-here
```

⚠️ Replace with your actual credentials from Supabase!

### 4. Run the App

```bash
npm start
```

Opens at [http://localhost:3000](http://localhost:3000)

## Features

- **Real-time Dashboard** - View payout volumes, margins, and alerts
- **Advanced Filtering** - Filter by country, platform, customer type, status
- **Natural Language Search** - Type queries like "Show me NIUM payouts to Hong Kong"
- **Margin Calculation** - Automatic profit and margin % computation
- **Responsive Design** - Works on desktop and mobile


## Troubleshooting

### Issue: Blank screen
- Check browser console (F12) for errors
- Disable ad blockers or try incognito mode
- Verify `.env` file exists and has correct credentials

### Issue: "Table does not exist"
- Run the SQL script in Supabase SQL Editor
- Verify table name is `payouts` (lowercase)

### Issue: No data showing
- Check Supabase Table Editor to confirm data imported
- Check Network tab in browser DevTools for failed requests

### Issue: Tailwind styles not working
- Delete `node_modules` and `package-lock.json`
- Run `npm install` again
- Restart dev server

## Environment Variables

| Variable | Description | Example |
|----------|-------------|---------|
| `REACT_APP_SUPABASE_URL` | Your Supabase project URL | `https://abc123.supabase.co` |
| `REACT_APP_SUPABASE_ANON_KEY` | Your Supabase anonymous key | `eyJhbGc...` |

## Tech Stack

- **Frontend:** React 18, Tailwind CSS
- **Backend:** Supabase (PostgreSQL)
- **Icons:** Lucide React
- **Build Tool:** Create React App



# payout-dashboard
