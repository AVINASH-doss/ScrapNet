import { useState, useEffect } from 'react'
import { Link } from 'react-router-dom'
import { useAuth } from '../../contexts/AuthContext'
import { supabase } from '../../lib/supabase'
import { formatDate } from '../../lib/utils'
import type { Notification } from '../../types/database'
import {
  Recycle, ArrowLeft, Bell, CheckCheck, Loader2,
  Package, IndianRupee, Truck, Star, MessageSquare
} from 'lucide-react'

const iconMap: Record<string, React.ReactNode> = {
  offer_received: <IndianRupee className="w-4 h-4" />,
  offer_accepted: <Package className="w-4 h-4" />,
  offer_rejected: <MessageSquare className="w-4 h-4" />,
  pickup_scheduled: <Truck className="w-4 h-4" />,
  pickup_on_the_way: <Truck className="w-4 h-4" />,
  pickup_arrived: <Truck className="w-4 h-4" />,
  pickup_completed: <Package className="w-4 h-4" />,
  rating_request: <Star className="w-4 h-4" />,
  new_nearby_listing: <Package className="w-4 h-4" />,
  pickup_cancelled: <MessageSquare className="w-4 h-4" />,
  pickup_reminder: <Bell className="w-4 h-4" />,
}

export default function NotificationsPage() {
  const { profile } = useAuth()
  const [notifications, setNotifications] = useState<Notification[]>([])
  const [loading, setLoading] = useState(true)

  const backPath = profile?.role === 'scrapper' ? '/scrapper/dashboard' : '/user/dashboard'

  useEffect(() => {
    if (profile?.id) fetchNotifications()
  }, [profile?.id])

  const fetchNotifications = async () => {
    if (!profile) return
    setLoading(true)
    const { data } = await supabase
      .from('notifications')
      .select('*')
      .eq('user_id', profile.id)
      .order('created_at', { ascending: false })
      .limit(50)

    if (data) setNotifications(data as unknown as Notification[])
    setLoading(false)
  }

  const markAllRead = async () => {
    if (!profile) return
    await supabase
      .from('notifications')
      .update({ is_read: true })
      .eq('user_id', profile.id)
      .eq('is_read', false)

    setNotifications(prev => prev.map(n => ({ ...n, is_read: true })))
  }

  const markRead = async (id: string) => {
    await supabase.from('notifications').update({ is_read: true }).eq('id', id)
    setNotifications(prev => prev.map(n => n.id === id ? { ...n, is_read: true } : n))
  }

  const unreadCount = notifications.filter(n => !n.is_read).length

  return (
    <div className="min-h-screen bg-surface-50">
      <header className="bg-white border-b border-surface-200 sticky top-0 z-40">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
          <div className="flex items-center gap-4">
            <Link to={backPath} className="p-2 hover:bg-surface-100 rounded-xl transition-colors">
              <ArrowLeft className="w-5 h-5 text-text-secondary" />
            </Link>
            <div className="flex items-center gap-2.5">
              <div className="w-9 h-9 gradient-brand rounded-lg flex items-center justify-center">
                <Bell className="w-5 h-5 text-white" />
              </div>
              <span className="text-lg font-bold text-text-primary">Notifications</span>
              {unreadCount > 0 && (
                <span className="px-2 py-0.5 bg-brand-500 text-white text-xs font-bold rounded-full">
                  {unreadCount}
                </span>
              )}
            </div>
          </div>
          {unreadCount > 0 && (
            <button
              onClick={markAllRead}
              className="flex items-center gap-1.5 text-sm text-brand-600 font-medium hover:text-brand-700 cursor-pointer"
            >
              <CheckCheck className="w-4 h-4" /> Mark all read
            </button>
          )}
        </div>
      </header>

      <main className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {loading && (
          <div className="flex items-center justify-center py-20">
            <Loader2 className="w-8 h-8 text-brand-600 animate-spin" />
          </div>
        )}

        {!loading && notifications.length === 0 && (
          <div className="bg-white rounded-2xl border border-surface-200 p-8 text-center">
            <div className="w-16 h-16 bg-surface-100 rounded-2xl flex items-center justify-center mx-auto mb-4">
              <Bell className="w-8 h-8 text-text-muted" />
            </div>
            <h3 className="text-lg font-semibold text-text-primary mb-2">No notifications</h3>
            <p className="text-text-secondary">You're all caught up!</p>
          </div>
        )}

        <div className="space-y-2">
          {notifications.map(notification => (
            <button
              key={notification.id}
              onClick={() => markRead(notification.id)}
              className={`w-full text-left flex items-start gap-4 p-4 rounded-2xl transition-all cursor-pointer ${
                notification.is_read
                  ? 'bg-white border border-surface-200'
                  : 'bg-brand-50 border border-brand-200 shadow-sm'
              }`}
            >
              <div className={`w-10 h-10 rounded-xl flex items-center justify-center shrink-0 ${
                notification.is_read ? 'bg-surface-100 text-text-muted' : 'bg-brand-100 text-brand-600'
              }`}>
                {iconMap[notification.type] || <Bell className="w-4 h-4" />}
              </div>
              <div className="flex-1 min-w-0">
                <h4 className={`text-sm font-semibold ${notification.is_read ? 'text-text-primary' : 'text-brand-800'}`}>
                  {notification.title}
                </h4>
                <p className="text-sm text-text-secondary mt-0.5">{notification.message}</p>
                <p className="text-xs text-text-muted mt-1">{formatDate(notification.created_at)}</p>
              </div>
              {!notification.is_read && (
                <div className="w-2.5 h-2.5 bg-brand-500 rounded-full shrink-0 mt-1.5" />
              )}
            </button>
          ))}
        </div>
      </main>
    </div>
  )
}
