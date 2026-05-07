import { useEffect, useState } from "react";
import { Link, useSearchParams } from "react-router-dom";
import { Header } from "@/components/Header";
import { Footer } from "@/components/Footer";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { supabase } from "@/integrations/supabase/client";
import { MapPin, Search, Star } from "lucide-react";

const Browse = () => {
  const [params, setParams] = useSearchParams();
  const [q, setQ] = useState(params.get("q") ?? "");
  const [loc, setLoc] = useState(params.get("loc") ?? "");
  const [cat, setCat] = useState(params.get("cat") ?? "");
  const [cats, setCats] = useState<any[]>([]);
  const [providers, setProviders] = useState<any[]>([]);

  useEffect(() => { supabase.from("categories").select("*").then(({ data }) => setCats(data ?? [])); }, []);

  useEffect(() => {
    (async () => {
      let qy = supabase.from("providers").select("id,business_name,location,description,cover_image,category_id,services").eq("is_active", true);
      if (loc) qy = qy.ilike("location", `%${loc}%`);
      if (q) qy = qy.or(`business_name.ilike.%${q}%,description.ilike.%${q}%`);
      if (cat) {
        const c = cats.find((x) => x.slug === cat);
        if (c) qy = qy.eq("category_id", c.id);
      }
      const { data } = await qy.limit(50);
      setProviders(data ?? []);
    })();
  }, [q, loc, cat, cats]);

  const apply = () => setParams({ q, loc, cat });

  return (
    <div className="min-h-screen flex flex-col">
      <Header />
      <main className="container flex-1 py-8">
        <h1 className="text-3xl font-bold mb-6">Browse pros</h1>
        <Card className="p-3 flex flex-col md:flex-row gap-2 mb-6 shadow-soft">
          <div className="flex items-center gap-2 px-3 flex-1"><Search className="h-4 w-4" /><Input value={q} onChange={(e) => setQ(e.target.value)} placeholder="Service" className="border-0 focus-visible:ring-0" /></div>
          <div className="flex items-center gap-2 px-3 flex-1 md:border-l"><MapPin className="h-4 w-4" /><Input value={loc} onChange={(e) => setLoc(e.target.value)} placeholder="Location" className="border-0 focus-visible:ring-0" /></div>
          <Button onClick={apply} className="bg-gradient-brand">Search</Button>
        </Card>

        <div className="flex gap-2 mb-6 overflow-x-auto pb-2">
          <Button size="sm" variant={!cat ? "default" : "outline"} onClick={() => setCat("")}>All</Button>
          {cats.map((c) => (
            <Button key={c.id} size="sm" variant={cat === c.slug ? "default" : "outline"} onClick={() => setCat(c.slug)}>{c.name}</Button>
          ))}
        </div>

        {providers.length ? (
          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {providers.map((p) => (
              <Link key={p.id} to={`/provider/${p.id}`}>
                <Card className="overflow-hidden hover:border-accent hover:shadow-elegant transition-all bg-gradient-card">
                  <div className="aspect-video bg-gradient-hero" />
                  <div className="p-4">
                    <div className="font-semibold">{p.business_name}</div>
                    <div className="text-xs text-muted-foreground flex items-center gap-1 mt-1"><MapPin className="h-3 w-3" />{p.location}</div>
                    <p className="text-sm text-muted-foreground mt-2 line-clamp-2">{p.description}</p>
                    <div className="flex items-center gap-1 mt-3 text-sm"><Star className="h-4 w-4 text-accent fill-accent" /> 4.8</div>
                  </div>
                </Card>
              </Link>
            ))}
          </div>
        ) : (
          <Card className="p-12 text-center text-muted-foreground">No pros match your search yet.</Card>
        )}
      </main>
      <Footer />
    </div>
  );
};
export default Browse;
