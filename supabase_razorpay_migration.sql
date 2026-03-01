-- ============================================
-- Razorpay Integration — Schema Update
-- Run this in the Supabase SQL Editor
-- ============================================

-- Add Razorpay payment fields to profiles table
ALTER TABLE profiles 
  ADD COLUMN IF NOT EXISTS razorpay_payment_id TEXT,
  ADD COLUMN IF NOT EXISTS razorpay_order_id TEXT,
  ADD COLUMN IF NOT EXISTS upgraded_at TIMESTAMP WITH TIME ZONE;
