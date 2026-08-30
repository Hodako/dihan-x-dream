"use client";

import { useState, useEffect } from "react";
import {
  FileText,
  Save,
  RefreshCw,
  Phone,
  Mail,
  MapPin,
  Clock,
  MessageCircle,
  Sparkles,
  Plus,
  Trash2,
  Eye,
  Check,
  Share2,
  Globe,
} from "lucide-react";
import { FooterSettings, FooterLink } from "@/types";
import { INITIAL_FOOTER_SETTINGS } from "@/lib/seedData";
import { useUIStore } from "@/store/useUIStore";
import { doc, getDoc, setDoc } from "firebase/firestore";
import { db } from "@/lib/firebase";

export default function AdminFooterPage() {
  const { addToast } = useUIStore();
  const [footer, setFooter] = useState<FooterSettings>(INITIAL_FOOTER_SETTINGS);
  const [isSaving, setIsSaving] = useState(false);
  const [newQuickLabel, setNewQuickLabel] = useState("");
  const [newQuickUrl, setNewQuickUrl] = useState("");
  const [newPolicyLabel, setNewPolicyLabel] = useState("");
  const [newPolicyUrl, setNewPolicyUrl] = useState("");

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

  const handleSaveFooter = async () => {
    setIsSaving(true);
    try {
      await setDoc(doc(db, "settings", "footer"), footer);
      addToast("Footer information saved and live on storefront!", "success");
    } catch (e: any) {
      addToast(e.message || "Failed to save footer settings", "error");
    } finally {
      setIsSaving(false);
    }
  };

  const handleAddQuickLink = () => {
    if (!newQuickLabel.trim() || !newQuickUrl.trim()) return;
    setFooter((prev) => ({
      ...prev,
      quickLinks: [...(prev.quickLinks || []), { label: newQuickLabel.trim(), url: newQuickUrl.trim() }],
    }));
    setNewQuickLabel("");
    setNewQuickUrl("");
  };

  const handleRemoveQuickLink = (idx: number) => {
    setFooter((prev) => ({
      ...prev,
      quickLinks: prev.quickLinks.filter((_, i) => i !== idx),
    }));
  };

  const handleAddPolicyLink = () => {
    if (!newPolicyLabel.trim() || !newPolicyUrl.trim()) return;
    setFooter((prev) => ({
      ...prev,
      policyLinks: [...(prev.policyLinks || []), { label: newPolicyLabel.trim(), url: newPolicyUrl.trim() }],
    }));
    setNewPolicyLabel("");
    setNewPolicyUrl("");
  };

  const handleRemovePolicyLink = (idx: number) => {
    setFooter((prev) => ({
      ...prev,
      policyLinks: prev.policyLinks.filter((_, i) => i !== idx),
    }));
  };

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-admin-border-light">
        <div>
          <span className="text-[11px] font-bold tracking-[0.2em] uppercase text-admin-text-secondary block">
            STOREFRONT CONTENT CMS
          </span>
          <h1 className="font-heading text-2xl sm:text-3xl font-bold uppercase tracking-wider text-admin-text-primary-light mt-1 flex items-center gap-2">
            <FileText className="w-6 h-6 text-admin-accent" />
            <span>Footer Information & CMS</span>
          </h1>
          <p className="text-xs text-admin-text-secondary-light mt-1">
            Customize contact phone, email, address, developer credit, social links, and policy menus.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={handleSaveFooter}
            disabled={isSaving}
            className="px-5 py-2.5 bg-admin-accent hover:bg-admin-accent-hover text-white rounded-lg text-xs font-bold uppercase tracking-wider flex items-center gap-2 transition-all shadow-md active:scale-95 cursor-pointer disabled:opacity-50"
          >
            {isSaving ? (
              <span className="df-spinner df-spinner--sm" />
            ) : (
              <>
                <Save className="w-4 h-4" />
                <span>Save Footer Info</span>
              </>
            )}
          </button>
        </div>
      </div>

      {/* Main Grid: Form Settings (7 cols) & Live Preview (5 cols) */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
        {/* Settings Forms (7 cols) */}
        <div className="lg:col-span-7 space-y-6">
          {/* 1. Brand Identity */}
          <div className="bg-white p-6 rounded-2xl border border-admin-border-light shadow-2xs space-y-4">
            <h2 className="text-xs font-bold uppercase tracking-wider text-admin-text-primary-light flex items-center gap-2 border-b border-admin-border-light pb-2">
              <Sparkles className="w-4 h-4 text-admin-accent" />
              <span>1. Brand Identity & Bio</span>
            </h2>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
              <div>
                <label className="block font-bold uppercase text-ink-700 mb-1">
                  Brand Display Name
                </label>
                <input
                  type="text"
                  value={footer.brandName}
                  onChange={(e) => setFooter({ ...footer, brandName: e.target.value })}
                  placeholder="Dream Fashion"
                  className="w-full p-2.5 bg-bg-subtle border border-line-200 rounded font-semibold text-ink-900 focus:outline-none focus:border-admin-accent"
                />
              </div>

              <div>
                <label className="block font-bold uppercase text-ink-700 mb-1">
                  Copyright Notice
                </label>
                <input
                  type="text"
                  value={footer.copyrightText}
                  onChange={(e) => setFooter({ ...footer, copyrightText: e.target.value })}
                  placeholder="© 2026 Dream Fashion Bangladesh. All rights reserved."
                  className="w-full p-2.5 bg-bg-subtle border border-line-200 rounded text-ink-900 focus:outline-none focus:border-admin-accent"
                />
              </div>
            </div>

            <div>
              <label className="block font-bold uppercase text-ink-700 text-xs mb-1">
                Brand Tagline / Description
              </label>
              <textarea
                rows={2}
                value={footer.brandTagline}
                onChange={(e) => setFooter({ ...footer, brandTagline: e.target.value })}
                placeholder="Modern fashion platform for Bangladesh..."
                className="w-full p-2.5 bg-bg-subtle border border-line-200 rounded text-xs text-ink-900 focus:outline-none focus:border-admin-accent"
              />
            </div>
          </div>

          {/* 2. Contact Hotline & Location */}
          <div className="bg-white p-6 rounded-2xl border border-admin-border-light shadow-2xs space-y-4">
            <h2 className="text-xs font-bold uppercase tracking-wider text-admin-text-primary-light flex items-center gap-2 border-b border-admin-border-light pb-2">
              <Phone className="w-4 h-4 text-admin-accent" />
              <span>2. Contact Details & Location</span>
            </h2>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
              <div>
                <label className="block font-bold uppercase text-ink-700 mb-1">
                  Hotline Phone Number
                </label>
                <input
                  type="text"
                  value={footer.phone}
                  onChange={(e) => setFooter({ ...footer, phone: e.target.value })}
                  placeholder="+880 1700-000000"
                  className="w-full p-2.5 bg-bg-subtle border border-line-200 rounded font-mono text-ink-900 focus:outline-none focus:border-admin-accent"
                />
              </div>

              <div>
                <label className="block font-bold uppercase text-ink-700 mb-1">
                  WhatsApp Support Number
                </label>
                <input
                  type="text"
                  value={footer.whatsapp || ""}
                  onChange={(e) => setFooter({ ...footer, whatsapp: e.target.value })}
                  placeholder="+880 1700-000000"
                  className="w-full p-2.5 bg-bg-subtle border border-line-200 rounded font-mono text-ink-900 focus:outline-none focus:border-admin-accent"
                />
              </div>

              <div>
                <label className="block font-bold uppercase text-ink-700 mb-1">
                  Customer Support Email
                </label>
                <input
                  type="email"
                  value={footer.email}
                  onChange={(e) => setFooter({ ...footer, email: e.target.value })}
                  placeholder="support@dreamfashion.com.bd"
                  className="w-full p-2.5 bg-bg-subtle border border-line-200 rounded font-mono text-ink-900 focus:outline-none focus:border-admin-accent"
                />
              </div>

              <div>
                <label className="block font-bold uppercase text-ink-700 mb-1">
                  Working Hours
                </label>
                <input
                  type="text"
                  value={footer.workingHours || ""}
                  onChange={(e) => setFooter({ ...footer, workingHours: e.target.value })}
                  placeholder="Saturday – Thursday: 10:00 AM – 9:00 PM"
                  className="w-full p-2.5 bg-bg-subtle border border-line-200 rounded text-ink-900 focus:outline-none focus:border-admin-accent"
                />
              </div>
            </div>

            <div>
              <label className="block font-bold uppercase text-ink-700 text-xs mb-1">
                Showroom / Office Address
              </label>
              <input
                type="text"
                value={footer.address}
                onChange={(e) => setFooter({ ...footer, address: e.target.value })}
                placeholder="House 12, Road 4, Sector 3, Uttara, Dhaka, Bangladesh"
                className="w-full p-2.5 bg-bg-subtle border border-line-200 rounded text-xs text-ink-900 focus:outline-none focus:border-admin-accent"
              />
            </div>
          </div>

          {/* 3. Social Media & Creator Credit */}
          <div className="bg-white p-6 rounded-2xl border border-admin-border-light shadow-2xs space-y-4">
            <h2 className="text-xs font-bold uppercase tracking-wider text-admin-text-primary-light flex items-center gap-2 border-b border-admin-border-light pb-2">
              <Share2 className="w-4 h-4 text-admin-accent" />
              <span>3. Social Channels & Developer Credit</span>
            </h2>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
              <div>
                <label className="block font-bold uppercase text-ink-700 mb-1">
                  Facebook Page / Profile URL
                </label>
                <input
                  type="url"
                  value={footer.facebookUrl || ""}
                  onChange={(e) => setFooter({ ...footer, facebookUrl: e.target.value })}
                  placeholder="https://facebook.com/hodako17"
                  className="w-full p-2.5 bg-bg-subtle border border-line-200 rounded text-ink-900 focus:outline-none focus:border-admin-accent"
                />
              </div>

              <div>
                <label className="block font-bold uppercase text-ink-700 mb-1">
                  Instagram Profile URL
                </label>
                <input
                  type="url"
                  value={footer.instagramUrl || ""}
                  onChange={(e) => setFooter({ ...footer, instagramUrl: e.target.value })}
                  placeholder="https://instagram.com/..."
                  className="w-full p-2.5 bg-bg-subtle border border-line-200 rounded text-ink-900 focus:outline-none focus:border-admin-accent"
                />
              </div>

              <div>
                <label className="block font-bold uppercase text-ink-700 mb-1">
                  Creator / Developer Name
                </label>
                <input
                  type="text"
                  value={footer.creatorName || ""}
                  onChange={(e) => setFooter({ ...footer, creatorName: e.target.value })}
                  placeholder="Azizul Hakim Khan"
                  className="w-full p-2.5 bg-bg-subtle border border-line-200 rounded font-semibold text-ink-900 focus:outline-none focus:border-admin-accent"
                />
              </div>

              <div>
                <label className="block font-bold uppercase text-ink-700 mb-1">
                  Creator Profile URL
                </label>
                <input
                  type="url"
                  value={footer.creatorUrl || ""}
                  onChange={(e) => setFooter({ ...footer, creatorUrl: e.target.value })}
                  placeholder="https://facebook.com/hodako17"
                  className="w-full p-2.5 bg-bg-subtle border border-line-200 rounded text-ink-900 focus:outline-none focus:border-admin-accent"
                />
              </div>
            </div>
          </div>

          {/* 4. Policy & Navigation Menus */}
          <div className="bg-white p-6 rounded-2xl border border-admin-border-light shadow-2xs space-y-4">
            <h2 className="text-xs font-bold uppercase tracking-wider text-admin-text-primary-light flex items-center gap-2 border-b border-admin-border-light pb-2">
              <Globe className="w-4 h-4 text-admin-accent" />
              <span>4. Custom Footer Navigation Menus</span>
            </h2>

            {/* Quick Links */}
            <div className="space-y-2">
              <span className="font-bold text-xs uppercase text-ink-800 block">Collections Links</span>
              <div className="flex flex-wrap gap-2">
                {(footer.quickLinks || []).map((l, i) => (
                  <div key={i} className="inline-flex items-center gap-1.5 px-3 py-1 bg-bg-subtle border border-line-200 rounded-full text-xs text-ink-800">
                    <span>{l.label}</span>
                    <button type="button" onClick={() => handleRemoveQuickLink(i)} className="text-red-500 hover:text-red-700 cursor-pointer">
                      <Trash2 className="w-3 h-3" />
                    </button>
                  </div>
                ))}
              </div>
              <div className="flex items-center gap-2 pt-1">
                <input
                  type="text"
                  placeholder="Link Title (e.g. Polos)"
                  value={newQuickLabel}
                  onChange={(e) => setNewQuickLabel(e.target.value)}
                  className="w-1/2 p-2 bg-bg-subtle border border-line-200 rounded text-xs"
                />
                <input
                  type="text"
                  placeholder="/category/polos"
                  value={newQuickUrl}
                  onChange={(e) => setNewQuickUrl(e.target.value)}
                  className="w-1/2 p-2 bg-bg-subtle border border-line-200 rounded text-xs font-mono"
                />
                <button
                  type="button"
                  onClick={handleAddQuickLink}
                  className="px-3 py-2 bg-admin-accent text-white rounded text-xs font-bold shrink-0 cursor-pointer"
                >
                  <Plus className="w-4 h-4" />
                </button>
              </div>
            </div>

            {/* Policy Links */}
            <div className="space-y-2 pt-3 border-t border-line-200">
              <span className="font-bold text-xs uppercase text-ink-800 block">Customer Care Policy Links</span>
              <div className="flex flex-wrap gap-2">
                {(footer.policyLinks || []).map((l, i) => (
                  <div key={i} className="inline-flex items-center gap-1.5 px-3 py-1 bg-bg-subtle border border-line-200 rounded-full text-xs text-ink-800">
                    <span>{l.label}</span>
                    <button type="button" onClick={() => handleRemovePolicyLink(i)} className="text-red-500 hover:text-red-700 cursor-pointer">
                      <Trash2 className="w-3 h-3" />
                    </button>
                  </div>
                ))}
              </div>
              <div className="flex items-center gap-2 pt-1">
                <input
                  type="text"
                  placeholder="Policy Title (e.g. Track Order)"
                  value={newPolicyLabel}
                  onChange={(e) => setNewPolicyLabel(e.target.value)}
                  className="w-1/2 p-2 bg-bg-subtle border border-line-200 rounded text-xs"
                />
                <input
                  type="text"
                  placeholder="/track-order"
                  value={newPolicyUrl}
                  onChange={(e) => setNewPolicyUrl(e.target.value)}
                  className="w-1/2 p-2 bg-bg-subtle border border-line-200 rounded text-xs font-mono"
                />
                <button
                  type="button"
                  onClick={handleAddPolicyLink}
                  className="px-3 py-2 bg-admin-accent text-white rounded text-xs font-bold shrink-0 cursor-pointer"
                >
                  <Plus className="w-4 h-4" />
                </button>
              </div>
            </div>
          </div>
        </div>

        {/* Live Footer Preview Panel (5 cols) */}
        <div className="lg:col-span-5 space-y-4">
          <div className="bg-[#0E0E0E] text-white p-6 rounded-3xl border border-white/10 shadow-xl space-y-6 sticky top-6">
            <div className="flex items-center justify-between border-b border-white/10 pb-3">
              <span className="text-[11px] font-bold uppercase tracking-widest text-accent-gold flex items-center gap-1.5">
                <Eye className="w-4 h-4" />
                <span>Live Footer Preview</span>
              </span>
              <span className="text-[10px] text-gray-400 font-mono">Dynamic</span>
            </div>

            {/* Brand in Preview */}
            <div className="space-y-1 text-center">
              <span className="font-heading text-xl font-black uppercase tracking-wider text-white block italic">
                {footer.brandName || "Dream Fashion"}
              </span>
              <p className="text-[11px] text-gray-400 leading-tight">
                {footer.brandTagline || "Modern trend-forward fashion platform for Bangladesh."}
              </p>
            </div>

            {/* Contact Pills in Preview */}
            <div className="space-y-2 text-[11px] text-gray-300 border-y border-white/10 py-4">
              <div className="flex items-center gap-2">
                <Phone className="w-3.5 h-3.5 text-accent-gold" />
                <span>{footer.phone || "+880 1700-000000"}</span>
              </div>
              <div className="flex items-center gap-2">
                <Mail className="w-3.5 h-3.5 text-accent-gold" />
                <span>{footer.email || "support@dreamfashion.com.bd"}</span>
              </div>
              <div className="flex items-center gap-2">
                <MapPin className="w-3.5 h-3.5 text-accent-gold" />
                <span>{footer.address || "Dhaka, Bangladesh"}</span>
              </div>
            </div>

            {/* Copyright & Creator Credit */}
            <div className="pt-2 text-[11px] text-gray-400 space-y-2 text-center">
              <p>{footer.copyrightText || "© 2026 Dream Fashion Bangladesh."}</p>
              <p className="text-gray-300 flex items-center gap-1 justify-center">
                <span>Made with</span>
                <span className="text-red-500">❤️</span>
                <span>by</span>
                <span className="text-accent-gold font-bold">{footer.creatorName || "Azizul Hakim Khan"}</span>
              </p>
            </div>

            <button
              type="button"
              onClick={handleSaveFooter}
              disabled={isSaving}
              className="w-full py-3 bg-accent-gold hover:bg-amber-400 text-ink-950 font-black text-xs uppercase tracking-wider rounded-xl transition-all shadow-md active:scale-95 cursor-pointer"
            >
              {isSaving ? "Saving..." : "Confirm & Save Changes"}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
