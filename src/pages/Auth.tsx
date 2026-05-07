import { useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card } from "@/components/ui/card";
import { Checkbox } from "@/components/ui/checkbox";
import { Logo } from "@/components/Logo";
import { toast } from "sonner";
import { requestNearbyNotifications } from "@/lib/notifications";

const Auth = () => {
  const nav = useNavigate();
  const [mode, setMode] = useState<"signin" | "signup">("signup");
  const [email, setEmail] = useState(localStorage.getItem("nearby_saved_email") ?? "");
  const [password, setPassword] = useState("");
  const [name, setName] = useState("");
  const [remember, setRemember] = useState(true);
  const [busy, setBusy] = useState(false);

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setBusy(true);
    if (remember) localStorage.setItem("nearby_saved_email", email);
    else localStorage.removeItem("nearby_saved_email");

    if (mode === "signup") {
      const { data, error } = await supabase.auth.signUp({
        email,
        password,
        options: { emailRedirectTo: `${window.location.origin}/dashboard`, data: { full_name: name } },
      });
      if (error) toast.error(error.message);
      else {
        if (data.user) await requestNearbyNotifications(data.user.id);
        toast.success("Account created. Welcome to NearbyPro.");
        nav("/dashboard");
      }
    } else {
      const { data, error } = await supabase.auth.signInWithPassword({ email, password });
      if (error) toast.error(error.message);
      else {
        if (data.user) await requestNearbyNotifications(data.user.id);
        toast.success("Signed in successfully.");
        nav("/dashboard");
      }
    }
    setBusy(false);
  };

  return (
    <div className="min-h-screen grid place-items-center bg-gradient-hero p-4">
      <Card className="w-full max-w-md p-7 shadow-elegant">
        <Link to="/" className="flex flex-col items-center gap-2 mb-5">
          <Logo className="h-16 w-16" />
          <span className="font-bold text-2xl">Nearby<span className="text-accent">Pro</span></span>
        </Link>

        <div className="text-center mb-6">
          <h1 className="text-2xl font-bold">{mode === "signup" ? "Create your account" : "Welcome back"}</h1>
          <p className="text-sm text-muted-foreground mt-1">{mode === "signup" ? "Join NearbyPro free. Post jobs, chat and find trusted pros." : "Sign in to continue to your dashboard."}</p>
        </div>

        <div className="grid grid-cols-2 gap-2 mb-5 rounded-xl bg-secondary p-1">
          <Button type="button" variant={mode === "signup" ? "default" : "ghost"} className={mode === "signup" ? "bg-gradient-brand" : ""} onClick={() => setMode("signup")}>Create account</Button>
          <Button type="button" variant={mode === "signin" ? "default" : "ghost"} className={mode === "signin" ? "bg-gradient-brand" : ""} onClick={() => setMode("signin")}>Sign in</Button>
        </div>

        <form onSubmit={submit} className="space-y-4">
          {mode === "signup" && (
            <div className="space-y-1.5">
              <Label>Full name</Label>
              <Input placeholder="Your full name" value={name} onChange={(e) => setName(e.target.value)} required />
            </div>
          )}
          <div className="space-y-1.5">
            <Label>Email address</Label>
            <Input type="email" placeholder="your@email.com" value={email} onChange={(e) => setEmail(e.target.value)} required />
          </div>
          <div className="space-y-1.5">
            <Label>{mode === "signup" ? "Create password" : "Password"}</Label>
            <Input type="password" placeholder={mode === "signup" ? "Create your password" : "Enter your password"} value={password} onChange={(e) => setPassword(e.target.value)} required minLength={6} />
          </div>
          <label className="flex items-center gap-2 text-sm text-muted-foreground cursor-pointer">
            <Checkbox checked={remember} onCheckedChange={(v) => setRemember(Boolean(v))} />
            Remember my email on this device
          </label>
          <Button type="submit" disabled={busy} className="w-full bg-gradient-brand h-12 text-base">
            {busy ? "Please wait..." : mode === "signup" ? "Create my free account" : "Sign in"}
          </Button>
        </form>

        <div className="text-sm text-center mt-5 text-muted-foreground">
          {mode === "signup" ? "Already have an account?" : "New here?"}{" "}
          <button className="text-accent font-semibold underline-offset-4 hover:underline" onClick={() => setMode(mode === "signin" ? "signup" : "signin")}> {mode === "signup" ? "Sign in" : "Create account"}</button>
        </div>

        <Button asChild variant="ghost" className="w-full mt-3">
          <Link to="/">← Back to homepage</Link>
        </Button>
      </Card>
    </div>
  );
};
export default Auth;
