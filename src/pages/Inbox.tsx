import { useEffect, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { Header } from "@/components/Header";
import { Footer } from "@/components/Footer";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { MessageSquare, ChevronRight } from "lucide-react";

type Row = {
  id: string;
  provider_id: string;
  user_id: string;
  last_message_at: string;
  providers?: { business_name: string; avatar_url: string | null } | null;
  unread: number;
  preview: string;
};

const Inbox = () => {
  const { user, loading } = useAuth();
  const nav = useNavigate();
  const [rows, setRows] = useState<Row[]>([]);
  const [busy, setBusy] = useState(true);

  useEffect(() => { if (!loading && !user) nav("/auth"); }, [user, loading, nav]);

  useEffect(() => {
    if (!user) return;
    let mounted = true;
    const lastSeenKey = (cid: string) => `inbox_seen_${cid}`;

    const load = async () => {
      setBusy(true);
      const { data: provider } = await supabase.from("providers").select("id").eq("user_id", user.id).maybeSingle();
      const orFilter = provider ? `user_id.eq.${user.id},provider_id.eq.${provider.id}` : `user_id.eq.${user.id}`;
      const { data: cs } = await supabase
        .from("conversations")
        .select("id, provider_id, user_id, last_message_at, providers(business_name, avatar_url)")
        .or(orFilter)
        .order("last_message_at", { ascending: false });

      const conv = (cs ?? []) as any[];
      const enriched: Row[] = await Promise.all(
        conv.map(async (c) => {
          const lastSeen = localStorage.getItem(lastSeenKey(c.id)) ?? "1970-01-01";
          const { data: last } = await supabase
            .from("messages").select("content,sender_id,created_at")
            .eq("conversation_id", c.id).order("created_at", { ascending: false }).limit(1).maybeSingle();
          const { count } = await supabase
            .from("messages").select("id", { count: "exact", head: true })
            .eq("conversation_id", c.id).gt("created_at", lastSeen).neq("sender_id", user.id);
          return {
            ...c,
            unread: count ?? 0,
            preview: last?.content ?? "No messages yet",
          } as Row;
        })
      );
      if (mounted) { setRows(enriched); setBusy(false); }
    };
    load();

    const ch = supabase.channel("inbox-stream")
      .on("postgres_changes", { event: "INSERT", schema: "public", table: "messages" }, () => load())
      .subscribe();
    return () => { mounted = false; supabase.removeChannel(ch); };
  }, [user]);

  const totalUnread = rows.reduce((s, r) => s + r.unread, 0);

  return (
    <div className="min-h-screen flex flex-col">
      <Header />
      <main className="flex-1 container py-8 max-w-3xl">
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-2">
            <MessageSquare className="h-6 w-6 text-accent" />
            <h1 className="text-2xl md:text-3xl font-bold">Inbox</h1>
            {totalUnread > 0 && <Badge className="bg-gradient-brand">{totalUnread} new</Badge>}
          </div>
        </div>

        {busy ? (
          <Card className="p-8 text-center text-muted-foreground">Loading conversations…</Card>
        ) : rows.length === 0 ? (
          <Card className="p-8 text-center text-muted-foreground">
            No conversations yet. <Link to="/browse" className="text-accent">Find a pro to chat with</Link>.
          </Card>
        ) : (
          <div className="space-y-2">
            {rows.map((r) => (
              <Link
                key={r.id}
                to={`/messages/${r.id}`}
                onClick={() => localStorage.setItem(`inbox_seen_${r.id}`, new Date().toISOString())}
                className="block"
              >
                <Card className="p-4 flex items-center gap-3 hover:border-accent hover:shadow-soft transition-all">
                  <div className="h-11 w-11 rounded-full bg-gradient-hero overflow-hidden shrink-0">
                    {r.providers?.avatar_url && <img src={r.providers.avatar_url} alt="" className="w-full h-full object-cover" />}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-baseline justify-between gap-2">
                      <div className="font-semibold truncate">{r.providers?.business_name ?? "Conversation"}</div>
                      <div className="text-[11px] text-muted-foreground shrink-0">
                        {new Date(r.last_message_at).toLocaleDateString()}
                      </div>
                    </div>
                    <div className={`text-sm truncate ${r.unread > 0 ? "font-medium" : "text-muted-foreground"}`}>{r.preview}</div>
                  </div>
                  {r.unread > 0 && <Badge className="bg-accent text-accent-foreground">{r.unread}</Badge>}
                  <ChevronRight className="h-4 w-4 text-muted-foreground" />
                </Card>
              </Link>
            ))}
          </div>
        )}
      </main>
      <Footer />
    </div>
  );
};

export default Inbox;
