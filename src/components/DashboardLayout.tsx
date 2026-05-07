import { Link, NavLink, Outlet, useNavigate } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import { useEffect } from "react";
import { Logo } from "@/components/Logo";
import { Button } from "@/components/ui/button";
import { LayoutDashboard, Users, Briefcase, Star, MessageSquare, Megaphone, ListChecks, LogOut, Home, ShieldCheck, Inbox } from "lucide-react";

export const DashboardLayout = ({ adminOnly = false }: { adminOnly?: boolean }) => {
  const { user, isAdmin, loading, signOut } = useAuth();
  const nav = useNavigate();
  useEffect(() => {
    if (loading) return;
    if (!user) nav("/auth");
    else if (adminOnly && !isAdmin) nav("/dashboard");
  }, [user, isAdmin, loading, adminOnly, nav]);

  const items = adminOnly
    ? [
        { to: "/admin", icon: LayoutDashboard, label: "Dashboard", end: true },
        { to: "/admin/moderation", icon: ShieldCheck, label: "Moderation" },
        { to: "/admin/providers", icon: Briefcase, label: "Providers" },
        { to: "/admin/users", icon: Users, label: "Users" },
        { to: "/admin/reviews", icon: Star, label: "Reviews" },
        { to: "/admin/requests", icon: ListChecks, label: "Requests" },
        { to: "/admin/ads", icon: Megaphone, label: "Adverts" },
      ]
    : [
        { to: "/dashboard", icon: LayoutDashboard, label: "Overview", end: true },
        { to: "/dashboard/profile", icon: Briefcase, label: "My profile" },
        { to: "/inbox", icon: Inbox, label: "Inbox" },
        { to: "/messages", icon: MessageSquare, label: "Messages" },
      ];

  const signOutNow = () => { signOut(); nav("/"); };

  return (
    <div className="min-h-screen flex">
      <aside className="hidden md:flex w-64 flex-col bg-sidebar text-sidebar-foreground">
        <Link to="/" className="flex items-center gap-2 p-5 border-b border-sidebar-border">
          <Logo className="h-9 w-9" />
          <span className="font-bold">Nearby<span className="text-accent">Pro</span></span>
        </Link>
        <nav className="flex-1 p-3 space-y-1">
          {items.map((it) => (
            <NavLink key={it.to} to={it.to} end={(it as any).end}
              className={({isActive}) => `flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm transition-colors ${isActive ? "bg-sidebar-primary text-sidebar-primary-foreground" : "hover:bg-sidebar-accent"}`}>
              <it.icon className="h-4 w-4" /> {it.label}
            </NavLink>
          ))}
        </nav>
        <div className="p-3 border-t border-sidebar-border space-y-2">
          <div className="flex items-center justify-center py-3 opacity-80"><Logo className="h-14 w-14" /></div>
          <Link to="/" className="flex items-center gap-3 px-3 py-2 rounded-lg hover:bg-sidebar-accent text-sm"><Home className="h-4 w-4" />Back to site</Link>
          <button onClick={signOutNow} className="w-full flex items-center gap-3 px-3 py-2 rounded-lg hover:bg-sidebar-accent text-sm"><LogOut className="h-4 w-4" />Sign out</button>
        </div>
      </aside>
      <main className="flex-1 bg-secondary/30">
        <header className="md:hidden bg-sidebar text-sidebar-foreground border-b border-sidebar-border">
          <div className="flex items-center justify-between p-3">
            <Link to="/" className="flex items-center gap-2"><Logo className="h-7 w-7" /><span className="font-bold text-sm">NearbyPro</span></Link>
            <div className="flex items-center gap-1">
              <Button asChild variant="ghost" size="sm"><Link to="/"><Home className="h-4 w-4 mr-1" />Home</Link></Button>
              <Button variant="ghost" size="sm" onClick={signOutNow}><LogOut className="h-4 w-4" /></Button>
            </div>
          </div>
          <nav className="px-2 pb-2 flex gap-2 overflow-x-auto">
            {items.map((it) => (
              <NavLink key={it.to} to={it.to} end={(it as any).end}
                className={({isActive}) => `shrink-0 flex items-center gap-1.5 px-3 py-2 rounded-full text-xs transition-colors ${isActive ? "bg-sidebar-primary text-sidebar-primary-foreground" : "bg-sidebar-accent/40"}`}>
                <it.icon className="h-3.5 w-3.5" /> {it.label}
              </NavLink>
            ))}
          </nav>
        </header>
        <div className="p-4 md:p-6">
          <Outlet />
        </div>
      </main>
    </div>
  );
};
