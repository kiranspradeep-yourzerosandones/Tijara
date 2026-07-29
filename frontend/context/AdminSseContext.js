// frontend/context/AdminSseContext.js
"use client";

import { createContext, useContext, useEffect, useRef } from "react";

const API_URL =
  process.env.NEXT_PUBLIC_API_URL || "http://localhost:5000/api";

// ============================================================
// SOUND PLAYER
// Browsers block audio until the user has interacted with the page.
// We pre-load the audio on first user interaction so it plays
// instantly when a new order arrives.
// ============================================================
function initSound() {
  if (typeof window === "undefined") return;
  if (window.__adminOrderSound) return; // already initialized

  const audio = new Audio("/sounds/new-order.mp3");
  audio.preload = "auto";
  audio.volume = 0.8;
  window.__adminOrderSound = audio;
}

function playOrderSound() {
  if (typeof window === "undefined") return;

  try {
    const audio = window.__adminOrderSound;
    if (!audio) {
      // Fallback: create fresh instance if not pre-loaded
      const fresh = new Audio("/sounds/new-order.mp3");
      fresh.volume = 0.8;
      fresh.play().catch((err) =>
        console.warn("AdminSSE: Sound play failed:", err.message)
      );
      return;
    }

    // Reset to start in case it was already playing
    audio.currentTime = 0;
    audio.play().catch((err) =>
      console.warn("AdminSSE: Sound play failed:", err.message)
    );
  } catch (err) {
    console.warn("AdminSSE: Sound error:", err.message);
  }
}

// ============================================================
// SINGLETON stored on window — survives HMR reloads
// ============================================================
function getSSE() {
  if (typeof window === "undefined") return null;
  if (window.__adminSse) return window.__adminSse;

  window.__adminSse = {
    es:           null,
    listeners:    new Map(),
    reconnectTid: null,
    connected:    false,
  };

  return window.__adminSse;
}

function sseConnect() {
  const sse = getSSE();
  if (!sse) return;

  if (sse.es && sse.es.readyState !== EventSource.CLOSED) {
    // console.log("📡 AdminSSE: Already connected, skipping");
    return;
  }

  const token = localStorage.getItem("token");
  if (!token) {
    console.warn("AdminSSE: No token");
    return;
  }

  const url = `${API_URL}/admin/sse?token=${encodeURIComponent(token)}`;
  // console.log("📡 AdminSSE: Connecting...");

  const es = new EventSource(url);
  sse.es = es;

  es.addEventListener("connected", (e) => {
    sse.connected = true;
    // console.log("✅ AdminSSE: Connected", JSON.parse(e.data));
  });

  es.addEventListener("heartbeat", () => {
    // silent keep-alive
  });

  es.addEventListener("new_order", (e) => {
    const data = JSON.parse(e.data);
    console.log("🛒 AdminSSE: new_order received", data);

    // ✅ Play sound globally — fires on every new order
    // regardless of which page the admin is on
    playOrderSound();

    // Notify all subscribers
    const callbacks = sse.listeners.get("new_order");
    if (callbacks) {
      callbacks.forEach((cb) => {
        try { cb(data); } catch (err) {
          console.error("SSE callback error:", err);
        }
      });
    }
  });

  es.onerror = () => {
    console.warn("📡 AdminSSE: Error — reconnecting in 5s...");
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
    // ✅ Pre-load sound on first render (after user interaction
    // with the page — browser requires this for autoplay policy)
    initSound();

    // ✅ Also init sound on first user interaction
    // (covers the case where admin opens the page fresh)
    const handleInteraction = () => {
      initSound();
      // Pre-play at volume 0 to "unlock" audio on Safari/Chrome
      if (window.__adminOrderSound) {
        window.__adminOrderSound.volume = 0;
        window.__adminOrderSound
          .play()
          .then(() => {
            window.__adminOrderSound.pause();
            window.__adminOrderSound.currentTime = 0;
            window.__adminOrderSound.volume = 0.8;
          })
          .catch(() => {
            // Silently ignore — will retry on next interaction
          });
      }
      // Remove listeners after first interaction
      window.removeEventListener("click", handleInteraction);
      window.removeEventListener("keydown", handleInteraction);
    };

    window.addEventListener("click", handleInteraction);
    window.addEventListener("keydown", handleInteraction);

    // Connect SSE
    sseConnect();

    return () => {
      window.removeEventListener("click", handleInteraction);
      window.removeEventListener("keydown", handleInteraction);

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