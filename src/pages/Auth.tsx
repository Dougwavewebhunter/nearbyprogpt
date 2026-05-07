import { useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card } from "@/components/ui/card";
import { Logo } from "@/components/Logo";
import { toast } from "sonner";

const Auth = () => {
  const nav = useNavigate();
  const [mode, setMode] = useState<"signin" | "signup">("signin");
  const [email, setEmail] = useState(""); const [password, setPassword] = useState(""); const [name, setName] = useState("");
  const [busy, setBusy] = useState(false);

  const submit = async (e: React.FormEvent) => {
    e.preventDefault(); setBusy(true);
    if (mode === "signup") {
      const { error } = await supabase.auth.signUp({
        email, password,
        options: { emailRedirectTo: `${window.location.origin}/`, data: { full_name: name } },
      });
      if (error) toast.error(error.message); else { toast.success("Account created"); nav("/"); }
    } else {
      const { error } = await supabase.auth.signInWithPassword({ email, password });
      if (error) toast.error(error.message); else nav("/");
    }
    setBusy(false);
  };

  return (
    <div className="min-h-screen grid place-items-center bg-gradient-hero p-4">
      <Card className="w-full max-w-md p-8">
        <Link to="/" className="flex flex-col items-center gap-2 mb-6">
          <Logo className="h-14 w-14" />
          <span className="font-bold text-xl">Nearby<span className="text-accent">Pro</span></span>
        </Link>
        <h1 className="text-2xl font-bold text-center mb-1">{mode === "signin" ? "Welcome back" : "Create your account"}</h1>
        <p className="text-sm text-muted-foreground text-center mb-6">{mode === "signin" ? "Sign in to chat & post requests" : "Join NearbyPro free"}</p>
        <form onSubmit={submit} className="space-y-3">
          {mode === "signup" && <Input placeholder="Full name" value={name} onChange={(e) => setName(e.target.value)} required />}
          <Input type="email" placeholder="Email" value={email} onChange={(e) => setEmail(e.target.value)} required />
          <Input type="password" placeholder="Password" value={password} onChange={(e) => setPassword(e.target.value)} required minLength={6} />
          <Button type="submit" disabled={busy} className="w-full bg-gradient-brand">{busy ? "..." : mode === "signin" ? "Sign in" : "Create account"}</Button>
        </form>
        <div className="text-sm text-center mt-4 text-muted-foreground">
          {mode === "signin" ? "New here?" : "Have an account?"}{" "}
          <button className="text-accent font-medium" onClick={() => setMode(mode === "signin" ? "signup" : "signin")}>
            {mode === "signin" ? "Create account" : "Sign in"}
          </button>
        </div>
      </Card>
    </div>
  );
};
export default Auth;
