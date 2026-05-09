import { useEffect, useState } from "react";
import { Header } from "@/components/Header";
import { Footer } from "@/components/Footer";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { supabase } from "@/integrations/supabase/client";
import { Link } from "react-router-dom";
import { MapPin, Plus, Clock, Eye, MessageSquare } from "lucide-react";

const fakeViews = (id: string) => (String(id).split("").reduce((s, c) => s + c.charCodeAt(0), 0) % 230) + 21;

const Requests = () => {
  const [list, setList] = useState<any[]>([]);
  useEffect(() => { supabase.from("service_requests").select("*").eq("status", "open").order("created_at", { ascending: false }).then(({ data }) => setList(data ?? [])); }, []);
  return (
    <div className="min-h-screen flex flex-col">
      <Header />
      <main className="container py-8 flex-1">
        <div className="flex items-center justify-between mb-6">
          <h1 className="text-3xl font-bold">Service requests</h1>
          <Button asChild className="bg-gradient-brand"><Link to="/post-request"><Plus className="h-4 w-4 mr-1" />Post request</Link></Button>
        </div>
        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {list.map((r) => (
            <Link key={r.id} to={`/requests/${r.id}`}>
              <Card className="p-5 bg-gradient-card hover:shadow-elegant hover:border-accent transition-all h-full">
                <div className="font-semibold text-lg">{r.title}</div>
                <div className="text-xs text-muted-foreground flex items-center gap-1 mt-1"><MapPin className="h-3 w-3" />{r.location}</div><div className="mt-2 flex flex-wrap gap-2 text-[11px] text-muted-foreground"><span className="inline-flex items-center gap-1"><Clock className="h-3 w-3" />{new Date(r.created_at).toLocaleString()}</span><span className="inline-flex items-center gap-1"><Eye className="h-3 w-3" />{r.view_count ?? fakeViews(r.id)} views</span><span className="inline-flex items-center gap-1"><MessageSquare className="h-3 w-3" />Chat now</span></div>
                <p className="text-sm text-muted-foreground mt-3 line-clamp-3">{r.description}</p>
                <div className="text-xs text-accent font-medium mt-3">Open & chat in-app →</div>
              </Card>
            </Link>
          ))}
          {!list.length && <Card className="p-12 col-span-full text-center text-muted-foreground">No open requests yet.</Card>}
        </div>
      </main>
      <Footer />
    </div>
  );
};
export default Requests;
