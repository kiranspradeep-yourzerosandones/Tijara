"use client";

import { useState, useEffect, useCallback } from "react";
import Link from "next/link";
import ProtectedPage from "@/components/admin/ProtectedPage";
import { getAuthHeaders } from "@/lib/api";

const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:5000/api";

// ── Status badge ───────────────────────────────────────────
const StatusBadge = ({ status }) => {
  const config = {
    sent:      { color: "bg-emerald-100 text-emerald-700", label: "Sent" },
    partial:   { color: "bg-amber-100 text-amber-700",     label: "Partial" },
    failed:    { color: "bg-red-100 text-red-700",         label: "Failed" },
    scheduled: { color: "bg-blue-100 text-blue-700",       label: "Scheduled" },
    sending:   { color: "bg-purple-100 text-purple-700",   label: "Sending..." },
    draft:     { color: "bg-gray-100 text-gray-600",       label: "Draft" },
    cancelled: { color: "bg-gray-100 text-gray-500",       label: "Cancelled" },
  };
  const c = config[status] || config.draft;
  return (
    <span className={`px-2.5 py-1 rounded-full text-xs font-semibold ${c.color}`}>
      {c.label}
    </span>
  );
};

// ── Type badge ─────────────────────────────────────────────
const TypeBadge = ({ type }) => {
  const config = {
    order_update:     { color: "bg-blue-50 text-blue-700",   label: "Order" },
    payment_reminder: { color: "bg-orange-50 text-orange-700", label: "Payment" },
    payment_received: { color: "bg-emerald-50 text-emerald-700", label: "Payment Rcvd" },
    custom:           { color: "bg-purple-50 text-purple-700", label: "Custom" },
    promotion:        { color: "bg-pink-50 text-pink-700",    label: "Promo" },
    announcement:     { color: "bg-indigo-50 text-indigo-700", label: "Announcement" },
  };
  const c = config[type] || { color: "bg-gray-50 text-gray-600", label: type || "—" };
  return (
    <span className={`px-2 py-0.5 rounded-lg text-xs font-medium ${c.color}`}>
      {c.label}
    </span>
  );
};

export default function NotificationsPage() {
  const [notifications, setNotifications] = useState([]);
  const [stats, setStats]                 = useState(null);
  const [loading, setLoading]             = useState(true);
  const [statsLoading, setStatsLoading]   = useState(true);
  const [page, setPage]                   = useState(1);
  const [totalPages, setTotalPages]       = useState(1);
  const [total, setTotal]                 = useState(0);
  const [filters, setFilters]             = useState({ type: "", status: "" });

  // ── Fetch stats ──────────────────────────────────────────
  const fetchStats = useCallback(async () => {
    try {
      setStatsLoading(true);
      const res = await fetch(`${API_URL}/admin/notifications/stats`, {
        headers: getAuthHeaders(),
      });
      const data = await res.json();
      if (data.success) setStats(data.data);
    } catch (err) {
      console.error("Stats error:", err);
    } finally {
      setStatsLoading(false);
    }
  }, []);

  // ── Fetch notifications list ─────────────────────────────
  const fetchNotifications = useCallback(async () => {
    try {
      setLoading(true);
      const params = new URLSearchParams({
        page,
        limit: 15,
        ...(filters.type   && { type:   filters.type }),
        ...(filters.status && { status: filters.status }),
      });
      const res = await fetch(
        `${API_URL}/admin/notifications?${params}`,
        { headers: getAuthHeaders() }
      );
      const data = await res.json();
      if (data.success) {
        setNotifications(data.data.notifications || []);
        setTotalPages(data.data.pagination?.pages || 1);
        setTotal(data.data.pagination?.total || 0);
      }
    } catch (err) {
      console.error("Fetch notifications error:", err);
    } finally {
      setLoading(false);
    }
  }, [page, filters]);

  useEffect(() => { fetchStats(); }, [fetchStats]);
  useEffect(() => { fetchNotifications(); }, [fetchNotifications]);

  // ── Cancel notification ──────────────────────────────────
  const handleCancel = async (id) => {
    if (!confirm("Cancel this notification?")) return;
    try {
      const res = await fetch(`${API_URL}/admin/notifications/${id}/cancel`, {
        method: "PUT",
        headers: getAuthHeaders(),
      });
      const data = await res.json();
      if (data.success) fetchNotifications();
      else alert(data.message || "Failed to cancel");
    } catch (err) {
      alert("Error cancelling notification");
    }
  };

  // ── Resend notification ──────────────────────────────────
  const handleResend = async (id) => {
    if (!confirm("Resend this notification to failed recipients?")) return;
    try {
      const res = await fetch(`${API_URL}/admin/notifications/${id}/resend`, {
        method: "POST",
        headers: { ...getAuthHeaders(), "Content-Type": "application/json" },
        body: JSON.stringify({ failedOnly: true }),
      });
      const data = await res.json();
      if (data.success) {
        alert(data.message);
        fetchNotifications();
      } else {
        alert(data.message || "Failed to resend");
      }
    } catch (err) {
      alert("Error resending notification");
    }
  };

  const formatDate = (d) =>
    d ? new Date(d).toLocaleDateString("en-IN", {
      day: "2-digit", month: "short", year: "numeric",
      hour: "2-digit", minute: "2-digit",
    }) : "—";

  // ── Stats cards ──────────────────────────────────────────
  const statCards = stats ? [
    {
      label: "Total Sent",
      value: stats.stats?.totalNotifications ?? 0,
      icon: (
        <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5}
            d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9" />
        </svg>
      ),
      color: "bg-blue-50 text-blue-600",
    },
    {
      label: "Total Recipients",
      value: stats.stats?.totalRecipients ?? 0,
      icon: (
        <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5}
            d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0z" />
        </svg>
      ),
      color: "bg-purple-50 text-purple-600",
    },
    {
      label: "Push Sent",
      value: stats.stats?.totalPushSent ?? 0,
      icon: (
        <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5}
            d="M12 18h.01M8 21h8a2 2 0 002-2V5a2 2 0 00-2-2H8a2 2 0 00-2 2v14a2 2 0 002 2z" />
        </svg>
      ),
      color: "bg-emerald-50 text-emerald-600",
    },
    // {
    //   label: "SMS Sent",
    //   value: stats.stats?.totalSmsSent ?? 0,
    //   icon: (
    //     <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
    //       <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5}
    //         d="M8 10h.01M12 10h.01M16 10h.01M9 16H5a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v8a2 2 0 01-2 2h-5l-5 5v-5z" />
    //     </svg>
    //   ),
    //   color: "bg-amber-50 text-amber-600",
    // },
  ] : [];

  return (
    <ProtectedPage permission="manageNotifications">
      <div className="space-y-6">

        {/* ── Header ─────────────────────────────────────── */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Notifications</h1>
            <p className="text-gray-500 mt-1">
              Send and manage customer notifications
            </p>
          </div>
          <Link
            href="/admin/notifications/send"
            className="inline-flex items-center gap-2 px-5 py-2.5 bg-amber-500 hover:bg-amber-600
                       text-white font-semibold rounded-xl transition-colors shadow-lg shadow-amber-200"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8" />
            </svg>
            Send Notification
          </Link>
        </div>

        {/* ── Stats ──────────────────────────────────────── */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-3">
          {statsLoading ? (
            Array.from({ length: 4 }).map((_, i) => (
              <div key={i} className="bg-white rounded-2xl border border-gray-200 p-5 animate-pulse">
                <div className="h-4 bg-gray-100 rounded w-24 mb-3" />
                <div className="h-8 bg-gray-100 rounded w-16" />
              </div>
            ))
          ) : (
            statCards.map((card, i) => (
              <div key={i} className="bg-white rounded-2xl border border-gray-200 p-5">
                <div className="flex items-center gap-3 mb-3">
                  <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${card.color}`}>
                    {card.icon}
                  </div>
                  <p className="text-sm text-gray-500 font-medium">{card.label}</p>
                </div>
                <p className="text-3xl font-bold text-gray-900">
                  {card.value.toLocaleString()}
                </p>
              </div>
            ))
          )}
        </div>

        {/* ── By Status breakdown ─────────────────────────── */}
        {stats?.byStatus && stats.byStatus.length > 0 && (
          <div className="bg-white rounded-2xl border border-gray-200 p-5 mb-2">
            <h3 className="text-sm font-semibold text-gray-700 mb-4">Breakdown by Status</h3>
            <div className="flex flex-wrap gap-3">
              {stats.byStatus.map((s) => (
                <div key={s._id}
                  className="flex items-center gap-2 px-3 py-2 bg-gray-50 rounded-xl">
                  <StatusBadge status={s._id} />
                  <span className="text-sm font-bold text-gray-700">{s.count}</span>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* ── Filters ────────────────────────────────────── */}
        <div className="bg-white rounded-2xl border border-gray-200 p-4 mb-2">
          <div className="flex flex-col sm:flex-row gap-3">
            <select
              value={filters.type}
              onChange={(e) => {
                setFilters(f => ({ ...f, type: e.target.value }));
                setPage(1);
              }}
              className="px-3 py-2 text-sm border border-gray-200 rounded-xl bg-white
                         text-gray-700 focus:ring-2 focus:ring-amber-400/30 focus:border-amber-400"
            >
              <option value="">All Types</option>
              <option value="order_update">Order Update</option>
              <option value="payment_reminder">Payment Reminder</option>
              <option value="payment_received">Payment Received</option>
              <option value="custom">Custom</option>
              <option value="promotion">Promotion</option>
              <option value="announcement">Announcement</option>
            </select>

            <select
              value={filters.status}
              onChange={(e) => {
                setFilters(f => ({ ...f, status: e.target.value }));
                setPage(1);
              }}
              className="px-3 py-2 text-sm border border-gray-200 rounded-xl bg-white
                         text-gray-700 focus:ring-2 focus:ring-amber-400/30 focus:border-amber-400"
            >
              <option value="">All Statuses</option>
              <option value="sent">Sent</option>
              <option value="partial">Partial</option>
              <option value="failed">Failed</option>
              <option value="scheduled">Scheduled</option>
              <option value="sending">Sending</option>
              <option value="draft">Draft</option>
              <option value="cancelled">Cancelled</option>
            </select>

            {(filters.type || filters.status) && (
              <button
                onClick={() => { setFilters({ type: "", status: "" }); setPage(1); }}
                className="px-3 py-2 text-sm text-red-600 hover:bg-red-50 rounded-xl
                           font-medium transition-colors"
              >
                Clear Filters
              </button>
            )}

            <div className="sm:ml-auto text-sm text-gray-500 flex items-center">
              {total} notification{total !== 1 ? "s" : ""}
            </div>
          </div>
        </div>

        {/* ── Notifications Table ─────────────────────────── */}
        <div className="bg-white rounded-2xl border border-gray-200 overflow-hidden">
          {loading ? (
            <div className="p-12 text-center">
              <div className="w-10 h-10 border-4 border-amber-400 border-t-transparent
                              rounded-full animate-spin mx-auto" />
              <p className="text-gray-500 mt-4 text-sm">Loading notifications...</p>
            </div>
          ) : notifications.length === 0 ? (
            <div className="p-12 text-center">
              <div className="w-16 h-16 bg-gray-100 rounded-2xl flex items-center
                              justify-center mx-auto mb-4">
                <svg className="w-8 h-8 text-gray-400" fill="none" stroke="currentColor"
                  viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5}
                    d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9" />
                </svg>
              </div>
              <h3 className="font-bold text-gray-900">No Notifications Found</h3>
              <p className="text-gray-500 text-sm mt-1">
                {filters.type || filters.status
                  ? "Try adjusting your filters"
                  : "Send your first notification to get started"}
              </p>
              <Link
                href="/admin/notifications/send"
                className="inline-flex items-center gap-2 mt-4 px-4 py-2 bg-amber-500
                           hover:bg-amber-600 text-white font-semibold rounded-xl
                           transition-colors text-sm"
              >
                Send First Notification
              </Link>
            </div>
          ) : (
            <>
              {/* Desktop Table */}
              <div className="hidden md:block overflow-x-auto">
                <table className="w-full text-sm">
                  <thead className="bg-gray-50 border-b border-gray-200">
                    <tr>
                      <th className="text-left px-5 py-3.5 font-semibold text-gray-600">
                        Notification
                      </th>
                      <th className="text-left px-5 py-3.5 font-semibold text-gray-600">
                        Type
                      </th>
                      <th className="text-center px-5 py-3.5 font-semibold text-gray-600">
                        Recipients
                      </th>
                      <th className="text-center px-5 py-3.5 font-semibold text-gray-600">
                        Channels
                      </th>
                      <th className="text-left px-5 py-3.5 font-semibold text-gray-600">
                        Status
                      </th>
                      <th className="text-left px-5 py-3.5 font-semibold text-gray-600">
                        Sent At
                      </th>
                      <th className="text-right px-5 py-3.5 font-semibold text-gray-600">
                        Actions
                      </th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-100">
                    {notifications.map((n) => (
                      <tr key={n._id} className="hover:bg-gray-50 transition-colors">
                        <td className="px-5 py-4 max-w-xs">
                          <p className="font-semibold text-gray-900 truncate">{n.title}</p>
                          <p className="text-gray-500 text-xs truncate mt-0.5">{n.message}</p>
                        </td>
                        <td className="px-5 py-4">
                          <TypeBadge type={n.type} />
                        </td>
                        <td className="px-5 py-4 text-center">
                          <span className="font-semibold text-gray-700">
                            {n.stats?.totalRecipients ?? "—"}
                          </span>
                        </td>
                        <td className="px-5 py-4">
                          <div className="flex items-center justify-center gap-1 flex-wrap">
                            {n.channels?.push && (
                              <span className="px-1.5 py-0.5 bg-blue-50 text-blue-600
                                               text-[10px] font-bold rounded">
                                Push
                              </span>
                            )}
                            {n.channels?.inApp && (
                              <span className="px-1.5 py-0.5 bg-purple-50 text-purple-600
                                               text-[10px] font-bold rounded">
                                In-App
                              </span>
                            )}
                            {/* {n.channels?.sms && (
                              <span className="px-1.5 py-0.5 bg-amber-50 text-amber-600
                                               text-[10px] font-bold rounded">
                                SMS
                              </span>
                            )} */}
                            {n.channels?.email && (
                              <span className="px-1.5 py-0.5 bg-emerald-50 text-emerald-600
                                               text-[10px] font-bold rounded">
                                Email
                              </span>
                            )}
                          </div>
                        </td>
                        <td className="px-5 py-4">
                          <StatusBadge status={n.status} />
                        </td>
                        <td className="px-5 py-4 text-gray-500 text-xs whitespace-nowrap">
                          {formatDate(n.sentAt || n.createdAt)}
                        </td>
                        <td className="px-5 py-4">
                          <div className="flex items-center justify-end gap-1">
                            {/* Resend (failed/partial) */}
                            {["partial", "failed"].includes(n.status) && (
                              <button
                                onClick={() => handleResend(n._id)}
                                className="p-1.5 text-blue-500 hover:text-blue-700
                                           hover:bg-blue-50 rounded-lg transition-colors"
                                title="Resend to failed"
                              >
                                <svg className="w-4 h-4" fill="none" stroke="currentColor"
                                  viewBox="0 0 24 24">
                                  <path strokeLinecap="round" strokeLinejoin="round"
                                    strokeWidth={2}
                                    d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                                </svg>
                              </button>
                            )}
                            {/* Cancel (draft/scheduled) */}
                            {["draft", "scheduled"].includes(n.status) && (
                              <button
                                onClick={() => handleCancel(n._id)}
                                className="p-1.5 text-red-400 hover:text-red-600
                                           hover:bg-red-50 rounded-lg transition-colors"
                                title="Cancel"
                              >
                                <svg className="w-4 h-4" fill="none" stroke="currentColor"
                                  viewBox="0 0 24 24">
                                  <path strokeLinecap="round" strokeLinejoin="round"
                                    strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                                </svg>
                              </button>
                            )}
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              {/* Mobile Cards */}
              <div className="md:hidden divide-y divide-gray-100">
                {notifications.map((n) => (
                  <div key={n._id} className="p-4">
                    <div className="flex items-start justify-between gap-3">
                      <div className="flex-1 min-w-0">
                        <p className="font-semibold text-gray-900 truncate">{n.title}</p>
                        <p className="text-xs text-gray-500 truncate mt-0.5">{n.message}</p>
                        <div className="flex items-center gap-2 mt-2">
                          <TypeBadge type={n.type} />
                          <StatusBadge status={n.status} />
                        </div>
                      </div>
                      <div className="text-right text-xs text-gray-500 shrink-0">
                        <p>{n.stats?.totalRecipients ?? 0} recipients</p>
                        <p className="mt-1">{formatDate(n.sentAt || n.createdAt)}</p>
                      </div>
                    </div>
                    {["partial", "failed"].includes(n.status) && (
                      <button
                        onClick={() => handleResend(n._id)}
                        className="mt-3 w-full py-2 text-xs font-semibold text-blue-700
                                   bg-blue-50 rounded-xl hover:bg-blue-100 transition-colors"
                      >
                        Resend to Failed Recipients
                      </button>
                    )}
                    {["draft", "scheduled"].includes(n.status) && (
                      <button
                        onClick={() => handleCancel(n._id)}
                        className="mt-3 w-full py-2 text-xs font-semibold text-red-600
                                   bg-red-50 rounded-xl hover:bg-red-100 transition-colors"
                      >
                        Cancel Notification
                      </button>
                    )}
                  </div>
                ))}
              </div>

              {/* Pagination */}
              {totalPages > 1 && (
                <div className="px-5 py-4 border-t border-gray-100 flex items-center
                                justify-between">
                  <p className="text-xs text-gray-500">
                    Page {page} of {totalPages}
                  </p>
                  <div className="flex items-center gap-1">
                    <button
                      onClick={() => setPage(p => Math.max(1, p - 1))}
                      disabled={page === 1}
                      className="p-2 rounded-lg hover:bg-gray-100 disabled:opacity-40
                                 disabled:cursor-not-allowed transition-colors"
                    >
                      <svg className="w-4 h-4" fill="none" stroke="currentColor"
                        viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                          d="M15 19l-7-7 7-7" />
                      </svg>
                    </button>
                    {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
                      let p;
                      if (totalPages <= 5) p = i + 1;
                      else if (page <= 3) p = i + 1;
                      else if (page >= totalPages - 2) p = totalPages - 4 + i;
                      else p = page - 2 + i;
                      return (
                        <button
                          key={p}
                          onClick={() => setPage(p)}
                          className={`w-8 h-8 text-xs rounded-lg transition-colors ${
                            page === p
                              ? "bg-amber-500 text-white font-bold"
                              : "hover:bg-gray-100 text-gray-600"
                          }`}
                        >
                          {p}
                        </button>
                      );
                    })}
                    <button
                      onClick={() => setPage(p => Math.min(totalPages, p + 1))}
                      disabled={page === totalPages}
                      className="p-2 rounded-lg hover:bg-gray-100 disabled:opacity-40
                                 disabled:cursor-not-allowed transition-colors"
                    >
                      <svg className="w-4 h-4" fill="none" stroke="currentColor"
                        viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                          d="M9 5l7 7-7 7" />
                      </svg>
                    </button>
                  </div>
                </div>
              )}
            </>
          )}
        </div>
      </div>
    </ProtectedPage>
  );
}