"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import Image from "next/image";
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

function TiktokIcon(props: React.SVGProps<SVGSVGElement>) {
  return (
    <svg viewBox="0 0 24 24" width="16" height="16" fill="currentColor" {...props}>
      <path d="M12.525.02c1.31-.02 2.61-.01 3.91-.02.08 1.53.63 3.09 1.75 4.17 1.12 1.11 2.7 1.62 4.24 1.79v4.03c-1.44-.05-2.89-.35-4.2-.97-.57-.26-1.1-.59-1.62-.93-.01 2.92.01 5.84-.02 8.75-.08 1.4-.54 2.79-1.35 3.94-1.31 1.92-3.58 3.17-5.91 3.21-1.43.08-2.86-.31-4.08-1.03-2.02-1.19-3.44-3.37-3.65-5.71-.02-.5-.03-1-.01-1.49.18-1.9 1.12-3.72 2.58-4.96 1.66-1.44 3.98-2.13 6.15-1.72.02 1.48-.04 2.96-.04 4.44-.99-.32-2.15-.23-3.02.37-.63.41-1.11 1.04-1.36 1.75-.21.51-.24 1.07-.14 1.61.24 1.64 1.82 3.02 3.5 2.87 1.12-.01 2.19-.66 2.77-1.61.19-.33.4-.67.41-1.06.1-1.79.06-3.57.07-5.36.01-4.03-.01-8.05.02-12.07z"/>
    </svg>
  );
}

function TwitterIcon(props: React.SVGProps<SVGSVGElement>) {
  return (
    <svg viewBox="0 0 24 24" width="14" height="14" fill="currentColor" {...props}>
      <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z"/>
    </svg>
  );
}

function PinterestIcon(props: React.SVGProps<SVGSVGElement>) {
  return (
    <svg viewBox="0 0 24 24" width="16" height="16" fill="currentColor" {...props}>
      <path d="M12 0c-6.627 0-12 5.372-12 12 0 5.084 3.163 9.426 7.627 11.174-.105-.949-.2-2.405.042-3.441.218-.937 1.407-5.965 1.407-5.965s-.359-.719-.359-1.782c0-1.668.967-2.914 2.171-2.914 1.023 0 1.518.769 1.518 1.69 0 1.029-.655 2.568-.994 3.995-.283 1.194.599 2.169 1.777 2.169 2.133 0 3.772-2.249 3.772-5.495 0-2.873-2.064-4.882-5.012-4.882-3.414 0-5.418 2.561-5.418 5.207 0 1.031.397 2.138.893 2.738.098.119.112.224.083.345-.09.375-.293 1.199-.334 1.363-.053.225-.172.271-.401.165-1.495-.69-2.433-2.878-2.433-4.646 0-3.776 2.748-7.252 7.92-7.252 4.158 0 7.392 2.967 7.392 6.923 0 4.135-2.607 7.462-6.233 7.462-1.214 0-2.354-.629-2.758-1.379l-.749 2.848c-.269 1.045-1.004 2.352-1.498 3.146 1.123.345 2.306.535 3.55.535 6.607 0 12-5.373 12-12 0-6.628-5.393-12-12-12z"/>
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
      if (typeof window !== "undefined") {
        const stored = localStorage.getItem("dream_footer_settings");
        if (stored) {
          try {
            const parsed = JSON.parse(stored) as FooterSettings;
            setFooter(parsed);
          } catch (e) {}
        }
      }

      try {
        const snap = await getDoc(doc(db, "settings", "footer"));
        if (snap.exists()) {
          const footData = snap.data() as FooterSettings;
          setFooter(footData);
          if (typeof window !== "undefined") {
            try {
              localStorage.setItem("dream_footer_settings", JSON.stringify(footData));
            } catch (e) {}
          }
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
            <div className="flex flex-wrap items-center justify-center lg:justify-start gap-2.5 pt-2">
              {footer.facebookUrl && (
                <a
                  href={footer.facebookUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="w-8 h-8 rounded-full bg-white/10 hover:bg-[#1877F2] text-white flex items-center justify-center transition-all hover:scale-110 active:scale-95 shadow-sm"
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
                  className="w-8 h-8 rounded-full bg-white/10 hover:bg-[#E4405F] text-white flex items-center justify-center transition-all hover:scale-110 active:scale-95 shadow-sm"
                  aria-label="Instagram"
                >
                  <InstagramIcon />
                </a>
              )}
              {footer.tiktokUrl && (
                <a
                  href={footer.tiktokUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="w-8 h-8 rounded-full bg-white/10 hover:bg-black text-white flex items-center justify-center transition-all hover:scale-110 active:scale-95 shadow-sm border border-white/20"
                  aria-label="TikTok"
                >
                  <TiktokIcon />
                </a>
              )}
              {footer.youtubeUrl && (
                <a
                  href={footer.youtubeUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="w-8 h-8 rounded-full bg-white/10 hover:bg-[#CD201F] text-white flex items-center justify-center transition-all hover:scale-110 active:scale-95 shadow-sm"
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
                  className="w-8 h-8 rounded-full bg-white/10 hover:bg-[#25D366] text-white flex items-center justify-center transition-all hover:scale-110 active:scale-95 shadow-sm"
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
                  className="w-8 h-8 rounded-full bg-white/10 hover:bg-[#0A66C2] text-white flex items-center justify-center transition-all hover:scale-110 active:scale-95 shadow-sm"
                  aria-label="LinkedIn"
                >
                  <LinkedinIcon />
                </a>
              )}
              {footer.twitterUrl && (
                <a
                  href={footer.twitterUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="w-8 h-8 rounded-full bg-white/10 hover:bg-black text-white flex items-center justify-center transition-all hover:scale-110 active:scale-95 shadow-sm border border-white/20"
                  aria-label="Twitter / X"
                >
                  <TwitterIcon />
                </a>
              )}
              {footer.pinterestUrl && (
                <a
                  href={footer.pinterestUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="w-8 h-8 rounded-full bg-white/10 hover:bg-[#BD081C] text-white flex items-center justify-center transition-all hover:scale-110 active:scale-95 shadow-sm"
                  aria-label="Pinterest"
                >
                  <PinterestIcon />
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
            <Image
              src="/images/payments/only-bkash-icon.svg"
              alt="bKash"
              width={48}
              height={36}
              className="h-8 sm:h-9 w-auto object-contain"
            />
            <Image
              src="/images/payments/cod.avif"
              alt="Cash on Delivery"
              width={120}
              height={40}
              className="h-10 w-auto object-contain"
            />
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
