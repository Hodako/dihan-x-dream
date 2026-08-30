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
  FileText,
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
    { label: "Dashboard", href: "/who/hodako", icon: LayoutDashboard },
    { label: "Products", href: "/who/hodako/products", icon: ShoppingBag },
    { label: "Categories & Nav", href: "/who/hodako/categories", icon: Layers },
    { label: "Orders", href: "/who/hodako/orders", icon: Package },
    { label: "Delivery & Logistics", href: "/who/hodako/logistics", icon: Truck },
    { label: "Banners & Lookbook", href: "/who/hodako/banners", icon: ImageIcon },
    { label: "Coupons", href: "/who/hodako/coupons", icon: Tag },
    { label: "Lucky Spinner", href: "/who/hodako/spinner", icon: Sparkles },
    { label: "Theme & UI", href: "/who/hodako/theme", icon: Palette },
    { label: "Footer Info", href: "/who/hodako/footer", icon: FileText },
    { label: "Reviews", href: "/who/hodako/reviews", icon: Star },
    { label: "Users & Access", href: "/who/hodako/users", icon: Users },
    { label: "Settings & System", href: "/who/hodako/settings", icon: Settings },
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
      <div className="min-h-screen bg-[#F4F6F9] flex flex-col items-center justify-center p-4 text-slate-800">
        <div className="w-10 h-10 border-3 border-[#FFB900] border-t-transparent rounded-full animate-spin mb-4" />
        <p className="font-mono text-xs uppercase tracking-widest text-slate-500">
          Authenticating Secure Admin Session...
        </p>
      </div>
    );
  }

  // 2. Strict Authorization Gate (Blocks unauthorized users)
  if (!isAdmin) {
    return (
      <div className="min-h-screen bg-[#F4F6F9] flex items-center justify-center p-4 selection:bg-[#FFB900] selection:text-black">
        <div className="w-full max-w-md bg-white border border-slate-200 rounded-2xl p-6 sm:p-8 shadow-xl space-y-6 text-slate-900 text-xs">
          {/* Lock Icon & Title */}
          <div className="text-center space-y-2">
            <div className="w-12 h-12 rounded-full bg-[#FFB900]/15 border border-[#FFB900]/40 text-[#E5A700] flex items-center justify-center mx-auto shadow-sm">
              <Lock className="w-6 h-6" />
            </div>
            <h1 className="font-heading text-xl font-black uppercase tracking-wider text-slate-900">
              ADMIN CONTROL PORTAL
            </h1>
            <p className="text-slate-500 text-xs font-medium">
              Restricted Area. Authorized administrator access required.
            </p>
          </div>

          {/* If Logged in as non-admin customer */}
          {user && !isAdmin ? (
            <div className="p-4 rounded-xl bg-red-50 border border-red-200 text-red-700 space-y-3">
              <div className="flex items-center gap-2">
                <ShieldAlert className="w-5 h-5 text-red-500 shrink-0" />
                <span className="font-bold uppercase text-[11px]">Access Denied</span>
              </div>
              <p className="text-[11px] text-slate-600 leading-relaxed">
                Logged in as <strong className="text-slate-900">{user.email}</strong>. This account does not have administrator privileges.
              </p>
              <div className="flex gap-2 pt-1">
                <button
                  type="button"
                  onClick={signOut}
                  className="w-full py-2.5 bg-red-600 hover:bg-red-700 text-white rounded-xl font-bold uppercase tracking-wider transition-colors cursor-pointer"
                >
                  Sign Out & Switch Account
                </button>
              </div>
            </div>
          ) : (
            <>
              {/* Error Box */}
              {loginError && (
                <div className="p-3 bg-red-50 border border-red-200 text-red-600 rounded-xl text-xs font-semibold">
                  {loginError}
                </div>
              )}

              {/* Email & Password Login Form */}
              <form onSubmit={handleEmailLogin} className="space-y-4">
                <div>
                  <label className="block font-bold uppercase text-slate-600 text-[11px] mb-1">
                    Admin Email Address
                  </label>
                  <input
                    type="email"
                    required
                    placeholder="admin@dreamfashionbd.com"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className="w-full p-3 bg-slate-50 border border-slate-200 rounded-xl text-slate-900 font-medium focus:outline-none focus:border-[#FFB900] focus:bg-white"
                  />
                </div>

                <div>
                  <label className="block font-bold uppercase text-slate-600 text-[11px] mb-1">
                    Password
                  </label>
                  <input
                    type="password"
                    required
                    placeholder="••••••••"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    className="w-full p-3 bg-slate-50 border border-slate-200 rounded-xl text-slate-900 font-medium focus:outline-none focus:border-[#FFB900] focus:bg-white"
                  />
                </div>

                <button
                  type="submit"
                  disabled={isLoggingIn}
                  className="w-full py-3.5 bg-[#FFB900] hover:bg-[#E5A700] text-black font-black uppercase tracking-wider rounded-xl transition-all shadow-md active:scale-[0.99] cursor-pointer"
                >
                  {isLoggingIn ? "Verifying..." : "Sign In to Admin Panel"}
                </button>
              </form>

              {/* Google OAuth Button */}
              <div className="relative flex items-center justify-center">
                <div className="border-t border-slate-200 w-full" />
                <span className="bg-white px-2 text-[10px] uppercase text-slate-400 font-bold shrink-0">
                  Or continue with
                </span>
                <div className="border-t border-slate-200 w-full" />
              </div>

              <button
                type="button"
                onClick={handleGoogleLogin}
                disabled={isLoggingIn}
                className="w-full py-2.5 bg-slate-50 hover:bg-slate-100 text-slate-800 rounded-xl border border-slate-200 font-bold uppercase flex items-center justify-center gap-2 transition-colors cursor-pointer"
              >
                <span>Google Authorized Login</span>
              </button>
            </>
          )}

          <div className="text-center pt-2 border-t border-slate-100">
            <Link href="/" className="text-slate-500 hover:text-slate-900 text-[11px] uppercase font-bold tracking-wider inline-flex items-center gap-1">
              ← Return to Storefront
            </Link>
          </div>
        </div>
      </div>
    );
  }

  // 3. Authorized Admin UI View
  return (
    <div className="min-h-screen bg-admin-canvas flex font-sans antialiased text-admin-text-primary selection:bg-[#FFB900] selection:text-black">
      {/* Sidebar Desktop */}
      <aside className="hidden lg:flex flex-col w-64 bg-white border-r border-admin-border text-admin-text-secondary flex-shrink-0 z-30 shadow-2xs">
        {/* Brand Header */}
        <div className="h-16 px-6 flex items-center justify-between border-b border-admin-border bg-white">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-xl bg-[#FFB900] flex items-center justify-center text-black font-black text-xs shadow-xs">
              DF
            </div>
            <div>
              <span className="font-heading font-black text-sm tracking-wider text-slate-900 block leading-tight">
                DREAM ADMIN
              </span>
              <span className="text-[10px] text-slate-400 font-bold tracking-widest block uppercase">
                Control Center
              </span>
            </div>
          </div>
        </div>

        {/* Navigation Items */}
        <nav className="flex-1 px-3 py-5 space-y-1 overflow-y-auto">
          {navItems.map((item) => {
            const Icon = item.icon;
            const isActive = pathname === item.href;

            return (
              <Link
                key={item.href}
                href={item.href}
                className={cn(
                  "flex items-center gap-3 px-3.5 py-2.5 rounded-xl text-xs font-bold uppercase tracking-wider transition-all",
                  isActive
                    ? "bg-[#FFB900] text-black shadow-xs font-black"
                    : "text-slate-600 hover:text-slate-900 hover:bg-slate-100"
                )}
              >
                <Icon className={cn("w-4 h-4", isActive ? "text-black" : "text-slate-500")} />
                <span>{item.label}</span>
              </Link>
            );
          })}
        </nav>

        {/* Bottom Seeder & Storefront Link */}
        <div className="p-4 border-t border-admin-border space-y-2 bg-slate-50/50">
          <button
            onClick={handleSeedDatabase}
            disabled={isSeeding}
            className="w-full py-2.5 px-3 bg-white border border-admin-border text-slate-700 hover:text-slate-900 hover:bg-slate-50 text-[11px] font-bold uppercase tracking-wider rounded-xl flex items-center justify-center gap-2 transition-colors cursor-pointer shadow-2xs"
          >
            {isSeeding ? (
              <span className="df-spinner df-spinner--dark df-spinner--sm" />
            ) : (
              <>
                <Database className="w-3.5 h-3.5 text-[#E5A700]" />
                <span>Seed Catalog Data</span>
              </>
            )}
          </button>

          <Link
            href="/"
            target="_blank"
            className="w-full py-2.5 px-3 bg-white border border-admin-border text-slate-700 hover:text-slate-900 hover:bg-slate-50 text-[11px] font-bold uppercase tracking-wider rounded-xl flex items-center justify-center gap-2 transition-colors shadow-2xs"
          >
            <ExternalLink className="w-3.5 h-3.5 text-slate-500" />
            <span>View Live Store</span>
          </Link>

          <button
            type="button"
            onClick={signOut}
            className="w-full py-2 px-3 bg-red-50 hover:bg-red-100 text-red-600 text-[11px] font-bold uppercase tracking-wider rounded-xl flex items-center justify-center gap-2 transition-colors cursor-pointer"
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
            className="fixed inset-0 bg-black/40 backdrop-blur-xs"
            onClick={() => setIsSidebarOpen(false)}
          />
          <aside className="fixed inset-y-0 left-0 w-64 bg-white border-r border-admin-border text-slate-700 flex flex-col justify-between z-50 shadow-2xl">
            <div>
              <div className="h-16 px-6 flex items-center justify-between border-b border-admin-border bg-white">
                <div className="flex items-center gap-2">
                  <div className="w-7 h-7 rounded-lg bg-[#FFB900] flex items-center justify-center text-black font-black text-xs">
                    DF
                  </div>
                  <span className="font-heading font-black text-sm tracking-wider text-slate-900">
                    DREAM ADMIN
                  </span>
                </div>
                <button
                  onClick={() => setIsSidebarOpen(false)}
                  className="p-1.5 text-slate-400 hover:text-slate-900 rounded-lg hover:bg-slate-100"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              <nav className="p-3 space-y-1 overflow-y-auto max-h-[calc(100vh-140px)]">
                {navItems.map((item) => {
                  const Icon = item.icon;
                  const isActive = pathname === item.href;
                  return (
                    <Link
                      key={item.href}
                      href={item.href}
                      onClick={() => setIsSidebarOpen(false)}
                      className={cn(
                        "flex items-center gap-3 px-3.5 py-2.5 rounded-xl text-xs font-bold uppercase tracking-wider",
                        isActive
                          ? "bg-[#FFB900] text-black font-black"
                          : "text-slate-600 hover:text-slate-900 hover:bg-slate-100"
                      )}
                    >
                      <Icon className={cn("w-4 h-4", isActive ? "text-black" : "text-slate-500")} />
                      <span>{item.label}</span>
                    </Link>
                  );
                })}
              </nav>
            </div>

            <div className="p-4 border-t border-admin-border space-y-2 bg-slate-50/50">
              <button
                type="button"
                onClick={signOut}
                className="w-full py-2.5 px-3 bg-red-50 hover:bg-red-100 text-red-600 text-xs font-bold uppercase rounded-xl flex items-center justify-center gap-2 cursor-pointer"
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
