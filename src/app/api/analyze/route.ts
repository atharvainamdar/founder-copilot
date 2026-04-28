import { NextResponse, type NextRequest } from "next/server";
import { chatJSON } from "@/lib/azure";
import { feasibilitySchema, intakeSchema } from "@/lib/schemas";

export const runtime = "nodejs";
export const maxDuration = 60;

const SYSTEM_PROMPT = `You are "Founder Copilot", an honest, blunt, locally-aware
business analyst for Indian founders. The user is starting a small business
from their home or a nearby premise in India.

Your job, on every analysis:
1. Do a MICROSCOPIC, locality-aware feasibility analysis of the idea given
   the user's address (city + locality + optional PIN). Reason about the
   neighborhood like a local would: nearby competitors, demographics, income
   level, schools, IT parks, RWAs, footfall, parking, building bye-laws,
   weather seasonality, language, and cultural context.
2. Be brutally honest. If the idea is saturated or weak in this locality,
   say so. Never sugar-coat. If it is strong, say so equally clearly.
3. ALWAYS suggest 2-3 nearby-market-validated PIVOTS — even when the verdict
   is "good". Pivots should be concrete (e.g. "Bollywood-fit class for working
   women in Magarpatta" not "do something else with dance"). Each pivot must
   have a 1-2 sentence "why" tied to the actual locality.
4. Use INR (₹) for any money. Use realistic India numbers (lakh / crore).
5. Output strictly the JSON schema you are given — no extra prose.

Verdict rubric:
- "good"  : score 70-100. Real demand, manageable competition, plausible unit
            economics for this locality.
- "pivot" : score 40-69.  Idea has merit but a sharper variant fits better.
- "bad"   : score 0-39.   Demand or fit is weak; recommend pivots strongly.

Reasoning bullets must be SPECIFIC to the locality (mention areas, types of
nearby businesses, demographic patterns). Avoid generic advice.`;

function buildUserPrompt(intake: {
  name: string;
  idea: string;
  city: string;
  address: string;
  pincode?: string;
}) {
  return [
    `Founder name: ${intake.name}`,
    `Idea (founder's own words): "${intake.idea}"`,
    `City: ${intake.city}`,
    `Address / locality: ${intake.address}`,
    intake.pincode ? `PIN code: ${intake.pincode}` : null,
    "",
    "Return a single JSON object matching this TypeScript type:",
    `{
  verdict: "good" | "pivot" | "bad",
  score: number, // 0-100
  headline: string,
  reasoning: string[], // 3-5 bullets, locality-specific
  competitorLandscape: { name: string; type: string; approxDistanceKm?: number; notes?: string }[],
  demandSignals: string[],
  risks: string[],
  pivots: { title: string; why: string; estimatedSetupCostInr?: number; expectedDemand: "low"|"medium"|"high" }[], // 2-3 pivots ALWAYS
  nextQuestions: string[] // 2-4 sharp follow-ups
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

  const parsed = intakeSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      { error: parsed.error.issues[0]?.message ?? "Invalid input." },
      { status: 400 },
    );
  }

  try {
    const result = await chatJSON(
      feasibilitySchema,
      SYSTEM_PROMPT,
      buildUserPrompt(parsed.data),
      { temperature: 0.3, maxTokens: 3500 },
    );
    return NextResponse.json(result);
  } catch (err) {
    const message = err instanceof Error ? err.message : "Unknown error";
    return NextResponse.json(
      { error: `Analysis failed: ${message}` },
      { status: 502 },
    );
  }
}
