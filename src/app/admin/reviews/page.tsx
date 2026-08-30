"use client";

import { useState } from "react";
import { Star, Check, X, Trash2, ShieldCheck, User } from "lucide-react";
import { Review } from "@/types";
import { useUIStore } from "@/store/useUIStore";

export default function AdminReviewsPage() {
  const { addToast } = useUIStore();

  const [reviews, setReviews] = useState<Review[]>([
    {
      id: "rev-1",
      productId: "df-prod-001",
      userId: "user-1",
      userName: "Farhana Ahmed",
      rating: 5,
      comment: "Exceptional quality fabric and clean tailoring. The drape is exactly as shown in the editorial photos!",
      verifiedPurchase: true,
      status: "approved",
      createdAt: "2026-08-27",
    },
    {
      id: "rev-2",
      productId: "df-prod-001",
      userId: "user-2",
      userName: "Tanvir Hossain",
      rating: 5,
      comment: "Super fast delivery inside Dhaka (received next day). Fits perfectly according to the size guide.",
      verifiedPurchase: true,
      status: "approved",
      createdAt: "2026-08-22",
    },
    {
      id: "rev-3",
      productId: "df-prod-002",
      userId: "user-3",
      userName: "Nusrat Jahan",
      rating: 4,
      comment: "Very elegant modern piece. True to size and feels very premium.",
      verifiedPurchase: true,
      status: "approved",
      createdAt: "2026-08-15",
    },
  ]);

  const handleStatusChange = (id: string, newStatus: Review["status"]) => {
    setReviews(
      reviews.map((r) => (r.id === id ? { ...r, status: newStatus } : r))
    );
    addToast(`Review status updated to "${newStatus}"`, "success");
  };

  const handleDelete = (id: string) => {
    setReviews(reviews.filter((r) => r.id !== id));
    addToast("Review deleted", "info");
  };

  return (
    <div className="space-y-8 max-w-5xl">
      <div>
        <span className="text-[11px] font-bold tracking-[0.2em] uppercase text-admin-text-secondary block">
          MODERATION QUEUE
        </span>
        <h1 className="font-heading text-2xl sm:text-3xl font-bold uppercase tracking-wider text-admin-text-primary-light mt-1">
          CUSTOMER REVIEWS & FEEDBACK
        </h1>
      </div>

      <div className="bg-white rounded-lg border border-admin-border-light shadow-xs overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-xs text-left border-collapse">
            <thead>
              <tr className="bg-bg-subtle border-b border-line-200 text-admin-text-secondary-light font-semibold uppercase">
                <th className="p-4">Customer</th>
                <th className="p-4">Rating</th>
                <th className="p-4">Comment</th>
                <th className="p-4">Date</th>
                <th className="p-4">Status</th>
                <th className="p-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-line-100 text-admin-text-primary-light">
              {reviews.map((rev) => (
                <tr key={rev.id} className="hover:bg-bg-subtle/50 transition-colors">
                  <td className="p-4 font-semibold">
                    <div className="flex items-center gap-1.5">
                      <span>{rev.userName}</span>
                      {rev.verifiedPurchase && (
                        <span className="text-[10px] text-df-success font-bold">✓</span>
                      )}
                    </div>
                  </td>
                  <td className="p-4">
                    <div className="flex items-center text-accent-gold">
                      {[...Array(rev.rating)].map((_, i) => (
                        <Star key={i} className="w-3 h-3 fill-accent-gold" />
                      ))}
                    </div>
                  </td>
                  <td className="p-4 max-w-xs text-admin-text-secondary-light">
                    &ldquo;{rev.comment}&rdquo;
                  </td>
                  <td className="p-4 text-admin-text-secondary-light">{rev.createdAt}</td>
                  <td className="p-4">
                    <span
                      className={`px-2.5 py-1 rounded text-[10px] font-bold uppercase tracking-wider ${
                        rev.status === "approved"
                          ? "bg-admin-success/15 text-admin-success"
                          : rev.status === "rejected"
                          ? "bg-admin-danger/15 text-admin-danger"
                          : "bg-admin-warning/15 text-admin-warning"
                      }`}
                    >
                      {rev.status}
                    </span>
                  </td>
                  <td className="p-4 text-right space-x-2">
                    {rev.status !== "approved" && (
                      <button
                        onClick={() => handleStatusChange(rev.id, "approved")}
                        className="p-1.5 bg-admin-success/15 text-admin-success hover:bg-admin-success hover:text-white rounded transition-colors"
                        title="Approve review"
                      >
                        <Check className="w-3.5 h-3.5" />
                      </button>
                    )}
                    {rev.status !== "rejected" && (
                      <button
                        onClick={() => handleStatusChange(rev.id, "rejected")}
                        className="p-1.5 bg-admin-warning/15 text-admin-warning hover:bg-admin-warning hover:text-white rounded transition-colors"
                        title="Reject review"
                      >
                        <X className="w-3.5 h-3.5" />
                      </button>
                    )}
                    <button
                      onClick={() => handleDelete(rev.id)}
                      className="p-1.5 text-admin-text-secondary hover:text-admin-danger rounded transition-colors"
                      title="Delete review"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
