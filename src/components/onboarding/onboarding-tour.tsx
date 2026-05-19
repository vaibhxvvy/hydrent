"use client";

import { useSyncExternalStore } from "react";
import { motion } from "framer-motion";
import { EyeOff, Scale, ShieldCheck, UsersRound, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useOnboardingStore } from "@/components/onboarding/onboarding-store";

const points = [
  {
    icon: ShieldCheck,
    title: "Confidence scores",
    text: "Every range is labeled with sample density, verification ratio, variance, and freshness.",
  },
  {
    icon: UsersRound,
    title: "Community moderation",
    text: "Rent claims are weighted by reputation and checked by nearby consensus instead of a single admin decision.",
  },
  {
    icon: Scale,
    title: "Robust statistics",
    text: "HydRent uses weighted medians, percentile bands, time decay, and anomaly-resistant scoring.",
  },
  {
    icon: EyeOff,
    title: "Privacy first",
    text: "Proofs stay private, sensitive details are not exposed, and public pages show aggregated ranges only.",
  },
];

export function OnboardingTour() {
  const storeDismissed = useOnboardingStore((state) => state.dismissed);
  const setDismissed = useOnboardingStore((state) => state.setDismissed);
  const persistedDismissed = useSyncExternalStore(
    subscribeToStorage,
    getDismissedSnapshot,
    getServerDismissedSnapshot,
  );
  const dismissed = storeDismissed || persistedDismissed === "true";

  function close() {
    window.localStorage.setItem("hydrent:onboarding-dismissed", "true");
    setDismissed(true);
  }

  if (dismissed) return null;

  return (
    <motion.aside
      initial={{ opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      className="fixed inset-x-3 bottom-3 z-50 mx-auto max-w-3xl rounded-lg border bg-card p-4 shadow-xl sm:bottom-5 sm:p-5"
      aria-label="HydRent onboarding"
    >
      <div className="flex items-start justify-between gap-4">
        <div>
          <p className="text-sm font-semibold">Reading HydRent data</p>
          <p className="mt-1 text-sm text-muted-foreground">
            The platform favors verified closed rents and explains the confidence behind every
            number.
          </p>
        </div>
        <Button variant="ghost" size="icon" onClick={close} aria-label="Dismiss onboarding">
          <X className="size-4" />
        </Button>
      </div>
      <div className="mt-4 grid gap-3 sm:grid-cols-2">
        {points.map((point) => (
          <div key={point.title} className="flex gap-3 rounded-md border bg-background p-3">
            <point.icon className="mt-0.5 size-4 shrink-0 text-primary" aria-hidden="true" />
            <div>
              <p className="text-sm font-medium">{point.title}</p>
              <p className="mt-1 text-xs leading-5 text-muted-foreground">{point.text}</p>
            </div>
          </div>
        ))}
      </div>
    </motion.aside>
  );
}

function subscribeToStorage(callback: () => void) {
  window.addEventListener("storage", callback);
  return () => window.removeEventListener("storage", callback);
}

function getDismissedSnapshot() {
  return window.localStorage.getItem("hydrent:onboarding-dismissed") ?? "false";
}

function getServerDismissedSnapshot() {
  return "true";
}
