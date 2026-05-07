import { Link } from "react-router-dom";
import { Logo } from "./Logo";
import { Shield, Download } from "lucide-react";
import { Button } from "@/components/ui/button";

export const Footer = () => (
  <footer className="border-t bg-secondary/40 mt-16">
    <div className="container py-10 grid gap-8 md:grid-cols-4">
      <div>
        <div className="flex items-center gap-2 mb-3"><Logo className="h-8 w-8" /><span className="font-bold">NearbyPro</span></div>
        <p className="text-sm text-muted-foreground">South Africa's marketplace for trusted local pros.</p>
      </div>
      <div>
        <h4 className="font-semibold mb-3 text-sm">Explore</h4>
        <ul className="space-y-2 text-sm text-muted-foreground">
          <li><Link to="/" className="hover:text-accent">Home</Link></li>
          <li><Link to="/browse" className="hover:text-accent">Browse providers</Link></li>
          <li><Link to="/requests" className="hover:text-accent">Service requests</Link></li>
          <li><Link to="/become-pro" className="hover:text-accent">Become a Pro</Link></li>
        </ul>
      </div>
      <div>
        <h4 className="font-semibold mb-3 text-sm">Account</h4>
        <ul className="space-y-2 text-sm text-muted-foreground">
          <li><Link to="/auth" className="hover:text-accent">Sign in / Sign up</Link></li>
          <li><Link to="/dashboard" className="hover:text-accent">Dashboard</Link></li>
          <li><Link to="/inbox" className="hover:text-accent">Inbox</Link></li>
        </ul>
      </div>
      <div>
        <h4 className="font-semibold mb-3 text-sm">Get the app</h4>
        <p className="text-sm text-muted-foreground mb-3">Install NearbyPro on your phone for one-tap access.</p>
        <Button className="bg-orange-500 hover:bg-orange-600 text-white" onClick={() => (window as any).triggerPwaInstall?.()}>
          <Download className="h-4 w-4 mr-2" /> Install app now
        </Button>
      </div>
    </div>
    <div className="border-t py-4 text-center text-xs text-muted-foreground space-y-1">
      <div className="flex items-center justify-center gap-2 flex-wrap">
        <span>© {new Date().getFullYear()} NearbyPro · www.nearbypro.co.za</span>
        <Link to="/admin-login" aria-label="Admin login" className="opacity-30 hover:opacity-100 transition-opacity"><Shield className="h-3.5 w-3.5" /></Link>
      </div>
      <div>
        Web app designed by <a href="https://www.webdevpro.tech" target="_blank" rel="noreferrer" className="text-accent hover:underline font-medium">www.webdevpro.tech</a>
        <span className="mx-1">·</span>
        <a href="tel:+27812159792" className="text-accent hover:underline font-medium">+27-812-159-792</a>
      </div>
    </div>
  </footer>
);
