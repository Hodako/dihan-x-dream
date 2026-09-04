"use client";

import { useState, useEffect } from "react";
import { usePathname } from "next/navigation";
import { X, Copy, Check, Gift, Clock, Sparkles, RotateCcw, Award } from "lucide-react";
import { useUIStore } from "@/store/useUIStore";
import { cn } from "@/lib/utils";
import { SpinnerSlice, SpinnerSettings } from "@/types";
import { doc, getDoc } from "firebase/firestore";
import { db } from "@/lib/firebase";
import SpinIcon from "@/components/icons/SpinIcon";

const DEFAULT_SLICES: SpinnerSlice[] = [
  { id: "s1", label: "10% OFF", prefix: "DF-10", discountText: "10% Discount", discountType: "percent", discountValue: 10, color: "#0E0E0E", textColor: "#FFFFFF" },
  { id: "s2", label: "SORRY", prefix: "SORRY", discountText: "Sorry, you didn't win this time!", discountType: "fixed", discountValue: 0, color: "#0284c7", textColor: "#FFFFFF", isTryAgain: true },
  { id: "s3", label: "৳200 OFF", prefix: "DF-200", discountText: "৳200 Flat Discount", discountType: "fixed", discountValue: 200, color: "#C8102E", textColor: "#FFFFFF" },
  { id: "s4", label: "NO LUCK", prefix: "NOLUCK", discountText: "No luck! Try another spin!", discountType: "fixed", discountValue: 0, color: "#38bdf8", textColor: "#0E0E0E", isTryAgain: true },
  { id: "s5", label: "FREE SHIP", prefix: "DF-FREE", discountText: "Free Delivery", discountType: "fixed", discountValue: 120, color: "#B8955A", textColor: "#FFFFFF" },
  { id: "s6", label: "TRY AGAIN", prefix: "TRY", discountText: "Better luck next time!", discountType: "fixed", discountValue: 0, color: "#0ea5e9", textColor: "#FFFFFF", isTryAgain: true },
  { id: "s7", label: "15% OFF", prefix: "DF-15", discountText: "15% Discount", discountType: "percent", discountValue: 15, color: "#1F2937", textColor: "#FFFFFF" },
  { id: "s8", label: "20% OFF", prefix: "DF-20", discountText: "20% Mega Discount", discountType: "percent", discountValue: 20, color: "#991B1B", textColor: "#FFFFFF" },
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
  const pathname = usePathname();
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
  const [tryAgainMessage, setTryAgainMessage] = useState<string | null>(null);

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

  if (!mounted) return null;

  // HIDE SPINNER ON PRODUCT PAGES & ADMIN / CHECKOUT ROUTES
  if (
    pathname?.startsWith("/product") ||
    pathname?.startsWith("/checkout") ||
    pathname?.startsWith("/admin") ||
    pathname?.startsWith("/who/hodako")
  ) {
    return null;
  }

  const remainingSpins = Math.max(0, maxSpins - spinCount);
  const sliceCount = slices.length;
  const sliceAngle = 360 / sliceCount;

  const handleSpin = () => {
    if (isSpinning) return;

    if (remainingSpins <= 0) {
      addToast(`You have reached your ${maxSpins}-spin limit for today!`, "warning");
      return;
    }

    setIsSpinning(true);
    setTryAgainMessage(null);

    // Pick winning slice
    const winningIndex = Math.floor(Math.random() * sliceCount);
    const winningSlice = slices[winningIndex];

    // Compute extra rotation so needle lands on winning slice
    const targetOffset = 360 - (winningIndex * sliceAngle + sliceAngle / 2);
    const fullSpins = 360 * 6;
    const newAngle = rotationAngle + fullSpins + (targetOffset - (rotationAngle % 360));

    setRotationAngle(newAngle);

    setTimeout(() => {
      setIsSpinning(false);
      const newCount = spinCount + 1;
      setSpinCount(newCount);
      if (typeof window !== "undefined") {
        localStorage.setItem("dream_user_spin_count", newCount.toString());
      }

      // Check if non-winning slice
      if (
        winningSlice.isTryAgain ||
        winningSlice.label === "SORRY" ||
        winningSlice.label === "NO LUCK" ||
        winningSlice.label === "TRY AGAIN" ||
        winningSlice.discountValue === 0
      ) {
        const msg =
          winningSlice.label === "SORRY"
            ? "😔 Sorry! You didn't win this time, give it another spin!"
            : winningSlice.label === "NO LUCK"
            ? "🍀 No luck this spin! Try your remaining chances!"
            : "😅 Almost there! Better luck on your next shot!";
        setTryAgainMessage(msg);
        addToast(msg, "info");
      } else {
        // Valid discount voucher won!
        const generatedCode = generateUniqueCode(winningSlice.prefix || "DF-SPIN");
        const rewardSession = {
          slice: winningSlice,
          code: generatedCode,
          expiresAt: Date.now() + 10 * 60 * 1000,
        };
        setActiveReward(rewardSession);
        if (typeof window !== "undefined") {
          localStorage.setItem("dream_spin_session", JSON.stringify(rewardSession));
          localStorage.setItem(
            "dream_applied_coupon",
            JSON.stringify({
              id: `spin_${generatedCode}`,
              code: generatedCode,
              type: winningSlice.discountType || "percent",
              value: winningSlice.discountValue || 10,
              active: true,
            })
          );
        }
        addToast(`🎉 Congratulations! You won ${winningSlice.discountText}!`, "success");
      }
    }, 4500);
  };

  const handleCopyCode = () => {
    if (!activeReward) return;
    navigator.clipboard.writeText(activeReward.code);
    setCopied(true);
    addToast(`Coupon "${activeReward.code}" copied to clipboard!`, "success");
    setTimeout(() => setCopied(false), 2500);
  };

  return (
    <>
      {/* 1. Floating Left-Docked "Spin to win" Tab (Visible on PC & Mobile) */}
      {isTabVisible && !isOpen && (
        <div className="fixed left-0 top-1/2 -translate-y-1/2 z-40 flex items-center">
          <div className="relative group">
            {/* Pinned Circular Close Button */}
            <button
              type="button"
              onClick={(e) => {
                e.stopPropagation();
                setIsTabVisible(false);
              }}
              className="absolute -top-2 -right-2 w-5 h-5 rounded-full bg-white text-black border border-gray-300 shadow-md flex items-center justify-center text-[10px] font-bold z-50 hover:bg-gray-100 hover:scale-110 transition-transform cursor-pointer"
              aria-label="Hide spin to win tab"
              title="Close"
            >
              <X className="w-3 h-3 stroke-[2.5]" />
            </button>

            {/* Main Vertical Tab with PC Hover Animations */}
            <button
              type="button"
              onClick={() => setIsOpen(true)}
              className="bg-[#1A1A1A] hover:bg-black text-white rounded-r-lg shadow-2xl py-3 sm:py-4 px-2 sm:px-2.5 flex flex-col items-center gap-1.5 justify-center transition-all duration-300 group-hover:translate-x-0.5 cursor-pointer select-none border-y border-r border-white/20 active:scale-95"
              aria-label="Open Spin to Win"
            >
              <SpinIcon className="w-4 h-4 animate-spin [animation-duration:8s]" />
              <span className="[writing-mode:vertical-rl] rotate-180 text-xs sm:text-[13px] font-bold tracking-wider text-white whitespace-nowrap">
                Spin to win
              </span>
            </button>
          </div>
        </div>
      )}

      {/* 2. Lucky Spinner Modal Dialog (CLEAN WHITE THEME) */}
      {isOpen && (
        <div className="fixed inset-0 z-50 overflow-y-auto flex items-center justify-center p-4">
          <div
            className="fixed inset-0 bg-black/65 backdrop-blur-xs transition-opacity"
            onClick={() => !isSpinning && setIsOpen(false)}
          />

          <div className="relative w-full max-w-md bg-white text-ink-900 rounded-3xl p-6 sm:p-8 shadow-2xl border border-line-200 z-50 text-center space-y-5 overflow-hidden">
            {/* Soft decorative accent glow */}
            <div className="absolute -top-20 -left-20 w-44 h-44 bg-amber-400/10 rounded-full blur-3xl pointer-events-none" />
            <div className="absolute -bottom-20 -right-20 w-44 h-44 bg-sky-400/10 rounded-full blur-3xl pointer-events-none" />

            {/* Close Modal Button */}
            <button
              type="button"
              disabled={isSpinning}
              onClick={() => setIsOpen(false)}
              className="absolute top-4 right-4 text-gray-400 hover:text-ink-900 p-1.5 rounded-full hover:bg-gray-100 transition-colors disabled:opacity-30 cursor-pointer"
            >
              <X className="w-5 h-5" />
            </button>

            {/* Header */}
            <div className="space-y-1">
              <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-amber-50 text-amber-800 text-[10px] font-bold uppercase tracking-widest border border-amber-200">
                <SpinIcon className="w-3.5 h-3.5" />
                <span>Dream Fashion Rewards</span>
              </div>
              <h2 className="font-heading text-xl sm:text-2xl font-black uppercase tracking-wider text-ink-900">
                SPIN & WIN DISCOUNT
              </h2>
              <p className="text-xs text-gray-500 max-w-xs mx-auto">
                {activeReward
                  ? "Your 10-minute exclusive discount is ready to claim!"
                  : `Spin the wheel to unlock special discounts! (${remainingSpins}/${maxSpins} spins remaining)`}
              </p>
            </div>

            {/* Spinner Wheel Container */}
            <div className="relative w-64 h-64 mx-auto my-2 select-none">
              {/* Pointer Marker at the Top */}
              <div className="absolute top-0 left-1/2 -translate-x-1/2 -mt-2.5 z-30 pointer-events-none">
                <div className="w-0 h-0 border-l-[10px] border-l-transparent border-r-[10px] border-r-transparent border-t-[18px] border-t-amber-500 drop-shadow-md" />
              </div>

              {/* Rotating SVG Wheel with Mathematically Perfect Radial Text Alignment */}
              <div
                className="w-full h-full rounded-full border-4 border-amber-500 shadow-xl relative overflow-hidden transition-transform ease-out bg-white"
                style={{
                  transform: `rotate(${rotationAngle}deg)`,
                  transitionDuration: isSpinning ? "4500ms" : "0ms",
                  transitionTimingFunction: "cubic-bezier(0.15, 0.9, 0.25, 1)",
                }}
              >
                <svg viewBox="0 0 100 100" className="w-full h-full">
                  {slices.map((slice, index) => {
                    const startAngle = index * sliceAngle;
                    const centerAngle = startAngle + sliceAngle / 2;

                    // Calculate SVG Pie Slice Path
                    const rad = (sliceAngle * Math.PI) / 180;
                    const x = 50 + 50 * Math.sin(rad);
                    const y = 50 - 50 * Math.cos(rad);

                    return (
                      <g
                        key={slice.id}
                        transform={`rotate(${startAngle} 50 50)`}
                      >
                        {/* Slice Sector */}
                        <path
                          d={`M 50 50 L 50 0 A 50 50 0 0 1 ${x} ${y} Z`}
                          fill={slice.color}
                          stroke="#FFFFFF"
                          strokeWidth="0.75"
                        />

                        {/* Perfectly Centered Radial Text */}
                        <g transform={`rotate(${sliceAngle / 2} 50 50)`}>
                          <text
                            x="50"
                            y="13.5"
                            textAnchor="middle"
                            fill={slice.textColor || "#FFFFFF"}
                            fontSize="4.4"
                            fontWeight="900"
                            letterSpacing="0.04em"
                            fontFamily="system-ui, -apple-system, sans-serif"
                            className="select-none uppercase"
                          >
                            {slice.label}
                          </text>
                        </g>
                      </g>
                    );
                  })}
                </svg>
              </div>

              {/* Center Gold Hub */}
              <div className="absolute inset-0 m-auto w-12 h-12 rounded-full bg-white border-3 border-amber-500 shadow-md flex items-center justify-center z-20">
                <Gift className="w-5 h-5 text-amber-600 animate-pulse" />
              </div>
            </div>

            {/* Try Again / Sorry Alert Message */}
            {tryAgainMessage && (
              <div className="p-3 rounded-xl bg-sky-50 border border-sky-200 text-sky-900 text-xs font-semibold animate-fade-in flex items-center justify-center gap-2">
                <RotateCcw className="w-4 h-4 text-sky-600 shrink-0" />
                <span>{tryAgainMessage}</span>
              </div>
            )}

            {/* Active Voucher Claim or Spin CTA Button */}
            {activeReward ? (
              <div className="bg-amber-50/70 border border-amber-300 rounded-2xl p-4 space-y-3">
                <div className="flex items-center justify-between text-xs">
                  <span className="font-bold text-amber-900 uppercase tracking-wider">
                    {activeReward.slice.discountText}
                  </span>
                  <span className="text-[11px] text-amber-700 flex items-center gap-1 font-mono">
                    <Clock className="w-3.5 h-3.5 text-amber-600" />
                    <span>Expires in {remainingTime}</span>
                  </span>
                </div>

                <div className="flex items-center gap-2">
                  <input
                    type="text"
                    readOnly
                    value={activeReward.code}
                    className="w-full text-center font-mono font-black text-sm tracking-widest bg-white border border-amber-300 rounded-xl py-2 text-ink-900 shadow-xs"
                  />
                  <button
                    type="button"
                    onClick={handleCopyCode}
                    className="px-4 py-2 bg-[#0E0E0E] hover:bg-black text-white rounded-xl text-xs font-bold uppercase tracking-wider flex items-center gap-1.5 transition-transform active:scale-95 cursor-pointer shadow-sm"
                  >
                    {copied ? <Check className="w-4 h-4" /> : <Copy className="w-4 h-4" />}
                    <span>{copied ? "COPIED" : "COPY"}</span>
                  </button>
                </div>

                <div className="flex items-center gap-2 pt-1">
                  <a
                    href="/checkout"
                    onClick={() => setIsOpen(false)}
                    className="flex-1 py-2.5 bg-[#FFB900] hover:bg-[#E5A700] text-black rounded-xl text-xs font-black uppercase tracking-wider text-center transition-all shadow-sm active:scale-95"
                  >
                    Apply & Checkout Now →
                  </a>
                </div>

                {remainingSpins > 0 && (
                  <button
                    type="button"
                    onClick={handleSpin}
                    disabled={isSpinning}
                    className="text-[11px] text-gray-500 hover:text-black uppercase font-bold tracking-wider underline cursor-pointer pt-1"
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
                    "w-full py-3.5 bg-gradient-to-r from-amber-400 via-yellow-500 to-amber-600 hover:brightness-105 text-ink-950 font-black text-xs uppercase tracking-widest rounded-xl transition-all shadow-md active:scale-[0.99] cursor-pointer",
                    (isSpinning || remainingSpins <= 0) && "opacity-50 cursor-not-allowed"
                  )}
                >
                  {isSpinning
                    ? "SPINNING THE WHEEL..."
                    : remainingSpins > 0
                    ? `SPIN TO WIN NOW (${remainingSpins}/${maxSpins} SPINS LEFT)`
                    : "DAILY SPINS EXHAUSTED"}
                </button>
                <p className="text-[10px] text-gray-400">
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
