import React, { useState, useEffect } from 'react'
import { X, Send, CheckCircle2, MessageSquare } from 'lucide-react'
import { buildWhatsAppLink } from '@/lib/utils'

interface QueueItem {
  id: string
  name: string
  phone: string
  message: string
}

interface WhatsAppQueueModalProps {
  isOpen: boolean
  onClose: () => void
  items: QueueItem[]
  onSend?: (item: QueueItem) => void
}

export function WhatsAppQueueModal({ isOpen, onClose, items, onSend }: WhatsAppQueueModalProps) {
  const [currentIndex, setCurrentIndex] = useState(0)

  // Reset when opened with new items
  useEffect(() => {
    if (isOpen) {
      setCurrentIndex(0)
    }
  }, [isOpen, items])

  if (!isOpen) return null

  const isDone = currentIndex >= items.length
  const currentItem = items[currentIndex]

  const handleSend = () => {
    if (!currentItem) return
    window.open(buildWhatsAppLink(currentItem.phone, currentItem.message), '_blank')
    if (onSend) onSend(currentItem)
    setCurrentIndex(prev => prev + 1)
  }

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 sm:p-0">
      <div className="absolute inset-0 bg-black/40 backdrop-blur-sm" onClick={onClose} />
      
      <div className="bg-white rounded-2xl shadow-xl w-full max-w-sm overflow-hidden relative z-10 animate-in fade-in zoom-in-95 duration-200">
        <div className="flex items-center justify-between p-4 border-b border-gray-100">
          <div className="flex items-center gap-2">
            <MessageSquare size={18} className="text-emerald-500" />
            <h3 className="font-semibold text-gray-800">Sending Queue</h3>
          </div>
          <button onClick={onClose} className="p-1.5 rounded-lg hover:bg-gray-100 text-gray-400 transition-colors">
            <X size={16} />
          </button>
        </div>

        <div className="p-6 text-center">
          {isDone ? (
            <div className="flex flex-col items-center py-4">
              <div className="w-12 h-12 rounded-full bg-emerald-100 flex items-center justify-center mb-3">
                <CheckCircle2 size={24} className="text-emerald-600" />
              </div>
              <h4 className="text-lg font-semibold text-gray-800">All Done!</h4>
              <p className="text-sm text-gray-500 mt-1">Successfully sent {items.length} messages.</p>
              <button 
                onClick={onClose}
                className="mt-6 px-6 py-2 bg-gray-900 text-white rounded-xl text-sm font-medium hover:bg-gray-800 transition-colors"
              >
                Close Window
              </button>
            </div>
          ) : (
            <div className="flex flex-col items-center">
              <div className="text-xs font-medium text-gray-400 uppercase tracking-wider mb-4">
                Message {currentIndex + 1} of {items.length}
              </div>
              
              <div className="bg-gray-50 border border-gray-100 rounded-xl p-4 w-full mb-6">
                <p className="text-sm font-medium text-gray-800">{currentItem.name}</p>
                <p className="text-xs text-gray-500 mt-0.5">{currentItem.phone}</p>
              </div>

              <button 
                onClick={handleSend}
                className="w-full flex items-center justify-center gap-2 py-3 bg-emerald-500 text-white rounded-xl text-sm font-medium hover:bg-emerald-600 active:scale-[0.98] transition-all shadow-sm shadow-emerald-500/20"
              >
                <Send size={16} />
                Send to {currentItem.name.split(' ')[0]}
              </button>

              <button 
                onClick={() => setCurrentIndex(prev => prev + 1)}
                className="mt-3 text-xs text-gray-400 hover:text-gray-600 transition-colors"
              >
                Skip this person
              </button>
            </div>
          )}
        </div>

        {/* Progress Bar */}
        {!isDone && (
          <div className="h-1.5 w-full bg-gray-100">
            <div 
              className="h-full bg-emerald-500 transition-all duration-300 ease-out" 
              style={{ width: `${(currentIndex / items.length) * 100}%` }}
            />
          </div>
        )}
      </div>
    </div>
  )
}
