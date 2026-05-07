import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { toast } from "sonner";
import { Trash2, Briefcase, Users, Star, ListChecks, Megaphone, Check, X, ShieldCheck, Clock } from "lucide-react";
import { Badge } from "@/components/ui/badge";

export const AdminOverview = () => {
  const [s, setS] = useState({ providers: 0, users: 0, reviews: 0, requests: 0 });
  useEffect(() => {
    (async () => {
      const [p, pr, rv, rq] = await Promise.all([
        supabase.from("providers").select("id", { count: "exact", head: true }),
        supabase.from("profiles").select("id", { count: "exact", head: true }),
        supabase.from("reviews").select("id", { count: "exact", head: true }),
        supabase.from("service_requests").select("id", { count: "exact", head: true }),
      ]);
      setS({ providers: p.count ?? 0, users: pr.count ?? 0, reviews: rv.count ?? 0, requests: rq.count ?? 0 });
    })();
  }, []);
  const cards = [
    { icon: Briefcase, label: "Providers", val: s.providers },
    { icon: Users, label: "Users", val: s.users },
    { icon: Star, label: "Reviews", val: s.reviews },
    { icon: ListChecks, label: "Requests", val: s.requests },
  ];
  return (
    <div className="space-y-6">
      <h1 className="text-3xl font-bold">Admin dashboard</h1>
      <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {cards.map((c) => (
          <Card key={c.label} className="p-5"><c.icon className="h-5 w-5 text-accent" /><div className="text-3xl font-bold mt-2">{c.val}</div><div className="text-sm text-muted-foreground">{c.label}</div></Card>
        ))}
      </div>
    </div>
  );
};

const statusBadge = (s: string) => {
  if (s === "approved") return <Badge className="bg-emerald-500/15 text-emerald-700 dark:text-emerald-400 border-0">Approved</Badge>;
  if (s === "rejected") return <Badge variant="destructive">Rejected</Badge>;
  return <Badge variant="secondary"><Clock className="h-3 w-3 mr-1" />Pending</Badge>;
};

export const AdminProviders = () => {
  const [list, setList] = useState<any[]>([]);
  const load = () => supabase.from("providers").select("*").order("created_at", { ascending: false }).then(({ data }) => setList(data ?? []));
  useEffect(() => { load(); }, []);
  const toggle = async (id: string, v: boolean) => { await supabase.from("providers").update({ is_active: v }).eq("id", id); load(); };
  const setStatus = async (id: string, status: string) => { await supabase.from("providers").update({ status, is_active: status === "approved" }).eq("id", id); toast.success(`Provider ${status}`); load(); };
  const del = async (id: string) => { if (!confirm("Delete?")) return; await supabase.from("providers").delete().eq("id", id); load(); };
  return (
    <div className="space-y-4">
      <h1 className="text-3xl font-bold">Providers</h1>
      <div className="grid gap-3">
        {list.map((p) => (
          <Card key={p.id} className="p-4 flex items-center gap-4 flex-wrap">
            <div className="flex-1 min-w-[180px]">
              <div className="font-semibold flex items-center gap-2">{p.business_name} {statusBadge(p.status ?? "pending")}</div>
              <div className="text-sm text-muted-foreground">{p.location}</div>
            </div>
            <Button size="sm" variant="outline" onClick={() => setStatus(p.id, "approved")}><Check className="h-4 w-4 mr-1" />Approve</Button>
            <Button size="sm" variant="outline" onClick={() => setStatus(p.id, "rejected")}><X className="h-4 w-4 mr-1" />Reject</Button>
            <div className="flex items-center gap-2 text-sm">Active <Switch checked={p.is_active} onCheckedChange={(v) => toggle(p.id, v)} /></div>
            <Button variant="ghost" size="icon" onClick={() => del(p.id)}><Trash2 className="h-4 w-4" /></Button>
          </Card>
        ))}
      </div>
    </div>
  );
};

export const AdminUsers = () => {
  const [list, setList] = useState<any[]>([]);
  useEffect(() => { supabase.from("profiles").select("*").order("created_at", { ascending: false }).then(({ data }) => setList(data ?? [])); }, []);
  return (
    <div className="space-y-4">
      <h1 className="text-3xl font-bold">Users</h1>
      <div className="grid gap-2">
        {list.map((u) => (
          <Card key={u.id} className="p-3 flex justify-between"><span>{u.full_name ?? u.id}</span><span className="text-xs text-muted-foreground">{new Date(u.created_at).toLocaleDateString()}</span></Card>
        ))}
      </div>
    </div>
  );
};

export const AdminReviews = () => {
  const [list, setList] = useState<any[]>([]);
  const load = () => supabase.from("reviews").select("*").order("created_at", { ascending: false }).then(({ data }) => setList(data ?? []));
  useEffect(() => { load(); }, []);
  return (
    <div className="space-y-4">
      <h1 className="text-3xl font-bold">Reviews</h1>
      {list.map((r) => (
        <Card key={r.id} className="p-3 flex justify-between items-start gap-3">
          <div><div className="text-sm">★ {r.rating}</div><div className="text-sm text-muted-foreground">{r.comment}</div></div>
          <Button variant="ghost" size="icon" onClick={async () => { await supabase.from("reviews").delete().eq("id", r.id); load(); }}><Trash2 className="h-4 w-4" /></Button>
        </Card>
      ))}
    </div>
  );
};

export const AdminRequests = () => {
  const [list, setList] = useState<any[]>([]);
  const load = () => supabase.from("service_requests").select("*").order("created_at", { ascending: false }).then(({ data }) => setList(data ?? []));
  useEffect(() => { load(); }, []);
  const setStatus = async (id: string, moderation_status: string) => { await supabase.from("service_requests").update({ moderation_status }).eq("id", id); toast.success(`Request ${moderation_status}`); load(); };
  return (
    <div className="space-y-4">
      <h1 className="text-3xl font-bold">Service requests</h1>
      {list.map((r) => (
        <Card key={r.id} className="p-3 flex justify-between items-start gap-3 flex-wrap">
          <div className="flex-1 min-w-[200px]">
            <div className="font-semibold flex items-center gap-2">{r.title} {statusBadge(r.moderation_status ?? "approved")}</div>
            <div className="text-sm text-muted-foreground">{r.location} · {r.status}</div>
          </div>
          <Button size="sm" variant="outline" onClick={() => setStatus(r.id, "approved")}><Check className="h-4 w-4 mr-1" />Approve</Button>
          <Button size="sm" variant="outline" onClick={() => setStatus(r.id, "rejected")}><X className="h-4 w-4 mr-1" />Reject</Button>
          <Button variant="ghost" size="icon" onClick={async () => { await supabase.from("service_requests").delete().eq("id", r.id); load(); }}><Trash2 className="h-4 w-4" /></Button>
        </Card>
      ))}
    </div>
  );
};

export const AdminModeration = () => {
  const [providers, setProviders] = useState<any[]>([]);
  const [requests, setRequests] = useState<any[]>([]);

  const load = async () => {
    const [{ data: ps }, { data: rs }] = await Promise.all([
      supabase.from("providers").select("*").eq("status", "pending").order("created_at", { ascending: false }),
      supabase.from("service_requests").select("*").eq("moderation_status", "pending").order("created_at", { ascending: false }),
    ]);
    setProviders(ps ?? []);
    setRequests(rs ?? []);
  };
  useEffect(() => { load(); }, []);

  const decideProvider = async (id: string, status: string) => {
    await supabase.from("providers").update({ status, is_active: status === "approved" }).eq("id", id);
    toast.success(`Provider ${status}`);
    load();
  };
  const decideRequest = async (id: string, moderation_status: string) => {
    await supabase.from("service_requests").update({ moderation_status }).eq("id", id);
    toast.success(`Request ${moderation_status}`);
    load();
  };

  return (
    <div className="space-y-8">
      <div className="flex items-center gap-2">
        <ShieldCheck className="h-6 w-6 text-accent" />
        <h1 className="text-3xl font-bold">Moderation queue</h1>
      </div>

      <section>
        <h2 className="font-semibold text-lg mb-3">Pending provider listings <span className="text-sm text-muted-foreground">({providers.length})</span></h2>
        {providers.length === 0 ? (
          <Card className="p-6 text-center text-sm text-muted-foreground">Nothing waiting. 🎉</Card>
        ) : (
          <div className="grid gap-3">
            {providers.map((p) => (
              <Card key={p.id} className="p-4 flex gap-4">
                {p.avatar_url && <img src={p.avatar_url} alt="" className="h-16 w-16 rounded-lg object-cover" />}
                <div className="flex-1 min-w-0">
                  <div className="font-semibold">{p.business_name}</div>
                  <div className="text-xs text-muted-foreground">{p.location}</div>
                  <p className="text-sm mt-1 line-clamp-2 text-muted-foreground">{p.description}</p>
                </div>
                <div className="flex flex-col gap-2 self-center">
                  <Button size="sm" className="bg-gradient-brand" onClick={() => decideProvider(p.id, "approved")}><Check className="h-4 w-4 mr-1" />Approve</Button>
                  <Button size="sm" variant="outline" onClick={() => decideProvider(p.id, "rejected")}><X className="h-4 w-4 mr-1" />Reject</Button>
                </div>
              </Card>
            ))}
          </div>
        )}
      </section>

      <section>
        <h2 className="font-semibold text-lg mb-3">Pending service requests <span className="text-sm text-muted-foreground">({requests.length})</span></h2>
        {requests.length === 0 ? (
          <Card className="p-6 text-center text-sm text-muted-foreground">Nothing waiting. 🎉</Card>
        ) : (
          <div className="grid gap-3">
            {requests.map((r) => (
              <Card key={r.id} className="p-4 flex gap-4">
                <div className="flex-1 min-w-0">
                  <div className="font-semibold">{r.title}</div>
                  <div className="text-xs text-muted-foreground">{r.location}</div>
                  <p className="text-sm mt-1 line-clamp-2 text-muted-foreground">{r.description}</p>
                </div>
                <div className="flex flex-col gap-2 self-center">
                  <Button size="sm" className="bg-gradient-brand" onClick={() => decideRequest(r.id, "approved")}><Check className="h-4 w-4 mr-1" />Approve</Button>
                  <Button size="sm" variant="outline" onClick={() => decideRequest(r.id, "rejected")}><X className="h-4 w-4 mr-1" />Reject</Button>
                </div>
              </Card>
            ))}
          </div>
        )}
      </section>
    </div>
  );
};

const SLOTS = [
  { value: "sidebar", label: "Sidebar (vertical)" },
  { value: "header", label: "Header banner" },
  { value: "in-feed", label: "In-feed card" },
  { value: "footer", label: "Footer banner" },
];
const SIZES = [
  { value: "small", label: "Small (300×150)" },
  { value: "medium", label: "Medium (300×250)" },
  { value: "large", label: "Large (300×600)" },
  { value: "leaderboard", label: "Leaderboard (728×90)" },
];

const emptyForm = {
  title: "", image_url: "", link_url: "",
  position: "left", slot: "sidebar", size: "medium",
  starts_at: "", ends_at: "", weight: 1, is_active: true,
};

export const AdminAds = () => {
  const [list, setList] = useState<any[]>([]);
  const [form, setForm] = useState<any>(emptyForm);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [uploading, setUploading] = useState(false);
  const [previewIdx, setPreviewIdx] = useState(0);

  const load = () =>
    supabase.from("ads").select("*").order("created_at", { ascending: false }).then(({ data }) => setList(data ?? []));
  useEffect(() => { load(); }, []);

  // Auto-rotate live preview every 4s
  useEffect(() => {
    const live = list.filter(isLive);
    if (live.length < 2) return;
    const t = setInterval(() => setPreviewIdx((i) => (i + 1) % live.length), 4000);
    return () => clearInterval(t);
  }, [list]);

  const upload = async (file: File) => {
    setUploading(true);
    try {
      const ext = file.name.split(".").pop();
      const path = `${Date.now()}-${Math.random().toString(36).slice(2, 8)}.${ext}`;
      const { error } = await supabase.storage.from("ads").upload(path, file, { cacheControl: "3600", upsert: false });
      if (error) throw error;
      const { data } = supabase.storage.from("ads").getPublicUrl(path);
      setForm((f: any) => ({ ...f, image_url: data.publicUrl }));
      toast.success("Image uploaded");
    } catch (e: any) { toast.error(e.message ?? "Upload failed"); }
    finally { setUploading(false); }
  };

  const save = async () => {
    if (!form.title || !form.image_url) return toast.error("Title and image required");
    const payload: any = {
      title: form.title, image_url: form.image_url, link_url: form.link_url || null,
      position: form.position, slot: form.slot, size: form.size,
      starts_at: form.starts_at || null, ends_at: form.ends_at || null,
      weight: Number(form.weight) || 1, is_active: form.is_active,
    };
    const res = editingId
      ? await supabase.from("ads").update(payload).eq("id", editingId)
      : await supabase.from("ads").insert(payload);
    if (res.error) return toast.error(res.error.message);
    toast.success(editingId ? "Advert updated" : "Advert created");
    setForm(emptyForm); setEditingId(null); load();
  };

  const edit = (a: any) => {
    setEditingId(a.id);
    setForm({
      title: a.title, image_url: a.image_url, link_url: a.link_url ?? "",
      position: a.position, slot: a.slot ?? "sidebar", size: a.size,
      starts_at: a.starts_at ? a.starts_at.slice(0, 16) : "",
      ends_at: a.ends_at ? a.ends_at.slice(0, 16) : "",
      weight: a.weight ?? 1, is_active: a.is_active,
    });
  };

  const toggle = async (id: string, v: boolean) => { await supabase.from("ads").update({ is_active: v }).eq("id", id); load(); };
  const del = async (id: string) => { if (!confirm("Delete advert?")) return; await supabase.from("ads").delete().eq("id", id); load(); };

  const liveAds = list.filter(isLive);
  const livePreview = liveAds[previewIdx % Math.max(liveAds.length, 1)];

  return (
    <div className="space-y-6">
      <h1 className="text-3xl font-bold">Advert manager</h1>

      <div className="grid lg:grid-cols-3 gap-4">
        <Card className="p-4 lg:col-span-2 space-y-3">
          <h2 className="font-semibold">{editingId ? "Edit advert" : "Create advert"}</h2>
          <Input placeholder="Title" value={form.title} onChange={(e) => setForm({ ...form, title: e.target.value })} />
          <div className="grid sm:grid-cols-2 gap-3">
            <div className="space-y-1">
              <label className="text-xs text-muted-foreground">Creative image</label>
              <Input type="file" accept="image/*" disabled={uploading}
                onChange={(e) => e.target.files?.[0] && upload(e.target.files[0])} />
              {form.image_url && <div className="text-xs text-muted-foreground truncate">{form.image_url}</div>}
            </div>
            <Input placeholder="Or paste image URL" value={form.image_url}
              onChange={(e) => setForm({ ...form, image_url: e.target.value })} />
          </div>
          <Input placeholder="Click-through URL (optional)" value={form.link_url}
            onChange={(e) => setForm({ ...form, link_url: e.target.value })} />
          <div className="grid sm:grid-cols-3 gap-3">
            <div>
              <label className="text-xs text-muted-foreground">Slot</label>
              <Select value={form.slot} onValueChange={(v) => setForm({ ...form, slot: v })}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>{SLOTS.map((s) => <SelectItem key={s.value} value={s.value}>{s.label}</SelectItem>)}</SelectContent>
              </Select>
            </div>
            <div>
              <label className="text-xs text-muted-foreground">Position</label>
              <Select value={form.position} onValueChange={(v) => setForm({ ...form, position: v })}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="left">Left</SelectItem>
                  <SelectItem value="right">Right</SelectItem>
                  <SelectItem value="center">Center</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div>
              <label className="text-xs text-muted-foreground">Size</label>
              <Select value={form.size} onValueChange={(v) => setForm({ ...form, size: v })}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>{SIZES.map((s) => <SelectItem key={s.value} value={s.value}>{s.label}</SelectItem>)}</SelectContent>
              </Select>
            </div>
          </div>
          <div className="grid sm:grid-cols-3 gap-3">
            <div>
              <label className="text-xs text-muted-foreground">Starts at</label>
              <Input type="datetime-local" value={form.starts_at}
                onChange={(e) => setForm({ ...form, starts_at: e.target.value })} />
            </div>
            <div>
              <label className="text-xs text-muted-foreground">Ends at</label>
              <Input type="datetime-local" value={form.ends_at}
                onChange={(e) => setForm({ ...form, ends_at: e.target.value })} />
            </div>
            <div>
              <label className="text-xs text-muted-foreground">Weight (rotation)</label>
              <Input type="number" min={1} value={form.weight}
                onChange={(e) => setForm({ ...form, weight: e.target.value })} />
            </div>
          </div>
          <div className="flex items-center gap-2 text-sm">
            Active <Switch checked={form.is_active} onCheckedChange={(v) => setForm({ ...form, is_active: v })} />
          </div>
          <div className="flex gap-2">
            <Button onClick={save} className="bg-gradient-brand">
              <Megaphone className="h-4 w-4 mr-2" />{editingId ? "Save changes" : "Add advert"}
            </Button>
            {editingId && <Button variant="outline" onClick={() => { setEditingId(null); setForm(emptyForm); }}>Cancel</Button>}
          </div>
        </Card>

        <Card className="p-4">
          <h2 className="font-semibold mb-2">Live preview <span className="text-xs text-muted-foreground">({liveAds.length} active)</span></h2>
          {livePreview ? (
            <div className="space-y-2">
              <div className="rounded-lg overflow-hidden border bg-muted/30">
                <img src={livePreview.image_url} alt={livePreview.title}
                  className="w-full object-cover aspect-[3/4]" />
              </div>
              <div className="text-sm font-medium truncate">{livePreview.title}</div>
              <div className="text-xs text-muted-foreground">{livePreview.slot} · {livePreview.size} · weight {livePreview.weight}</div>
            </div>
          ) : (
            <div className="text-sm text-muted-foreground">No active adverts in rotation.</div>
          )}
        </Card>
      </div>

      <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-3">
        {list.map((a) => (
          <Card key={a.id} className="overflow-hidden">
            <img src={a.image_url} alt={a.title} className="w-full aspect-video object-cover" />
            <div className="p-3 space-y-2">
              <div className="flex justify-between items-start gap-2">
                <div className="min-w-0">
                  <div className="font-semibold text-sm truncate">{a.title}</div>
                  <div className="text-xs text-muted-foreground">{a.slot ?? "sidebar"} · {a.position} · {a.size}</div>
                  <div className="text-[10px] text-muted-foreground mt-0.5">
                    {a.starts_at ? new Date(a.starts_at).toLocaleDateString() : "—"} → {a.ends_at ? new Date(a.ends_at).toLocaleDateString() : "∞"} · w{a.weight ?? 1}
                  </div>
                </div>
                <div className={`text-[10px] px-1.5 py-0.5 rounded ${isLive(a) ? "bg-accent/20 text-accent" : "bg-muted text-muted-foreground"}`}>
                  {isLive(a) ? "LIVE" : "OFF"}
                </div>
              </div>
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2 text-xs">Active <Switch checked={a.is_active} onCheckedChange={(v) => toggle(a.id, v)} /></div>
                <div className="flex gap-1">
                  <Button variant="ghost" size="sm" onClick={() => edit(a)}>Edit</Button>
                  <Button variant="ghost" size="icon" onClick={() => del(a.id)}><Trash2 className="h-4 w-4" /></Button>
                </div>
              </div>
            </div>
          </Card>
        ))}
      </div>
    </div>
  );
};

function isLive(a: any) {
  if (!a.is_active) return false;
  const now = Date.now();
  if (a.starts_at && new Date(a.starts_at).getTime() > now) return false;
  if (a.ends_at && new Date(a.ends_at).getTime() < now) return false;
  return true;
}
