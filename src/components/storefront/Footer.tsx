"use client";

import { Phone, Mail, MapPin } from "lucide-react";

export default function Footer() {
  return (
    <footer className="bg-[#0E0E0E] text-white pt-8 pb-7 border-t border-line-200">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center space-y-4">
        {/* Brand Header */}
        <div className="space-y-1">
          <span className="font-heading text-xl sm:text-2xl font-black uppercase tracking-[0.08em] text-white block">
            Dream Fashion
          </span>
          <p className="text-xs text-gray-400 max-w-md mx-auto">
            Modern fashion platform for Bangladesh. Premium fabrics, sharp tailoring, and nationwide doorstep delivery.
          </p>
        </div>

        {/* Contact Strip */}
        <div className="flex flex-wrap items-center justify-center gap-3 sm:gap-8 text-xs text-gray-300">
          <div className="flex items-center gap-1.5">
            <Phone className="w-3.5 h-3.5 text-accent-gold" />
            <span>+880 1700-000000</span>
          </div>
          <div className="flex items-center gap-1.5">
            <Mail className="w-3.5 h-3.5 text-accent-gold" />
            <span>support@dreamfashion.com.bd</span>
          </div>
          <div className="flex items-center gap-1.5">
            <MapPin className="w-3.5 h-3.5 text-accent-gold" />
            <span>Dhaka, Bangladesh</span>
          </div>
        </div>

        {/* Payment Methods */}
        <div className="pt-2 flex flex-wrap items-center justify-center gap-5">
          <div className="h-10 px-3.5 bg-white rounded-lg flex items-center justify-center shadow-xs border border-white/20">
            <img src="/images/payments/bkash.svg" alt="bKash" className="h-7 w-auto object-contain" />
          </div>
          <img src="/images/payments/cod.png" alt="Cash on Delivery" className="h-12 w-auto object-contain" />
        </div>

        {/* Copyright & Creator Credit */}
        <div className="pt-4 border-t border-white/10 text-xs text-gray-500 flex flex-col sm:flex-row items-center justify-between gap-2.5">
          <p className="text-[11px]">© 2026 Dream Fashion Bangladesh. All rights reserved.</p>
          <p className="text-gray-300 text-xs flex items-center gap-1.5 justify-center">
            <span>Made with</span>
            <span className="text-red-500 inline-block animate-pulse text-sm">❤️</span>
            <span>by</span>
            <a
              href="https://facebook.com/hodako17"
              target="_blank"
              rel="noopener noreferrer"
              className="text-white hover:text-accent-gold font-semibold underline underline-offset-4 decoration-white/40 hover:decoration-accent-gold transition-colors inline-flex items-center gap-1"
            >
              Azizul Hakim Khan
            </a>
          </p>
        </div>
      </div>
    </footer>
  );
}
