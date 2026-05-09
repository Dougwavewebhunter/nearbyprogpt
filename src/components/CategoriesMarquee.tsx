import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Wrench, Zap, Car, Scissors, HardHat, Sparkles, PaintBucket, Flame } from "lucide-react";

const ICONS: Record<string, any> = { Wrench, Zap, Car, Scissors, HardHat, Sparkles, PaintBucket, Flame };

export const CategoriesMarquee = () => {
  const [cats, setCats] = useState<any[]>([]);
  useEffect(() => {
    supabase.from("categories").select("*").then(({ data }) => setCats(data ?? []));
  }, []);
  if (!cats.length) return null;
  const loop = [...cats, ...cats];
  return (
    <div className="overflow-hidden">
      <div className="flex w-max gap-3 animate-[ticker_78s_linear_infinite] hover:[animation-play-state:paused]">
        {loop.map((c, i) => {
          const Icon = ICONS[c.icon] ?? Wrench;
          return (
            <Link key={`${c.id}-${i}`} to={`/browse?cat=${c.slug}`} className="shrink-0">
              <div className="flex items-center gap-2 px-4 py-2.5 rounded-full bg-white/15 backdrop-blur border border-white/25 hover:bg-accent hover:border-accent transition-all whitespace-nowrap text-sm font-medium text-white">
                <Icon className="h-4 w-4" /> {c.name}
              </div>
            </Link>
          );
        })}
      </div>
    </div>
  );
};
