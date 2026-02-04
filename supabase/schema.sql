-- =============================================================
-- PROFEE - Supabase Database Schema
-- =============================================================
-- Copy and paste this ENTIRE file into your Supabase SQL Editor
-- (Dashboard > SQL Editor > New Query > Paste > Run)
-- =============================================================

-- Enable UUID generation
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- =============================================================
-- 1. PROFILES (linked to Supabase Auth users)
-- =============================================================
CREATE TABLE IF NOT EXISTS profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  email TEXT,
  full_name TEXT,
  practice_name TEXT DEFAULT 'My Practice',
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Auto-create a profile when a new user signs up
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.profiles (id, email, full_name)
  VALUES (NEW.id, NEW.email, COALESCE(NEW.raw_user_meta_data->>'full_name', ''));
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- =============================================================
-- 2. GROUPS
-- =============================================================
CREATE TABLE IF NOT EXISTS groups (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- =============================================================
-- 3. CLIENTS
-- =============================================================
CREATE TABLE IF NOT EXISTS clients (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  pan TEXT NOT NULL DEFAULT '',
  group_name TEXT DEFAULT 'Individual',
  entity_type TEXT NOT NULL DEFAULT 'Individual',
  contact TEXT NOT NULL DEFAULT '',
  email TEXT,
  address TEXT,
  portal_password TEXT,
  gstin TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- =============================================================
-- 4. HEARINGS (Proceedings / Matters)
-- =============================================================
CREATE TABLE IF NOT EXISTS hearings (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  client_id UUID NOT NULL REFERENCES clients(id) ON DELETE CASCADE,
  client_name TEXT NOT NULL,
  case_type TEXT NOT NULL,
  issue_date TEXT,
  hearing_date TEXT NOT NULL,
  time TEXT DEFAULT '10:00 AM',
  forum TEXT NOT NULL DEFAULT 'AO',
  status TEXT NOT NULL DEFAULT 'Upcoming',
  assessment_year TEXT NOT NULL DEFAULT '2024-25',
  description TEXT,
  is_critical BOOLEAN DEFAULT FALSE,
  quoted_fees NUMERIC DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- =============================================================
-- 5. INVOICES
-- =============================================================
CREATE TABLE IF NOT EXISTS invoices (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  invoice_number TEXT NOT NULL,
  client_id UUID REFERENCES clients(id) ON DELETE SET NULL,
  client_name TEXT NOT NULL,
  client_address TEXT,
  client_gstin TEXT,
  client_pan TEXT,
  date TEXT NOT NULL,
  due_date TEXT,
  place_of_supply TEXT DEFAULT 'Maharashtra',
  country_of_supply TEXT DEFAULT 'India',
  items JSONB NOT NULL DEFAULT '[]',
  sub_total NUMERIC DEFAULT 0,
  discount_percent NUMERIC DEFAULT 0,
  discount_amount NUMERIC DEFAULT 0,
  taxable_amount NUMERIC DEFAULT 0,
  gst_total NUMERIC DEFAULT 0,
  cgst_total NUMERIC DEFAULT 0,
  sgst_total NUMERIC DEFAULT 0,
  total NUMERIC DEFAULT 0,
  status TEXT DEFAULT 'Unpaid',
  theme_color TEXT DEFAULT '#4f46e5',
  assessment_year TEXT,
  case_type TEXT,
  notes TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- =============================================================
-- 6. RECEIPTS
-- =============================================================
CREATE TABLE IF NOT EXISTS receipts (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  receipt_number TEXT NOT NULL,
  client_id UUID REFERENCES clients(id) ON DELETE SET NULL,
  group_id TEXT,
  client_name TEXT NOT NULL,
  date TEXT NOT NULL,
  amount NUMERIC DEFAULT 0,
  settlement_discount NUMERIC DEFAULT 0,
  payment_method TEXT DEFAULT 'UPI',
  reference TEXT,
  invoice_ids JSONB DEFAULT '[]',
  notes TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- =============================================================
-- 7. BILLING SETTINGS (one row per user)
-- =============================================================
CREATE TABLE IF NOT EXISTS billing_settings (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID UNIQUE NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  practice_name TEXT DEFAULT 'My Practice',
  address TEXT DEFAULT '',
  pan TEXT DEFAULT '',
  gstin TEXT DEFAULT '',
  theme_color TEXT DEFAULT '#4f46e5',
  prefix TEXT DEFAULT 'INV/',
  is_gst_applicable BOOLEAN DEFAULT TRUE,
  is_auto_numbering BOOLEAN DEFAULT TRUE,
  last_number INTEGER DEFAULT 0,
  bank_details JSONB DEFAULT '{"accountHolder":"","accountNumber":"","ifsc":"","accountType":"Current","bankName":"","upiId":""}',
  terms JSONB DEFAULT '["Payment within 15 days.","Subject to local jurisdiction."]',
  default_notes TEXT DEFAULT 'Professional services rendered.',
  notes TEXT DEFAULT '',
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- =============================================================
-- 8. ROW LEVEL SECURITY (RLS) - Each user only sees their data
-- =============================================================

-- Enable RLS on all tables
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE groups ENABLE ROW LEVEL SECURITY;
ALTER TABLE clients ENABLE ROW LEVEL SECURITY;
ALTER TABLE hearings ENABLE ROW LEVEL SECURITY;
ALTER TABLE invoices ENABLE ROW LEVEL SECURITY;
ALTER TABLE receipts ENABLE ROW LEVEL SECURITY;
ALTER TABLE billing_settings ENABLE ROW LEVEL SECURITY;

-- Profiles: users can read/update their own profile
CREATE POLICY "Users can view own profile"
  ON profiles FOR SELECT USING (auth.uid() = id);
CREATE POLICY "Users can update own profile"
  ON profiles FOR UPDATE USING (auth.uid() = id);

-- Groups: full access to own groups
CREATE POLICY "Users can manage own groups"
  ON groups FOR ALL USING (auth.uid() = user_id);

-- Clients: full access to own clients
CREATE POLICY "Users can manage own clients"
  ON clients FOR ALL USING (auth.uid() = user_id);

-- Hearings: full access to own hearings
CREATE POLICY "Users can manage own hearings"
  ON hearings FOR ALL USING (auth.uid() = user_id);

-- Invoices: full access to own invoices
CREATE POLICY "Users can manage own invoices"
  ON invoices FOR ALL USING (auth.uid() = user_id);

-- Receipts: full access to own receipts
CREATE POLICY "Users can manage own receipts"
  ON receipts FOR ALL USING (auth.uid() = user_id);

-- Billing Settings: full access to own settings
CREATE POLICY "Users can manage own billing settings"
  ON billing_settings FOR ALL USING (auth.uid() = user_id);

-- =============================================================
-- 9. AUTO-CREATE DEFAULT BILLING SETTINGS ON SIGNUP
-- =============================================================
CREATE OR REPLACE FUNCTION public.handle_new_user_settings()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.billing_settings (user_id)
  VALUES (NEW.id);
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

DROP TRIGGER IF EXISTS on_auth_user_settings ON auth.users;
CREATE TRIGGER on_auth_user_settings
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user_settings();

-- =============================================================
-- DONE! Your database is now ready.
-- =============================================================
