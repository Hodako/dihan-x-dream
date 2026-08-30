"use client";

import { useState, useEffect, useCallback } from "react";
import { ShieldCheck, Lock, RefreshCw, CheckCircle2 } from "lucide-react";

interface AltchaWidgetProps {
  onVerified?: (payload: string) => void;
  autoVerify?: boolean;
  className?: string;
}

export default function AltchaWidget({
  onVerified,
  autoVerify = true,
  className = "",
}: AltchaWidgetProps) {
  const [status, setStatus] = useState<"idle" | "verifying" | "verified" | "error">("idle");
  const [errorMessage, setErrorMessage] = useState("");

  const solveChallenge = useCallback(async () => {
    setStatus("verifying");
    setErrorMessage("");

    try {
      // 1. Fetch challenge from API
      const res = await fetch("/api/security/altcha");
      if (!res.ok) throw new Error("Could not initialize security challenge.");
      const challengeData = await res.json();

      const { challenge, maxnumber, salt, signature, algorithm } = challengeData;

      // 2. Client-side Proof of Work using Web Crypto API
      let foundNumber: number | null = null;
      const encoder = new TextEncoder();

      for (let i = 0; i <= (maxnumber || 50000); i++) {
        const input = `${salt}${i}`;
        const hashBuf = await crypto.subtle.digest("SHA-256", encoder.encode(input));
        const hashArray = Array.from(new Uint8Array(hashBuf));
        const hashHex = hashArray.map((b) => b.toString(16).padStart(2, "0")).join("");

        if (hashHex === challenge) {
          foundNumber = i;
          break;
        }
      }

      if (foundNumber === null) {
        throw new Error("Security verification timed out.");
      }

      // 3. Construct base64 payload
      const solutionObj = {
        algorithm: algorithm || "SHA-256",
        challenge,
        number: foundNumber,
        salt,
        signature,
      };

      const payload = btoa(JSON.stringify(solutionObj));

      // 4. Verify with server API
      const verifyRes = await fetch("/api/security/altcha", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ payload }),
      });

      const verifyData = await verifyRes.json();
      if (verifyData.verified) {
        setStatus("verified");
        if (onVerified) onVerified(payload);
      } else {
        throw new Error(verifyData.error || "Security verification failed.");
      }
    } catch (err: any) {
      console.error("ALTCHA PoW error:", err);
      setStatus("error");
      setErrorMessage(err.message || "Failed to verify security check.");
    }
  }, [onVerified]);

  useEffect(() => {
    if (autoVerify && status === "idle") {
      solveChallenge();
    }
  }, [autoVerify, solveChallenge, status]);

  if (status === "verified" || (autoVerify && (status === "idle" || status === "verifying"))) {
    return null;
  }

  return (
    <div
      className={`p-3 bg-bg-subtle/80 border border-line-200 rounded-xl text-xs flex items-center justify-between gap-3 ${className}`}
    >
      <div className="flex items-center gap-2.5 min-w-0">
        <div
          className={`w-7 h-7 rounded-lg flex items-center justify-center shrink-0 transition-colors ${
            status === "error"
              ? "bg-red-50 text-red-600 border border-red-200"
              : "bg-line-200 text-ink-700"
          }`}
        >
          {status === "verifying" ? (
            <RefreshCw className="w-3.5 h-3.5 animate-spin" />
          ) : (
            <ShieldCheck className="w-4 h-4" />
          )}
        </div>

        <div className="min-w-0">
          <div className="flex items-center gap-1.5 font-bold uppercase text-[11px] text-ink-900">
            <span>
              {status === "error"
                ? "Security Check Failed"
                : "Security Verification"}
            </span>
          </div>
          <p className="text-[10px] text-ink-500 truncate">
            {status === "error"
              ? errorMessage
              : "Validating secure session..."}
          </p>
        </div>
      </div>

      <button
        type="button"
        onClick={solveChallenge}
        disabled={status === "verifying"}
        className="px-2.5 py-1 bg-white hover:bg-line-100 text-ink-900 border border-line-200 rounded-lg text-[10px] font-bold uppercase transition-all shrink-0 cursor-pointer disabled:opacity-50"
      >
        {status === "verifying" ? "Checking..." : "Retry"}
      </button>
    </div>
  );
}
