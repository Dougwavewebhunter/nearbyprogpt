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
    const t = setInterval(() => setIdx((i) => (i + 1) % pool.length), 4500);
    return () => clearInterval(t);
  }, [pool.length]);

  const placeholders = [1, 2, 3, 4];
  const ordered = pool.length ? [...pool.slice(idx), ...pool.slice(0, idx)].slice(0, 4) : [];

  return (
    <aside className="hidden xl:flex flex-col gap-3 w-44 shrink-0">
      <div className="text-[10px] uppercase tracking-[0.2em] text-muted-foreground text-center font-semibold">Sponsored ads</div>
      <div className="h-[calc(100vh-260px)] max-h-[620px] min-h-[360px] overflow-hidden rounded-2xl border bg-white/80 backdrop-blur shadow-soft p-2">
        <div className="flex flex-col gap-3 animate-[scroll-y_26s_linear_infinite] hover:[animation-play-state:paused]">
          {(ordered.length ? [...ordered, ...ordered] : [...placeholders, ...placeholders]).map((item: any, i) => (
            ordered.length ? (
              <a key={`${item.id}-${i}`} href={item.link_url ?? "#"} target="_blank" rel="noreferrer" className="group block rounded-xl overflow-hidden shadow-soft border bg-card hover:border-accent transition-all">
                <img src={item.image_url} alt={item.title} className="w-full object-cover aspect-[4/3] group-hover:scale-105 transition-transform duration-500" />
                <div className="p-2 text-xs font-medium truncate bg-card">{item.title}</div>
              </a>
            ) : (
              <div key={i} className="rounded-xl border bg-gradient-card p-4 text-center text-xs text-muted-foreground shadow-soft min-h-[112px] grid place-items-center">
                <div><div className="font-semibold text-foreground mb-1">Advertise here</div><div>Paid ad space</div></div>
              </div>
            )
          ))}
        </div>
      </div>
    </aside>
  );
};

export const DesktopAdRails = () => (
  <div className="hidden xl:block pointer-events-none">
    <div className="fixed left-4 top-[calc(100vh-320px)] bottom-20 z-20 pointer-events-auto"><AdRail position="left" /></div>
    <div className="fixed right-4 top-[calc(100vh-320px)] bottom-20 z-20 pointer-events-auto"><AdRail position="right" /></div>
  </div>
);
