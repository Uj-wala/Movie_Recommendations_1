import { FiBell, FiCheck, FiHeart, FiRefreshCw, FiUserPlus, FiX } from 'react-icons/fi';

const notificationIcons = {
  review_liked: FiHeart,
  collection_followed: FiUserPlus,
  recommendation_generated: FiRefreshCw,
};

const formatNotificationDate = (value) => {
  if (!value) return '';
  try {
    return new Intl.DateTimeFormat(undefined, {
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    }).format(new Date(value));
  } catch {
    return '';
  }
};

export const NotificationPanel = ({
  isOpen,
  notifications = [],
  unreadCount = 0,
  onClose,
  onMarkRead,
  onMarkAllRead,
}) => {
  if (!isOpen) return null;

  return (
    <div className="fixed right-4 top-20 z-50 w-[min(calc(100vw-2rem),26rem)] overflow-hidden rounded-3xl border border-white/10 bg-slate-950/95 text-white shadow-[0_24px_90px_rgba(0,0,0,0.55)] backdrop-blur-2xl">
      <div className="flex items-center justify-between border-b border-white/10 px-5 py-4">
        <div className="flex items-center gap-3">
          <span className="grid h-10 w-10 place-items-center rounded-2xl bg-cyan-300/15 text-cyan-100">
            <FiBell />
          </span>
          <div>
            <p className="text-sm font-black uppercase tracking-[0.2em] text-cyan-100">Notifications</p>
            <p className="text-xs text-slate-400">{unreadCount} unread</p>
          </div>
        </div>
        <button
          type="button"
          onClick={onClose}
          className="grid h-9 w-9 place-items-center rounded-2xl border border-white/10 bg-white/10 text-slate-200 transition hover:bg-white/15"
          aria-label="Close notifications"
        >
          <FiX />
        </button>
      </div>

      <div className="max-h-[28rem] overflow-y-auto p-3">
        {notifications.length === 0 ? (
          <div className="p-6 text-center text-sm text-slate-400">No notifications yet.</div>
        ) : (
          <div className="space-y-2">
            {notifications.map((notification) => {
              const Icon = notificationIcons[notification.type] || FiBell;
              return (
                <div
                  key={notification.id}
                  className={`rounded-2xl border p-4 ${
                    notification.is_read
                      ? 'border-white/10 bg-white/5 text-slate-300'
                      : 'border-cyan-300/25 bg-cyan-300/10 text-white'
                  }`}
                >
                  <div className="flex items-start gap-3">
                    <span className="mt-0.5 grid h-9 w-9 shrink-0 place-items-center rounded-xl bg-slate-900 text-cyan-100">
                      <Icon />
                    </span>
                    <div className="min-w-0 flex-1">
                      <p className="text-sm font-semibold leading-6">{notification.message}</p>
                      <p className="mt-1 text-xs text-slate-400">
                        {formatNotificationDate(notification.created_at)}
                      </p>
                    </div>
                    {!notification.is_read && (
                      <button
                        type="button"
                        onClick={() => onMarkRead?.(notification.id)}
                        className="grid h-8 w-8 shrink-0 place-items-center rounded-xl border border-cyan-300/30 bg-cyan-300/10 text-cyan-100 transition hover:bg-cyan-300/20"
                        aria-label="Mark notification as read"
                        title="Mark as read"
                      >
                        <FiCheck />
                      </button>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {notifications.length > 0 && (
        <div className="border-t border-white/10 p-3">
          <button
            type="button"
            onClick={onMarkAllRead}
            disabled={unreadCount === 0}
            className="inline-flex w-full items-center justify-center gap-2 rounded-2xl bg-cyan-300 px-4 py-3 text-sm font-black text-slate-950 transition hover:bg-cyan-200 disabled:cursor-not-allowed disabled:opacity-50"
          >
            <FiCheck />
            Mark all as read
          </button>
        </div>
      )}
    </div>
  );
};
