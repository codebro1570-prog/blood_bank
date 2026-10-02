import React, { useState, useEffect, useCallback } from 'react';
import { notificationsApi } from '../api/notifications';
import { NotificationItem, PageResponse, ApiError } from '../types';
import { parseApiError } from '../api/client';
import { useToast } from '../components/Toast';
import { TableSkeleton } from '../components/Skeleton';
import { EmptyState } from '../components/EmptyState';
import { ErrorState } from '../components/ErrorState';
import {
  Bell,
  Check,
  CheckCheck,
  RefreshCw,
  Clock,
  Filter,
} from 'lucide-react';

export const NotificationsPage: React.FC = () => {
  const { showSuccess, showApiError } = useToast();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<ApiError | null>(null);
  const [unreadOnly, setUnreadOnly] = useState(false);
  const [pageData, setPageData] = useState<PageResponse<NotificationItem>>({
    content: [],
    page: 0,
    size: 20,
    totalElements: 0,
    totalPages: 1,
  });

  const fetchNotifications = useCallback(
    async (pageIndex: number = pageData.page) => {
      setLoading(true);
      setError(null);
      try {
        const response = await notificationsApi.getNotifications({
          page: pageIndex,
          size: pageData.size,
          unreadOnly: unreadOnly || undefined,
        });
        setPageData(response);
      } catch (err: any) {
        setError(parseApiError(err));
      } finally {
        setLoading(false);
      }
    },
    [pageData.size, pageData.page, unreadOnly]
  );

  useEffect(() => {
    fetchNotifications(0);
  }, [unreadOnly, fetchNotifications]);

  const handleMarkAsRead = async (id: number) => {
    try {
      await notificationsApi.markAsRead(id);
      setPageData((prev) => ({
        ...prev,
        content: prev.content.map((n) => (n.id === id ? { ...n, read: true } : n)),
      }));
      showSuccess('Notification marked as read');
    } catch (err: any) {
      showApiError(parseApiError(err));
    }
  };

  const handleMarkAllAsRead = async () => {
    try {
      await notificationsApi.markAllAsRead();
      setPageData((prev) => ({
        ...prev,
        content: prev.content.map((n) => ({ ...n, read: true })),
      }));
      showSuccess('All notifications marked as read');
    } catch (err: any) {
      showApiError(parseApiError(err));
    }
  };

  return (
    <div className="space-y-6 max-w-4xl">
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-xl sm:text-2xl font-bold tracking-tight text-slate-900">
            Desk Notifications
          </h1>
          <p className="text-xs sm:text-sm text-slate-500">
            Contract Section K · Dispatch alerts, approval notices, and status changes
          </p>
        </div>

        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={handleMarkAllAsRead}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold text-slate-700 bg-white border border-slate-300 rounded-md hover:bg-slate-50 transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-[#0F6B63]"
          >
            <CheckCheck className="w-3.5 h-3.5 text-[#0F6B63]" />
            <span>Mark All as Read</span>
          </button>
          <button
            type="button"
            onClick={() => fetchNotifications(pageData.page)}
            disabled={loading}
            className="p-1.5 text-slate-600 hover:text-slate-900 border border-slate-300 rounded-md hover:bg-slate-50 transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-[#0F6B63]"
            title="Refresh"
            aria-label="Refresh"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin' : ''}`} />
          </button>
        </div>
      </div>

      {/* Filter Tabs */}
      <div className="flex items-center gap-2 border-b border-slate-200 pb-3">
        <button
          type="button"
          onClick={() => setUnreadOnly(false)}
          className={`px-3 py-1.5 text-xs font-semibold rounded-md transition-colors ${
            !unreadOnly
              ? 'bg-[#0F6B63] text-white shadow-xs'
              : 'text-slate-600 hover:bg-slate-100'
          }`}
        >
          All Notifications
        </button>
        <button
          type="button"
          onClick={() => setUnreadOnly(true)}
          className={`px-3 py-1.5 text-xs font-semibold rounded-md transition-colors ${
            unreadOnly
              ? 'bg-[#0F6B63] text-white shadow-xs'
              : 'text-slate-600 hover:bg-slate-100'
          }`}
        >
          Unread Only
        </button>
      </div>

      {/* Error state */}
      {error && (
        <ErrorState
          error={error}
          onRetry={() => fetchNotifications(pageData.page)}
          title="Failed to Load Notifications"
        />
      )}

      {/* List */}
      <div className="bg-white border border-slate-200 rounded-lg shadow-xs overflow-hidden">
        {loading ? (
          <TableSkeleton rows={4} columns={3} />
        ) : pageData.content.length === 0 ? (
          <div className="p-8">
            <EmptyState
              icon={Bell}
              title="No Notifications"
              description={
                unreadOnly
                  ? 'You have caught up with all desk notifications. No unread alerts.'
                  : 'No notification records exist for this hospital blood desk account.'
              }
              actionLabel={unreadOnly ? 'Show All Notifications' : undefined}
              onAction={unreadOnly ? () => setUnreadOnly(false) : undefined}
            />
          </div>
        ) : (
          <div className="divide-y divide-slate-100">
            {pageData.content.map((item) => (
              <div
                key={item.id}
                className={`p-4 sm:p-5 flex items-start justify-between gap-4 transition-colors ${
                  item.read ? 'bg-white' : 'bg-teal-50/30'
                }`}
              >
                <div className="flex items-start gap-3 min-w-0">
                  <div
                    className={`mt-1 w-2.5 h-2.5 rounded-full shrink-0 ${
                      item.read ? 'bg-slate-300' : 'bg-[#0F6B63]'
                    }`}
                    aria-hidden="true"
                  />
                  <div className="min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                      <h3 className="text-sm font-bold text-slate-900 leading-tight">
                        {item.title}
                      </h3>
                      <span className="font-mono text-[11px] px-1.5 py-0.5 bg-slate-100 text-slate-600 rounded">
                        {item.type}
                      </span>
                    </div>
                    <p className="mt-1 text-xs sm:text-sm text-slate-600 leading-relaxed">
                      {item.message}
                    </p>
                    <div className="mt-2 flex items-center gap-2 text-[11px] text-slate-400 font-mono">
                      <Clock className="w-3 h-3" />
                      <span>{new Date(item.createdAt).toLocaleString()}</span>
                      {item.refType && (
                        <>
                          <span>·</span>
                          <span>
                            Ref: {item.refType} #{item.refId}
                          </span>
                        </>
                      )}
                    </div>
                  </div>
                </div>

                {!item.read && (
                  <button
                    type="button"
                    onClick={() => handleMarkAsRead(item.id)}
                    className="shrink-0 p-1.5 text-xs text-slate-500 hover:text-[#0F6B63] hover:bg-slate-100 rounded focus:outline-none focus-visible:ring-2 focus-visible:ring-[#0F6B63]"
                    title="Mark as read"
                    aria-label="Mark as read"
                  >
                    <Check className="w-4 h-4" />
                  </button>
                )}
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};
