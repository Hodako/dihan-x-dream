"use client";

import { useState, useEffect } from "react";
import { X, Copy, Check, Gift, Clock, Sparkles, RotateCcw, AlertCircle } from "lucide-react";
import { useUIStore } from "@/store/useUIStore";
import { cn } from "@/lib/utils";
import { SpinnerSlice, SpinnerSettings } from "@/types";
import { doc, getDoc } from "firebase/firestore";
import { db } from "@/lib/firebase";

const DEFAULT_SLICES: SpinnerSlice[] = [
  { id: "s1", label: "10% OFF", prefix: "DF-10", discountText: "10% Discount", discountType: "percent", discountValue: 10, color: "#0E0E0E", textColor: "#FFFFFF" },
  { id: "s2", label: "TRY AGAIN", prefix: "TRY", discountText: "Better luck next time!", discountType: "fixed", discountValue: 0, color: "#4B5563", textColor: "#FFFFFF", isTryAgain: true },
  { id: "s3", label: "৳200 OFF", prefix: "DF-200", discountText: "৳200 Flat Discount", discountType: "fixed", discountValue: 200, color: "#C8102E", textColor: "#FFFFFF" },
  { id: "s4", label: "15% OFF", prefix: "DF-15", discountText: "15% Discount", discountType: "percent", discountValue: 15, color: "#1F2937", textColor: "#FFFFFF" },
  { id: "s5", label: "FREE SHIP", prefix: "DF-FREE", discountText: "Free Delivery", discountType: "fixed", discountValue: 120, color: "#B8955A", textColor: "#FFFFFF" },
  { id: "s6", label: "TRY AGAIN", prefix: "TRY", discountText: "Better luck next time!", discountType: "fixed", discountValue: 0, color: "#374151", textColor: "#FFFFFF", isTryAgain: true },
  { id: "s7", label: "20% OFF", prefix: "DF-20", discountText: "20% Mega Discount", discountType: "percent", discountValue: 20, color: "#991B1B", textColor: "#FFFFFF" },
];

function generateUniqueCode(prefix: string): string {
  const chars = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";
  let randomPart = "";
  for (let i = 0; i < 4; i++) {
    randomPart += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return `${prefix}-${randomPart}`;
}

export default function SpinToWinModal() {
  const { addToast } = useUIStore();
  const [mounted, setMounted] = useState(false);
  const [isOpen, setIsOpen] = useState(false);
  const [isTabVisible, setIsTabVisible] = useState(true);
  const [isSpinning, setIsSpinning] = useState(false);
  const [rotationAngle, setRotationAngle] = useState(0);
  const [copied, setCopied] = useState(false);
  const [slices, setSlices] = useState<SpinnerSlice[]>(DEFAULT_SLICES);
  const [maxSpins, setMaxSpins] = useState(3);
  const [spinCount, setSpinCount] = useState(0);
  const [tryAgainMessage, setTryAgainMessage] = useState(false);

  // Active Spin Session (Valid for 10 minutes)
  const [activeReward, setActiveReward] = useState<{
    slice: SpinnerSlice;
    code: string;
    expiresAt: number;
  } | null>(null);

  const [remainingTime, setRemainingTime] = useState<string>("");

  useEffect(() => {
    setMounted(true);
    if (typeof window !== "undefined") {
      const storedCount = parseInt(localStorage.getItem("dream_user_spin_count") || "0", 10);
      setSpinCount(storedCount);

      const saved = localStorage.getItem("dream_spin_session");
      if (saved) {
        try {
          const parsed = JSON.parse(saved);
          if (parsed.expiresAt > Date.now()) {
            setActiveReward(parsed);
          } else {
            localStorage.removeItem("dream_spin_session");
          }
        } catch (e) {}
      }
    }

    // Load dynamic spinner config from Firestore
    async function loadSpinnerSettings() {
      try {
        const snap = await getDoc(doc(db, "settings", "spinner"));
        if (snap.exists()) {
          const data = snap.data() as SpinnerSettings;
          if (data.slices && data.slices.length > 0) {
            setSlices(data.slices);
          }
          if (data.maxSpinsPerUser) {
            setMaxSpins(data.maxSpinsPerUser);
          }
        }
      } catch (e) {}
    }
    loadSpinnerSettings();
  }, []);

  // Live 10-minute countdown ticker
  useEffect(() => {
    if (!activeReward) return;

    const interval = setInterval(() => {
      const diff = activeReward.expiresAt - Date.now();
      if (diff <= 0) {
        setActiveReward(null);
        if (typeof window !== "undefined") {
          localStorage.removeItem("dream_spin_session");
        }
        clearInterval(interval);
      } else {
        const mins = Math.floor(diff / 60000);
        const secs = Math.floor((diff % 60000) / 1000);
        setRemainingTime(`${String(mins).padStart(2, "0")}:${String(secs).padStart(2, "0")}`);
      }
    }, 1000);

    return () => clearInterval(interval);
  }, [activeReward]);

  const remainingSpins = Math.max(0, maxSpins - spinCount);

  const handleSpin = () => {
    if (isSpinning) return;

    if (remainingSpins <= 0) {
      addToast(`You have reached your ${maxSpins}-spin limit for today!`, "warning");
      return;
    }

    // Reset previous prize
    setActiveReward(null);
    setTryAgainMessage(false);
    setIsSpinning(true);

    const winningIndex = Math.floor(Math.random() * slices.length);
    const winningSlice = slices[winningIndex];

    const sliceCount = slices.length;
    const sliceAngle = 360 / sliceCount;
    const sliceCenterAngle = winningIndex * sliceAngle + sliceAngle / 2;

    const currentBaseRotations = Math.floor(rotationAngle / 360) * 360;
    const totalSpins = currentBaseRotations + 6 * 360;
    const targetAngle = totalSpins + (360 - sliceCenterAngle);

    setRotationAngle(targetAngle);

    setTimeout(() => {
      setIsSpinning(false);
      const newCount = spinCount + 1;
      setSpinCount(newCount);
      if (typeof window !== "undefined") {
        localStorage.setItem("dream_user_spin_count", newCount.toString());
      }

      if (winningSlice.isTryAgain) {
        setTryAgainMessage(true);
        addToast(`Aw, no luck this time! ${Math.max(0, maxSpins - newCount)} spins remaining.`, "info");
      } else {
        const generatedCode = generateUniqueCode(winningSlice.prefix);
        const rewardObj = {
          slice: winningSlice,
          code: generatedCode,
          expiresAt: Date.now() + 10 * 60 * 1000,
        };

        setActiveReward(rewardObj);
        if (typeof window !== "undefined") {
          localStorage.setItem("dream_spin_session", JSON.stringify(rewardObj));
        }
        addToast(`🎉 Congratulations! You won ${winningSlice.label}!`, "success");
      }
    }, 4500);
  };

  const handleCopyCode = () => {
    if (!activeReward) return;
    navigator.clipboard.writeText(activeReward.code);
    setCopied(true);
    addToast("Discount code copied to clipboard! Paste at checkout.", "success");
    setTimeout(() => setCopied(false), 2500);
  };

  if (!mounted) return null;

  return (
    <>
      {/* 1. Floating Trigger Button */}
      {isTabVisible && !isOpen && (
        <div className="fixed bottom-6 left-6 z-40 flex items-center shadow-2xl group animate-bounce-subtle">
          <button
            type="button"
            onClick={() => setIsTabVisible(false)}
            className="w-5 h-5 -mr-1.5 -mt-6 z-10 bg-black/80 hover:bg-black text-white rounded-full flex items-center justify-center text-[10px] shadow-sm transition-transform hover:scale-110 cursor-pointer"
            aria-label="Hide spin to win tab"
            title="Hide"
          >
            <X className="w-3 h-3" />
          </button>

          <button
            type="button"
            onClick={() => setIsOpen(true)}
            className="flex items-center gap-2.5 bg-[#0E0E0E] hover:bg-black text-white px-4 py-2.5 rounded-full border border-white/20 shadow-xl transition-all hover:scale-105 active:scale-95 cursor-pointer"
            aria-label="Open Spin to Win"
          >
            <div className="w-6 h-6 rounded-full bg-accent-gold text-ink-950 flex items-center justify-center font-black text-xs animate-pulse">
              <Gift className="w-3.5 h-3.5" />
            </div>
            <div className="text-left">
              <span className="font-heading text-xs font-black uppercase tracking-wider block leading-tight text-white">
                Spin & Win
              </span>
              <span className="text-[10px] text-accent-gold font-bold uppercase tracking-wider block">
                {remainingSpins > 0 ? `${remainingSpins}/${maxSpins} Spins Left` : "Daily Limit Met"}
              </span>
            </div>
          </button>
        </div>
      )}

      {/* 2. Lucky Spinner Modal Dialog */}
      {isOpen && (
        <div className="fixed inset-0 z-50 overflow-y-auto flex items-center justify-center p-4">
          <div
            className="fixed inset-0 bg-black/75 backdrop-blur-xs transition-opacity"
            onClick={() => !isSpinning && setIsOpen(false)}
          />

          <div className="relative w-full max-w-md bg-[#121212] text-white rounded-3xl p-6 sm:p-8 shadow-2xl border border-white/10 z-50 text-center space-y-5 overflow-hidden">
            {/* Background luxury gradient glow */}
            <div className="absolute -top-24 -left-24 w-48 h-48 bg-accent-gold/20 rounded-full blur-3xl pointer-events-none" />
            <div className="absolute -bottom-24 -right-24 w-48 h-48 bg-accent-red/20 rounded-full blur-3xl pointer-events-none" />

            {/* Close Modal Button */}
            <button
              type="button"
              disabled={isSpinning}
              onClick={() => setIsOpen(false)}
              className="absolute top-4 right-4 text-gray-400 hover:text-white p-1 rounded-full hover:bg-white/10 transition-colors disabled:opacity-30 cursor-pointer"
            >
              <X className="w-5 h-5" />
            </button>

            {/* Header */}
            <div className="space-y-1">
              <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-accent-gold/15 text-accent-gold text-[10px] font-bold uppercase tracking-widest border border-accent-gold/30">
                <Sparkles className="w-3 h-3" />
                <span>Dream Rewards</span>
              </div>
              <h2 className="font-heading text-xl sm:text-2xl font-black uppercase tracking-wider text-white">
                SPIN & WIN DISCOUNT
              </h2>
              <p className="text-xs text-gray-400 max-w-xs mx-auto">
                {activeReward
                  ? "Your 10-minute exclusive discount is ready to claim!"
                  : `Spin the wheel to unlock special discounts! (${remainingSpins}/${maxSpins} spins remaining)`}
              </p>
            </div>

            {/* Spinner Wheel Container */}
            <div className="relative w-64 h-64 mx-auto my-2 select-none">
              {/* Pointer Marker at the Top */}
              <div className="absolute top-0 left-1/2 -translate-x-1/2 -mt-2.5 z-30 pointer-events-none">
                <div className="w-0 h-0 border-l-[10px] border-l-transparent border-r-[10px] border-r-transparent border-t-[18px] border-t-accent-gold drop-shadow-md" />
              </div>

              {/* Rotating Wheel Circle */}
              <div
                className="w-full h-full rounded-full border-4 border-accent-gold/40 shadow-2xl relative overflow-hidden transition-transform ease-out"
                style={{
                  transform: `rotate(${rotationAngle}deg)`,
                  transitionDuration: isSpinning ? "4500ms" : "0ms",
                  transitionTimingFunction: "cubic-bezier(0.15, 0.9, 0.25, 1)",
                }}
              >
                <svg viewBox="0 0 100 100" className="w-full h-full transform -rotate-90">
                  {slices.map((slice, i) => {
                    const sliceAngle = 360 / slices.length;
                    const startAngle = i * sliceAngle;
                    const endAngle = startAngle + sliceAngle;

                    const x1 = 50 + 50 * Math.cos((Math.PI * startAngle) / 180);
                    const y1 = 50 + 50 * Math.sin((Math.PI * startAngle) / 180);
                    const x2 = 50 + 50 * Math.cos((Math.PI * endAngle) / 180);
                    const y2 = 50 + 50 * Math.sin((Math.PI * endAngle) / 180);

                    const largeArcFlag = sliceAngle > 180 ? 1 : 0;
                    const pathData = `M 50 50 L ${x1} ${y1} A 50 50 0 ${largeArcFlag} 1 ${x2} ${y2} Z`;

                    const textAngle = startAngle + sliceAngle / 2;
                    const textRad = (Math.PI * textAngle) / 180;
                    const textX = 50 + 34 * Math.cos(textRad);
                    const textY = 50 + 34 * Math.sin(textRad);

                    return (
                      <g key={slice.id || i}>
                        <path d={pathData} fill={slice.color} stroke="#1F2937" strokeWidth="0.75" />
                        <text
                          x={textX}
                          y={textY}
                          fill={slice.textColor}
                          fontSize={slice.label.length > 7 ? "4.2" : "5"}
                          fontWeight="900"
                          fontFamily="sans-serif"
                          textAnchor="middle"
                          dominantBaseline="central"
                          transform={`rotate(${textAngle + 90}, ${textX}, ${textY})`}
                        >
                          {slice.label}
                        </text>
                      </g>
                    );
                  })}
                </svg>
              </div>

              {/* Center Hub Button */}
              <button
                type="button"
                disabled={isSpinning || remainingSpins <= 0}
                onClick={handleSpin}
                className={cn(
                  "absolute inset-0 m-auto w-16 h-16 rounded-full bg-gradient-to-br from-accent-gold via-amber-400 to-yellow-600 border-2 border-white shadow-2xl flex flex-col items-center justify-center text-ink-950 font-black text-xs uppercase tracking-wider transition-all z-20 cursor-pointer hover:scale-105 active:scale-95",
                  (isSpinning || remainingSpins <= 0) && "opacity-80 cursor-not-allowed scale-100"
                )}
                aria-label="Spin wheel"
              >
                <div className={cn("w-6 h-6 transition-transform", isSpinning && "animate-spin")}>
                  <RotateCcw className="w-full h-full" />
                </div>
                <span className="text-[9px] font-black leading-none">
                  {isSpinning ? "..." : remainingSpins > 0 ? "SPIN" : "0 LEFT"}
                </span>
              </button>
            </div>

            {/* Try Again feedback */}
            {tryAgainMessage && !activeReward && (
              <div className="p-3 bg-white/5 border border-white/10 rounded-xl space-y-1">
                <p className="text-xs font-bold text-amber-400">
                  😅 Almost there! Better luck on your next shot!
                </p>
                <p className="text-[11px] text-gray-400">
                  {remainingSpins > 0 ? `You have ${remainingSpins} spins left today.` : "You've used all 3 spins for today."}
                </p>
              </div>
            )}

            {/* Active Reward Card with 10-Minute Expiry */}
            {activeReward ? (
              <div className="bg-white/5 border border-accent-gold/40 rounded-2xl p-4 space-y-3 shadow-inner">
                <div className="flex items-center justify-between text-xs">
                  <span className="font-bold text-accent-gold uppercase tracking-wider">
                    🎉 {activeReward.slice.discountText}
                  </span>
                  <div className="flex items-center gap-1 font-mono text-accent-gold text-[11px] bg-accent-gold/10 px-2 py-0.5 rounded border border-accent-gold/20">
                    <Clock className="w-3 h-3" />
                    <span>{remainingTime}</span>
                  </div>
                </div>

                <div className="flex items-center gap-2">
                  <input
                    type="text"
                    readOnly
                    value={activeReward.code}
                    className="flex-1 bg-black/60 border border-white/20 rounded-xl py-2 px-3 text-center font-mono font-bold text-sm tracking-widest text-accent-gold select-all"
                  />
                  <button
                    type="button"
                    onClick={handleCopyCode}
                    className="px-4 py-2 bg-accent-gold hover:bg-amber-400 text-ink-950 rounded-xl text-xs font-bold uppercase tracking-wider flex items-center gap-1.5 transition-transform active:scale-95 cursor-pointer shadow-md"
                  >
                    {copied ? <Check className="w-4 h-4" /> : <Copy className="w-4 h-4" />}
                    <span>{copied ? "COPIED" : "COPY"}</span>
                  </button>
                </div>

                {remainingSpins > 0 && (
                  <button
                    type="button"
                    onClick={handleSpin}
                    disabled={isSpinning}
                    className="text-[11px] text-gray-400 hover:text-white uppercase font-bold tracking-wider underline cursor-pointer"
                  >
                    Try another spin ({remainingSpins} left)
                  </button>
                )}
              </div>
            ) : (
              <div className="space-y-2">
                <button
                  type="button"
                  disabled={isSpinning || remainingSpins <= 0}
                  onClick={handleSpin}
                  className={cn(
                    "w-full py-3.5 bg-gradient-to-r from-accent-gold via-amber-400 to-yellow-600 hover:brightness-110 text-ink-950 font-black text-xs uppercase tracking-widest rounded-xl transition-all shadow-xl active:scale-[0.99] cursor-pointer",
                    (isSpinning || remainingSpins <= 0) && "opacity-50 cursor-not-allowed"
                  )}
                >
                  {isSpinning
                    ? "SPINNING THE WHEEL..."
                    : remainingSpins > 0
                    ? `SPIN TO WIN NOW (${remainingSpins}/${maxSpins} SPINS LEFT)`
                    : "DAILY SPINS EXHAUSTED"}
                </button>
                <p className="text-[10px] text-gray-500">
                  Each customer is eligible for {maxSpins} spins per session. Unlocked vouchers are valid for 10 minutes.
                </p>
              </div>
            )}
          </div>
        </div>
      )}
    </>
  );
}
