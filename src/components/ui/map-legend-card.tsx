"use client";

export function MapLegendCard() {
  return (
    <div className="rounded-[--radius-card] bg-[var(--elevation-level-3)] p-3 shadow-level-2">
      <p className="mb-2 text-xs font-medium text-[var(--md-sys-color-on-surface-variant)]">Confidence</p>
      <div className="flex flex-col gap-1.5">
        {[
          { color: "#14B8A6", label: "High (70+)" },
          { color: "#F59E0B", label: "Medium (40-69)" },
          { color: "#FFB4AB", label: "Low (< 40)" },
          { color: "#6B7280", label: "No data" },
        ].map(({ color, label }) => (
          <div key={label} className="flex items-center gap-2">
            <span className="size-2.5 rounded-full" style={{ backgroundColor: color }} />
            <span className="text-xs text-[var(--md-sys-color-on-surface-variant)]">{label}</span>
          </div>
        ))}
      </div>
    </div>
  );
}
