"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import {
  Phone,
  Mail,
  MapPin,
  Clock,
  Send,
  MessageCircle,
  ExternalLink,
  Globe,
  Share2,
} from "lucide-react";
import { FooterSettings } from "@/types";
import { INITIAL_FOOTER_SETTINGS } from "@/lib/seedData";
import { doc, getDoc } from "firebase/firestore";
import { db } from "@/lib/firebase";
import { useUIStore } from "@/store/useUIStore";

function FacebookIcon(props: React.SVGProps<SVGSVGElement>) {
  return (
    <svg viewBox="0 0 24 24" width="16" height="16" fill="currentColor" {...props}>
      <path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z"/>
    </svg>
  );
}

function InstagramIcon(props: React.SVGProps<SVGSVGElement>) {
  return (
    <svg viewBox="0 0 24 24" width="16" height="16" fill="currentColor" {...props}>
      <path d="M12 2.163c3.204 0 3.584.012 4.85.07 3.252.148 4.771 1.691 4.919 4.919.058 1.265.069 1.645.069 4.849 0 3.205-.012 3.584-.069 4.849-.149 3.225-1.664 4.771-4.919 4.919-1.266.058-1.644.07-4.85.07-3.204 0-3.584-.012-4.849-.07-3.26-.149-4.771-1.699-4.919-4.92-.058-1.265-.07-1.644-.07-4.849 0-3.204.013-3.583.07-4.849.149-3.227 1.664-4.771 4.919-4.919 1.266-.057 1.645-.069 4.849-.069zm0-2.163c-3.259 0-3.667.014-4.947.072-4.358.2-6.78 2.618-6.98 6.98-.059 1.281-.073 1.689-.073 4.948 0 3.259.014 3.668.072 4.948.2 4.358 2.618 6.78 6.98 6.98 1.281.058 1.689.072 4.948.072 3.259 0 3.668-.014 4.948-.072 4.354-.2 6.782-2.618 6.979-6.98.059-1.28.073-1.689.073-4.948 0-3.259-.014-3.667-.072-4.947-.196-4.354-2.617-6.78-6.979-6.98-1.281-.059-1.69-.073-4.949-.073zm0 5.838c-3.403 0-6.162 2.759-6.162 6.162s2.759 6.163 6.162 6.163 6.162-2.759 6.162-6.163c0-3.403-2.759-6.162-6.162-6.162zm0 10.162c-2.209 0-4-1.79-4-4 0-2.209 1.791-4 4-4s4 1.791 4 4c0 2.21-1.791 4-4 4zm6.406-11.845c-.796 0-1.441.645-1.441 1.44s.645 1.44 1.441 1.44c.795 0 1.439-.645 1.439-1.44s-.644-1.44-1.439-1.44z"/>
    </svg>
  );
}

function YoutubeIcon(props: React.SVGProps<SVGSVGElement>) {
  return (
    <svg viewBox="0 0 24 24" width="16" height="16" fill="currentColor" {...props}>
      <path d="M23.498 6.186a3.016 3.016 0 0 0-2.122-2.136C19.505 3.545 12 3.545 12 3.545s-7.505 0-9.377.505A3.017 3.017 0 0 0 .502 6.186C0 8.07 0 12 0 12s0 3.93.502 5.814a3.016 3.016 0 0 0 2.122 2.136c1.871.505 9.376.505 9.376.505s7.505 0 9.377-.505a3.015 3.015 0 0 0 2.122-2.136C24 15.93 24 12 24 12s0-3.93-.502-5.814zM9.545 15.568V8.432L15.818 12l-6.273 3.568z"/>
    </svg>
  );
}

function LinkedinIcon(props: React.SVGProps<SVGSVGElement>) {
  return (
    <svg viewBox="0 0 24 24" width="16" height="16" fill="currentColor" {...props}>
      <path d="M19 0h-14c-2.761 0-5 2.239-5 5v14c0 2.761 2.239 5 5 5h14c2.762 0 5-2.239 5-5v-14c0-2.761-2.238-5-5-5zm-11 19h-3v-11h3v11zm-1.5-12.268c-.966 0-1.75-.79-1.75-1.764s.784-1.764 1.75-1.764 1.75.79 1.75 1.764-.783 1.764-1.75 1.764zm13.5 12.268h-3v-5.604c0-3.368-4-3.113-4 0v5.604h-3v-11h3v1.765c1.396-2.586 7-2.777 7 2.476v6.759z"/>
    </svg>
  );
}

export default function Footer() {
  const { addToast } = useUIStore();
  const [footer, setFooter] = useState<FooterSettings>(INITIAL_FOOTER_SETTINGS);
  const [clubPhone, setClubPhone] = useState("");
  const [isSubscribed, setIsSubscribed] = useState(false);

  useEffect(() => {
    async function loadFooter() {
      try {
        const snap = await getDoc(doc(db, "settings", "footer"));
        if (snap.exists()) {
          setFooter(snap.data() as FooterSettings);
        }
      } catch (e) {}
    }
    loadFooter();
  }, []);

  const handleNewsletter = (e: React.FormEvent) => {
    e.preventDefault();
    if (!clubPhone.trim()) return;
    setIsSubscribed(true);
    addToast("🎉 Welcome to Dream Club! Your 10% coupon code is DREAM10", "success");
    setClubPhone("");
  };

  return (
    <footer className="bg-[#0A0A0A] text-white pt-12 pb-8 border-t border-line-200">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-10">
        {/* Top Newsletter & Brand Strip */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 pb-10 border-b border-white/10">
          {/* Brand Info (5 cols) */}
          <div className="lg:col-span-5 space-y-3.5 text-center lg:text-left">
            <span className="font-heading text-2xl sm:text-3xl font-black uppercase tracking-[0.08em] text-white block italic">
              {footer.brandName || "Dream Fashion"}
            </span>
            <p className="text-xs text-gray-400 max-w-sm mx-auto lg:mx-0 leading-relaxed font-light">
              {footer.brandTagline ||
                "Modern trend-forward fashion platform for Bangladesh. Premium casual shirts, polos, contemporary tailoring, and nationwide doorstep delivery."}
            </p>

            {/* Social Icons Strip */}
            <div className="flex items-center justify-center lg:justify-start gap-3 pt-2">
              {footer.facebookUrl && (
                <a
                  href={footer.facebookUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="w-8 h-8 rounded-full bg-white/10 hover:bg-[#1877F2] text-white flex items-center justify-center transition-colors"
                  aria-label="Facebook"
                >
                  <FacebookIcon />
                </a>
              )}
              {footer.instagramUrl && (
                <a
                  href={footer.instagramUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="w-8 h-8 rounded-full bg-white/10 hover:bg-[#E4405F] text-white flex items-center justify-center transition-colors"
                  aria-label="Instagram"
                >
                  <InstagramIcon />
                </a>
              )}
              {footer.youtubeUrl && (
                <a
                  href={footer.youtubeUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="w-8 h-8 rounded-full bg-white/10 hover:bg-[#CD201F] text-white flex items-center justify-center transition-colors"
                  aria-label="YouTube"
                >
                  <YoutubeIcon />
                </a>
              )}
              {footer.whatsapp && (
                <a
                  href={`https://wa.me/${footer.whatsapp.replace(/[^0-9]/g, "")}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="w-8 h-8 rounded-full bg-white/10 hover:bg-[#25D366] text-white flex items-center justify-center transition-colors"
                  aria-label="WhatsApp"
                >
                  <MessageCircle className="w-4 h-4" />
                </a>
              )}
              {footer.linkedinUrl && (
                <a
                  href={footer.linkedinUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="w-8 h-8 rounded-full bg-white/10 hover:bg-[#0A66C2] text-white flex items-center justify-center transition-colors"
                  aria-label="LinkedIn"
                >
                  <LinkedinIcon />
                </a>
              )}
            </div>
          </div>

          {/* Quick & Policy Navigation (3 cols) */}
          <div className="lg:col-span-3 grid grid-cols-2 gap-4 text-xs">
            <div className="space-y-2.5">
              <span className="font-heading font-bold uppercase tracking-wider text-accent-gold text-[11px] block">
                Collections
              </span>
              <ul className="space-y-2 text-gray-300">
                {(footer.quickLinks || INITIAL_FOOTER_SETTINGS.quickLinks).map((link, idx) => (
                  <li key={idx}>
                    <Link href={link.url} className="hover:text-white transition-colors">
                      {link.label}
                    </Link>
                  </li>
                ))}
              </ul>
            </div>

            <div className="space-y-2.5">
              <span className="font-heading font-bold uppercase tracking-wider text-accent-gold text-[11px] block">
                Customer Care
              </span>
              <ul className="space-y-2 text-gray-300">
                {(footer.policyLinks || INITIAL_FOOTER_SETTINGS.policyLinks).map((link, idx) => (
                  <li key={idx}>
                    <Link href={link.url} className="hover:text-white transition-colors">
                      {link.label}
                    </Link>
                  </li>
                ))}
              </ul>
            </div>
          </div>

          {/* Newsletter Box (4 cols) */}
          <div className="lg:col-span-4 space-y-3 bg-white/5 border border-white/10 p-5 rounded-2xl">
            <span className="font-heading font-bold uppercase tracking-wider text-white text-xs block">
              {footer.newsletterHeadline || "JOIN THE DREAM CLUB"}
            </span>
            <p className="text-xs text-gray-400 leading-relaxed font-light">
              {footer.newsletterSubtext ||
                "Subscribe to receive exclusive drop alerts, private lookbooks, and 10% off your first online order."}
            </p>

            <form onSubmit={handleNewsletter} className="flex items-center gap-2">
              <input
                type="tel"
                required
                placeholder="017XX-XXXXXX"
                value={clubPhone}
                onChange={(e) => setClubPhone(e.target.value)}
                className="w-full bg-black/50 border border-white/20 rounded-xl px-3 py-2 text-xs text-white placeholder-gray-500 focus:outline-none focus:border-accent-gold font-mono"
              />
              <button
                type="submit"
                className="px-4 py-2 bg-accent-gold hover:bg-amber-400 text-ink-950 font-black text-xs uppercase tracking-wider rounded-xl transition-all flex items-center gap-1 shrink-0 cursor-pointer active:scale-95 hover:scale-105"
              >
                <span>Join</span>
                <Send className="w-3 h-3" />
              </button>
            </form>
          </div>
        </div>

        {/* Contact Info Pills Strip */}
        <div className="flex flex-wrap items-center justify-center gap-4 sm:gap-8 text-xs text-gray-300">
          {footer.phone && (
            <div className="flex items-center gap-2">
              <Phone className="w-4 h-4 text-accent-gold shrink-0" />
              <span>{footer.phone}</span>
            </div>
          )}
          {footer.email && (
            <div className="flex items-center gap-2">
              <Mail className="w-4 h-4 text-accent-gold shrink-0" />
              <span>{footer.email}</span>
            </div>
          )}
          {footer.address && (
            <div className="flex items-center gap-2">
              <MapPin className="w-4 h-4 text-accent-gold shrink-0" />
              <span>{footer.address}</span>
            </div>
          )}
          {footer.workingHours && (
            <div className="flex items-center gap-2 hidden md:flex">
              <Clock className="w-4 h-4 text-accent-gold shrink-0" />
              <span>{footer.workingHours}</span>
            </div>
          )}
        </div>

        {/* Payment Methods */}
        {footer.showPaymentIcons && (
          <div className="flex flex-wrap items-center justify-center gap-4">
            <img src="/images/payments/only-bkash-icon.svg" alt="bKash" className="h-8 sm:h-9 w-auto object-contain" />
            <img src="/images/payments/cod.png" alt="Cash on Delivery" className="h-10 w-auto object-contain" />
          </div>
        )}

        {/* Copyright & Creator Credit */}
        <div className="pt-6 border-t border-white/10 text-xs text-gray-400 flex flex-col sm:flex-row items-center justify-between gap-3 text-center sm:text-left">
          <p className="text-[11px]">
            {footer.copyrightText || "© 2026 Dream Fashion Bangladesh. All rights reserved."}
          </p>
          <p className="text-gray-300 text-xs flex items-center gap-1.5 justify-center">
            <span>Made with</span>
            <span className="text-red-500 inline-block animate-pulse text-sm">❤️</span>
            <span>by</span>
            <a
              href={footer.creatorUrl || "https://facebook.com/hodako17"}
              target="_blank"
              rel="noopener noreferrer"
              className="text-white hover:text-accent-gold font-semibold underline underline-offset-4 decoration-white/40 hover:decoration-accent-gold transition-colors inline-flex items-center gap-1"
            >
              {footer.creatorName || "Azizul Hakim Khan"}
            </a>
          </p>
        </div>
      </div>
    </footer>
  );
}
