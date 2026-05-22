import { DotmSquare12 } from "@/components/ui/dotm-square-12";

export default function Loading() {
  return (
    <div className="mx-auto flex min-h-[60vh] max-w-7xl flex-col items-center justify-center px-4">
      <DotmSquare12
        size={48}
        dotSize={5}
        speed={1.35}
        pattern="full"
        colorPreset="solid-theme"
        animated
        opacityBase={0.12}
        opacityMid={0.42}
        opacityPeak={1}
      />
      <p className="mt-4 text-xs text-[var(--md-sys-color-on-surface-variant)] animate-pulse">
        Loading...
      </p>
    </div>
  );
}
