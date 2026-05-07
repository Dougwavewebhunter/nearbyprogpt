import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { MapPin, MessageSquare, Eye, Radio } from "lucide-react";
import { Button } from "@/components/ui/button";

interface R { id: string; title: string; location: string; description: string | null; created_at: string; user_id: string; }

const Card = ({ r }: { r: R }) => (
  <div className="rounded-xl border bg-card shadow-soft p-3 space-y-2 w-full">
    <div className="flex items-center gap-1 text-[10px] text-accent font-semibold">
      <Radio className="h-3 w-3 animate-pulse" /> LIVE
    </div>
    <div className="font-semibold text-sm line-clamp-2">{r.title}</div>
    <div className="text-[11px] text-muted-foreground flex items-center gap-1">
      <MapPin className="h-3 w-3" />{r.location}
    </div>
    {r.description && <p className="text-[11px] text-muted-foreground line-clamp-2">{r.description}</p>}
    <div className="flex flex-col gap-1.5 pt-1">
      <Button asChild size="sm" variant="outline" className="h-7 text-xs">
        <Link to={`/requests/${r.id}`}><Eye className="h-3 w-3 mr-1" />Open request</Link>
      </Button>
      <Button asChild size="sm" className="h-7 text-xs bg-gradient-brand text-accent-foreground">
        <Link to={`/requests/${r.id}?chat=1`}><MessageSquare className="h-3 w-3 mr-1" />Chat in-app</Link>
      </Button>
    </div>
  </div>
);

export const LiveRequestsRail = () => {
  const [items, setItems] = useState<R[]>([]);

  useEffect(() => {
    supabase.from("service_requests").select("id,title,location,description,created_at,user_id")
      .eq("status", "open").order("created_at", { ascending: false }).limit(15)
      .then(({ data }) => setItems((data ?? []) as R[]));

    const ch = supabase.channel("rail-requests")
      .on("postgres_changes", { event: "INSERT", schema: "public", table: "service_requests" }, (p: any) => {
        setItems((prev) => [p.new as R, ...prev].slice(0, 15));
      }).subscribe();
    return () => { supabase.removeChannel(ch); };
  }, []);

  if (!items.length) return null;

  const loop = [...items, ...items];
  return (
    <aside className="hidden lg:flex flex-col gap-2 w-48 shrink-0 sticky top-24 self-start">
      <div className="text-[10px] uppercase tracking-wider text-accent text-center font-semibold flex items-center justify-center gap-1">
        <Radio className="h-3 w-3 animate-pulse" /> Live Requests
      </div>
      <div className="relative h-[640px] overflow-hidden rounded-xl">
        <div className="flex flex-col gap-3 animate-[scroll-y_45s_linear_infinite] hover:[animation-play-state:paused]">
          {loop.map((r, i) => <Card key={`${r.id}-${i}`} r={r} />)}
        </div>
        <div className="pointer-events-none absolute inset-x-0 top-0 h-8 bg-gradient-to-b from-background to-transparent" />
        <div className="pointer-events-none absolute inset-x-0 bottom-0 h-8 bg-gradient-to-t from-background to-transparent" />
      </div>
    </aside>
  );
};
