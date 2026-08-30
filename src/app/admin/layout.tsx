"use client";

import { useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  LayoutDashboard,
  ShoppingBag,
  Package,
  Truck,
  Image as ImageIcon,
  Tag,
  Star,
  Users,
  Settings,
  Bell,
  Search,
  ExternalLink,
  ShieldCheck,
  ShieldAlert,
  Menu,
  X,
  Database,
  Layers,
  Sparkles,
  Palette,
  Lock,
  LogOut,
  ArrowRight,
} from "lucide-react";
import { useAuthStore } from "@/store/useAuthStore";
import { useUIStore } from "@/store/useUIStore";
import { seedFirestoreDatabase } from "@/lib/seedData";
import { cn } from "@/lib/utils";

export default function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const pathname = usePathname();
  const { user, profile, isAdmin, loading, signInWithGoogle, signInWithEmail, signOut } = useAuthStore();
  const { addToast } = useUIStore();

  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [isSeeding, setIsSeeding] = useState(false);

  // Admin Login Gate state
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [isLoggingIn, setIsLoggingIn] = useState(false);
  const [loginError, setLoginError] = useState("");

  const navItems = [
    { label: "Dashboard", href: "/admin", icon: LayoutDashboard },
    { label: "Products", href: "/admin/products", icon: ShoppingBag },
    { label: "Categories & Nav", href: "/admin/categories", icon: Layers },
    { label: "Orders", href: "/admin/orders", icon: Package },
    { label: "Delivery & Logistics", href: "/admin/logistics", icon: Truck },
    { label: "Banners & Lookbook", href: "/admin/banners", icon: ImageIcon },
    { label: "Coupons", href: "/admin/coupons", icon: Tag },
    { label: "Lucky Spinner", href: "/admin/spinner", icon: Sparkles },
    { label: "Theme & UI", href: "/admin/theme", icon: Palette },
    { label: "Reviews", href: "/admin/reviews", icon: Star },
    { label: "Users & Access", href: "/admin/users", icon: Users },
  ];

  const handleSeedDatabase = async () => {
    setIsSeeding(true);
    addToast("Seeding Firestore catalog & settings...", "info");
    const res = await seedFirestoreDatabase();
    setIsSeeding(false);
    if (res.success) {
      addToast(res.message, "success");
    } else {
      addToast(res.message, "error");
    }
  };

  const handleEmailLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email.trim() || !password.trim()) return;

    setIsLoggingIn(true);
    setLoginError("");

    const res = await signInWithEmail(email.trim(), password);
    setIsLoggingIn(false);

    if (!res.success) {
      setLoginError(res.error || "Invalid credentials");
    } else {
      addToast("Signed in successfully!", "success");
    }
  };

  const handleGoogleLogin = async () => {
    setIsLoggingIn(true);
    setLoginError("");
    const res = await signInWithGoogle();
    setIsLoggingIn(false);
    if (!res.success) {
      setLoginError(res.error || "Google authentication failed");
    } else {
      addToast("Signed in via Google!", "success");
    }
  };

  // 1. Loading State
  if (loading) {
    return (
      <div className="min-h-screen bg-[#0E0E0E] flex flex-col items-center justify-center p-4 text-white">
        <div className="w-10 h-10 border-3 border-amber-400 border-t-transparent rounded-full animate-spin mb-4" />
        <p className="font-mono text-xs uppercase tracking-widest text-gray-400">
          Authenticating Secure Admin Session...
        </p>
      </div>
    );
  }

  // 2. Strict Authorization Gate (Blocks unauthorized users)
  if (!isAdmin) {
    return (
      <div className="min-h-screen bg-[#0A0A0A] flex items-center justify-center p-4 selection:bg-amber-400 selection:text-black">
        <div className="w-full max-w-md bg-[#141414] border border-white/10 rounded-2xl p-6 sm:p-8 shadow-2xl space-y-6 text-white text-xs">
          {/* Lock Icon & Title */}
          <div className="text-center space-y-2">
            <div className="w-12 h-12 rounded-full bg-amber-400/10 border border-amber-400/30 text-amber-400 flex items-center justify-center mx-auto shadow-lg">
              <Lock className="w-6 h-6" />
            </div>
            <h1 className="font-heading text-xl font-bold uppercase tracking-wider text-white">
              ADMIN CONTROL PORTAL
            </h1>
            <p className="text-gray-400 text-xs">
              Restricted Area. Authorized administrator access required.
            </p>
          </div>

          {/* If Logged in as non-admin customer */}
          {user && !isAdmin ? (
            <div className="p-4 rounded-xl bg-red-500/10 border border-red-500/30 text-red-300 space-y-3">
              <div className="flex items-center gap-2">
                <ShieldAlert className="w-5 h-5 text-red-400 shrink-0" />
                <span className="font-bold uppercase text-[11px]">Access Denied</span>
              </div>
              <p className="text-[11px] text-gray-300 leading-relaxed">
                Logged in as <strong className="text-white">{user.email}</strong>. This account does not have administrator privileges.
              </p>
              <div className="flex gap-2 pt-1">
                <button
                  type="button"
                  onClick={signOut}
                  className="w-full py-2 bg-red-600 hover:bg-red-700 text-white rounded font-bold uppercase tracking-wider transition-colors cursor-pointer"
                >
                  Sign Out & Switch Account
                </button>
              </div>
            </div>
          ) : (
            <>
              {/* Error Box */}
              {loginError && (
                <div className="p-3 bg-red-500/10 border border-red-500/30 text-red-400 rounded-lg text-xs">
                  {loginError}
                </div>
              )}

              {/* Email & Password Login Form */}
              <form onSubmit={handleEmailLogin} className="space-y-4">
                <div>
                  <label className="block font-bold uppercase text-gray-400 text-[11px] mb-1">
                    Admin Email Address
                  </label>
                  <input
                    type="email"
                    required
                    placeholder="admin@dreamfashionbd.com"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className="w-full p-3 bg-white/5 border border-white/10 rounded-lg text-white font-medium focus:outline-none focus:border-amber-400"
                  />
                </div>

                <div>
                  <label className="block font-bold uppercase text-gray-400 text-[11px] mb-1">
                    Password
                  </label>
                  <input
                    type="password"
                    required
                    placeholder="••••••••"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    className="w-full p-3 bg-white/5 border border-white/10 rounded-lg text-white font-medium focus:outline-none focus:border-amber-400"
                  />
                </div>

                <button
                  type="submit"
                  disabled={isLoggingIn}
                  className="w-full py-3 bg-gradient-to-r from-amber-400 to-yellow-600 hover:brightness-110 text-black font-black uppercase tracking-wider rounded-lg transition-all shadow-md active:scale-[0.99] cursor-pointer"
                >
                  {isLoggingIn ? "Verifying..." : "Sign In to Admin Panel"}
                </button>
              </form>

              {/* Google OAuth Button */}
              <div className="relative flex items-center justify-center">
                <div className="border-t border-white/10 w-full" />
                <span className="bg-[#141414] px-2 text-[10px] uppercase text-gray-500 font-bold shrink-0">
                  Or continue with
                </span>
                <div className="border-t border-white/10 w-full" />
              </div>

              <button
                type="button"
                onClick={handleGoogleLogin}
                disabled={isLoggingIn}
                className="w-full py-2.5 bg-white/5 hover:bg-white/10 text-white rounded-lg border border-white/10 font-bold uppercase flex items-center justify-center gap-2 transition-colors cursor-pointer"
              >
                <span>Google Authorized Login</span>
              </button>
            </>
          )}

          <div className="text-center pt-2 border-t border-white/10">
            <Link href="/" className="text-gray-400 hover:text-white text-[11px] uppercase font-bold tracking-wider inline-flex items-center gap-1">
              ← Return to Storefront
            </Link>
          </div>
        </div>
      </div>
    );
  }

  // 3. Authorized Admin UI View
  return (
    <div className="min-h-screen bg-admin-canvas flex font-sans antialiased text-admin-text-primary-light selection:bg-admin-accent selection:text-white">
      {/* Sidebar Desktop */}
      <aside className="hidden lg:flex flex-col w-64 bg-admin-bg border-r border-admin-border text-admin-text-secondary flex-shrink-0 z-30">
        {/* Brand Header */}
        <div className="h-16 px-6 flex items-center justify-between border-b border-admin-border">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded bg-admin-accent flex items-center justify-center text-white font-bold text-sm">
              DF
            </div>
            <div>
              <span className="font-bold text-sm tracking-wider text-admin-text-primary block">
                DREAM ADMIN
              </span>
              <span className="text-[10px] text-admin-text-secondary tracking-widest block uppercase">
                Control Center
              </span>
            </div>
          </div>
        </div>

        {/* Navigation Items */}
        <nav className="flex-1 px-4 py-6 space-y-1.5 overflow-y-auto">
          {navItems.map((item) => {
            const Icon = item.icon;
            const isActive = pathname === item.href;

            return (
              <Link
                key={item.href}
                href={item.href}
                className={cn(
                  "flex items-center gap-3 px-3.5 py-2.5 rounded text-xs font-semibold uppercase tracking-wider transition-all",
                  isActive
                    ? "bg-admin-accent text-white shadow-sm"
                    : "text-admin-text-secondary hover:text-admin-text-primary hover:bg-admin-elevated"
                )}
              >
                <Icon className="w-4 h-4" />
                <span>{item.label}</span>
              </Link>
            );
          })}
        </nav>

        {/* Bottom Seeder & Storefront Link */}
        <div className="p-4 border-t border-admin-border space-y-2">
          <button
            onClick={handleSeedDatabase}
            disabled={isSeeding}
            className="w-full py-2 px-3 bg-admin-elevated border border-admin-border text-admin-text-secondary hover:text-admin-text-primary text-[11px] font-semibold uppercase tracking-wider rounded flex items-center justify-center gap-2 transition-colors cursor-pointer"
          >
            {isSeeding ? (
              <span className="df-spinner df-spinner--sm" />
            ) : (
              <>
                <Database className="w-3.5 h-3.5 text-admin-accent" />
                <span>Seed Mock Data</span>
              </>
            )}
          </button>

          <Link
            href="/"
            target="_blank"
            className="w-full py-2 px-3 bg-transparent border border-admin-border text-admin-text-secondary hover:text-admin-text-primary text-[11px] font-semibold uppercase tracking-wider rounded flex items-center justify-center gap-2 transition-colors"
          >
            <ExternalLink className="w-3.5 h-3.5" />
            <span>View Live Store</span>
          </Link>

          <button
            type="button"
            onClick={signOut}
            className="w-full py-2 px-3 bg-red-500/10 hover:bg-red-500/20 text-red-400 text-[11px] font-semibold uppercase tracking-wider rounded flex items-center justify-center gap-2 transition-colors cursor-pointer"
          >
            <LogOut className="w-3.5 h-3.5" />
            <span>Sign Out</span>
          </button>
        </div>
      </aside>

      {/* Main Content Area */}
      <div className="flex-1 flex flex-col min-w-0 overflow-hidden">
        {/* Top Header Navbar */}
        <header className="h-16 bg-white border-b border-admin-border-light px-4 sm:px-8 flex items-center justify-between z-20">
          <div className="flex items-center gap-4">
            <button
              onClick={() => setIsSidebarOpen(true)}
              className="lg:hidden p-2 text-admin-text-secondary hover:text-admin-text-primary-light cursor-pointer"
              aria-label="Open sidebar"
            >
              <Menu className="w-5 h-5" />
            </button>
            <span className="font-bold text-xs uppercase tracking-wider text-admin-text-secondary-light hidden sm:inline-block">
              Dream Fashion Administration
            </span>
          </div>

          <div className="flex items-center gap-4">
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 rounded-full bg-admin-accent text-white flex items-center justify-center font-bold text-xs">
                {profile?.name?.charAt(0) || "A"}
              </div>
              <div className="text-left hidden sm:block">
                <span className="font-bold text-xs uppercase block text-admin-text-primary-light">
                  {profile?.name || "Administrator"}
                </span>
                <span className="text-[10px] text-admin-accent font-semibold block uppercase">
                  {profile?.role === "super_admin" ? "Super Admin" : "Store Admin"}
                </span>
              </div>
            </div>

            <button
              onClick={signOut}
              className="p-2 text-admin-text-secondary hover:text-admin-danger transition-colors cursor-pointer"
              title="Sign Out"
            >
              <LogOut className="w-4 h-4" />
            </button>
          </div>
        </header>

        {/* Page Children Content */}
        <main className="flex-1 overflow-y-auto p-4 sm:p-8 bg-admin-canvas">
          {children}
        </main>
      </div>

      {/* Mobile Drawer Sidebar */}
      {isSidebarOpen && (
        <div className="fixed inset-0 z-50 lg:hidden">
          <div
            className="fixed inset-0 bg-black/60 backdrop-blur-xs"
            onClick={() => setIsSidebarOpen(false)}
          />
          <aside className="fixed inset-y-0 left-0 w-64 bg-admin-bg border-r border-admin-border text-admin-text-secondary flex flex-col justify-between z-50">
            <div>
              <div className="h-16 px-6 flex items-center justify-between border-b border-admin-border">
                <span className="font-bold text-sm tracking-wider text-admin-text-primary">
                  DREAM ADMIN
                </span>
                <button
                  onClick={() => setIsSidebarOpen(false)}
                  className="p-1 text-admin-text-secondary hover:text-white"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              <nav className="p-4 space-y-1 overflow-y-auto max-h-[calc(100vh-140px)]">
                {navItems.map((item) => {
                  const Icon = item.icon;
                  const isActive = pathname === item.href;
                  return (
                    <Link
                      key={item.href}
                      href={item.href}
                      onClick={() => setIsSidebarOpen(false)}
                      className={cn(
                        "flex items-center gap-3 px-3.5 py-2.5 rounded text-xs font-semibold uppercase tracking-wider",
                        isActive
                          ? "bg-admin-accent text-white"
                          : "text-admin-text-secondary hover:text-white hover:bg-admin-elevated"
                      )}
                    >
                      <Icon className="w-4 h-4" />
                      <span>{item.label}</span>
                    </Link>
                  );
                })}
              </nav>
            </div>

            <div className="p-4 border-t border-admin-border space-y-2">
              <button
                type="button"
                onClick={signOut}
                className="w-full py-2 px-3 bg-red-500/10 hover:bg-red-500/20 text-red-400 text-xs font-bold uppercase rounded flex items-center justify-center gap-2 cursor-pointer"
              >
                <LogOut className="w-4 h-4" />
                <span>Sign Out</span>
              </button>
            </div>
          </aside>
        </div>
      )}
    </div>
  );
}
