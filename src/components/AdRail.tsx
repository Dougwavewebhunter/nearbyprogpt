import { useEffect, useMemo, useState } from "react";
import { supabase } from "@/integrations/supabase/client";

interface Ad {
  id: string; title: string; image_url: string; link_url: string | null;
  size: string; position: string; slot?: string | null;
  starts_at?: string | null; ends_at?: string | null; weight?: number | null;
}

const isLive = (a: Ad) => {
  const now = Date.now();
  if (a.starts_at && new Date(a.starts_at).getTime() > now) return false;
  if (a.ends_at && new Date(a.ends_at).getTime() < now) return false;
  return true;
};

export const AdRail = ({ position }: { position: "left" | "right" }) => {
  const [ads, setAds] = useState<Ad[]>([]);
  const [idx, setIdx] = useState(0);

  useEffect(() => {
    supabase.from("ads").select("*").eq("is_active", true).eq("position", position)
      .then(({ data }) => setAds(((data ?? []) as Ad[]).filter(isLive)));
  }, [position]);

  const pool = useMemo(() => {
    const arr: Ad[] = [];
    ads.forEach((a) => { for (let i = 0; i < Math.max(1, a.weight ?? 1); i++) arr.push(a); });
    return arr;
  }, [ads]);

  useEffect(() => {
    if (pool.length < 2) return;
    const t = setInterval(() => setIdx((i) => (i + 1) % pool.length), 5200);
    return () => clearInterval(t);
  }, [pool.length]);

  if (!ads.length) {
    return (
      <aside className="hidden lg:flex flex-col gap-3 w-52 shrink-0">
        <div className="text-[10px] uppercase tracking-[0.2em] text-white/70 text-center">Sponsored</div>
        {[1, 2, 3].map((i) => (
          <div key={i} className="rounded-2xl border border-white/20 bg-white/10 backdrop-blur p-4 text-center text-xs text-white/80 shadow-soft min-h-[120px] grid place-items-center">
            <div>
              <div className="font-semibold text-white mb-1">Advertise here</div>
              <div>Paid ad space #{i}</div>
            </div>
          </div>
        ))}
      </aside>
    );
  }

  const ordered = [...pool.slice(idx), ...pool.slice(0, idx)].slice(0, 3);
  return (
    <aside className="hidden lg:flex flex-col gap-3 w-52 shrink-0">
      <div className="text-[10px] uppercase tracking-[0.2em] text-white/75 text-center">Sponsored</div>
      <div className="space-y-3 overflow-hidden rounded-2xl">
        {ordered.map((ad, i) => (
          <a key={`${ad.id}-${idx}-${i}`} href={ad.link_url ?? "#"} target="_blank" rel="noreferrer"
             className="group block rounded-2xl overflow-hidden shadow-soft border border-white/20 bg-white/10 backdrop-blur animate-[ad-horizontal_5.2s_ease-in-out_infinite]">
            <img src={ad.image_url} alt={ad.title} className="w-full object-cover aspect-[16/10] group-hover:scale-105 transition-transform duration-500" />
            <div className="p-2 text-xs font-medium truncate bg-black/35 text-white">{ad.title}</div>
          </a>
        ))}
      </div>
    </aside>
  );
};
