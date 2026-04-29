import { NextResponse, type NextRequest } from "next/server";
import { chatJSON } from "@/lib/azure";
import { pricingInputSchema, pricingPlanSchema } from "@/lib/schemas";

export const runtime = "nodejs";
export const maxDuration = 60;

const SYSTEM_PROMPT = `You are "Founder Copilot — Pricing Studio". Given
an Indian founder's idea, locality, recommended entity, and earlier
context, produce a pragmatic pricing plan tuned to local willingness to
pay and competitor norms.

Output a JSON object with:
- unitName: what the founder sells per unit ("class", "session", "consult", "order").
- pricePerUnitInr: realistic INR price per unit for THIS locality.
- pricingRationale: 2-3 sentences justifying the price using locality
  signals (income level, competitor rates, perceived value).
- recommendedBatchSize / recommendedSessionsPerWeek: integers, optional.
- fixedCostsPerMonthInr and variableCostPerUnitInr: realistic estimates
  for a small Indian local operator.
- breakEvenUnitsPerMonth: derived from the above.
- threeTierPackages: exactly three tiers (e.g. Trial / Standard / Premium)
  with priceInr and "includes" bullets. Tier prices must be ascending.
- notes: 2-4 honest caveats about price elasticity, seasonality, or
  when to revisit.

Use realistic Indian price points (a salsa class in Pune is not ₹5,000
per session). Use INR. Output STRICTLY a single JSON object.`;

function buildUserPrompt(
  input: ReturnType<typeof pricingInputSchema.parse>,
) {
  const { intake, plan } = input;
  return [
    `Founder: ${intake.name}`,
    `Idea: ${intake.idea}`,
    `Location: ${intake.address}, ${intake.city}${
      intake.pincode ? ` (${intake.pincode})` : ""
    }`,
    `Recommended entity: ${plan.recommendedEntity.type}`,
    "",
    "Return JSON matching the PricingPlan schema.",
  ].join("\n");
}

export async function POST(request: NextRequest) {
  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON body." }, { status: 400 });
  }

  const parsed = pricingInputSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      { error: parsed.error.issues[0]?.message ?? "Invalid input." },
      { status: 400 },
    );
  }

  try {
    const result = await chatJSON(
      pricingPlanSchema,
      SYSTEM_PROMPT,
      buildUserPrompt(parsed.data),
      { temperature: 0.3, maxTokens: 2500 },
    );
    return NextResponse.json(result);
  } catch (err) {
    const message = err instanceof Error ? err.message : "Unknown error";
    return NextResponse.json(
      { error: `Pricing failed: ${message}` },
      { status: 502 },
    );
  }
}
