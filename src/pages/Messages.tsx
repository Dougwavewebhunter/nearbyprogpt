import { useEffect, useState, useRef } from "react";
import { useParams, useNavigate, Link } from "react-router-dom";
import { Header } from "@/components/Header";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Send, MessageSquare, Paperclip, Image as ImageIcon, FileText } from "lucide-react";

const Messages = () => {
  const { id } = useParams();
  const { user, loading } = useAuth();
  const nav = useNavigate();
  const [convs, setConvs] = useState<any[]>([]);
  const [messages, setMessages] = useState<any[]>([]);
  const [text, setText] = useState("");
  const [providerName, setProviderName] = useState("");
  const endRef = useRef<HTMLDivElement>(null);
  const fileRef = useRef<HTMLInputElement>(null);

  useEffect(() => { if (!loading && !user) nav("/auth"); }, [user, loading, nav]);

  useEffect(() => {
    if (!user) return;
    const load = async () => {
      const { data: provider } = await supabase.from("providers").select("id").eq("user_id", user.id).maybeSingle();
      const orFilter = provider ? `user_id.eq.${user.id},provider_id.eq.${provider.id}` : `user_id.eq.${user.id}`;
      const { data } = await supabase.from("conversations").select("id, provider_id, providers(business_name)").or(orFilter).order("last_message_at", { ascending: false });
      setConvs(data ?? []);
    };
    load();
  }, [user]);

  useEffect(() => {
    if (!id) return;
    supabase.from("messages").select("*").eq("conversation_id", id).order("created_at").then(({ data }) => setMessages(data ?? []));
    supabase.from("conversations").select("providers(business_name)").eq("id", id).maybeSingle().then(({ data }: any) => setProviderName(data?.providers?.business_name ?? ""));
    const ch = supabase.channel(`conv-${id}`).on("postgres_changes", { event: "INSERT", schema: "public", table: "messages", filter: `conversation_id=eq.${id}` }, (p: any) => {
      setMessages((m) => [...m, p.new]);
    }).subscribe();
    return () => { supabase.removeChannel(ch); };
  }, [id]);

  useEffect(() => { endRef.current?.scrollIntoView({ behavior: "smooth" }); }, [messages]);

  const send = async (attachments: any[] = []) => {
    if ((!text.trim() && attachments.length === 0) || !id || !user) return;
    const content = text.trim() || (attachments.length ? "Shared attachment" : "");
    setText("");
    await supabase.from("messages").insert({ conversation_id: id, sender_id: user.id, content, attachments } as any);
    await supabase.from("conversations").update({ last_message_at: new Date().toISOString() }).eq("id", id);
  };

  const uploadFiles = async (files: FileList | null) => {
    if (!files || !id || !user) return;
    const selected = Array.from(files).slice(0, 10);
    const uploads: any[] = [];
    for (const file of selected) {
      const path = `${id}/${Date.now()}-${file.name.replace(/[^a-zA-Z0-9._-]/g, "-")}`;
      const { error } = await supabase.storage.from("chat-attachments").upload(path, file, { upsert: false });
      if (!error) {
        const { data } = supabase.storage.from("chat-attachments").getPublicUrl(path);
        uploads.push({ name: file.name, type: file.type, size: file.size, url: data.publicUrl });
      }
    }
    if (uploads.length) send(uploads);
  };

  return (
    <div className="min-h-screen flex flex-col">
      <Header />
      <main className="container py-6 flex-1 grid md:grid-cols-[280px_1fr] gap-4 h-[calc(100vh-4rem)]">
        <Card className="overflow-y-auto">
          <div className="p-3 border-b font-semibold flex items-center gap-2"><MessageSquare className="h-4 w-4" />Conversations</div>
          {convs.length ? convs.map((c: any) => (
            <Link key={c.id} to={`/messages/${c.id}`} className={`block p-3 border-b hover:bg-secondary ${id === c.id ? "bg-secondary" : ""}`}>
              <div className="font-medium text-sm">{c.providers?.business_name ?? "Pro"}</div>
            </Link>
          )) : <div className="p-4 text-sm text-muted-foreground">No conversations yet.</div>}
        </Card>
        <Card className="flex flex-col">
          {id ? (
            <>
              <div className="p-3 border-b font-semibold">{providerName}</div>
              <div className="flex-1 overflow-y-auto p-3 space-y-2 bg-secondary/30">
                {messages.map((m) => (
                  <div key={m.id} className={`flex ${m.sender_id === user?.id ? "justify-end" : "justify-start"}`}>
                    <div className={`max-w-[70%] px-3 py-2 rounded-2xl text-sm ${m.sender_id === user?.id ? "bg-gradient-brand text-white rounded-br-sm" : "bg-card border rounded-bl-sm"}`}>{m.content}
                      {Array.isArray((m as any).attachments) && (m as any).attachments.length > 0 && (
                        <div className="mt-2 space-y-1">
                          {(m as any).attachments.map((a: any, i: number) => a.type?.startsWith("image/") ? (
                            <a key={i} href={a.url} target="_blank" rel="noreferrer"><img src={a.url} alt={a.name} className="mt-2 max-h-44 rounded-lg object-cover" /></a>
                          ) : (
                            <a key={i} href={a.url} target="_blank" rel="noreferrer" className="flex items-center gap-2 text-xs underline"><FileText className="h-3 w-3" />{a.name}</a>
                          ))}
                        </div>
                      )}
                    </div>
                  </div>
                ))}
                <div ref={endRef} />
              </div>
              <div className="border-t p-2 flex gap-2">
                <input ref={fileRef} type="file" multiple className="hidden" accept="image/*,.pdf,.doc,.docx,.xls,.xlsx,.txt" onChange={(e) => uploadFiles(e.target.files)} />
                <Button type="button" variant="outline" size="icon" onClick={() => fileRef.current?.click()} title="Attach images or files"><Paperclip className="h-4 w-4" /></Button>
                <Input value={text} onChange={(e) => setText(e.target.value)} onKeyDown={(e) => e.key === "Enter" && send()} placeholder="Type a message..." />
                <Button onClick={() => send()} className="bg-gradient-brand"><Send className="h-4 w-4" /></Button>
              </div>
            </>
          ) : (
            <div className="flex-1 grid place-items-center text-muted-foreground">Select a conversation</div>
          )}
        </Card>
      </main>
    </div>
  );
};
export default Messages;
