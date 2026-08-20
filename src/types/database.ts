/* ==========================================
   ScrapNet Database Types
   Generated from schema design
   ========================================== */

export type UserRole = 'user' | 'scrapper' | 'admin'

export type ListingStatus =
  | 'draft'
  | 'published'
  | 'receiving_offers'
  | 'offer_accepted'
  | 'pickup_scheduled'
  | 'collected'
  | 'completed'
  | 'cancelled'
  | 'expired'

export type OfferStatus = 'pending' | 'accepted' | 'rejected' | 'expired' | 'withdrawn'

export type PickupStatus =
  | 'accepted'
  | 'on_the_way'
  | 'arrived'
  | 'collected'
  | 'completed'
  | 'cancelled'

export type ScrapCategory =
  | 'paper'
  | 'cardboard'
  | 'plastic'
  | 'metal'
  | 'glass'
  | 'e_waste'
  | 'electronics'
  | 'appliances'
  | 'batteries'
  | 'mixed'
  | 'other'

export type NotificationType =
  | 'offer_received'
  | 'offer_accepted'
  | 'offer_rejected'
  | 'pickup_scheduled'
  | 'pickup_on_the_way'
  | 'pickup_arrived'
  | 'pickup_completed'
  | 'rating_request'
  | 'new_nearby_listing'
  | 'pickup_cancelled'
  | 'pickup_reminder'

export type ReportReason =
  | 'no_show'
  | 'wrong_quantity'
  | 'payment_dispute'
  | 'inappropriate_behavior'
  | 'listing_issue'
  | 'other'

/* ==========================================
   Table Row Types
   ========================================== */

export interface Profile {
  id: string
  email: string
  full_name: string
  phone: string | null
  avatar_url: string | null
  role: UserRole
  address: string | null
  area: string | null
  city: string | null
  pincode: string | null
  latitude: number | null
  longitude: number | null
  apartment_name: string | null
  pickup_instructions: string | null
  avg_rating: number
  total_transactions: number
  created_at: string
  updated_at: string
}

export interface ScrapperProfile {
  id: string
  user_id: string
  business_name: string | null
  categories_accepted: ScrapCategory[]
  service_radius_km: number
  experience_years: number | null
  is_verified: boolean
  verification_status: string
  avg_rating: number
  completed_pickups: number
  total_offers: number
  total_earnings: number
  created_at: string
  updated_at: string
}

export interface ScrapListing {
  id: string
  user_id: string
  title: string
  category: ScrapCategory
  subcategory: string | null
  description: string | null
  estimated_quantity: number
  quantity_unit: string
  condition: string | null
  voice_note_url: string | null
  preferred_pickup_date: string | null
  preferred_pickup_time_start: string | null
  preferred_pickup_time_end: string | null
  pickup_address: string | null
  pickup_area: string | null
  pickup_city: string | null
  pickup_pincode: string | null
  pickup_latitude: number | null
  pickup_longitude: number | null
  additional_instructions: string | null
  status: ListingStatus
  offer_count: number
  created_at: string
  updated_at: string
}

export interface ScrapImage {
  id: string
  listing_id: string
  image_url: string
  display_order: number
  created_at: string
}

export interface Offer {
  id: string
  listing_id: string
  scrapper_id: string
  offered_amount: number
  proposed_pickup_time: string | null
  note: string | null
  status: OfferStatus
  created_at: string
  updated_at: string
}

export interface Pickup {
  id: string
  listing_id: string
  offer_id: string
  user_id: string
  scrapper_id: string
  agreed_amount: number
  pickup_date: string | null
  pickup_time: string | null
  pickup_address: string
  pickup_latitude: number | null
  pickup_longitude: number | null
  contact_phone: string | null
  pickup_instructions: string | null
  status: PickupStatus
  completed_at: string | null
  created_at: string
  updated_at: string
}

export interface Rating {
  id: string
  pickup_id: string
  rater_id: string
  rated_id: string
  rating: number
  comment: string | null
  created_at: string
}

export interface Notification {
  id: string
  user_id: string
  type: NotificationType
  title: string
  message: string
  data: Record<string, unknown> | null
  is_read: boolean
  created_at: string
}

export interface Report {
  id: string
  reporter_id: string
  reported_id: string | null
  pickup_id: string | null
  listing_id: string | null
  reason: ReportReason
  description: string | null
  status: string
  created_at: string
  resolved_at: string | null
}

/* ==========================================
   Extended / Join Types
   ========================================== */

export interface OfferWithScrapper extends Offer {
  scrapper_profile: ScrapperProfile & {
    profile: Pick<Profile, 'full_name' | 'avatar_url' | 'latitude' | 'longitude'>
  }
}

export interface ListingWithImages extends ScrapListing {
  scrap_images: ScrapImage[]
  profile?: Pick<Profile, 'full_name' | 'avatar_url' | 'area' | 'city'>
}

export interface PickupWithDetails extends Pickup {
  listing: ScrapListing
  offer: Offer
  user_profile: Pick<Profile, 'full_name' | 'avatar_url' | 'phone'>
  scrapper_user_profile: Pick<Profile, 'full_name' | 'avatar_url' | 'phone'>
}

/* ==========================================
   Supabase Database Type (minimal)
   ========================================== */

export interface Database {
  public: {
    Tables: {
      profiles: {
        Row: Profile
        Insert: Partial<Profile> & Pick<Profile, 'id' | 'email' | 'role'>
        Update: Partial<Profile>
      }
      scrapper_profiles: {
        Row: ScrapperProfile
        Insert: Partial<ScrapperProfile> & Pick<ScrapperProfile, 'user_id'>
        Update: Partial<ScrapperProfile>
      }
      scrap_listings: {
        Row: ScrapListing
        Insert: Partial<ScrapListing> & Pick<ScrapListing, 'user_id' | 'title' | 'category' | 'estimated_quantity' | 'quantity_unit'>
        Update: Partial<ScrapListing>
      }
      scrap_images: {
        Row: ScrapImage
        Insert: Partial<ScrapImage> & Pick<ScrapImage, 'listing_id' | 'image_url'>
        Update: Partial<ScrapImage>
      }
      offers: {
        Row: Offer
        Insert: Partial<Offer> & Pick<Offer, 'listing_id' | 'scrapper_id' | 'offered_amount'>
        Update: Partial<Offer>
      }
      pickups: {
        Row: Pickup
        Insert: Partial<Pickup> & Pick<Pickup, 'listing_id' | 'offer_id' | 'user_id' | 'scrapper_id' | 'agreed_amount' | 'pickup_address'>
        Update: Partial<Pickup>
      }
      ratings: {
        Row: Rating
        Insert: Partial<Rating> & Pick<Rating, 'pickup_id' | 'rater_id' | 'rated_id' | 'rating'>
        Update: Partial<Rating>
      }
      notifications: {
        Row: Notification
        Insert: Partial<Notification> & Pick<Notification, 'user_id' | 'type' | 'title' | 'message'>
        Update: Partial<Notification>
      }
      reports: {
        Row: Report
        Insert: Partial<Report> & Pick<Report, 'reporter_id' | 'reason'>
        Update: Partial<Report>
      }
    }
    Functions: Record<string, never>
    Enums: {
      user_role: UserRole
      listing_status: ListingStatus
      offer_status: OfferStatus
      pickup_status: PickupStatus
      scrap_category: ScrapCategory
      notification_type: NotificationType
      report_reason: ReportReason
    }
  }
}
