"use client";

import { useState, useCallback } from "react";
import Link from "next/link";
import { motion, AnimatePresence } from "framer-motion";
import { MapPin } from "lucide-react";
import { InteractiveMap } from "@/components/maps/interactive-map";
import { Button } from "@/components/ui/button";

interface MapLocality {
  id: string;
  name: string;
  slug: string;
  zone: string;
  lat: number;
  lng: number;
  submissionCount: number;
  confidenceScore: number;
  median2BHK: number | null;
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

      {/* Full-screen map overlay */}
      <AnimatePresence>
        {mapOpen && (
          <motion.div
            key="fullscreen-map"
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.95 }}
            transition={{ duration: 0.3, ease: [0.2, 0, 0, 1] }}
            className="fixed inset-0 z-[9999] bg-[#0a0f0a]"
          >
            <div className="relative h-full w-full">
              <InteractiveMap
                localities={mapLocalities}
                onClose={closeMap}
                standalone={true}
              />
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Floating Explore CTA */}
      {mapLocalities.length > 0 && !mapOpen && (
        <motion.div
          initial={{ opacity: 0, y: 40 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 1.5, duration: 0.5, ease: [0.2, 0, 0, 1] }}
          className="fixed bottom-6 left-1/2 z-50 -translate-x-1/2"
        >
          <Button
            onClick={() => setMapOpen(true)}
            className="rounded-full bg-[#22c55e] text-[#0a0f0a] hover:bg-[#16a34a] px-6 py-3 font-semibold shadow-level-3 animate-pulse-glow"
          >
            <MapPin className="mr-2 size-4" />
            Explore Hyderabad on map
          </Button>
        </motion.div>
      )}
    </>
  );
}
