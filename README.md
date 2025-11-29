# Payout Analytics Dashboard

A real-time dashboard for monitoring payout transactions, margins, and platform performance.

## Prerequisites

- Node.js 20.19+ or 22.12+ (check with `node -v`)
- npm or yarn
- Supabase account

## Quick Start

### 1. Clone and Install

```bash
# Clone the repository
git clone <your-repo-url>
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
VITE_SUPABASE_URL=https://your-project.supabase.co
VITE_SUPABASE_ANON_KEY=your-anon-key-here
```

⚠️ **Important:** Vite uses `VITE_` prefix (not `REACT_APP_`)

### 4. Update Supabase Client

Make sure your component uses Vite environment variables:

```javascript
const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;
```

### 5. Run the App

```bash
npm run dev
```

Opens at [http://localhost:5173]

## Features

- **Real-time Dashboard** - View payout volumes, margins, and alerts
- **Advanced Filtering** - Filter by country, platform, customer type, status
- **Natural Language Search** - Type queries like "Show me NIUM payouts to Hong Kong"
- **Margin Calculation** - Automatic profit and margin % computation
- **Responsive Design** - Works on desktop and mobile

## Project Structure

```
payout-dashboard/
├── src/
│   ├── components/
│   │   └── PayoutDashboard.jsx  # Main dashboard component
│   ├── App.js                    # App entry point
│   └── index.js
├── .env                          # Environment variables (create this)
├── package.json
└── README.md
```

## Troubleshooting

### Issue: "Vite requires Node.js version 20.19+"
- Upgrade Node: `brew upgrade node` (macOS) or download from [nodejs.org](https://nodejs.org)
- Or use NVM: `nvm install 20 && nvm use 20`

### Issue: Blank screen
- Check browser console (F12) for errors
- Disable ad blockers or try incognito mode
- Verify `.env` file exists and uses `VITE_` prefix (not `REACT_APP_`)

### Issue: "Table does not exist"
- Run the SQL script in Supabase SQL Editor
- Verify table name is `payouts` (lowercase)

### Issue: No data showing
- Check Supabase Table Editor to confirm data imported
- Check Network tab in browser DevTools for failed requests

### Issue: Environment variables not working
- Must use `VITE_` prefix
- Must restart dev server after changing `.env`
- Access with `import.meta.env.VITE_SUPABASE_URL` (not `process.env`)

### Issue: Tailwind styles not working
- Delete `node_modules` and `package-lock.json`
- Run `npm install` again
- Restart dev server with `npm run dev`

## Environment Variables

| Variable | Description | Example |
|----------|-------------|---------|
| `VITE_SUPABASE_URL` | Your Supabase project URL | `https://abc123.supabase.co` |
| `VITE_SUPABASE_ANON_KEY` | Your Supabase anonymous key | `eyJhbGc...` |

⚠️ **Note:** Vite requires `VITE_` prefix for environment variables (not `REACT_APP_`)

## Tech Stack

- **Frontend:** React 18, Tailwind CSS
- **Backend:** Supabase (PostgreSQL)
- **Icons:** Lucide React
- **Build Tool:** Vite
