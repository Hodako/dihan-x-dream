"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { User, Package, MapPin, LogOut, ArrowRight, CheckCircle2, AlertCircle } from "lucide-react";
import { useAuthStore } from "@/store/useAuthStore";
import { useUIStore } from "@/store/useUIStore";
import { Order } from "@/types";
import { formatPrice } from "@/lib/utils";

export default function AccountPage() {
  const { user, profile, loading, signInWithGoogle, signOut } = useAuthStore();
  const { addToast } = useUIStore();

  const [activeTab, setActiveTab] = useState<"orders" | "addresses" | "profile">("orders");
  const [recentOrders, setRecentOrders] = useState<Order[]>([]);
  const [isSigningIn, setIsSigningIn] = useState(false);

  useEffect(() => {
    if (typeof window !== "undefined") {
      const orders = JSON.parse(localStorage.getItem("recent_orders") || "[]");
      setRecentOrders(orders);
    }
  }, []);

  const handleGoogleSignIn = async () => {
    setIsSigningIn(true);
    const result = await signInWithGoogle();
    setIsSigningIn(false);
    if (result.success) {
      addToast("Successfully signed in with Google!", "success");
    } else {
      addToast(result.error || "Failed to sign in with Google", "error");
    }
  };

  return (
    <div className="pt-[106px] sm:pt-[124px] pb-20 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 min-h-[70vh]">
      <div className="border-b border-line-100 pb-6 mb-8 flex flex-col sm:flex-row sm:items-end justify-between gap-4">
        <div>
          <span className="text-[10px] sm:text-[11px] font-bold tracking-[0.2em] uppercase text-ink-500 block">
            MY ACCOUNT
          </span>
          <h1 className="font-heading text-2xl sm:text-3xl font-bold tracking-[0.08em] uppercase text-ink-900 mt-1">
            {profile ? `Welcome, ${profile.name}` : "Customer Portal"}
          </h1>
        </div>

        {profile && (
          <div className="flex items-center gap-3">
            <button
              onClick={() => {
                signOut();
                addToast("Signed out successfully", "info");
              }}
              className="px-4 py-2 bg-bg-subtle border border-line-200 text-xs font-semibold uppercase tracking-wider text-ink-700 hover:text-ink-900 rounded-sm flex items-center gap-1.5 transition-colors"
            >
              <LogOut className="w-3.5 h-3.5" />
              <span>Sign Out</span>
            </button>
          </div>
        )}
      </div>

      {!profile ? (
        /* Sign In / Sign Up Card with Google Firebase OAuth */
        <div className="max-w-md mx-auto bg-white border border-line-200 p-6 sm:p-8 rounded-xl shadow-xs space-y-6">
          <div className="text-center space-y-1.5">
            <h2 className="font-heading text-xl sm:text-2xl font-bold uppercase tracking-wider text-ink-900">
              Sign In to Dream Fashion
            </h2>
            <p className="text-xs text-ink-500 leading-relaxed">
              Track your orders live, save delivery addresses, and manage your fashion wishlist.
            </p>
          </div>

          {/* Official Google OAuth Sign In Button */}
          <div className="space-y-4 pt-2">
            <button
              onClick={handleGoogleSignIn}
              disabled={isSigningIn}
              className="w-full py-3.5 px-4 bg-white hover:bg-bg-subtle border border-line-200 hover:border-ink-900 rounded-lg text-xs font-bold uppercase tracking-wider text-ink-900 transition-all flex items-center justify-center gap-3 shadow-xs active:scale-[0.99] disabled:opacity-70"
            >
              {isSigningIn ? (
                <span className="df-spinner df-spinner--dark df-spinner--sm" />
              ) : (
                <>
                  {/* Google SVG Logo */}
                  <svg className="w-4 h-4" viewBox="0 0 24 24">
                    <path
                      fill="#4285F4"
                      d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
                    />
                    <path
                      fill="#34A853"
                      d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                    />
                    <path
                      fill="#FBBC05"
                      d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z"
                    />
                    <path
                      fill="#EA4335"
                      d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z"
                    />
                  </svg>
                  <span>CONTINUE WITH GOOGLE</span>
                </>
              )}
            </button>

            <div className="p-4 bg-bg-subtle rounded-lg text-center text-[11px] text-ink-500 leading-relaxed">
              Safe & Instant login. We never share your personal information.
            </div>
          </div>
        </div>
      ) : (
        /* Logged-In User Profile & Tabs */
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
          {/* Navigation Sidebar (3 cols) */}
          <div className="lg:col-span-3 space-y-1 bg-bg-subtle p-3 rounded-xl border border-line-100">
            {/* User Badge */}
            <div className="p-3 mb-2 flex items-center gap-3 border-b border-line-100 pb-4">
              {user?.photoURL ? (
                <img
                  src={user.photoURL}
                  alt={profile.name}
                  className="w-10 h-10 rounded-full object-cover border border-line-200"
                />
              ) : (
                <div className="w-10 h-10 rounded-full bg-ink-900 text-white flex items-center justify-center font-bold text-sm">
                  {profile.name.charAt(0)}
                </div>
              )}
              <div className="overflow-hidden">
                <p className="font-bold text-xs text-ink-900 truncate">{profile.name}</p>
                <p className="text-[10px] text-ink-500 truncate">{profile.email}</p>
              </div>
            </div>

            <button
              onClick={() => setActiveTab("orders")}
              className={`w-full text-left px-4 py-3 text-xs font-semibold uppercase tracking-wider rounded-lg flex items-center gap-2.5 transition-colors ${
                activeTab === "orders" ? "bg-white text-ink-900 shadow-xs border border-line-200" : "text-ink-600 hover:text-ink-900"
              }`}
            >
              <Package className="w-4 h-4" />
              <span>Orders ({recentOrders.length})</span>
            </button>

            <button
              onClick={() => setActiveTab("addresses")}
              className={`w-full text-left px-4 py-3 text-xs font-semibold uppercase tracking-wider rounded-lg flex items-center gap-2.5 transition-colors ${
                activeTab === "addresses" ? "bg-white text-ink-900 shadow-xs border border-line-200" : "text-ink-600 hover:text-ink-900"
              }`}
            >
              <MapPin className="w-4 h-4" />
              <span>Saved Addresses</span>
            </button>

            <button
              onClick={() => setActiveTab("profile")}
              className={`w-full text-left px-4 py-3 text-xs font-semibold uppercase tracking-wider rounded-lg flex items-center gap-2.5 transition-colors ${
                activeTab === "profile" ? "bg-white text-ink-900 shadow-xs border border-line-200" : "text-ink-600 hover:text-ink-900"
              }`}
            >
              <User className="w-4 h-4" />
              <span>Profile Info</span>
            </button>
          </div>

          {/* Tab Content (9 cols) */}
          <div className="lg:col-span-9 bg-white border border-line-200 p-6 sm:p-8 rounded-xl shadow-xs">
            {activeTab === "orders" && (
              <div className="space-y-6">
                <h3 className="text-xs font-bold uppercase tracking-wider text-ink-900 pb-3 border-b border-line-100">
                  MY ORDER HISTORY
                </h3>

                {recentOrders.length === 0 ? (
                  <div className="text-center py-12 text-xs text-ink-500 space-y-3">
                    <Package className="w-10 h-10 mx-auto text-ink-300 stroke-[1.2]" />
                    <p className="uppercase font-semibold text-ink-900">No orders placed yet</p>
                    <Link
                      href="/shop"
                      className="inline-block mt-2 px-6 py-2.5 bg-ink-900 text-white text-xs font-semibold uppercase tracking-wider rounded-sm"
                    >
                      Start Shopping
                    </Link>
                  </div>
                ) : (
                  <div className="space-y-4">
                    {recentOrders.map((ord) => (
                      <div key={ord.id} className="p-5 border border-line-200 bg-bg-subtle/40 rounded-lg space-y-3">
                        <div className="flex flex-wrap items-center justify-between gap-2">
                          <div>
                            <span className="font-mono font-bold text-xs text-ink-900">
                              {ord.orderNumber}
                            </span>
                            <span className="text-[11px] text-ink-400 block">
                              Placed on {new Date(ord.createdAt).toLocaleDateString("en-BD")}
                            </span>
                          </div>

                          <div className="flex items-center gap-2">
                            <span className="px-2.5 py-1 bg-white border border-line-200 rounded text-[10px] font-bold uppercase tracking-wider text-ink-900">
                              Status: {ord.status}
                            </span>
                            <span className="font-bold text-xs text-ink-900 font-mono">
                              {formatPrice(ord.grandTotal)}
                            </span>
                          </div>
                        </div>

                        <div className="pt-2 border-t border-line-100 flex items-center justify-between text-xs">
                          <span className="text-ink-500">
                            {ord.shippingAddress.upazilaName}, {ord.shippingAddress.districtName}
                          </span>
                          <Link
                            href={`/track-order?id=${ord.orderNumber}`}
                            className="text-ink-900 font-semibold underline uppercase text-[11px] hover:text-ink-500"
                          >
                            Track Shipment →
                          </Link>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}

            {activeTab === "addresses" && (
              <div className="space-y-4">
                <h3 className="text-xs font-bold uppercase tracking-wider text-ink-900 pb-3 border-b border-line-100">
                  SAVED ADDRESSES
                </h3>
                <div className="p-4 border border-line-200 bg-bg-subtle rounded-lg space-y-1 text-xs">
                  <div className="flex items-center gap-2">
                    <strong className="text-ink-900 font-semibold">{profile.name}</strong>
                    <span className="px-2 py-0.5 bg-ink-900 text-white text-[9px] font-bold uppercase rounded">
                      Default
                    </span>
                  </div>
                  <p className="text-ink-600">House 12, Road 11, Block D, Banani</p>
                  <p className="text-ink-600">Dhaka, Bangladesh - 1213</p>
                  <p className="text-ink-900 font-mono pt-1">Phone: {profile.phone || "017XXXXXXXX"}</p>
                </div>
              </div>
            )}

            {activeTab === "profile" && (
              <div className="space-y-4 max-w-md">
                <h3 className="text-xs font-bold uppercase tracking-wider text-ink-900 pb-3 border-b border-line-100">
                  PROFILE DETAILS
                </h3>
                <div className="space-y-3 text-xs">
                  <div>
                    <label className="text-ink-500 uppercase text-[10px] block">Full Name</label>
                    <p className="font-semibold text-ink-900 mt-0.5">{profile.name}</p>
                  </div>
                  <div>
                    <label className="text-ink-500 uppercase text-[10px] block">Email Address</label>
                    <p className="font-semibold text-ink-900 mt-0.5">{profile.email}</p>
                  </div>
                  <div>
                    <label className="text-ink-500 uppercase text-[10px] block">Account Status</label>
                    <p className="text-df-success font-semibold flex items-center gap-1 mt-0.5">
                      <CheckCircle2 className="w-3.5 h-3.5" /> Verified Customer Account
                    </p>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
