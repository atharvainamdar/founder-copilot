import { NextResponse, type NextRequest } from "next/server";
import { chatJSON } from "@/lib/azure";
import { wizardInputSchema, wizardPlanSchema } from "@/lib/schemas";

export const runtime = "nodejs";
export const maxDuration = 60;

const SYSTEM_PROMPT = `You are "Founder Copilot", helping an Indian founder
move from a validated idea to an operating business.

Given the founder's idea, locality, budget, funding stance and (optionally)
preferred entity type, produce a complete India-specific setup plan.

Cover:
1. RECOMMENDED ENTITY (proprietorship / partnership / LLP / Pvt Ltd / OPC)
   with rationale tuned to the founder's budget, scale ambitions, and
   funding stance. List 2-4 trade-offs.
2. FUNDING PLAN: a short summary of the funding mix, then 3-6 concrete
   schemes / loans the founder is most likely eligible for. Use real,
   well-known India schemes such as: PMMY (Mudra — Shishu/Kishor/Tarun),
   Stand-Up India, Startup India (DPIIT recognition + tax benefits),
   PMEGP, MSME Udyam, CGTMSE collateral-free loans, Mahila Udyam Nidhi,
   state-level schemes (e.g. Maharashtra CMEGP), bank MSME loans,
   Section 80 / startup tax holidays, etc. ONLY include real schemes you
   are confident about. Each scheme: name, category, description,
   eligibility, approx amount in INR, where/how to apply (1-2 sentences),
   and a 0-100 fitScore for THIS founder.
3. COMPLIANCE CHECKLIST: 4-8 documents/registrations the founder will
   need to start operating legally — e.g. PAN/TAN, GST registration (with
   threshold caveat), Udyam (MSME) registration, Shop & Establishment Act
   (state-specific), FSSAI for food, Trade License, Professional Tax,
   relevant labour registrations. Each: name, why it's needed, issuing
   authority, est. days, est. fees in INR.
4. MARKETING STARTER: 3-6 concrete first marketing moves tailored to a
   small Indian local business (WhatsApp Business, Google Business Profile,
   Instagram reels, society notice boards, JustDial, referrals, etc.).
5. FIRST 30 DAYS: 5-8 phase milestones, ordered, written as imperative
   one-liners ("Week 1: Register Udyam and open current account at HDFC").

Be honest — if Pvt Ltd is overkill for a ₹50k home dance class, say so and
recommend proprietorship. Use ₹ for all amounts. Never invent schemes.

Output STRICTLY a single JSON object matching the provided schema.`;

function buildUserPrompt(input: ReturnType<typeof wizardInputSchema.parse>) {
  const { intake, feasibility, budgetInr, fundingStance, entityType, startingFromZero } =
    input;
  return [
    `Founder: ${intake.name}`,
    `Idea: ${intake.idea}`,
    `Location: ${intake.address}, ${intake.city}${
      intake.pincode ? ` (${intake.pincode})` : ""
    }`,
    `Earlier verdict: ${feasibility.verdict} (${feasibility.score}/100) — ${feasibility.headline}`,
    `Top risks: ${feasibility.risks.slice(0, 3).join("; ") || "n/a"}`,
    budgetInr !== undefined ? `Budget available: ₹${budgetInr.toLocaleString("en-IN")}` : null,
    fundingStance ? `Funding stance: ${fundingStance}` : null,
    entityType && entityType !== "unsure" ? `Preferred entity: ${entityType}` : null,
    typeof startingFromZero === "boolean"
      ? `Starting from zero: ${startingFromZero ? "yes" : "no"}`
      : null,
    "",
    "Return JSON matching:",
    `{
  recommendedEntity: { type: "proprietorship"|"partnership"|"llp"|"pvt_ltd"|"opc", rationale: string, tradeoffs: string[] },
  fundingPlan: { summary: string, schemes: { name, category, description, eligibility, approxAmountInr, applyHint, fitScore }[] },
  complianceChecklist: { name, why, authority, estimatedTimeDays?, estimatedFeeInr? }[],
  marketingStarter: string[],
  firstThirtyDays: string[]
}`,
  ]
    .filter(Boolean)
    .join("\n");
}

export async function POST(request: NextRequest) {
  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON body." }, { status: 400 });
  }

  const parsed = wizardInputSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      { error: parsed.error.issues[0]?.message ?? "Invalid input." },
      { status: 400 },
    );
  }

  try {
    const result = await chatJSON(
      wizardPlanSchema,
      SYSTEM_PROMPT,
      buildUserPrompt(parsed.data),
      { temperature: 0.3, maxTokens: 4000 },
    );
    return NextResponse.json(result);
  } catch (err) {
    const message = err instanceof Error ? err.message : "Unknown error";
    return NextResponse.json(
      { error: `Wizard failed: ${message}` },
      { status: 502 },
    );
  }
}
