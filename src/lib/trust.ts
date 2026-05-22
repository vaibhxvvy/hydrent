import { ShieldCheck, ShieldAlert, ShieldQuestion } from "lucide-react";
import type { LucideIcon } from "lucide-react";

export function TrustSignal(score: number): { icon: LucideIcon; color: string } {
  if (score >= 70) {
    return { icon: ShieldCheck, color: "var(--md-sys-color-primary)" };
  }
  if (score >= 40) {
    return { icon: ShieldQuestion, color: "var(--md-sys-color-tertiary)" };
  }
  return { icon: ShieldAlert, color: "var(--md-sys-color-error)" };
}
