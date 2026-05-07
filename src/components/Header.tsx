import { Link, NavLink } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import { Logo } from "@/components/Logo";
import { Button } from "@/components/ui/button";
import { MapPin, MessageSquare, LayoutDashboard, LogOut, User as UserIcon, Plus, Inbox } from "lucide-react";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger, DropdownMenuSeparator } from "@/components/ui/dropdown-menu";
import { UnreadBadge } from "@/components/UnreadBadge";

export const Header = ({ onLocationClick }: { onLocationClick?: () => void }) => {
  const { user, isAdmin, signOut } = useAuth();
  return (
    <header className="sticky top-0 z-40 w-full border-b bg-background/85 backdrop-blur supports-[backdrop-filter]:bg-background/70">
      <div className="container flex h-16 items-center justify-between gap-3">
        <Link to="/" className="flex items-center gap-2.5">
          <Logo className="h-9 w-9" />
          <span className="font-bold text-lg tracking-tight hidden sm:inline">Nearby<span className="text-accent">Pro</span></span>
        </Link>
        <nav className="hidden md:flex items-center gap-6 text-sm font-medium">
          <NavLink to="/browse" className={({isActive}) => isActive ? "text-accent" : "hover:text-accent transition-colors"}>Browse</NavLink>
          <NavLink to="/requests" className={({isActive}) => isActive ? "text-accent" : "hover:text-accent transition-colors"}>Requests</NavLink>
          <NavLink to="/become-pro" className={({isActive}) => isActive ? "text-accent" : "hover:text-accent transition-colors"}>Become a Pro</NavLink>
        </nav>
        <div className="flex items-center gap-2">
          <Button variant="outline" size="sm" onClick={onLocationClick} className="gap-1.5 hidden sm:inline-flex">
            <MapPin className="h-4 w-4" /> <span className="hidden sm:inline">Find near you</span>
          </Button>
          <Button asChild size="sm" className="gap-1.5 bg-gradient-brand text-accent-foreground shadow-glow hover:opacity-95">
            <Link to="/post-request"><Plus className="h-4 w-4" /><span className="hidden sm:inline">Post a Job</span></Link>
          </Button>
          {user ? (
            <>
              <Button asChild variant="ghost" size="icon" className="relative">
                <Link to="/inbox" aria-label="Inbox">
                  <Inbox className="h-5 w-5" />
                  <UnreadBadge />
                </Link>
              </Button>
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="ghost" size="icon" aria-label="Account"><UserIcon className="h-5 w-5" /></Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end">
                  <DropdownMenuItem asChild><Link to="/inbox"><Inbox className="h-4 w-4 mr-2" />Inbox</Link></DropdownMenuItem>
                  <DropdownMenuItem asChild><Link to="/dashboard"><LayoutDashboard className="h-4 w-4 mr-2" />Dashboard</Link></DropdownMenuItem>
                  {isAdmin && <DropdownMenuItem asChild><Link to="/admin"><LayoutDashboard className="h-4 w-4 mr-2" />Admin</Link></DropdownMenuItem>}
                  <DropdownMenuSeparator />
                  <DropdownMenuItem onClick={signOut}><LogOut className="h-4 w-4 mr-2" />Sign out</DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            </>
          ) : (
            <Button asChild size="sm" className="bg-gradient-brand text-accent-foreground shadow-glow hover:opacity-95"><Link to="/auth">Sign in</Link></Button>
          )}
        </div>
      </div>
    </header>
  );
};
