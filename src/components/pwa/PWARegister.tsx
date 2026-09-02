"use client";

import { useEffect, useState } from "react";
import { Download, X, Smartphone, Sparkles, Check } from "lucide-react";

export default function PWARegister() {
  const [deferredPrompt, setDeferredPrompt] = useState<any>(null);
  const [showInstallBanner, setShowInstallBanner] = useState(false);
  const [isInstalled, setIsInstalled] = useState(false);
  const [isIos, setIsIos] = useState(false);
  const [showIosGuide, setShowIosGuide] = useState(false);

  useEffect(() => {
    if (typeof window === "undefined") return;

    // 1. Register Service Worker
    if ("serviceWorker" in navigator) {
      window.addEventListener("load", () => {
        navigator.serviceWorker
          .register("/sw.js")
          .then((registration) => {
            // Service worker successfully registered
          })
          .catch((error) => {
            console.warn("ServiceWorker registration notice:", error);
          });
      });
    }

    // 2. Check if already running in standalone PWA mode
    const isStandalone =
      window.matchMedia("(display-mode: standalone)").matches ||
      (window.navigator as any).standalone ||
      document.referrer.includes("android-app://");

    if (isStandalone) {
      setIsInstalled(true);
      return;
    }

    // 3. Detect iOS Safari
    const userAgent = window.navigator.userAgent.toLowerCase();
    const isIosDevice = /iphone|ipad|ipod/.test(userAgent);
    setIsIos(isIosDevice);

    // 4. Capture 'beforeinstallprompt' for Android / Chrome / Edge / Desktop
    const handleBeforeInstallPrompt = (e: Event) => {
      e.preventDefault();
      setDeferredPrompt(e);

      // Check if user previously dismissed banner in last 24h
      const dismissed = localStorage.getItem("dream_pwa_banner_dismissed");
      if (!dismissed || Date.now() - Number(dismissed) > 86400000) {
        setShowInstallBanner(true);
      }
    };

    window.addEventListener("beforeinstallprompt", handleBeforeInstallPrompt);

    // 5. Detect app installed event
    window.addEventListener("appinstalled", () => {
      setIsInstalled(true);
      setShowInstallBanner(false);
      setDeferredPrompt(null);
    });

    return () => {
      window.removeEventListener("beforeinstallprompt", handleBeforeInstallPrompt);
    };
  }, []);

  const handleInstallClick = async () => {
    if (deferredPrompt) {
      deferredPrompt.prompt();
      const { outcome } = await deferredPrompt.userChoice;
      if (outcome === "accepted") {
        setIsInstalled(true);
        setShowInstallBanner(false);
      }
      setDeferredPrompt(null);
    } else if (isIos) {
      setShowIosGuide(true);
    }
  };

  const handleDismiss = () => {
    setShowInstallBanner(false);
    setShowIosGuide(false);
    if (typeof window !== "undefined") {
      localStorage.setItem("dream_pwa_banner_dismissed", String(Date.now()));
    }
  };

  if (isInstalled || (!showInstallBanner && !showIosGuide)) {
    return null;
  }

  return (
    <>
      {/* 1. Universal PWA Install Floating Banner */}
      {showInstallBanner && (
        <div className="fixed bottom-4 left-4 right-4 sm:left-auto sm:right-6 sm:max-w-md z-40 bg-ink-900 text-white p-4 rounded-2xl shadow-2xl border border-amber-400/40 animate-in slide-in-from-bottom-5 duration-300">
          <div className="flex items-start justify-between gap-3">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-[#FFB900] flex items-center justify-center text-black font-black text-sm shrink-0 shadow-md">
                DF
              </div>
              <div className="space-y-0.5">
                <div className="flex items-center gap-1.5">
                  <span className="font-heading font-black text-xs uppercase tracking-wider text-[#FFB900]">
                    Install Dream Fashion App
                  </span>
                  <span className="text-[9px] bg-white/20 text-white px-1.5 py-0.2 rounded font-bold uppercase">
                    PWA
                  </span>
                </div>
                <p className="text-[11px] text-zinc-300 leading-snug">
                  Fast 1-tap checkout, instant parcel tracking & offline browsing.
                </p>
              </div>
            </div>

            <button
              onClick={handleDismiss}
              className="text-zinc-400 hover:text-white p-1 cursor-pointer transition-colors"
              aria-label="Dismiss install prompt"
            >
              <X className="w-4 h-4" />
            </button>
          </div>

          <div className="mt-3 pt-3 border-t border-white/10 flex items-center justify-end gap-2">
            <button
              onClick={handleDismiss}
              className="px-3 py-1.5 text-xs text-zinc-400 hover:text-white font-medium uppercase transition-colors cursor-pointer"
            >
              Not Now
            </button>
            <button
              onClick={handleInstallClick}
              className="px-4 py-1.5 bg-[#FFB900] hover:bg-[#E5A700] text-black font-black uppercase text-xs rounded-xl flex items-center gap-1.5 shadow-md active:scale-95 transition-all cursor-pointer"
            >
              <Download className="w-3.5 h-3.5" />
              <span>Install App</span>
            </button>
          </div>
        </div>
      )}

      {/* 2. iOS Safari Add to Home Screen Instructions Modal */}
      {showIosGuide && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-end sm:items-center justify-center p-4">
          <div className="bg-white rounded-3xl p-6 max-w-sm w-full space-y-4 text-ink-900 shadow-2xl animate-in slide-in-from-bottom duration-200">
            <div className="flex items-center justify-between pb-2 border-b border-line-100">
              <div className="flex items-center gap-2">
                <Smartphone className="w-5 h-5 text-accent-gold" />
                <h3 className="font-heading text-sm font-black uppercase tracking-wider">
                  Install on iPhone / iPad
                </h3>
              </div>
              <button
                onClick={() => setShowIosGuide(false)}
                className="p-1 text-ink-400 hover:text-ink-900 rounded-lg cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <ol className="space-y-3 text-xs text-ink-700">
              <li className="flex items-start gap-2.5">
                <span className="w-5 h-5 rounded-full bg-ink-900 text-white font-bold text-[10px] flex items-center justify-center shrink-0 mt-0.5">
                  1
                </span>
                <span>
                  Tap the <strong>Share</strong> button (box with upward arrow) in Safari&apos;s bottom toolbar.
                </span>
              </li>
              <li className="flex items-start gap-2.5">
                <span className="w-5 h-5 rounded-full bg-ink-900 text-white font-bold text-[10px] flex items-center justify-center shrink-0 mt-0.5">
                  2
                </span>
                <span>
                  Scroll down and tap <strong>&quot;Add to Home Screen&quot;</strong>.
                </span>
              </li>
              <li className="flex items-start gap-2.5">
                <span className="w-5 h-5 rounded-full bg-ink-900 text-white font-bold text-[10px] flex items-center justify-center shrink-0 mt-0.5">
                  3
                </span>
                <span>
                  Tap <strong>&quot;Add&quot;</strong> in the top-right corner to finish installing!
                </span>
              </li>
            </ol>

            <button
              onClick={() => setShowIosGuide(false)}
              className="w-full py-2.5 bg-ink-900 hover:bg-black text-white text-xs font-bold uppercase rounded-xl transition-colors cursor-pointer"
            >
              Got It
            </button>
          </div>
        </div>
      )}
    </>
  );
}
