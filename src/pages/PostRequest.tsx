import { useEffect, useState } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { Header } from "@/components/Header";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { toast } from "sonner";

const PostRequest = () => {
  const { user, loading } = useAuth();
  const nav = useNavigate();
  const [params] = useSearchParams();
  const [cats, setCats] = useState<any[]>([]);
  const [f, setF] = useState({ title: params.get("title") ?? "", description: "", location: params.get("loc") ?? "", category_id: "" });
  useEffect(() => { if (!loading && !user) nav("/auth"); }, [user, loading, nav]);
  useEffect(() => { supabase.from("categories").select("*").then(({ data }) => setCats(data ?? [])); }, []);
  const submit = async () => {
    if (!user) return;
    const { error } = await supabase.from("service_requests").insert({ ...f, user_id: user.id, category_id: f.category_id || null });
    if (error) return toast.error(error.message);
    toast.success("Request posted");
    nav("/requests");
  };
  return (
    <div className="min-h-screen flex flex-col">
      <Header />
      <main className="container py-8 max-w-xl">
        <h1 className="text-3xl font-bold mb-6">Post a service request</h1>
        <Card className="p-6 space-y-3">
          <Input placeholder="Title (e.g. Need a plumber)" value={f.title} onChange={(e) => setF({ ...f, title: e.target.value })} />
          <Textarea placeholder="Describe what you need..." value={f.description} onChange={(e) => setF({ ...f, description: e.target.value })} />
          <Input placeholder="Location" value={f.location} onChange={(e) => setF({ ...f, location: e.target.value })} />
          <Select value={f.category_id} onValueChange={(v) => setF({ ...f, category_id: v })}>
            <SelectTrigger><SelectValue placeholder="Category (optional)" /></SelectTrigger>
            <SelectContent>{cats.map((c) => <SelectItem key={c.id} value={c.id}>{c.name}</SelectItem>)}</SelectContent>
          </Select>
          <Button onClick={submit} className="bg-gradient-brand w-full">Post request</Button>
        </Card>
      </main>
    </div>
  );
};
export default PostRequest;
