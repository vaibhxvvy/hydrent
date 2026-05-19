"use client";

import { create } from "zustand";

type OnboardingState = {
  dismissed: boolean;
  setDismissed: (dismissed: boolean) => void;
};

export const useOnboardingStore = create<OnboardingState>((set) => ({
  dismissed: false,
  setDismissed: (dismissed) => set({ dismissed }),
}));
