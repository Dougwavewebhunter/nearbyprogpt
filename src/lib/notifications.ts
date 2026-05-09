import { supabase } from "@/integrations/supabase/client";

export const requestNearbyNotifications = async (userId?: string) => {
  if (!("Notification" in window)) return { ok: false, reason: "unsupported" };
  let permission = Notification.permission;
  if (permission === "default") permission = await Notification.requestPermission();
  if (permission !== "granted") return { ok: false, reason: permission };

  try {
    const registration = await navigator.serviceWorker?.ready?.catch(() => null);
    if (registration && userId) {
      await supabase.from("notification_preferences" as any).upsert({
        user_id: userId,
        browser_notifications_enabled: true,
        updated_at: new Date().toISOString(),
      }, { onConflict: "user_id" });
    }
  } catch {
    // Keep browser notifications working even if Supabase preference save fails.
  }
  return { ok: true };
};

export const showNearbyNotification = async (title: string, body: string, url = "/inbox") => {
  if (!("Notification" in window) || Notification.permission !== "granted") return;
  try {
    const registration = await navigator.serviceWorker?.ready?.catch(() => null);
    if (registration?.showNotification) {
      registration.showNotification(title, {
        body,
        icon: "/icon-192.png",
        badge: "/icon-192.png",
        tag: `nearbypro-${Date.now()}`,
        data: { url },
      });
      return;
    }
    const n = new Notification(title, { body, icon: "/icon-192.png" });
    n.onclick = () => { window.focus(); window.location.href = url; };
  } catch {
    // Ignore notification errors silently.
  }
};

export const playMessageSound = () => {
  try {
    const AudioContextClass = (window as any).AudioContext || (window as any).webkitAudioContext;
    if (!AudioContextClass) return;
    const ctx = new AudioContextClass();
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    osc.connect(gain);
    gain.connect(ctx.destination);
    osc.type = "sine";
    osc.frequency.value = 880;
    gain.gain.setValueAtTime(0.0001, ctx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.08, ctx.currentTime + 0.02);
    gain.gain.exponentialRampToValueAtTime(0.0001, ctx.currentTime + 0.28);
    osc.start();
    osc.stop(ctx.currentTime + 0.3);
  } catch {
    // Some browsers block audio until user interaction.
  }
};
