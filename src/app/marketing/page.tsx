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
  Camera,
  Globe,
  Hash,
  Loader2,
  Megaphone,
  MessageCircle,
  Palette,
  PenSquare,
  Sparkles,
  Tag,
  Users,
} from "lucide-react";
import { NavBar } from "@/components/Brand";
import { Button } from "@/components/ui/button";
import { Card, CardDescription, CardTitle } from "@/components/ui/card";
import {
  sessionState,
  useIntake,
  useMarketing,
  usePlan,
} from "@/lib/state";
import type { MarketingKit } from "@/lib/schemas";

export default function MarketingPage() {
  const router = useRouter();
  const intake = useIntake();
  const plan = usePlan();
  const kit = useMarketing();
  const [pending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);
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

  function generate() {
    setError(null);
    if (!intake || !plan) return;
    startTransition(async () => {
      try {
        const res = await fetch("/api/marketing", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ intake, plan }),
        });
        if (!res.ok) {
          let msg = `Could not build kit (${res.status})`;
          try {
            const json = (await res.json()) as { error?: string };
            if (json?.error) msg = json.error;
          } catch {
          }
          throw new Error(msg);
        }
        const next = (await res.json()) as MarketingKit;
        sessionState.setMarketing(next);
        window.scrollTo({ top: 0, behavior: "smooth" });
      } catch (err) {
        setError(err instanceof Error ? err.message : "Something went wrong.");
      }
    });
  }

  async function copy(key: string, text: string) {
    try {
      await navigator.clipboard.writeText(text);
      setCopiedKey(key);
      setTimeout(() => setCopiedKey((k) => (k === key ? null : k)), 1800);
    } catch {
      setError("Couldn't copy to clipboard.");
    }
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
            <Megaphone className="h-3.5 w-3.5 text-accent" /> Marketing studio
          </span>
          <h1 className="text-3xl font-semibold tracking-tight sm:text-4xl">
            Your launch kit, ready in a click.
          </h1>
          <p className="text-foreground/70">
            Names, brand voice, palette, Google Business / WhatsApp / Instagram
            copy, society flyer and a referral program — all tuned to{" "}
            <em className="not-italic font-medium">{intake.idea}</em> in{" "}
            <em className="not-italic font-medium">{intake.city}</em>.
          </p>
        </div>

        {!kit ? (
          <Card className="fade-up flex flex-col gap-3">
            <CardTitle>Generate your launch kit</CardTitle>
            <CardDescription>
              Founder Copilot will produce a coherent brand identity and
              channel-specific copy you can copy-paste straight into Google
              Business Profile, WhatsApp Business, Instagram and JustDial.
            </CardDescription>
            {error ? (
              <div className="rounded-2xl border border-red-500/30 bg-red-500/5 p-3 text-sm text-red-600 dark:text-red-400">
                {error}
              </div>
            ) : null}
            <div>
              <Button onClick={generate} disabled={pending}>
                {pending ? (
                  <>
                    <Loader2 className="h-4 w-4 animate-spin" />
                    Building your kit…
                  </>
                ) : (
                  <>
                    <Sparkles className="h-4 w-4" />
                    Generate marketing kit
                  </>
                )}
              </Button>
            </div>
          </Card>
        ) : (
          <KitView
            kit={kit}
            onRegen={generate}
            regenPending={pending}
            onCopy={copy}
            copiedKey={copiedKey}
          />
        )}

        <Card className="fade-up flex flex-col gap-3 border-dashed">
          <div className="flex items-center gap-2">
            <span className="grid h-8 w-8 place-items-center rounded-xl bg-accent-soft/50 text-accent">
              <Sparkles className="h-4 w-4" />
            </span>
            <CardTitle>Now run the business.</CardTitle>
          </div>
          <CardDescription>
            Pricing, invoices, GST reminders and payment links live in
            Operations.
          </CardDescription>
          <div className="flex flex-wrap gap-2">
            <Button onClick={() => router.push("/ops")}>
              Open Operations
              <ArrowRight className="h-4 w-4" />
            </Button>
            <Button variant="secondary" onClick={() => router.push("/docs")}>
              Compliance docs
            </Button>
          </div>
        </Card>
      </main>
    </>
  );
}

function KitView({
  kit,
  onRegen,
  regenPending,
  onCopy,
  copiedKey,
}: {
  kit: MarketingKit;
  onRegen: () => void;
  regenPending: boolean;
  onCopy: (key: string, text: string) => void;
  copiedKey: string | null;
}) {
  return (
    <>
      <Card className="fade-up flex flex-col gap-4">
        <div className="flex flex-wrap items-center justify-between gap-2">
          <div className="flex items-center gap-2">
            <span className="grid h-8 w-8 place-items-center rounded-xl bg-accent-soft/50 text-accent">
              <Tag className="h-4 w-4" />
            </span>
            <CardTitle>Brand identity</CardTitle>
          </div>
          <Button
            size="sm"
            variant="ghost"
            onClick={onRegen}
            disabled={regenPending}
          >
            {regenPending ? (
              <>
                <Loader2 className="h-3.5 w-3.5 animate-spin" />
                Regenerating
              </>
            ) : (
              <>
                <Sparkles className="h-3.5 w-3.5" />
                Regenerate
              </>
            )}
          </Button>
        </div>
        <div className="grid gap-3 sm:grid-cols-2">
          <Section title="Name suggestions">
            <ul className="space-y-1.5 text-sm">
              {kit.brandIdentity.nameSuggestions.map((n) => (
                <li
                  key={n}
                  className="flex items-center justify-between rounded-xl border border-foreground/10 bg-background/60 px-3 py-2"
                >
                  <span>{n}</span>
                  <CopyChip onCopy={() => onCopy(`name:${n}`, n)} active={copiedKey === `name:${n}`} />
                </li>
              ))}
            </ul>
          </Section>
          <Section title="Tagline & voice">
            <div className="flex flex-col gap-2 text-sm">
              <p className="rounded-xl border border-foreground/10 bg-background/60 p-3 text-base font-medium">
                {kit.brandIdentity.tagline}
              </p>
              <p className="text-foreground/80">
                {kit.brandIdentity.valueProp}
              </p>
              <p className="text-xs text-foreground/60">
                Voice: {kit.brandIdentity.voice}
              </p>
            </div>
          </Section>
        </div>
        <Section title="Palette" icon={<Palette className="h-3.5 w-3.5" />}>
          <div className="grid gap-2 sm:grid-cols-3">
            {kit.brandIdentity.palette.map((c) => (
              <div
                key={c.hex}
                className="flex items-center gap-3 rounded-xl border border-foreground/10 bg-background/60 px-3 py-2"
              >
                <span
                  className="h-8 w-8 rounded-lg border border-foreground/10"
                  style={{ background: c.hex }}
                />
                <div className="flex flex-col">
                  <span className="text-sm font-medium">{c.name}</span>
                  <span className="text-xs text-foreground/60">{c.hex}</span>
                </div>
              </div>
            ))}
          </div>
        </Section>
      </Card>

      <Card className="fade-up flex flex-col gap-4">
        <div className="flex items-center gap-2">
          <span className="grid h-8 w-8 place-items-center rounded-xl bg-accent-soft/50 text-accent">
            <Globe className="h-4 w-4" />
          </span>
          <CardTitle>Google Business Profile</CardTitle>
        </div>
        <ChannelBlock
          label="Business name"
          text={kit.channels.googleBusinessProfile.name}
          ckey="gbp:name"
          onCopy={onCopy}
          copiedKey={copiedKey}
        />
        <ChannelBlock
          label="Description"
          text={kit.channels.googleBusinessProfile.description}
          ckey="gbp:desc"
          onCopy={onCopy}
          copiedKey={copiedKey}
          multiline
        />
        <div className="flex flex-wrap gap-1.5 text-[11px] text-foreground/60">
          {kit.channels.googleBusinessProfile.categories.map((c) => (
            <span
              key={c}
              className="rounded-full border border-foreground/10 bg-background/60 px-2 py-0.5"
            >
              {c}
            </span>
          ))}
        </div>
      </Card>

      <Card className="fade-up flex flex-col gap-3">
        <div className="flex items-center gap-2">
          <span className="grid h-8 w-8 place-items-center rounded-xl bg-accent-soft/50 text-accent">
            <MessageCircle className="h-4 w-4" />
          </span>
          <CardTitle>WhatsApp Business</CardTitle>
        </div>
        <ChannelBlock
          label="Short bio"
          text={kit.channels.whatsappBusiness.shortBio}
          ckey="wa:bio"
          onCopy={onCopy}
          copiedKey={copiedKey}
        />
        <ChannelBlock
          label="Welcome message"
          text={kit.channels.whatsappBusiness.welcomeMessage}
          ckey="wa:welcome"
          onCopy={onCopy}
          copiedKey={copiedKey}
          multiline
        />
        <ChannelBlock
          label="Away message"
          text={kit.channels.whatsappBusiness.awayMessage}
          ckey="wa:away"
          onCopy={onCopy}
          copiedKey={copiedKey}
          multiline
        />
        <ChannelBlock
          label="Broadcast template"
          text={kit.channels.whatsappBusiness.broadcastTemplate}
          ckey="wa:broadcast"
          onCopy={onCopy}
          copiedKey={copiedKey}
          multiline
        />
      </Card>

      <Card className="fade-up flex flex-col gap-3">
        <div className="flex items-center gap-2">
          <span className="grid h-8 w-8 place-items-center rounded-xl bg-accent-soft/50 text-accent">
            <Camera className="h-4 w-4" />
          </span>
          <CardTitle>Instagram</CardTitle>
        </div>
        <ChannelBlock
          label="Bio"
          text={kit.channels.instagram.bio}
          ckey="ig:bio"
          onCopy={onCopy}
          copiedKey={copiedKey}
        />
        <div className="flex flex-col gap-3">
          {kit.channels.instagram.firstPosts.map((p, idx) => {
            const captionKey = `ig:caption:${idx}`;
            const tagKey = `ig:tags:${idx}`;
            const hashtagText = p.hashtags.map((h) => `#${h.replace(/^#/, "")}`).join(" ");
            return (
              <div
                key={idx}
                className="flex flex-col gap-2 rounded-2xl border border-foreground/10 bg-background/60 p-3"
              >
                <div className="flex items-center justify-between">
                  <span className="text-xs font-medium uppercase tracking-wide text-foreground/60">
                    Post {idx + 1}
                  </span>
                  <CopyChip
                    onCopy={() =>
                      onCopy(`ig:full:${idx}`, `${p.caption}\n\n${hashtagText}`)
                    }
                    active={copiedKey === `ig:full:${idx}`}
                    label="Copy post"
                  />
                </div>
                <pre className="whitespace-pre-wrap text-sm">{p.caption}</pre>
                <div className="flex flex-wrap items-center gap-1.5 text-[11px] text-foreground/60">
                  <Hash className="h-3 w-3" />
                  {p.hashtags.map((h) => (
                    <span
                      key={h}
                      className="rounded-full border border-foreground/10 px-2 py-0.5"
                    >
                      #{h.replace(/^#/, "")}
                    </span>
                  ))}
                </div>
                <CopyChip
                  onCopy={() => onCopy(captionKey, p.caption)}
                  active={copiedKey === captionKey}
                  label="Copy caption"
                />
                <CopyChip
                  onCopy={() => onCopy(tagKey, hashtagText)}
                  active={copiedKey === tagKey}
                  label="Copy hashtags"
                />
              </div>
            );
          })}
        </div>
      </Card>

      <Card className="fade-up flex flex-col gap-3">
        <div className="flex items-center gap-2">
          <span className="grid h-8 w-8 place-items-center rounded-xl bg-accent-soft/50 text-accent">
            <PenSquare className="h-4 w-4" />
          </span>
          <CardTitle>JustDial listing</CardTitle>
        </div>
        <ChannelBlock
          label="Description"
          text={kit.channels.justdial}
          ckey="jd:desc"
          onCopy={onCopy}
          copiedKey={copiedKey}
          multiline
        />
      </Card>

      <Card className="fade-up flex flex-col gap-3">
        <div className="flex items-center gap-2">
          <span className="grid h-8 w-8 place-items-center rounded-xl bg-accent-soft/50 text-accent">
            <PenSquare className="h-4 w-4" />
          </span>
          <CardTitle>Society notice flyer</CardTitle>
          <CardDescription className="ml-1">
            Markdown — copy + print or paste into Canva
          </CardDescription>
        </div>
        <ChannelBlock
          label="Flyer"
          text={kit.channels.societyNoticeFlyerMarkdown}
          ckey="flyer"
          onCopy={onCopy}
          copiedKey={copiedKey}
          multiline
        />
      </Card>

      <Card className="fade-up flex flex-col gap-3">
        <div className="flex items-center gap-2">
          <span className="grid h-8 w-8 place-items-center rounded-xl bg-accent-soft/50 text-accent">
            <Users className="h-4 w-4" />
          </span>
          <CardTitle>Referral program</CardTitle>
        </div>
        <p className="text-sm">{kit.referralProgram.pitch}</p>
        <p className="rounded-2xl border border-foreground/10 bg-background/60 px-3 py-2 text-sm">
          <span className="text-foreground/60">Reward:</span>{" "}
          {kit.referralProgram.rewardStructure}
        </p>
        <ChannelBlock
          label="Sample WhatsApp message"
          text={kit.referralProgram.sampleMessage}
          ckey="ref:msg"
          onCopy={onCopy}
          copiedKey={copiedKey}
          multiline
        />
      </Card>

      <Card className="fade-up flex flex-col gap-3">
        <div className="flex items-center gap-2">
          <span className="grid h-8 w-8 place-items-center rounded-xl bg-accent-soft/50 text-accent">
            <Sparkles className="h-4 w-4" />
          </span>
          <CardTitle>Launch offers</CardTitle>
        </div>
        <ul className="space-y-1.5 text-sm">
          {kit.launchOffers.map((o) => (
            <li key={o} className="flex gap-2">
              <CircleDot className="mt-0.5 h-3.5 w-3.5 shrink-0 text-emerald-600 dark:text-emerald-400" />
              <span>{o}</span>
            </li>
          ))}
        </ul>
      </Card>
    </>
  );
}

function Section({
  title,
  icon,
  children,
}: {
  title: string;
  icon?: React.ReactNode;
  children: React.ReactNode;
}) {
  return (
    <div className="flex flex-col gap-2">
      <p className="flex items-center gap-1.5 text-xs uppercase tracking-wide text-foreground/60">
        {icon}
        {title}
      </p>
      {children}
    </div>
  );
}

function ChannelBlock({
  label,
  text,
  ckey,
  onCopy,
  copiedKey,
  multiline = false,
}: {
  label: string;
  text: string;
  ckey: string;
  onCopy: (key: string, text: string) => void;
  copiedKey: string | null;
  multiline?: boolean;
}) {
  return (
    <div className="flex flex-col gap-1.5">
      <div className="flex items-center justify-between">
        <p className="text-xs uppercase tracking-wide text-foreground/60">
          {label}
        </p>
        <CopyChip onCopy={() => onCopy(ckey, text)} active={copiedKey === ckey} />
      </div>
      {multiline ? (
        <pre className="whitespace-pre-wrap rounded-2xl border border-foreground/10 bg-background/60 p-3 text-sm">
          {text}
        </pre>
      ) : (
        <p className="rounded-2xl border border-foreground/10 bg-background/60 px-3 py-2 text-sm">
          {text}
        </p>
      )}
    </div>
  );
}

function CopyChip({
  onCopy,
  active,
  label = "Copy",
}: {
  onCopy: () => void;
  active: boolean;
  label?: string;
}) {
  return (
    <button
      type="button"
      onClick={onCopy}
      className="inline-flex items-center gap-1 rounded-full border border-foreground/10 bg-background/60 px-2 py-0.5 text-[11px] text-foreground/70 hover:bg-foreground/5"
    >
      {active ? (
        <>
          <ClipboardCheck className="h-3 w-3" />
          Copied
        </>
      ) : (
        <>
          <Clipboard className="h-3 w-3" />
          {label}
        </>
      )}
    </button>
  );
}
