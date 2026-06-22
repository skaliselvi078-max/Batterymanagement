-- =============================================
-- Battery Inventory Management System
-- Supabase Database Schema
-- =============================================
-- Run this SQL in your Supabase SQL Editor:
-- https://supabase.com/dashboard/project/YOUR_PROJECT/sql

-- Enable UUID generation
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- =============================================
-- MIGRATION FOR EXISTING DATABASES:
-- If you already have the table and want to upgrade it, run this SQL:
--
-- ALTER TABLE customers ADD COLUMN IF NOT EXISTS paid_amount NUMERIC(10, 2) NOT NULL DEFAULT 0.00;
-- ALTER TABLE customers DROP CONSTRAINT IF EXISTS customers_payment_status_check;
-- ALTER TABLE customers ADD CONSTRAINT customers_payment_status_check CHECK (payment_status IN ('pending', 'completed'));
-- =============================================

-- =============================================
-- Customers Table
-- =============================================
CREATE TABLE customers (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  customer_name TEXT NOT NULL,
  phone_number TEXT NOT NULL,
  email TEXT,
  battery_serial_number TEXT NOT NULL,
  battery_amount NUMERIC(10, 2) NOT NULL,
  paid_amount NUMERIC(10, 2) NOT NULL DEFAULT 0.00,
  purchase_date DATE NOT NULL DEFAULT CURRENT_DATE,
  payment_status TEXT NOT NULL DEFAULT 'pending'
    CHECK (payment_status IN ('pending', 'completed')),
  is_deleted BOOLEAN NOT NULL DEFAULT FALSE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  user_id UUID REFERENCES auth.users(id)
);

-- =============================================
-- Indexes for Performance
-- =============================================
CREATE INDEX idx_customers_name ON customers (customer_name);
CREATE INDEX idx_customers_phone ON customers (phone_number);
CREATE INDEX idx_customers_serial ON customers (battery_serial_number);
CREATE INDEX idx_customers_payment_status ON customers (payment_status);
CREATE INDEX idx_customers_deleted ON customers (is_deleted);
CREATE INDEX idx_customers_created_at ON customers (created_at DESC);

-- =============================================
-- Auto-update updated_at Trigger
-- =============================================
CREATE OR REPLACE FUNCTION update_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER customers_updated_at
  BEFORE UPDATE ON customers
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at();

-- =============================================
-- Row Level Security (RLS)
-- =============================================
ALTER TABLE customers ENABLE ROW LEVEL SECURITY;

-- Set default user_id to the currently logged in user
ALTER TABLE customers ALTER COLUMN user_id SET DEFAULT auth.uid();

-- Create secure, per-user private policies (supporting legacy NULL user_id rows)
CREATE POLICY "Users can view their own customers"
  ON customers FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id OR user_id IS NULL);

CREATE POLICY "Users can insert their own customers"
  ON customers FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id OR user_id IS NULL);

CREATE POLICY "Users can update their own customers"
  ON customers FOR UPDATE
  TO authenticated
  USING (auth.uid() = user_id OR user_id IS NULL)
  WITH CHECK (auth.uid() = user_id OR user_id IS NULL);

-- =============================================
-- Storage Bucket for Backups
-- =============================================
-- NOTE: Create a 'backups' bucket in Supabase Dashboard
-- Storage > New Bucket > Name: backups > Private
-- Then add this policy:

-- Allow authenticated users to read backup files
-- CREATE POLICY "Authenticated users can read backups"
--   ON storage.objects FOR SELECT
--   TO authenticated
--   USING (bucket_id = 'backups');

-- Allow service role to upload backups (used by cron job)
-- This is handled automatically by the service role
