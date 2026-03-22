import { useState, useEffect, useRef } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import { RefreshCw, ArrowLeft, Users, Calendar, Copy, Check } from "lucide-react";
import { Button } from "@/components/ui/button";
import { supabase } from "@/integrations/supabase/client";
import { format } from "date-fns";
import confetti from "canvas-confetti";
import ResortCard from "@/components/ResortCard";
import FlightSummaryTable from "@/components/FlightSummaryTable";
import LoadingAnimation from "@/components/LoadingAnimation";

const Results = () => {
  const { tripId } = useParams<{ tripId: string }>();
  const navigate = useNavigate();
  const [trip, setTrip] = useState<any>(null);
  const [guests, setGuests] = useState<any[]>([]);
  const [results, setResults] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [regenerating, setRegenerating] = useState(false);
  const [copied, setCopied] = useState(false);
  const confettiFired = useRef(false);

  useEffect(() => {
    if (!tripId) return;
    const loadData = async () => {
      const [tripRes, guestsRes, recsRes] = await Promise.all([
        supabase.from("trips").select("*").eq("id", tripId).single(),
        supabase.from("guests").select("*").eq("trip_id", tripId),
        supabase.from("recommendations").select("*").eq("trip_id", tripId).order("created_at", { ascending: false }).limit(1).single(),
      ]);
      setTrip(tripRes.data);
      setGuests(guestsRes.data || []);
      if (recsRes.data) setResults(recsRes.data.results as any);
      setLoading(false);
    };
    loadData();
  }, [tripId]);

  useEffect(() => {
    if (results && !confettiFired.current) {
      confettiFired.current = true;
      setTimeout(() => {
        confetti({ particleCount: 120, spread: 80, origin: { y: 0.5 }, colors: ["#0071E3", "#60a5fa", "#93c5fd", "#ffffff"] });
      }, 400);
    }
  }, [results]);

  const handleRegenerate = async () => {
    if (!tripId) return;
    setRegenerating(true);
    try {
      const { data, error } = await supabase.functions.invoke("generate-recommendations", { body: { tripId } });
      if (error) throw error;
      setResults(data);
      confettiFired.current = false;
    } catch (err) {
      console.error("Regeneration error:", err);
    } finally {
      setRegenerating(false);
    }
  };

  const shareUrl = `${window.location.origin}/share/${tripId}`;
  const copyShareLink = async () => {
    await navigator.clipboard.writeText(shareUrl);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  if (loading || regenerating) return <LoadingAnimation />;

  if (!results || !trip) {
    return (
      <div className="min-h-screen snow-gradient flex items-center justify-center px-4">
        <div className="text-center">
          <div className="w-14 h-14 rounded-2xl bg-secondary flex items-center justify-center mx-auto mb-5">
            <svg viewBox="0 0 20 20" fill="none" className="w-8 h-8">
              <path d="M3 17 L10 4 L17 17Z" fill="hsl(var(--muted-foreground))" opacity="0.4" />
            </svg>
          </div>
          <h1 className="text-xl font-bold text-foreground mb-2">No results found</h1>
          <p className="text-sm text-muted-foreground mb-6">This trip doesn't have recommendations yet.</p>
          <Button onClick={() => navigate("/")} variant="outline" className="gap-2 rounded-full">
            <ArrowLeft className="h-4 w-4" /> Back to Planner
          </Button>
        </div>
      </div>
    );
  }

  const recs = results.recommendations || [];
  const flightSummary = results.flightSummary || {};
  const resortNames = recs.map((r: any) => r.resortName);
  const bestPick = recs[0];

  return (
    <div className="min-h-screen snow-gradient">
      {/* Sticky header */}
      <div className="sticky-header">
        <div className="max-w-4xl mx-auto px-4 py-3 flex items-center justify-between gap-3">
          <div className="flex items-center gap-3 min-w-0">
            <button
              onClick={() => navigate("/")}
              className="flex items-center gap-2 shrink-0 hover:opacity-70 transition-opacity"
            >
              <div className="w-6 h-6 rounded-md bg-primary flex items-center justify-center">
                <svg viewBox="0 0 20 20" fill="none" className="w-3.5 h-3.5">
                  <path d="M3 17 L10 4 L17 17Z" fill="white" />
                  <path d="M7.5 12.5 L10 4 L12.5 12.5Z" fill="rgba(255,255,255,0.45)" />
                </svg>
              </div>
              <span className="text-sm font-semibold text-foreground hidden sm:block">PowderPlan</span>
            </button>

            <div className="w-px h-4 bg-border shrink-0" />

            <div className="min-w-0">
              <p className="text-sm font-semibold text-foreground truncate">{trip.trip_name}</p>
              <div className="flex items-center gap-3 text-[11px] text-muted-foreground">
                {trip.date_start && (
                  <span className="flex items-center gap-1">
                    <Calendar className="h-3 w-3" />
                    {format(new Date(trip.date_start), "MMM d")}
                    {trip.date_end ? `–${format(new Date(trip.date_end), "MMM d")}` : ""}
                  </span>
                )}
                <span className="flex items-center gap-1">
                  <Users className="h-3 w-3" /> {trip.group_size}
                </span>
              </div>
            </div>
          </div>

          <div className="flex items-center gap-2 shrink-0">
            <Button variant="outline" size="sm" onClick={copyShareLink} className="gap-1.5 rounded-full text-xs h-8">
              {copied ? <Check className="h-3.5 w-3.5 text-green-600" /> : <Copy className="h-3.5 w-3.5" />}
              {copied ? "Copied" : "Share"}
            </Button>
            <Button variant="outline" size="sm" onClick={handleRegenerate} className="gap-1.5 rounded-full text-xs h-8">
              <RefreshCw className="h-3.5 w-3.5" /> Redo
            </Button>
          </div>
        </div>
      </div>

      <div className="max-w-4xl mx-auto px-4 py-10 pb-16">
        {/* Hero: best pick */}
        {bestPick && (
          <motion.div
            initial={{ opacity: 0, y: 18 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, ease: [0.22, 1, 0.36, 1] }}
            className="mb-10 text-center"
          >
            <p className="text-[11px] font-bold text-primary uppercase tracking-[0.14em] mb-3">Your Top Pick</p>
            <h1 className="text-4xl sm:text-5xl font-black tracking-tight text-foreground mb-2">
              {bestPick.resortName}
            </h1>
            <p className="text-[0.9375rem] text-muted-foreground">
              {bestPick.matchScore}% match · est. ${bestPick.costBreakdown?.total?.toLocaleString()}/person
            </p>
          </motion.div>
        )}

        {/* Resort cards with scroll-reveal */}
        <div className="space-y-5 mb-10">
          {recs.map((rec: any, i: number) => (
            <motion.div
              key={rec.resortName}
              initial={{ opacity: 0, y: 28 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, margin: "-40px" }}
              transition={{ duration: 0.52, delay: i * 0.07, ease: [0.22, 1, 0.36, 1] }}
            >
              <ResortCard resort={rec} rank={i + 1} isBestPick={i === 0} />
            </motion.div>
          ))}
        </div>

        {/* Flight summary */}
        {Object.keys(flightSummary).length > 0 && (
          <motion.div
            initial={{ opacity: 0, y: 16 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.45 }}
            className="mb-10"
          >
            <FlightSummaryTable flightSummary={flightSummary} resortNames={resortNames} />
          </motion.div>
        )}

        <div className="flex justify-center pt-2">
          <Button onClick={() => navigate("/")} variant="ghost" className="gap-2 text-muted-foreground rounded-full text-sm">
            <ArrowLeft className="h-4 w-4" /> Plan a new trip
          </Button>
        </div>
      </div>
    </div>
  );
};

export default Results;
