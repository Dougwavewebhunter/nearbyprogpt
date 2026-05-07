import { useEffect, useState } from "react";
import { useParams, useNavigate, Link } from "react-router-dom";
import { Header } from "@/components/Header";
import { Footer } from "@/components/Footer";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { MapPin, MessageSquare, Send, Clock, Image as ImageIcon } from "lucide-react";
import { toast } from "sonner";

interface Msg { id: string; sender_id: string; content: string; created_at: string; attachments?: any[]; }

const RequestDetail = () => {
  const { id } = useParams();
  const nav = useNavigate();
  const { user } = useAuth();
  const [r, setR] = useState<any>(null);
  const [msg, setMsg] = useState("");
  const [thread, setThread] = useState<Msg[]>([]);
  const [convId, setConvId] = useState<string | null>(null);

  const load = async () => {
    const { data, error } = await supabase.from("service_requests").select("*").eq("id", id!).maybeSingle();
    if (error) toast.error(error.message);
    setR(data);
  };
  useEffect(() => { if (id) load(); }, [id]);

  useEffect(() => {
    if (!id || !user || !r?.user_id) return;
    let channel: any;
    (async () => {
      const requesterId = r.user_id;
      const responderId = user.id === requesterId ? requesterId : user.id;
      let cid: string | null = null;
      const { data: existing } = await supabase
        .from("request_conversations" as any)
        .select("id")
        .eq("request_id", id)
        .eq("requester_id", requesterId)
        .eq("responder_id", responderId)
        .maybeSingle();
      cid = (existing as any)?.id ?? null;
      if (!cid) {
        const { data: c, error } = await supabase
          .from("request_conversations" as any)
          .insert({ request_id: id, requester_id: requesterId, responder_id: responderId })
          .select("id")
          .single();
        if (error) { toast.error(error.message); return; }
        cid = (c as any)?.id ?? null;
      }
      if (!cid) return;
      setConvId(cid);
      const { data: ms, error: msgError } = await supabase.from("request_messages" as any).select("*").eq("conversation_id", cid).order("created_at");
      if (msgError) toast.error(msgError.message);
      setThread(((ms as any[]) ?? []) as Msg[]);
      channel = supabase.channel(`request-chat-${cid}`).on("postgres_changes", { event: "INSERT", schema: "public", table: "request_messages", filter: `conversation_id=eq.${cid}` }, (p: any) => {
        setThread((prev) => [...prev, p.new as Msg]);
      }).subscribe();
    })();
    return () => { if (channel) supabase.removeChannel(channel); };
  }, [id, user, r?.user_id]);

  const send = async () => {
    if (!user) { nav("/auth"); return; }
    if (!msg.trim()) return;
    if (!convId) return toast.error("Chat is opening. Please wait a few seconds and try again.");
    const { error } = await supabase.from("request_messages" as any).insert({ conversation_id: convId, sender_id: user.id, content: msg.trim() });
    if (error) return toast.error(error.message);
    setMsg("");
  };

  const images = Array.isArray(r?.images) ? r.images : [];
  if (!r) return <div className="min-h-screen flex flex-col"><Header /><div className="container py-12">Loading...</div><Footer /></div>;

  return (
    <div className="min-h-screen flex flex-col">
      <Header />
      <main className="container py-8 flex-1 grid lg:grid-cols-3 gap-6">
        <Card className="lg:col-span-2 p-6">
          <Button asChild variant="ghost" size="sm" className="mb-4"><Link to="/">← Back to homepage</Link></Button>
          <div className="text-xs text-accent font-semibold flex items-center gap-1"><Clock className="h-3 w-3" />{new Date(r.created_at).toLocaleString()}</div>
          <h1 className="text-2xl font-bold mt-2">{r.title}</h1>
          <div className="text-sm text-muted-foreground flex items-center gap-1 mt-1"><MapPin className="h-4 w-4" />{r.location}</div>
          <p className="mt-4 whitespace-pre-wrap">{r.description}</p>
          {images.length > 0 && (
            <div className="mt-5">
              <h2 className="font-semibold flex items-center gap-2 mb-3"><ImageIcon className="h-4 w-4 text-accent" />Request images</h2>
              <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
                {images.map((url: string) => <a key={url} href={url} target="_blank" rel="noreferrer"><img src={url} className="aspect-video w-full object-cover rounded-xl border" /></a>)}
              </div>
            </div>
          )}
          <div className="mt-4 inline-flex text-xs px-3 py-1 rounded-full bg-secondary capitalize">{r.status}</div>
        </Card>

        <Card className="p-4 flex flex-col h-[600px]">
          <div className="font-semibold flex items-center gap-2 pb-3 border-b"><MessageSquare className="h-4 w-4 text-accent" /> Chat with requester</div>
          {!user ? (
            <div className="flex-1 flex items-center justify-center text-sm text-muted-foreground p-4 text-center">
              <div><p className="mb-3">Sign in to chat with the requester directly inside NearbyPro.</p><Button asChild className="bg-gradient-brand"><Link to="/auth">Sign in</Link></Button></div>
            </div>
          ) : (
            <>
              <div className="flex-1 overflow-y-auto py-3 space-y-2">
                {thread.length === 0 && <div className="text-xs text-muted-foreground text-center pt-6">Say hello — all chats stay inside the app.</div>}
                {thread.map((m) => <div key={m.id} className={`max-w-[80%] rounded-2xl px-3 py-2 text-sm ${m.sender_id === user.id ? "ml-auto bg-accent text-accent-foreground" : "bg-secondary"}`}>{m.content}</div>)}
              </div>
              <div className="flex gap-2 pt-2 border-t">
                <Input value={msg} onChange={(e) => setMsg(e.target.value)} placeholder="Type a message…" onKeyDown={(e) => e.key === "Enter" && send()} />
                <Button onClick={send} className="bg-gradient-brand"><Send className="h-4 w-4" /></Button>
              </div>
            </>
          )}
        </Card>
      </main>
      <Footer />
    </div>
  );
};
export default RequestDetail;
