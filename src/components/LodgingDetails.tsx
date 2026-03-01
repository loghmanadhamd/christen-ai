import { Hotel, MapPin, Star, ExternalLink, Search } from "lucide-react";

interface LodgingOption {
  name: string;
  hotelId?: string;
  starRating?: number;
  pricePerNight?: number;
  totalPrice?: number;
  costPerPerson?: number;
  currency?: string;
  distanceFromResort?: { value: number; unit: string };
  bookingUrl: string;
  source: "amadeus" | "airbnb";
}

interface LodgingDetailsProps {
  realLodging: {
    options: LodgingOption[];
    searchLinks: { airbnb: string; googleHotels: string };
  } | null;
  resortName: string;
}

const StarRating = ({ count }: { count: number }) => (
  <span className="flex items-center gap-0.5">
    {Array.from({ length: count }).map((_, i) => (
      <Star key={i} className="h-2.5 w-2.5 fill-amber-400 text-amber-400" />
    ))}
  </span>
);

const HotelCard = ({ option }: { option: LodgingOption }) => (
  <div className="glass rounded-lg p-3 flex items-start justify-between gap-3">
    <div className="min-w-0 space-y-1">
      <div className="flex items-center gap-2 flex-wrap">
        <span className="text-xs font-semibold text-foreground leading-snug">{option.name}</span>
        {option.starRating && <StarRating count={option.starRating} />}
      </div>

      <div className="flex items-center gap-3 text-[10px] text-muted-foreground flex-wrap">
        {option.distanceFromResort && (
          <span className="flex items-center gap-1">
            <MapPin className="h-2.5 w-2.5 shrink-0" />
            {option.distanceFromResort.value.toFixed(1)}{option.distanceFromResort.unit.toLowerCase()} from slopes
          </span>
        )}
        {option.pricePerNight && (
          <span className="font-medium text-foreground">
            ${option.pricePerNight.toLocaleString()}/night
          </span>
        )}
        {option.costPerPerson && (
          <span>${option.costPerPerson.toLocaleString()}/person total</span>
        )}
      </div>
    </div>

    <a
      href={option.bookingUrl}
      target="_blank"
      rel="noopener noreferrer"
      className="shrink-0 flex items-center gap-1 text-[10px] font-semibold text-primary hover:text-primary/80 transition-colors whitespace-nowrap"
    >
      View <ExternalLink className="h-3 w-3" />
    </a>
  </div>
);

const LodgingDetails = ({ realLodging, resortName }: LodgingDetailsProps) => {
  if (!realLodging) return null;

  const { options, searchLinks } = realLodging;
  const hasOptions = options.length > 0;

  return (
    <div className="space-y-3">
      <div className="flex items-center gap-2">
        <Hotel className="h-4 w-4 text-primary" />
        <span className="text-sm font-semibold text-foreground">Real Lodging Options</span>
        <span className="text-[10px] text-muted-foreground">near {resortName}</span>
      </div>

      {hasOptions ? (
        <div className="space-y-2">
          {options.map((opt, i) => (
            <HotelCard key={opt.hotelId ?? i} option={opt} />
          ))}
        </div>
      ) : (
        <p className="text-xs text-muted-foreground italic">
          No specific listings available — browse options below.
        </p>
      )}

      {/* Search links row */}
      <div className="flex items-center gap-3 pt-1">
        <Search className="h-3 w-3 text-muted-foreground shrink-0" />
        <span className="text-[10px] text-muted-foreground">Search more:</span>
        <a
          href={searchLinks.googleHotels}
          target="_blank"
          rel="noopener noreferrer"
          className="text-[10px] font-medium text-primary hover:underline"
        >
          Google Hotels
        </a>
        <span className="text-muted-foreground/40 text-[10px]">·</span>
        <a
          href={searchLinks.airbnb}
          target="_blank"
          rel="noopener noreferrer"
          className="text-[10px] font-medium text-primary hover:underline"
        >
          Airbnb
        </a>
      </div>
    </div>
  );
};

export default LodgingDetails;
