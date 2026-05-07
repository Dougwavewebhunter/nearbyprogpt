import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { MapPin, MessageSquare, Eye, Star } from "lucide-react";
import { Button } from "@/components/ui/button";

interface P { id: string; business_name: string; location: string; avatar_url: string | null; cover_image: string | null; description: string | null; }

const Card = ({ p }: { p: P }) => (
  <div className="rounded-xl border bg-card shadow-soft overflow-hidden w-full">
    <div className="aspect-[4/3] bg-gradient-hero relative">
      {p.avatar_url ? (
        <img src={p.avatar_url} alt={p.business_name} className="absolute inset-0 w-full h-full object-cover" />
      ) : p.cover_image ? (
        <img src={p.cover_image} alt={p.business_name} className="absolute inset-0 w-full h-full object-cover" />
      ) : null}
    </div>
    <div className="p-3 space-y-2">
      <div className="font-semibold text-sm truncate">{p.business_name}</div>
      <div className="text-[11px] text-muted-foreground flex items-center gap-1">
        <MapPin className="h-3 w-3" />{p.location}
      </div>
      <div className="flex items-center gap-1 text-[11px]"><Star className="h-3 w-3 fill-accent text-accent" /> 4.8</div>
      <div className="flex flex-col gap-1.5 pt-1">
        <Button asChild size="sm" variant="outline" className="h-7 text-xs">
          <Link to={`/provider/${p.id}`}><Eye className="h-3 w-3 mr-1" />View details</Link>
        </Button>
        <Button asChild size="sm" className="h-7 text-xs bg-gradient-brand text-accent-foreground">
          <Link to={`/provider/${p.id}?chat=1`}><MessageSquare className="h-3 w-3 mr-1" />Chat now</Link>
        </Button>
      </div>
    </div>
  </div>
);

export const FeaturedProsRail = () => {
  const [pros, setPros] = useState<P[]>([]);
  useEffect(() => {
    supabase.from("providers").select("id,business_name,location,avatar_url,cover_image,description")
      .eq("is_active", true).limit(12)
      .then(({ data }) => setPros((data ?? []) as P[]));
  }, []);

  if (!pros.length) return null;

  // Vertical scrolling marquee, showing ~2 cards in viewport
  const loop = [...pros, ...pros];
  return (
    <aside className="hidden lg:flex flex-col gap-2 w-48 shrink-0 sticky top-24 self-start">
      <div className="text-[10px] uppercase tracking-wider text-muted-foreground text-center font-semibold">Featured Pros</div>
      <div className="relative h-[640px] overflow-hidden rounded-xl">
        <div className="flex flex-col gap-3 animate-[scroll-y_40s_linear_infinite] hover:[animation-play-state:paused]">
          {loop.map((p, i) => <Card key={`${p.id}-${i}`} p={p} />)}
        </div>
        <div className="pointer-events-none absolute inset-x-0 top-0 h-8 bg-gradient-to-b from-background to-transparent" />
        <div className="pointer-events-none absolute inset-x-0 bottom-0 h-8 bg-gradient-to-t from-background to-transparent" />
      </div>
    </aside>
  );
};
