import { DotmSquare20 } from "@/components/ui/dotm-square-20";

export default function Loading() {
  return (
    <div className="mx-auto flex min-h-[60vh] max-w-7xl flex-col items-center justify-center px-4">
      <DotmSquare20
        size={80}
        dotSize={8}
        speed={1.45}
        pattern="diamond"
        colorPreset="solid-theme"
        animated
        opacityBase={0.12}
        opacityMid={0.42}
        opacityPeak={1}
      />
      <p className="mt-6 text-sm text-[var(--md-sys-color-on-surface-variant)] animate-pulse">
        Loading...
      </p>
    </div>
  );
}
