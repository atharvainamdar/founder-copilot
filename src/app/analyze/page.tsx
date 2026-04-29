"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import {
  ArrowLeft,
  ArrowRight,
  Building2,
  CircleDot,
  Compass,
  Lightbulb,
  Loader2,
  ShieldAlert,
  ThumbsDown,
  ThumbsUp,
  Users,
} from "lucide-react";
import { NavBar } from "@/components/Brand";
import { Button } from "@/components/ui/button";
import { Card, CardDescription, CardTitle } from "@/components/ui/card";
import { sessionState, useFeasibility, useIntake } from "@/lib/state";
import type { Intake } from "@/lib/schemas";

const VERDICT_META = {
  good: {
    label: "Looks good — go for it",
    color: "text-emerald-600 dark:text-emerald-400",
    badge:
      "bg-emerald-500/10 border-emerald-500/20 text-emerald-700 dark:text-emerald-300",
    icon: ThumbsUp,
  },
  pivot: {
    label: "Worth doing — but pivot first",
    color: "text-amber-600 dark:text-amber-400",
    badge:
      "bg-amber-500/10 border-amber-500/20 text-amber-700 dark:text-amber-300",
    icon: Compass,
  },
  bad: {
    label: "Tough idea — strong pivots below",
    color: "text-red-600 dark:text-red-400",
    badge: "bg-red-500/10 border-red-500/20 text-red-700 dark:text-red-300",
    icon: ThumbsDown,
  },
} as const;

export default function AnalyzePage() {
  const router = useRouter();
  const intake = useIntake();
  const feas = useFeasibility();
  const [chosenPivot, setChosenPivot] = useState<{
    title: string;
    why: string;
  } | null>(null);

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
            <Loader2 className="h-4 w-4 animate-spin" /> Loading your analysis…
          </div>
        </main>
      </>
    );
  }

  const meta = VERDICT_META[feas.verdict];
  const VerdictIcon = meta.icon;

  function approveAndContinue() {
    if (!intake) return;
    if (chosenPivot && feas) {
      const merged = `${chosenPivot.title} — ${chosenPivot.why}`;
      const next: Intake = { ...intake, idea: merged };
      sessionState.setIntake(next);
    }
    router.push("/wizard");
  }

  return (
    <>
      <NavBar />
      <main className="mx-auto flex w-full max-w-4xl flex-1 flex-col gap-8 px-6 py-10">
        <Link
          href="/"
          className="inline-flex w-fit items-center gap-1 text-sm text-foreground/60 hover:text-foreground"
        >
          <ArrowLeft className="h-3.5 w-3.5" />
          Edit idea
        </Link>

        <Card className="fade-up flex flex-col gap-4">
          <div className="flex flex-wrap items-center gap-3">
            <span
              className={`inline-flex items-center gap-2 rounded-full border px-3 py-1 text-xs font-medium ${meta.badge}`}
            >
              <VerdictIcon className="h-3.5 w-3.5" />
              {meta.label}
            </span>
            <span className="text-xs text-foreground/60">
              Confidence score:{" "}
              <span className={`font-semibold ${meta.color}`}>
                {feas.score}/100
              </span>
            </span>
          </div>
          <CardTitle className="text-2xl sm:text-3xl">{feas.headline}</CardTitle>
          <CardDescription>
            For <strong>{intake.name}</strong> — {intake.idea} · {intake.address},{" "}
            {intake.city}
            {intake.pincode ? ` (${intake.pincode})` : ""}
          </CardDescription>
        </Card>

        <Section
          icon={Lightbulb}
          title="Microscopic analysis"
          subtitle="What we see in your locality"
        >
          <ul className="space-y-2 text-sm">
            {feas.reasoning.map((r) => (
              <li key={r} className="flex gap-2">
                <CircleDot className="mt-0.5 h-3.5 w-3.5 shrink-0 text-accent" />
                <span>{r}</span>
              </li>
            ))}
          </ul>
        </Section>

        <div className="grid gap-6 md:grid-cols-2">
          <Section
            icon={Users}
            title="Likely competition"
            subtitle="Plausible nearby competitors / substitutes"
          >
            {feas.competitorLandscape.length === 0 ? (
              <p className="text-sm text-foreground/60">
                No clear competition — could be a green-field opportunity.
              </p>
            ) : (
              <ul className="space-y-3 text-sm">
                {feas.competitorLandscape.map((c) => (
                  <li key={c.name} className="flex flex-col gap-1">
                    <div className="flex items-center justify-between">
                      <span className="font-medium">{c.name}</span>
                      {typeof c.approxDistanceKm === "number" ? (
                        <span className="text-xs text-foreground/60">
                          ~{c.approxDistanceKm.toFixed(1)} km
                        </span>
                      ) : null}
                    </div>
                    <span className="text-xs text-foreground/60">{c.type}</span>
                    {c.notes ? (
                      <span className="text-xs text-foreground/70">{c.notes}</span>
                    ) : null}
                  </li>
                ))}
              </ul>
            )}
          </Section>

          <Section
            icon={Building2}
            title="Demand signals"
            subtitle="Why locals would (or wouldn't) buy this"
          >
            <ul className="space-y-2 text-sm">
              {feas.demandSignals.map((d) => (
                <li key={d} className="flex gap-2">
                  <CircleDot className="mt-0.5 h-3.5 w-3.5 shrink-0 text-emerald-600 dark:text-emerald-400" />
                  <span>{d}</span>
                </li>
              ))}
            </ul>
          </Section>
        </div>

        <Section
          icon={ShieldAlert}
          title="Risks worth knowing"
          subtitle="What could trip you up"
        >
          <ul className="space-y-2 text-sm">
            {feas.risks.map((r) => (
              <li key={r} className="flex gap-2">
                <CircleDot className="mt-0.5 h-3.5 w-3.5 shrink-0 text-amber-600 dark:text-amber-400" />
                <span>{r}</span>
              </li>
            ))}
          </ul>
        </Section>

        <Section
          icon={Compass}
          title="Smart pivots"
          subtitle="Click a pivot to use that as your idea instead"
        >
          <div className="grid gap-3 md:grid-cols-2">
            {feas.pivots.map((p) => {
              const active = chosenPivot?.title === p.title;
              return (
                <button
                  key={p.title}
                  type="button"
                  onClick={() =>
                    setChosenPivot(active ? null : { title: p.title, why: p.why })
                  }
                  className={`flex flex-col items-start gap-2 rounded-2xl border p-4 text-left transition-colors ${
                    active
                      ? "border-accent bg-accent-soft/30"
                      : "border-foreground/10 bg-background/60 hover:bg-foreground/5"
                  }`}
                >
                  <span className="text-sm font-semibold">{p.title}</span>
                  <span className="text-xs text-foreground/70">{p.why}</span>
                  <div className="flex flex-wrap gap-2 text-[11px] text-foreground/60">
                    <span className="rounded-full border border-foreground/10 px-2 py-0.5">
                      Demand: {p.expectedDemand}
                    </span>
                    {typeof p.estimatedSetupCostInr === "number" ? (
                      <span className="rounded-full border border-foreground/10 px-2 py-0.5">
                        Setup: ₹{formatInr(p.estimatedSetupCostInr)}
                      </span>
                    ) : null}
                  </div>
                </button>
              );
            })}
          </div>
        </Section>

        <Section
          icon={Lightbulb}
          title="Questions we'd ask next"
          subtitle="To sharpen the plan further"
        >
          <ul className="space-y-2 text-sm">
            {feas.nextQuestions.map((q) => (
              <li key={q} className="flex gap-2">
                <CircleDot className="mt-0.5 h-3.5 w-3.5 shrink-0 text-foreground/40" />
                <span>{q}</span>
              </li>
            ))}
          </ul>
        </Section>

        <div className="sticky bottom-4 mt-4 flex flex-col items-stretch gap-3 rounded-3xl border border-foreground/10 bg-background/90 p-4 shadow-lg backdrop-blur sm:flex-row sm:items-center sm:justify-between">
          <div className="flex flex-col">
            <span className="text-sm font-medium">
              {chosenPivot
                ? `Continue with pivot: "${chosenPivot.title}"`
                : `Continue with original idea`}
            </span>
            <span className="text-xs text-foreground/60">
              Next: budget, funding, entity type and matching govt schemes.
            </span>
          </div>
          <div className="flex items-center gap-2">
            <Button variant="secondary" onClick={() => router.push("/")}>
              Refine idea
            </Button>
            <Button onClick={approveAndContinue}>
              Build setup plan
              <ArrowRight className="h-4 w-4" />
            </Button>
          </div>
        </div>
      </main>
    </>
  );
}

function Section({
  icon: Icon,
  title,
  subtitle,
  children,
}: {
  icon: React.ComponentType<{ className?: string }>;
  title: string;
  subtitle?: string;
  children: React.ReactNode;
}) {
  return (
    <Card className="fade-up flex flex-col gap-3">
      <div className="flex items-center gap-2">
        <span className="grid h-8 w-8 place-items-center rounded-xl bg-accent-soft/50 text-accent">
          <Icon className="h-4 w-4" />
        </span>
        <div className="flex flex-col">
          <CardTitle className="text-base">{title}</CardTitle>
          {subtitle ? <CardDescription>{subtitle}</CardDescription> : null}
        </div>
      </div>
      {children}
    </Card>
  );
}

function formatInr(n: number): string {
  if (n >= 10000000) return `${(n / 10000000).toFixed(1)} Cr`;
  if (n >= 100000) return `${(n / 100000).toFixed(1)} L`;
  if (n >= 1000) return `${(n / 1000).toFixed(0)}k`;
  return `${n}`;
}
