import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  Snowflake, DollarSign, AlertTriangle, Calendar, ChevronDown,
  Plane, Hotel, Ticket, Coffee, MapPin, Mountain, TrendingUp, Info
} from "lucide-react";
import { Button } from "@/components/ui/button";
import MatchScoreRing from "@/components/MatchScoreRing";
import FlightDetails from "@/components/FlightDetails";
import LodgingDetails from "@/components/LodgingDetails";

const WIKI_ARTICLE: Record<string, string> = {
  "Whistler Blackcomb": "Whistler_Blackcomb",
  "Vail": "Vail_Mountain_Resort",
  "Park City": "Park_City_Mountain_Resort",
  "Jackson Hole": "Jackson_Hole_Mountain_Resort",
  "Telluride": "Telluride_Ski_Resort",
  "Mammoth Mountain": "Mammoth_Mountain",
  "Steamboat": "Steamboat_Ski_Resort",
  "Stowe": "Stowe_Mountain_Resort",
  "Sunday River": "Sunday_River_Resort",
  "Killington": "Killington_Resort",
  "Big Sky": "Big_Sky_Resort",
  "Taos Ski Valley": "Taos_Ski_Valley",
  "Alta": "Alta_Ski_Area",
  "Snowbird": "Snowbird_(ski_resort)",
  "Arapahoe Basin": "Arapahoe_Basin_Ski_Area",
  "Banff Sunshine": "Sunshine_Village",
  "Lake Louise": "Lake_Louise_Ski_Resort",
  "Mont-Tremblant": "Mont-Tremblant_Resort",
  "Revelstoke": "Revelstoke_Mountain_Resort",
  "Aspen Snowmass": "Snowmass_(ski_area)",
  "Deer Valley": "Deer_Valley_Resort",
  "Breckenridge": "Breckenridge_Ski_Resort",
  "Copper Mountain": "Copper_Mountain_Resort",
  "Squaw Valley / Palisades": "Palisades_Tahoe",
  "Sun Valley": "Sun_Valley_Resort",
  "Winter Park": "Winter_Park_Resort",
  "Chamonix": "Chamonix",
  "Verbier": "Verbier",
  "Zermatt": "Zermatt",
  "Val d'Isère": "Val d'Isère",
  "Courchevel": "Courchevel",
  "St. Anton": "St. Anton am Arlberg",
  "Kitzbühel": "Kitzbühel",
  "Les Arcs": "Les_Arcs",
  "Tignes": "Tignes",
  "Niseko": "Niseko",
  "Hakuba": "Hakuba_Valley",
  "Furano": "Furano_Ski_Resort",
  "Nozawa Onsen": "Nozawa_Onsen",
};

interface ResortCardProps {
  resort: any;
  rank: number;
  isBestPick?: boolean;
}

const VIBE_DIMS = [
  { key: "energy", icon: "⚡", label: "Energy" },
  { key: "budget", icon: "💰", label: "Budget Vibe" },
  { key: "skill",  icon: "🎿", label: "Skill Match" },
] as const;

/** Preference Fit — 3-tile grid with dot-meter visual */
const VibeAlignmentPanel = ({ alignment }: { alignment: any }) => {
  if (!alignment) return null;

  const hasAny = VIBE_DIMS.some((d) => alignment[d.key]);
  if (!hasAny) return null;

  return (
    <div className="inset-surface p-4 space-y-3">
      <div className="text-xs font-semibold text-foreground tracking-wide">Preference Fit</div>

      <div className="grid grid-cols-3 gap-2">
        {VIBE_DIMS.map((d) => {
          const item = alignment[d.key];
          if (!item) return null;
          const score: number = item.score ?? 0;
          const filled = Math.ceil((score / 100) * 5); // 0–5 pips
          const dotColor =
            score >= 75 ? "bg-green-500" : score >= 50 ? "bg-primary" : "bg-amber-400";
          const scoreColor =
            score >= 75 ? "text-green-600" : score >= 50 ? "text-primary" : "text-amber-500";

          return (
            <div
              key={d.key}
              className="bg-white rounded-xl p-3 flex flex-col items-center gap-2 text-center border border-black/[0.05]"
            >
              <span className="text-2xl leading-none">{d.icon}</span>
              <span className={`text-lg font-black tabular-nums leading-none ${scoreColor}`}>
                {score}%
              </span>
              {/* 5-pip dot meter */}
              <div className="flex gap-[3px]">
                {[1, 2, 3, 4, 5].map((pip) => (
                  <div
                    key={pip}
                    className={`w-4 h-1.5 rounded-full transition-colors ${
                      pip <= filled ? dotColor : "bg-gray-100"
                    }`}
                  />
                ))}
              </div>
              <span className="text-[10px] font-semibold text-muted-foreground leading-tight">
                {d.label}
              </span>
            </div>
          );
        })}
      </div>

      {/* AI descriptive labels */}
      {VIBE_DIMS.some((d) => alignment[d.key]?.label) && (
        <div className="space-y-1 pt-0.5">
          {VIBE_DIMS.map((d) => {
            const label = alignment[d.key]?.label;
            if (!label) return null;
            return (
              <p key={d.key} className="text-[10px] text-muted-foreground leading-relaxed">
                <span className="mr-1">{d.icon}</span>{label}
              </p>
            );
          })}
        </div>
      )}
    </div>
  );
};

const TerrainBar = ({ terrain }: { terrain: any }) => {
  if (!terrain) return null;
  const segments = [
    { key: "beginner",     label: "Beginner",     pct: terrain.beginner,     color: "bg-green-400" },
    { key: "intermediate", label: "Intermediate", pct: terrain.intermediate, color: "bg-blue-400" },
    { key: "advanced",     label: "Advanced",     pct: terrain.advanced,     color: "bg-orange-400" },
    { key: "expert",       label: "Expert",       pct: terrain.expert,       color: "bg-red-400" },
  ];
  return (
    <div className="space-y-2">
      <div className="text-xs font-semibold text-foreground">Terrain Breakdown</div>
      <div className="flex h-2.5 rounded-full overflow-hidden gap-px">
        {segments.map((s) =>
          (s.pct ?? 0) > 0 ? (
            <div key={s.key} className={`${s.color}`} style={{ width: `${s.pct}%` }} />
          ) : null
        )}
      </div>
      <div className="flex justify-between text-[10px] text-muted-foreground font-medium">
        {segments.map((s) => (
          <span key={s.key} className="flex items-center gap-0.5">
            <span
              className={`inline-block w-2 h-2 rounded-sm ${s.color}`}
            />
            {s.pct ?? 0}%
          </span>
        ))}
      </div>
    </div>
  );
};

const fmtSnowDate = (iso: string) => {
  if (!iso) return '';
  const [, mo, dy] = iso.split('-');
  const months = ['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec'];
  return `${months[+mo - 1]} ${+dy}`;
};

const SnowBadge = ({
  icon: Icon,
  label,
  muted = false,
}: {
  icon: React.ElementType;
  label: string;
  muted?: boolean;
}) => (
  <div
    className={`flex items-center gap-1.5 text-xs font-semibold px-3 py-1.5 rounded-full ${
      muted
        ? "bg-gray-100 text-muted-foreground"
        : "bg-primary/10 text-primary"
    }`}
  >
    <Icon className="h-3.5 w-3.5 shrink-0" />
    {label}
  </div>
);

const SnowConditionsDisplay = ({ snow }: { snow: any }) => {
  if (!snow) return null;

  if (!snow.isHistorical) {
    return (
      <div className="flex flex-wrap gap-2">
        {(snow.currentSnowDepth ?? 0) > 0 && (
          <SnowBadge icon={Mountain} label={`${snow.currentSnowDepth}cm base`} />
        )}
        {(snow.last24hrSnowfall ?? 0) > 0 && (
          <SnowBadge icon={Snowflake} label={`+${snow.last24hrSnowfall}cm / 24hr`} />
        )}
        {(snow.last7daysSnowfall ?? 0) > 0 && (
          <SnowBadge icon={Snowflake} label={`+${snow.last7daysSnowfall}cm / 7d`} />
        )}
        {(snow.seasonTotalSnowfall ?? 0) > 0 && (
          <SnowBadge icon={TrendingUp} label={`${snow.seasonTotalSnowfall}cm season`} />
        )}
      </div>
    );
  }

  const dr = snow.historicalDateRange;
  const dateLabel = dr?.start
    ? `${fmtSnowDate(dr.start)} – ${fmtSnowDate(dr.end)}, ${dr.start.slice(0, 4)}`
    : null;

  return (
    <div className="space-y-2">
      {dateLabel && (
        <div className="flex items-center gap-1.5 bg-gray-50 rounded-lg px-2.5 py-1.5 border border-black/[0.05]">
          <Info className="h-3 w-3 text-muted-foreground shrink-0" />
          <span className="text-[10px] text-muted-foreground">Based on {dateLabel} historical data</span>
        </div>
      )}
      <div className="flex flex-wrap gap-2">
        <SnowBadge icon={Mountain} label={`~${snow.historicalSnowDepth ?? 0}cm avg base`} muted />
        {(snow.historicalLast7dSnowfall ?? 0) > 0 && (
          <SnowBadge icon={Snowflake} label={`+${snow.historicalLast7dSnowfall}cm / 7d prior`} muted />
        )}
        <SnowBadge icon={Snowflake} label={`${snow.historicalSnowfall ?? 0}cm trip window`} muted />
        {(snow.historicalSeasonTotal ?? 0) > 0 && (
          <SnowBadge icon={TrendingUp} label={`${snow.historicalSeasonTotal}cm season`} muted />
        )}
      </div>
    </div>
  );
};

const ResortCard = ({ resort, rank, isBestPick }: ResortCardProps) => {
  const [showItinerary, setShowItinerary] = useState(false);
  const [showCosts, setShowCosts] = useState(false);
  const [heroImg, setHeroImg] = useState<string | null>(null);

  useEffect(() => {
    const article = WIKI_ARTICLE[resort.resortName] ?? resort.resortName.replace(/_/g, " ");
    const url = new URL("https://en.wikipedia.org/w/api.php");
    url.searchParams.set("action", "query");
    url.searchParams.set("titles", article);
    url.searchParams.set("prop", "pageimages");
    url.searchParams.set("pithumbsize", "1200");
    url.searchParams.set("pilicense", "any");
    url.searchParams.set("format", "json");
    url.searchParams.set("origin", "*");

    fetch(url.toString())
      .then((r) => (r.ok ? r.json() : null))
      .then((data) => {
        const pages = data?.query?.pages;
        if (!pages) return;
        const page = Object.values(pages)[0] as any;
        const src = page?.thumbnail?.source;
        if (src) setHeroImg(src);
      })
      .catch(() => {});
  }, [resort.resortName]);

  const cost = resort.costBreakdown;
  const snow = resort.snowConditions;
  const passes = resort.passCoverage || [];
  const vibeTags = resort.vibeMatchTags || [];
  const terrain = resort.terrainBreakdown || resort.terrain;

  return (
    <div
      className={`card-surface overflow-hidden ${
        isBestPick ? "ring-2 ring-primary ring-primary-soft" : ""
      }`}
    >
      {/* Hero image */}
      <div className="relative h-44 sm:h-52 overflow-hidden">
        {heroImg ? (
          <img
            src={heroImg}
            alt={resort.resortName}
            className="absolute inset-0 w-full h-full object-cover scale-105"
            onError={() => setHeroImg(null)}
          />
        ) : (
          <div className="absolute inset-0 bg-gradient-to-br from-blue-50 via-blue-100 to-blue-200" />
        )}
        {/* Light gradient overlay — readable text without going dark */}
        <div className="absolute inset-0 bg-gradient-to-t from-white/80 via-white/20 to-transparent" />

        {isBestPick && (
          <div className="absolute top-3 left-3 bg-primary text-primary-foreground text-xs font-bold px-3 py-1.5 rounded-full flex items-center gap-1.5 z-10 shadow-sm">
            <Mountain className="h-3.5 w-3.5" /> Best Overall Pick
          </div>
        )}

        <div className="absolute bottom-0 left-0 right-0 p-5 flex items-end justify-between">
          <div>
            <div className="text-xs font-bold text-primary mb-0.5">#{rank}</div>
            <h3 className="text-2xl font-black text-foreground tracking-tight">
              {resort.resortName}
            </h3>
            <p className="text-sm text-muted-foreground flex items-center gap-1 mt-0.5">
              <MapPin className="h-3 w-3" />
              {resort.country || ""}{resort.region ? `, ${resort.region}` : ""}
            </p>
          </div>
          <MatchScoreRing score={resort.matchScore} />
        </div>
      </div>

      <div className="p-5 space-y-5">
        {/* Snow Conditions */}
        <SnowConditionsDisplay snow={snow} />

        {/* Pass Coverage */}
        {passes.length > 0 && (
          <div className="flex flex-wrap gap-2">
            {passes.map((p: any) => (
              <span
                key={p.pass}
                className={`text-xs font-semibold px-2.5 py-1 rounded-full ${
                  p.covered
                    ? "bg-green-50 text-green-700 border border-green-200"
                    : "bg-gray-100 text-muted-foreground border border-gray-200"
                }`}
              >
                {p.covered ? "✓" : "✗"} {p.pass}
              </span>
            ))}
          </div>
        )}

        {/* Estimated Cost */}
        <div className="space-y-2">
          <button
            onClick={() => setShowCosts(!showCosts)}
            className="w-full flex items-center justify-between hover:opacity-70 transition-opacity"
          >
            <div className="flex items-center gap-2">
              <DollarSign className="h-4 w-4 text-primary" />
              <span className="text-sm font-semibold text-foreground">
                Est. ${cost?.total?.toLocaleString()} /person
              </span>
            </div>
            <ChevronDown
              className={`h-4 w-4 text-muted-foreground transition-transform ${
                showCosts ? "rotate-180" : ""
              }`}
            />
          </button>

          <AnimatePresence>
            {showCosts && (
              <motion.div
                initial={{ height: 0, opacity: 0 }}
                animate={{ height: "auto", opacity: 1 }}
                exit={{ height: 0, opacity: 0 }}
                className="overflow-hidden"
              >
                <div className="inset-surface p-4 mt-2">
                  <div className="grid grid-cols-2 gap-3">
                    {[
                      { icon: Plane,   label: "Flights (avg)",    value: cost?.flights_avg },
                      { icon: Hotel,   label: "Lodging /person",  value: cost?.lodging_per_person },
                      { icon: Ticket,  label: "Lift Tickets",     value: cost?.lift_tickets },
                      { icon: Coffee,  label: "Food & Misc",      value: cost?.misc },
                    ].map((item) => (
                      <div key={item.label} className="flex items-center gap-2">
                        <item.icon className="h-3.5 w-3.5 text-muted-foreground shrink-0" />
                        <div>
                          <div className="text-[10px] text-muted-foreground">{item.label}</div>
                          <div className="text-sm font-semibold text-foreground">
                            ${item.value?.toLocaleString() || "—"}
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        {/* Vibe Match Tags */}
        {vibeTags.length > 0 && (
          <div className="flex flex-wrap gap-1.5">
            {vibeTags.map((tag: string) => (
              <span
                key={tag}
                className="text-xs bg-primary/8 text-primary px-2.5 py-1 rounded-full font-medium border border-primary/10"
              >
                {tag}
              </span>
            ))}
          </div>
        )}

        {/* Preference Fit — tile grid with dot meters */}
        <VibeAlignmentPanel alignment={resort.vibeAlignment} />

        {/* Terrain Breakdown */}
        {terrain && <TerrainBar terrain={terrain} />}

        {/* Why This Resort */}
        {(resort.whyThisResort || resort.summary) && (
          <p className="text-sm text-muted-foreground leading-relaxed border-l-2 border-primary/25 pl-3 italic">
            {resort.whyThisResort || resort.summary}
          </p>
        )}

        {/* Lodging */}
        {resort.realLodging ? (
          <LodgingDetails realLodging={resort.realLodging} resortName={resort.resortName} />
        ) : resort.lodgingRecommendation ? (
          <div className="inset-surface p-3 flex items-center gap-3">
            <Hotel className="h-4 w-4 text-primary shrink-0" />
            <div className="text-xs text-muted-foreground">
              <span className="font-semibold text-foreground">
                {resort.lodgingRecommendation.units}× {resort.lodgingRecommendation.name}
              </span>
              {" "}({resort.lodgingRecommendation.type}) — ${resort.lodgingRecommendation.pricePerNight}/night,{" "}
              ${resort.lodgingRecommendation.costPerPerson}/person total
            </div>
          </div>
        ) : null}

        {/* Flight Options */}
        <FlightDetails realFlights={resort.realFlights} resortName={resort.resortName} />

        {/* Sample Itinerary */}
        {resort.itinerary?.length > 0 && (
          <div>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setShowItinerary(!showItinerary)}
              className="w-full justify-between text-sm font-medium gap-2 h-9 rounded-xl"
            >
              <span className="flex items-center gap-2">
                <Calendar className="h-4 w-4 text-primary" /> View Sample Itinerary
              </span>
              <ChevronDown
                className={`h-4 w-4 transition-transform ${showItinerary ? "rotate-180" : ""}`}
              />
            </Button>

            <AnimatePresence>
              {showItinerary && (
                <motion.div
                  initial={{ height: 0, opacity: 0 }}
                  animate={{ height: "auto", opacity: 1 }}
                  exit={{ height: 0, opacity: 0 }}
                  className="overflow-hidden"
                >
                  <div className="space-y-2 mt-2">
                    {resort.itinerary.map((day: any) => (
                      <div key={day.day} className="inset-surface p-3">
                        <div className="text-xs font-bold text-primary mb-1.5">Day {day.day}</div>
                        <div className="grid grid-cols-1 sm:grid-cols-3 gap-1 text-xs text-muted-foreground">
                          <div><span className="font-semibold text-foreground">AM: </span>{day.morning}</div>
                          <div><span className="font-semibold text-foreground">PM: </span>{day.afternoon}</div>
                          <div><span className="font-semibold text-foreground">Eve: </span>{day.evening}</div>
                        </div>
                      </div>
                    ))}
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        )}

        {/* Warnings */}
        {resort.warnings?.length > 0 && (
          <div className="space-y-1.5">
            {resort.warnings.map((w: string, i: number) => (
              <div
                key={i}
                className="flex items-start gap-2 bg-amber-50 border border-amber-200 rounded-lg px-3 py-2"
              >
                <AlertTriangle className="h-3.5 w-3.5 text-amber-500 shrink-0 mt-0.5" />
                <span className="text-xs text-amber-700">{w}</span>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default ResortCard;
