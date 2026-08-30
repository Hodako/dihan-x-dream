"use client";

import { useState, useEffect } from "react";
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
  Menu,
  X,
  Database,
  Layers,
  Sparkles,
  Palette,
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
  const { profile, isAdmin, setProfile } = useAuthStore();
  const { addToast } = useUIStore();

  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [isSeeding, setIsSeeding] = useState(false);

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

  const enableAdminMode = () => {
    setProfile({
      uid: "admin_user_01",
      name: "Lead Administrator",
      email: "admin@dreamfashionbd.com",
      role: "admin",
      createdAt: new Date().toISOString(),
    });
    addToast("Admin Mode Activated!", "success");
  };

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
          {/* Quick Database Seeder */}
          <button
            onClick={handleSeedDatabase}
            disabled={isSeeding}
            className="w-full py-2 px-3 bg-admin-elevated border border-admin-border text-admin-text-secondary hover:text-admin-text-primary text-[11px] font-semibold uppercase tracking-wider rounded flex items-center justify-center gap-2 transition-colors"
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
            className="w-full py-2 px-3 bg-admin-elevated text-admin-text-secondary hover:text-white text-[11px] font-semibold uppercase tracking-wider rounded flex items-center justify-center gap-2 transition-colors"
          >
            <ExternalLink className="w-3.5 h-3.5" />
            <span>Open Storefront</span>
          </Link>
        </div>
      </aside>

      {/* Mobile Sidebar Drawer */}
      {isSidebarOpen && (
        <div className="fixed inset-0 z-50 lg:hidden flex">
          <div
            className="fixed inset-0 bg-black/60 backdrop-blur-xs"
            onClick={() => setIsSidebarOpen(false)}
          />
          <div className="relative flex-1 flex flex-col max-w-xs w-full bg-admin-bg border-r border-admin-border z-50">
            <div className="h-16 px-6 flex items-center justify-between border-b border-admin-border">
              <span className="font-bold text-sm tracking-wider text-admin-text-primary uppercase">
                DREAM ADMIN
              </span>
              <button
                onClick={() => setIsSidebarOpen(false)}
                className="text-admin-text-secondary p-1"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
            <nav className="p-4 space-y-1 overflow-y-auto">
              {navItems.map((item) => (
                <Link
                  key={item.href}
                  href={item.href}
                  onClick={() => setIsSidebarOpen(false)}
                  className={cn(
                    "flex items-center gap-3 px-3.5 py-2.5 rounded text-xs font-semibold uppercase tracking-wider transition-all",
                    pathname === item.href
                      ? "bg-admin-accent text-white"
                      : "text-admin-text-secondary hover:text-admin-text-primary hover:bg-admin-elevated"
                  )}
                >
                  <item.icon className="w-4 h-4" />
                  <span>{item.label}</span>
                </Link>
              ))}
            </nav>
          </div>
        </div>
      )}

      {/* Main Content Area */}
      <div className="flex-1 flex flex-col min-w-0">
        {/* Top Navbar */}
        <header className="h-16 bg-white border-b border-line-200 px-4 sm:px-8 flex items-center justify-between sticky top-0 z-20">
          <div className="flex items-center gap-4">
            <button
              onClick={() => setIsSidebarOpen(true)}
              className="lg:hidden p-2 text-ink-700"
              aria-label="Open navigation"
            >
              <Menu className="w-5 h-5" />
            </button>
            <span className="text-xs font-semibold uppercase tracking-widest text-ink-500 hidden sm:inline">
              Management Portal
            </span>
          </div>

          <div className="flex items-center gap-4">
            {!isAdmin && (
              <button
                onClick={enableAdminMode}
                className="px-3 py-1.5 bg-admin-accent text-white text-xs font-bold uppercase tracking-wider rounded shadow-sm hover:bg-admin-accent-hover transition-colors flex items-center gap-1.5"
              >
                <ShieldCheck className="w-3.5 h-3.5" />
                <span>Simulate Admin</span>
              </button>
            )}

            <div className="flex items-center gap-3 pl-4 border-l border-line-200">
              <div className="w-8 h-8 rounded-full bg-admin-accent/20 text-admin-accent font-bold text-xs flex items-center justify-center">
                AD
              </div>
              <div className="hidden sm:block text-left">
                <span className="text-xs font-semibold text-ink-900 block">
                  {profile?.name || "Administrator"}
                </span>
                <span className="text-[10px] text-ink-500 block uppercase">
                  {profile?.role || "Admin"}
                </span>
              </div>
            </div>
          </div>
        </header>

        {/* Page Content */}
        <main className="flex-1 p-4 sm:p-6 lg:p-8 overflow-y-auto">
          {children}
        </main>
      </div>
    </div>
  );
}
