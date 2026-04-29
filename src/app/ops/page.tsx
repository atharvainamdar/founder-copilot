"use client";

import {
  useEffect,
  useMemo,
  useRef,
  useState,
  useTransition,
} from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import {
  ArrowLeft,
  CalendarRange,
  Calculator,
  CircleDot,
  CreditCard,
  ExternalLink,
  FileText,
  Loader2,
  Plus,
  Printer,
  Receipt,
  Sparkles,
  Trash2,
  Wallet,
} from "lucide-react";
import { NavBar } from "@/components/Brand";
import { Button } from "@/components/ui/button";
import { Card, CardDescription, CardTitle } from "@/components/ui/card";
import { Input, Label } from "@/components/ui/input";
import {
  sessionState,
  useIntake,
  usePlan,
  usePricing,
} from "@/lib/state";
import type { PricingPlan } from "@/lib/schemas";
import {
  computeInvoice,
  inr,
  type Invoice,
  type InvoiceLine,
} from "@/lib/invoice";

const STATES = [
  "Andhra Pradesh",
  "Assam",
  "Bihar",
  "Chhattisgarh",
  "Delhi",
  "Goa",
  "Gujarat",
  "Haryana",
  "Himachal Pradesh",
  "Jharkhand",
  "Karnataka",
  "Kerala",
  "Madhya Pradesh",
  "Maharashtra",
  "Odisha",
  "Punjab",
  "Rajasthan",
  "Tamil Nadu",
  "Telangana",
  "Uttar Pradesh",
  "Uttarakhand",
  "West Bengal",
];

export default function OpsPage() {
  const router = useRouter();
  const intake = useIntake();
  const plan = usePlan();
  const pricing = usePricing();
  const [pricingPending, startPricing] = useTransition();
  const [pricingError, setPricingError] = useState<string | null>(null);

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

  function generatePricing() {
    setPricingError(null);
    if (!intake || !plan) return;
    startPricing(async () => {
      try {
        const res = await fetch("/api/pricing", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ intake, plan }),
        });
        if (!res.ok) {
          let msg = `Pricing failed (${res.status})`;
          try {
            const json = (await res.json()) as { error?: string };
            if (json?.error) msg = json.error;
          } catch {
          }
          throw new Error(msg);
        }
        const next = (await res.json()) as PricingPlan;
        sessionState.setPricing(next);
      } catch (err) {
        setPricingError(
          err instanceof Error ? err.message : "Something went wrong.",
        );
      }
    });
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
            <Wallet className="h-3.5 w-3.5 text-accent" /> Operations
          </span>
          <h1 className="text-3xl font-semibold tracking-tight sm:text-4xl">
            Run the business, not the paperwork.
          </h1>
          <p className="text-foreground/70">
            Pricing recommendations, a break-even calculator, India-format GST
            invoices, payment-link onboarding and filing reminders — all in one
            place.
          </p>
        </div>

        <PricingSection
          pricing={pricing}
          pending={pricingPending}
          error={pricingError}
          onGenerate={generatePricing}
        />

        <PricingCalculator pricing={pricing} />

        <InvoiceBuilder
          businessName={intake.name}
          businessAddress={`${intake.address}, ${intake.city}${
            intake.pincode ? ` - ${intake.pincode}` : ""
          }`}
          unitName={pricing?.unitName ?? "session"}
          defaultPrice={pricing?.pricePerUnitInr ?? 0}
        />

        <PaymentsSection />

        <FilingReminders />

        <Card className="fade-up flex flex-col gap-3 border-dashed">
          <div className="flex items-center gap-2">
            <span className="grid h-8 w-8 place-items-center rounded-xl bg-accent-soft/50 text-accent">
              <Sparkles className="h-4 w-4" />
            </span>
            <CardTitle>Founder Copilot, end to end.</CardTitle>
          </div>
          <CardDescription>
            You now have a validated idea, a setup plan, compliance guides, a
            launch kit and operations. Everything from here is execution — and
            we&apos;ll keep building. (Bookkeeping, automated GST filing,
            employee onboarding and CRM are next on the roadmap.)
          </CardDescription>
        </Card>
      </main>
    </>
  );
}

function PricingSection({
  pricing,
  pending,
  error,
  onGenerate,
}: {
  pricing: PricingPlan | null | undefined;
  pending: boolean;
  error: string | null;
  onGenerate: () => void;
}) {
  return (
    <Card className="fade-up flex flex-col gap-4">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <div className="flex items-center gap-2">
          <span className="grid h-8 w-8 place-items-center rounded-xl bg-accent-soft/50 text-accent">
            <Calculator className="h-4 w-4" />
          </span>
          <CardTitle>AI pricing recommendation</CardTitle>
        </div>
        <Button size="sm" variant="ghost" onClick={onGenerate} disabled={pending}>
          {pending ? (
            <>
              <Loader2 className="h-3.5 w-3.5 animate-spin" />
              Working
            </>
          ) : (
            <>
              <Sparkles className="h-3.5 w-3.5" />
              {pricing ? "Regenerate" : "Generate"}
            </>
          )}
        </Button>
      </div>
      {error ? (
        <div className="rounded-2xl border border-red-500/30 bg-red-500/5 p-3 text-sm text-red-600 dark:text-red-400">
          {error}
        </div>
      ) : null}
      {!pricing ? (
        <CardDescription>
          Get a locality-tuned price per {`{`}unit{`}`}, fixed/variable cost
          estimates, three-tier packages and break-even maths in one click.
        </CardDescription>
      ) : (
        <div className="grid gap-4">
          <div className="grid gap-3 sm:grid-cols-3">
            <Stat
              label={`Price per ${pricing.unitName}`}
              value={inr(pricing.pricePerUnitInr)}
            />
            <Stat
              label="Break-even / month"
              value={`${Math.ceil(pricing.breakEvenUnitsPerMonth)} ${pricing.unitName}s`}
            />
            <Stat
              label="Fixed costs / month"
              value={inr(pricing.fixedCostsPerMonthInr)}
            />
          </div>
          <p className="text-sm text-foreground/80">
            {pricing.pricingRationale}
          </p>
          <div className="grid gap-3 md:grid-cols-3">
            {pricing.threeTierPackages.map((t) => (
              <div
                key={t.name}
                className="flex flex-col gap-2 rounded-2xl border border-foreground/10 bg-background/60 p-4"
              >
                <div className="flex items-baseline justify-between">
                  <span className="text-sm font-semibold">{t.name}</span>
                  <span className="text-sm font-medium text-accent">
                    {inr(t.priceInr)}
                  </span>
                </div>
                <ul className="space-y-1 text-xs text-foreground/70">
                  {t.includes.map((i) => (
                    <li key={i} className="flex gap-2">
                      <CircleDot className="mt-0.5 h-3 w-3 shrink-0 text-foreground/40" />
                      <span>{i}</span>
                    </li>
                  ))}
                </ul>
              </div>
            ))}
          </div>
          {pricing.notes.length > 0 ? (
            <ul className="space-y-1 text-xs text-foreground/70">
              {pricing.notes.map((n) => (
                <li key={n} className="flex gap-2">
                  <CircleDot className="mt-0.5 h-3 w-3 shrink-0 text-foreground/40" />
                  <span>{n}</span>
                </li>
              ))}
            </ul>
          ) : null}
        </div>
      )}
    </Card>
  );
}

function Stat({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex flex-col gap-0.5 rounded-2xl border border-foreground/10 bg-background/60 p-3">
      <span className="text-[11px] uppercase tracking-wide text-foreground/60">
        {label}
      </span>
      <span className="text-base font-semibold">{value}</span>
    </div>
  );
}

function PricingCalculator({
  pricing,
}: {
  pricing: PricingPlan | null | undefined;
}) {
  const pricingKey = pricing
    ? `${pricing.pricePerUnitInr}:${pricing.variableCostPerUnitInr}:${pricing.fixedCostsPerMonthInr}`
    : "default";
  return <PricingCalculatorBody key={pricingKey} pricing={pricing} />;
}

function PricingCalculatorBody({
  pricing,
}: {
  pricing: PricingPlan | null | undefined;
}) {
  const [pricePerUnit, setPricePerUnit] = useState<number>(
    pricing?.pricePerUnitInr ?? 500,
  );
  const [unitsPerMonth, setUnitsPerMonth] = useState<number>(40);
  const [variableCost, setVariableCost] = useState<number>(
    pricing?.variableCostPerUnitInr ?? 50,
  );
  const [fixedCost, setFixedCost] = useState<number>(
    pricing?.fixedCostsPerMonthInr ?? 5000,
  );

  const revenue = pricePerUnit * unitsPerMonth;
  const variableTotal = variableCost * unitsPerMonth;
  const profit = revenue - variableTotal - fixedCost;
  const contribution = pricePerUnit - variableCost;
  const breakEven =
    contribution > 0 ? Math.ceil(fixedCost / contribution) : Infinity;

  return (
    <Card className="fade-up flex flex-col gap-3">
      <div className="flex items-center gap-2">
        <span className="grid h-8 w-8 place-items-center rounded-xl bg-accent-soft/50 text-accent">
          <Calculator className="h-4 w-4" />
        </span>
        <CardTitle>What-if calculator</CardTitle>
      </div>
      <div className="grid gap-3 sm:grid-cols-2">
        <NumberField
          label="Price per unit (₹)"
          value={pricePerUnit}
          onChange={setPricePerUnit}
        />
        <NumberField
          label="Units per month"
          value={unitsPerMonth}
          onChange={setUnitsPerMonth}
        />
        <NumberField
          label="Variable cost / unit (₹)"
          value={variableCost}
          onChange={setVariableCost}
        />
        <NumberField
          label="Fixed costs / month (₹)"
          value={fixedCost}
          onChange={setFixedCost}
        />
      </div>
      <div className="grid gap-3 sm:grid-cols-3">
        <Stat label="Revenue / month" value={inr(revenue)} />
        <Stat
          label={profit >= 0 ? "Profit / month" : "Loss / month"}
          value={inr(profit)}
        />
        <Stat
          label="Break-even units"
          value={
            Number.isFinite(breakEven) ? `${breakEven} / month` : "Not viable"
          }
        />
      </div>
    </Card>
  );
}

function NumberField({
  label,
  value,
  onChange,
}: {
  label: string;
  value: number;
  onChange: (n: number) => void;
}) {
  return (
    <div className="grid gap-1.5">
      <Label>{label}</Label>
      <Input
        type="number"
        inputMode="numeric"
        value={Number.isFinite(value) ? value : ""}
        onChange={(e) => {
          const v = Number(e.target.value);
          onChange(Number.isFinite(v) ? v : 0);
        }}
      />
    </div>
  );
}

function todayIso() {
  const d = new Date();
  return d.toISOString().slice(0, 10);
}

function InvoiceBuilder({
  businessName,
  businessAddress,
  unitName,
  defaultPrice,
}: {
  businessName: string;
  businessAddress: string;
  unitName: string;
  defaultPrice: number;
}) {
  const [businessGstin, setBusinessGstin] = useState("");
  const [businessPan, setBusinessPan] = useState("");
  const [businessEmail, setBusinessEmail] = useState("");
  const [businessPhone, setBusinessPhone] = useState("");
  const [clientName, setClientName] = useState("");
  const [clientAddress, setClientAddress] = useState("");
  const [clientGstin, setClientGstin] = useState("");
  const [invoiceNumber, setInvoiceNumber] = useState(
    `INV-${new Date().getFullYear()}-001`,
  );
  const [invoiceDate, setInvoiceDate] = useState(todayIso());
  const [dueDate, setDueDate] = useState("");
  const [businessState, setBusinessState] = useState("Maharashtra");
  const [clientState, setClientState] = useState("Maharashtra");
  const [gstRate, setGstRate] = useState<number>(18);
  const [notes, setNotes] = useState("");
  const [lines, setLines] = useState<InvoiceLine[]>([
    {
      description: `${unitName.charAt(0).toUpperCase()}${unitName.slice(1)}`,
      quantity: 1,
      unitPriceInr: defaultPrice || 500,
      hsnSac: "",
    },
  ]);

  const printRef = useRef<HTMLDivElement>(null);

  const invoice: Invoice = useMemo(
    () => ({
      invoiceNumber,
      invoiceDate,
      dueDate: dueDate || undefined,
      business: {
        name: businessName,
        address: `${businessAddress}, ${businessState}`,
        gstin: businessGstin || undefined,
        pan: businessPan || undefined,
        email: businessEmail || undefined,
        phone: businessPhone || undefined,
      },
      client: {
        name: clientName,
        address: `${clientAddress}${clientState ? `, ${clientState}` : ""}`,
        gstin: clientGstin || undefined,
      },
      lines,
      gstRatePercent: gstRate,
      isInterState: businessState !== clientState,
      notes: notes || undefined,
    }),
    [
      invoiceNumber,
      invoiceDate,
      dueDate,
      businessName,
      businessAddress,
      businessState,
      businessGstin,
      businessPan,
      businessEmail,
      businessPhone,
      clientName,
      clientAddress,
      clientState,
      clientGstin,
      lines,
      gstRate,
      notes,
    ],
  );

  const totals = computeInvoice(invoice);

  function updateLine(idx: number, patch: Partial<InvoiceLine>) {
    setLines((ls) => ls.map((l, i) => (i === idx ? { ...l, ...patch } : l)));
  }

  function addLine() {
    setLines((ls) => [
      ...ls,
      { description: "", quantity: 1, unitPriceInr: 0, hsnSac: "" },
    ]);
  }

  function removeLine(idx: number) {
    setLines((ls) => ls.filter((_, i) => i !== idx));
  }

  function printInvoice() {
    if (typeof window === "undefined" || !printRef.current) return;
    const html = printRef.current.innerHTML;
    const w = window.open("", "_blank", "width=900,height=1200");
    if (!w) return;
    w.document.write(`<!doctype html><html><head><title>${invoiceNumber}</title>
<style>
  body { font-family: -apple-system, system-ui, "Segoe UI", Roboto, sans-serif; padding: 32px; color: #111; }
  h1 { margin: 0 0 4px; font-size: 22px; }
  table { width: 100%; border-collapse: collapse; margin-top: 16px; }
  th, td { border: 1px solid #ccc; padding: 8px; text-align: left; font-size: 12px; }
  th { background: #f4f4f4; }
  .right { text-align: right; }
  .muted { color: #666; font-size: 11px; }
  .totals td { border: 0; padding: 4px 8px; }
  .totals .label { text-align: right; color: #666; }
  .totals .value { text-align: right; font-weight: 600; }
</style></head><body>${html}</body></html>`);
    w.document.close();
    w.focus();
    setTimeout(() => w.print(), 300);
  }

  return (
    <Card className="fade-up flex flex-col gap-4">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <div className="flex items-center gap-2">
          <span className="grid h-8 w-8 place-items-center rounded-xl bg-accent-soft/50 text-accent">
            <Receipt className="h-4 w-4" />
          </span>
          <CardTitle>GST invoice generator</CardTitle>
        </div>
        <Button size="sm" variant="secondary" onClick={printInvoice}>
          Print / PDF
          <Printer className="h-3.5 w-3.5" />
        </Button>
      </div>
      <CardDescription>
        India-format invoice with CGST + SGST (intra-state) or IGST
        (inter-state) split. Numbers re-compute live as you type.
      </CardDescription>

      <div className="grid gap-3 md:grid-cols-2">
        <div className="grid gap-2 rounded-2xl border border-foreground/10 bg-background/60 p-3">
          <Label className="text-xs uppercase tracking-wide text-foreground/60">
            Your business
          </Label>
          <Input
            placeholder="GSTIN (optional)"
            value={businessGstin}
            onChange={(e) => setBusinessGstin(e.target.value.toUpperCase())}
          />
          <Input
            placeholder="PAN (optional)"
            value={businessPan}
            onChange={(e) => setBusinessPan(e.target.value.toUpperCase())}
          />
          <Input
            placeholder="Email"
            value={businessEmail}
            onChange={(e) => setBusinessEmail(e.target.value)}
          />
          <Input
            placeholder="Phone"
            value={businessPhone}
            onChange={(e) => setBusinessPhone(e.target.value)}
          />
          <select
            value={businessState}
            onChange={(e) => setBusinessState(e.target.value)}
            className="h-11 rounded-2xl border border-foreground/15 bg-background px-3 text-sm"
          >
            {STATES.map((s) => (
              <option key={s} value={s}>
                {s}
              </option>
            ))}
          </select>
        </div>
        <div className="grid gap-2 rounded-2xl border border-foreground/10 bg-background/60 p-3">
          <Label className="text-xs uppercase tracking-wide text-foreground/60">
            Bill to
          </Label>
          <Input
            placeholder="Client name"
            value={clientName}
            onChange={(e) => setClientName(e.target.value)}
          />
          <Input
            placeholder="Client address"
            value={clientAddress}
            onChange={(e) => setClientAddress(e.target.value)}
          />
          <Input
            placeholder="Client GSTIN (optional)"
            value={clientGstin}
            onChange={(e) => setClientGstin(e.target.value.toUpperCase())}
          />
          <select
            value={clientState}
            onChange={(e) => setClientState(e.target.value)}
            className="h-11 rounded-2xl border border-foreground/15 bg-background px-3 text-sm"
          >
            {STATES.map((s) => (
              <option key={s} value={s}>
                {s}
              </option>
            ))}
          </select>
        </div>
      </div>

      <div className="grid gap-3 sm:grid-cols-3">
        <div className="grid gap-1.5">
          <Label>Invoice number</Label>
          <Input
            value={invoiceNumber}
            onChange={(e) => setInvoiceNumber(e.target.value)}
          />
        </div>
        <div className="grid gap-1.5">
          <Label>Invoice date</Label>
          <Input
            type="date"
            value={invoiceDate}
            onChange={(e) => setInvoiceDate(e.target.value)}
          />
        </div>
        <div className="grid gap-1.5">
          <Label>Due date</Label>
          <Input
            type="date"
            value={dueDate}
            onChange={(e) => setDueDate(e.target.value)}
          />
        </div>
      </div>

      <div className="flex flex-col gap-2">
        <Label>Line items</Label>
        {lines.map((l, idx) => (
          <div
            key={idx}
            className="grid gap-2 rounded-2xl border border-foreground/10 bg-background/60 p-3 sm:grid-cols-[1fr_80px_120px_100px_36px]"
          >
            <Input
              placeholder="Description"
              value={l.description}
              onChange={(e) => updateLine(idx, { description: e.target.value })}
            />
            <Input
              type="number"
              placeholder="Qty"
              value={l.quantity}
              onChange={(e) =>
                updateLine(idx, { quantity: Number(e.target.value) || 0 })
              }
            />
            <Input
              type="number"
              placeholder="Unit ₹"
              value={l.unitPriceInr}
              onChange={(e) =>
                updateLine(idx, { unitPriceInr: Number(e.target.value) || 0 })
              }
            />
            <Input
              placeholder="HSN/SAC"
              value={l.hsnSac ?? ""}
              onChange={(e) => updateLine(idx, { hsnSac: e.target.value })}
            />
            <button
              type="button"
              onClick={() => removeLine(idx)}
              disabled={lines.length === 1}
              className="grid h-11 w-9 place-items-center rounded-2xl border border-foreground/15 text-foreground/60 hover:bg-foreground/5 disabled:opacity-40"
              aria-label="Remove line"
            >
              <Trash2 className="h-3.5 w-3.5" />
            </button>
          </div>
        ))}
        <Button
          size="sm"
          variant="secondary"
          type="button"
          onClick={addLine}
          className="self-start"
        >
          <Plus className="h-3.5 w-3.5" /> Add line
        </Button>
      </div>

      <div className="grid gap-3 sm:grid-cols-2">
        <div className="grid gap-1.5">
          <Label>GST rate (%)</Label>
          <select
            value={gstRate}
            onChange={(e) => setGstRate(Number(e.target.value))}
            className="h-11 rounded-2xl border border-foreground/15 bg-background px-3 text-sm"
          >
            {[0, 5, 12, 18, 28].map((r) => (
              <option key={r} value={r}>
                {r}%
              </option>
            ))}
          </select>
        </div>
        <div className="grid gap-1.5">
          <Label>Notes</Label>
          <Input
            placeholder="Bank details, terms, etc."
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
          />
        </div>
      </div>

      <div
        ref={printRef}
        className="rounded-2xl border border-foreground/10 bg-background p-6 text-sm text-foreground"
      >
        <InvoicePreview invoice={invoice} totals={totals} />
      </div>
    </Card>
  );
}

function InvoicePreview({
  invoice,
  totals,
}: {
  invoice: Invoice;
  totals: ReturnType<typeof computeInvoice>;
}) {
  return (
    <div>
      <div style={{ display: "flex", justifyContent: "space-between" }}>
        <div>
          <h1 style={{ fontSize: 22, fontWeight: 600 }}>
            {invoice.business.name || "Your business"}
          </h1>
          <p className="muted" style={{ fontSize: 11, color: "#666" }}>
            {invoice.business.address}
          </p>
          {invoice.business.gstin ? (
            <p style={{ fontSize: 11 }}>GSTIN: {invoice.business.gstin}</p>
          ) : null}
          {invoice.business.pan ? (
            <p style={{ fontSize: 11 }}>PAN: {invoice.business.pan}</p>
          ) : null}
        </div>
        <div style={{ textAlign: "right" }}>
          <h1 style={{ fontSize: 22, fontWeight: 600 }}>TAX INVOICE</h1>
          <p style={{ fontSize: 11 }}>{invoice.invoiceNumber}</p>
          <p style={{ fontSize: 11 }}>Date: {invoice.invoiceDate}</p>
          {invoice.dueDate ? (
            <p style={{ fontSize: 11 }}>Due: {invoice.dueDate}</p>
          ) : null}
        </div>
      </div>
      <hr style={{ margin: "12px 0", border: "none", borderTop: "1px solid #e5e5e5" }} />
      <div style={{ marginTop: 8 }}>
        <p
          style={{
            fontSize: 11,
            textTransform: "uppercase",
            letterSpacing: 0.5,
            color: "#666",
          }}
        >
          Bill to
        </p>
        <p style={{ fontWeight: 500 }}>
          {invoice.client.name || "Client name"}
        </p>
        <p style={{ fontSize: 11 }}>{invoice.client.address}</p>
        {invoice.client.gstin ? (
          <p style={{ fontSize: 11 }}>GSTIN: {invoice.client.gstin}</p>
        ) : null}
      </div>
      <table
        style={{
          width: "100%",
          borderCollapse: "collapse",
          marginTop: 16,
          fontSize: 12,
        }}
      >
        <thead>
          <tr>
            <th style={cellHead}>#</th>
            <th style={cellHead}>Description</th>
            <th style={cellHead}>HSN/SAC</th>
            <th style={cellHeadRight}>Qty</th>
            <th style={cellHeadRight}>Rate</th>
            <th style={cellHeadRight}>Amount</th>
          </tr>
        </thead>
        <tbody>
          {invoice.lines.map((l, idx) => (
            <tr key={idx}>
              <td style={cell}>{idx + 1}</td>
              <td style={cell}>{l.description || "—"}</td>
              <td style={cell}>{l.hsnSac || "—"}</td>
              <td style={cellRight}>{l.quantity}</td>
              <td style={cellRight}>{inr(l.unitPriceInr)}</td>
              <td style={cellRight}>{inr(l.quantity * l.unitPriceInr)}</td>
            </tr>
          ))}
        </tbody>
      </table>
      <table style={{ marginTop: 12, marginLeft: "auto", fontSize: 12 }}>
        <tbody>
          <tr>
            <td style={{ textAlign: "right", padding: "4px 8px", color: "#666" }}>
              Subtotal
            </td>
            <td style={{ textAlign: "right", padding: "4px 8px", fontWeight: 600 }}>
              {inr(totals.subtotal)}
            </td>
          </tr>
          {invoice.isInterState ? (
            <tr>
              <td style={{ textAlign: "right", padding: "4px 8px", color: "#666" }}>
                IGST {invoice.gstRatePercent}%
              </td>
              <td style={{ textAlign: "right", padding: "4px 8px", fontWeight: 600 }}>
                {inr(totals.igst)}
              </td>
            </tr>
          ) : (
            <>
              <tr>
                <td style={{ textAlign: "right", padding: "4px 8px", color: "#666" }}>
                  CGST {invoice.gstRatePercent / 2}%
                </td>
                <td style={{ textAlign: "right", padding: "4px 8px", fontWeight: 600 }}>
                  {inr(totals.cgst)}
                </td>
              </tr>
              <tr>
                <td style={{ textAlign: "right", padding: "4px 8px", color: "#666" }}>
                  SGST {invoice.gstRatePercent / 2}%
                </td>
                <td style={{ textAlign: "right", padding: "4px 8px", fontWeight: 600 }}>
                  {inr(totals.sgst)}
                </td>
              </tr>
            </>
          )}
          <tr>
            <td
              style={{
                textAlign: "right",
                padding: "8px",
                borderTop: "1px solid #ddd",
                fontWeight: 700,
              }}
            >
              Total
            </td>
            <td
              style={{
                textAlign: "right",
                padding: "8px",
                borderTop: "1px solid #ddd",
                fontWeight: 700,
              }}
            >
              {inr(totals.total)}
            </td>
          </tr>
        </tbody>
      </table>
      {invoice.notes ? (
        <p
          style={{
            marginTop: 16,
            fontSize: 11,
            color: "#666",
            whiteSpace: "pre-wrap",
          }}
        >
          {invoice.notes}
        </p>
      ) : null}
    </div>
  );
}

const cellHead: React.CSSProperties = {
  border: "1px solid #ccc",
  padding: 8,
  textAlign: "left",
  background: "#f4f4f4",
  fontSize: 12,
};
const cellHeadRight: React.CSSProperties = { ...cellHead, textAlign: "right" };
const cell: React.CSSProperties = {
  border: "1px solid #ccc",
  padding: 8,
  fontSize: 12,
};
const cellRight: React.CSSProperties = { ...cell, textAlign: "right" };

function PaymentsSection() {
  return (
    <Card className="fade-up flex flex-col gap-3">
      <div className="flex items-center gap-2">
        <span className="grid h-8 w-8 place-items-center rounded-xl bg-accent-soft/50 text-accent">
          <CreditCard className="h-4 w-4" />
        </span>
        <CardTitle>Accept payments</CardTitle>
      </div>
      <CardDescription>
        Indian customers pay fastest via UPI. Start with a no-code Payment Link
        from Razorpay or PhonePe Business — both onboard in minutes.
      </CardDescription>
      <div className="grid gap-2 sm:grid-cols-2">
        <a
          href="https://razorpay.com/payment-links/"
          target="_blank"
          rel="noreferrer noopener"
          className="rounded-2xl border border-foreground/10 bg-background/60 p-4 hover:bg-foreground/5"
        >
          <div className="flex items-center justify-between">
            <span className="font-medium">Razorpay Payment Links</span>
            <ExternalLink className="h-4 w-4 text-foreground/60" />
          </div>
          <p className="text-xs text-foreground/70">
            UPI, cards, netbanking. 2% fee. KYC via PAN + bank.
          </p>
        </a>
        <a
          href="https://business.phonepe.com/"
          target="_blank"
          rel="noreferrer noopener"
          className="rounded-2xl border border-foreground/10 bg-background/60 p-4 hover:bg-foreground/5"
        >
          <div className="flex items-center justify-between">
            <span className="font-medium">PhonePe Business</span>
            <ExternalLink className="h-4 w-4 text-foreground/60" />
          </div>
          <p className="text-xs text-foreground/70">
            UPI QR, soundbox, in-store + online. Lower fees on UPI.
          </p>
        </a>
      </div>
    </Card>
  );
}

function FilingReminders() {
  const items: { title: string; cadence: string; due: string; for: string }[] = [
    {
      title: "GSTR-1 (outward supplies)",
      cadence: "Monthly / Quarterly",
      due: "11th of next month (monthly) / 13th (QRMP)",
      for: "GST-registered businesses",
    },
    {
      title: "GSTR-3B (summary return)",
      cadence: "Monthly",
      due: "20th of next month",
      for: "GST-registered businesses",
    },
    {
      title: "TDS payment",
      cadence: "Monthly",
      due: "7th of next month",
      for: "Businesses deducting TDS",
    },
    {
      title: "Advance tax",
      cadence: "Quarterly",
      due: "15 Jun, 15 Sep, 15 Dec, 15 Mar",
      for: "Tax liability > ₹10,000",
    },
    {
      title: "ITR (proprietorship)",
      cadence: "Annual",
      due: "31 Jul (without audit) / 31 Oct (with)",
      for: "All proprietors",
    },
    {
      title: "Professional Tax",
      cadence: "Monthly / Annual",
      due: "Varies by state (e.g., 30th in Maharashtra)",
      for: "Most states except a few",
    },
  ];
  return (
    <Card className="fade-up flex flex-col gap-3">
      <div className="flex items-center gap-2">
        <span className="grid h-8 w-8 place-items-center rounded-xl bg-accent-soft/50 text-accent">
          <CalendarRange className="h-4 w-4" />
        </span>
        <CardTitle>Filing reminders</CardTitle>
        <CardDescription className="ml-1">
          (Set calendar alerts — automation coming next)
        </CardDescription>
      </div>
      <ul className="grid gap-2 md:grid-cols-2">
        {items.map((it) => (
          <li
            key={it.title}
            className="flex flex-col gap-1 rounded-2xl border border-foreground/10 bg-background/60 p-3"
          >
            <div className="flex items-center justify-between">
              <span className="text-sm font-medium">{it.title}</span>
              <span className="rounded-full border border-foreground/10 bg-background px-2 py-0.5 text-[10px] uppercase tracking-wide text-foreground/60">
                {it.cadence}
              </span>
            </div>
            <span className="text-xs text-foreground/70">
              <FileText className="mr-1 inline h-3 w-3" />
              {it.due}
            </span>
            <span className="text-[11px] text-foreground/50">{it.for}</span>
          </li>
        ))}
      </ul>
    </Card>
  );
}
