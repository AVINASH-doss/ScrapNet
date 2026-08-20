import type { ScrapCategory } from '../types/database'

export const APP_NAME = 'ScrapNet'
export const APP_TAGLINE = 'Turn your scrap into value. Find a trusted collector nearby.'

/* ==========================================
   Scrap Categories
   ========================================== */

export interface CategoryInfo {
  value: ScrapCategory
  label: string
  icon: string
  color: string
}

export const SCRAP_CATEGORIES: CategoryInfo[] = [
  { value: 'paper', label: 'Paper', icon: '📄', color: '#f59e0b' },
  { value: 'cardboard', label: 'Cardboard', icon: '📦', color: '#92400e' },
  { value: 'plastic', label: 'Plastic', icon: '♻️', color: '#3b82f6' },
  { value: 'metal', label: 'Metal', icon: '🔩', color: '#6b7280' },
  { value: 'glass', label: 'Glass', icon: '🫙', color: '#06b6d4' },
  { value: 'e_waste', label: 'E-Waste', icon: '🔌', color: '#ef4444' },
  { value: 'electronics', label: 'Electronics', icon: '💻', color: '#8b5cf6' },
  { value: 'appliances', label: 'Appliances', icon: '🏠', color: '#14b8a6' },
  { value: 'batteries', label: 'Batteries', icon: '🔋', color: '#eab308' },
  { value: 'mixed', label: 'Mixed Scrap', icon: '🗑️', color: '#64748b' },
  { value: 'other', label: 'Other', icon: '📋', color: '#9ca3af' },
]

export const getCategoryInfo = (value: ScrapCategory): CategoryInfo => {
  return SCRAP_CATEGORIES.find(c => c.value === value) ?? SCRAP_CATEGORIES[SCRAP_CATEGORIES.length - 1]
}

/* ==========================================
   Quantity Units
   ========================================== */

export const QUANTITY_UNITS = [
  { value: 'kg', label: 'Kilograms (kg)' },
  { value: 'pieces', label: 'Pieces' },
  { value: 'bags', label: 'Bags' },
  { value: 'bundles', label: 'Bundles' },
  { value: 'tons', label: 'Tons' },
]

/* ==========================================
   Listing Status Labels
   ========================================== */

export const LISTING_STATUS_CONFIG: Record<string, { label: string; color: string; bg: string }> = {
  draft: { label: 'Draft', color: '#6b7280', bg: '#f3f4f6' },
  published: { label: 'Published', color: '#3b82f6', bg: '#eff6ff' },
  receiving_offers: { label: 'Receiving Offers', color: '#8b5cf6', bg: '#f5f3ff' },
  offer_accepted: { label: 'Offer Accepted', color: '#f59e0b', bg: '#fffbeb' },
  pickup_scheduled: { label: 'Pickup Scheduled', color: '#14b8a6', bg: '#f0fdfa' },
  collected: { label: 'Collected', color: '#22c55e', bg: '#f0fdf4' },
  completed: { label: 'Completed', color: '#16a34a', bg: '#dcfce7' },
  cancelled: { label: 'Cancelled', color: '#ef4444', bg: '#fef2f2' },
  expired: { label: 'Expired', color: '#9ca3af', bg: '#f9fafb' },
}

/* ==========================================
   Pickup Status Labels
   ========================================== */

export const PICKUP_STATUS_CONFIG: Record<string, { label: string; icon: string; color: string }> = {
  accepted: { label: 'Accepted', icon: '✅', color: '#22c55e' },
  on_the_way: { label: 'On the Way', icon: '🚚', color: '#3b82f6' },
  arrived: { label: 'Arrived', icon: '📍', color: '#8b5cf6' },
  collected: { label: 'Collected', icon: '📦', color: '#f59e0b' },
  completed: { label: 'Completed', icon: '🎉', color: '#16a34a' },
  cancelled: { label: 'Cancelled', icon: '❌', color: '#ef4444' },
}

/* ==========================================
   Report Reasons
   ========================================== */

export const REPORT_REASONS = [
  { value: 'no_show', label: "Collector didn't arrive" },
  { value: 'wrong_quantity', label: 'Wrong quantity' },
  { value: 'payment_dispute', label: 'Payment dispute' },
  { value: 'inappropriate_behavior', label: 'Inappropriate behavior' },
  { value: 'listing_issue', label: 'Listing issue' },
  { value: 'other', label: 'Other' },
]
