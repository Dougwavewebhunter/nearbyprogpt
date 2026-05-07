import { useEffect, useState } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { toast } from "sonner";
import { Link } from "react-router-dom";
import { MessageSquare, Briefcase, Star } from "lucide-react";

export const DashboardOverview = () => {
  const { user } = useAuth();
  const [stats, setStats] = useState({ msgs: 0, requests: 0, reviews: 0 });
  useEffect(() => {
    if (!user) return;
    (async () => {
      const [m, r, rv] = await Promise.all([
        supabase.from("conversations").select("id", { count: "exact", head: true }).eq("user_id", user.id),
        supabase.from("service_requests").select("id", { count: "exact", head: true }).eq("user_id", user.id),
        supabase.from("reviews").select("id", { count: "exact", head: true }).eq("user_id", user.id),
      ]);
      setStats({ msgs: m.count ?? 0, requests: r.count ?? 0, reviews: rv.count ?? 0 });
    })();
  }, [user]);
  return (
    <div className="space-y-6">
      <h1 className="text-3xl font-bold">Welcome back</h1>
      <div className="grid sm:grid-cols-3 gap-4">
        <Card className="p-5"><MessageSquare className="h-5 w-5 text-accent" /><div className="text-3xl font-bold mt-2">{stats.msgs}</div><div className="text-sm text-muted-foreground">Conversations</div></Card>
        <Card className="p-5"><Briefcase className="h-5 w-5 text-accent" /><div className="text-3xl font-bold mt-2">{stats.requests}</div><div className="text-sm text-muted-foreground">My requests</div></Card>
        <Card className="p-5"><Star className="h-5 w-5 text-accent" /><div className="text-3xl font-bold mt-2">{stats.reviews}</div><div className="text-sm text-muted-foreground">Reviews given</div></Card>
      </div>
      <Card className="p-6">
        <h2 className="font-semibold mb-2">Quick actions</h2>
        <div className="flex flex-wrap gap-2">
          <Button asChild className="bg-gradient-brand"><Link to="/post-request">Post a request</Link></Button>
          <Button asChild variant="outline"><Link to="/browse">Find a pro</Link></Button>
          <Button asChild variant="outline"><Link to="/dashboard/profile">Become a pro</Link></Button>
        </div>
      </Card>
    </div>
  );
};

export const DashboardProfile = () => {
  const { user, refreshRoles } = useAuth();
  const [cats, setCats] = useState<any[]>([]);
  const [p, setP] = useState<any>({
    business_name: "", description: "", location: "", phone: "", email: "",
    category_id: "", services: [], avatar_url: "", gallery: [], id_number: "",
  });
  const [exists, setExists] = useState(false);
  const [servicesText, setServicesText] = useState("");
  const [uploadingAvatar, setUploadingAvatar] = useState(false);
  const [uploadingGallery, setUploadingGallery] = useState(false);

  useEffect(() => {
    supabase.from("categories").select("*").then(({ data }) => setCats(data ?? []));
    if (!user) return;
    supabase.from("providers").select("*").eq("user_id", user.id).maybeSingle().then(({ data }) => {
      if (data) {
        setP({ ...data, gallery: Array.isArray(data.gallery) ? data.gallery : [] });
        setExists(true);
        setServicesText((Array.isArray(data.services) ? data.services as string[] : []).join(", "));
      }
    });
  }, [user]);

  const uploadFile = async (file: File, folder: "avatar" | "gallery") => {
    if (!user) return null;
    const ext = file.name.split(".").pop();
    const path = `${user.id}/${folder}/${Date.now()}-${Math.random().toString(36).slice(2,8)}.${ext}`;
    const { error } = await supabase.storage.from("provider-assets").upload(path, file, { upsert: false });
    if (error) { toast.error(error.message); return null; }
    return supabase.storage.from("provider-assets").getPublicUrl(path).data.publicUrl;
  };

  const onAvatar = async (file: File) => {
    setUploadingAvatar(true);
    const url = await uploadFile(file, "avatar");
    if (url) { setP((s: any) => ({ ...s, avatar_url: url })); toast.success("Logo uploaded"); }
    setUploadingAvatar(false);
  };

  const onGallery = async (files: FileList) => {
    setUploadingGallery(true);
    const remaining = 5 - (p.gallery?.length ?? 0);
    const toUpload = Array.from(files).slice(0, remaining);
    if (!toUpload.length) { toast.error("Maximum 5 portfolio images"); setUploadingGallery(false); return; }
    const urls: string[] = [];
    for (const f of toUpload) { const u = await uploadFile(f, "gallery"); if (u) urls.push(u); }
    setP((s: any) => ({ ...s, gallery: [...(s.gallery ?? []), ...urls] }));
    toast.success(`Added ${urls.length} image(s)`);
    setUploadingGallery(false);
  };

  const removeGallery = (url: string) =>
    setP((s: any) => ({ ...s, gallery: (s.gallery ?? []).filter((u: string) => u !== url) }));

  const save = async () => {
    if (!user) return;
    const services = servicesText.split(",").map((s) => s.trim()).filter(Boolean);
    const payload = { ...p, services, user_id: user.id };
    const { error } = exists
      ? await supabase.from("providers").update(payload).eq("user_id", user.id)
      : await supabase.from("providers").insert(payload);
    if (error) return toast.error(error.message);
    if (!exists) {
      await supabase.from("user_roles").upsert({ user_id: user.id, role: "provider" }, { onConflict: "user_id,role" });
      await refreshRoles();
    }
    toast.success("Profile saved");
    setExists(true);
  };

  return (
    <div className="max-w-2xl space-y-4">
      <h1 className="text-3xl font-bold">My provider profile</h1>
      <p className="text-sm text-muted-foreground">Saving your profile registers you as a provider — auto-approved.</p>
      <Card className="p-6 space-y-4">
        {/* Logo / face */}
        <div className="space-y-2">
          <label className="text-sm font-medium">Profile photo or company logo</label>
          <div className="flex items-center gap-4">
            <div className="h-20 w-20 rounded-full overflow-hidden border bg-muted flex items-center justify-center text-xs text-muted-foreground">
              {p.avatar_url ? <img src={p.avatar_url} alt="logo" className="h-full w-full object-cover" /> : "No image"}
            </div>
            <Input type="file" accept="image/*" disabled={uploadingAvatar}
              onChange={(e) => e.target.files?.[0] && onAvatar(e.target.files[0])} />
          </div>
        </div>

        <Input placeholder="Business name" value={p.business_name ?? ""} onChange={(e) => setP({ ...p, business_name: e.target.value })} />
        <Textarea placeholder="Describe your services" value={p.description ?? ""} onChange={(e) => setP({ ...p, description: e.target.value })} />
        <Select value={p.category_id ?? ""} onValueChange={(v) => setP({ ...p, category_id: v })}>
          <SelectTrigger><SelectValue placeholder="Category" /></SelectTrigger>
          <SelectContent>{cats.map((c) => <SelectItem key={c.id} value={c.id}>{c.name}</SelectItem>)}</SelectContent>
        </Select>
        <Input placeholder="Location (e.g. Pretoria)" value={p.location ?? ""} onChange={(e) => setP({ ...p, location: e.target.value })} />
        <Input placeholder="Phone" value={p.phone ?? ""} onChange={(e) => setP({ ...p, phone: e.target.value })} />
        <Input placeholder="Public email" value={p.email ?? ""} onChange={(e) => setP({ ...p, email: e.target.value })} />
        <Input placeholder="ID number (private — for verification)" value={p.id_number ?? ""}
          onChange={(e) => setP({ ...p, id_number: e.target.value })} />
        <Input placeholder="Services (comma separated)" value={servicesText} onChange={(e) => setServicesText(e.target.value)} />

        {/* Portfolio gallery */}
        <div className="space-y-2">
          <label className="text-sm font-medium">Portfolio (up to 5 images of your work)</label>
          <div className="grid grid-cols-5 gap-2">
            {(p.gallery ?? []).map((url: string) => (
              <div key={url} className="relative aspect-square rounded-md overflow-hidden border group">
                <img src={url} alt="work" className="w-full h-full object-cover" />
                <button type="button" onClick={() => removeGallery(url)}
                  className="absolute top-1 right-1 bg-black/60 text-white text-[10px] px-1.5 py-0.5 rounded opacity-0 group-hover:opacity-100">×</button>
              </div>
            ))}
            {(p.gallery?.length ?? 0) < 5 && (
              <label className="aspect-square rounded-md border-2 border-dashed flex items-center justify-center text-xs text-muted-foreground cursor-pointer hover:border-accent">
                <input type="file" accept="image/*" multiple className="hidden" disabled={uploadingGallery}
                  onChange={(e) => e.target.files && onGallery(e.target.files)} />
                {uploadingGallery ? "Uploading…" : "+ Add"}
              </label>
            )}
          </div>
          <div className="text-xs text-muted-foreground">{p.gallery?.length ?? 0}/5 images</div>
        </div>

        <Button onClick={save} className="bg-gradient-brand">Save profile</Button>
      </Card>
    </div>
  );
};
