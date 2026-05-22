export default function Loading() {
  return (
    <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6">
      <div className="mb-8">
        <div className="h-8 w-56 animate-pulse rounded-xl bg-[#1f2b1f]" />
        <div className="mt-3 h-4 w-36 animate-pulse rounded-xl bg-[#1f2b1f]" />
      </div>
      <div className="grid gap-4 sm:grid-cols-3">
        {[0, 1, 2].map((item) => (
          <div key={item} className="animate-pulse rounded-[--radius-card] border border-[#1f2b1f] bg-[#111811] p-5">
            <div className="h-4 w-20 rounded-[--radius-input] bg-[#1f2b1f]" />
            <div className="mt-5 h-8 w-28 rounded-[--radius-input] bg-[#1f2b1f]" />
            <div className="mt-4 h-3 w-full rounded-[--radius-input] bg-[#1f2b1f]" />
          </div>
        ))}
      </div>
      <div className="mt-8 grid gap-4 md:grid-cols-3">
        {[0, 1, 2, 3, 4, 5].map((item) => (
          <div key={item} className="animate-pulse rounded-[--radius-card] border border-[#1f2b1f] bg-[#111811] p-5">
            <div className="h-4 w-28 rounded-[--radius-input] bg-[#1f2b1f]" />
            <div className="mt-4 h-6 w-20 rounded-[--radius-input] bg-[#1f2b1f]" />
            <div className="mt-3 h-3 w-3/4 rounded-[--radius-input] bg-[#1f2b1f]" />
            <div className="mt-3 h-3 w-1/2 rounded-[--radius-input] bg-[#1f2b1f]" />
          </div>
        ))}
      </div>
    </div>
  );
}
