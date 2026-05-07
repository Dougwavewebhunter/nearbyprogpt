import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Megaphone } from "lucide-react";
import { Link } from "react-router-dom";

interface Req { id: string; title: string; location: string; }

export const RequestsTicker = () => {
  const [items, setItems] = useState<Req[]>([]);
  useEffect(() => {
    supabase.from("service_requests").select("id,title,location").order("created_at", { ascending: false }).limit(20)
      .then(({ data }) => setItems(data ?? []));
    const ch = supabase.channel("ticker").on("postgres_changes", { event: "INSERT", schema: "public", table: "service_requests" }, (p: any) => {
      setItems((prev) => [{ id: p.new.id, title: p.new.title, location: p.new.location }, ...prev].slice(0, 20));
    }).subscribe();
    return () => { supabase.removeChannel(ch); };
  }, []);
  if (!items.length) return null;
  const loop = [...items, ...items];
  return (
    <div className="border-y bg-secondary/40 overflow-hidden">
      <div className="container flex items-center gap-3 py-2">
        <span className="flex items-center gap-1.5 text-xs font-semibold text-accent shrink-0">
          <Megaphone className="h-4 w-4" /> LIVE REQUESTS
        </span>
        <div className="overflow-hidden flex-1">
          <div className="ticker gap-8">
            {loop.map((r, i) => (
              <Link key={i} to={`/requests`} className="text-sm whitespace-nowrap hover:text-accent transition-colors">
                <span className="font-medium">{r.title}</span> <span className="text-muted-foreground">— {r.location}</span>
              </Link>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};
