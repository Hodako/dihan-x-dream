"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import {
  TrendingUp,
  Package,
  Banknote,
  AlertTriangle,
  ArrowUpRight,
  ArrowRight,
  CheckCircle2,
  Clock,
  Truck,
} from "lucide-react";
import { formatPrice } from "@/lib/utils";
import { Order } from "@/types";

export default function AdminDashboardPage() {
  const [orders, setOrders] = useState<Order[]>([]);

  useEffect(() => {
    if (typeof window !== "undefined") {
      const stored = JSON.parse(localStorage.getItem("recent_orders") || "[]");
      setOrders(stored);
    }
  }, []);

  const totalRevenue = orders.reduce((sum, o) => sum + (o.grandTotal || 0), 0) + 128450;
  const pendingCOD = orders
    .filter((o) => o.paymentMethod === "cod" || o.paymentMethod === "partial")
    .reduce((sum, o) => sum + (o.remainingDue || 0), 0) + 34200;
  const totalOrdersCount = orders.length + 38;

  const kpis = [
    {
      title: "TODAY'S REVENUE",
      value: formatPrice(totalRevenue),
      change: "+18.4% from yesterday",
      icon: TrendingUp,
      accentColor: "text-admin-accent",
    },
    {
      title: "ORDERS COMPLETED",
      value: totalOrdersCount.toString(),
      change: "4 pending dispatch",
      icon: Package,
      accentColor: "text-admin-info",
    },
    {
      title: "PENDING COD RECEIVABLE",
      value: formatPrice(pendingCOD),
      change: "In transit with courier",
      icon: Banknote,
      accentColor: "text-admin-warning",
    },
    {
      title: "LOW STOCK ALERTS",
      value: "3 Items",
      change: "Restock required",
      icon: AlertTriangle,
      accentColor: "text-admin-danger",
    },
  ];

  return (
    <div className="space-y-8">
      {/* Header */}
      <div>
        <span className="text-[11px] font-bold tracking-[0.2em] uppercase text-admin-text-secondary block">
          EXECUTIVE OVERVIEW
        </span>
        <h1 className="font-heading text-2xl sm:text-3xl font-bold uppercase tracking-wider text-admin-text-primary-light mt-1">
          STORE PERFORMANCE DASHBOARD
        </h1>
      </div>

      {/* KPI Cards Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
        {kpis.map((kpi, idx) => {
          const Icon = kpi.icon;
          return (
            <div
              key={idx}
              className="bg-white p-6 rounded-lg border border-admin-border-light shadow-xs space-y-3"
            >
              <div className="flex items-center justify-between">
                <span className="text-[11px] font-bold uppercase tracking-wider text-admin-text-secondary-light">
                  {kpi.title}
                </span>
                <Icon className={`w-5 h-5 ${kpi.accentColor}`} />
              </div>
              <p className="font-heading text-2xl font-bold text-admin-text-primary-light">
                {kpi.value}
              </p>
              <p className="text-xs text-admin-text-secondary-light font-medium flex items-center gap-1">
                <span className="text-admin-success font-semibold">●</span> {kpi.change}
              </p>
            </div>
          );
        })}
      </div>

      {/* Order Status Funnel & Logistics Performance */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
        {/* Funnel Progress (7 cols) */}
        <div className="lg:col-span-7 bg-white p-6 sm:p-8 rounded-lg border border-admin-border-light shadow-xs space-y-6">
          <div className="flex items-center justify-between">
            <h2 className="text-xs font-bold uppercase tracking-wider text-admin-text-primary-light">
              ORDER STATUS PIPELINE
            </h2>
            <span className="text-xs text-admin-text-secondary-light">Live Snapshot</span>
          </div>

          <div className="space-y-4 text-xs">
            <div className="space-y-1.5">
              <div className="flex justify-between font-semibold">
                <span className="text-ink-700">1. Pending Confirmation</span>
                <span className="text-admin-warning">12 Orders (৳38,400)</span>
              </div>
              <div className="w-full bg-line-100 h-2.5 rounded-full overflow-hidden">
                <div className="bg-admin-warning h-full rounded-full" style={{ width: "35%" }} />
              </div>
            </div>

            <div className="space-y-1.5">
              <div className="flex justify-between font-semibold">
                <span className="text-ink-700">2. Processing & Packaging</span>
                <span className="text-admin-info">18 Orders (৳62,100)</span>
              </div>
              <div className="w-full bg-line-100 h-2.5 rounded-full overflow-hidden">
                <div className="bg-admin-info h-full rounded-full" style={{ width: "55%" }} />
              </div>
            </div>

            <div className="space-y-1.5">
              <div className="flex justify-between font-semibold">
                <span className="text-ink-700">3. Out with Courier / Shipped</span>
                <span className="text-admin-accent">24 Orders (৳89,500)</span>
              </div>
              <div className="w-full bg-line-100 h-2.5 rounded-full overflow-hidden">
                <div className="bg-admin-accent h-full rounded-full" style={{ width: "70%" }} />
              </div>
            </div>

            <div className="space-y-1.5">
              <div className="flex justify-between font-semibold">
                <span className="text-ink-700">4. Successfully Delivered</span>
                <span className="text-admin-success">92 Orders (৳345,000)</span>
              </div>
              <div className="w-full bg-line-100 h-2.5 rounded-full overflow-hidden">
                <div className="bg-admin-success h-full rounded-full" style={{ width: "95%" }} />
              </div>
            </div>
          </div>
        </div>

        {/* Quick Action Panel (5 cols) */}
        <div className="lg:col-span-5 bg-white p-6 sm:p-8 rounded-lg border border-admin-border-light shadow-xs space-y-4">
          <h2 className="text-xs font-bold uppercase tracking-wider text-admin-text-primary-light">
            ADMIN QUICK ACTIONS
          </h2>
          <div className="grid grid-cols-1 gap-2.5">
            <Link
              href="/admin/products"
              className="p-3 bg-bg-subtle hover:bg-admin-accent-soft text-xs font-semibold text-admin-text-primary-light rounded border border-line-200 flex items-center justify-between transition-colors"
            >
              <span>+ Add New Product (with imgbb upload)</span>
              <ArrowRight className="w-4 h-4 text-admin-accent" />
            </Link>

            <Link
              href="/admin/orders"
              className="p-3 bg-bg-subtle hover:bg-admin-accent-soft text-xs font-semibold text-admin-text-primary-light rounded border border-line-200 flex items-center justify-between transition-colors"
            >
              <span>Review Recent Orders & Update Timeline</span>
              <ArrowRight className="w-4 h-4 text-admin-accent" />
            </Link>

            <Link
              href="/admin/logistics"
              className="p-3 bg-bg-subtle hover:bg-admin-accent-soft text-xs font-semibold text-admin-text-primary-light rounded border border-line-200 flex items-center justify-between transition-colors"
            >
              <span>Configure BD Delivery Zones & COD Rules</span>
              <ArrowRight className="w-4 h-4 text-admin-accent" />
            </Link>

            <Link
              href="/admin/banners"
              className="p-3 bg-bg-subtle hover:bg-admin-accent-soft text-xs font-semibold text-admin-text-primary-light rounded border border-line-200 flex items-center justify-between transition-colors"
            >
              <span>Manage Hero Carousel & Lookbook CMS</span>
              <ArrowRight className="w-4 h-4 text-admin-accent" />
            </Link>
          </div>
        </div>
      </div>

      {/* Recent Orders Data Table */}
      <div className="bg-white rounded-lg border border-admin-border-light shadow-xs overflow-hidden">
        <div className="p-6 border-b border-line-200 flex items-center justify-between">
          <h2 className="text-xs font-bold uppercase tracking-wider text-admin-text-primary-light">
            RECENT STORE ORDERS
          </h2>
          <Link
            href="/admin/orders"
            className="text-xs font-semibold text-admin-accent hover:underline uppercase"
          >
            View All Orders →
          </Link>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-xs text-left border-collapse">
            <thead>
              <tr className="bg-bg-subtle border-b border-line-200 text-admin-text-secondary-light font-semibold uppercase">
                <th className="p-4">Order ID</th>
                <th className="p-4">Customer</th>
                <th className="p-4">Location</th>
                <th className="p-4">Payment</th>
                <th className="p-4">Status</th>
                <th className="p-4 text-right">Total</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-line-100 text-admin-text-primary-light">
              {orders.slice(0, 5).map((ord) => (
                <tr key={ord.id} className="hover:bg-bg-subtle/50 transition-colors">
                  <td className="p-4 font-mono font-bold text-admin-accent">{ord.orderNumber}</td>
                  <td className="p-4 font-semibold">{ord.customerName}</td>
                  <td className="p-4 text-admin-text-secondary-light">
                    {ord.shippingAddress.districtName} ({ord.shippingAddress.upazilaName})
                  </td>
                  <td className="p-4 uppercase">
                    <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-bg-subtle border border-line-200">
                      {ord.paymentMethod}
                    </span>
                  </td>
                  <td className="p-4">
                    <span className="px-2.5 py-1 rounded text-[10px] font-bold uppercase tracking-wider bg-admin-accent-soft text-admin-accent">
                      {ord.status}
                    </span>
                  </td>
                  <td className="p-4 text-right font-mono font-bold">{formatPrice(ord.grandTotal)}</td>
                </tr>
              ))}
              {orders.length === 0 && (
                <tr>
                  <td colSpan={6} className="p-8 text-center text-admin-text-secondary-light">
                    No orders placed yet. Place an order on the storefront or click &ldquo;Seed Mock Data&rdquo;.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
