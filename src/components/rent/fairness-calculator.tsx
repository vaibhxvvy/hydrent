"use client";

import { useState } from "react";
import { formatINR } from "@/lib/utils";

interface BHKStat {
  bhk: string;
  minRent: number;
  maxRent: number;
  medianRent: number | null;
  count: number;
}

interface Props {
  stats: BHKStat[];
}

export function FairnessCalculator({ stats }: Props) {
  const [inputRent, setInputRent] = useState("");
  const [selectedBHK, setSelectedBHK] = useState(2);

  const bhkStats = stats.find((s) => parseInt(s.bhk) === selectedBHK && s.count > 0);
  const rent = parseInt(inputRent.replace(/,/g, ""), 10);
  const hasValidInput = bhkStats && !isNaN(rent) && rent > 0;

  function getVerdict(): { label: string; color: string; message: string } | null {
    if (!bhkStats || !hasValidInput) return null;
    const p25 = bhkStats.minRent + Math.round((bhkStats.medianRent! - bhkStats.minRent) * 0.33);
    const p75 = bhkStats.medianRent! + Math.round((bhkStats.maxRent - bhkStats.medianRent!) * 0.33);
    if (rent <= p25) return { label: "Great deal", color: "var(--md-sys-color-primary)", message: `Below P25 (${formatINR(p25)}). You're paying less than most renters.` };
    if (rent <= bhkStats.medianRent!) return { label: "Fair price", color: "var(--md-sys-color-secondary)", message: `Between P25 and median. A reasonable rate for ${selectedBHK}BHK.` };
    if (rent <= p75) return { label: "Slightly above median", color: "var(--md-sys-color-tertiary)", message: `Between median and P75. Try negotiating to ${formatINR(bhkStats.medianRent!)}.` };
    return { label: "Overpaying", color: "var(--md-sys-color-error)", message: `Above P75 (${formatINR(p75)}). You're paying more than most. Push back hard.` };
  }

  const verdict = getVerdict();

  return (
    <div className="rounded-[--radius-card] border border-[var(--md-sys-color-outline)] bg-[var(--elevation-level-1)] p-6 mt-6">
      <h3 className="font-bold text-lg text-[var(--md-sys-color-on-surface)] mb-4">Is this rent fair?</h3>

      <div className="flex flex-col sm:flex-row gap-3 mb-4">
        <div className="flex gap-1">
          {[1, 2, 3, 4].map((b) => (
            <button
              key={b}
              onClick={() => setSelectedBHK(b)}
              className={`px-3 py-1.5 rounded-[--radius-sm] text-sm font-medium transition-all ${
                selectedBHK === b
                  ? "bg-[var(--md-sys-color-primary)] text-[var(--md-sys-color-on-primary)]"
                  : "bg-[var(--md-sys-color-surface-container-high)] text-[var(--md-sys-color-on-surface-variant)] hover:text-[var(--md-sys-color-on-surface)]"
              }`}
            >
              {b}BHK
            </button>
          ))}
        </div>
        <input
          type="text"
          inputMode="numeric"
          value={inputRent}
          onChange={(e) => setInputRent(e.target.value.replace(/[^0-9]/g, ""))}
          placeholder="Enter your monthly rent..."
          className="flex-1 h-10 rounded-[--radius-input] border border-[var(--md-sys-color-outline)] bg-[var(--md-sys-color-surface-container)] px-3 text-sm font-mono text-[var(--md-sys-color-on-surface)] placeholder:text-[var(--md-sys-color-on-surface-variant)] outline-none focus:border-[var(--md-sys-color-primary)]"
        />
      </div>

      {verdict && (
        <div
          className="rounded-[--radius-md] p-4"
          style={{
            background: `${verdict.color}15`,
            border: `1px solid ${verdict.color}30`,
          }}
        >
          <p className="font-semibold text-sm" style={{ color: verdict.color }}>{verdict.label}</p>
          <p className="text-xs text-[var(--md-sys-color-on-surface-variant)] mt-1">{verdict.message}</p>
        </div>
      )}

      {!verdict && (
        <p className="text-xs text-[var(--md-sys-color-on-surface-variant)]">
          {!bhkStats ? "No data for this BHK type yet." : "Enter a rent amount to check."}
        </p>
      )}
    </div>
  );
}
