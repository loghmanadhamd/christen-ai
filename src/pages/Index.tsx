import { useState, useEffect } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { ArrowRight, ArrowLeft, LogOut, Snowflake, Plane, Hotel, Cpu } from "lucide-react";
import { Button } from "@/components/ui/button";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { useNavigate } from "react-router-dom";
import ProgressBar from "@/components/ProgressBar";
import StepBasics from "@/components/steps/StepBasics";
import StepBudget from "@/components/steps/StepBudget";
import StepInvites from "@/components/steps/StepInvites";
import StepReview from "@/components/steps/StepReview";
import LoadingAnimation from "@/components/LoadingAnimation";
import { useAuth } from "@/hooks/useAuth";
import type { DateRange } from "react-day-picker";

const FEATURES = [
  { icon: Snowflake, label: "Real snow data" },
  { icon: Plane, label: "Live flights" },
  { icon: Hotel, label: "Hotel options" },
  { icon: Cpu, label: "AI-powered" },
];

const MountainIllustration = () => (
  <svg viewBox="0 0 480 180" fill="none" xmlns="http://www.w3.org/2000/svg" className="w-full h-full">
    <path d="M0 180 L120 55 L200 130 L260 72 L340 130 L400 62 L480 180Z" fill="#DBEAFE" opacity="0.55" />
    <path d="M-20 180 L160 22 L340 180Z" fill="#BFDBFE" opacity="0.65" />
    <path d="M133 52 L160 22 L187 52 L173 42 L160 56 L147 42Z" fill="white" opacity="0.95" />
    <path d="M278 180 L400 48 L522 180Z" fill="#93C5FD" opacity="0.5" />
    <path d="M376 76 L400 48 L424 76 L412 65 L400 78 L388 65Z" fill="white" opacity="0.85" />
    <ellipse cx="240" cy="178" rx="280" ry="12" fill="#EFF6FF" opacity="0.7" />
  </svg>
);

const Index = () => {
  const { user, loading: authLoading, signOut } = useAuth();
  const [started, setStarted] = useState(false);
  const [step, setStep] = useState(1);
  const [tripId, setTripId] = useState<string | null>(null);
  const [guestCount, setGuestCount] = useState(0);
  const [isGenerating, setIsGenerating] = useState(false);
  const { toast } = useToast();
  const navigate = useNavigate();

  const [basics, setBasics] = useState({
    tripName: "",
    dateRange: undefined as DateRange | undefined,
    groupSize: 4,
    geography: [] as string[],
    vibeEnergy: 50,
    vibeBudget: 50,
    vibeSkill: 50,
    skiInOut: false,
    datesFlexible: false,
    flexDays: 2,
  });

  const [budget, setBudget] = useState({
    budgetType: "per_person" as "per_person" | "total",
    budgetAmount: 2000,
    passTypes: [] as string[],
    lodging: "Hotel",
  });

  useEffect(() => {
    if (!tripId) return;
    const fetchCount = async () => {
      const { count } = await supabase
        .from("guests")
        .select("*", { count: "exact", head: true })
        .eq("trip_id", tripId);
      setGuestCount(count || 0);
    };
    fetchCount();
    const channel = supabase
      .channel("guest-count")
      .on("postgres_changes", { event: "*", schema: "public", table: "guests", filter: `trip_id=eq.${tripId}` }, () => fetchCount())
      .subscribe();
    return () => { supabase.removeChannel(channel); };
  }, [tripId]);

  const saveTrip = async () => {
    const skillLabel = (v: number) => {
      if (v <= 25) return "beginner";
      if (v <= 50) return "intermediate";
      if (v <= 75) return "advanced";
      return "expert";
    };
    const tripData = {
      trip_name: basics.tripName || "Untitled Trip",
      user_id: user?.id,
      date_start: basics.dateRange?.from?.toISOString().split("T")[0] || null,
      date_end: basics.dateRange?.to?.toISOString().split("T")[0] || null,
      group_size: basics.groupSize,
      geography: basics.geography,
      vibe: `energy:${basics.vibeEnergy},budget:${basics.vibeBudget},skill:${basics.vibeSkill},ski-in-out:${basics.skiInOut}`,
      skill_min: "beginner",
      skill_max: skillLabel(basics.vibeSkill),
      has_non_skiers: false,
      non_skier_importance: 0,
      budget_type: budget.budgetType,
      budget_amount: budget.budgetAmount,
      pass_types: budget.passTypes,
      lodging_preference: budget.lodging,
    };
    if (tripId) {
      await supabase.from("trips").update(tripData).eq("id", tripId);
    } else {
      const { data } = await supabase.from("trips").insert(tripData).select("id").single();
      if (data) setTripId(data.id);
    }
  };

  const nextStep = async () => {
    if (step <= 2) await saveTrip();
    setStep((s) => Math.min(4, s + 1));
  };

  const prevStep = () => setStep((s) => Math.max(1, s - 1));

  const handleGenerate = async () => {
    await saveTrip();
    setIsGenerating(true);
    try {
      const { error } = await supabase.functions.invoke("generate-recommendations", { body: { tripId } });
      if (error) throw error;
      navigate(`/results/${tripId}`);
    } catch (err: any) {
      toast({ title: "Error generating recommendations", description: err.message || "Please try again.", variant: "destructive" });
      setIsGenerating(false);
    }
  };

  if (isGenerating) return <LoadingAnimation />;

  if (authLoading) {
    return (
      <div className="min-h-screen hero-bg flex items-center justify-center">
        <div className="w-5 h-5 rounded-full border-2 border-primary border-t-transparent animate-spin" />
      </div>
    );
  }

  /* ─── LANDING ─── */
  if (!started) {
    return (
      <div className="min-h-screen hero-bg flex flex-col overflow-hidden">
        {/* Nav */}
        <nav className="flex items-center justify-between px-6 sm:px-10 pt-7 shrink-0">
          <div className="flex items-center gap-2">
            <div className="w-7 h-7 rounded-lg bg-primary flex items-center justify-center shadow-sm">
              <svg viewBox="0 0 20 20" fill="none" className="w-4 h-4">
                <path d="M3 17 L10 4 L17 17Z" fill="white" />
                <path d="M7.5 12.5 L10 4 L12.5 12.5Z" fill="rgba(255,255,255,0.45)" />
              </svg>
            </div>
            <span className="text-sm font-semibold text-foreground tracking-tight">PowderPlan</span>
          </div>
          {user && (
            <button
              onClick={signOut}
              className="flex items-center gap-1.5 text-xs text-muted-foreground hover:text-foreground transition-colors"
            >
              <LogOut className="h-3.5 w-3.5" /> Sign out
            </button>
          )}
        </nav>

        {/* Hero content */}
        <div className="flex-1 flex flex-col items-center justify-center px-4 pt-2 pb-16">
          {/* Mountain illustration */}
          <motion.div
            initial={{ opacity: 0, y: 28 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.9, ease: [0.22, 1, 0.36, 1] }}
            className="w-full max-w-[480px] h-[140px] mb-0"
          >
            <MountainIllustration />
          </motion.div>

          {/* Headline */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.65, delay: 0.12, ease: [0.22, 1, 0.36, 1] }}
            className="text-center mb-6"
          >
            <h1 className="text-[clamp(2.6rem,7.5vw,4.75rem)] font-black tracking-tight text-foreground leading-[1.04] mb-5">
              Plan the perfect<br />
              <span className="gradient-text">ski trip.</span>
            </h1>
            <p className="text-[1.0625rem] text-muted-foreground max-w-[400px] mx-auto leading-relaxed">
              AI-powered resort picks with real snow data,<br className="hidden sm:block" /> live flights, and group coordination.
            </p>
          </motion.div>

          {/* Feature pills */}
          <motion.div
            initial={{ opacity: 0, y: 14 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.28 }}
            className="flex flex-wrap justify-center gap-2 mb-10"
          >
            {FEATURES.map(({ icon: Icon, label }) => (
              <span key={label} className="feature-pill">
                <Icon className="h-3.5 w-3.5 shrink-0" />
                {label}
              </span>
            ))}
          </motion.div>

          {/* CTA */}
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.45, delay: 0.38 }}
            className="flex flex-col items-center gap-3"
          >
            {user ? (
              <Button
                size="lg"
                onClick={() => setStarted(true)}
                className="h-12 px-9 text-[0.9375rem] font-semibold rounded-full btn-lift gap-2 shadow-sm"
              >
                Start Planning
                <ArrowRight className="h-4 w-4" />
              </Button>
            ) : (
              <Button
                size="lg"
                onClick={() => navigate("/auth")}
                className="h-12 px-9 text-[0.9375rem] font-semibold rounded-full btn-lift gap-2 shadow-sm"
              >
                Sign in to Start
                <ArrowRight className="h-4 w-4" />
              </Button>
            )}
            <p className="text-xs text-muted-foreground/70">Free · No credit card required</p>
          </motion.div>
        </div>
      </div>
    );
  }

  /* ─── WIZARD ─── */
  return (
    <div className="min-h-screen snow-gradient">
      {/* Sticky top bar */}
      <div className="sticky-header">
        <div className="max-w-2xl mx-auto px-4 py-3 flex items-center gap-4">
          <div className="flex items-center gap-2 shrink-0">
            <div className="w-6 h-6 rounded-md bg-primary flex items-center justify-center">
              <svg viewBox="0 0 20 20" fill="none" className="w-3.5 h-3.5">
                <path d="M3 17 L10 4 L17 17Z" fill="white" />
                <path d="M7.5 12.5 L10 4 L12.5 12.5Z" fill="rgba(255,255,255,0.45)" />
              </svg>
            </div>
            <span className="text-sm font-semibold text-foreground">PowderPlan</span>
          </div>
          <div className="flex-1">
            <ProgressBar currentStep={step} />
          </div>
        </div>
      </div>

      <div className="max-w-2xl mx-auto px-4 py-8">
        {/* Step card */}
        <div className="card-surface p-6 sm:p-8">
          <AnimatePresence mode="wait">
            {step === 1 && <StepBasics key="basics" data={basics} onChange={(d) => setBasics((p) => ({ ...p, ...d }))} />}
            {step === 2 && <StepBudget key="budget" data={budget} onChange={(d) => setBudget((p) => ({ ...p, ...d }))} />}
            {step === 3 && <StepInvites key="invites" tripId={tripId} groupSize={basics.groupSize} />}
            {step === 4 && (
              <StepReview
                key="review"
                basics={basics}
                budget={budget}
                guestCount={guestCount}
                onGoToStep={setStep}
                onGenerate={handleGenerate}
                isGenerating={isGenerating}
              />
            )}
          </AnimatePresence>
        </div>

        {/* Navigation */}
        <div className="flex justify-between mt-5 px-1">
          <Button variant="outline" onClick={prevStep} disabled={step === 1} className="gap-2 rounded-full">
            <ArrowLeft className="h-4 w-4" /> Back
          </Button>
          {step < 4 && (
            <Button onClick={nextStep} className="gap-2 rounded-full btn-lift">
              {step === 2 ? "Save & Continue" : "Next"}
              <ArrowRight className="h-4 w-4" />
            </Button>
          )}
        </div>
      </div>
    </div>
  );
};

export default Index;
