import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { Logo } from "./Logo";
import { X, Download } from "lucide-react";

export const InstallPrompt = () => {
  const [evt, setEvt] = useState<any>(null);
  const [show, setShow] = useState(false);
  useEffect(() => {
    if (sessionStorage.getItem("np-install-dismissed")) return;
    const handler = (e: any) => { e.preventDefault(); setEvt(e); setShow(true); };
    window.addEventListener("beforeinstallprompt", handler);
    return () => window.removeEventListener("beforeinstallprompt", handler);
  }, []);
  if (!show) return null;
  const dismiss = () => { setShow(false); sessionStorage.setItem("np-install-dismissed", "1"); };
  return (
    <div className="fixed bottom-4 inset-x-4 md:left-auto md:right-6 md:w-96 z-50 bg-card border rounded-2xl shadow-elegant p-4 animate-fade-in">
      <button onClick={dismiss} className="absolute top-2 right-2 p-1 hover:bg-muted rounded-md" aria-label="Dismiss"><X className="h-4 w-4" /></button>
      <div className="flex items-center gap-3">
        <Logo className="h-12 w-12" />
        <div className="flex-1">
          <div className="font-semibold">Install NearbyPro</div>
          <div className="text-xs text-muted-foreground">Faster access. Works offline.</div>
        </div>
        <Button size="sm" className="bg-gradient-brand" onClick={async () => { await evt.prompt(); dismiss(); }}>
          <Download className="h-4 w-4 mr-1" /> Install
        </Button>
      </div>
    </div>
  );
};
