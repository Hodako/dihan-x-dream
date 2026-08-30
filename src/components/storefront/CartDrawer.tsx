"use client";

import { useState, useEffect } from "react";
import { useCartStore } from "@/store/useCartStore";
import { X, Plus, Minus, Trash2, ArrowRight, ShoppingBag } from "lucide-react";
import Image from "next/image";
import Link from "next/link";
import { formatPrice } from "@/lib/utils";

const FREE_SHIPPING_THRESHOLD = 2500;

export default function CartDrawer() {
  const [mounted, setMounted] = useState(false);
  const { items, isOpen, closeCart, removeItem, updateQuantity, getSubtotal, getTotalItems } = useCartStore();

  useEffect(() => {
    setMounted(true);
  }, []);

  const subtotal = getSubtotal();
  const totalItems = getTotalItems();
  const freeShippingProgress = Math.min((subtotal / FREE_SHIPPING_THRESHOLD) * 100, 100);
  const remainingForFreeShipping = Math.max(FREE_SHIPPING_THRESHOLD - subtotal, 0);

  if (!mounted || !isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 overflow-hidden">
      {/* Backdrop */}
      <div
        className="fixed inset-0 bg-[#0E0E0E]/60 backdrop-blur-sm transition-opacity"
        onClick={closeCart}
      />

      <div className="fixed inset-y-0 right-0 max-w-md w-full bg-white shadow-2xl flex flex-col justify-between z-50">
        {/* Header */}
        <div className="p-5 border-b border-line-100 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <ShoppingBag className="w-5 h-5 text-ink-900" />
            <h2 className="text-sm font-semibold tracking-[0.1em] uppercase text-ink-900">
              SHOPPING BAG ({totalItems})
            </h2>
          </div>
          <button
            onClick={closeCart}
            className="p-1 text-ink-500 hover:text-ink-900 transition-colors"
            aria-label="Close cart"
          >
            <X className="w-6 h-6" />
          </button>
        </div>

        {/* Free Shipping Progress Indicator */}
        <div className="bg-bg-subtle px-5 py-3 border-b border-line-100">
          <div className="flex items-center justify-between text-xs font-medium mb-1.5">
            {remainingForFreeShipping > 0 ? (
              <span className="text-ink-700">
                Add <strong className="text-ink-900">{formatPrice(remainingForFreeShipping)}</strong> more for <strong>FREE DELIVERY</strong>
              </span>
            ) : (
              <span className="text-df-success font-semibold flex items-center gap-1">
                ✓ You have unlocked FREE DELIVERY!
              </span>
            )}
            <span className="text-ink-500 text-[11px]">{Math.round(freeShippingProgress)}%</span>
          </div>
          <div className="w-full bg-line-200 h-1.5 rounded-full overflow-hidden">
            <div
              className="bg-ink-900 h-full transition-all duration-500 rounded-full"
              style={{ width: `${freeShippingProgress}%` }}
            />
          </div>
        </div>

        {/* Cart Item List */}
        <div className="flex-1 overflow-y-auto p-5 space-y-4 divide-y divide-line-100">
          {items.length === 0 ? (
            <div className="h-full flex flex-col items-center justify-center text-center py-16 space-y-4">
              <ShoppingBag className="w-12 h-12 text-ink-300 stroke-[1.2]" />
              <div>
                <p className="text-base font-medium text-ink-900 uppercase tracking-wider">Your bag is empty</p>
                <p className="text-xs text-ink-500 mt-1">Discover the latest arrivals and curated edits.</p>
              </div>
              <button
                onClick={closeCart}
                className="mt-4 px-6 py-3 bg-ink-900 text-white text-xs font-medium tracking-[0.1em] uppercase hover:bg-ink-700 transition-colors"
              >
                START SHOPPING
              </button>
            </div>
          ) : (
            items.map((item) => (
              <div key={item.variantSku} className="pt-4 first:pt-0 flex gap-4">
                {/* Product Image */}
                <div className="relative w-20 h-24 flex-shrink-0 bg-bg-subtle overflow-hidden">
                  <Image
                    src={item.image || "https://images.unsplash.com/photo-1515886657613-9f3515b0c78f?w=400"}
                    alt={item.title}
                    fill
                    className="object-cover object-top"
                    sizes="80px"
                  />
                </div>

                {/* Details */}
                <div className="flex-1 flex flex-col justify-between">
                  <div>
                    <div className="flex items-start justify-between">
                      <Link
                        href={`/product/${item.slug}`}
                        onClick={closeCart}
                        className="text-xs font-medium text-ink-900 hover:underline line-clamp-1"
                      >
                        {item.title}
                      </Link>
                      <button
                        onClick={() => removeItem(item.variantSku)}
                        className="text-ink-400 hover:text-accent-red p-0.5 transition-colors"
                        aria-label="Remove item"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>

                    <div className="mt-1 flex items-center gap-3 text-[11px] text-ink-500">
                      <span className="flex items-center gap-1">
                        <span
                          className="w-2.5 h-2.5 rounded-full border border-line-200 inline-block"
                          style={{ backgroundColor: item.colorHex }}
                        />
                        {item.color}
                      </span>
                      <span>•</span>
                      <span>Size: {item.size}</span>
                    </div>

                    <p className="mt-1.5 text-xs font-semibold text-ink-900">
                      {formatPrice(item.price)}
                    </p>
                  </div>

                  {/* Quantity Stepper */}
                  <div className="flex items-center justify-between mt-2 pt-2 border-t border-dashed border-line-100">
                    <div className="flex items-center border border-line-200">
                      <button
                        onClick={() => updateQuantity(item.variantSku, item.quantity - 1)}
                        className="p-1.5 hover:bg-bg-subtle transition-colors"
                        aria-label="Decrease quantity"
                      >
                        <Minus className="w-3 h-3 text-ink-700" />
                      </button>
                      <span className="px-3 text-xs font-medium text-ink-900">
                        {item.quantity}
                      </span>
                      <button
                        onClick={() => updateQuantity(item.variantSku, item.quantity + 1)}
                        className="p-1.5 hover:bg-bg-subtle transition-colors"
                        aria-label="Increase quantity"
                      >
                        <Plus className="w-3 h-3 text-ink-700" />
                      </button>
                    </div>

                    <span className="text-xs font-semibold text-ink-900">
                      {formatPrice(item.price * item.quantity)}
                    </span>
                  </div>
                </div>
              </div>
            ))
          )}
        </div>

        {/* Footer with Checkout CTA */}
        {items.length > 0 && (
          <div className="p-5 border-t border-line-100 bg-bg-subtle space-y-4">
            <div className="space-y-1.5 text-xs">
              <div className="flex justify-between text-ink-500">
                <span>Subtotal</span>
                <span>{formatPrice(subtotal)}</span>
              </div>
              <div className="flex justify-between text-ink-500">
                <span>Estimated Delivery</span>
                <span>{subtotal >= FREE_SHIPPING_THRESHOLD ? "FREE" : "Calculated at checkout"}</span>
              </div>
              <div className="flex justify-between text-sm font-semibold text-ink-900 pt-1.5 border-t border-line-200">
                <span>Total</span>
                <span>{formatPrice(subtotal)}</span>
              </div>
            </div>

            <Link
              href="/checkout"
              onClick={closeCart}
              className="w-full bg-[#0E0E0E] text-white py-3.5 px-6 text-xs font-semibold tracking-[0.15em] uppercase hover:bg-ink-700 transition-colors flex items-center justify-center gap-2 group"
            >
              <span>PROCEED TO CHECKOUT</span>
              <ArrowRight className="w-4 h-4 transition-transform group-hover:translate-x-1" />
            </Link>

            <p className="text-[10px] text-center text-ink-500 uppercase tracking-widest">
              Nationwide Delivery • Cash on Delivery • 7-Day Exchange
            </p>
          </div>
        )}
      </div>
    </div>
  );
}
