import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card } from "@/components/ui/card";
import { Shield } from "lucide-react";
import { toast } from "sonner";

const AdminLogin = () => {
  const nav = useNavigate();
  const [email, setEmail] = useState(""); const [password, setPassword] = useState("");
  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    const { data, error } = await supabase.auth.signInWithPassword({ email, password });
    if (error || !data.user) return toast.error(error?.message ?? "Failed");
    const { data: roles } = await supabase.from("user_roles").select("role").eq("user_id", data.user.id);
    if (roles?.some((r) => r.role === "admin")) nav("/admin");
    else { await supabase.auth.signOut(); toast.error("Not an admin account"); }
  };
  return (
    <div className="min-h-screen grid place-items-center bg-gradient-hero p-4">
      <Card className="w-full max-w-md p-8">
        <div className="flex flex-col items-center gap-2 mb-6">
          <div className="h-14 w-14 rounded-2xl bg-gradient-brand grid place-items-center text-white"><Shield className="h-7 w-7" /></div>
          <h1 className="text-2xl font-bold">Admin access</h1>
        </div>
        <form onSubmit={submit} className="space-y-3">
          <Input type="email" placeholder="Admin email" value={email} onChange={(e) => setEmail(e.target.value)} required />
          <Input type="password" placeholder="Password" value={password} onChange={(e) => setPassword(e.target.value)} required />
          <Button className="w-full bg-gradient-brand">Sign in</Button>
        </form>
      </Card>
    </div>
  );
};
export default AdminLogin;
