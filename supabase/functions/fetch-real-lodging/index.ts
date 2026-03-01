console.log("fetch-real-lodging: module loading");

import { z } from "https://esm.sh/zod@3.23.8";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

// Resort coordinates + city info for Amadeus Hotel List API
const RESORT_LOCATIONS: Record<string, { lat: number; lon: number; cityCode: string; cityName: string }> = {
  // North America
  "Whistler Blackcomb": { lat: 50.1163,  lon: -122.9574, cityCode: "YVR", cityName: "Whistler" },
  "Vail":               { lat: 39.6403,  lon: -106.3742, cityCode: "DEN", cityName: "Vail" },
  "Park City":          { lat: 40.6461,  lon: -111.4980, cityCode: "SLC", cityName: "Park City" },
  "Jackson Hole":       { lat: 43.5877,  lon: -110.8279, cityCode: "JAC", cityName: "Teton Village" },
  "Telluride":          { lat: 37.9375,  lon: -107.8123, cityCode: "MTJ", cityName: "Telluride" },
  "Mammoth Mountain":   { lat: 37.6308,  lon: -119.0326, cityCode: "MMH", cityName: "Mammoth Lakes" },
  "Steamboat":          { lat: 40.4850,  lon: -106.8317, cityCode: "HDN", cityName: "Steamboat Springs" },
  "Stowe":              { lat: 44.5234,  lon:  -72.7812, cityCode: "BTV", cityName: "Stowe" },
  "Sunday River":       { lat: 44.4702,  lon:  -70.8578, cityCode: "PWM", cityName: "Newry" },
  "Killington":         { lat: 43.6045,  lon:  -72.8201, cityCode: "BTV", cityName: "Killington" },
  "Big Sky":            { lat: 45.2833,  lon: -111.4014, cityCode: "BZN", cityName: "Big Sky" },
  "Taos Ski Valley":    { lat: 36.5951,  lon: -105.4545, cityCode: "ABQ", cityName: "Taos Ski Valley" },
  "Alta":               { lat: 40.5882,  lon: -111.6380, cityCode: "SLC", cityName: "Alta" },
  "Snowbird":           { lat: 40.5830,  lon: -111.6569, cityCode: "SLC", cityName: "Snowbird" },
  "Arapahoe Basin":     { lat: 39.6427,  lon: -105.8713, cityCode: "DEN", cityName: "Keystone" },
  "Banff Sunshine":     { lat: 51.1133,  lon: -115.7606, cityCode: "YYC", cityName: "Banff" },
  "Lake Louise":        { lat: 51.4254,  lon: -116.1773, cityCode: "YYC", cityName: "Lake Louise" },
  "Mont-Tremblant":     { lat: 46.1185,  lon:  -74.5962, cityCode: "YUL", cityName: "Mont-Tremblant" },
  "Revelstoke":         { lat: 51.0614,  lon: -118.1689, cityCode: "YLW", cityName: "Revelstoke" },
  "Aspen Snowmass":     { lat: 39.2084,  lon: -106.9490, cityCode: "ASE", cityName: "Aspen" },
  "Deer Valley":        { lat: 40.6374,  lon: -111.4782, cityCode: "SLC", cityName: "Park City" },
  "Breckenridge":       { lat: 39.4817,  lon: -106.0384, cityCode: "DEN", cityName: "Breckenridge" },
  "Copper Mountain":    { lat: 39.5021,  lon: -106.1499, cityCode: "DEN", cityName: "Copper Mountain" },
  "Squaw Valley / Palisades": { lat: 39.1969, lon: -120.2358, cityCode: "RNO", cityName: "Olympic Valley" },
  "Sun Valley":         { lat: 43.6962,  lon: -114.3520, cityCode: "SUN", cityName: "Sun Valley" },
  "Winter Park":        { lat: 39.8868,  lon: -105.7626, cityCode: "DEN", cityName: "Winter Park" },
  // Europe
  "Chamonix":           { lat: 45.9237,  lon:   6.8694,  cityCode: "GVA", cityName: "Chamonix" },
  "Verbier":            { lat: 46.0965,  lon:   7.2272,  cityCode: "GVA", cityName: "Verbier" },
  "Zermatt":            { lat: 46.0207,  lon:   7.7491,  cityCode: "GVA", cityName: "Zermatt" },
  "Val d'Isère":        { lat: 45.4481,  lon:   6.9799,  cityCode: "GVA", cityName: "Val d'Isère" },
  "Courchevel":         { lat: 45.4161,  lon:   6.6338,  cityCode: "GVA", cityName: "Courchevel" },
  "St. Anton":          { lat: 47.1292,  lon:  10.2676,  cityCode: "INN", cityName: "St. Anton am Arlberg" },
  "Kitzbühel":          { lat: 47.4469,  lon:  12.3924,  cityCode: "INN", cityName: "Kitzbühel" },
  "Innsbruck/Axamer Lizum": { lat: 47.1983, lon: 11.2648, cityCode: "INN", cityName: "Axams" },
  "Axamer Lizum":       { lat: 47.1983,  lon:  11.2648,  cityCode: "INN", cityName: "Axams" },
  "Les Arcs":           { lat: 45.5706,  lon:   6.8022,  cityCode: "GVA", cityName: "Bourg-Saint-Maurice" },
  "Tignes":             { lat: 45.4694,  lon:   6.9007,  cityCode: "GVA", cityName: "Tignes" },
  // Japan
  "Niseko":             { lat: 42.8013,  lon: 140.6878,  cityCode: "CTS", cityName: "Niseko" },
  "Hakuba":             { lat: 36.7025,  lon: 137.8602,  cityCode: "NRT", cityName: "Hakuba" },
  "Furano":             { lat: 43.3498,  lon: 142.4046,  cityCode: "CTS", cityName: "Furano" },
  "Nozawa Onsen":       { lat: 36.9226,  lon: 138.4530,  cityCode: "NRT", cityName: "Nozawa Onsen" },
};

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

interface ResortLodging {
  options: LodgingOption[];
  searchLinks: { airbnb: string; googleHotels: string };
}

function buildSearchLinks(
  cityName: string,
  resortName: string,
  checkInDate: string,
  checkOutDate: string,
  adults: number
): { airbnb: string; googleHotels: string } {
  const airbnb = `https://www.airbnb.com/s/${encodeURIComponent(cityName)}/homes?checkin=${checkInDate}&checkout=${checkOutDate}&adults=${adults}`;
  const googleHotels = `https://www.google.com/travel/hotels/s?q=${encodeURIComponent(resortName + " hotels")}&dates=${checkInDate},${checkOutDate}&guests=${adults}`;
  return { airbnb, googleHotels };
}

async function getAmadeusToken(): Promise<string> {
  const clientId = Deno.env.get("AMADEUS_CLIENT_ID")!;
  const clientSecret = Deno.env.get("AMADEUS_CLIENT_SECRET")!;

  const res = await fetch("https://test.api.amadeus.com/v1/security/oauth2/token", {
    method: "POST",
    signal: AbortSignal.timeout(15000),
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body: `grant_type=client_credentials&client_id=${clientId}&client_secret=${clientSecret}`,
  });

  if (!res.ok) {
    const err = await res.text();
    throw new Error(`Amadeus auth failed (${res.status}): ${err}`);
  }

  const data = await res.json();
  return data.access_token;
}

async function fetchLodgingForResort(
  token: string,
  resortName: string,
  checkInDate: string,
  checkOutDate: string,
  adults: number,
  budgetVibe: number, // 0–100
  supabase: ReturnType<typeof createClient>
): Promise<ResortLodging> {
  const loc = RESORT_LOCATIONS[resortName];
  const nights = Math.max(1, Math.round(
    (new Date(checkOutDate).getTime() - new Date(checkInDate).getTime()) / 86400000
  ));

  const searchLinks = loc
    ? buildSearchLinks(loc.cityName, resortName, checkInDate, checkOutDate, adults)
    : buildSearchLinks(resortName, resortName, checkInDate, checkOutDate, adults);

  if (!loc) {
    console.warn(`fetch-real-lodging: no location data for "${resortName}"`);
    return { options: [], searchLinks };
  }

  // Check cache (6-hour TTL)
  const sixHoursAgo = new Date(Date.now() - 6 * 60 * 60 * 1000).toISOString();
  try {
    const { data: cached } = await supabase
      .from("lodging_cache")
      .select("result_json, updated_at")
      .eq("resort_name", resortName)
      .eq("check_in_date", checkInDate)
      .eq("check_out_date", checkOutDate)
      .eq("adults", adults)
      .gte("updated_at", sixHoursAgo)
      .single();

    if (cached?.result_json) {
      console.log(`fetch-real-lodging: cache hit for ${resortName}`);
      return cached.result_json as ResortLodging;
    }
  } catch (_) {
    // Cache miss — proceed
  }

  // Step A: Hotel List by geocode
  const listUrl = new URL("https://test.api.amadeus.com/v1/reference-data/locations/hotels/by-geocode");
  listUrl.searchParams.set("latitude", String(loc.lat));
  listUrl.searchParams.set("longitude", String(loc.lon));
  listUrl.searchParams.set("radius", "15");
  listUrl.searchParams.set("radiusUnit", "KM");
  listUrl.searchParams.set("hotelSource", "ALL");
  listUrl.searchParams.set("ratings", "3,4,5");

  let hotelList: Array<{ hotelId: string; name: string; rating?: string; distance?: { value: number; unit: string } }> = [];

  try {
    const listRes = await fetch(listUrl.toString(), {
      signal: AbortSignal.timeout(15000),
      headers: { Authorization: `Bearer ${token}` },
    });
    if (listRes.ok) {
      const listData = await listRes.json();
      hotelList = (listData.data || []).slice(0, 20); // cap at 20 for the search step
    } else {
      console.warn(`fetch-real-lodging: hotel list failed for ${resortName}: ${listRes.status}`);
    }
  } catch (e) {
    console.error(`fetch-real-lodging: hotel list error for ${resortName}:`, e);
  }

  if (hotelList.length === 0) {
    console.log(`fetch-real-lodging: no hotels found for ${resortName}, returning search links only`);
    return { options: [], searchLinks };
  }

  // Build a lookup for star ratings and distances from Step A
  const hotelMeta: Record<string, { name: string; rating?: number; distance?: { value: number; unit: string } }> = {};
  for (const h of hotelList) {
    hotelMeta[h.hotelId] = {
      name: h.name,
      rating: h.rating ? parseInt(h.rating) : undefined,
      distance: h.distance,
    };
  }

  // Step B: Hotel Offers search
  await new Promise((r) => setTimeout(r, 300)); // rate limit delay

  const hotelIds = hotelList.map((h) => h.hotelId).join(",");
  const offersUrl = new URL("https://test.api.amadeus.com/v3/shopping/hotel-offers");
  offersUrl.searchParams.set("hotelIds", hotelIds);
  offersUrl.searchParams.set("checkInDate", checkInDate);
  offersUrl.searchParams.set("checkOutDate", checkOutDate);
  offersUrl.searchParams.set("adults", String(adults));
  offersUrl.searchParams.set("currency", "USD");
  offersUrl.searchParams.set("bestRateOnly", "true");

  let rawOffers: any[] = [];

  try {
    const offersRes = await fetch(offersUrl.toString(), {
      signal: AbortSignal.timeout(15000),
      headers: { Authorization: `Bearer ${token}` },
    });
    if (offersRes.ok) {
      const offersData = await offersRes.json();
      rawOffers = offersData.data || [];
    } else {
      console.warn(`fetch-real-lodging: hotel offers failed for ${resortName}: ${offersRes.status}`);
    }
  } catch (e) {
    console.error(`fetch-real-lodging: hotel offers error for ${resortName}:`, e);
  }

  // Parse offers into LodgingOption[]
  const parsedOptions: LodgingOption[] = rawOffers
    .filter((o: any) => o.available && o.offers?.length > 0)
    .map((o: any) => {
      const hotelId = o.hotel?.hotelId;
      const meta = hotelMeta[hotelId] || {};
      const name = o.hotel?.name || meta.name || "Unknown Hotel";
      const offer = o.offers[0];
      const totalPrice = parseFloat(offer?.price?.total || "0");
      const pricePerNight = nights > 0 ? Math.round(totalPrice / nights) : totalPrice;
      const costPerPerson = adults > 0 ? Math.round(totalPrice / adults) : totalPrice;
      const currency = offer?.price?.currency || "USD";
      const googleMapsQuery = encodeURIComponent(`${name} ${loc.cityName}`);

      return {
        name,
        hotelId,
        starRating: meta.rating,
        pricePerNight,
        totalPrice: Math.round(totalPrice),
        costPerPerson,
        currency,
        distanceFromResort: meta.distance,
        bookingUrl: `https://www.google.com/maps/search/${googleMapsQuery}`,
        source: "amadeus" as const,
      };
    });

  // Sort based on budget vibe: low=cheapest first, high=most expensive first, mid=mix
  parsedOptions.sort((a, b) => {
    if (budgetVibe >= 75) return (b.pricePerNight ?? 0) - (a.pricePerNight ?? 0); // luxury first
    return (a.pricePerNight ?? 0) - (b.pricePerNight ?? 0); // cheapest first
  });

  // Pick up to 3 options (cheapest, mid, premium if vibe is moderate)
  let selected: LodgingOption[] = [];
  if (parsedOptions.length > 0) {
    if (budgetVibe >= 25 && budgetVibe <= 74 && parsedOptions.length >= 3) {
      // Pick cheapest, middle, and most expensive for variety
      selected = [
        parsedOptions[0],
        parsedOptions[Math.floor(parsedOptions.length / 2)],
        parsedOptions[parsedOptions.length - 1],
      ];
    } else {
      selected = parsedOptions.slice(0, 3);
    }
  }

  const result: ResortLodging = { options: selected, searchLinks };

  // Cache the result
  try {
    await supabase
      .from("lodging_cache")
      .upsert(
        {
          resort_name: resortName,
          check_in_date: checkInDate,
          check_out_date: checkOutDate,
          adults,
          result_json: result,
          updated_at: new Date().toISOString(),
        },
        { onConflict: "resort_name,check_in_date,check_out_date,adults" }
      );
  } catch (e) {
    console.error("fetch-real-lodging: cache write failed:", e);
  }

  return result;
}

console.log("fetch-real-lodging: module ready, registering handler");

Deno.serve(async (req) => {
  console.log("fetch-real-lodging: handler invoked, method:", req.method);

  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabase = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!
    );

    const RequestSchema = z.object({
      resorts: z.array(z.string().max(100)).min(1).max(10),
      checkInDate: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
      checkOutDate: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
      adults: z.number().int().min(1).max(50),
      budgetPerNight: z.number().nullable().optional(),
      vibePreferences: z.object({
        energy: z.number().min(0).max(100),
        budget: z.number().min(0).max(100),
      }).optional(),
    });

    const parseResult = RequestSchema.safeParse(await req.json());
    if (!parseResult.success) {
      return new Response(
        JSON.stringify({ error: "Invalid request data" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const { resorts, checkInDate, checkOutDate, adults, vibePreferences } = parseResult.data;
    const budgetVibe = vibePreferences?.budget ?? 50;
    console.log("fetch-real-lodging: resorts:", resorts, "dates:", checkInDate, "→", checkOutDate, "adults:", adults);

    let amadeusToken: string;
    try {
      amadeusToken = await getAmadeusToken();
    } catch (e) {
      console.error("fetch-real-lodging: Amadeus auth failed:", e);
      // Return search links only
      const lodging: Record<string, ResortLodging> = {};
      for (const resort of resorts) {
        const loc = RESORT_LOCATIONS[resort];
        lodging[resort] = {
          options: [],
          searchLinks: loc
            ? buildSearchLinks(loc.cityName, resort, checkInDate, checkOutDate, adults)
            : buildSearchLinks(resort, resort, checkInDate, checkOutDate, adults),
        };
      }
      return new Response(
        JSON.stringify({ lodging }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const lodging: Record<string, ResortLodging> = {};
    for (const resort of resorts) {
      try {
        lodging[resort] = await fetchLodgingForResort(
          amadeusToken, resort, checkInDate, checkOutDate, adults, budgetVibe, supabase
        );
      } catch (e) {
        console.error(`fetch-real-lodging: error for ${resort}:`, e);
        const loc = RESORT_LOCATIONS[resort];
        lodging[resort] = {
          options: [],
          searchLinks: loc
            ? buildSearchLinks(loc.cityName, resort, checkInDate, checkOutDate, adults)
            : buildSearchLinks(resort, resort, checkInDate, checkOutDate, adults),
        };
      }
      // Rate limit delay between resorts
      await new Promise((r) => setTimeout(r, 300));
    }

    console.log("fetch-real-lodging: done");
    return new Response(
      JSON.stringify({ lodging }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (err) {
    console.error("fetch-real-lodging: unhandled error:", err);
    return new Response(
      JSON.stringify({ error: "Failed to fetch lodging data." }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
