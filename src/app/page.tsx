"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { ArrowRight, Loader2, MapPin, Sparkles, Mic } from "lucide-react";
import { NavBar } from "@/components/Brand";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input, Textarea, Label } from "@/components/ui/input";
import { sessionState } from "@/lib/state";
import { intakeSchema, type Intake } from "@/lib/schemas";

const PROMPTS = [
  "I'm great at salsa dancing — want to start a class at home in Pune.",
  "I bake artisan sourdough — thinking of a small bakery near my flat.",
  "I'm a CA with 10 years' experience — want to start a tax practice.",
  "I love kids — thinking of a daycare in our society.",
];

export default function HomePage() {
  const router = useRouter();
  const [pending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);
  const [form, setForm] = useState<Intake>({
    name: "",
    idea: "",
    city: "",
    address: "",
    pincode: "",
  });
  const [listening, setListening] = useState(false);

  function update<K extends keyof Intake>(key: K, value: Intake[K]) {
    setForm((prev) => ({ ...prev, [key]: value }));
  }

  function startVoice() {
    type SpeechRecognitionLike = {
      lang: string;
      interimResults: boolean;
      onresult: (event: { results: ArrayLike<ArrayLike<{ transcript: string }>> }) => void;
      onerror: () => void;
      onend: () => void;
      start: () => void;
    };
    const w = window as unknown as {
      webkitSpeechRecognition?: new () => SpeechRecognitionLike;
      SpeechRecognition?: new () => SpeechRecognitionLike;
    };
    const Ctor = w.SpeechRecognition ?? w.webkitSpeechRecognition;
    if (!Ctor) {
      setError("Voice input isn't supported in this browser. Type your idea instead.");
      return;
    }
    const rec = new Ctor();
    rec.lang = "en-IN";
    rec.interimResults = false;
    rec.onresult = (event) => {
      const text = Array.from(event.results)
        .map((r) => r[0]?.transcript ?? "")
        .join(" ");
      update("idea", (form.idea ? form.idea + " " : "") + text);
    };
    rec.onerror = () => setListening(false);
    rec.onend = () => setListening(false);
    setListening(true);
    rec.start();
  }

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    const parsed = intakeSchema.safeParse(form);
    if (!parsed.success) {
      setError(parsed.error.issues[0]?.message ?? "Please fill all fields.");
      return;
    }
    startTransition(async () => {
      try {
        sessionState.setIntake(parsed.data);
        const res = await fetch("/api/analyze", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(parsed.data),
        });
        if (!res.ok) {
          const text = await res.text();
          throw new Error(text || `Analysis failed (${res.status})`);
        }
        const feasibility = await res.json();
        sessionState.setFeasibility(feasibility);
        router.push("/analyze");
      } catch (err) {
        setError(err instanceof Error ? err.message : "Something went wrong.");
      }
    });
  }

  return (
    <>
      <NavBar />
      <main className="mx-auto flex w-full max-w-3xl flex-1 flex-col px-6 py-10 sm:py-16">
        <div className="fade-up flex flex-col gap-3">
          <span className="inline-flex items-center gap-2 self-start rounded-full border border-foreground/10 bg-background/60 px-3 py-1 text-xs text-foreground/70">
            <Sparkles className="h-3.5 w-3.5 text-accent" />
            From idea to operating business — on autopilot
          </span>
          <h1 className="text-balance text-4xl font-semibold tracking-tight sm:text-5xl">
            What are you good at? <br className="hidden sm:block" />
            <span className="text-foreground/60">
              Let&apos;s find out if it&apos;s a business worth starting.
            </span>
          </h1>
          <p className="max-w-2xl text-foreground/70">
            Tell us your idea and where you live. We&apos;ll do a microscopic
            analysis of your locality, give you an honest verdict, and
            (if it stacks up) walk you through registration, schemes, marketing
            and accounts — step by step.
          </p>
        </div>

        <Card className="fade-up mt-10 flex flex-col gap-5">
          <form onSubmit={onSubmit} className="flex flex-col gap-5">
            <div className="grid gap-2">
              <Label htmlFor="idea">Your idea — tell us in your own words</Label>
              <div className="relative">
                <Textarea
                  id="idea"
                  placeholder="e.g. I want to start a salsa dance class at home"
                  value={form.idea}
                  onChange={(e) => update("idea", e.target.value)}
                  className="pr-12"
                  required
                />
                <button
                  type="button"
                  onClick={startVoice}
                  className="absolute right-2 top-2 grid h-9 w-9 place-items-center rounded-xl border border-foreground/10 bg-background text-foreground/70 transition-colors hover:bg-foreground/5"
                  aria-label="Speak instead of typing"
                >
                  <Mic
                    className={`h-4 w-4 ${listening ? "text-accent" : ""}`}
                  />
                </button>
              </div>
              <div className="flex flex-wrap gap-2">
                {PROMPTS.map((p) => (
                  <button
                    key={p}
                    type="button"
                    onClick={() => update("idea", p)}
                    className="rounded-full border border-foreground/10 bg-background/60 px-3 py-1 text-xs text-foreground/70 hover:bg-foreground/5"
                  >
                    {p}
                  </button>
                ))}
              </div>
            </div>

            <div className="grid gap-2 sm:grid-cols-2">
              <div className="grid gap-2">
                <Label htmlFor="name">Your name</Label>
                <Input
                  id="name"
                  placeholder="e.g. Atharva"
                  value={form.name}
                  onChange={(e) => update("name", e.target.value)}
                  required
                />
              </div>
              <div className="grid gap-2">
                <Label htmlFor="city">City</Label>
                <Input
                  id="city"
                  placeholder="e.g. Pune"
                  value={form.city}
                  onChange={(e) => update("city", e.target.value)}
                  required
                />
              </div>
            </div>

            <div className="grid gap-2 sm:grid-cols-[1fr_140px]">
              <div className="grid gap-2">
                <Label htmlFor="address">Locality / address</Label>
                <Input
                  id="address"
                  placeholder="e.g. Kothrud, near Karve Road"
                  value={form.address}
                  onChange={(e) => update("address", e.target.value)}
                  required
                />
              </div>
              <div className="grid gap-2">
                <Label htmlFor="pincode">PIN (optional)</Label>
                <Input
                  id="pincode"
                  placeholder="411038"
                  inputMode="numeric"
                  maxLength={6}
                  value={form.pincode ?? ""}
                  onChange={(e) => update("pincode", e.target.value)}
                />
              </div>
            </div>

            {error ? (
              <p className="rounded-xl border border-red-500/30 bg-red-500/5 px-4 py-2 text-sm text-red-600 dark:text-red-400">
                {error}
              </p>
            ) : null}

            <div className="flex items-center justify-between gap-3">
              <p className="flex items-center gap-1.5 text-xs text-foreground/60">
                <MapPin className="h-3.5 w-3.5" />
                We use your locality to estimate demand and competition.
              </p>
              <Button type="submit" disabled={pending} size="lg">
                {pending ? (
                  <>
                    <Loader2 className="h-4 w-4 animate-spin" />
                    Analyzing locality…
                  </>
                ) : (
                  <>
                    Analyze my idea
                    <ArrowRight className="h-4 w-4" />
                  </>
                )}
              </Button>
            </div>
          </form>
        </Card>

        <div className="fade-up mt-10 grid grid-cols-2 gap-3 text-xs text-foreground/60 sm:grid-cols-4">
          {[
            "Locality fit",
            "Pivot suggestions",
            "Govt schemes",
            "Compliance docs",
          ].map((s) => (
            <div
              key={s}
              className="rounded-2xl border border-foreground/10 bg-background/60 px-3 py-2 text-center"
            >
              {s}
            </div>
          ))}
        </div>
      </main>
    </>
  );
}
