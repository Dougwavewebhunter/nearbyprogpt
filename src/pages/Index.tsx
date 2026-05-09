import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { Header } from "@/components/Header";
import { Footer } from "@/components/Footer";
import { Chatbot } from "@/components/Chatbot";
import { RequestsTicker } from "@/components/RequestsTicker";
import { CategoriesGrid } from "@/components/CategoriesGrid";
import { Typewriter } from "@/components/Typewriter";
import { CategoriesMarquee } from "@/components/CategoriesMarquee";
import { HomeLiveRequestsGrid } from "@/components/HomeLiveRequestsGrid";
import { DesktopAdRails } from "@/components/AdRail";
import { MobileAdStrip } from "@/components/MobileAdStrip";
import { HeroSideRail } from "@/components/HeroSideRail";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card } from "@/components/ui/card";
import { supabase } from "@/integrations/supabase/client";
import { Search, MapPin, Star, Shield, Clock, MessageSquare, Eye, Plus, Users } from "lucide-react";

const Index = () => {
  const [providers, setProviders] = useState<any[]>([]);
  const [q, setQ] = useState("");
  const [loc, setLoc] = useState("");

  useEffect(() => {
    supabase.from("providers")
      .select("id,business_name,location,description,cover_image,avatar_url,rating,review_count")
      .eq("is_active", true)
      .limit(6)
      .then(({ data }) => setProviders(data ?? []));
  }, []);

  return (
    <div className="min-h-screen flex flex-col">
      <Header onLocationClick={() => document.getElementById("hero-loc")?.focus()} />
      <RequestsTicker />

      <main className="flex-1">
        <section className="relative bg-gradient-hero text-white overflow-hidden">
          <div className="absolute inset-0 opacity-20 bg-[radial-gradient(circle_at_20%_20%,white,transparent_40%)]" />
          <div className="container relative py-10 md:py-16">
            <div className="flex gap-5 items-stretch">
              <HeroSideRail mode="pros" />
              <div className="flex-1 min-w-0 text-center">
                <h1 className="text-4xl md:text-6xl font-bold tracking-tight text-balance max-w-3xl mx-auto min-h-[1.2em] animate-fade-in">
                  <Typewriter phrases={["Find trusted local pros near you.", "Post a job and get quick replies.", "Chat safely inside NearbyPro.", "Hire verified South African services."]} />
                </h1>
                <p className="mt-4 text-lg opacity-90 max-w-xl mx-auto animate-[fade-in_0.8s_ease-out_0.25s_both]">
                  South Africa's marketplace for nearby service pros — plumbers, mechanics, IT, beauty, construction, cleaning and more.
                </p>

                <Card className="mt-7 max-w-2xl mx-auto p-2 flex flex-col sm:flex-row gap-2 shadow-elegant">
                  <div className="flex items-center gap-2 px-3 flex-1">
                    <Search className="h-4 w-4 text-muted-foreground" />
                    <Input value={q} onChange={(e) => setQ(e.target.value)} placeholder="What service?" className="border-0 focus-visible:ring-0 bg-transparent" />
                  </div>
                  <div className="flex items-center gap-2 px-3 flex-1 sm:border-l">
                    <MapPin className="h-4 w-4 text-muted-foreground" />
                    <Input id="hero-loc" value={loc} onChange={(e) => setLoc(e.target.value)} placeholder="City, suburb or province" className="border-0 focus-visible:ring-0 bg-transparent" />
                  </div>
                  <Button asChild size="lg" className="bg-gradient-brand shadow-glow">
                    <Link to={`/browse?q=${encodeURIComponent(q)}&loc=${encodeURIComponent(loc)}`}>Search</Link>
                  </Button>
                </Card>

                <div className="mt-5 flex flex-col sm:flex-row items-center justify-center gap-3">
                  <Button asChild size="lg" className="w-full sm:w-auto bg-white text-primary hover:bg-white/90 shadow-elegant">
                    <Link to="/become-pro"><Plus className="h-4 w-4 mr-2" />Provide your services</Link>
                  </Button>
                  <Button asChild size="lg" variant="outline" className="w-full sm:w-auto border-white/40 bg-white/10 text-white hover:bg-white/20">
                    <Link to="/browse"><Users className="h-4 w-4 mr-2" />Look for service providers</Link>
                  </Button>
                  <Button size="lg" className="w-full sm:w-auto bg-orange-500 hover:bg-orange-600 text-white shadow-glow" onClick={() => (window as any).triggerPwaInstall?.()}>
                    Install this app
                  </Button>
                </div>

                <div className="mt-7 max-w-full mx-auto rounded-2xl border border-white/20 bg-white/5 backdrop-blur p-2 shadow-soft">
                  <CategoriesMarquee />
                </div>
              </div>
              <HeroSideRail mode="requests" />
            </div>

          </div>
        </section>

        <div className="container py-10">
          <div className="space-y-12">
            <CategoriesGrid />

            <HomeLiveRequestsGrid />

            <section>
              <div className="flex items-center justify-between mb-6">
                <h2 className="text-2xl md:text-3xl font-bold">Featured pros</h2>
                <Button asChild variant="ghost"><Link to="/browse">View more featured pros →</Link></Button>
              </div>
              {providers.length ? (
                <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
                  {providers.slice(0, 6).map((p) => (
                    <Card key={p.id} className="overflow-hidden hover:border-accent hover:shadow-elegant transition-all bg-gradient-card flex flex-col">
                      <div className="aspect-video bg-gradient-hero relative">
                        {(p.avatar_url || p.cover_image) && <img src={p.avatar_url ?? p.cover_image} alt={p.business_name} className="absolute inset-0 w-full h-full object-cover" />}
                      </div>
                      <div className="p-4 flex-1 flex flex-col">
                        <div className="font-semibold">{p.business_name}</div>
                        <div className="text-xs text-muted-foreground flex items-center gap-1 mt-1"><MapPin className="h-3 w-3" />{p.location}</div>
                        <p className="text-sm text-muted-foreground mt-2 line-clamp-2">{p.description ?? "Trusted local pro on NearbyPro."}</p>
                        <div className="flex items-center gap-1 mt-3 text-sm"><Star className="h-4 w-4 text-accent fill-accent" /> {p.rating ?? "4.8"} <span className="text-muted-foreground">· {p.review_count ?? 0} reviews</span></div>
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

            <section className="grid md:grid-cols-3 gap-4">
              {[{ icon: Shield, title: "Verified pros", desc: "Real reviews, real ratings, real people." }, { icon: MessageSquare, title: "In-app chat", desc: "Customers and providers can chat safely inside NearbyPro." }, { icon: Clock, title: "Hyper-local", desc: "Search by city, suburb and province across South Africa." }].map((f) => (
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

      <DesktopAdRails />
      <MobileAdStrip />
      <Footer />
      <Chatbot />
    </div>
  );
};

export default Index;
