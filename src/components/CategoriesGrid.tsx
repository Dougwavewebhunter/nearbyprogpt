import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import * as Icons from "lucide-react";
import { ChevronRight } from "lucide-react";

type Cat = { id: string; name: string; slug: string; icon: string | null };
type Sub = { id: string; name: string; slug: string; category_id: string };

const renderIcon = (name: string | null, className = "h-6 w-6") => {
  const Cmp = (name && (Icons as any)[name]) || Icons.Wrench;
  return <Cmp className={className} />;
};

export const CategoriesGrid = () => {
  const [cats, setCats] = useState<Cat[]>([]);
  const [subs, setSubs] = useState<Sub[]>([]);
  const [open, setOpen] = useState<Cat | null>(null);
  const [showAll, setShowAll] = useState(false);

  useEffect(() => {
    supabase.from("categories").select("id,name,slug,icon").then(({ data }) => {
      const preferred = ["plumbing","electrical","construction","mechanics","painting","cleaning","beauty-grooming","it-technology","gardening-landscaping","carpentry-furniture","welding-metalwork","dstv-installations"];
      const sorted = ((data ?? []) as Cat[]).sort((a,b) => {
        const ai = preferred.indexOf(a.slug); const bi = preferred.indexOf(b.slug);
        if (ai !== -1 || bi !== -1) return (ai === -1 ? 999 : ai) - (bi === -1 ? 999 : bi);
        return a.name.localeCompare(b.name);
      });
      setCats(sorted);
    });
    supabase.from("subcategories").select("id,name,slug,category_id").then(({ data }) => setSubs((data ?? []) as Sub[]));
  }, []);

  const visible = showAll ? cats : cats.slice(0, 12);
  const subFor = (catId: string) => subs.filter((s) => s.category_id === catId);

  return (
    <section>
      <div className="flex items-center justify-between mb-6">
        <div>
          <h2 className="text-2xl md:text-3xl font-bold">Browse services</h2>
                  </div>
        <Button asChild variant="ghost" size="sm"><Link to="/browse">All services →</Link></Button>
      </div>

      <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-3">
        {visible.map((c) => {
          const hasSubs = subFor(c.id).length > 0;
          const inner = (
            <Card className="p-4 h-full flex flex-col items-center justify-center text-center gap-2 hover:border-accent hover:shadow-elegant hover:-translate-y-0.5 transition-all bg-gradient-card cursor-pointer">
              <div className="h-11 w-11 rounded-xl bg-accent/10 text-accent grid place-items-center">
                {renderIcon(c.icon, "h-5 w-5")}
              </div>
              <div className="text-sm font-semibold leading-tight">{c.name}</div>
              {hasSubs && <div className="text-[10px] text-muted-foreground flex items-center gap-0.5">{subFor(c.id).length} services <ChevronRight className="h-3 w-3" /></div>}
            </Card>
          );
          return hasSubs ? (
            <button key={c.id} onClick={() => setOpen(c)} className="text-left">{inner}</button>
          ) : (
            <Link key={c.id} to={`/browse?cat=${c.slug}`}>{inner}</Link>
          );
        })}
      </div>

      {cats.length > 12 && (
        <div className="text-center mt-4">
          <Button variant="outline" onClick={() => setShowAll((s) => !s)}>
            {showAll ? "Show less" : `View all ${cats.length} service categories`}
          </Button>
        </div>
      )}

      <Dialog open={!!open} onOpenChange={(v) => !v && setOpen(null)}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              {open && renderIcon(open.icon, "h-5 w-5 text-accent")}
              {open?.name}
            </DialogTitle>
          </DialogHeader>
          <div className="grid grid-cols-2 gap-2">
            {open && subFor(open.id).map((s) => (
              <Link key={s.id} to={`/browse?cat=${open.slug}&sub=${s.slug}`} onClick={() => setOpen(null)}
                className="p-3 rounded-lg border hover:border-accent hover:bg-accent/5 text-sm transition-colors">
                {s.name}
              </Link>
            ))}
            <Link to={`/browse?cat=${open?.slug}`} onClick={() => setOpen(null)}
              className="p-3 rounded-lg border bg-gradient-brand text-accent-foreground text-sm font-medium text-center col-span-2">
              View all in {open?.name} →
            </Link>
          </div>
        </DialogContent>
      </Dialog>
    </section>
  );
};
