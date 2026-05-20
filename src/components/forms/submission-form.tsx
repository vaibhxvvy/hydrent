"use client";

import { useMemo, useState } from "react";
import { ArrowLeft, ArrowRight, Check, IndianRupee, MapPin } from "lucide-react";
import { submitRentAction } from "@/app/submit/actions";
import { localities } from "@/lib/data/hyderabad";
import { formatINR } from "@/lib/utils";

const BHK_OPTIONS = ["1RK", "1BHK", "2BHK", "3BHK", "4BHK", "5+"] as const;
const FURNISHING_OPTIONS = ["FULLY_FURNISHED", "SEMI_FURNISHED", "UNFURNISHED"] as const;
const SUBMITTER_OPTIONS = [
  { value: "tenant", label: "Tenant 🏠", points: 15 },
  { value: "owner", label: "Owner 🔑", points: 10 },
  { value: "broker", label: "Broker 💼", points: 0 },
] as const;
const RENT_TYPE_OPTIONS = [
  { value: "CLOSED", label: "Closed deal", points: 40 },
  { value: "RENEWED", label: "Renewal", points: 30 },
  { value: "ASKING", label: "Asking price", points: 20 },
] as const;

const STEPS = [
  "Where's your flat?",
  "About the flat",
  "Trust score",
  "Confirmation",
];

export function SubmissionForm() {
  const [step, setStep] = useState(0);
  const [submitted, setSubmitted] = useState(false);

  // Step 1 state
  const [locality, setLocality] = useState("");
  const [microLocality, setMicroLocality] = useState("");

  // Step 2 state
  const [bhk, setBhk] = useState("");
  const [rentAmount, setRentAmount] = useState(25000);
  const [maintenanceAmount, setMaintenanceAmount] = useState(0);
  const [maintenanceIncluded, setMaintenanceIncluded] = useState(true);
  const [furnishing, setFurnishing] = useState("SEMI_FURNISHED");
  const [securityDeposit, setSecurityDeposit] = useState(100000);
  const [moveInDate, setMoveInDate] = useState("");

  // Step 3 state
  const [submitterType, setSubmitterType] = useState("");
  const [rentType, setRentType] = useState("CLOSED");
  const [email, setEmail] = useState("");

  const effective = useMemo(() => rentAmount + (maintenanceIncluded ? 0 : maintenanceAmount), [rentAmount, maintenanceAmount, maintenanceIncluded]);

  const trustScore = useMemo(() => {
    let score = 0;
    const rentTypePoints = RENT_TYPE_OPTIONS.find((r) => r.value === rentType)?.points ?? 0;
    const submitterPoints = SUBMITTER_OPTIONS.find((s) => s.value === submitterType)?.points ?? 0;

    score += rentTypePoints;
    score += submitterPoints;
    score += rentAmount > 0 ? 10 : 0;
    score += email ? 10 : 0;
    score += moveInDate ? 5 : 0;
    score += securityDeposit > 0 ? 5 : 0;
    score += bhk ? 5 : 0;

    if (submitterType === "broker") {
      score = Math.min(score, 30);
    }

    return Math.min(100, score);
  }, [rentType, submitterType, rentAmount, email, moveInDate, securityDeposit, bhk]);

  const canProceed = useMemo(() => {
    switch (step) {
      case 0: return !!locality;
      case 1: return !!bhk && rentAmount >= 1000;
      case 2: return true; // all optional
      default: return false;
    }
  }, [step, locality, bhk, rentAmount]);

  const handleSubmit = async () => {
    // Build form data and submit
    const formData = new FormData();
    formData.append("localitySlug", locality);
    formData.append("microLocality", microLocality || locality);
    formData.append("bhk", bhk);
    formData.append("rentType", rentType);
    formData.append("furnishing", furnishing);
    formData.append("rentAmount", String(rentAmount));
    formData.append("maintenanceAmount", String(maintenanceAmount));
    formData.append("maintenanceIncluded", String(maintenanceIncluded));
    formData.append("securityDeposit", String(securityDeposit));
    formData.append("moveInDate", moveInDate);
    formData.append("occupancyType", "ANY");
    formData.append("parkingCount", "1");
    formData.append("brokerInvolved", submitterType === "broker" ? "true" : "false");
    formData.append("gatedSociety", "false");
    formData.append("petFriendly", "false");

    await submitRentAction(formData);
    setSubmitted(true);
  };

  if (submitted) {
    return (
      <div className="mx-auto max-w-lg py-12 text-center">
        <div className="mx-auto flex size-20 items-center justify-center rounded-full bg-[#22c55e]/20">
          <svg className="size-10 text-[#22c55e]" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round">
            <polyline className="animate-checkmark" points="20 6 9 17 4 12" />
          </svg>
        </div>
        <h2 className="mt-6 text-2xl font-bold text-[#f0fdf4]">Submitted anonymously ✓</h2>
        <div className="mt-6 rounded-xl border border-[#1f2b1f] bg-[#111811] p-6">
          <p className="text-sm text-[#4b7a4b]">Your trust score</p>
          <p className="mt-1 font-mono text-4xl font-bold text-[#22c55e]">{trustScore}/100</p>
          <div className="mt-3 h-2 overflow-hidden rounded-full bg-[#1f2b1f]">
            <div className="h-full rounded-full bg-[#22c55e] transition-all" style={{ width: `${trustScore}%` }} />
          </div>
          {locality && rentAmount > 0 && (
            <p className="mt-4 text-sm text-[#86efac]">
              {locality} median: ~{formatINR(rentAmount)} · Your rent: {formatINR(rentAmount)}
            </p>
          )}
        </div>
        <div className="mt-6 flex justify-center gap-3">
          <button
            onClick={() => {
              const text = `I just submitted my rent on HydRent! Check out ${locality} rent data.`;
              window.open(`https://wa.me/?text=${encodeURIComponent(text)}`, "_blank");
            }}
            className="rounded-full border border-[#2d3f2d] bg-[#1a221a] px-5 py-2 text-sm font-medium text-[#86efac] hover:bg-[#1f2b1f] transition-colors"
          >
            Share on WhatsApp
          </button>
          <a
            href={`/hyderabad/${locality}`}
            className="rounded-full bg-[#22c55e] px-5 py-2 text-sm font-medium text-[#0a0f0a] hover:bg-[#16a34a] transition-colors"
          >
            Explore {locality} →
          </a>
        </div>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-2xl">
      {/* Progress bar */}
      <div className="flex items-center justify-center gap-2">
        {STEPS.map((label, idx) => (
          <div key={label} className="flex items-center gap-2">
            <div className={`flex size-8 items-center justify-center rounded-full text-sm font-medium transition-all ${
              idx < step
                ? "bg-[#22c55e] text-[#0a0f0a]"
                : idx === step
                  ? "border-2 border-[#22c55e] bg-[#22c55e]/20 text-[#22c55e]"
                  : "border border-[#1f2b1f] text-[#4b7a4b]"
            }`}>
              {idx < step ? <Check className="size-4" /> : idx + 1}
            </div>
            {idx < STEPS.length - 1 && (
              <div className={`h-0.5 w-8 transition-colors ${idx < step ? "bg-[#22c55e]" : "bg-[#1f2b1f]"}`} />
            )}
          </div>
        ))}
      </div>

      <div className="mt-8">
        {/* Step 1: Where's your flat? */}
        {step === 0 && (
          <div className="space-y-6">
            <div className="text-center">
              <h2 className="text-2xl font-bold text-[#f0fdf4]">Where&apos;s your flat?</h2>
              <p className="mt-2 text-[#86efac]">Tap the map or search your locality</p>
            </div>
            <div className="relative">
              <MapPin className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-[#4b7a4b]" />
              <select
                value={locality}
                onChange={(e) => setLocality(e.target.value)}
                className="h-12 w-full rounded-lg border border-[#2d3f2d] bg-[#111811] pl-10 pr-4 text-[#f0fdf4] outline-none focus:border-[#22c55e] focus:shadow-[0_0_0_3px_rgba(34,197,94,0.15)] appearance-none"
              >
                <option value="" className="bg-[#111811]">Select your locality</option>
                {localities.map((l) => (
                  <option key={l.slug} value={l.slug} className="bg-[#111811]">{l.name}</option>
                ))}
              </select>
            </div>
            <input
              value={microLocality}
              onChange={(e) => setMicroLocality(e.target.value)}
              placeholder="Micro-locality / building name (optional)"
              className="h-12 w-full rounded-lg border border-[#2d3f2d] bg-[#111811] px-4 text-[#f0fdf4] placeholder-[#4b7a4b] outline-none focus:border-[#22c55e] focus:shadow-[0_0_0_3px_rgba(34,197,94,0.15)]"
            />
          </div>
        )}

        {/* Step 2: About the flat */}
        {step === 1 && (
          <div className="space-y-6">
            <div className="text-center">
              <h2 className="text-2xl font-bold text-[#f0fdf4]">About the flat</h2>
              <p className="mt-2 text-[#86efac]">Tell us about your rental</p>
            </div>

            {/* BHK selection */}
            <div>
              <p className="mb-3 text-sm font-medium text-[#f0fdf4]">BHK</p>
              <div className="flex gap-2">
                {BHK_OPTIONS.map((opt) => (
                  <button
                    key={opt}
                    onClick={() => setBhk(opt === "5+" ? "4BHK" : opt)}
                    className={`flex-1 rounded-lg py-3 text-sm font-medium transition-all ${
                      bhk === (opt === "5+" ? "4BHK" : opt)
                        ? "bg-[#22c55e] text-[#0a0f0a]"
                        : "border border-[#2d3f2d] bg-[#111811] text-[#86efac] hover:bg-[#1a221a]"
                    }`}
                  >
                    {opt}
                  </button>
                ))}
              </div>
            </div>

            {/* Rent input */}
            <div>
              <p className="mb-3 text-sm font-medium text-[#f0fdf4]">Monthly rent</p>
              <div className="relative">
                <IndianRupee className="pointer-events-none absolute left-4 top-1/2 size-5 -translate-y-1/2 text-[#22c55e]" />
                <input
                  type="number"
                  value={rentAmount}
                  onChange={(e) => setRentAmount(Number(e.target.value))}
                  className="h-14 w-full rounded-lg border border-[#2d3f2d] bg-[#111811] pl-12 pr-4 font-mono text-2xl font-bold text-[#f0fdf4] outline-none focus:border-[#22c55e] focus:shadow-[0_0_0_3px_rgba(34,197,94,0.15)]"
                />
              </div>
            </div>

            {/* Maintenance toggle */}
            <div>
              <p className="mb-3 text-sm font-medium text-[#f0fdf4]">Maintenance</p>
              <div className="flex gap-2">
                <button
                  onClick={() => setMaintenanceIncluded(true)}
                  className={`rounded-lg px-5 py-2.5 text-sm font-medium transition-all ${
                    maintenanceIncluded
                      ? "bg-[#22c55e] text-[#0a0f0a]"
                      : "border border-[#2d3f2d] bg-[#111811] text-[#86efac] hover:bg-[#1a221a]"
                  }`}
                >
                  Included ✓
                </button>
                <button
                  onClick={() => setMaintenanceIncluded(false)}
                  className={`rounded-lg px-5 py-2.5 text-sm font-medium transition-all ${
                    !maintenanceIncluded
                      ? "bg-[#22c55e] text-[#0a0f0a]"
                      : "border border-[#2d3f2d] bg-[#111811] text-[#86efac] hover:bg-[#1a221a]"
                  }`}
                >
                  Not included
                </button>
              </div>
              {!maintenanceIncluded && (
                <input
                  type="number"
                  value={maintenanceAmount}
                  onChange={(e) => setMaintenanceAmount(Number(e.target.value))}
                  placeholder="Maintenance amount"
                  className="mt-3 h-12 w-full rounded-lg border border-[#2d3f2d] bg-[#111811] px-4 font-mono text-[#f0fdf4] placeholder-[#4b7a4b] outline-none focus:border-[#22c55e] focus:shadow-[0_0_0_3px_rgba(34,197,94,0.15)]"
                />
              )}
            </div>

            {/* Furnishing */}
            <div>
              <p className="mb-3 text-sm font-medium text-[#f0fdf4]">Furnishing</p>
              <div className="flex gap-2">
                {FURNISHING_OPTIONS.map((opt) => {
                  const label = opt === "FULLY_FURNISHED" ? "Furnished" : opt === "SEMI_FURNISHED" ? "Semi" : "Unfurnished";
                  return (
                    <button
                      key={opt}
                      onClick={() => setFurnishing(opt)}
                      className={`flex-1 rounded-lg py-3 text-sm font-medium transition-all ${
                        furnishing === opt
                          ? "bg-[#22c55e] text-[#0a0f0a]"
                          : "border border-[#2d3f2d] bg-[#111811] text-[#86efac] hover:bg-[#1a221a]"
                      }`}
                    >
                      {label}
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Other fields */}
            <div className="grid grid-cols-2 gap-4">
              <div>
                <p className="mb-2 text-sm font-medium text-[#f0fdf4]">Security deposit</p>
                <input
                  type="number"
                  value={securityDeposit}
                  onChange={(e) => setSecurityDeposit(Number(e.target.value))}
                  className="h-12 w-full rounded-lg border border-[#2d3f2d] bg-[#111811] px-4 font-mono text-[#f0fdf4] outline-none focus:border-[#22c55e] focus:shadow-[0_0_0_3px_rgba(34,197,94,0.15)]"
                />
              </div>
              <div>
                <p className="mb-2 text-sm font-medium text-[#f0fdf4]">Move-in date</p>
                <input
                  type="date"
                  value={moveInDate}
                  onChange={(e) => setMoveInDate(e.target.value)}
                  className="h-12 w-full rounded-lg border border-[#2d3f2d] bg-[#111811] px-4 text-[#f0fdf4] outline-none focus:border-[#22c55e] focus:shadow-[0_0_0_3px_rgba(34,197,94,0.15)]"
                />
              </div>
            </div>

            {/* Effective cost */}
            <div className="rounded-lg border border-[#22c55e]/30 bg-[#1a221a] p-4">
              <p className="text-sm text-[#4b7a4b]">Effective monthly cost</p>
              <p className="mt-1 font-mono text-2xl font-bold text-[#22c55e]">{formatINR(effective)}</p>
            </div>
          </div>
        )}

        {/* Step 3: Trust score */}
        {step === 2 && (
          <div className="space-y-6">
            <div className="text-center">
              <h2 className="text-2xl font-bold text-[#f0fdf4]">Boost your trust score</h2>
              <p className="mt-2 text-[#86efac]">Optional. Each one increases how much weight your submission gets.</p>
            </div>

            {/* Trust score preview */}
            <div className="rounded-lg border border-[#1f2b1f] bg-[#111811] p-4">
              <div className="flex items-center justify-between">
                <p className="text-sm text-[#4b7a4b]">Current trust score</p>
                <p className="font-mono text-lg font-bold text-[#22c55e]">{trustScore}/100</p>
              </div>
              <div className="mt-2 h-2 overflow-hidden rounded-full bg-[#1f2b1f]">
                <div className="h-full rounded-full bg-[#22c55e] transition-all" style={{ width: `${trustScore}%` }} />
              </div>
            </div>

            {/* Who are you */}
            <div>
              <p className="mb-3 text-sm font-medium text-[#f0fdf4]">Who are you?</p>
              <div className="flex gap-2">
                {SUBMITTER_OPTIONS.map((opt) => (
                  <button
                    key={opt.value}
                    onClick={() => setSubmitterType(opt.value)}
                    className={`flex-1 rounded-lg py-3 text-sm font-medium transition-all ${
                      submitterType === opt.value
                        ? "bg-[#22c55e] text-[#0a0f0a]"
                        : "border border-[#2d3f2d] bg-[#111811] text-[#86efac] hover:bg-[#1a221a]"
                    }`}
                  >
                    {opt.label}<br /><span className={`text-xs ${submitterType === opt.value ? "text-[#0a0f0a]/70" : "text-[#4b7a4b]"}`}>+{opt.points}pts</span>
                  </button>
                ))}
              </div>
            </div>

            {/* Rent type */}
            <div>
              <p className="mb-3 text-sm font-medium text-[#f0fdf4]">Rent type</p>
              <div className="flex gap-2">
                {RENT_TYPE_OPTIONS.map((opt) => (
                  <button
                    key={opt.value}
                    onClick={() => setRentType(opt.value)}
                    className={`flex-1 rounded-lg py-3 text-sm font-medium transition-all ${
                      rentType === opt.value
                        ? "bg-[#22c55e] text-[#0a0f0a]"
                        : "border border-[#2d3f2d] bg-[#111811] text-[#86efac] hover:bg-[#1a221a]"
                    }`}
                  >
                    {opt.label}<br /><span className={`text-xs ${rentType === opt.value ? "text-[#0a0f0a]/70" : "text-[#4b7a4b]"}`}>+{opt.points}pts</span>
                  </button>
                ))}
              </div>
            </div>

            {/* Email */}
            <div>
              <p className="mb-2 text-sm font-medium text-[#f0fdf4]">Email (optional)</p>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="Never shown publicly"
                className="h-12 w-full rounded-lg border border-[#2d3f2d] bg-[#111811] px-4 text-[#f0fdf4] placeholder-[#4b7a4b] outline-none focus:border-[#22c55e] focus:shadow-[0_0_0_3px_rgba(34,197,94,0.15)]"
              />
            </div>
          </div>
        )}

        {/* Step 4: Confirmation */}
        {step === 3 && (
          <div className="space-y-6 text-center">
            <div className="mx-auto flex size-16 items-center justify-center rounded-full bg-[#22c55e]/20">
              <Check className="size-8 text-[#22c55e]" />
            </div>
            <h2 className="text-2xl font-bold text-[#f0fdf4]">Ready to submit?</h2>
            <div className="rounded-xl border border-[#1f2b1f] bg-[#111811] p-6 text-left">
              <div className="space-y-3">
                <div className="flex justify-between text-sm">
                  <span className="text-[#4b7a4b]">Locality</span>
                  <span className="text-[#f0fdf4]">{locality}</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-[#4b7a4b]">BHK</span>
                  <span className="text-[#f0fdf4]">{bhk}</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-[#4b7a4b]">Effective rent</span>
                  <span className="font-mono text-[#f0fdf4]">{formatINR(effective)}</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-[#4b7a4b]">Rent type</span>
                  <span className="text-[#f0fdf4]">{RENT_TYPE_OPTIONS.find((r) => r.value === rentType)?.label}</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-[#4b7a4b]">Trust score</span>
                  <span className="font-mono text-[#22c55e]">{trustScore}/100</span>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Navigation buttons */}
      <div className="mt-8 flex items-center justify-between">
        <div>
          {step > 0 && (
            <button
              onClick={() => setStep(step - 1)}
              className="flex items-center gap-2 rounded-lg border border-[#2d3f2d] px-5 py-2.5 text-sm font-medium text-[#86efac] hover:bg-[#1a221a] transition-colors"
            >
              <ArrowLeft className="size-4" />
              Back
            </button>
          )}
        </div>
        {step < 3 ? (
          <button
            onClick={() => setStep(step + 1)}
            disabled={!canProceed}
            className="flex items-center gap-2 rounded-lg bg-[#22c55e] px-6 py-2.5 text-sm font-medium text-[#0a0f0a] hover:bg-[#16a34a] transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
          >
            Next
            <ArrowRight className="size-4" />
          </button>
        ) : (
          <button
            onClick={handleSubmit}
            className="flex items-center gap-2 rounded-lg bg-[#22c55e] px-6 py-2.5 text-sm font-medium text-[#0a0f0a] hover:bg-[#16a34a] transition-colors"
          >
            Submit rent
            <Check className="size-4" />
          </button>
        )}
      </div>
    </div>
  );
}
