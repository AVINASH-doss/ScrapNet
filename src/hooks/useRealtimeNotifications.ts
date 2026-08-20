import { useEffect, useRef } from 'react'
import { supabase } from '../lib/supabase'
import { useAuth } from '../contexts/AuthContext'
import { useToast } from '../contexts/ToastContext'

/**
 * Subscribes to real-time notifications for the current user.
 * Shows a toast when a new notification arrives.
 */
export function useRealtimeNotifications() {
  const { profile } = useAuth()
  const { showToast } = useToast()
  const channelRef = useRef<ReturnType<typeof supabase.channel> | null>(null)

  useEffect(() => {
    if (!profile?.id) return

    const channel = supabase
      .channel(`notifications:${profile.id}`)
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'notifications',
          filter: `user_id=eq.${profile.id}`,
        },
        (payload) => {
          const notification = payload.new as { title: string; message: string; type: string }
          const toastType = notification.type.includes('accepted') ? 'success' as const
            : notification.type.includes('rejected') ? 'warning' as const
            : 'info' as const

          showToast(toastType, notification.title, notification.message)
        }
      )
      .subscribe()

    channelRef.current = channel

    return () => {
      if (channelRef.current) {
        supabase.removeChannel(channelRef.current)
      }
    }
  }, [profile?.id, showToast])
}
