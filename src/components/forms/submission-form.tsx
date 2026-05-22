"use client";

import { useMemo, useState } from "react";
import { ArrowLeft, ArrowRight, Check, IndianRupee, MapPin, Loader2 } from "lucide-react";
import { toast } from "sonner";
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
  const [submitting, setSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState("");

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
    setSubmitting(true);
    setSubmitError("");
    try {
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
      toast.success("Rent submitted — thank you!");
    } catch {
      setSubmitError("Something went wrong. Please try again.");
      toast.error("Failed to submit. Please try again.");
    } finally {
      setSubmitting(false);
    }
  };

  if (submitted) {
    return (
      <div className="mx-auto max-w-lg py-12 text-center">
        <div className="mx-auto flex size-20 items-center justify-center rounded-full bg-[var(--md-sys-color-primary)]/20">
          <svg className="size-10 text-[var(--md-sys-color-primary)]" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round">
            <polyline className="animate-checkmark" points="20 6 9 17 4 12" />
          </svg>
        </div>
        <h2 className="mt-6 text-2xl font-bold text-[var(--md-sys-color-on-surface)]">Submitted anonymously ✓</h2>
        <div className="mt-6 rounded-xl border border-[var(--md-sys-color-outline)] bg-[var(--elevation-level-1)] p-6">
          <p className="text-sm text-[var(--md-sys-color-on-surface-variant)]">Your trust score</p>
          <p className="mt-1 font-mono text-4xl font-bold text-[var(--md-sys-color-primary)]">{trustScore}/100</p>
          <div className="mt-3 h-2 overflow-hidden rounded-full bg-[var(--md-sys-color-outline)]">
            <div className="h-full rounded-full bg-[var(--md-sys-color-primary)] transition-all" style={{ width: `${trustScore}%` }} />
          </div>
          {locality && rentAmount > 0 && (
            <p className="mt-4 text-sm text-[var(--md-sys-color-on-surface-variant)]">
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
            className="rounded-full border border-[var(--md-sys-color-outline)] bg-[var(--md-sys-color-surface-container-high)] px-5 py-2 text-sm font-medium text-[var(--md-sys-color-on-surface-variant)] hover:bg-[var(--md-sys-color-surface-container-high)] transition-colors"
          >
            Share on WhatsApp
          </button>
          <a
            href={`/hyderabad/${locality}`}
            className="rounded-full bg-[var(--md-sys-color-primary)] px-5 py-2 text-sm font-medium text-[var(--md-sys-color-on-primary)] hover:brightness-110 transition-colors"
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
                ? "bg-[var(--md-sys-color-primary)] text-[var(--md-sys-color-on-primary)]"
                : idx === step
                  ? "border-2 border-[var(--md-sys-color-primary)] bg-[var(--md-sys-color-primary)]/20 text-[var(--md-sys-color-primary)]"
                  : "border border-[var(--md-sys-color-outline)] text-[var(--md-sys-color-on-surface-variant)]"
            }`}>
              {idx < step ? <Check className="size-4" /> : idx + 1}
            </div>
            {idx < STEPS.length - 1 && (
              <div className={`h-0.5 w-8 transition-colors ${idx < step ? "bg-[var(--md-sys-color-primary)]" : "bg-[var(--md-sys-color-outline)]"}`} />
            )}
          </div>
        ))}
      </div>

      <div className="mt-8">
        {/* Step 1: Where's your flat? */}
        {step === 0 && (
          <div className="space-y-6">
            <div className="text-center">
              <h2 className="text-2xl font-bold text-[var(--md-sys-color-on-surface)]">Where&apos;s your flat?</h2>
              <p className="mt-2 text-[var(--md-sys-color-on-surface-variant)]">Tap the map or search your locality</p>
            </div>
            <div className="relative">
              <MapPin className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-[var(--md-sys-color-on-surface-variant)]" />
              <select
                value={locality}
                onChange={(e) => setLocality(e.target.value)}
                className="h-12 w-full rounded-lg border border-[var(--md-sys-color-outline)] bg-[var(--elevation-level-1)] pl-10 pr-4 text-[var(--md-sys-color-on-surface)] outline-none focus:border-[var(--md-sys-color-primary)] focus:shadow-[0_0_0_3px_rgba(20,184,166,0.15)] appearance-none"
              >
                <option value="" className="bg-[var(--elevation-level-1)]">Select your locality</option>
                {localities.map((l) => (
                  <option key={l.slug} value={l.slug} className="bg-[var(--elevation-level-1)]">{l.name}</option>
                ))}
              </select>
            </div>
            <input
              value={microLocality}
              onChange={(e) => setMicroLocality(e.target.value)}
              placeholder="Micro-locality / building name (optional)"
              className="h-12 w-full rounded-lg border border-[var(--md-sys-color-outline)] bg-[var(--elevation-level-1)] px-4 text-[var(--md-sys-color-on-surface)] placeholder-[var(--md-sys-color-on-surface-variant)] outline-none focus:border-[var(--md-sys-color-primary)] focus:shadow-[0_0_0_3px_rgba(20,184,166,0.15)]"
            />
          </div>
        )}

        {/* Step 2: About the flat */}
        {step === 1 && (
          <div className="space-y-6">
            <div className="text-center">
              <h2 className="text-2xl font-bold text-[var(--md-sys-color-on-surface)]">About the flat</h2>
              <p className="mt-2 text-[var(--md-sys-color-on-surface-variant)]">Tell us about your rental</p>
            </div>

            {/* BHK selection */}
            <div>
              <p className="mb-3 text-sm font-medium text-[var(--md-sys-color-on-surface)]">BHK</p>
              <div className="flex gap-2">
                {BHK_OPTIONS.map((opt) => (
                  <button
                    key={opt}
                    onClick={() => setBhk(opt === "5+" ? "4BHK" : opt)}
                    className={`flex-1 rounded-lg py-3 text-sm font-medium transition-all ${
                      bhk === (opt === "5+" ? "4BHK" : opt)
                        ? "bg-[var(--md-sys-color-primary)] text-[var(--md-sys-color-on-primary)]"
                        : "border border-[var(--md-sys-color-outline)] bg-[var(--elevation-level-1)] text-[var(--md-sys-color-on-surface-variant)] hover:bg-[var(--md-sys-color-surface-container-high)]"
                    }`}
                  >
                    {opt}
                  </button>
                ))}
              </div>
            </div>

            {/* Rent input */}
                <div>
                  <label htmlFor="monthly-rent" className="mb-3 text-sm font-medium text-[var(--md-sys-color-on-surface)]">Monthly rent</label>
                  <div className="relative">
                    <IndianRupee className="pointer-events-none absolute left-4 top-1/2 size-5 -translate-y-1/2 text-[var(--md-sys-color-primary)]" />
                    <input
                      id="monthly-rent"
                      type="text"
                      inputMode="numeric"
                      pattern="[0-9]*"
                      value={rentAmount}
                      onChange={(e) => setRentAmount(Number(e.target.value.replace(/[^0-9]/g, '')))}
                      autoComplete="off"
                      className="h-14 w-full rounded-lg border border-[var(--md-sys-color-outline)] bg-[var(--elevation-level-1)] pl-12 pr-4 font-mono text-2xl font-bold text-[var(--md-sys-color-on-surface)] outline-none focus:border-[var(--md-sys-color-primary)] focus:shadow-[0_0_0_3px_rgba(20,184,166,0.15)]"
                    />
                  </div>
            </div>

            {/* Maintenance toggle */}
            <div>
              <p className="mb-3 text-sm font-medium text-[var(--md-sys-color-on-surface)]">Maintenance</p>
              <div className="flex gap-2">
                <button
                  onClick={() => setMaintenanceIncluded(true)}
                  className={`rounded-lg px-5 py-2.5 text-sm font-medium transition-all ${
                    maintenanceIncluded
                      ? "bg-[var(--md-sys-color-primary)] text-[var(--md-sys-color-on-primary)]"
                      : "border border-[var(--md-sys-color-outline)] bg-[var(--elevation-level-1)] text-[var(--md-sys-color-on-surface-variant)] hover:bg-[var(--md-sys-color-surface-container-high)]"
                  }`}
                >
                  Included ✓
                </button>
                <button
                  onClick={() => setMaintenanceIncluded(false)}
                  className={`rounded-lg px-5 py-2.5 text-sm font-medium transition-all ${
                    !maintenanceIncluded
                      ? "bg-[var(--md-sys-color-primary)] text-[var(--md-sys-color-on-primary)]"
                      : "border border-[var(--md-sys-color-outline)] bg-[var(--elevation-level-1)] text-[var(--md-sys-color-on-surface-variant)] hover:bg-[var(--md-sys-color-surface-container-high)]"
                  }`}
                >
                  Not included
                </button>
              </div>
              {!maintenanceIncluded && (
                <input
                  type="text"
                  inputMode="numeric"
                  pattern="[0-9]*"
                  value={maintenanceAmount}
                  onChange={(e) => setMaintenanceAmount(Number(e.target.value.replace(/[^0-9]/g, '')))}
                  placeholder="Maintenance amount"
                  autoComplete="off"
                  className="mt-3 h-12 w-full rounded-lg border border-[var(--md-sys-color-outline)] bg-[var(--elevation-level-1)] px-4 font-mono text-[var(--md-sys-color-on-surface)] placeholder-[var(--md-sys-color-on-surface-variant)] outline-none focus:border-[var(--md-sys-color-primary)] focus:shadow-[0_0_0_3px_rgba(20,184,166,0.15)]"
                />
              )}
            </div>

            {/* Furnishing */}
            <div>
              <p className="mb-3 text-sm font-medium text-[var(--md-sys-color-on-surface)]">Furnishing</p>
              <div className="flex gap-2">
                {FURNISHING_OPTIONS.map((opt) => {
                  const label = opt === "FULLY_FURNISHED" ? "Furnished" : opt === "SEMI_FURNISHED" ? "Semi" : "Unfurnished";
                  return (
                    <button
                      key={opt}
                      onClick={() => setFurnishing(opt)}
                      className={`flex-1 rounded-lg py-3 text-sm font-medium transition-all ${
                        furnishing === opt
                          ? "bg-[var(--md-sys-color-primary)] text-[var(--md-sys-color-on-primary)]"
                          : "border border-[var(--md-sys-color-outline)] bg-[var(--elevation-level-1)] text-[var(--md-sys-color-on-surface-variant)] hover:bg-[var(--md-sys-color-surface-container-high)]"
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
                <label htmlFor="security-deposit" className="mb-2 text-sm font-medium text-[var(--md-sys-color-on-surface)]">Security deposit</label>
                <input
                  id="security-deposit"
                  type="text"
                  inputMode="numeric"
                  pattern="[0-9]*"
                  value={securityDeposit}
                  onChange={(e) => setSecurityDeposit(Number(e.target.value.replace(/[^0-9]/g, '')))}
                  autoComplete="off"
                  className="h-12 w-full rounded-lg border border-[var(--md-sys-color-outline)] bg-[var(--elevation-level-1)] px-4 font-mono text-[var(--md-sys-color-on-surface)] outline-none focus:border-[var(--md-sys-color-primary)] focus:shadow-[0_0_0_3px_rgba(20,184,166,0.15)]"
                />
              </div>
              <div>
                <label htmlFor="move-in-date" className="mb-2 text-sm font-medium text-[var(--md-sys-color-on-surface)]">Move-in date</label>
                <input
                  id="move-in-date"
                  type="date"
                  value={moveInDate}
                  onChange={(e) => setMoveInDate(e.target.value)}
                  max={new Date().toISOString().split('T')[0]}
                  className="h-12 w-full rounded-lg border border-[var(--md-sys-color-outline)] bg-[var(--elevation-level-1)] px-4 text-[var(--md-sys-color-on-surface)] outline-none focus:border-[var(--md-sys-color-primary)] focus:shadow-[0_0_0_3px_rgba(20,184,166,0.15)]"
                />
              </div>
            </div>

            {/* Effective cost */}
            <div className="rounded-lg border border-[var(--md-sys-color-primary)]/30 bg-[var(--md-sys-color-surface-container-high)] p-4">
              <p className="text-sm text-[var(--md-sys-color-on-surface-variant)]">Effective monthly cost</p>
              <p className="mt-1 font-mono text-2xl font-bold text-[var(--md-sys-color-primary)]">{formatINR(effective)}</p>
            </div>
          </div>
        )}

        {/* Step 3: Trust score */}
        {step === 2 && (
          <div className="space-y-6">
            <div className="text-center">
              <h2 className="text-2xl font-bold text-[var(--md-sys-color-on-surface)]">Boost your trust score</h2>
              <p className="mt-2 text-[var(--md-sys-color-on-surface-variant)]">Optional. Each one increases how much weight your submission gets.</p>
            </div>

            {/* Trust score preview */}
            <div className="rounded-lg border border-[var(--md-sys-color-outline)] bg-[var(--elevation-level-1)] p-4">
              <div className="flex items-center justify-between">
                <p className="text-sm text-[var(--md-sys-color-on-surface-variant)]">Current trust score</p>
                <p className="font-mono text-lg font-bold text-[var(--md-sys-color-primary)]">{trustScore}/100</p>
              </div>
              <div className="mt-2 h-2 overflow-hidden rounded-full bg-[var(--md-sys-color-outline)]">
                <div className="h-full rounded-full bg-[var(--md-sys-color-primary)] transition-all" style={{ width: `${trustScore}%` }} />
              </div>
            </div>

            {/* Who are you */}
            <div>
              <p className="mb-3 text-sm font-medium text-[var(--md-sys-color-on-surface)]">Who are you?</p>
              <div className="flex gap-2">
                {SUBMITTER_OPTIONS.map((opt) => (
                  <button
                    key={opt.value}
                    onClick={() => setSubmitterType(opt.value)}
                    className={`flex-1 rounded-lg py-3 text-sm font-medium transition-all ${
                      submitterType === opt.value
                        ? "bg-[var(--md-sys-color-primary)] text-[var(--md-sys-color-on-primary)]"
                        : "border border-[var(--md-sys-color-outline)] bg-[var(--elevation-level-1)] text-[var(--md-sys-color-on-surface-variant)] hover:bg-[var(--md-sys-color-surface-container-high)]"
                    }`}
                  >
                    {opt.label}<br /><span className={`text-xs ${submitterType === opt.value ? "text-[var(--md-sys-color-on-primary)]/70" : "text-[var(--md-sys-color-on-surface-variant)]"}`}>+{opt.points}pts</span>
                  </button>
                ))}
              </div>
            </div>

            {/* Rent type */}
            <div>
              <p className="mb-3 text-sm font-medium text-[var(--md-sys-color-on-surface)]">Rent type</p>
              <div className="flex gap-2">
                {RENT_TYPE_OPTIONS.map((opt) => (
                  <button
                    key={opt.value}
                    onClick={() => setRentType(opt.value)}
                    className={`flex-1 rounded-lg py-3 text-sm font-medium transition-all ${
                      rentType === opt.value
                        ? "bg-[var(--md-sys-color-primary)] text-[var(--md-sys-color-on-primary)]"
                        : "border border-[var(--md-sys-color-outline)] bg-[var(--elevation-level-1)] text-[var(--md-sys-color-on-surface-variant)] hover:bg-[var(--md-sys-color-surface-container-high)]"
                    }`}
                  >
                    {opt.label}<br /><span className={`text-xs ${rentType === opt.value ? "text-[var(--md-sys-color-on-primary)]/70" : "text-[var(--md-sys-color-on-surface-variant)]"}`}>+{opt.points}pts</span>
                  </button>
                ))}
              </div>
            </div>

            {/* Email */}
            <div>
              <p className="mb-2 text-sm font-medium text-[var(--md-sys-color-on-surface)]">Email (optional)</p>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="Never shown publicly"
                className="h-12 w-full rounded-lg border border-[var(--md-sys-color-outline)] bg-[var(--elevation-level-1)] px-4 text-[var(--md-sys-color-on-surface)] placeholder-[var(--md-sys-color-on-surface-variant)] outline-none focus:border-[var(--md-sys-color-primary)] focus:shadow-[0_0_0_3px_rgba(20,184,166,0.15)]"
              />
            </div>
          </div>
        )}

        {/* Step 4: Confirmation */}
        {step === 3 && (
          <div className="space-y-6 text-center">
            <div className="mx-auto flex size-16 items-center justify-center rounded-full bg-[var(--md-sys-color-primary)]/20">
              <Check className="size-8 text-[var(--md-sys-color-primary)]" />
            </div>
            <h2 className="text-2xl font-bold text-[var(--md-sys-color-on-surface)]">Ready to submit?</h2>
            <div className="rounded-xl border border-[var(--md-sys-color-outline)] bg-[var(--elevation-level-1)] p-6 text-left">
              <div className="space-y-3">
                <div className="flex justify-between text-sm">
                  <span className="text-[var(--md-sys-color-on-surface-variant)]">Locality</span>
                  <span className="text-[var(--md-sys-color-on-surface)]">{locality}</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-[var(--md-sys-color-on-surface-variant)]">BHK</span>
                  <span className="text-[var(--md-sys-color-on-surface)]">{bhk}</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-[var(--md-sys-color-on-surface-variant)]">Effective rent</span>
                  <span className="font-mono text-[var(--md-sys-color-on-surface)]">{formatINR(effective)}</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-[var(--md-sys-color-on-surface-variant)]">Rent type</span>
                  <span className="text-[var(--md-sys-color-on-surface)]">{RENT_TYPE_OPTIONS.find((r) => r.value === rentType)?.label}</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-[var(--md-sys-color-on-surface-variant)]">Trust score</span>
                  <span className="font-mono text-[var(--md-sys-color-primary)]">{trustScore}/100</span>
                </div>
              </div>
            </div>
          </div>
        )}

        {submitError && (
          <div className="mt-4 rounded-lg border border-[var(--md-sys-color-error)]/30 bg-[var(--md-sys-color-error-container)]/20 p-3 text-sm text-[var(--md-sys-color-error)]">
            {submitError}
          </div>
        )}
      </div>

      {/* Navigation buttons */}
      <div className="mt-8 flex items-center justify-between">
        <div>
          {step > 0 && (
            <button
              onClick={() => setStep(step - 1)}
              className="flex items-center gap-2 rounded-lg border border-[var(--md-sys-color-outline)] px-5 py-2.5 text-sm font-medium text-[var(--md-sys-color-on-surface-variant)] hover:bg-[var(--md-sys-color-surface-container-high)] transition-colors"
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
            className="flex items-center gap-2 rounded-lg bg-[var(--md-sys-color-primary)] px-6 py-2.5 text-sm font-medium text-[var(--md-sys-color-on-primary)] hover:brightness-110 transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
          >
            Next
            <ArrowRight className="size-4" />
          </button>
        ) : (
          <button
            onClick={handleSubmit}
            disabled={submitting}
            className="flex items-center gap-2 rounded-lg bg-[var(--md-sys-color-primary)] px-6 py-2.5 text-sm font-medium text-[var(--md-sys-color-on-primary)] hover:brightness-110 transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
          >
            {submitting ? (
              <><Loader2 className="size-4 animate-spin" /> Submitting...</>
            ) : (
              <><Check className="size-4" /> Submit rent</>
            )}
          </button>
        )}
      </div>
    </div>
  );
}
