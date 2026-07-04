  "use client";

  import { useState, useEffect } from "react";
  import { useRouter } from "next/navigation";
  import Link from "next/link";
  import ProtectedPage from "@/components/admin/ProtectedPage";
  import { getAuthHeaders } from "@/lib/api";

  const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:5000/api";

  // ── Channel Toggle ─────────────────────────────────────────
  const ChannelToggle = ({ label, icon, checked, onChange, description }) => (
    <label className={`flex items-start gap-3 p-4 rounded-xl border-2 cursor-pointer
                      transition-all ${
                        checked
                          ? "border-amber-400 bg-amber-50"
                          : "border-gray-200 bg-white hover:border-gray-300"
                      }`}>
      <input
        type="checkbox"
        checked={checked}
        onChange={onChange}
        className="mt-0.5 accent-amber-500"
      />
      <div className="flex-1">
        <div className="flex items-center gap-2">
          <span className="text-lg">{icon}</span>
          <span className="font-semibold text-gray-900 text-sm">{label}</span>
        </div>
        {description && (
          <p className="text-xs text-gray-500 mt-0.5">{description}</p>
        )}
      </div>
    </label>
  );

  // ── Customer picker row ────────────────────────────────────
  const CustomerRow = ({ customer, selected, onToggle }) => (
    <label className={`flex items-center gap-3 p-3 rounded-xl cursor-pointer
                      transition-colors ${
                        selected ? "bg-amber-50" : "hover:bg-gray-50"
                      }`}>
      <input
        type="checkbox"
        checked={selected}
        onChange={() => onToggle(customer._id)}
        className="accent-amber-500"
      />
      <div className="w-9 h-9 rounded-full bg-gradient-to-br from-amber-400 to-orange-500
                      flex items-center justify-center flex-shrink-0">
        <span className="text-white font-bold text-sm">
          {customer.name?.charAt(0).toUpperCase()}
        </span>
      </div>
      <div className="flex-1 min-w-0">
        <p className="font-medium text-gray-900 text-sm truncate">{customer.name}</p>
        <p className="text-xs text-gray-500 truncate">
          {customer.phone}
          {customer.businessName ? ` • ${customer.businessName}` : ""}
        </p>
      </div>
      {customer.pendingAmount > 0 && (
        <span className="text-xs font-semibold text-red-600 bg-red-50 px-2 py-0.5 rounded-lg shrink-0">
          ₹{customer.pendingAmount.toLocaleString("en-IN")}
        </span>
      )}
    </label>
  );

  export default function SendNotificationPage() {
    const router = useRouter();

    // ── Form state ─────────────────────────────────────────
    const [form, setForm] = useState({
      title:      "",
      message:    "",
      type:       "custom",
      priority:   "normal",
      targetType: "all",      // all | selected | segment
      channels: {
        push:  true,
        inApp: true,
        sms:   false,
        email: false,
      },
      // Segment filters
      segmentFilters: {
        hasPendingPayment: false,
        isCreditBlocked:   false,
        hasPushToken:      false,
      },
    });

    // ── UI state ───────────────────────────────────────────
    const [customers, setCustomers]       = useState([]);
    const [selectedIds, setSelectedIds]   = useState([]);
    const [customerSearch, setCustomerSearch] = useState("");
    const [customersLoading, setCustomersLoading] = useState(false);
    const [sending, setSending]           = useState(false);
    const [success, setSuccess]           = useState(null);
    const [error, setError]               = useState(null);
    const [charCount, setCharCount]       = useState(0);

    // ── Load customers when targetType = selected ──────────
    useEffect(() => {
      if (form.targetType === "selected") {
        fetchCustomers();
      }
    }, [form.targetType]);

    const fetchCustomers = async () => {
      try {
        setCustomersLoading(true);
        const res = await fetch(
    `${API_URL}/admin/customers?limit=200&status=active`,
    { headers: getAuthHeaders() }
  );
  const data = await res.json();
  if (data.success) {
    setCustomers(data.data?.customers || []);
  }
      } catch (err) {
        console.error("Fetch customers error:", err);
      } finally {
        setCustomersLoading(false);
      }
    };

    // ── Filtered customers for search ──────────────────────
    const filteredCustomers = customers.filter((c) => {
      const q = customerSearch.toLowerCase();
      return (
        !q ||
        c.name?.toLowerCase().includes(q) ||
        c.phone?.includes(q) ||
        c.businessName?.toLowerCase().includes(q)
      );
    });

    // ── Toggle customer selection ──────────────────────────
    const toggleCustomer = (id) => {
      setSelectedIds((prev) =>
        prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id]
      );
    };

    const toggleAllVisible = () => {
      const visibleIds = filteredCustomers.map((c) => c._id);
      const allSelected = visibleIds.every((id) => selectedIds.includes(id));
      if (allSelected) {
        setSelectedIds((prev) => prev.filter((id) => !visibleIds.includes(id)));
      } else {
        setSelectedIds((prev) => [...new Set([...prev, ...visibleIds])]);
      }
    };

    // ── Handle form field changes ──────────────────────────
    const setField = (key, value) => setForm((f) => ({ ...f, [key]: value }));

    const setChannel = (key, value) =>
      setForm((f) => ({ ...f, channels: { ...f.channels, [key]: value } }));

    const setSegment = (key, value) =>
      setForm((f) => ({
        ...f,
        segmentFilters: { ...f.segmentFilters, [key]: value },
      }));

    // ── Validation ─────────────────────────────────────────
    const validate = () => {
      if (!form.title.trim())   return "Title is required";
      if (!form.message.trim()) return "Message is required";
      if (!Object.values(form.channels).some(Boolean))
        return "Select at least one channel";
      if (form.targetType === "selected" && selectedIds.length === 0)
        return "Select at least one customer";
      return null;
    };

    // ── Submit ─────────────────────────────────────────────
    const handleSend = async () => {
      setError(null);
      setSuccess(null);

      const validationError = validate();
      if (validationError) {
        setError(validationError);
        return;
      }

      setSending(true);

      try {
        const body = {
          title:    form.title.trim(),
          message:  form.message.trim(),
          type:     form.type,
          priority: form.priority,
          channels: form.channels,
          targetType: form.targetType,
          ...(form.targetType === "selected" && { userIds: selectedIds }),
          ...(form.targetType === "segment"  && {
            segmentFilters: form.segmentFilters,
          }),
        };

        const res = await fetch(`${API_URL}/admin/notifications`, {
          method: "POST",
          headers: {
            ...getAuthHeaders(),
            "Content-Type": "application/json",
          },
          body: JSON.stringify(body),
        });

        const data = await res.json();

        if (data.success) {
          setSuccess(data.message || "Notification sent successfully!");
          // Reset form after 2 seconds then redirect
          setTimeout(() => {
            router.push("/admin/notifications");
          }, 2000);
        } else {
          setError(data.message || "Failed to send notification");
        }
      } catch (err) {
        setError("Network error. Please try again.");
      } finally {
        setSending(false);
      }
    };

  
    // ── QUICK_TEMPLATES ────────────────────────────────────────
  const QUICK_TEMPLATES = [
    {
      label:   "Payment Reminder",
      icon:    "💳",
      title:   "Payment Reminder",
      message: "Hi, you have a pending payment due. Please clear it to continue placing orders. Thank you!",
      type:    "payment_reminder",
    },
    {
      label:   "New Products",
      icon:    "🛍️",
      title:   "New Products Available!",
      message: "We've added exciting new products to our catalog. Check them out and place your order today!",
      type:    "new_product",       // ✅ fixed
    },
    {
      label:   "Announcement",
      icon:    "📢",
      title:   "Important Announcement",
      message: "We have an important update for you. Please check the app for more details.",
      type:    "announcement",
    },
    {
      label:   "Festival Offer",
      icon:    "🎉",
      title:   "Special Festival Offer!",
      message: "Celebrate with us! Special discounts available for a limited time. Order now!",
      type:    "promotional",       // ✅ fixed
    },
  ];

    const applyTemplate = (tpl) => {
      setField("title",   tpl.title);
      setField("message", tpl.message);
      setField("type",    tpl.type);
      setCharCount(tpl.message.length);
    };

    const visibleAllSelected =
      filteredCustomers.length > 0 &&
      filteredCustomers.every((c) => selectedIds.includes(c._id));

    return (
      <ProtectedPage permission="manageNotifications">
        <div className="max-w-4xl mx-auto space-y-6">

          {/* ── Header ───────────────────────────────────── */}
          <div className="flex items-center gap-4">
            <Link
              href="/admin/notifications"
              className="p-2 text-gray-400 hover:text-gray-600 hover:bg-gray-100
                        rounded-xl transition-colors"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                  d="M15 19l-7-7 7-7" />
              </svg>
            </Link>
            <div>
              <h1 className="text-2xl font-bold text-gray-900">Send Notification</h1>
              <p className="text-gray-500 text-sm mt-0.5">
                Reach your customers via push, in-app, SMS or email
              </p>
            </div>
          </div>

          {/* ── Success / Error banners ───────────────────── */}
          {success && (
            <div className="flex items-center gap-3 p-4 bg-emerald-50 border border-emerald-200
                            rounded-2xl text-emerald-800">
              <svg className="w-5 h-5 text-emerald-600 shrink-0" fill="none" stroke="currentColor"
                viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                  d="M5 13l4 4L19 7" />
              </svg>
              <p className="font-medium text-sm">{success} Redirecting...</p>
            </div>
          )}
          {error && (
            <div className="flex items-center gap-3 p-4 bg-red-50 border border-red-200
                            rounded-2xl text-red-800">
              <svg className="w-5 h-5 text-red-500 shrink-0" fill="none" stroke="currentColor"
                viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                  d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
              <p className="font-medium text-sm">{error}</p>
            </div>
          )}

          {/* ── Quick Templates ───────────────────────────── */}
          <div className="bg-white rounded-2xl border border-gray-200 p-5">
            <h2 className="text-sm font-semibold text-gray-700 mb-3">
              Quick Templates
            </h2>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
              {QUICK_TEMPLATES.map((tpl) => (
                <button
                  key={tpl.label}
                  onClick={() => applyTemplate(tpl)}
                  className="flex flex-col items-center gap-1.5 p-3 bg-gray-50
                            hover:bg-amber-50 hover:border-amber-300 border border-gray-200
                            rounded-xl transition-all text-center"
                >
                  <span className="text-2xl">{tpl.icon}</span>
                  <span className="text-xs font-medium text-gray-700">{tpl.label}</span>
                </button>
              ))}
            </div>
          </div>

          {/* ── Notification Content ──────────────────────── */}
          <div className="bg-white rounded-2xl border border-gray-200 p-5 space-y-4">
            <h2 className="text-sm font-semibold text-gray-700">Notification Content</h2>

            {/* Title */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1.5">
                Title <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                value={form.title}
                onChange={(e) => setField("title", e.target.value)}
                placeholder="e.g. Payment Reminder"
                maxLength={100}
                className="w-full px-4 py-3 border border-gray-200 rounded-xl text-gray-900
                          focus:ring-2 focus:ring-amber-400/30 focus:border-amber-400
                          placeholder:text-gray-400 transition-all"
              />
              <p className="text-xs text-gray-400 mt-1 text-right">
                {form.title.length}/100
              </p>
            </div>

            {/* Message */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1.5">
                Message <span className="text-red-500">*</span>
              </label>
              <textarea
                value={form.message}
                onChange={(e) => {
                  setField("message", e.target.value);
                  setCharCount(e.target.value.length);
                }}
                placeholder="Type your message here..."
                rows={4}
                maxLength={500}
                className="w-full px-4 py-3 border border-gray-200 rounded-xl text-gray-900
                          focus:ring-2 focus:ring-amber-400/30 focus:border-amber-400
                          placeholder:text-gray-400 resize-none transition-all"
              />
              <div className="flex items-center justify-between mt-1">
                {charCount > 160 && (
                  <p className="text-xs text-amber-600">
                    ⚠️ SMS will be truncated to 160 characters
                  </p>
                )}
                <p className="text-xs text-gray-400 ml-auto">{charCount}/500</p>
              </div>
            </div>

            {/* Type + Priority */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1.5">
                  Type
                </label>
                <select
    value={form.type}
    onChange={(e) => setField("type", e.target.value)}
    className="w-full px-4 py-3 border border-gray-200 rounded-xl text-gray-900
              bg-white focus:ring-2 focus:ring-amber-400/30 focus:border-amber-400"
  >
    <option value="custom">Custom</option>
    <option value="announcement">Announcement</option>
    <option value="promotional">Promotion / Offer</option>
    <option value="payment_reminder">Payment Reminder</option>
    <option value="order_update">Order Update</option>
    <option value="new_product">New Product</option>
  </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1.5">
                  Priority
                </label>
                <select
                  value={form.priority}
                  onChange={(e) => setField("priority", e.target.value)}
                  className="w-full px-4 py-3 border border-gray-200 rounded-xl text-gray-900
                            bg-white focus:ring-2 focus:ring-amber-400/30 focus:border-amber-400"
                >
                  <option value="normal">Normal</option>
                  <option value="high">High</option>
                  <option value="low">Low</option>
                </select>
              </div>
            </div>
          </div>

          {/* ── Channels ─────────────────────────────────── */}
          <div className="bg-white rounded-2xl border border-gray-200 p-5">
            <h2 className="text-sm font-semibold text-gray-700 mb-3">
              Delivery Channels
            </h2>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <ChannelToggle
                label="Push Notification"
                icon="📲"
                description="Sent to the mobile app via Expo Push"
                checked={form.channels.push}
                onChange={(e) => setChannel("push", e.target.checked)}
              />
              <ChannelToggle
                label="In-App"
                icon="🔔"
                description="Appears in the notification bell"
                checked={form.channels.inApp}
                onChange={(e) => setChannel("inApp", e.target.checked)}
              />
              <ChannelToggle
                label="SMS"
                icon="💬"
                description="Text message via Message Central"
                checked={form.channels.sms}
                onChange={(e) => setChannel("sms", e.target.checked)}
              />
              <ChannelToggle
                label="Email"
                icon="📧"
                description="Only sent to customers with email"
                checked={form.channels.email}
                onChange={(e) => setChannel("email", e.target.checked)}
              />
            </div>
          </div>

          {/* ── Target Audience ───────────────────────────── */}
          <div className="bg-white rounded-2xl border border-gray-200 p-5 space-y-4">
            <h2 className="text-sm font-semibold text-gray-700">Target Audience</h2>

            {/* Target type selector */}
            <div className="grid grid-cols-3 gap-2">
              {[
                { value: "all",      label: "All Customers",   icon: "👥" },
                { value: "selected", label: "Select Customers", icon: "👤" },
                { value: "segment",  label: "By Segment",       icon: "🎯" },
              ].map((opt) => (
                <button
                  key={opt.value}
                  onClick={() => setField("targetType", opt.value)}
                  className={`flex flex-col items-center gap-1.5 p-4 rounded-xl border-2
                              font-medium text-sm transition-all ${
                                form.targetType === opt.value
                                  ? "border-amber-400 bg-amber-50 text-amber-900"
                                  : "border-gray-200 text-gray-600 hover:border-gray-300"
                              }`}
                >
                  <span className="text-xl">{opt.icon}</span>
                  <span className="text-xs text-center leading-tight">{opt.label}</span>
                </button>
              ))}
            </div>

            {/* ── All customers notice ────────────────────── */}
            {form.targetType === "all" && (
              <div className="flex items-center gap-3 p-4 bg-blue-50 border border-blue-100
                              rounded-xl">
                <svg className="w-5 h-5 text-blue-500 shrink-0" fill="none" stroke="currentColor"
                  viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                    d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
                <p className="text-sm text-blue-800">
                  This will send to <strong>all active customers</strong> in your database.
                </p>
              </div>
            )}

            {/* ── Selected customers ──────────────────────── */}
            {form.targetType === "selected" && (
              <div className="space-y-3">
                {/* Search + Select All */}
                <div className="flex gap-2">
                  <div className="flex-1 relative">
                    <svg className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400"
                      fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                        d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                    </svg>
                    <input
                      type="text"
                      placeholder="Search customers..."
                      value={customerSearch}
                      onChange={(e) => setCustomerSearch(e.target.value)}
                      className="w-full pl-9 pr-4 py-2.5 text-sm border border-gray-200
                                rounded-xl focus:ring-2 focus:ring-amber-400/30
                                focus:border-amber-400 text-gray-900 placeholder:text-gray-400"
                    />
                  </div>
                  <button
                    onClick={toggleAllVisible}
                    className="px-3 py-2.5 text-xs font-semibold text-amber-700 bg-amber-100
                              hover:bg-amber-200 rounded-xl transition-colors whitespace-nowrap"
                  >
                    {visibleAllSelected ? "Deselect All" : "Select All"}
                  </button>
                </div>

                {/* Selected count */}
                {selectedIds.length > 0 && (
                  <div className="flex items-center justify-between px-3 py-2 bg-amber-50
                                  border border-amber-200 rounded-xl">
                    <p className="text-sm font-semibold text-amber-900">
                      {selectedIds.length} customer{selectedIds.length > 1 ? "s" : ""} selected
                    </p>
                    <button
                      onClick={() => setSelectedIds([])}
                      className="text-xs text-amber-600 hover:text-amber-800 font-medium"
                    >
                      Clear
                    </button>
                  </div>
                )}

                {/* Customer list */}
                <div className="border border-gray-200 rounded-xl overflow-y-auto max-h-72">
                  {customersLoading ? (
                    <div className="p-8 text-center text-gray-500 text-sm">
                      Loading customers...
                    </div>
                  ) : filteredCustomers.length === 0 ? (
                    <div className="p-8 text-center text-gray-500 text-sm">
                      No customers found
                    </div>
                  ) : (
                    <div className="divide-y divide-gray-100 p-2">
                      {filteredCustomers.map((c) => (
                        <CustomerRow
                          key={c._id}
                          customer={c}
                          selected={selectedIds.includes(c._id)}
                          onToggle={toggleCustomer}
                        />
                      ))}
                    </div>
                  )}
                </div>
              </div>
            )}

            {/* ── Segment filters ─────────────────────────── */}
            {form.targetType === "segment" && (
              <div className="space-y-3">
                <p className="text-xs text-gray-500">
                  Send to customers matching ALL selected criteria:
                </p>
                <div className="space-y-2">
                  {[
                    {
                      key:   "hasPendingPayment",
                      label: "Has pending payment",
                      desc:  "Customers with outstanding balance",
                      icon:  "💳",
                    },
                    {
                      key:   "isCreditBlocked",
                      label: "Credit blocked",
                      desc:  "Customers with blocked credit",
                      icon:  "🚫",
                    },
                    {
                      key:   "hasPushToken",
                      label: "Has mobile app installed",
                      desc:  "Customers with push token registered",
                      icon:  "📱",
                    },
                  ].map((seg) => (
                    <label
                      key={seg.key}
                      className={`flex items-center gap-3 p-3 rounded-xl border cursor-pointer
                                  transition-all ${
                                    form.segmentFilters[seg.key]
                                      ? "border-amber-300 bg-amber-50"
                                      : "border-gray-200 hover:border-gray-300"
                                  }`}
                    >
                      <input
                        type="checkbox"
                        checked={form.segmentFilters[seg.key]}
                        onChange={(e) => setSegment(seg.key, e.target.checked)}
                        className="accent-amber-500"
                      />
                      <span className="text-xl">{seg.icon}</span>
                      <div>
                        <p className="text-sm font-medium text-gray-900">{seg.label}</p>
                        <p className="text-xs text-gray-500">{seg.desc}</p>
                      </div>
                    </label>
                  ))}
                </div>

                {!Object.values(form.segmentFilters).some(Boolean) && (
                  <p className="text-xs text-amber-600 flex items-center gap-1">
                    ⚠️ No segment selected — this will target all customers
                  </p>
                )}
              </div>
            )}
          </div>

          {/* ── Preview ───────────────────────────────────── */}
          {(form.title || form.message) && (
            <div className="bg-white rounded-2xl border border-gray-200 p-5">
              <h2 className="text-sm font-semibold text-gray-700 mb-3">Preview</h2>
              <div className="bg-gray-900 rounded-2xl p-4 max-w-sm mx-auto">
                <div className="bg-white rounded-xl p-3 flex items-start gap-3 shadow-lg">
                  <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-amber-400
                                  to-orange-500 flex items-center justify-center shrink-0">
                    <span className="text-white font-bold text-sm">T</span>
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="font-bold text-gray-900 text-sm truncate">
                      {form.title || "Notification Title"}
                    </p>
                    <p className="text-xs text-gray-500 mt-0.5 line-clamp-2">
                      {form.message || "Your message will appear here..."}
                    </p>
                    <p className="text-[10px] text-gray-400 mt-1">Tijara • now</p>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* ── Send Button ───────────────────────────────── */}
          <div className="flex flex-col sm:flex-row items-center gap-3 pb-6">
            <Link
              href="/admin/notifications"
              className="w-full sm:w-auto px-6 py-3 text-center text-gray-600 bg-white border
                        border-gray-200 hover:border-gray-300 font-semibold rounded-xl
                        transition-colors"
            >
              Cancel
            </Link>
            <button
              onClick={handleSend}
              disabled={sending || !!success}
              className="w-full sm:flex-1 py-3 px-8 bg-amber-500 hover:bg-amber-600
                        disabled:bg-amber-300 text-white font-bold rounded-xl transition-colors
                        shadow-lg shadow-amber-200 flex items-center justify-center gap-2"
            >
              {sending ? (
                <>
                  <div className="w-5 h-5 border-2 border-white border-t-transparent
                                  rounded-full animate-spin" />
                  Sending...
                </>
              ) : success ? (
                <>
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                      d="M5 13l4 4L19 7" />
                  </svg>
                  Sent!
                </>
              ) : (
                <>
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                      d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8" />
                  </svg>
                  Send Notification
                  {form.targetType === "selected" && selectedIds.length > 0
                    ? ` to ${selectedIds.length} customer${selectedIds.length > 1 ? "s" : ""}`
                    : form.targetType === "all"
                    ? " to All Customers"
                    : ""}
                </>
              )}
            </button>
          </div>
        </div>
      </ProtectedPage>
    );
  }