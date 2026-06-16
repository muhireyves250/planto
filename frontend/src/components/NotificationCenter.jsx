import React from 'react';
import { Bell, CheckSquare, Trash2, X } from 'lucide-react';
import { formatDistanceToNow } from 'date-fns';

export default function NotificationCenter({ notifications, isOpen, onClose }) {
  if (!isOpen) return null;

  const { alerts, unread, markRead, markAllRead, deleteAlert } = notifications;

  return (
    <>
      <div 
        className="fixed inset-0 bg-black/20 backdrop-blur-sm z-40 transition-opacity"
        onClick={() => onClose()}
      />
      
      <div className="fixed top-0 right-0 h-full w-[400px] max-w-full bg-white z-50 shadow-2xl flex flex-col animate-slideInRight">
        <div className="p-6 border-b border-gray-100 flex items-center justify-between bg-white sticky top-0">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-full bg-[#f4f7f4] flex items-center justify-center">
              <Bell className="w-5 h-5 text-[#1e362a]" />
            </div>
            <div>
              <h2 className="text-xl font-bold text-gray-900 leading-tight">Notifications</h2>
              <p className="text-sm text-gray-500 font-medium">
                {unread > 0 ? `You have ${unread} unread alerts` : "You're all caught up!"}
              </p>
            </div>
          </div>
          <button 
            onClick={() => onClose()} 
            className="w-8 h-8 flex items-center justify-center rounded-full hover:bg-gray-100 text-gray-500 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {unread > 0 && (
          <div className="px-6 py-3 bg-[#fdfaf0] border-b border-[#f5ebd7] flex justify-end">
            <button 
              onClick={markAllRead}
              className="text-xs font-bold text-[#b45309] hover:text-[#d97706] flex items-center gap-1.5 transition-colors"
            >
              <CheckSquare className="w-3.5 h-3.5" />
              Mark all as read
            </button>
          </div>
        )}

        <div className="flex-1 overflow-y-auto w-full">
          {alerts.length === 0 ? (
            <div className="h-full flex flex-col items-center justify-center text-gray-400 gap-4">
              <Bell className="w-12 h-12 opacity-20" />
              <p className="font-medium">No notifications yet</p>
            </div>
          ) : (
            <div className="divide-y divide-gray-50">
              {alerts.map((alert) => (
                <div 
                  key={alert.id} 
                  className={`p-5 transition-colors hover:bg-gray-50 ${!alert.is_read ? 'bg-[#f4f7f4]/50' : 'bg-white'}`}
                >
                  <div className="flex gap-4">
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between mb-1">
                        <span className={`text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full ${
                          alert.type === 'critical' ? 'bg-red-100 text-red-700' : 
                          alert.type === 'warning' ? 'bg-amber-100 text-amber-700' : 
                          'bg-blue-100 text-blue-700'
                        }`}>
                          {alert.type}
                        </span>
                        <span className="text-xs font-medium text-gray-400">
                          {formatDistanceToNow(new Date(alert.created_at), { addSuffix: true })}
                        </span>
                      </div>
                      <h4 className="text-sm font-bold text-gray-900 mb-1 line-clamp-1">{alert.title}</h4>
                      <p className="text-sm text-gray-600 line-clamp-2 leading-relaxed">
                        {alert.message}
                      </p>
                    </div>
                  </div>

                  <div className="mt-4 flex items-center gap-4 pl-0">
                    {!alert.is_read && (
                      <button 
                        onClick={() => markRead(alert.id)}
                        className="text-xs font-semibold text-[#16a34a] hover:text-[#15803d]"
                      >
                        Mark as read
                      </button>
                    )}
                    {alert.action_url && (
                      <a 
                        href={alert.action_url}
                        className="text-xs font-semibold text-blue-600 hover:text-blue-700"
                        onClick={() => onClose()}
                      >
                        View Details
                      </a>
                    )}
                    <button 
                      onClick={() => deleteAlert(alert.id)}
                      className="ml-auto text-gray-400 hover:text-red-600 transition-colors"
                      title="Delete notification"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </>
  );
}
