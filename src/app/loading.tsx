export default function Loading() {
  return (
    <div className="mx-auto grid max-w-7xl gap-4 px-4 py-8 sm:px-6 md:grid-cols-3">
      {[0, 1, 2].map((item) => (
        <div key={item} className="animate-pulse rounded-xl border border-[#1f2b1f] bg-[#111811] p-5">
          <div className="h-4 w-24 rounded bg-[#1f2b1f]" />
          <div className="mt-5 h-8 w-32 rounded bg-[#1f2b1f]" />
          <div className="mt-4 h-3 w-full rounded bg-[#1f2b1f]" />
        </div>
      ))}
    </div>
  );
}
