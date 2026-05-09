import { useEffect, useState } from "react";
import { useParams, useNavigate, Link } from "react-router-dom";
import { Header } from "@/components/Header";
import { Footer } from "@/components/Footer";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { MapPin, Star, MessageSquare, Image as ImageIcon, Share2, Copy, Facebook } from "lucide-react";
import { toast } from "sonner";

const ProviderDetail = () => {
  const { id } = useParams();
  const nav = useNavigate();
  const { user } = useAuth();
  const [p, setP] = useState<any>(null);
  const [reviews, setReviews] = useState<any[]>([]);
  const [rating, setRating] = useState(5);
  const [comment, setComment] = useState("");

  const load = async () => {
    const { data } = await supabase.from("providers").select("*").eq("id", id!).maybeSingle();
    setP(data);
    const { data: rs } = await supabase.from("reviews").select("*").eq("provider_id", id!).order("created_at", { ascending: false });
    setReviews(rs ?? []);
  };
  useEffect(() => { if (id) load(); }, [id]);

  const avg = reviews.length ? (reviews.reduce((s, r) => s + r.rating, 0) / reviews.length).toFixed(1) : "—";
  const gallery = Array.from(new Set([p?.avatar_url, p?.cover_image, ...(Array.isArray(p?.gallery) ? p.gallery : [])].filter(Boolean))) as string[];

  const slug = String(p?.business_name ?? "provider").toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/(^-|-$)/g, "");
  const profileUrl = `${window.location.origin}/pro/${id}/${slug}`;
  const shareText = `View ${p?.business_name ?? "this NearbyPro provider"} on NearbyPro`;
  const shareWhatsApp = () => window.open(`https://wa.me/?text=${encodeURIComponent(`${shareText}: ${profileUrl}`)}`, "_blank");
  const shareFacebook = () => window.open(`https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(profileUrl)}`, "_blank");
  const copyLink = async () => {
    await navigator.clipboard.writeText(profileUrl);
    toast.success("Profile link copied");
  };

  const startChat = async () => {
    if (!user) { nav("/auth"); return; }
    const { data: existing } = await supabase.from("conversations").select("id").eq("user_id", user.id).eq("provider_id", id!).maybeSingle();
    let convId = existing?.id;
    if (!convId) {
      const { data: c, error } = await supabase.from("conversations").insert({ user_id: user.id, provider_id: id! }).select("id").single();
      if (error) return toast.error(error.message);
      convId = c.id;
    }
    nav(`/messages/${convId}`);
  };

  const submitReview = async () => {
    if (!user) return nav("/auth");
    const { error } = await supabase.from("reviews").upsert({ provider_id: id!, user_id: user.id, rating, comment }, { onConflict: "provider_id,user_id" });
    if (error) toast.error(error.message); else { toast.success("Review posted"); setComment(""); load(); }
  };

  if (!p) return <div className="min-h-screen flex flex-col"><Header /><div className="container py-12">Loading...</div><Footer /></div>;

  return (
    <div className="min-h-screen flex flex-col">
      <Header />
      <main className="container py-8 flex-1 grid lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 space-y-6">
          <Card className="overflow-hidden">
            <div className="aspect-[3/1] bg-gradient-hero relative">
              {(p.cover_image || p.avatar_url) && <img src={p.cover_image ?? p.avatar_url} alt={p.business_name} className="absolute inset-0 w-full h-full object-cover" />}
              <div className="absolute inset-0 bg-gradient-to-t from-black/55 to-transparent" />
            </div>
            <div className="p-6">
              <h1 className="text-3xl font-bold">{p.business_name}</h1>
              <div className="flex items-center gap-3 text-sm text-muted-foreground mt-1">
                <span className="flex items-center gap-1"><MapPin className="h-4 w-4" />{p.location}</span>
                <span className="flex items-center gap-1"><Star className="h-4 w-4 text-accent fill-accent" />{avg} ({reviews.length})</span>
              </div>
              <p className="mt-4 text-muted-foreground">{p.description ?? "Trusted local pro on NearbyPro."}</p>
              {Array.isArray(p.services) && p.services.length > 0 && (
                <div className="flex flex-wrap gap-2 mt-4">
                  {p.services.map((s: string, i: number) => <span key={i} className="text-xs px-3 py-1 rounded-full bg-secondary">{s}</span>)}
                </div>
              )}
              <div className="mt-5 grid grid-cols-1 sm:grid-cols-3 gap-2">
                <Button type="button" variant="outline" onClick={shareWhatsApp}><Share2 className="h-4 w-4 mr-2" />Share on WhatsApp</Button>
                <Button type="button" variant="outline" onClick={shareFacebook}><Facebook className="h-4 w-4 mr-2" />Share on Facebook</Button>
                <Button type="button" variant="outline" onClick={copyLink}><Copy className="h-4 w-4 mr-2" />Copy profile link</Button>
              </div>
            </div>
          </Card>

          <Card className="p-6">
            <h2 className="text-xl font-bold mb-4 flex items-center gap-2"><ImageIcon className="h-5 w-5 text-accent" /> Work photos & gallery</h2>
            {gallery.length ? (
              <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
                {gallery.map((url) => (
                  <a key={url} href={url} target="_blank" rel="noreferrer" className="block rounded-xl overflow-hidden border bg-secondary hover:border-accent transition-all">
                    <img src={url} alt={`${p.business_name} work`} className="aspect-video w-full object-cover hover:scale-105 transition-transform duration-500" />
                  </a>
                ))}
              </div>
            ) : (
              <div className="rounded-xl border bg-secondary/50 p-6 text-sm text-muted-foreground text-center">No work photos uploaded yet.</div>
            )}
          </Card>

          <Card className="p-6">
            <h2 className="text-xl font-bold mb-4">Reviews</h2>
            {user && (
              <div className="space-y-2 mb-6 p-4 rounded-xl bg-secondary/50">
                <div className="flex gap-1">
                  {[1,2,3,4,5].map((n) => (
                    <button key={n} onClick={() => setRating(n)}><Star className={`h-6 w-6 ${n <= rating ? "fill-accent text-accent" : "text-muted-foreground"}`} /></button>
                  ))}
                </div>
                <Textarea value={comment} onChange={(e) => setComment(e.target.value)} placeholder="Share your experience..." />
                <Button onClick={submitReview} className="bg-gradient-brand">Post review</Button>
              </div>
            )}
            <div className="space-y-3">
              {reviews.map((r) => (
                <div key={r.id} className="border-b pb-3 last:border-0">
                  <div className="flex gap-1 mb-1">{Array.from({length: r.rating}).map((_,i) => <Star key={i} className="h-4 w-4 fill-accent text-accent" />)}</div>
                  <p className="text-sm">{r.comment}</p>
                </div>
              ))}
              {!reviews.length && <div className="text-sm text-muted-foreground">No reviews yet.</div>}
            </div>
          </Card>
        </div>

        <aside className="space-y-4">
          <Card className="p-6 space-y-3 sticky top-24">
            <Button onClick={startChat} className="w-full bg-gradient-brand"><MessageSquare className="h-4 w-4 mr-2" />Chat in-app</Button>
            <div className="grid gap-2"><Button type="button" variant="outline" onClick={shareWhatsApp}><Share2 className="h-4 w-4 mr-2" />Share profile</Button><Button type="button" variant="outline" onClick={copyLink}><Copy className="h-4 w-4 mr-2" />Copy link</Button></div><p className="text-[11px] text-muted-foreground text-center">All conversations stay inside NearbyPro to keep you safe. No external phone or WhatsApp shared.</p>
          </Card>
        </aside>
      </main>
      <Footer />
    </div>
  );
};
export default ProviderDetail;
