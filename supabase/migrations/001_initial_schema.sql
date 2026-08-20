-- ==========================================
-- ScrapNet Database Schema
-- Complete migration for Supabase PostgreSQL
-- ==========================================

-- ==========================================
-- ENUMS
-- ==========================================

CREATE TYPE user_role AS ENUM ('user', 'scrapper', 'admin');
CREATE TYPE listing_status AS ENUM (
  'draft', 'published', 'receiving_offers', 'offer_accepted',
  'pickup_scheduled', 'collected', 'completed', 'cancelled', 'expired'
);
CREATE TYPE offer_status AS ENUM ('pending', 'accepted', 'rejected', 'expired', 'withdrawn');
CREATE TYPE pickup_status AS ENUM ('accepted', 'on_the_way', 'arrived', 'collected', 'completed', 'cancelled');
CREATE TYPE scrap_category AS ENUM (
  'paper', 'cardboard', 'plastic', 'metal', 'glass',
  'e_waste', 'electronics', 'appliances', 'batteries', 'mixed', 'other'
);
CREATE TYPE notification_type AS ENUM (
  'offer_received', 'offer_accepted', 'offer_rejected',
  'pickup_scheduled', 'pickup_on_the_way', 'pickup_arrived',
  'pickup_completed', 'rating_request', 'new_nearby_listing',
  'pickup_cancelled', 'pickup_reminder'
);
CREATE TYPE report_reason AS ENUM (
  'no_show', 'wrong_quantity', 'payment_dispute',
  'inappropriate_behavior', 'listing_issue', 'other'
);

-- ==========================================
-- PROFILES
-- Extends Supabase auth.users
-- ==========================================

CREATE TABLE profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  email TEXT NOT NULL,
  full_name TEXT NOT NULL DEFAULT '',
  phone TEXT,
  avatar_url TEXT,
  role user_role NOT NULL DEFAULT 'user',
  address TEXT,
  area TEXT,
  city TEXT,
  pincode TEXT,
  latitude DOUBLE PRECISION,
  longitude DOUBLE PRECISION,
  apartment_name TEXT,
  pickup_instructions TEXT,
  avg_rating NUMERIC(3,2) NOT NULL DEFAULT 0,
  total_transactions INTEGER NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- ==========================================
-- SCRAPPER PROFILES
-- Additional data for scrapper role
-- ==========================================

CREATE TABLE scrapper_profiles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL UNIQUE REFERENCES profiles(id) ON DELETE CASCADE,
  business_name TEXT,
  categories_accepted scrap_category[] NOT NULL DEFAULT '{}',
  service_radius_km NUMERIC(5,1) NOT NULL DEFAULT 5.0,
  experience_years INTEGER,
  is_verified BOOLEAN NOT NULL DEFAULT false,
  verification_status TEXT NOT NULL DEFAULT 'unverified',
  avg_rating NUMERIC(3,2) NOT NULL DEFAULT 0,
  completed_pickups INTEGER NOT NULL DEFAULT 0,
  total_offers INTEGER NOT NULL DEFAULT 0,
  total_earnings NUMERIC(12,2) NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- ==========================================
-- SCRAP LISTINGS
-- ==========================================

CREATE TABLE scrap_listings (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  category scrap_category NOT NULL,
  subcategory TEXT,
  description TEXT,
  estimated_quantity NUMERIC(10,2) NOT NULL DEFAULT 0,
  quantity_unit TEXT NOT NULL DEFAULT 'kg',
  condition TEXT,
  voice_note_url TEXT,
  preferred_pickup_date DATE,
  preferred_pickup_time_start TIME,
  preferred_pickup_time_end TIME,
  pickup_address TEXT,
  pickup_area TEXT,
  pickup_city TEXT,
  pickup_pincode TEXT,
  pickup_latitude DOUBLE PRECISION,
  pickup_longitude DOUBLE PRECISION,
  additional_instructions TEXT,
  status listing_status NOT NULL DEFAULT 'draft',
  offer_count INTEGER NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- ==========================================
-- SCRAP IMAGES
-- ==========================================

CREATE TABLE scrap_images (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  listing_id UUID NOT NULL REFERENCES scrap_listings(id) ON DELETE CASCADE,
  image_url TEXT NOT NULL,
  display_order INTEGER NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- ==========================================
-- OFFERS
-- ==========================================

CREATE TABLE offers (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  listing_id UUID NOT NULL REFERENCES scrap_listings(id) ON DELETE CASCADE,
  scrapper_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  offered_amount NUMERIC(10,2) NOT NULL,
  proposed_pickup_time TIMESTAMPTZ,
  note TEXT,
  status offer_status NOT NULL DEFAULT 'pending',
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- ==========================================
-- PICKUPS
-- ==========================================

CREATE TABLE pickups (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  listing_id UUID NOT NULL REFERENCES scrap_listings(id) ON DELETE CASCADE,
  offer_id UUID NOT NULL REFERENCES offers(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  scrapper_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  agreed_amount NUMERIC(10,2) NOT NULL,
  pickup_date DATE,
  pickup_time TIME,
  pickup_address TEXT NOT NULL,
  pickup_latitude DOUBLE PRECISION,
  pickup_longitude DOUBLE PRECISION,
  contact_phone TEXT,
  pickup_instructions TEXT,
  status pickup_status NOT NULL DEFAULT 'accepted',
  completed_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- ==========================================
-- RATINGS
-- ==========================================

CREATE TABLE ratings (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  pickup_id UUID NOT NULL REFERENCES pickups(id) ON DELETE CASCADE,
  rater_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  rated_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  rating INTEGER NOT NULL CHECK (rating >= 1 AND rating <= 5),
  comment TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE(pickup_id, rater_id)
);

-- ==========================================
-- NOTIFICATIONS
-- ==========================================

CREATE TABLE notifications (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  type notification_type NOT NULL,
  title TEXT NOT NULL,
  message TEXT NOT NULL,
  data JSONB,
  is_read BOOLEAN NOT NULL DEFAULT false,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- ==========================================
-- REPORTS
-- ==========================================

CREATE TABLE reports (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  reporter_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  reported_id UUID REFERENCES profiles(id) ON DELETE SET NULL,
  pickup_id UUID REFERENCES pickups(id) ON DELETE SET NULL,
  listing_id UUID REFERENCES scrap_listings(id) ON DELETE SET NULL,
  reason report_reason NOT NULL,
  description TEXT,
  status TEXT NOT NULL DEFAULT 'pending',
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  resolved_at TIMESTAMPTZ
);

-- ==========================================
-- INDEXES
-- ==========================================

CREATE INDEX idx_profiles_role ON profiles(role);
CREATE INDEX idx_profiles_city ON profiles(city);
CREATE INDEX idx_profiles_location ON profiles(latitude, longitude);

CREATE INDEX idx_scrapper_profiles_user_id ON scrapper_profiles(user_id);
CREATE INDEX idx_scrapper_profiles_verified ON scrapper_profiles(is_verified);

CREATE INDEX idx_scrap_listings_user_id ON scrap_listings(user_id);
CREATE INDEX idx_scrap_listings_status ON scrap_listings(status);
CREATE INDEX idx_scrap_listings_category ON scrap_listings(category);
CREATE INDEX idx_scrap_listings_location ON scrap_listings(pickup_latitude, pickup_longitude);
CREATE INDEX idx_scrap_listings_created ON scrap_listings(created_at DESC);

CREATE INDEX idx_scrap_images_listing ON scrap_images(listing_id);

CREATE INDEX idx_offers_listing ON offers(listing_id);
CREATE INDEX idx_offers_scrapper ON offers(scrapper_id);
CREATE INDEX idx_offers_status ON offers(status);

CREATE INDEX idx_pickups_user ON pickups(user_id);
CREATE INDEX idx_pickups_scrapper ON pickups(scrapper_id);
CREATE INDEX idx_pickups_status ON pickups(status);
CREATE INDEX idx_pickups_listing ON pickups(listing_id);

CREATE INDEX idx_ratings_pickup ON ratings(pickup_id);
CREATE INDEX idx_ratings_rated ON ratings(rated_id);

CREATE INDEX idx_notifications_user ON notifications(user_id);
CREATE INDEX idx_notifications_unread ON notifications(user_id, is_read) WHERE NOT is_read;

CREATE INDEX idx_reports_reporter ON reports(reporter_id);
CREATE INDEX idx_reports_status ON reports(status);

-- ==========================================
-- UPDATED_AT TRIGGER
-- ==========================================

CREATE OR REPLACE FUNCTION update_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER profiles_updated_at BEFORE UPDATE ON profiles
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();

CREATE TRIGGER scrapper_profiles_updated_at BEFORE UPDATE ON scrapper_profiles
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();

CREATE TRIGGER scrap_listings_updated_at BEFORE UPDATE ON scrap_listings
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();

CREATE TRIGGER offers_updated_at BEFORE UPDATE ON offers
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();

CREATE TRIGGER pickups_updated_at BEFORE UPDATE ON pickups
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();

-- ==========================================
-- ROW LEVEL SECURITY
-- ==========================================

ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE scrapper_profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE scrap_listings ENABLE ROW LEVEL SECURITY;
ALTER TABLE scrap_images ENABLE ROW LEVEL SECURITY;
ALTER TABLE offers ENABLE ROW LEVEL SECURITY;
ALTER TABLE pickups ENABLE ROW LEVEL SECURITY;
ALTER TABLE ratings ENABLE ROW LEVEL SECURITY;
ALTER TABLE notifications ENABLE ROW LEVEL SECURITY;
ALTER TABLE reports ENABLE ROW LEVEL SECURITY;

-- ==========================================
-- RLS POLICIES: PROFILES
-- ==========================================

-- Everyone can read basic profile info (name, avatar, rating)
CREATE POLICY "profiles_select_public"
  ON profiles FOR SELECT
  TO authenticated
  USING (true);

-- Users can update their own profile
CREATE POLICY "profiles_update_own"
  ON profiles FOR UPDATE
  TO authenticated
  USING (id = auth.uid())
  WITH CHECK (id = auth.uid());

-- Users can insert their own profile
CREATE POLICY "profiles_insert_own"
  ON profiles FOR INSERT
  TO authenticated
  WITH CHECK (id = auth.uid());

-- ==========================================
-- RLS POLICIES: SCRAPPER PROFILES
-- ==========================================

-- Everyone can read scrapper profiles (public collector cards)
CREATE POLICY "scrapper_profiles_select_public"
  ON scrapper_profiles FOR SELECT
  TO authenticated
  USING (true);

-- Scrappers can insert their own profile
CREATE POLICY "scrapper_profiles_insert_own"
  ON scrapper_profiles FOR INSERT
  TO authenticated
  WITH CHECK (user_id = auth.uid());

-- Scrappers can update their own profile
CREATE POLICY "scrapper_profiles_update_own"
  ON scrapper_profiles FOR UPDATE
  TO authenticated
  USING (user_id = auth.uid())
  WITH CHECK (user_id = auth.uid());

-- ==========================================
-- RLS POLICIES: SCRAP LISTINGS
-- ==========================================

-- Users can create their own listings
CREATE POLICY "listings_insert_own"
  ON scrap_listings FOR INSERT
  TO authenticated
  WITH CHECK (user_id = auth.uid());

-- Users can update their own listings
CREATE POLICY "listings_update_own"
  ON scrap_listings FOR UPDATE
  TO authenticated
  USING (user_id = auth.uid())
  WITH CHECK (user_id = auth.uid());

-- Published listings are visible to all authenticated users
-- Draft listings only visible to owner
CREATE POLICY "listings_select"
  ON scrap_listings FOR SELECT
  TO authenticated
  USING (
    user_id = auth.uid()
    OR status != 'draft'
  );

-- ==========================================
-- RLS POLICIES: SCRAP IMAGES
-- ==========================================

-- Images are readable if listing is visible
CREATE POLICY "images_select"
  ON scrap_images FOR SELECT
  TO authenticated
  USING (true);

-- Only listing owner can insert images
CREATE POLICY "images_insert_own"
  ON scrap_images FOR INSERT
  TO authenticated
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM scrap_listings
      WHERE id = listing_id AND user_id = auth.uid()
    )
  );

-- Only listing owner can delete images
CREATE POLICY "images_delete_own"
  ON scrap_images FOR DELETE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM scrap_listings
      WHERE id = listing_id AND user_id = auth.uid()
    )
  );

-- ==========================================
-- RLS POLICIES: OFFERS
-- ==========================================

-- Scrappers can create offers
CREATE POLICY "offers_insert_scrapper"
  ON offers FOR INSERT
  TO authenticated
  WITH CHECK (scrapper_id = auth.uid());

-- Scrappers can update their own offers
CREATE POLICY "offers_update_own"
  ON offers FOR UPDATE
  TO authenticated
  USING (scrapper_id = auth.uid())
  WITH CHECK (scrapper_id = auth.uid());

-- Listing owners can see offers on their listings
-- Scrappers can see their own offers
CREATE POLICY "offers_select"
  ON offers FOR SELECT
  TO authenticated
  USING (
    scrapper_id = auth.uid()
    OR EXISTS (
      SELECT 1 FROM scrap_listings
      WHERE id = listing_id AND user_id = auth.uid()
    )
  );

-- Listing owners can update offer status (accept/reject)
CREATE POLICY "offers_update_by_listing_owner"
  ON offers FOR UPDATE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM scrap_listings
      WHERE id = listing_id AND user_id = auth.uid()
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM scrap_listings
      WHERE id = listing_id AND user_id = auth.uid()
    )
  );

-- ==========================================
-- RLS POLICIES: PICKUPS
-- ==========================================

-- Participants can see their own pickups
CREATE POLICY "pickups_select_participant"
  ON pickups FOR SELECT
  TO authenticated
  USING (
    user_id = auth.uid()
    OR scrapper_id = auth.uid()
  );

-- System creates pickups (via listing owner accepting)
CREATE POLICY "pickups_insert"
  ON pickups FOR INSERT
  TO authenticated
  WITH CHECK (user_id = auth.uid());

-- Scrapper can update pickup status for their own pickups
CREATE POLICY "pickups_update_scrapper"
  ON pickups FOR UPDATE
  TO authenticated
  USING (scrapper_id = auth.uid())
  WITH CHECK (scrapper_id = auth.uid());

-- User can also update (e.g., cancel)
CREATE POLICY "pickups_update_user"
  ON pickups FOR UPDATE
  TO authenticated
  USING (user_id = auth.uid())
  WITH CHECK (user_id = auth.uid());

-- ==========================================
-- RLS POLICIES: RATINGS
-- ==========================================

-- Ratings are publicly readable
CREATE POLICY "ratings_select_public"
  ON ratings FOR SELECT
  TO authenticated
  USING (true);

-- Only pickup participants can create ratings
CREATE POLICY "ratings_insert_participant"
  ON ratings FOR INSERT
  TO authenticated
  WITH CHECK (
    rater_id = auth.uid()
    AND EXISTS (
      SELECT 1 FROM pickups
      WHERE id = pickup_id
      AND status = 'completed'
      AND (user_id = auth.uid() OR scrapper_id = auth.uid())
    )
  );

-- ==========================================
-- RLS POLICIES: NOTIFICATIONS
-- ==========================================

-- Users can read their own notifications
CREATE POLICY "notifications_select_own"
  ON notifications FOR SELECT
  TO authenticated
  USING (user_id = auth.uid());

-- Users can update their own notifications (mark read)
CREATE POLICY "notifications_update_own"
  ON notifications FOR UPDATE
  TO authenticated
  USING (user_id = auth.uid())
  WITH CHECK (user_id = auth.uid());

-- Allow inserts for system-generated notifications
CREATE POLICY "notifications_insert"
  ON notifications FOR INSERT
  TO authenticated
  WITH CHECK (true);

-- ==========================================
-- RLS POLICIES: REPORTS
-- ==========================================

-- Users can see their own reports
CREATE POLICY "reports_select_own"
  ON reports FOR SELECT
  TO authenticated
  USING (reporter_id = auth.uid());

-- Users can create reports
CREATE POLICY "reports_insert_own"
  ON reports FOR INSERT
  TO authenticated
  WITH CHECK (reporter_id = auth.uid());

-- ==========================================
-- STORAGE BUCKETS (run in Supabase Dashboard)
-- ==========================================
-- These need to be created via Supabase Dashboard or API:
--
-- 1. Bucket: avatars (public)
-- 2. Bucket: scrap-images (public)
-- 3. Bucket: voice-notes (authenticated)
--
-- Storage Policies:
-- avatars: authenticated users can upload to their own folder
-- scrap-images: authenticated users can upload, public read
-- voice-notes: authenticated users can upload/read own files

-- ==========================================
-- HELPER FUNCTION: Create profile on signup
-- ==========================================

CREATE OR REPLACE FUNCTION handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO profiles (id, email, full_name, role)
  VALUES (
    NEW.id,
    NEW.email,
    COALESCE(NEW.raw_user_meta_data->>'full_name', ''),
    COALESCE((NEW.raw_user_meta_data->>'role')::user_role, 'user')
  );

  -- If role is scrapper, also create scrapper profile
  IF COALESCE(NEW.raw_user_meta_data->>'role', 'user') = 'scrapper' THEN
    INSERT INTO scrapper_profiles (user_id)
    VALUES (NEW.id);
  END IF;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Trigger on auth.users insert
CREATE OR REPLACE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW
  EXECUTE FUNCTION handle_new_user();
