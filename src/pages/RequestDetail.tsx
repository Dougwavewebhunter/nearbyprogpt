import { useEffect, useState } from "react";
import { useParams, useNavigate, useSearchParams, Link } from "react-router-dom";
import { Header } from "@/components/Header";
import { Footer } from "@/components/Footer";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { MapPin, MessageSquare, Send, Clock } from "lucide-react";
import { toast } from "sonner";

interface Msg { id: string; sender_id: string; content: string; created_at: string; }

const RequestDetail = () => {
  const { id } = useParams();
  const [sp] = useSearchParams();
  const nav = useNavigate();
  const { user } = useAuth();
  const [r, setR] = useState<any>(null);
  const [msg, setMsg] = useState("");
  const [thread, setThread] = useState<Msg[]>([]);
  const showChat = sp.get("chat") === "1" || true;

  const load = async () => {
    const { data } = await supabase.from("service_requests").select("*").eq("id", id!).maybeSingle();
    setR(data);
  };
  useEffect(() => { if (id) load(); }, [id]);

  useEffect(() => {
    if (!id || !user || !r) return;
    let convId: string | null = null;
    (async () => {
      if (user.id === r.user_id) {
        const { data: convs } = await supabase.from("conversations").select("id").eq("provider_id", r.user_id).order("last_message_at", { ascending: false }).limit(1);
        convId = convs?.[0]?.id ?? null;
      } else {
        const { data: existing } = await supabase.from("conversations").select("id").eq("user_id", user.id).eq("provider_id", r.user_id).maybeSingle();
        convId = existing?.id ?? null;
        if (!convId) {
          const { data: c } = await supabase.from("conversations").insert({ user_id: user.id, provider_id: r.user_id }).select("id").single();
          convId = c?.id ?? null;
        }
      }
      if (!convId) return;
      const { data: ms } = await supabase.from("messages").select("*").eq("conversation_id", convId).order("created_at");
      setThread((ms ?? []) as Msg[]);
      const ch = supabase.channel(`req-${convId}`).on("postgres_changes", { event: "INSERT", schema: "public", table: "messages", filter: `conversation_id=eq.${convId}` }, (p: any) => {
        setThread((prev) => [...prev, p.new as Msg]);
      }).subscribe();
      (window as any).__convId = convId;
      return () => supabase.removeChannel(ch);
    })();
  }, [id, user, r]);

  const send = async () => {
    if (!user) { nav("/auth"); return; }
    if (!msg.trim()) return;
    const convId = (window as any).__convId;
    if (!convId) return toast.error("Chat not ready");
    const { error } = await supabase.from("messages").insert({ conversation_id: convId, sender_id: user.id, content: msg.trim() });
    if (error) return toast.error(error.message);
    setMsg("");
  };

  if (!r) return <div className="min-h-screen flex flex-col"><Header /><div className="container py-12">Loading...</div><Footer /></div>;

  return (
    <div className="min-h-screen flex flex-col">
      <Header />
      <main className="container py-8 flex-1 grid lg:grid-cols-3 gap-6">
        <Card className="lg:col-span-2 p-6">
          <div className="text-xs text-accent font-semibold flex items-center gap-1"><Clock className="h-3 w-3" />{new Date(r.created_at).toLocaleString()}</div>
          <h1 className="text-2xl font-bold mt-2">{r.title}</h1>
          <div className="text-sm text-muted-foreground flex items-center gap-1 mt-1"><MapPin className="h-4 w-4" />{r.location}</div>
          <p className="mt-4 whitespace-pre-wrap">{r.description}</p>
          <div className="mt-4 inline-flex text-xs px-3 py-1 rounded-full bg-secondary capitalize">{r.status}</div>
        </Card>

        <Card className="p-4 flex flex-col h-[600px]">
          <div className="font-semibold flex items-center gap-2 pb-3 border-b"><MessageSquare className="h-4 w-4 text-accent" /> In-app chat</div>
          {!user ? (
            <div className="flex-1 flex items-center justify-center text-sm text-muted-foreground p-4 text-center">
              <div>
                <p className="mb-3">Sign in to chat with the requester directly inside NearbyPro.</p>
                <Button asChild className="bg-gradient-brand"><Link to="/auth">Sign in</Link></Button>
              </div>
            </div>
          ) : (
            <>
              <div className="flex-1 overflow-y-auto py-3 space-y-2">
                {thread.length === 0 && <div className="text-xs text-muted-foreground text-center pt-6">Say hello — all chats stay inside the app.</div>}
                {thread.map((m) => (
                  <div key={m.id} className={`max-w-[80%] rounded-2xl px-3 py-2 text-sm ${m.sender_id === user.id ? "ml-auto bg-accent text-accent-foreground" : "bg-secondary"}`}>
                    {m.content}
                  </div>
                ))}
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
