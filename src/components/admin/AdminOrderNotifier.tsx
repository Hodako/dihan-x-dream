"use client";

import { useEffect, useState, useRef } from "react";
import { Bell, BellRing, BellOff, Volume2, VolumeX } from "lucide-react";
import { onSnapshot, collection, query, orderBy, limit } from "firebase/firestore";
import { db } from "@/lib/firebase";
import { Order } from "@/types";
import { formatPrice } from "@/lib/utils";

// Web Audio API Chime Synthesizer (Crystal-clear luxury chime)
function playLuxuryOrderChime() {
  try {
    const AudioCtx = window.AudioContext || (window as any).webkitAudioContext;
    if (!AudioCtx) return;
    const ctx = new AudioCtx();

    if (ctx.state === "suspended") {
      ctx.resume();
    }

    const now = ctx.currentTime;

    // Chime 1: D5 (587.33 Hz)
    const osc1 = ctx.createOscillator();
    const gain1 = ctx.createGain();
    osc1.type = "sine";
    osc1.frequency.setValueAtTime(587.33, now);
    gain1.gain.setValueAtTime(0.3, now);
    gain1.gain.exponentialRampToValueAtTime(0.001, now + 0.6);
    osc1.connect(gain1);
    gain1.connect(ctx.destination);
    osc1.start(now);
    osc1.stop(now + 0.6);

    // Chime 2: A5 (880 Hz) - slightly delayed
    const osc2 = ctx.createOscillator();
    const gain2 = ctx.createGain();
    osc2.type = "sine";
    osc2.frequency.setValueAtTime(880, now + 0.12);
    gain2.gain.setValueAtTime(0.35, now + 0.12);
    gain2.gain.exponentialRampToValueAtTime(0.001, now + 0.8);
    osc2.connect(gain2);
    gain2.connect(ctx.destination);
    osc2.start(now + 0.12);
    osc2.stop(now + 0.8);

    // Chime 3: D6 (1174.66 Hz) - apex tone
    const osc3 = ctx.createOscillator();
    const gain3 = ctx.createGain();
    osc3.type = "sine";
    osc3.frequency.setValueAtTime(1174.66, now + 0.24);
    gain3.gain.setValueAtTime(0.4, now + 0.24);
    gain3.gain.exponentialRampToValueAtTime(0.001, now + 1.2);
    osc3.connect(gain3);
    gain3.connect(ctx.destination);
    osc3.start(now + 0.24);
    osc3.stop(now + 1.2);
  } catch (e) {
    console.warn("Audio chime playback notice:", e);
  }
}

export default function AdminOrderNotifier() {
  const [permission, setPermission] = useState<NotificationPermission>("default");
  const [soundEnabled, setSoundEnabled] = useState(true);
  const [bannerDismissed, setBannerDismissed] = useState(false);
  const [latestAlert, setLatestAlert] = useState<{ id: string; title: string; body: string } | null>(null);

  const initialLoadRef = useRef(true);
  const knownOrderIdsRef = useRef<Set<string>>(new Set());

  // Initialize permission state
  useEffect(() => {
    if (typeof window !== "undefined" && "Notification" in window) {
      setPermission(Notification.permission);
      const savedSound = localStorage.getItem("dream_admin_order_sound");
      if (savedSound !== null) {
        setSoundEnabled(savedSound === "true");
      }
    }
  }, []);

  // Request Notification Permission
  const requestNotificationPermission = async () => {
    if (typeof window === "undefined" || !("Notification" in window)) {
      alert("This browser does not support desktop notifications.");
      return;
    }

    try {
      const result = await Notification.requestPermission();
      setPermission(result);

      if (result === "granted") {
        playLuxuryOrderChime();
        try {
          new Notification("🔔 Dream Fashion Notifications Enabled", {
            body: "You will now receive instant desktop & mobile alerts whenever a new order is placed!",
            icon: "/icons/icon-192x192.png",
          });
        } catch (e) {}
      }
    } catch (err) {
      console.error("Failed to request notification permission:", err);
    }
  };

  const toggleSound = () => {
    const next = !soundEnabled;
    setSoundEnabled(next);
    if (typeof window !== "undefined") {
      localStorage.setItem("dream_admin_order_sound", String(next));
    }
    if (next) playLuxuryOrderChime();
  };

  const triggerTestNotification = () => {
    if (soundEnabled) playLuxuryOrderChime();

    const title = "🛍️ Test Order #DF-SAMPLE";
    const body = "Azizul Hakim • ৳2,450 (Cash on Delivery)\nDhaka, Bangladesh";

    if (permission === "granted" && "Notification" in window) {
      try {
        new Notification(title, {
          body,
          icon: "/icons/icon-192x192.png",
          badge: "/icons/icon-192x192.png",
          tag: "test-order",
        });
      } catch (e) {}
    }

    setLatestAlert({ id: "test", title, body });
    setTimeout(() => setLatestAlert(null), 6000);
  };

  // Real-time Firestore Listener for New Orders
  useEffect(() => {
    if (typeof window === "undefined") return;

    try {
      // Query most recent orders
      const q = query(collection(db, "orders"), orderBy("createdAt", "desc"), limit(20));

      const unsubscribe = onSnapshot(
        q,
        (snapshot) => {
          if (initialLoadRef.current) {
            // First snapshot: populate known order IDs without triggering false alarms
            snapshot.docs.forEach((doc) => {
              knownOrderIdsRef.current.add(doc.id);
            });
            initialLoadRef.current = false;
            return;
          }

          // Inspect doc changes
          snapshot.docChanges().forEach((change) => {
            if (change.type === "added") {
              const orderId = change.doc.id;
              if (!knownOrderIdsRef.current.has(orderId)) {
                knownOrderIdsRef.current.add(orderId);
                const order = change.doc.data() as Order;

                // Fire Sound
                if (soundEnabled) {
                  playLuxuryOrderChime();
                }

                // Fire Native Browser Push Notification
                const title = `🛍️ New Order #${order.orderNumber || orderId}`;
                const body = `${order.customerName || "Customer"} • ${formatPrice(
                  order.grandTotal
                )} (${(order.paymentMethod || "COD").toUpperCase()})\n${
                  order.shippingAddress?.districtName || "Dhaka"
                }`;

                if (Notification.permission === "granted") {
                  try {
                    const notif = new Notification(title, {
                      body,
                      icon: "/icons/icon-192x192.png",
                      badge: "/icons/icon-192x192.png",
                      tag: `order-${orderId}`,
                      requireInteraction: true,
                    });

                    notif.onclick = () => {
                      window.focus();
                      window.location.href = "/who/hodako/orders";
                    };
                  } catch (notifErr) {
                    console.warn("Browser notification error:", notifErr);
                  }
                }

                // In-App Popup Banner
                setLatestAlert({
                  id: orderId,
                  title,
                  body,
                });

                setTimeout(() => {
                  setLatestAlert((prev) => (prev?.id === orderId ? null : prev));
                }, 10000);
              }
            }
          });
        },
        (err) => {
          console.warn("Real-time orders notification listener fallback:", err);
        }
      );

      return () => unsubscribe();
    } catch (e) {
      console.warn("Notification listener setup warning:", e);
    }
  }, [soundEnabled]);

  return (
    <>
      {/* 1. Permission Request Banner (Shown if permission is 'default' and not dismissed) */}
      {permission === "default" && !bannerDismissed && (
        <div className="bg-gradient-to-r from-amber-500/10 via-[#FFB900]/15 to-amber-500/10 border-b border-[#FFB900]/30 px-4 py-3 sm:px-8 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 text-xs">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-full bg-[#FFB900] text-black flex items-center justify-center shrink-0 shadow-xs animate-bounce">
              <BellRing className="w-4 h-4 stroke-[2.5]" />
            </div>
            <div>
              <p className="font-bold text-slate-900 uppercase tracking-wide flex items-center gap-2">
                <span>ENABLE LIVE ORDER NOTIFICATIONS</span>
                <span className="text-[10px] bg-[#FFB900] text-black px-2 py-0.5 rounded-full font-black">
                  RECOMMENDED
                </span>
              </p>
              <p className="text-slate-600 text-[11px] mt-0.5">
                Allow browser notification access to receive real-time sound chimes and desktop alerts instantly when customers place new orders.
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2 self-end sm:self-auto shrink-0">
            <button
              onClick={requestNotificationPermission}
              className="px-4 py-2 bg-[#FFB900] hover:bg-[#E5A700] text-black font-black uppercase tracking-wider rounded-xl shadow-xs transition-all active:scale-95 cursor-pointer text-xs flex items-center gap-1.5"
            >
              <Bell className="w-3.5 h-3.5" />
              <span>Allow Notifications</span>
            </button>
            <button
              onClick={() => setBannerDismissed(true)}
              className="px-3 py-2 text-slate-500 hover:text-slate-800 text-[11px] font-bold uppercase transition-colors cursor-pointer"
            >
              Later
            </button>
          </div>
        </div>
      )}

      {/* 2. Floating Live Order Toast Alert */}
      {latestAlert && (
        <div className="fixed bottom-6 right-6 z-50 max-w-sm w-full bg-slate-900 text-white p-4 rounded-2xl shadow-2xl border border-amber-400/40 animate-in slide-in-from-bottom-5 duration-300">
          <div className="flex items-start justify-between gap-3">
            <div className="flex items-start gap-3">
              <div className="w-9 h-9 rounded-xl bg-[#FFB900] text-black flex items-center justify-center shrink-0 shadow-md">
                <BellRing className="w-5 h-5 animate-pulse" />
              </div>
              <div className="space-y-1">
                <h4 className="font-bold text-xs uppercase text-[#FFB900] tracking-wider">
                  {latestAlert.title}
                </h4>
                <p className="text-xs text-slate-200 whitespace-pre-line leading-relaxed">
                  {latestAlert.body}
                </p>
              </div>
            </div>
            <button
              onClick={() => setLatestAlert(null)}
              className="text-slate-400 hover:text-white text-xs p-1 cursor-pointer"
            >
              ✕
            </button>
          </div>
        </div>
      )}

      {/* 3. Top-Header Status Controls (Included in layout header) */}
      <div className="flex items-center gap-1.5 text-xs">
        {/* Sound Toggle */}
        <button
          onClick={toggleSound}
          title={soundEnabled ? "Order Chime Sound Enabled" : "Order Chime Sound Muted"}
          className={`p-2 rounded-xl border transition-all cursor-pointer ${
            soundEnabled
              ? "bg-amber-50 border-amber-200 text-amber-900 hover:bg-amber-100"
              : "bg-slate-100 border-slate-200 text-slate-400 hover:text-slate-600"
          }`}
        >
          {soundEnabled ? <Volume2 className="w-4 h-4 text-amber-700" /> : <VolumeX className="w-4 h-4" />}
        </button>

        {/* Permission Status Pill */}
        {permission === "granted" ? (
          <button
            onClick={triggerTestNotification}
            title="Notifications Active (Click to Test)"
            className="hidden sm:inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-800 text-[11px] font-bold uppercase hover:bg-emerald-100 transition-colors cursor-pointer"
          >
            <span className="w-2 h-2 rounded-full bg-emerald-500 animate-ping" />
            <span>Alerts Active</span>
          </button>
        ) : permission === "denied" ? (
          <span
            title="Notifications are blocked in your browser site settings. Click the lock icon in address bar to allow."
            className="hidden sm:inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-red-50 border border-red-200 text-red-700 text-[11px] font-bold uppercase"
          >
            <BellOff className="w-3.5 h-3.5" />
            <span>Alerts Blocked</span>
          </span>
        ) : (
          <button
            onClick={requestNotificationPermission}
            className="hidden sm:inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-[#FFB900] text-black text-[11px] font-black uppercase hover:bg-[#E5A700] transition-colors cursor-pointer shadow-2xs"
          >
            <Bell className="w-3.5 h-3.5" />
            <span>Enable Alerts</span>
          </button>
        )}
      </div>
    </>
  );
}
