import { useEffect, useRef, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { MessageCircle, X, Send, Bot } from "lucide-react";
import { Link } from "react-router-dom";

type Step = "service" | "location" | "results" | "actions";
interface Msg { role: "bot" | "user"; content: React.ReactNode; }

export const Chatbot = () => {
  const [open, setOpen] = useState(false);
  const [step, setStep] = useState<Step>("service");
  const [service, setService] = useState("");
  const [location, setLocation] = useState("");
  const [input, setInput] = useState("");
  const [msgs, setMsgs] = useState<Msg[]>([
    { role: "bot", content: "👋 Hi! I'm your NearbyPro assistant. What service do you need?" },
  ]);
  const [results, setResults] = useState<any[]>([]);
  const endRef = useRef<HTMLDivElement>(null);
  useEffect(() => { endRef.current?.scrollIntoView({ behavior: "smooth" }); }, [msgs, open]);

  const push = (m: Msg) => setMsgs((p) => [...p, m]);

  const handleSend = async () => {
    const text = input.trim();
    if (!text) return;
    push({ role: "user", content: text });
    setInput("");

    if (step === "service") {
      setService(text);
      push({ role: "bot", content: `Great — looking for ${text}. Which town or city are you in?` });
      setStep("location");
    } else if (step === "location") {
      setLocation(text);
      const { data } = await supabase.from("providers").select("id,business_name,location,description")
        .eq("is_active", true)
        .ilike("location", `%${text}%`)
        .limit(5);
      const found = data ?? [];
      setResults(found);
      push({
        role: "bot",
        content: found.length
          ? `I found ${found.length} pro${found.length === 1 ? "" : "s"} for "${service}" near ${text}. Tap one below or post your request.`
          : `I couldn't find pros for "${service}" near ${text} yet. You can post a request — providers will respond.`,
      });
      setStep("actions");
    } else {
      push({ role: "bot", content: "Use the buttons below, or refresh to start over." });
    }
  };

  return (
    <>
      <button
        onClick={() => setOpen((o) => !o)}
        className="fixed bottom-5 right-5 z-50 h-14 w-14 rounded-full bg-gradient-brand shadow-glow flex items-center justify-center text-white animate-float"
        aria-label="Open assistant"
      >
        {open ? <X className="h-6 w-6" /> : <MessageCircle className="h-6 w-6" />}
      </button>
      {open && (
        <div className="fixed bottom-24 right-4 left-4 md:left-auto md:w-96 z-50 bg-card border rounded-2xl shadow-elegant flex flex-col h-[520px] animate-fade-in overflow-hidden">
          <div className="bg-gradient-hero text-white p-4 flex items-center gap-2">
            <Bot className="h-5 w-5" />
            <div>
              <div className="font-semibold text-sm">NearbyPro Assistant</div>
              <div className="text-xs opacity-80">Online · here to help</div>
            </div>
          </div>
          <div className="flex-1 overflow-y-auto p-3 space-y-2">
            {msgs.map((m, i) => (
              <div key={i} className={`flex ${m.role === "user" ? "justify-end" : "justify-start"}`}>
                <div className={`max-w-[85%] px-3 py-2 rounded-2xl text-sm ${m.role === "user" ? "bg-accent text-accent-foreground rounded-br-sm" : "bg-muted rounded-bl-sm"}`}>
                  {m.content}
                </div>
              </div>
            ))}
            {step === "actions" && (
              <div className="space-y-2 pt-2">
                {results.map((r) => (
                  <Link key={r.id} to={`/provider/${r.id}`} onClick={() => setOpen(false)} className="block p-3 rounded-xl border hover:border-accent transition-colors">
                    <div className="font-semibold text-sm">{r.business_name}</div>
                    <div className="text-xs text-muted-foreground">{r.location}</div>
                  </Link>
                ))}
                <div className="flex gap-2 pt-1">
                  <Button asChild size="sm" variant="outline" className="flex-1" onClick={() => setOpen(false)}>
                    <Link to={`/browse?q=${encodeURIComponent(service)}&loc=${encodeURIComponent(location)}`}>View all</Link>
                  </Button>
                  <Button asChild size="sm" className="flex-1 bg-gradient-brand" onClick={() => setOpen(false)}>
                    <Link to={`/post-request?title=${encodeURIComponent(service)}&loc=${encodeURIComponent(location)}`}>Post request</Link>
                  </Button>
                </div>
              </div>
            )}
            <div ref={endRef} />
          </div>
          <div className="border-t p-2 flex gap-2">
            <Input
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && handleSend()}
              placeholder={step === "service" ? "e.g. plumber" : step === "location" ? "e.g. Pretoria" : "Ask anything..."}
            />
            <Button size="icon" onClick={handleSend} className="bg-gradient-brand"><Send className="h-4 w-4" /></Button>
          </div>
        </div>
      )}
    </>
  );
};
