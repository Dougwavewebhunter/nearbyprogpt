import { useEffect, useMemo, useState } from "react";
import { supabase } from "@/integrations/supabase/client";

interface Ad { id: string; title: string; image_url: string; link_url: string | null; is_active: boolean; starts_at?: string | null; ends_at?: string | null; weight?: number | null; }
const isLive = (a: Ad) => {
  if (!a.is_active) return false;
  const now = Date.now();
  if (a.starts_at && new Date(a.starts_at).getTime() > now) return false;
  if (a.ends_at && new Date(a.ends_at).getTime() < now) return false;
  return true;
};

export const MobileAdStrip = () => {
  const [ads, setAds] = useState<Ad[]>([]);
  useEffect(() => { supabase.from("ads").select("*").eq("is_active", true).then(({ data }) => setAds(((data ?? []) as Ad[]).filter(isLive))); }, []);
  const pool = useMemo(() => { const arr: Ad[] = []; ads.forEach((a) => { for (let i = 0; i < Math.max(1, a.weight ?? 1); i++) arr.push(a); }); return arr; }, [ads]);
  const placeholders = ["Advertise here", "Sponsored space", "Promote your business", "NearbyPro ads"];
  const loop = pool.length ? [...pool, ...pool] : [...placeholders, ...placeholders];
  return (
    <section className="lg:hidden border-y bg-secondary/40 overflow-hidden py-5">
      <div className="container">
        <div className="text-sm font-bold mb-3">Sponsored adverts</div>
        <div className="overflow-hidden">
          <div className="flex w-max gap-3 animate-[ticker_42s_linear_infinite]">
            {loop.map((a: any, i) => pool.length ? (
              <a key={`${a.id}-${i}`} href={a.link_url ?? "#"} target="_blank" rel="noreferrer" className="w-60 shrink-0 rounded-xl border bg-card overflow-hidden shadow-soft">
                <img src={a.image_url} alt={a.title} className="h-24 w-full object-cover" />
                <div className="p-2 text-xs font-semibold truncate">{a.title}</div>
              </a>
            ) : (
              <div key={i} className="w-60 shrink-0 rounded-xl border bg-card p-5 text-center text-sm shadow-soft">{a}</div>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
};
