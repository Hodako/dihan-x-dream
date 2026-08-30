"use client";

import { useState, useEffect } from "react";
import Image from "next/image";
import {
  Package,
  Search,
  Truck,
  Filter,
  Eye,
  CheckCircle2,
  Clock,
  AlertCircle,
  X,
  MapPin,
  Banknote,
  ShieldCheck,
  Trash2,
  RefreshCw,
  Send,
  ExternalLink,
} from "lucide-react";
import { Order, OrderStatus, SteadfastInfo } from "@/types";
import { formatPrice } from "@/lib/utils";
import { useUIStore } from "@/store/useUIStore";
import { collection, getDocs, doc, setDoc, deleteDoc } from "firebase/firestore";
import { db } from "@/lib/firebase";

export default function AdminOrdersPage() {
  const { addToast } = useUIStore();
  const [orders, setOrders] = useState<Order[]>([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [selectedOrder, setSelectedOrder] = useState<Order | null>(null);
  const [isSendingToSteadfast, setIsSendingToSteadfast] = useState(false);

  // Load from Firestore & localStorage
  useEffect(() => {
    async function loadOrders() {
      try {
        const deletedIds: string[] = JSON.parse(localStorage.getItem("dream_deleted_orders") || "[]");
        const snap = await getDocs(collection(db, "orders"));
        if (!snap.empty) {
          const loaded = snap.docs.map((d) => ({ id: d.id, ...d.data() } as Order));
          setOrders(loaded.filter((o) => !deletedIds.includes(o.id)));
          return;
        }
      } catch (e) {}

      if (typeof window !== "undefined") {
        const deletedIds: string[] = JSON.parse(localStorage.getItem("dream_deleted_orders") || "[]");
        const stored = JSON.parse(localStorage.getItem("recent_orders") || "[]");
        setOrders(stored.filter((o: Order) => !deletedIds.includes(o.id)));
      }
    }
    loadOrders();
  }, []);

  const handleUpdateStatus = async (newStatus: OrderStatus) => {
    if (!selectedOrder) return;

    const updated: Order = {
      ...selectedOrder,
      status: newStatus,
      timeline: [
        ...selectedOrder.timeline,
        {
          status: newStatus,
          timestamp: new Date().toISOString(),
          note: `Status updated to ${newStatus} by admin.`,
        },
      ],
    };

    const newOrdersList = orders.map((o) => (o.id === selectedOrder.id ? updated : o));
    setOrders(newOrdersList);
    setSelectedOrder(updated);

    if (typeof window !== "undefined") {
      localStorage.setItem("recent_orders", JSON.stringify(newOrdersList));
      localStorage.setItem(`order_${selectedOrder.id}`, JSON.stringify(updated));
    }

    addToast(`Order ${selectedOrder.orderNumber} status changed to "${newStatus}"`, "success");

    try {
      await setDoc(doc(db, "orders", selectedOrder.id), updated, { merge: true });
    } catch (e) {}
  };

  const handleSendToSteadfast = async () => {
    if (!selectedOrder) return;

    setIsSendingToSteadfast(true);
    addToast("Connecting to Steadfast Courier API...", "info");

    try {
      const fullAddress = `${selectedOrder.shippingAddress.streetAddress}, ${selectedOrder.shippingAddress.upazilaName}, ${selectedOrder.shippingAddress.districtName}, ${selectedOrder.shippingAddress.divisionName}`;

      const res = await fetch("/api/steadfast/order", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          invoice: selectedOrder.orderNumber,
          recipient_name: selectedOrder.customerName,
          recipient_phone: selectedOrder.customerPhone,
          recipient_address: fullAddress,
          cod_amount: selectedOrder.remainingDue,
          note: `Dream Fashion Order (${selectedOrder.items.length} items)`,
        }),
      });

      const data = await res.json();

      if (data.success && data.consignment) {
        const steadfastInfo: SteadfastInfo = {
          consignment_id: data.consignment.consignment_id,
          tracking_code: data.consignment.tracking_code,
          status: data.consignment.status || "in_review",
          dispatchedAt: new Date().toISOString(),
        };

        const updated: Order = {
          ...selectedOrder,
          status: "processing",
          steadfast: steadfastInfo,
          timeline: [
            ...selectedOrder.timeline,
            {
              status: "processing",
              timestamp: new Date().toISOString(),
              note: `Dispatched to Steadfast Courier (CID: ${steadfastInfo.consignment_id}, Tracking: ${steadfastInfo.tracking_code})`,
            },
          ],
        };

        const newOrdersList = orders.map((o) => (o.id === selectedOrder.id ? updated : o));
        setOrders(newOrdersList);
        setSelectedOrder(updated);

        if (typeof window !== "undefined") {
          localStorage.setItem("recent_orders", JSON.stringify(newOrdersList));
          localStorage.setItem(`order_${selectedOrder.id}`, JSON.stringify(updated));
        }

        addToast(
          `🚀 Dispatched to Steadfast! Tracking: ${steadfastInfo.tracking_code}`,
          "success"
        );

        try {
          await setDoc(doc(db, "orders", selectedOrder.id), updated, { merge: true });
        } catch (e) {}
      } else {
        addToast(data.message || "Failed to dispatch to Steadfast", "error");
      }
    } catch (err: any) {
      addToast(err.message || "Steadfast connection error", "error");
    } finally {
      setIsSendingToSteadfast(false);
    }
  };

  const handleDeleteOrder = async (id: string, orderNum: string) => {
    if (!confirm(`Delete order ${orderNum}?`)) return;

    const updated = orders.filter((o) => o.id !== id);
    setOrders(updated);
    if (selectedOrder?.id === id) setSelectedOrder(null);

    try {
      const deletedIds: string[] = JSON.parse(localStorage.getItem("dream_deleted_orders") || "[]");
      if (!deletedIds.includes(id)) {
        localStorage.setItem("dream_deleted_orders", JSON.stringify([...deletedIds, id]));
      }
      localStorage.setItem("recent_orders", JSON.stringify(updated));
      localStorage.removeItem(`order_${id}`);
    } catch {}

    addToast(`Order ${orderNum} deleted`, "info");

    try {
      await deleteDoc(doc(db, "orders", id));
    } catch (e) {}
  };

  const handlePurgeAllOrders = async () => {
    if (confirm("Are you sure you want to delete ALL orders to start clean?")) {
      const allIds = orders.map((o) => o.id);
      try {
        const deletedIds: string[] = JSON.parse(localStorage.getItem("dream_deleted_orders") || "[]");
        localStorage.setItem(
          "dream_deleted_orders",
          JSON.stringify(Array.from(new Set([...deletedIds, ...allIds])))
        );
        localStorage.setItem("recent_orders", "[]");
        for (const id of allIds) {
          localStorage.removeItem(`order_${id}`);
          await deleteDoc(doc(db, "orders", id));
        }
      } catch {}
      setOrders([]);
      setSelectedOrder(null);
      addToast("All orders cleared.", "info");
    }
  };

  const filteredOrders = orders.filter((o) => {
    if (statusFilter !== "all" && o.status !== statusFilter) return false;
    if (searchTerm) {
      const q = searchTerm.toLowerCase();
      return (
        o.orderNumber.toLowerCase().includes(q) ||
        o.customerName.toLowerCase().includes(q) ||
        o.customerPhone.toLowerCase().includes(q) ||
        (o.steadfast?.tracking_code && o.steadfast.tracking_code.toLowerCase().includes(q))
      );
    }
    return true;
  });

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="flex items-center justify-between flex-wrap gap-4">
        <div>
          <span className="text-[11px] font-bold tracking-[0.2em] uppercase text-admin-text-secondary block">
            LOGISTICS & COURIER FULFILLMENT
          </span>
          <h1 className="font-heading text-2xl sm:text-3xl font-bold uppercase tracking-wider text-admin-text-primary-light mt-1">
            ORDERS MANAGEMENT ({orders.length})
          </h1>
        </div>
      </div>

      {/* Filter and Search Bar */}
      <div className="flex flex-col sm:flex-row items-center gap-4 bg-white p-4 rounded-lg border border-admin-border-light shadow-xs">
        <div className="relative flex-1 w-full">
          <Search className="w-4 h-4 text-admin-text-secondary-light absolute left-3 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            placeholder="Search by order ID, phone, name, or Steadfast tracking code..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full text-xs py-2.5 pl-9 pr-4 bg-bg-subtle border border-line-200 rounded focus:outline-none focus:border-admin-accent"
          />
        </div>

        <select
          value={statusFilter}
          onChange={(e) => setStatusFilter(e.target.value)}
          className="w-full sm:w-48 text-xs py-2.5 px-3 bg-bg-subtle border border-line-200 rounded text-admin-text-primary-light focus:outline-none focus:border-admin-accent uppercase cursor-pointer"
        >
          <option value="all">All Statuses</option>
          <option value="pending">Pending</option>
          <option value="processing">Processing</option>
          <option value="shipped">Shipped</option>
          <option value="delivered">Delivered</option>
          <option value="cancelled">Cancelled</option>
        </select>
      </div>

      {/* Orders Table */}
      <div className="bg-white rounded-lg border border-admin-border-light shadow-xs overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-xs text-left border-collapse">
            <thead>
              <tr className="bg-bg-subtle border-b border-line-200 text-admin-text-secondary-light font-semibold uppercase">
                <th className="p-4">Order ID</th>
                <th className="p-4">Date</th>
                <th className="p-4">Customer & Phone</th>
                <th className="p-4">Payment</th>
                <th className="p-4">Status</th>
                <th className="p-4">Steadfast Courier</th>
                <th className="p-4">Paid / Due</th>
                <th className="p-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-line-100 text-admin-text-primary-light">
              {filteredOrders.map((ord) => (
                <tr key={ord.id} className="hover:bg-bg-subtle/50 transition-colors">
                  <td className="p-4 font-mono font-bold text-admin-accent">{ord.orderNumber}</td>
                  <td className="p-4 text-admin-text-secondary-light">
                    {new Date(ord.createdAt).toLocaleDateString("en-BD")}
                  </td>
                  <td className="p-4">
                    <p className="font-bold text-admin-text-primary-light">{ord.customerName}</p>
                    <p className="text-[11px] font-mono text-admin-text-secondary-light">{ord.customerPhone}</p>
                  </td>
                  <td className="p-4 uppercase">
                    <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-bg-subtle border border-line-200">
                      {ord.paymentMethod === "cod"
                        ? "Full COD"
                        : ord.paymentMethod === "partial"
                        ? "Partial Advance"
                        : "Online Paid"}
                    </span>
                  </td>
                  <td className="p-4">
                    <span
                      className={`px-2.5 py-1 rounded text-[10px] font-bold uppercase tracking-wider ${
                        ord.status === "delivered"
                          ? "bg-admin-success/15 text-admin-success"
                          : ord.status === "shipped"
                          ? "bg-admin-info/15 text-admin-info"
                          : ord.status === "processing"
                          ? "bg-admin-accent-soft text-admin-accent"
                          : "bg-admin-warning/15 text-admin-warning"
                      }`}
                    >
                      {ord.status}
                    </span>
                  </td>
                  <td className="p-4">
                    {ord.steadfast ? (
                      <div className="space-y-0.5">
                        <span className="px-2 py-0.5 rounded text-[10px] font-mono font-bold bg-emerald-50 text-emerald-700 border border-emerald-200 block w-fit">
                          {ord.steadfast.tracking_code}
                        </span>
                        <span className="text-[10px] text-gray-500 block uppercase">
                          CID #{ord.steadfast.consignment_id}
                        </span>
                      </div>
                    ) : (
                      <span className="text-[11px] text-gray-400 italic">Not Dispatched</span>
                    )}
                  </td>
                  <td className="p-4 font-mono">
                    <span className="text-df-success font-semibold">{formatPrice(ord.advancePaid)}</span>
                    <span className="text-admin-text-secondary-light"> / </span>
                    <span className="font-bold text-admin-text-primary-light">{formatPrice(ord.remainingDue)}</span>
                  </td>
                  <td className="p-4 text-right flex items-center justify-end gap-2">
                    <button
                      onClick={() => setSelectedOrder(ord)}
                      className="px-3 py-1.5 bg-admin-accent-soft hover:bg-admin-accent text-admin-accent hover:text-white rounded text-[11px] font-bold uppercase tracking-wider transition-colors cursor-pointer"
                    >
                      Inspect
                    </button>
                    <button
                      onClick={() => handleDeleteOrder(ord.id, ord.orderNumber)}
                      className="p-1.5 text-admin-text-secondary hover:text-admin-danger rounded transition-colors cursor-pointer"
                      title="Delete order"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </td>
                </tr>
              ))}
              {filteredOrders.length === 0 && (
                <tr>
                  <td colSpan={8} className="p-8 text-center text-admin-text-secondary-light">
                    No orders found.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Order Detail Inspection Modal */}
      {selectedOrder && (
        <div className="fixed inset-0 z-50 overflow-y-auto flex items-center justify-center p-4">
          <div className="fixed inset-0 bg-black/60 backdrop-blur-xs" onClick={() => setSelectedOrder(null)} />
          <div className="relative w-full max-w-2xl bg-white rounded-xl shadow-2xl p-6 sm:p-8 z-50 border border-admin-border-light space-y-6 text-xs">
            <div className="flex items-center justify-between pb-4 border-b border-line-200">
              <div>
                <span className="text-[10px] font-bold text-admin-text-secondary uppercase">
                  ORDER DETAILS
                </span>
                <h3 className="font-heading text-lg font-bold text-admin-text-primary-light font-mono">
                  {selectedOrder.orderNumber}
                </h3>
              </div>
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => handleDeleteOrder(selectedOrder.id, selectedOrder.orderNumber)}
                  className="px-3 py-1.5 bg-admin-danger/10 text-admin-danger hover:bg-admin-danger hover:text-white rounded text-[11px] font-bold uppercase transition-colors flex items-center gap-1 cursor-pointer"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                  <span>Delete</span>
                </button>
                <button
                  onClick={() => setSelectedOrder(null)}
                  className="text-admin-text-secondary hover:text-admin-text-primary-light p-1 cursor-pointer"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>
            </div>

            {/* STEADFAST COURIER DISPATCH CARD */}
            <div className="p-4 rounded-xl border border-emerald-200 bg-emerald-50/40 space-y-3">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Truck className="w-4 h-4 text-emerald-700" />
                  <span className="font-heading text-xs font-bold uppercase tracking-wider text-emerald-950">
                    Steadfast Courier Delivery
                  </span>
                </div>
                {selectedOrder.steadfast && (
                  <span className="px-2.5 py-0.5 rounded-full bg-emerald-100 text-emerald-800 text-[10px] font-bold uppercase font-mono">
                    DISPATCHED
                  </span>
                )}
              </div>

              {selectedOrder.steadfast ? (
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5 pt-1">
                  <div className="p-2.5 bg-white rounded-lg border border-emerald-100">
                    <span className="text-[10px] text-gray-500 uppercase font-bold block">Consignment ID</span>
                    <span className="font-mono font-bold text-emerald-900 text-xs">
                      #{selectedOrder.steadfast.consignment_id}
                    </span>
                  </div>
                  <div className="p-2.5 bg-white rounded-lg border border-emerald-100">
                    <span className="text-[10px] text-gray-500 uppercase font-bold block">Tracking Code</span>
                    <span className="font-mono font-bold text-emerald-900 text-xs">
                      {selectedOrder.steadfast.tracking_code}
                    </span>
                  </div>
                  <div className="p-2.5 bg-white rounded-lg border border-emerald-100 flex items-center justify-center">
                    <a
                      href={`https://steadfast.com.bd/t/${selectedOrder.steadfast.tracking_code}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="px-3 py-1.5 bg-emerald-700 hover:bg-emerald-800 text-white rounded text-[10px] font-bold uppercase flex items-center gap-1 transition-colors"
                    >
                      <span>Live Track</span>
                      <ExternalLink className="w-3 h-3" />
                    </a>
                  </div>
                </div>
              ) : (
                <div className="flex flex-col sm:flex-row items-center justify-between gap-3 pt-1">
                  <p className="text-[11px] text-emerald-900">
                    Auto-create parcel on Steadfast Courier and collect COD amount <strong>{formatPrice(selectedOrder.remainingDue)}</strong>.
                  </p>
                  <button
                    type="button"
                    onClick={handleSendToSteadfast}
                    disabled={isSendingToSteadfast}
                    className="px-4 py-2 bg-emerald-700 hover:bg-emerald-800 text-white rounded-lg text-xs font-bold uppercase tracking-wider flex items-center gap-2 transition-all shadow-xs cursor-pointer flex-shrink-0"
                  >
                    <Send className="w-3.5 h-3.5" />
                    <span>{isSendingToSteadfast ? "Connecting Steadfast..." : "Send to Steadfast"}</span>
                  </button>
                </div>
              )}
            </div>

            {/* Quick Status Changers */}
            <div className="space-y-2">
              <label className="text-xs font-bold uppercase tracking-wider text-admin-text-primary-light block">
                Update Fulfillment Status
              </label>
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                {(["pending", "processing", "shipped", "delivered"] as OrderStatus[]).map((st) => (
                  <button
                    key={st}
                    onClick={() => handleUpdateStatus(st)}
                    className={`py-2 rounded text-xs font-bold uppercase tracking-wider border cursor-pointer ${
                      selectedOrder.status === st
                        ? "bg-admin-accent text-white border-admin-accent"
                        : "bg-bg-subtle text-admin-text-primary-light border-line-200 hover:bg-line-200"
                    }`}
                  >
                    {st}
                  </button>
                ))}
              </div>
            </div>

            {/* Customer & Address */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
              <div className="p-4 bg-bg-subtle rounded border border-line-100 space-y-1">
                <span className="text-[10px] text-admin-text-secondary uppercase font-bold">
                  CUSTOMER INFO
                </span>
                <p className="font-bold text-admin-text-primary-light">{selectedOrder.customerName}</p>
                <p className="text-admin-text-secondary-light font-mono">{selectedOrder.customerPhone}</p>
                <p className="text-admin-text-secondary-light">{selectedOrder.customerEmail}</p>
              </div>

              <div className="p-4 bg-bg-subtle rounded border border-line-100 space-y-1">
                <span className="text-[10px] text-admin-text-secondary uppercase font-bold">
                  DESTINATION (BD)
                </span>
                <p className="text-admin-text-primary-light">{selectedOrder.shippingAddress.streetAddress}</p>
                <p className="text-admin-text-secondary-light">
                  {selectedOrder.shippingAddress.upazilaName}, {selectedOrder.shippingAddress.districtName},{" "}
                  {selectedOrder.shippingAddress.divisionName}
                </p>
                <p className="text-admin-accent font-semibold pt-1">
                  Est. Delivery: {selectedOrder.deliveryEstimatedDays}
                </p>
              </div>
            </div>

            {/* Items */}
            <div className="space-y-2">
              <span className="text-xs font-bold uppercase tracking-wider text-admin-text-primary-light block">
                ORDERED ITEMS
              </span>
              <div className="divide-y divide-line-100 border border-line-200 rounded p-3 text-xs">
                {selectedOrder.items.map((item) => (
                  <div key={item.variantSku} className="py-2 first:pt-0 flex justify-between items-center">
                    <div>
                      <p className="font-bold text-admin-text-primary-light">{item.title}</p>
                      <p className="text-admin-text-secondary-light text-[11px]">
                        Color: {item.color} • Size: {item.size} • Qty: {item.quantity}
                      </p>
                    </div>
                    <span className="font-mono font-bold text-admin-text-primary-light">
                      {formatPrice(item.price * item.quantity)}
                    </span>
                  </div>
                ))}
              </div>
            </div>

            {/* Financials */}
            <div className="p-4 bg-bg-subtle rounded border border-line-200 space-y-1 text-xs">
              <div className="flex justify-between">
                <span className="text-admin-text-secondary-light">Subtotal:</span>
                <span className="font-mono">{formatPrice(selectedOrder.subtotal)}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-admin-text-secondary-light">Delivery Fee:</span>
                <span className="font-mono">{formatPrice(selectedOrder.deliveryCharge)}</span>
              </div>
              <div className="flex justify-between font-bold text-admin-text-primary-light pt-1 border-t border-line-200">
                <span>Grand Total:</span>
                <span className="font-mono">{formatPrice(selectedOrder.grandTotal)}</span>
              </div>
              <div className="flex justify-between text-df-success font-semibold pt-1">
                <span>Advance Paid:</span>
                <span className="font-mono">{formatPrice(selectedOrder.advancePaid)}</span>
              </div>
              <div className="flex justify-between font-bold text-admin-accent">
                <span>Remaining Due on Delivery (COD):</span>
                <span className="font-mono">{formatPrice(selectedOrder.remainingDue)}</span>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
