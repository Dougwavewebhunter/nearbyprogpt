import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { MapPin, MessageSquare, Briefcase } from "lucide-react";

type Mode = "pros" | "requests";

export const HeroSideRail = ({ mode }: { mode: Mode }) => {
  const [items, setItems] = useState<any[]>([]);

  useEffect(() => {
    if (mode === "pros") {
      supabase.from("providers")
        .select("id,business_name,location,avatar_url,cover_image,description")
        .eq("is_active", true)
        .order("created_at", { ascending: false })
        .limit(10)
        .then(({ data }) => setItems(data ?? []));
    } else {
      supabase.from("service_requests")
        .select("id,title,location,created_at")
        .eq("status", "open")
        .order("created_at", { ascending: false })
        .limit(10)
        .then(({ data }) => setItems(data ?? []));
    }
  }, [mode]);

  const fallback = mode === "pros"
    ? ["Plumber in Johannesburg", "Mobile mechanic in Pretoria", "Electrician in Durban", "Painter in Cape Town"]
    : ["Need tiler urgently", "Looking for hairdresser", "Office cleaning quote", "DSTV installer needed"];
  const rows = items.length ? [...items, ...items] : [...fallback, ...fallback].map((title, i) => ({ id: `f-${i}`, title, business_name: title, location: "South Africa" }));

  return (
    <aside className="hidden xl:block w-56 shrink-0">
      <div className="rounded-3xl border border-white/15 bg-white/10 backdrop-blur p-3 h-[430px] overflow-hidden shadow-soft">
        <div className="text-center text-[10px] uppercase tracking-[0.18em] text-white/75 mb-3">
          {mode === "pros" ? "Featured pros live" : "Live requests now"}
        </div>
        <div className="space-y-3 animate-[scroll-y_38s_linear_infinite] hover:[animation-play-state:paused]">
          {rows.map((r, i) => (
            <Link key={`${r.id}-${i}`} to={mode === "pros" ? `/provider/${r.id}` : `/requests/${r.id}`}
              className="block rounded-2xl border border-white/15 bg-black/25 p-3 text-left hover:border-accent transition-colors">
              <div className="flex items-center gap-2">
                <div className="h-9 w-9 rounded-full bg-white/10 overflow-hidden grid place-items-center text-accent">
                  {mode === "pros" && (r.avatar_url || r.cover_image) ? <img src={r.avatar_url ?? r.cover_image} alt="" className="h-full w-full object-cover" /> : mode === "pros" ? <MessageSquare className="h-4 w-4" /> : <Briefcase className="h-4 w-4" />}
                </div>
                <div className="min-w-0">
                  <div className="text-xs font-semibold text-white truncate">{mode === "pros" ? r.business_name : r.title}</div>
                  <div className="text-[10px] text-white/65 flex items-center gap-1 truncate"><MapPin className="h-3 w-3" />{r.location}</div>
                </div>
              </div>
            </Link>
          ))}
        </div>
      </div>
    </aside>
  );
};
