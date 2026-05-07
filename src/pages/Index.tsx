import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { Header } from "@/components/Header";
import { Footer } from "@/components/Footer";
import { Chatbot } from "@/components/Chatbot";
import { RequestsTicker } from "@/components/RequestsTicker";
import { Counter } from "@/components/Counter";
import { CategoriesGrid } from "@/components/CategoriesGrid";
import { Typewriter } from "@/components/Typewriter";
import { CategoriesMarquee } from "@/components/CategoriesMarquee";
import { HomeLiveRequestsGrid } from "@/components/HomeLiveRequestsGrid";
import { AdRail } from "@/components/AdRail";
import { MobileAdStrip } from "@/components/MobileAdStrip";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card } from "@/components/ui/card";
import { supabase } from "@/integrations/supabase/client";
import { Search, MapPin, Star, Shield, Clock, MessageSquare, Eye } from "lucide-react";

const Index = () => {
  const [providers, setProviders] = useState<any[]>([]);
  const [q, setQ] = useState("");
  const [loc, setLoc] = useState("");

  useEffect(() => {
    supabase.from("providers").select("id,business_name,location,description,cover_image,avatar_url").eq("is_active", true).limit(6)
      .then(({ data }) => setProviders(data ?? []));
  }, []);

  return (
    <div className="min-h-screen flex flex-col">
      <Header onLocationClick={() => document.getElementById("hero-loc")?.focus()} />
      <RequestsTicker />
      <MobileAdStrip />

      <main className="flex-1">
        {/* Hero */}
        <section className="relative bg-gradient-hero text-white overflow-hidden">
          <div className="absolute inset-0 opacity-20 bg-[radial-gradient(circle_at_20%_20%,white,transparent_40%)]" />
          <div className="container relative py-14 md:py-20">
            <div className="flex gap-6 items-start">
              <AdRail position="left" />
              <div className="flex-1 min-w-0 text-center">
                <h1 className="text-4xl md:text-6xl font-bold tracking-tight text-balance max-w-3xl mx-auto min-h-[1.2em] animate-fade-in">
                  <Typewriter
                    phrases={[
                      "Find trusted local pros near you.",
                      "Plumbers ready in minutes.",
                      "Electricians you can trust.",
                      "Mechanics on your street.",
                      "Stylists, cleaners, painters & more.",
                    ]}
                  />
                </h1>
                <p className="mt-4 text-lg opacity-90 max-w-xl mx-auto animate-[fade-in_0.8s_ease-out_0.25s_both]">
                  South Africa's marketplace for nearby service pros — chat in-app, hire with confidence.
                </p>

                <Card className="mt-8 max-w-2xl mx-auto p-2 flex flex-col sm:flex-row gap-2 shadow-elegant">
                  <div className="flex items-center gap-2 px-3 flex-1">
                    <Search className="h-4 w-4 text-muted-foreground" />
                    <Input value={q} onChange={(e) => setQ(e.target.value)} placeholder="What service?" className="border-0 focus-visible:ring-0 bg-transparent" />
                  </div>
                  <div className="flex items-center gap-2 px-3 flex-1 sm:border-l">
                    <MapPin className="h-4 w-4 text-muted-foreground" />
                    <Input id="hero-loc" value={loc} onChange={(e) => setLoc(e.target.value)} placeholder="Location" className="border-0 focus-visible:ring-0 bg-transparent" />
                  </div>
                  <Button asChild size="lg" className="bg-gradient-brand shadow-glow">
                    <Link to={`/browse?q=${encodeURIComponent(q)}&loc=${encodeURIComponent(loc)}`}>Search</Link>
                  </Button>
                </Card>

                <div className="mt-4 max-w-2xl mx-auto rounded-2xl border border-white/20 bg-white/5 backdrop-blur p-2 shadow-soft">
                  <CategoriesMarquee />
                </div>
              </div>
              <AdRail position="right" />
            </div>
          </div>
        </section>

        <div className="container py-10">
          <div className="space-y-12">
            {/* Categories first — drives discovery */}
            <CategoriesGrid />

            {/* Featured providers grid */}
            <section>
              <div className="flex items-center justify-between mb-6">
                <h2 className="text-2xl md:text-3xl font-bold">Featured pros</h2>
                <Button asChild variant="ghost"><Link to="/browse">View all →</Link></Button>
              </div>
              {providers.length ? (
                <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
                  {providers.map((p) => (
                    <Card key={p.id} className="overflow-hidden hover:border-accent hover:shadow-elegant transition-all bg-gradient-card flex flex-col">
                      <div className="aspect-video bg-gradient-hero relative">
                        {(p.avatar_url || p.cover_image) && (
                          <img src={p.avatar_url ?? p.cover_image} alt={p.business_name} className="absolute inset-0 w-full h-full object-cover" />
                        )}
                      </div>
                      <div className="p-4 flex-1 flex flex-col">
                        <div className="font-semibold">{p.business_name}</div>
                        <div className="text-xs text-muted-foreground flex items-center gap-1 mt-1"><MapPin className="h-3 w-3" />{p.location}</div>
                        <p className="text-sm text-muted-foreground mt-2 line-clamp-2">{p.description ?? "Trusted local pro on NearbyPro."}</p>
                        <div className="flex items-center gap-1 mt-3 text-sm"><Star className="h-4 w-4 text-accent fill-accent" /> 4.8 <span className="text-muted-foreground">· New</span></div>
                        <div className="flex gap-2 mt-4">
                          <Button asChild size="sm" variant="outline" className="flex-1"><Link to={`/provider/${p.id}`}><Eye className="h-3.5 w-3.5 mr-1" />Details</Link></Button>
                          <Button asChild size="sm" className="flex-1 bg-gradient-brand"><Link to={`/provider/${p.id}?chat=1`}><MessageSquare className="h-3.5 w-3.5 mr-1" />Chat</Link></Button>
                        </div>
                      </div>
                    </Card>
                  ))}
                </div>
              ) : (
                <Card className="p-8 text-center text-muted-foreground">No pros listed yet — <Link className="text-accent" to="/become-pro">be the first!</Link></Card>
              )}
            </section>

            <HomeLiveRequestsGrid />

            {/* Trust strip — compact, no large counters */}
            <section className="grid md:grid-cols-3 gap-4">
              {[
                { icon: Shield, title: "Verified pros", desc: "Real reviews, real ratings, real people." },
                { icon: MessageSquare, title: "In-app chat only", desc: "All conversations stay safely inside NearbyPro." },
                { icon: Clock, title: "Hyper-local", desc: "Find pros in your suburb, not across the country." },
              ].map((f) => (
                <Card key={f.title} className="p-6 bg-gradient-card">
                  <f.icon className="h-6 w-6 text-accent mb-3" />
                  <div className="font-semibold mb-1">{f.title}</div>
                  <div className="text-sm text-muted-foreground">{f.desc}</div>
                </Card>
              ))}
            </section>
          </div>
        </div>
      </main>

      <Footer />
      <Chatbot />
    </div>
  );
};

export default Index;
