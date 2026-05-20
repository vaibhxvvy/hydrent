"use client";

import { useState, useCallback } from "react";
import Link from "next/link";
import { motion, AnimatePresence } from "framer-motion";
import { MapPin } from "lucide-react";
import { InteractiveMap } from "@/components/maps/interactive-map";
import { Button } from "@/components/ui/button";

interface MapLocality {
  id: string; name: string; slug: string; zone: string;
  lat: number; lng: number; submissionCount: number; confidenceScore: number; median2BHK: number | null;
  bhkBreakdown: Array<{ bhk: string; count: number; minRent: number; maxRent: number; medianRent: number | null }>;
  furnishingBreakdown: Array<{ furnishing: string; count: number }>;
  avgTrustScore: number; avgRent: number; minRent: number; maxRent: number;
}

export function HomeClient({ children, mapLocalities }: {
  children: React.ReactNode;
  mapLocalities: MapLocality[];
}) {
  const [mapOpen, setMapOpen] = useState(false);
  const closeMap = useCallback(() => setMapOpen(false), []);

  return (
    <>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 0.4, ease: [0.2, 0, 0, 1] }}
      >
        {children}
      </motion.div>

      <AnimatePresence>
        {mapOpen && (
          <motion.div
            key="fullscreen-map"
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.95 }}
            transition={{ duration: 0.3, ease: [0.2, 0, 0, 1] }}
            className="fixed inset-0 z-[9999] bg-[var(--md-sys-color-background)]"
          >
            <div className="relative h-full w-full">
              <InteractiveMap localities={mapLocalities} onClose={closeMap} standalone />
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {mapLocalities.length > 0 && !mapOpen && (
        <motion.div
          initial={{ opacity: 0, y: 40 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 1.5, duration: 0.5, ease: [0.2, 0, 0, 1] }}
          className="fixed bottom-6 left-1/2 z-50 -translate-x-1/2"
        >
          <Button
            onClick={() => setMapOpen(true)}
            className="shadow-level-3 animate-pulse-glow gap-2"
          >
            <MapPin className="size-4" />
            Explore Hyderabad on map
          </Button>
        </motion.div>
      )}
    </>
  );
}
