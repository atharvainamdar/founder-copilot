"use client";

import { useEffect, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import {
  ArrowLeft,
  ArrowRight,
  CircleDot,
  Clipboard,
  ClipboardCheck,
  ExternalLink,
  FileText,
  Loader2,
  Printer,
  ShieldCheck,
  Sparkles,
} from "lucide-react";
import { NavBar } from "@/components/Brand";
import { Button } from "@/components/ui/button";
import { Card, CardDescription, CardTitle } from "@/components/ui/card";
import {
  sessionState,
  useDocs,
  useIntake,
  usePlan,
} from "@/lib/state";
import type { DraftDoc } from "@/lib/schemas";

export default function DocsPage() {
  const router = useRouter();
  const intake = useIntake();
  const plan = usePlan();
  const docs = useDocs();
  const [activeName, setActiveName] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();
  const [copiedKey, setCopiedKey] = useState<string | null>(null);

  useEffect(() => {
    if (intake === null || plan === null) {
      router.replace("/");
    }
  }, [intake, plan, router]);

  if (!intake || !plan) {
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

  function open(itemName: string) {
    setError(null);
    setActiveName(itemName);
    if (docs[itemName]) return;
    if (!intake || !plan) return;
    startTransition(async () => {
      try {
        const res = await fetch("/api/draft-doc", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ intake, plan, itemName }),
        });
        if (!res.ok) {
          let msg = `Could not generate guide (${res.status})`;
          try {
            const json = (await res.json()) as { error?: string };
            if (json?.error) msg = json.error;
          } catch {
          }
          throw new Error(msg);
        }
        const next = (await res.json()) as DraftDoc;
        sessionState.setDoc(itemName, next);
      } catch (err) {
        setError(err instanceof Error ? err.message : "Something went wrong.");
      }
    });
  }

  const active = activeName ? docs[activeName] : undefined;

  async function copy(key: string, text: string) {
    try {
      await navigator.clipboard.writeText(text);
      setCopiedKey(key);
      setTimeout(() => setCopiedKey((k) => (k === key ? null : k)), 1800);
    } catch {
      setError("Couldn't copy to clipboard.");
    }
  }

  function printDraft() {
    if (typeof window === "undefined") return;
    window.print();
  }

  return (
    <>
      <NavBar />
      <main className="mx-auto flex w-full max-w-5xl flex-1 flex-col gap-8 px-6 py-10">
        <Link
          href="/wizard"
          className="inline-flex w-fit items-center gap-1 text-sm text-foreground/60 hover:text-foreground"
        >
          <ArrowLeft className="h-3.5 w-3.5" />
          Back to setup plan
        </Link>

        <div className="fade-up flex flex-col gap-2">
          <span className="inline-flex items-center gap-2 self-start rounded-full border border-foreground/10 bg-background/60 px-3 py-1 text-xs text-foreground/70">
            <ShieldCheck className="h-3.5 w-3.5 text-accent" /> Compliance studio
          </span>
          <h1 className="text-3xl font-semibold tracking-tight sm:text-4xl">
            Let&apos;s get {intake.name.split(" ")[0]} legally ready.
          </h1>
          <p className="text-foreground/70">
            Pick any item from your checklist — Founder Copilot will produce a
            personalized step-by-step guide and, where relevant, a ready-to-edit
            draft document for{" "}
            <em className="not-italic font-medium">{intake.idea}</em>.
          </p>
        </div>

        <div className="grid gap-6 lg:grid-cols-[280px_1fr]">
          <aside className="fade-up flex flex-col gap-2">
            <p className="px-2 text-xs uppercase tracking-wide text-foreground/50">
              Your checklist
            </p>
            {plan.complianceChecklist.map((c) => {
              const isActive = activeName === c.name;
              const isReady = Boolean(docs[c.name]);
              return (
                <button
                  key={c.name}
                  type="button"
                  onClick={() => open(c.name)}
                  className={`flex flex-col gap-1 rounded-2xl border p-3 text-left transition ${
                    isActive
                      ? "border-foreground bg-foreground/5"
                      : "border-foreground/10 bg-background/60 hover:bg-foreground/5"
                  }`}
                >
                  <div className="flex items-center justify-between gap-2">
                    <span className="text-sm font-medium">{c.name}</span>
                    {isReady ? (
                      <ClipboardCheck className="h-4 w-4 text-emerald-600 dark:text-emerald-400" />
                    ) : (
                      <FileText className="h-4 w-4 text-foreground/40" />
                    )}
                  </div>
                  <span className="text-xs text-foreground/60">
                    {c.authority}
                  </span>
                </button>
              );
            })}
          </aside>

          <section className="flex flex-col gap-4">
            {!activeName ? (
              <Card className="fade-up flex flex-col items-start gap-3">
                <span className="grid h-10 w-10 place-items-center rounded-xl bg-accent-soft/50 text-accent">
                  <Sparkles className="h-5 w-5" />
                </span>
                <CardTitle>Pick an item to start.</CardTitle>
                <CardDescription>
                  Each guide is grounded in your locality, recommended entity (
                  {plan.recommendedEntity.type.replace("_", " ")}), and the
                  business you described. Drafts use realistic example values
                  you can edit.
                </CardDescription>
              </Card>
            ) : pending && !active ? (
              <Card className="fade-up flex items-center gap-3 text-foreground/70">
                <Loader2 className="h-4 w-4 animate-spin" />
                Building a personalized guide for{" "}
                <strong className="font-medium">{activeName}</strong>…
              </Card>
            ) : error && !active ? (
              <Card className="border-red-500/30 bg-red-500/5 text-sm text-red-600 dark:text-red-400">
                {error}
              </Card>
            ) : active ? (
              <DraftDocView
                doc={active}
                onCopy={copy}
                onPrint={printDraft}
                copiedKey={copiedKey}
              />
            ) : null}
          </section>
        </div>

        <Card className="fade-up flex flex-col gap-3 border-dashed">
          <div className="flex items-center gap-2">
            <span className="grid h-8 w-8 place-items-center rounded-xl bg-accent-soft/50 text-accent">
              <Sparkles className="h-4 w-4" />
            </span>
            <CardTitle>Ready to start telling people?</CardTitle>
          </div>
          <CardDescription>
            Once you&apos;re comfortable with compliance, jump into the
            Marketing Studio for your launch kit — names, brand voice, social
            posts, society flyer and a referral program.
          </CardDescription>
          <div className="flex flex-wrap gap-2">
            <Button onClick={() => router.push("/marketing")}>
              Go to Marketing Studio
              <ArrowRight className="h-4 w-4" />
            </Button>
            <Button variant="secondary" onClick={() => router.push("/ops")}>
              Open Operations
            </Button>
          </div>
        </Card>
      </main>
    </>
  );
}

function DraftDocView({
  doc,
  onCopy,
  onPrint,
  copiedKey,
}: {
  doc: DraftDoc;
  onCopy: (key: string, text: string) => void;
  onPrint: () => void;
  copiedKey: string | null;
}) {
  const draftKey = `draft:${doc.title}`;
  return (
    <>
      <Card className="fade-up flex flex-col gap-3">
        <div className="flex flex-wrap items-center justify-between gap-2">
          <div>
            <CardTitle>{doc.title}</CardTitle>
            <CardDescription>{doc.authority}</CardDescription>
          </div>
          <div className="flex flex-wrap gap-2">
            {doc.portalUrl ? (
              <a
                href={doc.portalUrl}
                target="_blank"
                rel="noreferrer noopener"
              >
                <Button variant="secondary" size="sm">
                  Open portal
                  <ExternalLink className="h-3.5 w-3.5" />
                </Button>
              </a>
            ) : null}
            {doc.draftDocumentMarkdown ? (
              <Button variant="secondary" size="sm" onClick={onPrint}>
                Print
                <Printer className="h-3.5 w-3.5" />
              </Button>
            ) : null}
          </div>
        </div>
        <p className="text-sm text-foreground/80">{doc.summary}</p>
        <div className="flex flex-wrap gap-2 text-[11px] text-foreground/60">
          {typeof doc.estimatedTimeDays === "number" ? (
            <span className="rounded-full border border-foreground/10 px-2 py-0.5">
              ~{doc.estimatedTimeDays} days
            </span>
          ) : null}
          {doc.estimatedFeeInr ? (
            <span className="rounded-full border border-foreground/10 px-2 py-0.5">
              Fees: {doc.estimatedFeeInr}
            </span>
          ) : null}
        </div>
      </Card>

      {doc.prerequisites.length > 0 ? (
        <Card className="fade-up flex flex-col gap-2">
          <CardTitle>Before you start</CardTitle>
          <ul className="space-y-1.5 text-sm">
            {doc.prerequisites.map((p) => (
              <li key={p} className="flex gap-2">
                <CircleDot className="mt-0.5 h-3.5 w-3.5 shrink-0 text-foreground/40" />
                <span>{p}</span>
              </li>
            ))}
          </ul>
        </Card>
      ) : null}

      <Card className="fade-up flex flex-col gap-3">
        <CardTitle>Step-by-step</CardTitle>
        <ol className="space-y-2 text-sm">
          {doc.steps.map((s, idx) => (
            <li
              key={s.title}
              className="flex gap-3 rounded-2xl border border-foreground/10 bg-background/60 p-3"
            >
              <span className="grid h-6 w-6 shrink-0 place-items-center rounded-full bg-foreground text-xs font-semibold text-background">
                {idx + 1}
              </span>
              <div className="flex flex-col gap-1">
                <span className="font-medium">{s.title}</span>
                <span className="text-foreground/70">{s.detail}</span>
              </div>
            </li>
          ))}
        </ol>
      </Card>

      {doc.fieldsToFill && doc.fieldsToFill.length > 0 ? (
        <Card className="fade-up flex flex-col gap-3">
          <CardTitle>Fields you&apos;ll fill</CardTitle>
          <CardDescription>
            Suggested values you can adapt. Fields marked required must match
            your KYC documents.
          </CardDescription>
          <div className="grid gap-2 sm:grid-cols-2">
            {doc.fieldsToFill.map((f) => (
              <div
                key={f.label}
                className="flex flex-col gap-0.5 rounded-2xl border border-foreground/10 bg-background/60 p-3"
              >
                <div className="flex items-center justify-between">
                  <span className="text-xs font-medium uppercase tracking-wide text-foreground/60">
                    {f.label}
                  </span>
                  {f.required ? (
                    <span className="rounded-full bg-foreground/10 px-2 py-0.5 text-[10px] uppercase tracking-wide">
                      Required
                    </span>
                  ) : null}
                </div>
                <span className="text-sm">{f.example}</span>
              </div>
            ))}
          </div>
        </Card>
      ) : null}

      {doc.draftDocumentMarkdown ? (
        <Card className="fade-up flex flex-col gap-3">
          <div className="flex items-center justify-between">
            <CardTitle>Draft document</CardTitle>
            <Button
              size="sm"
              variant="secondary"
              onClick={() =>
                onCopy(draftKey, doc.draftDocumentMarkdown ?? "")
              }
            >
              {copiedKey === draftKey ? (
                <>
                  Copied
                  <ClipboardCheck className="h-3.5 w-3.5" />
                </>
              ) : (
                <>
                  Copy
                  <Clipboard className="h-3.5 w-3.5" />
                </>
              )}
            </Button>
          </div>
          <pre className="whitespace-pre-wrap rounded-2xl border border-foreground/10 bg-background/60 p-4 text-xs leading-relaxed">
            {doc.draftDocumentMarkdown}
          </pre>
        </Card>
      ) : null}

      {doc.caveats && doc.caveats.length > 0 ? (
        <Card className="fade-up border-amber-500/30 bg-amber-500/5">
          <CardTitle className="text-sm">Heads up</CardTitle>
          <ul className="mt-2 space-y-1 text-xs text-foreground/80">
            {doc.caveats.map((c) => (
              <li key={c} className="flex gap-2">
                <CircleDot className="mt-0.5 h-3 w-3 shrink-0 text-amber-600" />
                <span>{c}</span>
              </li>
            ))}
          </ul>
        </Card>
      ) : null}
    </>
  );
}
