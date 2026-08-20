import { useState } from 'react'
import { supabase } from '../../lib/supabase'
import { useAuth } from '../../contexts/AuthContext'
import { useToast } from '../../contexts/ToastContext'
import { Flag, X, Loader2, Send } from 'lucide-react'

interface ReportModalProps {
  targetType: 'listing' | 'user' | 'scrapper'
  targetId: string
  onClose: () => void
}

const REPORT_REASONS = [
  'Fraudulent listing',
  'Inappropriate content',
  'Fake account / impersonation',
  'Spam or scam',
  'Harassment or abusive behavior',
  'Misleading information',
  'Other',
]

export default function ReportModal({ targetType, targetId, onClose }: ReportModalProps) {
  const { profile } = useAuth()
  const { showToast } = useToast()
  const [reason, setReason] = useState('')
  const [details, setDetails] = useState('')
  const [submitting, setSubmitting] = useState(false)

  const handleSubmit = async () => {
    if (!profile || !reason) {
      showToast('error', 'Please select a reason')
      return
    }
    setSubmitting(true)
    try {
      await supabase.from('reports').insert({
        reporter_id: profile.id,
        reported_entity_type: targetType,
        reported_entity_id: targetId,
        reason,
        details: details || null,
      })
      showToast('success', 'Report submitted', 'Our team will review this shortly.')
      onClose()
    } catch {
      showToast('error', 'Failed to submit report')
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm animate-fade-in" onClick={onClose}>
      <div className="bg-white rounded-2xl w-full max-w-md shadow-2xl" onClick={e => e.stopPropagation()}>
        <div className="flex items-center justify-between p-5 border-b border-surface-200">
          <h3 className="text-lg font-semibold text-text-primary flex items-center gap-2">
            <Flag className="w-5 h-5 text-red-500" /> Report
          </h3>
          <button onClick={onClose} className="p-1.5 hover:bg-surface-100 rounded-lg transition-colors cursor-pointer">
            <X className="w-5 h-5 text-text-muted" />
          </button>
        </div>
        <div className="p-5 space-y-4">
          <div>
            <label className="block text-sm font-medium text-text-primary mb-2">Reason</label>
            <div className="space-y-2">
              {REPORT_REASONS.map(r => (
                <button
                  key={r}
                  type="button"
                  onClick={() => setReason(r)}
                  className={`w-full text-left px-4 py-2.5 rounded-xl text-sm transition-all cursor-pointer ${
                    reason === r
                      ? 'bg-red-50 text-red-700 border-2 border-red-300'
                      : 'bg-surface-50 text-text-secondary border-2 border-transparent hover:border-surface-300'
                  }`}
                >
                  {r}
                </button>
              ))}
            </div>
          </div>
          <div>
            <label className="block text-sm font-medium text-text-primary mb-1.5">Additional details (optional)</label>
            <textarea
              value={details}
              onChange={e => setDetails(e.target.value)}
              placeholder="Provide any additional context..."
              rows={3}
              className="w-full px-4 py-2.5 bg-surface-50 border border-surface-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-red-500/20 focus:border-red-500 resize-none"
            />
          </div>
        </div>
        <div className="flex gap-3 p-5 border-t border-surface-200">
          <button onClick={onClose} className="flex-1 py-2.5 text-sm font-medium text-text-secondary border border-surface-200 rounded-xl hover:bg-surface-50 cursor-pointer">
            Cancel
          </button>
          <button
            onClick={handleSubmit}
            disabled={submitting || !reason}
            className="flex-1 bg-red-500 text-white font-semibold py-2.5 rounded-xl hover:bg-red-600 flex items-center justify-center gap-2 disabled:opacity-50 cursor-pointer transition-colors"
          >
            {submitting ? <Loader2 className="w-4 h-4 animate-spin" /> : <Send className="w-4 h-4" />}
            Submit Report
          </button>
        </div>
      </div>
    </div>
  )
}
