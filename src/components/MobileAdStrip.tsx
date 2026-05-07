import { useEffect, useMemo, useState } from "react";
import { supabase } from "@/integrations/supabase/client";

interface Ad {
  id: string; title: string; image_url: string; link_url: string | null;
  is_active: boolean; starts_at?: string | null; ends_at?: string | null; weight?: number | null;
}

const isLive = (a: Ad) => {
  if (!a.is_active) return false;
  const now = Date.now();
  if (a.starts_at && new Date(a.starts_at).getTime() > now) return false;
  if (a.ends_at && new Date(a.ends_at).getTime() < now) return false;
  return true;
};

export const MobileAdStrip = () => {
  const [ads, setAds] = useState<Ad[]>([]);
  useEffect(() => {
    supabase.from("ads").select("*").eq("is_active", true)
      .then(({ data }) => setAds(((data ?? []) as Ad[]).filter(isLive)));
  }, []);

  const pool = useMemo(() => {
    const arr: Ad[] = [];
    ads.forEach((a) => { for (let i = 0; i < Math.max(1, a.weight ?? 1); i++) arr.push(a); });
    return arr;
  }, [ads]);

  if (!pool.length) return null;
  const loop = [...pool, ...pool];

  return (
    <div className="lg:hidden border-y bg-secondary/40 overflow-hidden">
      <div className="flex items-center gap-3 py-2 px-3">
        <span className="text-[10px] uppercase tracking-wider text-muted-foreground shrink-0">Sponsored</span>
        <div className="overflow-hidden flex-1">
          <div className="flex w-max gap-3 animate-[ticker_50s_linear_infinite]">
            {loop.map((a, i) => (
              <a key={`${a.id}-${i}`} href={a.link_url ?? "#"} target="_blank" rel="noreferrer"
                 className="flex items-center gap-2 shrink-0 rounded-md border bg-card px-2 py-1 hover:border-accent transition-colors">
                <img src={a.image_url} alt={a.title} className="h-8 w-8 object-cover rounded" />
                <span className="text-xs font-medium whitespace-nowrap">{a.title}</span>
              </a>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};
