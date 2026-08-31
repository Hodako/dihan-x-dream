"use client";

import { useState, useMemo, useEffect } from "react";
import { Star, Check, X, Trash2, ShieldCheck, User, ChevronLeft, ChevronRight } from "lucide-react";
import { Review } from "@/types";
import { useUIStore } from "@/store/useUIStore";
import { doc, getDoc, setDoc } from "firebase/firestore";
import { db } from "@/lib/firebase";

const ITEMS_PER_PAGE = 6;

const DEFAULT_REVIEWS: Review[] = [
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
  {
    id: "rev-4",
    productId: "df-prod-003",
    userId: "user-4",
    userName: "Kazi Sazzad",
    rating: 5,
    comment: "The polo shirt collar holds shape after 5 washes. Best casual luxury wear in Bangladesh.",
    verifiedPurchase: true,
    status: "approved",
    createdAt: "2026-08-10",
  },
  {
    id: "rev-5",
    productId: "df-prod-004",
    userId: "user-5",
    userName: "Mehnaz Chowdhury",
    rating: 5,
    comment: "Ordered via Partial Advance. The delivery person was courteous and product packaging is top notch.",
    verifiedPurchase: true,
    status: "approved",
    createdAt: "2026-08-05",
  },
];

export default function AdminReviewsPage() {
  const { addToast } = useUIStore();
  const [currentPage, setCurrentPage] = useState(1);
  const [reviews, setReviews] = useState<Review[]>(DEFAULT_REVIEWS);

  useEffect(() => {
    async function loadReviews() {
      if (typeof window !== "undefined") {
        const stored = localStorage.getItem("dream_reviews_settings");
        if (stored) {
          try {
            const parsed = JSON.parse(stored);
            if (Array.isArray(parsed) && parsed.length > 0) setReviews(parsed);
          } catch (e) {}
        }
      }

      try {
        const snap = await getDoc(doc(db, "settings", "reviews"));
        if (snap.exists() && Array.isArray(snap.data().reviews)) {
          setReviews(snap.data().reviews);
        }
      } catch (e) {}
    }
    loadReviews();
  }, []);

  const handleStatusChange = async (id: string, newStatus: Review["status"]) => {
    const updated = reviews.map((r) => (r.id === id ? { ...r, status: newStatus } : r));
    setReviews(updated);
    if (typeof window !== "undefined") {
      localStorage.setItem("dream_reviews_settings", JSON.stringify(updated));
    }
    addToast(`Review status updated to "${newStatus}"`, "success");
    try {
      await setDoc(doc(db, "settings", "reviews"), { reviews: updated });
    } catch (e) {}
  };

  const handleDelete = async (id: string) => {
    const updated = reviews.filter((r) => r.id !== id);
    setReviews(updated);
    if (typeof window !== "undefined") {
      localStorage.setItem("dream_reviews_settings", JSON.stringify(updated));
    }
    addToast("Review deleted", "info");
    try {
      await setDoc(doc(db, "settings", "reviews"), { reviews: updated });
    } catch (e) {}
  };

  const totalPages = Math.ceil(reviews.length / ITEMS_PER_PAGE) || 1;
  const paginatedReviews = useMemo(() => {
    const startIndex = (currentPage - 1) * ITEMS_PER_PAGE;
    return reviews.slice(startIndex, startIndex + ITEMS_PER_PAGE);
  }, [reviews, currentPage]);

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

      <div className="bg-white rounded-2xl border border-admin-border-light shadow-2xs overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-xs text-left border-collapse">
            <thead>
              <tr className="bg-bg-subtle border-b border-line-200 text-admin-text-secondary-light font-bold uppercase text-[10px]">
                <th className="p-4">Customer</th>
                <th className="p-4">Rating</th>
                <th className="p-4">Comment</th>
                <th className="p-4">Date</th>
                <th className="p-4">Status</th>
                <th className="p-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-line-100 text-admin-text-primary-light">
              {paginatedReviews.map((rev) => (
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
                    <div className="flex items-center text-[#FFB900]">
                      {[...Array(rev.rating)].map((_, i) => (
                        <Star key={i} className="w-3.5 h-3.5 fill-[#FFB900]" />
                      ))}
                    </div>
                  </td>
                  <td className="p-4 max-w-xs text-admin-text-secondary-light leading-relaxed">
                    &ldquo;{rev.comment}&rdquo;
                  </td>
                  <td className="p-4 text-admin-text-secondary-light font-mono text-[11px]">{rev.createdAt}</td>
                  <td className="p-4">
                    <span
                      className={`px-2.5 py-1 rounded text-[10px] font-bold uppercase tracking-wider ${
                        rev.status === "approved"
                          ? "bg-df-success-soft text-df-success"
                          : rev.status === "rejected"
                          ? "bg-red-100 text-red-800"
                          : "bg-amber-100 text-amber-900"
                      }`}
                    >
                      {rev.status}
                    </span>
                  </td>
                  <td className="p-4 text-right space-x-1.5">
                    {rev.status !== "approved" && (
                      <button
                        onClick={() => handleStatusChange(rev.id, "approved")}
                        className="p-1.5 text-df-success hover:bg-df-success-soft rounded transition-colors cursor-pointer"
                        title="Approve Review"
                      >
                        <Check className="w-4 h-4" />
                      </button>
                    )}
                    {rev.status !== "rejected" && (
                      <button
                        onClick={() => handleStatusChange(rev.id, "rejected")}
                        className="p-1.5 text-admin-text-secondary hover:text-admin-danger rounded transition-colors cursor-pointer"
                        title="Reject Review"
                      >
                        <X className="w-4 h-4" />
                      </button>
                    )}
                    <button
                      onClick={() => handleDelete(rev.id)}
                      className="p-1.5 text-admin-text-secondary hover:text-admin-danger rounded transition-colors cursor-pointer"
                      title="Delete Review"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </td>
                </tr>
              ))}
              {reviews.length === 0 && (
                <tr>
                  <td colSpan={6} className="p-8 text-center text-ink-500">
                    No customer reviews to moderate.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>

        {/* Pagination Footer */}
        {totalPages > 1 && (
          <div className="p-4 border-t border-admin-border-light flex items-center justify-between bg-bg-subtle/50 text-xs">
            <span className="text-admin-text-secondary-light font-mono">
              Page {currentPage} of {totalPages}
            </span>

            <div className="flex items-center gap-1">
              <button
                type="button"
                disabled={currentPage === 1}
                onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
                className="p-1.5 rounded-lg border border-admin-border-light bg-white hover:bg-line-200 disabled:opacity-40 cursor-pointer disabled:cursor-not-allowed"
                aria-label="Previous Page"
              >
                <ChevronLeft className="w-4 h-4" />
              </button>

              {Array.from({ length: totalPages }, (_, i) => i + 1).map((pageNum) => (
                <button
                  key={pageNum}
                  type="button"
                  onClick={() => setCurrentPage(pageNum)}
                  className={`w-7 h-7 rounded-lg text-xs font-bold transition-colors cursor-pointer ${
                    currentPage === pageNum
                      ? "bg-[#FFB900] text-black font-black"
                      : "bg-white border border-admin-border-light hover:bg-line-200 text-ink-800"
                  }`}
                >
                  {pageNum}
                </button>
              ))}

              <button
                type="button"
                disabled={currentPage === totalPages}
                onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
                className="p-1.5 rounded-lg border border-admin-border-light bg-white hover:bg-line-200 disabled:opacity-40 cursor-pointer disabled:cursor-not-allowed"
                aria-label="Next Page"
              >
                <ChevronRight className="w-4 h-4" />
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
