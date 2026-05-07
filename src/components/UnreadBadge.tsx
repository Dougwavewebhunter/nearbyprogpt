import { useEffect, useState } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";

export const UnreadBadge = () => {
  const { user } = useAuth();
  const [n, setN] = useState(0);

  useEffect(() => {
    if (!user) { setN(0); return; }
    let mounted = true;
    const compute = async () => {
      const { data: provider } = await supabase.from("providers").select("id").eq("user_id", user.id).maybeSingle();
      const orFilter = provider ? `user_id.eq.${user.id},provider_id.eq.${provider.id}` : `user_id.eq.${user.id}`;
      const { data: convs } = await supabase.from("conversations").select("id").or(orFilter);
      let total = 0;
      for (const c of convs ?? []) {
        const lastSeen = localStorage.getItem(`inbox_seen_${c.id}`) ?? "1970-01-01";
        const { count } = await supabase.from("messages")
          .select("id", { count: "exact", head: true })
          .eq("conversation_id", c.id).gt("created_at", lastSeen).neq("sender_id", user.id);
        total += count ?? 0;
      }
      if (mounted) setN(total);
    };
    compute();
    const ch = supabase.channel("unread-watch")
      .on("postgres_changes", { event: "INSERT", schema: "public", table: "messages" }, () => compute())
      .subscribe();
    return () => { mounted = false; supabase.removeChannel(ch); };
  }, [user]);

  if (n <= 0) return null;
  return (
    <span className="absolute -top-1 -right-1 min-w-[18px] h-[18px] px-1 rounded-full bg-accent text-accent-foreground text-[10px] font-bold grid place-items-center">
      {n > 99 ? "99+" : n}
    </span>
  );
};
