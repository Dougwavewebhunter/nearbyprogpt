import { useEffect } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import { playMessageSound, requestNearbyNotifications, showNearbyNotification } from "@/lib/notifications";
import { toast } from "sonner";

export const MessageNotifier = () => {
  const { user } = useAuth();

  useEffect(() => {
    if (!user) return;
    requestNearbyNotifications(user.id);

    const notify = async (title: string, body: string, url: string) => {
      playMessageSound();
      toast.info(title, { description: body });
      await showNearbyNotification(title, body, url);
    };

    const normal = supabase.channel(`nearbypro-message-alerts-${user.id}`)
      .on("postgres_changes", { event: "INSERT", schema: "public", table: "messages" }, async (payload: any) => {
        const m = payload.new;
        if (!m || m.sender_id === user.id) return;
        const { data } = await supabase.from("conversations").select("id").eq("id", m.conversation_id).maybeSingle();
        if (data?.id) notify("New NearbyPro message", m.content || "You received a new message.", `/messages/${data.id}`);
      })
      .subscribe();

    const requests = supabase.channel(`nearbypro-request-alerts-${user.id}`)
      .on("postgres_changes", { event: "INSERT", schema: "public", table: "request_messages" }, async (payload: any) => {
        const m = payload.new;
        if (!m || m.sender_id === user.id) return;
        const { data } = await supabase.from("request_conversations" as any).select("request_id").eq("id", m.conversation_id).maybeSingle();
        if ((data as any)?.request_id) notify("New request chat message", m.content || "You received a new request message.", `/requests/${(data as any).request_id}`);
      })
      .subscribe();

    return () => {
      supabase.removeChannel(normal);
      supabase.removeChannel(requests);
    };
  }, [user]);

  return null;
};
