import React, { useEffect, useState, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Bell,
  CheckCheck,
  Check,
  AlertCircle,
  Clock,
  ArrowRight,
  ShieldAlert,
  Building2,
  Droplet,
} from 'lucide-react';
import { notificationsApi } from '../api/notifications.api';
import { NotificationItem, NotificationType, PageResponse } from '../types';
import { parseApiError } from '../api/client';
import { TableSkeleton } from '../components/LoadingSkeleton';
import { EmptyState } from '../components/EmptyState';
import { ErrorState } from '../components/ErrorState';
import { Pagination } from '../components/Pagination';
import { useToast } from '../components/ToastContext';

export const NotificationsPage: React.FC = () => {
  const navigate = useNavigate();
  const { showSuccessToast, showErrorToast } = useToast();

  const [data, setData] = useState<PageResponse<NotificationItem> | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<any>(null);
  const [unreadOnly, setUnreadOnly] = useState<boolean>(false);
  const [page, setPage] = useState<number>(0);
  const [size, setSize] = useState<number>(20);

  const fetchNotifications = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await notificationsApi.getNotifications({
        unreadOnly,
        page,
        size,
      });
      setData(res);
    } catch (err) {
      const parsed = parseApiError(err);
      setError(parsed);
      showErrorToast(parsed.message, parsed.code);
    } finally {
      setLoading(false);
    }
  }, [unreadOnly, page, size, showErrorToast]);

  useEffect(() => {
    fetchNotifications();
  }, [fetchNotifications]);

  const handleMarkAsRead = async (id: number) => {
    try {
      await notificationsApi.markAsRead(id);
      setData((prev) =>
        prev
          ? {
              ...prev,
              content: prev.content.map((n) => (n.id === id ? { ...n, read: true } : n)),
            }
          : null
      );
    } catch (err) {
      const parsed = parseApiError(err);
      showErrorToast(parsed.message, parsed.code);
    }
  };

  const handleMarkAllAsRead = async () => {
    try {
      await notificationsApi.markAllAsRead();
      showSuccessToast('All notifications marked as read.');
      fetchNotifications();
    } catch (err) {
      const parsed = parseApiError(err);
      showErrorToast(parsed.message, parsed.code);
    }
  };

  const handleNavigateRef = (n: NotificationItem) => {
    if (n.refType === 'BloodRequest') navigate('/requests');
    else if (n.refType === 'Inventory' || n.refType === 'Unit') navigate('/inventory');
    else if (n.refType === 'Hospital') navigate('/hospitals');
    else if (n.refType === 'Donation') navigate('/donations');
  };

  const getNotifIcon = (type: NotificationType) => {
    switch (type) {
      case 'EMERGENCY_REQUEST':
        return <AlertCircle className="w-4 h-4 text-[#B3203A]" />;
      case 'LOW_STOCK':
      case 'UNIT_NEAR_EXPIRY':
        return <Clock className="w-4 h-4 text-amber-600" />;
      case 'HOSPITAL_REGISTERED':
        return <Building2 className="w-4 h-4 text-blue-600" />;
      case 'DONATION_RECORDED':
        return <Droplet className="w-4 h-4 text-[#B3203A]" />;
      default:
        return <Bell className="w-4 h-4 text-slate-500" />;
    }
  };

  return (
    <div className="space-y-4">
      {/* Top action header */}
      <div className="bg-white p-3 rounded border border-slate-200 flex flex-col sm:flex-row items-center justify-between gap-3 shadow-xs">
        <label className="flex items-center gap-2 cursor-pointer text-xs text-slate-700 select-none">
          <input
            type="checkbox"
            checked={unreadOnly}
            onChange={(e) => {
              setUnreadOnly(e.target.checked);
              setPage(0);
            }}
            className="rounded text-[#B3203A] focus:ring-[#B3203A] border-slate-300"
          />
          <span className="font-medium">Show Unread Only</span>
        </label>

        <button
          type="button"
          onClick={handleMarkAllAsRead}
          className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold text-slate-700 bg-slate-50 hover:bg-slate-100 rounded border border-slate-200 transition-colors"
        >
          <CheckCheck className="w-3.5 h-3.5 text-slate-500" />
          <span>Mark All As Read</span>
        </button>
      </div>

      {/* Notifications List */}
      {loading && !data ? (
        <TableSkeleton rows={6} columns={4} />
      ) : error && !data ? (
        <ErrorState error={error} onRetry={fetchNotifications} />
      ) : !data || data.content.length === 0 ? (
        <EmptyState
          title="No notifications to show"
          description="You are completely caught up with all operational alerts and notices."
          actionLabel={unreadOnly ? 'Show All Notifications' : undefined}
          onAction={unreadOnly ? () => setUnreadOnly(false) : undefined}
        />
      ) : (
        <div className="bg-white rounded border border-slate-200 overflow-hidden shadow-xs divide-y divide-slate-100">
          {data.content.map((item) => (
            <div
              key={item.id}
              className={`p-3.5 flex flex-col sm:flex-row sm:items-center justify-between gap-3 transition-colors ${
                !item.read ? 'bg-amber-50/20' : 'hover:bg-slate-50/50'
              }`}
            >
              <div className="flex items-start gap-3">
                <div className="p-2 rounded bg-slate-100 shrink-0 mt-0.5">
                  {getNotifIcon(item.type)}
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <h4 className="font-semibold text-xs text-slate-900">{item.title}</h4>
                    {!item.read && (
                      <span className="font-mono text-[9px] font-bold text-[#B3203A] bg-rose-50 px-1 py-0.2 rounded border border-[#B3203A]/20">
                        NEW
                      </span>
                    )}
                    <span className="font-mono text-[10px] text-slate-400">
                      {new Date(item.createdAt).toLocaleString()}
                    </span>
                  </div>
                  <p className="text-xs text-slate-600 mt-0.5 leading-relaxed">{item.message}</p>
                </div>
              </div>

              <div className="flex items-center gap-2 self-end sm:self-center shrink-0">
                <button
                  type="button"
                  onClick={() => handleNavigateRef(item)}
                  className="inline-flex items-center gap-1 text-[11px] font-medium text-slate-700 hover:text-slate-900 px-2 py-1 rounded hover:bg-slate-100"
                >
                  <span>Open {item.refType}</span>
                  <ArrowRight className="w-3 h-3" />
                </button>

                {!item.read && (
                  <button
                    type="button"
                    onClick={() => handleMarkAsRead(item.id)}
                    title="Mark as read"
                    className="p-1 rounded text-slate-400 hover:text-emerald-700 hover:bg-emerald-50 transition-colors"
                  >
                    <Check className="w-4 h-4" />
                  </button>
                )}
              </div>
            </div>
          ))}

          <Pagination
            page={data.page}
            size={data.size}
            totalElements={data.totalElements}
            totalPages={data.totalPages}
            onPageChange={(p) => setPage(p)}
            onSizeChange={(s) => setSize(s)}
          />
        </div>
      )}
    </div>
  );
};
