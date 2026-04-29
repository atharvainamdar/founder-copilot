import { NextResponse, type NextRequest } from "next/server";
import { chatJSON } from "@/lib/azure";
import { draftDocInputSchema, draftDocSchema } from "@/lib/schemas";

export const runtime = "nodejs";
export const maxDuration = 60;

const SYSTEM_PROMPT = `You are "Founder Copilot — Compliance Studio", helping
an Indian founder actually complete a single compliance task from their
setup checklist. Be operational and India-specific.

Given a founder's idea, locality, recommended entity, and the name of one
compliance item from their checklist, produce:

1. A clear title and 2-3 line summary of what this is and why it matters
   for THIS founder's business and locality.
2. The actual issuing authority and (if you are confident) the official
   government portal URL. Only include URLs you are confident are correct
   and currently used. Use https://. If unsure, set portalUrl to null.
3. estimatedTimeDays and estimatedFeeInr (₹) where relevant.
4. prerequisites — concrete things the founder must have ready before
   starting (PAN, Aadhaar, photos, rent agreement, partnership info, etc).
5. 4-8 step-by-step "steps" with title and detail. Steps should be
   concrete actions the founder takes, in order.
6. fieldsToFill — the actual form fields they will see on the portal /
   document, with realistic example values tailored to the founder's
   business and locality. Mark required vs optional.
7. draftDocumentMarkdown — IF this item is itself a document the founder
   has to draft and not just an online registration, write a full
   ready-to-edit markdown draft, with placeholders like [Founder Name]
   only where it must be personalized. Examples that NEED a draft:
   partnership deed, society permission letter, client waiver / liability
   release, basic terms of service, basic privacy policy, rent agreement
   for home-based business, employment offer letter. Examples that do
   NOT need a draft (set this field to null): GST registration, Udyam
   registration, Shop & Establishment registration, FSSAI, PAN — these
   are filed on portals.
8. caveats — short, honest disclaimers (state-specific variations,
   threshold rules, when to consult a CA / lawyer).

Be honest, India-specific, locality-aware. Use ₹ for amounts.
Output STRICTLY a single JSON object matching the provided schema.`;

function buildUserPrompt(
  input: ReturnType<typeof draftDocInputSchema.parse>,
) {
  const { intake, plan, itemName } = input;
  const item = plan.complianceChecklist.find((c) => c.name === itemName);
  return [
    `Founder: ${intake.name}`,
    `Idea: ${intake.idea}`,
    `Location: ${intake.address}, ${intake.city}${
      intake.pincode ? ` (${intake.pincode})` : ""
    }`,
    `Recommended entity: ${plan.recommendedEntity.type}`,
    `Compliance item to detail: "${itemName}"`,
    item
      ? `Authority hint from earlier: ${item.authority}; why: ${item.why}`
      : "(item not found in checklist; infer reasonable defaults)",
    "",
    "Return JSON matching the DraftDoc schema. Always include 4-8 steps.",
  ].join("\n");
}

export async function POST(request: NextRequest) {
  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON body." }, { status: 400 });
  }

  const parsed = draftDocInputSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      { error: parsed.error.issues[0]?.message ?? "Invalid input." },
      { status: 400 },
    );
  }

  try {
    const result = await chatJSON(
      draftDocSchema,
      SYSTEM_PROMPT,
      buildUserPrompt(parsed.data),
      { temperature: 0.2, maxTokens: 4000 },
    );
    return NextResponse.json(result);
  } catch (err) {
    const message = err instanceof Error ? err.message : "Unknown error";
    return NextResponse.json(
      { error: `Draft doc failed: ${message}` },
      { status: 502 },
    );
  }
}
