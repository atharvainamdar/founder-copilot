"use client";

import { useEffect, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import {
  ArrowLeft,
  ArrowRight,
  Banknote,
  Building2,
  CalendarRange,
  CircleDot,
  FileText,
  Loader2,
  Megaphone,
  Sparkles,
  Wallet,
} from "lucide-react";
import { NavBar } from "@/components/Brand";
import { Button } from "@/components/ui/button";
import { Card, CardDescription, CardTitle } from "@/components/ui/card";
import { Input, Label } from "@/components/ui/input";
import {
  sessionState,
  useFeasibility,
  useIntake,
  usePlan,
} from "@/lib/state";
import type { WizardPlan, wizardInputSchema } from "@/lib/schemas";
import type { z } from "zod";

type WizardForm = {
  budgetInr: string;
  fundingStance: "bootstrap" | "loan" | "scheme" | "investor" | "unsure";
  entityType:
    | "proprietorship"
    | "partnership"
    | "llp"
    | "pvt_ltd"
    | "opc"
    | "unsure";
  startingFromZero: "yes" | "no";
};

const FUNDING_OPTIONS: {
  value: WizardForm["fundingStance"];
  label: string;
  hint: string;
}[] = [
  { value: "bootstrap", label: "Bootstrap", hint: "Use my own savings" },
  { value: "loan", label: "Bank loan", hint: "MSME / personal / business loan" },
  { value: "scheme", label: "Govt scheme", hint: "Mudra, PMEGP, Stand-Up India…" },
  { value: "investor", label: "Investors", hint: "Angels / VC later" },
  { value: "unsure", label: "Not sure", hint: "Help me decide" },
];

const ENTITY_OPTIONS: {
  value: WizardForm["entityType"];
  label: string;
  hint: string;
}[] = [
  { value: "proprietorship", label: "Proprietorship", hint: "Simplest, just me" },
  { value: "partnership", label: "Partnership", hint: "With co-founders" },
  { value: "llp", label: "LLP", hint: "Liability protection, lighter" },
  { value: "pvt_ltd", label: "Pvt Ltd", hint: "Investor-friendly" },
  { value: "opc", label: "OPC", hint: "Solo with limited liability" },
  { value: "unsure", label: "Not sure", hint: "Recommend for me" },
];

export default function WizardPage() {
  const router = useRouter();
  const intake = useIntake();
  const feas = useFeasibility();
  const plan = usePlan();
  const [pending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);
  const [form, setForm] = useState<WizardForm>({
    budgetInr: "",
    fundingStance: "bootstrap",
    entityType: "unsure",
    startingFromZero: "yes",
  });

  useEffect(() => {
    if (intake === null || feas === null) {
      router.replace("/");
    }
  }, [intake, feas, router]);

  if (!intake || !feas) {
    return (
      <>
        <NavBar />
        <main className="grid flex-1 place-items-center">
          <div className="flex items-center gap-2 text-foreground/60">
            <Loader2 className="h-4 w-4 animate-spin" /> Loading…
          </div>
        </main>
      </>
    );
  }

  function generatePlan(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    if (!intake || !feas) return;
    const payload: z.infer<typeof wizardInputSchema> = {
      intake,
      feasibility: feas,
      budgetInr: form.budgetInr ? Number(form.budgetInr) : undefined,
      fundingStance: form.fundingStance,
      entityType: form.entityType,
      startingFromZero: form.startingFromZero === "yes",
    };
    startTransition(async () => {
      try {
        const res = await fetch("/api/wizard", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(payload),
        });
        if (!res.ok) {
          const text = await res.text();
          throw new Error(text || `Plan failed (${res.status})`);
        }
        const next = (await res.json()) as WizardPlan;
        sessionState.setPlan(next);
        window.scrollTo({ top: 0, behavior: "smooth" });
      } catch (err) {
        setError(err instanceof Error ? err.message : "Something went wrong.");
      }
    });
  }

  return (
    <>
      <NavBar />
      <main className="mx-auto flex w-full max-w-4xl flex-1 flex-col gap-8 px-6 py-10">
        <Link
          href="/analyze"
          className="inline-flex w-fit items-center gap-1 text-sm text-foreground/60 hover:text-foreground"
        >
          <ArrowLeft className="h-3.5 w-3.5" />
          Back to analysis
        </Link>

        <div className="fade-up flex flex-col gap-2">
          <span className="inline-flex items-center gap-2 self-start rounded-full border border-foreground/10 bg-background/60 px-3 py-1 text-xs text-foreground/70">
            <Sparkles className="h-3.5 w-3.5 text-accent" /> Setup wizard
          </span>
          <h1 className="text-3xl font-semibold tracking-tight sm:text-4xl">
            Let&apos;s build your setup plan, {intake.name.split(" ")[0]}.
          </h1>
          <p className="text-foreground/70">
            A few quick questions and we&apos;ll match you to the right entity,
            schemes and a 30-day rollout for{" "}
            <em className="not-italic font-medium">{intake.idea}</em>.
          </p>
        </div>

        <Card className="fade-up flex flex-col gap-6">
          <form onSubmit={generatePlan} className="flex flex-col gap-6">
            <div className="grid gap-2 sm:grid-cols-[1fr_200px]">
              <div className="grid gap-2">
                <Label htmlFor="budget">Budget you can spend up-front (₹)</Label>
                <Input
                  id="budget"
                  inputMode="numeric"
                  placeholder="e.g. 50000"
                  value={form.budgetInr}
                  onChange={(e) =>
                    setForm((f) => ({
                      ...f,
                      budgetInr: e.target.value.replace(/[^0-9]/g, ""),
                    }))
                  }
                />
              </div>
              <div className="grid gap-2">
                <Label>Starting from zero?</Label>
                <div className="flex gap-2">
                  {(["yes", "no"] as const).map((v) => (
                    <button
                      key={v}
                      type="button"
                      onClick={() =>
                        setForm((f) => ({ ...f, startingFromZero: v }))
                      }
                      className={`flex-1 rounded-2xl border px-3 py-2 text-sm capitalize ${
                        form.startingFromZero === v
                          ? "border-accent bg-accent-soft/40"
                          : "border-foreground/10 bg-background/60 hover:bg-foreground/5"
                      }`}
                    >
                      {v}
                    </button>
                  ))}
                </div>
              </div>
            </div>

            <ChoiceGrid
              label="How do you want to fund this?"
              options={FUNDING_OPTIONS}
              value={form.fundingStance}
              onChange={(v) =>
                setForm((f) => ({ ...f, fundingStance: v }))
              }
            />

            <ChoiceGrid
              label="Preferred legal entity"
              options={ENTITY_OPTIONS}
              value={form.entityType}
              onChange={(v) => setForm((f) => ({ ...f, entityType: v }))}
            />

            {error ? (
              <p className="rounded-xl border border-red-500/30 bg-red-500/5 px-4 py-2 text-sm text-red-600 dark:text-red-400">
                {error}
              </p>
            ) : null}

            <div className="flex justify-end">
              <Button type="submit" disabled={pending} size="lg">
                {pending ? (
                  <>
                    <Loader2 className="h-4 w-4 animate-spin" />
                    Building your plan…
                  </>
                ) : (
                  <>
                    {plan ? "Regenerate plan" : "Generate setup plan"}
                    <ArrowRight className="h-4 w-4" />
                  </>
                )}
              </Button>
            </div>
          </form>
        </Card>

        {plan ? <PlanView plan={plan} /> : null}
      </main>
    </>
  );
}

function ChoiceGrid<T extends string>({
  label,
  options,
  value,
  onChange,
}: {
  label: string;
  options: { value: T; label: string; hint: string }[];
  value: T;
  onChange: (v: T) => void;
}) {
  return (
    <div className="grid gap-2">
      <Label>{label}</Label>
      <div className="grid gap-2 sm:grid-cols-3">
        {options.map((opt) => {
          const active = value === opt.value;
          return (
            <button
              key={opt.value}
              type="button"
              onClick={() => onChange(opt.value)}
              className={`flex flex-col items-start gap-0.5 rounded-2xl border px-3 py-2 text-left ${
                active
                  ? "border-accent bg-accent-soft/40"
                  : "border-foreground/10 bg-background/60 hover:bg-foreground/5"
              }`}
            >
              <span className="text-sm font-medium">{opt.label}</span>
              <span className="text-xs text-foreground/60">{opt.hint}</span>
            </button>
          );
        })}
      </div>
    </div>
  );
}

function PlanView({ plan }: { plan: WizardPlan }) {
  return (
    <div className="flex flex-col gap-6">
      <Card className="fade-up flex flex-col gap-3">
        <div className="flex items-center gap-2">
          <span className="grid h-8 w-8 place-items-center rounded-xl bg-accent-soft/50 text-accent">
            <Building2 className="h-4 w-4" />
          </span>
          <CardTitle>Recommended entity</CardTitle>
        </div>
        <p className="text-base font-medium uppercase tracking-wide text-accent">
          {prettyEntity(plan.recommendedEntity.type)}
        </p>
        <p className="text-sm">{plan.recommendedEntity.rationale}</p>
        <ul className="space-y-1.5 text-sm text-foreground/80">
          {plan.recommendedEntity.tradeoffs.map((t) => (
            <li key={t} className="flex gap-2">
              <CircleDot className="mt-0.5 h-3.5 w-3.5 shrink-0 text-foreground/40" />
              <span>{t}</span>
            </li>
          ))}
        </ul>
      </Card>

      <Card className="fade-up flex flex-col gap-3">
        <div className="flex items-center gap-2">
          <span className="grid h-8 w-8 place-items-center rounded-xl bg-accent-soft/50 text-accent">
            <Wallet className="h-4 w-4" />
          </span>
          <CardTitle>Funding plan</CardTitle>
        </div>
        <p className="text-sm">{plan.fundingPlan.summary}</p>
        <div className="grid gap-3 md:grid-cols-2">
          {plan.fundingPlan.schemes.map((s) => (
            <div
              key={s.name}
              className="flex flex-col gap-1.5 rounded-2xl border border-foreground/10 bg-background/60 p-4"
            >
              <div className="flex items-center justify-between">
                <span className="text-sm font-semibold">{s.name}</span>
                <span className="rounded-full border border-foreground/10 bg-background px-2 py-0.5 text-[10px] uppercase tracking-wide text-foreground/60">
                  {s.category.replace("_", " ")}
                </span>
              </div>
              <p className="text-xs text-foreground/70">{s.description}</p>
              <p className="text-xs">
                <span className="text-foreground/60">Eligibility:</span>{" "}
                {s.eligibility}
              </p>
              <div className="flex flex-wrap gap-2 text-[11px] text-foreground/60">
                <span className="rounded-full border border-foreground/10 px-2 py-0.5">
                  {s.approxAmountInr}
                </span>
                <span className="rounded-full border border-foreground/10 px-2 py-0.5">
                  Fit {s.fitScore}/100
                </span>
              </div>
              <p className="text-xs text-foreground/70">
                <Banknote className="mr-1 inline h-3 w-3" />
                {s.applyHint}
              </p>
            </div>
          ))}
        </div>
      </Card>

      <Card className="fade-up flex flex-col gap-3">
        <div className="flex items-center gap-2">
          <span className="grid h-8 w-8 place-items-center rounded-xl bg-accent-soft/50 text-accent">
            <FileText className="h-4 w-4" />
          </span>
          <CardTitle>Compliance checklist</CardTitle>
          <CardDescription className="ml-1">
            (Documents module coming next — will auto-draft these)
          </CardDescription>
        </div>
        <ul className="space-y-2 text-sm">
          {plan.complianceChecklist.map((c) => (
            <li
              key={c.name}
              className="flex flex-col gap-0.5 rounded-2xl border border-foreground/10 bg-background/60 p-3"
            >
              <div className="flex items-center justify-between">
                <span className="font-medium">{c.name}</span>
                <span className="text-xs text-foreground/60">{c.authority}</span>
              </div>
              <span className="text-xs text-foreground/70">{c.why}</span>
              <div className="flex flex-wrap gap-2 text-[11px] text-foreground/60">
                {typeof c.estimatedTimeDays === "number" ? (
                  <span className="rounded-full border border-foreground/10 px-2 py-0.5">
                    ~{c.estimatedTimeDays} days
                  </span>
                ) : null}
                {c.estimatedFeeInr ? (
                  <span className="rounded-full border border-foreground/10 px-2 py-0.5">
                    Fees: {c.estimatedFeeInr}
                  </span>
                ) : null}
              </div>
            </li>
          ))}
        </ul>
      </Card>

      <Card className="fade-up flex flex-col gap-3">
        <div className="flex items-center gap-2">
          <span className="grid h-8 w-8 place-items-center rounded-xl bg-accent-soft/50 text-accent">
            <Megaphone className="h-4 w-4" />
          </span>
          <CardTitle>Marketing starter</CardTitle>
          <CardDescription className="ml-1">
            (Marketing studio module coming next)
          </CardDescription>
        </div>
        <ul className="space-y-1.5 text-sm">
          {plan.marketingStarter.map((m) => (
            <li key={m} className="flex gap-2">
              <CircleDot className="mt-0.5 h-3.5 w-3.5 shrink-0 text-emerald-600 dark:text-emerald-400" />
              <span>{m}</span>
            </li>
          ))}
        </ul>
      </Card>

      <Card className="fade-up flex flex-col gap-3">
        <div className="flex items-center gap-2">
          <span className="grid h-8 w-8 place-items-center rounded-xl bg-accent-soft/50 text-accent">
            <CalendarRange className="h-4 w-4" />
          </span>
          <CardTitle>First 30 days</CardTitle>
        </div>
        <ol className="space-y-2 text-sm">
          {plan.firstThirtyDays.map((step, idx) => (
            <li key={step} className="flex gap-3 rounded-2xl border border-foreground/10 bg-background/60 p-3">
              <span className="grid h-6 w-6 shrink-0 place-items-center rounded-full bg-foreground text-xs font-semibold text-background">
                {idx + 1}
              </span>
              <span>{step}</span>
            </li>
          ))}
        </ol>
      </Card>

      <p className="text-center text-xs text-foreground/50">
        Coming next: Documents · Marketing Studio · Invoicing & Accounts
      </p>
    </div>
  );
}

function prettyEntity(t: WizardPlan["recommendedEntity"]["type"]) {
  switch (t) {
    case "proprietorship":
      return "Proprietorship";
    case "partnership":
      return "Partnership Firm";
    case "llp":
      return "LLP";
    case "pvt_ltd":
      return "Private Limited Company";
    case "opc":
      return "One Person Company (OPC)";
  }
}
