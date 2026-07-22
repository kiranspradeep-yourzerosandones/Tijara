// frontend/context/AdminSseContext.js
"use client";

import { createContext, useContext, useEffect, useRef } from "react";

const API_URL =
  process.env.NEXT_PUBLIC_API_URL || "http://localhost:5000/api";

// ============================================================
// SINGLETON stored on window — survives HMR reloads
// ============================================================
function getSSE() {
  if (typeof window === "undefined") return null;

  // Already initialized
  if (window.__adminSse) return window.__adminSse;

  // Initialize singleton
  window.__adminSse = {
    es:            null,   // EventSource instance
    listeners:     new Map(),
    reconnectTid:  null,
    connected:     false,
  };

  return window.__adminSse;
}

function sseConnect() {
  const sse = getSSE();
  if (!sse) return;

  // Already open
  if (sse.es && sse.es.readyState !== EventSource.CLOSED) {
    console.log("📡 AdminSSE: Already connected, skipping");
    return;
  }

  const token = localStorage.getItem("token");
  if (!token) {
    console.warn("AdminSSE: No token");
    return;
  }

  const url = `${API_URL}/admin/sse?token=${encodeURIComponent(token)}`;
  console.log("📡 AdminSSE: Connecting...");

  const es = new EventSource(url);
  sse.es = es;

  es.addEventListener("connected", (e) => {
    sse.connected = true;
    console.log("✅ AdminSSE: Connected", JSON.parse(e.data));
  });

  es.addEventListener("heartbeat", () => {
    // silent
  });

  es.addEventListener("new_order", (e) => {
    const data = JSON.parse(e.data);
    console.log("🛒 AdminSSE: new_order received", data);

    const callbacks = sse.listeners.get("new_order");
    if (callbacks) {
      callbacks.forEach((cb) => {
        try { cb(data); } catch (err) {
          console.error("SSE callback error:", err);
        }
      });
    }
  });

  // Catch-all for debugging
  es.onmessage = (e) => {
    console.log("📨 AdminSSE: raw message:", e.data);
  };

  es.onerror = (err) => {
    console.warn("📡 AdminSSE: Error — will reconnect in 5s");
    sse.connected = false;
    es.close();
    sse.es = null;

    if (sse.reconnectTid) clearTimeout(sse.reconnectTid);
    sse.reconnectTid = setTimeout(sseConnect, 5000);
  };
}

function sseDisconnect() {
  const sse = getSSE();
  if (!sse) return;

  if (sse.reconnectTid) {
    clearTimeout(sse.reconnectTid);
    sse.reconnectTid = null;
  }
  if (sse.es) {
    sse.es.close();
    sse.es = null;
    sse.connected = false;
    console.log("📡 AdminSSE: Disconnected");
  }
}

function sseSubscribe(event, callback) {
  const sse = getSSE();
  if (!sse) return () => {};

  if (!sse.listeners.has(event)) {
    sse.listeners.set(event, new Set());
  }
  sse.listeners.get(event).add(callback);

  return () => {
    const cbs = sse.listeners.get(event);
    if (cbs) cbs.delete(callback);
  };
}

// ============================================================
// REACT CONTEXT
// ============================================================
const AdminSseContext = createContext(null);

export function AdminSseProvider({ children }) {
  useEffect(() => {
    // Connect once — window.__adminSse survives HMR
    // so even if this effect runs multiple times,
    // sseConnect() checks if already open and skips
    sseConnect();

    // Cleanup only on actual page unload / logout
    // NOT on HMR reload (window.__adminSse persists)
    return () => {
      // Don't disconnect on HMR — only disconnect if
      // the token is gone (user logged out)
      const token = localStorage.getItem("token");
      if (!token) {
        sseDisconnect();
      }
    };
  }, []);

  return (
    <AdminSseContext.Provider value={{ subscribe: sseSubscribe }}>
      {children}
    </AdminSseContext.Provider>
  );
}

// ============================================================
// HOOK
// ============================================================
export function useAdminSse(event, callback) {
  const context     = useContext(AdminSseContext);
  const callbackRef = useRef(callback);

  useEffect(() => {
    callbackRef.current = callback;
  });

  useEffect(() => {
    if (!event) return;
    const stable = (data) => callbackRef.current(data);
    return sseSubscribe(event, stable);
  }, [event]);
}