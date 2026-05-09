import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { MapPin, MessageSquare, Eye, Radio, Clock } from "lucide-react";

interface R { id: string; title: string; location: string; description: string | null; created_at: string; user_id: string; view_count?: number | null; }
const fakeViews = (id: string) => (String(id).split("").reduce((s, c) => s + c.charCodeAt(0), 0) % 230) + 21;

export const HomeLiveRequestsGrid = () => {
  const [items, setItems] = useState<R[]>([]);

  useEffect(() => {
    supabase.from("service_requests").select("id,title,location,description,created_at,user_id")
      .eq("status", "open").order("created_at", { ascending: false }).limit(6)
      .then(({ data }) => setItems((data ?? []) as R[]));

    const ch = supabase.channel("home-live-requests")
      .on("postgres_changes", { event: "INSERT", schema: "public", table: "service_requests" }, (p: any) => {
        setItems((prev) => [p.new as R, ...prev].slice(0, 6));
      }).subscribe();
    return () => { supabase.removeChannel(ch); };
  }, []);

  return (
    <section>
      <div className="flex items-center justify-between mb-6">
        <div>
          <h2 className="text-2xl md:text-3xl font-bold flex items-center gap-2"><Radio className="h-5 w-5 text-accent animate-pulse" /> Live Requests</h2>
          <p className="text-sm text-muted-foreground mt-1">Fresh jobs posted by clients near you.</p>
        </div>
        <Button asChild variant="ghost"><Link to="/requests">View all →</Link></Button>
      </div>
      {items.length ? (
        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {items.map((r) => (
            <Card key={r.id} className="p-4 bg-gradient-card hover:border-accent hover:shadow-elegant transition-all">
              <div className="text-[10px] text-accent font-semibold flex items-center gap-1 mb-2"><Radio className="h-3 w-3 animate-pulse" /> LIVE JOB</div>
              <div className="font-semibold line-clamp-2">{r.title}</div>
              <div className="text-xs text-muted-foreground flex items-center gap-1 mt-2"><MapPin className="h-3 w-3" />{r.location}</div><div className="mt-2 flex flex-wrap gap-2 text-[11px] text-muted-foreground"><span className="inline-flex items-center gap-1"><Clock className="h-3 w-3" />{new Date(r.created_at).toLocaleString()}</span><span className="inline-flex items-center gap-1"><Eye className="h-3 w-3" />{r.view_count ?? fakeViews(r.id)} views</span></div>
              {r.description && <p className="text-sm text-muted-foreground mt-2 line-clamp-2">{r.description}</p>}
              <div className="flex gap-2 mt-4">
                <Button asChild size="sm" variant="outline" className="flex-1"><Link to={`/requests/${r.id}`}><Eye className="h-3.5 w-3.5 mr-1" />Open</Link></Button>
                <Button asChild size="sm" className="flex-1 bg-gradient-brand"><Link to={`/requests/${r.id}?chat=1`}><MessageSquare className="h-3.5 w-3.5 mr-1" />Chat</Link></Button>
              </div>
            </Card>
          ))}
        </div>
      ) : (
        <Card className="p-8 text-center text-muted-foreground">No live requests yet — <Link className="text-accent" to="/post-request">post the first job.</Link></Card>
      )}
    </section>
  );
};
