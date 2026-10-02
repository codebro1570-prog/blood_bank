/**
 * Notifications Screen (/notifications)
 * Paged list, unread highlighted, click marks read (PATCH /notifications/{id}/read),
 * "Mark all as read" button, unread filter.
 * Paging using PageResponse shape.
 */

import React, { useEffect, useState, useCallback } from 'react';
import { Bell, CheckCheck, Clock, AlertCircle, RotateCw } from 'lucide-react';
import { notificationsApi } from '../api/notifications';
import { NotificationItem, PageResponse } from '../types';
import { CardSkeleton } from '../components/LoadingSkeleton';
import { EmptyState } from '../components/EmptyState';
import { ErrorState } from '../components/ErrorState';
import { useToast } from '../components/Toast';

export const NotificationsPage: React.FC = () => {
  const { showSuccess } = useToast();
  const [pagedData, setPagedData] = useState<PageResponse<NotificationItem> | null>(null);
  const [unreadOnly, setUnreadOnly] = useState(false);
  const [page, setPage] = useState(0);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);

  const fetchNotifications = useCallback(
    async (targetPage = 0) => {
      setError(null);
      try {
        const data = await notificationsApi.getNotifications({
          unreadOnly,
          page: targetPage,
          size: 10,
          sort: 'createdAt,desc',
        });
        setPagedData(data);
        setPage(targetPage);
      } catch (err: unknown) {
        setError(err instanceof Error ? err : new Error('Unable to retrieve notifications.'));
      } finally {
        setIsLoading(false);
      }
    },
    [unreadOnly]
  );

  useEffect(() => {
    setIsLoading(true);
    fetchNotifications(0);
  }, [fetchNotifications]);

  const handleMarkAsRead = async (id: number) => {
    try {
      await notificationsApi.markAsRead(id);
      setPagedData((prev) => {
        if (!prev) return null;
        return {
          ...prev,
          content: prev.content.map((item) =>
            item.id === id ? { ...item, read: true } : item
          ),
        };
      });
      showSuccess('Notification marked as read');
    } catch (err) {
      console.error('Failed to mark read', err);
    }
  };

  const handleMarkAllRead = async () => {
    try {
      await notificationsApi.markAllAsRead();
      setPagedData((prev) => {
        if (!prev) return null;
        return {
          ...prev,
          content: prev.content.map((item) => ({ ...item, read: true })),
        };
      });
      showSuccess('All notifications marked as read');
    } catch (err) {
      console.error('Failed to mark all read', err);
    }
  };

  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 pb-2 border-b border-neutral-200">
        <div>
          <h1 className="text-xl sm:text-2xl font-bold tracking-tight text-neutral-900">
            Notifications
          </h1>
          <p className="text-xs sm:text-sm text-neutral-500 mt-0.5">
            Important updates regarding your blood donations and urgent blood needs
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          {/* Unread Filter Toggle */}
          <button
            type="button"
            onClick={() => setUnreadOnly((prev) => !prev)}
            className={`px-3 py-1.5 text-xs font-semibold rounded-lg border transition-colors cursor-pointer ${
              unreadOnly
                ? 'bg-[#B3203A] text-white border-[#B3203A]'
                : 'bg-white text-neutral-700 border-neutral-200 hover:bg-neutral-50'
            }`}
          >
            {unreadOnly ? 'Showing Unread Only' : 'Filter: Unread'}
          </button>

          {/* Mark all as read button */}
          <button
            type="button"
            onClick={handleMarkAllRead}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold text-neutral-700 bg-white hover:bg-neutral-50 border border-neutral-200 rounded-lg shadow-xs transition-colors cursor-pointer"
          >
            <CheckCheck className="w-3.5 h-3.5 text-[#B3203A]" />
            <span>Mark all read</span>
          </button>

          <button
            type="button"
            onClick={() => {
              setIsLoading(true);
              fetchNotifications(page);
            }}
            className="p-1.5 text-neutral-600 bg-white hover:bg-neutral-50 border border-neutral-200 rounded-lg shadow-xs transition-colors cursor-pointer"
            aria-label="Refresh notifications"
          >
            <RotateCw className="w-4 h-4" />
          </button>
        </div>
      </div>

      {isLoading ? (
        <div className="space-y-3">
          <CardSkeleton rows={2} />
          <CardSkeleton rows={2} />
          <CardSkeleton rows={2} />
        </div>
      ) : error ? (
        <ErrorState
          title="Could not load notifications"
          message={error.message}
          onRetry={() => {
            setIsLoading(true);
            fetchNotifications(page);
          }}
        />
      ) : !pagedData || pagedData.content.length === 0 ? (
        <EmptyState
          icon={Bell}
          title="No Notifications"
          description={
            unreadOnly
              ? 'You have caught up with all your notifications!'
              : 'You do not have any notifications in your donor feed.'
          }
          actionText={unreadOnly ? 'View all notifications' : undefined}
          onAction={unreadOnly ? () => setUnreadOnly(false) : undefined}
        />
      ) : (
        <div className="space-y-3">
          {pagedData.content.map((item) => {
            const isUnread = !item.read;
            return (
              <div
                key={item.id}
                role="button"
                tabIndex={0}
                onClick={() => isUnread && handleMarkAsRead(item.id)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter' || e.key === ' ') {
                    e.preventDefault();
                    if (isUnread) handleMarkAsRead(item.id);
                  }
                }}
                className={`p-4 sm:p-5 rounded-2xl border transition-all text-left ${
                  isUnread
                    ? 'bg-[#FDF2F4]/50 border-[#B3203A]/30 text-neutral-900 shadow-xs ring-1 ring-[#B3203A]/20 cursor-pointer hover:bg-[#FDF2F4]/80'
                    : 'bg-white border-neutral-200/80 text-neutral-700'
                }`}
              >
                <div className="flex items-start justify-between gap-4">
                  <div className="flex items-start gap-3.5">
                    <div
                      className={`w-10 h-10 rounded-xl flex items-center justify-center shrink-0 mt-0.5 ${
                        isUnread
                          ? 'bg-[#B3203A] text-white shadow-xs'
                          : 'bg-neutral-100 text-neutral-500'
                      }`}
                    >
                      <Bell className="w-5 h-5" />
                    </div>
                    <div>
                      <div className="flex items-center gap-2">
                        <h3 className="text-sm font-bold text-neutral-900">{item.title}</h3>
                        {isUnread && (
                          <span className="px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider text-white bg-[#B3203A] rounded-full">
                            New
                          </span>
                        )}
                      </div>
                      <p className="text-xs sm:text-sm text-neutral-600 mt-1 leading-relaxed">
                        {item.message}
                      </p>
                      <p className="text-[11px] text-neutral-400 mt-2 font-mono tabular-nums">
                        {new Date(item.createdAt).toLocaleString()}
                      </p>
                    </div>
                  </div>

                  {isUnread && (
                    <button
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation();
                        handleMarkAsRead(item.id);
                      }}
                      className="text-xs font-semibold text-[#B3203A] hover:underline shrink-0 p-1 rounded focus-visible:ring-2 focus-visible:ring-[#B3203A] outline-none"
                    >
                      Mark as read
                    </button>
                  )}
                </div>
              </div>
            );
          })}

          {/* Paging Footer */}
          {pagedData.totalPages > 1 && (
            <div className="px-4 py-3 bg-white border border-neutral-200 rounded-xl flex items-center justify-between text-xs text-neutral-500 shadow-xs">
              <span>
                Page <span className="font-semibold">{pagedData.page + 1}</span> of{' '}
                <span className="font-semibold">{pagedData.totalPages}</span> (
                <span className="tabular-nums font-semibold">{pagedData.totalElements}</span> items)
              </span>
              <div className="flex gap-2">
                <button
                  type="button"
                  disabled={pagedData.page === 0}
                  onClick={() => fetchNotifications(pagedData.page - 1)}
                  className="px-3 py-1 rounded border border-neutral-200 bg-white hover:bg-neutral-50 disabled:opacity-40 disabled:cursor-not-allowed cursor-pointer"
                >
                  Previous
                </button>
                <button
                  type="button"
                  disabled={pagedData.page >= pagedData.totalPages - 1}
                  onClick={() => fetchNotifications(pagedData.page + 1)}
                  className="px-3 py-1 rounded border border-neutral-200 bg-white hover:bg-neutral-50 disabled:opacity-40 disabled:cursor-not-allowed cursor-pointer"
                >
                  Next
                </button>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default NotificationsPage;
