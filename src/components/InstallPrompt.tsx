import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { Logo } from "./Logo";
import { X, Download } from "lucide-react";

export const triggerPwaInstall = async () => {
  const evt = (window as any).__nearbyInstallPrompt;
  if (evt) {
    evt.prompt();
    await evt.userChoice?.catch?.(() => null);
    return true;
  }
  alert("To install NearbyPro: on Android/Chrome use Add to Home Screen. On iPhone/Safari tap Share, then Add to Home Screen. On Windows/Chrome click the install icon in the address bar.");
  return false;
};

export const InstallPrompt = () => {
  const [show, setShow] = useState(false);
  const [installed, setInstalled] = useState(false);

  useEffect(() => {
    (window as any).triggerPwaInstall = triggerPwaInstall;
    const handler = (e: any) => {
      e.preventDefault();
      (window as any).__nearbyInstallPrompt = e;
    };
    const installedHandler = () => { setInstalled(true); setShow(false); };
    window.addEventListener("beforeinstallprompt", handler);
    window.addEventListener("appinstalled", installedHandler);
    const first = setTimeout(() => setShow(true), 60000);
    const repeat = setInterval(() => setShow(true), 120000);
    return () => {
      window.removeEventListener("beforeinstallprompt", handler);
      window.removeEventListener("appinstalled", installedHandler);
      clearTimeout(first);
      clearInterval(repeat);
    };
  }, []);

  if (!show || installed) return null;
  return (
    <div className="fixed bottom-4 inset-x-4 md:left-auto md:right-6 md:w-96 z-50 bg-card border rounded-2xl shadow-elegant p-4 animate-fade-in">
      <button onClick={() => setShow(false)} className="absolute top-2 right-2 p-1 hover:bg-muted rounded-md" aria-label="Dismiss"><X className="h-4 w-4" /></button>
      <div className="flex items-center gap-3">
        <Logo className="h-12 w-12" />
        <div className="flex-1">
          <div className="font-semibold">Install NearbyPro App</div>
          <div className="text-xs text-muted-foreground">Install this app on Android, iOS or Windows for quick access.</div>
        </div>
        <Button size="sm" className="bg-orange-500 hover:bg-orange-600 text-white" onClick={async () => { await triggerPwaInstall(); setShow(false); }}>
          <Download className="h-4 w-4 mr-1" /> Install
        </Button>
      </div>
    </div>
  );
};
