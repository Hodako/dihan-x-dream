"use client";

import { useState, useMemo, useEffect } from "react";
import { useRouter } from "next/navigation";
import Image from "next/image";
import Link from "next/link";
import {
  Truck,
  ArrowRight,
  User,
  Phone,
  MapPin,
  Tag,
  CheckCircle2,
  AlertCircle,
  Clock,
  Sparkles,
  ChevronLeft,
  Edit3,
  Check,
} from "lucide-react";
import { useCartStore } from "@/store/useCartStore";
import { useAuthStore } from "@/store/useAuthStore";
import { useUIStore } from "@/store/useUIStore";
import AltchaWidget from "@/components/security/AltchaWidget";
import {
  BdDivision,
  BdDistrict,
  BdUpazila,
  BdUnion,
  DeliveryZone,
  LogisticsSettings,
  Order,
  PaymentMethod,
  Coupon,
} from "@/types";
import {
  INITIAL_DELIVERY_ZONES,
  INITIAL_LOGISTICS_SETTINGS,
  INITIAL_COUPONS,
} from "@/lib/seedData";
import {
  getDivisions,
  getDistrictsByDivision,
  getUpazilasByDistrict,
  getUnionsByUpazila,
} from "@/lib/bdLocations";
import {
  formatPrice,
  calculateDeliveryCharge,
  computePaymentSplits,
  generateOrderNumber,
  cn,
} from "@/lib/utils";
import { doc, getDoc, setDoc } from "firebase/firestore";
import { db } from "@/lib/firebase";
import { createDirectBkashSession } from "@/lib/bkashClient";

const LOCAL_STORAGE_KEY = "dream_customer_address";

export default function CheckoutPage() {
  const router = useRouter();
  const { items, getSubtotal, clearCart } = useCartStore();
  const { user, profile, signInWithGoogle } = useAuthStore();
  const { addToast } = useUIStore();

  const [mounted, setMounted] = useState(false);
  const [currentStep, setCurrentStep] = useState<1 | 2>(1);

  // Customer Contact Info
  const [customerName, setCustomerName] = useState("");
  const [customerEmail, setCustomerEmail] = useState("");
  const [customerPhone, setCustomerPhone] = useState("");
  const [deliveryNote, setDeliveryNote] = useState("");

  // Bangladesh Geo Data
  const [divisions, setDivisions] = useState<BdDivision[]>([]);
  const [districts, setDistricts] = useState<BdDistrict[]>([]);
  const [upazilas, setUpazilas] = useState<BdUpazila[]>([]);
  const [unions, setUnions] = useState<BdUnion[]>([]);

  const [selectedDivisionId, setSelectedDivisionId] = useState("");
  const [selectedDistrictId, setSelectedDistrictId] = useState("");
  const [selectedUpazilaId, setSelectedUpazilaId] = useState("");
  const [selectedUnionId, setSelectedUnionId] = useState("");
  const [streetAddress, setStreetAddress] = useState("");

  // Payment State
  const [paymentMethod, setPaymentMethod] = useState<"cod" | "partial" | "bkash">("cod");
  const [bkashTrxId, setBkashTrxId] = useState("");
  const [bkashNumber, setBkashNumber] = useState("");
  const [isRedirecting, setIsRedirecting] = useState(false);

  const [deliveryZones, setDeliveryZones] = useState<DeliveryZone[]>(INITIAL_DELIVERY_ZONES);
  const [logisticsSettings, setSettingsState] = useState<LogisticsSettings & {
    paymentTitles?: {
      cod: string;
      codSub: string;
      partial: string;
      partialSub: string;
      bkash: string;
      bkashSub: string;
      bkashNumber: string;
    };
  }>(INITIAL_LOGISTICS_SETTINGS);

  const [couponCodeInput, setCouponCodeInput] = useState("");
  const [appliedCoupon, setAppliedCoupon] = useState<Coupon | null>(null);
  const [isApplyingCoupon, setIsApplyingCoupon] = useState(false);
  const [couponError, setCouponError] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  // 1. Initial Mount, LocalStorage Auto-Fill & Logistics settings
  useEffect(() => {
    setMounted(true);
    const divs = getDivisions();
    setDivisions(divs);

    // Fetch dynamic logistics settings & payment methods
    async function loadDynamicLogistics() {
      if (typeof window !== "undefined") {
        const stored = localStorage.getItem("dream_logistics_settings");
        if (stored) {
          try {
            const parsed = JSON.parse(stored);
            if (parsed.settings) setSettingsState(parsed.settings);
            if (parsed.zones) setDeliveryZones(parsed.zones);
          } catch (e) {}
        }
      }

      try {
        const snap = await getDoc(doc(db, "settings", "logistics"));
        if (snap.exists()) {
          const data = snap.data();
          if (data.settings) setSettingsState(data.settings);
          if (data.zones) setDeliveryZones(data.zones);
        }
      } catch (e) {}
    }
    loadDynamicLogistics();

    // Auto-fill from localStorage if customer entered previously
    try {
      const savedData = localStorage.getItem(LOCAL_STORAGE_KEY);
      if (savedData) {
        const parsed = JSON.parse(savedData);
        if (parsed.name) setCustomerName(parsed.name);
        if (parsed.phone) setCustomerPhone(parsed.phone);
        if (parsed.divisionId) {
          setSelectedDivisionId(parsed.divisionId);
          const dists = getDistrictsByDivision(parsed.divisionId);
          setDistricts(dists);

          if (parsed.districtId) {
            setSelectedDistrictId(parsed.districtId);
            const upzs = getUpazilasByDistrict(parsed.districtId);
            setUpazilas(upzs);

            if (parsed.upazilaId) {
              setSelectedUpazilaId(parsed.upazilaId);
              const uns = getUnionsByUpazila(parsed.upazilaId);
              setUnions(uns);

              if (parsed.unionId) {
                setSelectedUnionId(parsed.unionId);
              }
            }
          }
        }
        if (parsed.streetAddress) setStreetAddress(parsed.streetAddress);
        return;
      }
    } catch (e) {}

    // Default to Dhaka if no saved address
    const dhakaDiv = divs.find((d) => d.name.toLowerCase() === "dhaka") || divs[0];
    if (dhakaDiv) {
      setSelectedDivisionId(dhakaDiv.id);
      const dhakaDistricts = getDistrictsByDivision(dhakaDiv.id);
      setDistricts(dhakaDistricts);

      const dhakaCity = dhakaDistricts.find((d) => d.name.toLowerCase() === "dhaka") || dhakaDistricts[0];
      if (dhakaCity) {
        setSelectedDistrictId(dhakaCity.id);
        const dhakaUpazilas = getUpazilasByDistrict(dhakaCity.id);
        setUpazilas(dhakaUpazilas);
        if (dhakaUpazilas.length > 0) {
          setSelectedUpazilaId(dhakaUpazilas[0].id);
          const dhakaUnions = getUnionsByUpazila(dhakaUpazilas[0].id);
          setUnions(dhakaUnions);
        }
      }
    }
  }, []);

  // Sync with auth user info if available
  useEffect(() => {
    if (user || profile) {
      if (!customerName) setCustomerName(profile?.name || user?.displayName || "");
      if (!customerEmail) setCustomerEmail(profile?.email || user?.email || "");
      if (!customerPhone && profile?.phone) setCustomerPhone(profile.phone);
    }
  }, [user, profile, customerName, customerEmail, customerPhone]);

  // Handle Division Selection
  const handleDivisionChange = (divId: string) => {
    setSelectedDivisionId(divId);
    setSelectedDistrictId("");
    setSelectedUpazilaId("");
    setSelectedUnionId("");
    setUpazilas([]);
    setUnions([]);

    if (divId) {
      const dList = getDistrictsByDivision(divId);
      setDistricts(dList);
      if (dList.length > 0) {
        setSelectedDistrictId(dList[0].id);
        const uList = getUpazilasByDistrict(dList[0].id);
        setUpazilas(uList);
        if (uList.length > 0) {
          setSelectedUpazilaId(uList[0].id);
          setUnions(getUnionsByUpazila(uList[0].id));
        }
      }
    } else {
      setDistricts([]);
    }
  };

  // Handle District Selection
  const handleDistrictChange = (distId: string) => {
    setSelectedDistrictId(distId);
    setSelectedUpazilaId("");
    setSelectedUnionId("");
    setUnions([]);

    if (distId) {
      const uList = getUpazilasByDistrict(distId);
      setUpazilas(uList);
      if (uList.length > 0) {
        setSelectedUpazilaId(uList[0].id);
        setUnions(getUnionsByUpazila(uList[0].id));
      }
    } else {
      setUpazilas([]);
    }
  };

  // Handle Upazila Selection
  const handleUpazilaChange = (upzId: string) => {
    setSelectedUpazilaId(upzId);
    setSelectedUnionId("");

    if (upzId) {
      const unList = getUnionsByUpazila(upzId);
      setUnions(unList);
      if (unList.length > 0) {
        setSelectedUnionId(unList[0].id);
      }
    } else {
      setUnions([]);
    }
  };

  // Save current address to localStorage helper
  const saveAddressToStorage = () => {
    try {
      localStorage.setItem(
        LOCAL_STORAGE_KEY,
        JSON.stringify({
          name: customerName,
          phone: customerPhone,
          email: customerEmail,
          divisionId: selectedDivisionId,
          districtId: selectedDistrictId,
          upazilaId: selectedUpazilaId,
          unionId: selectedUnionId,
          streetAddress,
        })
      );
    } catch (e) {}
  };

  const selectedDivision = useMemo(
    () => divisions.find((d) => d.id === selectedDivisionId) || null,
    [divisions, selectedDivisionId]
  );
  const selectedDistrict = useMemo(
    () => districts.find((d) => d.id === selectedDistrictId) || null,
    [districts, selectedDistrictId]
  );
  const selectedUpazila = useMemo(
    () => upazilas.find((u) => u.id === selectedUpazilaId) || null,
    [upazilas, selectedUpazilaId]
  );
  const selectedUnion = useMemo(
    () => unions.find((un) => un.id === selectedUnionId) || null,
    [unions, selectedUnionId]
  );

  // Financial Calculations
  const subtotal = getSubtotal();

  const resolvedDelivery = useMemo(() => {
    return calculateDeliveryCharge(
      {
        divisionId: selectedDivisionId,
        districtId: selectedDistrictId,
        upazilaId: selectedUpazilaId,
        unionId: selectedUnionId,
      },
      logisticsSettings,
      deliveryZones
    );
  }, [selectedDivisionId, selectedDistrictId, selectedUpazilaId, selectedUnionId, logisticsSettings, deliveryZones]);

  const freeThreshold = logisticsSettings.freeDeliveryThreshold ?? 2500;
  const isFreeDelivery = resolvedDelivery.charge === 0 || (freeThreshold > 0 && subtotal >= freeThreshold);
  const effectiveDeliveryFee = isFreeDelivery ? 0 : resolvedDelivery.charge;

  const discountAmount = useMemo(() => {
    if (!appliedCoupon) return 0;
    if (appliedCoupon.type === "fixed") {
      return Math.min(appliedCoupon.value, subtotal);
    }
    if (appliedCoupon.type === "percent") {
      return Math.round((subtotal * appliedCoupon.value) / 100);
    }
    return 0;
  }, [appliedCoupon, subtotal]);

  const grandTotal = Math.max(0, subtotal - discountAmount + effectiveDeliveryFee);

  const { partialAdvanceAmount, partialDueAmount } = useMemo(() => {
    const splits = computePaymentSplits("partial", grandTotal, logisticsSettings);
    return {
      partialAdvanceAmount: splits.advancePaid,
      partialDueAmount: splits.remainingDue,
    };
  }, [grandTotal, logisticsSettings]);

  // Payment methods availability
  const isCodAvailable = logisticsSettings.paymentMethods?.cod !== false;
  const isPartialAvailable = logisticsSettings.paymentMethods?.partial !== false;
  const isFullAvailable = logisticsSettings.paymentMethods?.full !== false;

  // Auto-switch payment method if current is disabled by admin
  useEffect(() => {
    if (paymentMethod === "cod" && !isCodAvailable) {
      if (isPartialAvailable) setPaymentMethod("partial");
      else if (isFullAvailable) setPaymentMethod("bkash");
    } else if (paymentMethod === "partial" && !isPartialAvailable) {
      if (isCodAvailable) setPaymentMethod("cod");
      else if (isFullAvailable) setPaymentMethod("bkash");
    } else if (paymentMethod === "bkash" && !isFullAvailable) {
      if (isCodAvailable) setPaymentMethod("cod");
      else if (isPartialAvailable) setPaymentMethod("partial");
    }
  }, [isCodAvailable, isPartialAvailable, isFullAvailable, paymentMethod]);

  // Google Quick Fill
  const handleGoogleQuickFill = async () => {
    try {
      await signInWithGoogle();
      addToast("Profile details retrieved from Google!", "success");
    } catch (e) {
      addToast("Failed to authenticate with Google", "error");
    }
  };

  // Step 1 -> Step 2 Validation & Transition
  const handleContinueToPayment = (e: React.FormEvent) => {
    e.preventDefault();

    if (!customerName.trim()) {
      addToast("Please enter your full name", "error");
      return;
    }

    const cleanPhone = customerPhone.replace(/\D/g, "");
    if (cleanPhone.length < 11) {
      addToast("Please enter a valid 11-digit Bangladeshi mobile number (017XXXXXXXX)", "error");
      return;
    }

    if (!selectedDivisionId || !selectedDistrictId) {
      addToast("Please select your Division and District", "error");
      return;
    }

    if (!streetAddress.trim()) {
      addToast("Please provide your delivery street address or house details", "error");
      return;
    }

    // Auto-save to LocalStorage
    saveAddressToStorage();

    setCurrentStep(2);
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  // Coupon Code Application
  const handleApplyCoupon = (e: React.FormEvent) => {
    e.preventDefault();
    if (!couponCodeInput.trim()) return;

    setIsApplyingCoupon(true);
    setCouponError("");

    setTimeout(() => {
      const code = couponCodeInput.trim().toUpperCase();
      const matched = INITIAL_COUPONS.find(
        (c) => c.code === code && c.active && (!c.minOrder || subtotal >= c.minOrder)
      );

      if (matched) {
        setAppliedCoupon(matched);
        setCouponCodeInput("");
        addToast(`Coupon "${matched.code}" applied successfully!`, "success");
      } else {
        setCouponError("Invalid or expired coupon code");
        addToast("Invalid or expired coupon code", "error");
      }
      setIsApplyingCoupon(false);
    }, 400);
  };

  // Order Placement
  const handlePlaceOrder = async () => {
    if (isSubmitting) return;

    setIsSubmitting(true);
    saveAddressToStorage();

    try {
      const orderId = `DF-${Date.now()}`;
      const orderNumber = generateOrderNumber();

      const newOrder: any = {
        id: orderId,
        orderNumber,
        userId: user?.uid || null,
        customerName: customerName.trim(),
        customerEmail: customerEmail.trim() || null,
        customerPhone: customerPhone.trim(),
        items: items,
        shippingAddress: {
          name: customerName.trim(),
          phone: customerPhone.trim(),
          divisionId: selectedDivisionId || "6",
          divisionName: selectedDivision?.name || "Dhaka",
          districtId: selectedDistrictId || "47",
          districtName: selectedDistrict?.name || "Dhaka",
          upazilaId: selectedUpazilaId || "103",
          upazilaName: selectedUpazila?.name || "Sadar",
          unionId: selectedUnionId || null,
          unionName: selectedUnion?.name || null,
          streetAddress: streetAddress.trim(),
        },
        deliveryCharge: effectiveDeliveryFee,
        deliveryEstimatedDays: resolvedDelivery.estimatedDays || "2-4 days",
        paymentMethod: paymentMethod,
        paymentStatus: paymentMethod === "cod" ? "cod_pending" : paymentMethod === "partial" ? "partial_paid" : "paid",
        advancePaid: paymentMethod === "partial" ? partialAdvanceAmount : paymentMethod === "bkash" ? grandTotal : 0,
        remainingDue: paymentMethod === "partial" ? partialDueAmount : paymentMethod === "cod" ? grandTotal : 0,
        subtotal,
        discount: discountAmount || 0,
        couponCode: appliedCoupon?.code || null,
        grandTotal,
        status: "pending",
        timeline: [
          {
            status: "pending",
            timestamp: new Date().toISOString(),
            note: "Order placed by customer via web checkout",
          },
        ],
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      };

      // 1. Cache order locally for instantaneous rendering
      if (typeof window !== "undefined") {
        try {
          localStorage.setItem(`order_${orderId}`, JSON.stringify(newOrder));
        } catch (e) {}
      }

      // 2. Persist to Firestore
      try {
        await setDoc(doc(db, "orders", orderId), newOrder);
      } catch (err) {
        console.warn("Firestore offline save fallback:", err);
      }

      // 3. If online bKash payment selected, route through serverless bKash gateway
      if (paymentMethod === "partial" || paymentMethod === "bkash") {
        const payableAmount = paymentMethod === "partial" ? effectiveDeliveryFee : grandTotal;
        try {
          const res = await fetch("/api/bkash/checkout", {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
            },
            body: JSON.stringify({
              amount: payableAmount,
              orderId,
              invoiceNumber: orderNumber,
            }),
          });

          let data: any = {};
          const contentType = res.headers.get("content-type") || "";
          if (contentType.includes("application/json")) {
            data = await res.json();
          } else {
            const rawText = await res.text();
            try {
              data = JSON.parse(rawText);
            } catch {
              throw new Error(
                "bKash Gateway backend requires Cloud Functions (Blaze Plan) or Node.js server. Please select Cash on Delivery to complete your order."
              );
            }
          }

          if (res.ok && data.bkashURL) {
            setIsRedirecting(true);
            window.location.href = data.bkashURL;
            return;
          } else {
            throw new Error(data.error || "Failed to initialize bKash gateway session.");
          }
        } catch (bkashErr: any) {
          console.warn("bKash gateway session error:", bkashErr);
          addToast(bkashErr.message || "Failed to open bKash checkout.", "error");
          setIsSubmitting(false);
          setIsRedirecting(false);
          return;
        }
      }

      // 4. If COD, clear cart and redirect to universal order confirmation receipt
      addToast("Your order has been placed successfully!", "success");
      clearCart();
      router.push(`/order-confirmation?orderId=${orderId}`);
    } catch (err: any) {
      console.error("Order placement error:", err);
      addToast("Failed to place order. Please try again.", "error");
      setIsSubmitting(false);
      setIsRedirecting(false);
    }
  };

  if (!mounted) return null;

  if (isRedirecting) {
    return (
      <div className="pt-32 pb-24 min-h-[65vh] flex flex-col items-center justify-center text-center px-4">
        <div className="w-16 h-16 rounded-2xl bg-white shadow-lg border border-pink-100 flex items-center justify-center p-3 mb-5 animate-pulse">
          <Image src="/only-bkash-icon.svg" alt="bKash" width={44} height={44} className="object-contain" />
        </div>
        <div className="df-spinner df-spinner--dark df-spinner--lg mb-4" />
        <h2 className="font-heading text-lg sm:text-xl font-bold uppercase tracking-wider text-ink-900">
          Redirecting to bKash Payment Portal...
        </h2>
        <p className="text-xs text-ink-500 mt-2 max-w-sm">
          Please wait while we safely open the official bKash secure payment gateway.
        </p>
      </div>
    );
  }

  if (items.length === 0) {
    return (
      <div className="pt-28 pb-20 max-w-xl mx-auto px-4 text-center space-y-3">
        <h1 className="font-heading text-xl sm:text-2xl font-bold uppercase tracking-wider text-ink-900">
          Your Shopping Bag is Empty
        </h1>
        <p className="text-xs text-ink-500">
          Please add items to your bag before proceeding to checkout.
        </p>
        <Link
          href="/shop"
          className="inline-flex items-center gap-2 px-6 py-2.5 bg-ink-900 text-white text-xs font-bold uppercase rounded-lg hover:bg-black transition-colors"
        >
          <span>Explore Catalog</span>
          <ArrowRight className="w-3.5 h-3.5" />
        </Link>
      </div>
    );
  }

  return (
    <div className="pt-[74px] sm:pt-[82px] pb-20 max-w-5xl mx-auto px-3 sm:px-6 lg:px-8">
      {/* Sleek Step Progress Bar */}
      <div className="mb-6 max-w-xl mx-auto">
        <div className="flex items-center justify-between relative">
          {/* Connecting Track */}
          <div className="absolute left-0 right-0 top-1/2 -translate-y-1/2 h-1 bg-line-200 -z-0" />
          <div
            className="absolute left-0 top-1/2 -translate-y-1/2 h-1 bg-ink-900 transition-all duration-500 -z-0"
            style={{ width: currentStep === 1 ? "25%" : "100%" }}
          />

          {/* Step 1 Node */}
          <button
            type="button"
            onClick={() => setCurrentStep(1)}
            className="flex items-center gap-2 bg-white px-2 z-10 group cursor-pointer focus:outline-none"
          >
            <div
              className={cn(
                "w-7 h-7 sm:w-8 sm:h-8 rounded-full flex items-center justify-center text-xs font-bold font-mono transition-all",
                currentStep >= 1
                  ? "bg-ink-900 text-white shadow-xs"
                  : "bg-line-200 text-ink-600"
              )}
            >
              {currentStep === 2 ? <Check className="w-4 h-4 stroke-[3]" /> : "1"}
            </div>
            <div className="text-left hidden sm:block">
              <span className="text-[10px] uppercase font-bold text-ink-400 block leading-tight">
                Step 1
              </span>
              <span className="text-xs font-bold uppercase tracking-wider text-ink-900">
                Shipping & Address
              </span>
            </div>
          </button>

          {/* Step 2 Node */}
          <div className="flex items-center gap-2 bg-white px-2 z-10">
            <div
              className={cn(
                "w-7 h-7 sm:w-8 sm:h-8 rounded-full flex items-center justify-center text-xs font-bold font-mono transition-all",
                currentStep === 2
                  ? "bg-ink-900 text-white shadow-xs ring-4 ring-ink-900/10"
                  : "bg-line-200 text-ink-500"
              )}
            >
              2
            </div>
            <div className="text-left hidden sm:block">
              <span className="text-[10px] uppercase font-bold text-ink-400 block leading-tight">
                Step 2
              </span>
              <span
                className={cn(
                  "text-xs font-bold uppercase tracking-wider",
                  currentStep === 2 ? "text-ink-900" : "text-ink-400"
                )}
              >
                Payment & Review
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* ========================================================================= */}
      {/* STEP 1 VIEW: Customer Info & Bangladesh Cascading Delivery Address        */}
      {/* ========================================================================= */}
      {currentStep === 1 && (
        <form onSubmit={handleContinueToPayment} className="space-y-4 max-w-2xl mx-auto">
          {/* Customer Contact Information */}
          <div className="bg-white border border-line-200 p-4 sm:p-6 rounded-2xl shadow-2xs space-y-3.5">
            <div className="flex flex-wrap items-center justify-between gap-2 pb-2.5 border-b border-line-100">
              <h2 className="text-xs font-bold uppercase tracking-wider text-ink-900 flex items-center gap-2">
                <User className="w-4 h-4 text-ink-900" />
                <span>1. CUSTOMER CONTACT INFORMATION</span>
              </h2>

              {!user && (
                <button
                  type="button"
                  onClick={handleGoogleQuickFill}
                  className="px-2.5 py-1 text-[11px] font-semibold border border-line-200 rounded-lg hover:border-ink-900 transition-colors flex items-center gap-1.5 bg-bg-subtle/60 cursor-pointer"
                >
                  <span className="text-blue-600 font-black">G</span>
                  <span>Google Quick Fill</span>
                </button>
              )}
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
              <div>
                <label className="block font-semibold uppercase text-ink-700 mb-1 text-[11px]">
                  Full Name *
                </label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Asif Mahmud"
                  value={customerName}
                  onChange={(e) => setCustomerName(e.target.value)}
                  className="w-full text-xs p-2.5 bg-bg-subtle border border-line-200 rounded-lg focus:outline-none focus:border-ink-900 font-semibold"
                />
              </div>

              <div>
                <label className="block font-semibold uppercase text-ink-700 mb-1 text-[11px]">
                  Mobile Number (11 Digits) *
                </label>
                <input
                  type="tel"
                  required
                  placeholder="017XXXXXXXX"
                  value={customerPhone}
                  onChange={(e) => setCustomerPhone(e.target.value)}
                  className="w-full text-xs p-2.5 bg-bg-subtle border border-line-200 rounded-lg focus:outline-none focus:border-ink-900 font-mono font-semibold"
                />
              </div>
            </div>
          </div>

          {/* Delivery Address (2 options per row on mobile) */}
          <div className="bg-white border border-line-200 p-4 sm:p-6 rounded-2xl shadow-2xs space-y-3.5">
            <h2 className="text-xs font-bold uppercase tracking-wider text-ink-900 pb-2.5 border-b border-line-100 flex items-center gap-2">
              <MapPin className="w-4 h-4 text-ink-900" />
              <span>2. DELIVERY ADDRESS (BANGLADESH)</span>
            </h2>

            <div className="space-y-3 text-xs">
              {/* Row 1: Division + District */}
              <div className="grid grid-cols-2 gap-2.5 sm:gap-3">
                <div>
                  <label className="block font-semibold uppercase text-ink-700 mb-1 text-[10px] sm:text-[11px]">
                    Division *
                  </label>
                  <select
                    value={selectedDivisionId}
                    onChange={(e) => handleDivisionChange(e.target.value)}
                    className="w-full text-xs p-2.5 bg-bg-subtle border border-line-200 rounded-lg focus:outline-none focus:border-ink-900 cursor-pointer"
                  >
                    <option value="">Select Division</option>
                    {divisions.map((div) => (
                      <option key={div.id} value={div.id}>
                        {div.name}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block font-semibold uppercase text-ink-700 mb-1 text-[10px] sm:text-[11px]">
                    District *
                  </label>
                  <select
                    disabled={!selectedDivisionId}
                    value={selectedDistrictId}
                    onChange={(e) => handleDistrictChange(e.target.value)}
                    className={cn(
                      "w-full text-xs p-2.5 bg-bg-subtle border border-line-200 rounded-lg focus:outline-none focus:border-ink-900 cursor-pointer",
                      !selectedDivisionId && "opacity-50"
                    )}
                  >
                    <option value="">{selectedDivisionId ? "Select District" : "Division First"}</option>
                    {districts.map((dist) => (
                      <option key={dist.id} value={dist.id}>
                        {dist.name}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              {/* Row 2: Upazila/Thana + Union/Area */}
              <div className="grid grid-cols-2 gap-2.5 sm:gap-3">
                <div>
                  <label className="block font-semibold uppercase text-ink-700 mb-1 text-[10px] sm:text-[11px]">
                    Upazila / Thana *
                  </label>
                  <select
                    disabled={!selectedDistrictId}
                    value={selectedUpazilaId}
                    onChange={(e) => handleUpazilaChange(e.target.value)}
                    className={cn(
                      "w-full text-xs p-2.5 bg-bg-subtle border border-line-200 rounded-lg focus:outline-none focus:border-ink-900 cursor-pointer",
                      !selectedDistrictId && "opacity-50"
                    )}
                  >
                    <option value="">{selectedDistrictId ? "Select Upazila" : "District First"}</option>
                    {upazilas.map((upz) => (
                      <option key={upz.id} value={upz.id}>
                        {upz.name}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block font-semibold uppercase text-ink-700 mb-1 text-[10px] sm:text-[11px]">
                    Area / Union (Opt)
                  </label>
                  <select
                    disabled={!selectedUpazilaId || unions.length === 0}
                    value={selectedUnionId}
                    onChange={(e) => setSelectedUnionId(e.target.value)}
                    className={cn(
                      "w-full text-xs p-2.5 bg-bg-subtle border border-line-200 rounded-lg focus:outline-none focus:border-ink-900 cursor-pointer",
                      (!selectedUpazilaId || unions.length === 0) && "opacity-50"
                    )}
                  >
                    <option value="">{unions.length > 0 ? "Select Area" : "All Areas"}</option>
                    {unions.map((un) => (
                      <option key={un.id} value={un.id}>
                        {un.name}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              {/* Row 3: House / Road Details */}
              <div>
                <label className="block font-semibold uppercase text-ink-700 mb-1 text-[11px]">
                  House / Road / Flat Details *
                </label>
                <input
                  type="text"
                  required
                  placeholder="e.g. House 14, Road 5, Block B, Dhanmondi"
                  value={streetAddress}
                  onChange={(e) => setStreetAddress(e.target.value)}
                  className="w-full text-xs p-2.5 bg-bg-subtle border border-line-200 rounded-lg focus:outline-none focus:border-ink-900"
                />
              </div>

              {/* Delivery Note */}
              <div>
                <label className="block font-semibold uppercase text-ink-700 mb-1 text-[11px]">
                  Special Delivery Instructions (Optional)
                </label>
                <input
                  type="text"
                  placeholder="e.g. Call before delivery, deliver after 3 PM"
                  value={deliveryNote}
                  onChange={(e) => setDeliveryNote(e.target.value)}
                  className="w-full text-xs p-2.5 bg-bg-subtle border border-line-200 rounded-lg focus:outline-none focus:border-ink-900"
                />
              </div>
            </div>

            {/* Delivery Charge summary pill */}
            <div className="p-3 bg-bg-subtle border border-line-200 rounded-xl flex items-center justify-between text-xs">
              <div className="flex items-center gap-2">
                <Truck className="w-4 h-4 text-ink-700" />
                <span>
                  <strong>{selectedDistrict?.name || "Dhaka"} Delivery:</strong> {resolvedDelivery.estimatedDays}
                </span>
              </div>
              <span className="font-bold text-ink-900 font-sans">
                {isFreeDelivery ? "FREE" : formatPrice(effectiveDeliveryFee)}
              </span>
            </div>
          </div>

          {/* Continue Button */}
          <button
            type="submit"
            className="w-full py-3 bg-[#0E0E0E] hover:bg-black text-white text-xs font-bold uppercase tracking-wider rounded-xl flex items-center justify-center gap-2 transition-all shadow-md active:scale-[0.99] cursor-pointer"
          >
            <span>Continue to Payment</span>
            <ArrowRight className="w-4 h-4" />
          </button>
        </form>
      )}

      {/* ========================================================================= */}
      {/* STEP 2 VIEW: Payment Method, Order Summary, Coupon & Place Order           */}
      {/* ========================================================================= */}
      {currentStep === 2 && (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-4 sm:gap-6 items-start">
          {/* LEFT: Shipping Summary & Payment Options */}
          <div className="lg:col-span-7 space-y-3.5">
            {/* Address Summary with Edit Button */}
            <div className="bg-white border border-line-200 p-3.5 rounded-xl shadow-2xs flex items-center justify-between">
              <div className="text-xs space-y-0.5">
                <div className="flex items-center gap-2">
                  <span className="font-bold text-ink-900 uppercase">{customerName}</span>
                  <span className="text-ink-500 font-mono font-semibold">({customerPhone})</span>
                </div>
                <p className="text-ink-600 text-[11px] leading-tight">
                  {streetAddress}, {selectedUpazila?.name}, {selectedDistrict?.name}, {selectedDivision?.name}
                </p>
              </div>

              <button
                type="button"
                onClick={() => setCurrentStep(1)}
                className="px-3 py-1.5 bg-bg-subtle hover:bg-line-200 text-ink-900 rounded-lg text-xs font-bold uppercase flex items-center gap-1.5 transition-colors cursor-pointer"
              >
                <Edit3 className="w-3.5 h-3.5" />
                <span>Edit</span>
              </button>
            </div>

            {/* Payment Method Cards (Compact, Sleek, Low-Height Rows) */}
            <div className="bg-white border border-line-200 p-4 sm:p-5 rounded-xl shadow-2xs space-y-3">
              <h2 className="text-xs font-bold uppercase tracking-wider text-ink-900 pb-2 border-b border-line-100">
                CHOOSE PAYMENT METHOD
              </h2>

              <div className="space-y-2.5">
                {/* Option 1: Cash On Delivery */}
                {isCodAvailable && (
                  <label
                    className={cn(
                      "flex items-center gap-3 py-2.5 sm:py-3 px-3.5 sm:px-4 rounded-xl border-2 transition-all cursor-pointer select-none",
                      paymentMethod === "cod"
                        ? "border-ink-900 bg-bg-subtle/80 shadow-2xs ring-1 ring-ink-900/10"
                        : "border-line-200 hover:border-ink-400 bg-white"
                    )}
                  >
                    <input
                      type="radio"
                      name="payment"
                      value="cod"
                      checked={paymentMethod === "cod"}
                      onChange={() => setPaymentMethod("cod")}
                      className="w-4 h-4 accent-ink-900 flex-shrink-0 cursor-pointer"
                    />
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between gap-2">
                        <div className="flex items-center gap-2.5">
                          <img
                            src="/images/payments/cod.png"
                            alt="Cash On Delivery"
                            className="h-6 sm:h-7 w-auto object-contain flex-shrink-0"
                          />
                          <span className="text-xs sm:text-sm font-bold uppercase text-ink-900">
                            {logisticsSettings.paymentTitles?.cod || "Cash On Delivery"}
                          </span>
                        </div>
                        <span className="text-xs sm:text-sm font-bold text-ink-900 font-sans flex-shrink-0">
                          {formatPrice(grandTotal)}
                        </span>
                      </div>
                      <p className="text-[10px] sm:text-[11px] text-ink-500 mt-0.5">
                        {logisticsSettings.paymentTitles?.codSub || "Pay total cash upon receiving parcel."}
                      </p>
                    </div>
                  </label>
                )}

                {/* Option 2: Pay Delivery Charge */}
                {isPartialAvailable && (
                  <label
                    className={cn(
                      "flex items-center gap-3 py-2.5 sm:py-3 px-3.5 sm:px-4 rounded-xl border-2 transition-all cursor-pointer select-none",
                      paymentMethod === "partial"
                        ? "border-accent-gold bg-amber-50/40 shadow-2xs ring-1 ring-accent-gold/20"
                        : "border-line-200 hover:border-amber-400 bg-white"
                    )}
                  >
                    <input
                      type="radio"
                      name="payment"
                      value="partial"
                      checked={paymentMethod === "partial"}
                      onChange={() => setPaymentMethod("partial")}
                      className="w-4 h-4 accent-accent-gold flex-shrink-0 cursor-pointer"
                    />
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between gap-2">
                        <div className="flex items-center gap-2.5">
                          <img
                            src="/images/payments/only-bkash-icon.svg"
                            alt="bKash"
                            className="h-6 sm:h-7 w-auto object-contain flex-shrink-0"
                          />
                          <span className="text-xs sm:text-sm font-bold uppercase text-amber-950">
                            {logisticsSettings.paymentTitles?.partial || "Pay Delivery Charge (Advance)"}
                          </span>
                        </div>
                        <span className="text-xs sm:text-sm font-bold text-amber-900 font-sans flex-shrink-0">
                          {formatPrice(effectiveDeliveryFee)}
                        </span>
                      </div>
                      <p className="text-[10px] sm:text-[11px] text-ink-600 mt-0.5">
                        {logisticsSettings.paymentTitles?.partialSub || `Pay delivery fee now via bKash, remaining ${formatPrice(subtotal - discountAmount)} on delivery.`}
                      </p>
                    </div>
                  </label>
                )}

                {/* Option 3: Full Payment */}
                {isFullAvailable && (
                  <label
                    className={cn(
                      "flex items-center gap-3 py-2.5 sm:py-3 px-3.5 sm:px-4 rounded-xl border-2 transition-all cursor-pointer select-none",
                      paymentMethod === "bkash"
                        ? "border-pink-600 bg-pink-50/40 shadow-2xs ring-1 ring-pink-600/20"
                        : "border-line-200 hover:border-pink-300 bg-white"
                    )}
                  >
                    <input
                      type="radio"
                      name="payment"
                      value="bkash"
                      checked={paymentMethod === "bkash"}
                      onChange={() => setPaymentMethod("bkash")}
                      className="w-4 h-4 accent-pink-600 flex-shrink-0 cursor-pointer"
                    />
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between gap-2">
                        <div className="flex items-center gap-2.5">
                          <img
                            src="/images/payments/bkash.svg"
                            alt="bKash"
                            className="h-6 sm:h-7 w-auto object-contain flex-shrink-0"
                          />
                          <span className="text-xs sm:text-sm font-bold uppercase text-pink-700">
                            {logisticsSettings.paymentTitles?.bkash || "Full bKash Payment"}
                          </span>
                        </div>
                        <span className="text-xs sm:text-sm font-bold text-pink-700 font-sans flex-shrink-0">
                          {formatPrice(grandTotal)}
                        </span>
                      </div>
                      <p className="text-[10px] sm:text-[11px] text-ink-600 mt-0.5">
                        {logisticsSettings.paymentTitles?.bkashSub || "Pay complete total via bKash for priority dispatch."}
                      </p>
                    </div>
                  </label>
                )}

                {/* Fallback if all methods disabled */}
                {!isCodAvailable && !isPartialAvailable && !isFullAvailable && (
                  <div className="p-3 bg-amber-50 border border-amber-200 text-amber-900 rounded-xl text-xs font-semibold">
                    Payment methods are undergoing maintenance. Please contact hotline to complete your order.
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* RIGHT: Order Summary & Action Pay Button */}
          <div className="lg:col-span-5 space-y-4">
            <div className="bg-white border border-line-200 p-4 sm:p-6 rounded-2xl shadow-2xs space-y-4">
              <h2 className="text-xs font-bold uppercase tracking-wider text-ink-900 pb-2.5 border-b border-line-100">
                ORDER SUMMARY ({items.length} {items.length === 1 ? "ITEM" : "ITEMS"})
              </h2>

              {/* Items List */}
              <div className="divide-y divide-line-100 max-h-60 overflow-y-auto pr-1">
                {items.map((item) => (
                  <div key={item.variantSku} className="py-2.5 flex items-center gap-3">
                    <div className="relative w-12 h-14 rounded-lg overflow-hidden bg-bg-subtle flex-shrink-0 border border-line-200">
                      <Image src={item.image} alt={item.title} fill className="object-cover object-top" />
                    </div>

                    <div className="flex-1 min-w-0 text-xs">
                      <h4 className="font-semibold text-ink-900 truncate uppercase">{item.title}</h4>
                      <p className="text-[11px] text-ink-500 flex items-center gap-2 mt-0.5">
                        <span>Size: {item.size}</span>
                        <span>•</span>
                        <span>Qty: {item.quantity}</span>
                      </p>
                    </div>

                    <span className="font-bold text-xs text-ink-900 font-sans">
                      {formatPrice(item.price * item.quantity)}
                    </span>
                  </div>
                ))}
              </div>

              {/* Coupon Code Input */}
              <div className="pt-2 border-t border-line-100">
                {appliedCoupon ? (
                  <div className="p-2.5 bg-df-success-soft border border-df-success/30 rounded-xl flex items-center justify-between text-xs">
                    <div className="flex items-center gap-1.5">
                      <Sparkles className="w-3.5 h-3.5 text-df-success" />
                      <span className="font-bold text-df-success uppercase">
                        {appliedCoupon.code} (-{appliedCoupon.type === "fixed" ? formatPrice(appliedCoupon.value) : `${appliedCoupon.value}%`})
                      </span>
                    </div>
                    <button
                      type="button"
                      onClick={() => setAppliedCoupon(null)}
                      className="text-[10px] text-accent-red font-bold uppercase hover:underline cursor-pointer"
                    >
                      Remove
                    </button>
                  </div>
                ) : (
                  <form onSubmit={handleApplyCoupon} className="flex gap-2">
                    <input
                      type="text"
                      placeholder="Coupon Code"
                      value={couponCodeInput}
                      onChange={(e) => setCouponCodeInput(e.target.value.toUpperCase())}
                      className="flex-1 text-xs p-2 bg-bg-subtle border border-line-200 rounded-lg uppercase font-mono font-semibold"
                    />
                    <button
                      type="submit"
                      disabled={isApplyingCoupon}
                      className="px-4 py-2 bg-ink-900 text-white text-xs font-bold uppercase rounded-lg hover:bg-black transition-colors cursor-pointer"
                    >
                      {isApplyingCoupon ? "..." : "Apply"}
                    </button>
                  </form>
                )}
                {couponError && <p className="text-[10px] text-accent-red mt-1">{couponError}</p>}
              </div>

              {/* Financial Breakdown */}
              <div className="pt-2 border-t border-line-100 space-y-2 text-xs">
                <div className="flex justify-between text-ink-600">
                  <span>Subtotal</span>
                  <span className="font-semibold text-ink-900 font-sans">{formatPrice(subtotal)}</span>
                </div>

                {discountAmount > 0 && (
                  <div className="flex justify-between text-accent-red font-medium">
                    <span>Discount</span>
                    <span className="font-sans">-{formatPrice(discountAmount)}</span>
                  </div>
                )}

                <div className="flex justify-between text-ink-600">
                  <span>Delivery Charge</span>
                  <span className="font-semibold text-ink-900 font-sans">
                    {isFreeDelivery ? "FREE" : formatPrice(effectiveDeliveryFee)}
                  </span>
                </div>

                <div className="pt-2 border-t border-line-200 flex justify-between text-sm font-bold text-ink-900">
                  <span>Grand Total</span>
                  <span className="font-sans text-base text-accent-red">{formatPrice(grandTotal)}</span>
                </div>
              </div>

              {/* Security PoW Anti-DDoS Verification */}
              <AltchaWidget autoVerify={true} />

              {/* Action Buttons */}
              <div className="pt-2 space-y-2">
                <button
                  type="button"
                  onClick={handlePlaceOrder}
                  disabled={isSubmitting}
                  className="w-full py-3.5 bg-[#FFB900] hover:bg-[#E5A700] text-black text-xs font-black uppercase tracking-wider rounded-xl flex items-center justify-center gap-2 transition-all shadow-md active:scale-95 cursor-pointer"
                >
                  {isSubmitting ? (
                    <div className="flex items-center gap-2">
                      <span className="df-spinner df-spinner--dark df-spinner--sm" />
                      <span>Processing Order...</span>
                    </div>
                  ) : (
                    <span>Confirm Order</span>
                  )}
                </button>

                <button
                  type="button"
                  onClick={() => setCurrentStep(1)}
                  className="w-full py-2 bg-transparent text-ink-600 hover:text-ink-900 text-xs font-semibold uppercase flex items-center justify-center gap-1 cursor-pointer transition-colors"
                >
                  <ChevronLeft className="w-3.5 h-3.5" />
                  <span>Back to Shipping Address</span>
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
