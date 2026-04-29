import { NextResponse, type NextRequest } from "next/server";
import { chatJSON } from "@/lib/azure";
import { marketingInputSchema, marketingKitSchema } from "@/lib/schemas";

export const runtime = "nodejs";
export const maxDuration = 60;

const SYSTEM_PROMPT = `You are "Founder Copilot — Marketing Studio",
producing a complete launch marketing kit for an Indian local business
based on the founder's idea, locality, recommended entity, and chosen
funding stance.

Output a JSON object with these blocks:

1. brandIdentity:
   - nameSuggestions: 3-5 short, memorable, India-friendly business names
     tied to the founder's idea + locality. Avoid trademarks of big brands.
   - tagline: 1-line, energetic, in plain English (or natural Hinglish).
   - valueProp: 2-3 sentence positioning that names the audience and the
     specific outcome.
   - voice: 1-line description of brand voice ("warm, energetic, no-fluff").
   - palette: 3-5 colors with friendly names and #RRGGBB hex codes that
     feel right for THIS business (not generic "blue and grey").

2. channels:
   - googleBusinessProfile: { name, description, categories[] }
     The description should be ≤ 700 chars and locality-aware.
   - whatsappBusiness: { shortBio, welcomeMessage, awayMessage,
     broadcastTemplate } — the broadcast template must include placeholders
     like {first_name} and a clear CTA.
   - instagram: { bio (≤150 chars), firstPosts: 3-5 posts, each with
     caption (2-4 short paragraphs, line breaks ok) and 5-12 hashtags
     mixing local + niche tags }.
   - justdial: 1-paragraph listing description.
   - societyNoticeFlyerMarkdown: a printable flyer in markdown for
     apartment/society notice boards, with headline, 3-5 bullets, and a
     contact line. Locality-aware.

3. referralProgram:
   - pitch: 1-2 sentences explaining the program to potential customers.
   - rewardStructure: concrete reward (e.g. "₹200 off for both you and
     your friend").
   - sampleMessage: a copy-paste WhatsApp message a happy customer can
     forward.

4. launchOffers: 3-5 concrete launch promotions tuned to budget and
   locality.

Be locality-aware (use the city/area). Use Indian conventions (₹, sq ft,
WhatsApp Business, JustDial). NEVER fabricate brand mentions.
Output STRICTLY a single JSON object matching the provided schema.`;

function buildUserPrompt(
  input: ReturnType<typeof marketingInputSchema.parse>,
) {
  const { intake, plan } = input;
  return [
    `Founder: ${intake.name}`,
    `Idea: ${intake.idea}`,
    `Location: ${intake.address}, ${intake.city}${
      intake.pincode ? ` (${intake.pincode})` : ""
    }`,
    `Recommended entity: ${plan.recommendedEntity.type}`,
    `Existing marketing starter ideas: ${plan.marketingStarter.join("; ")}`,
    "",
    "Produce the marketing kit as JSON.",
  ].join("\n");
}

export async function POST(request: NextRequest) {
  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON body." }, { status: 400 });
  }

  const parsed = marketingInputSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      { error: parsed.error.issues[0]?.message ?? "Invalid input." },
      { status: 400 },
    );
  }

  try {
    const result = await chatJSON(
      marketingKitSchema,
      SYSTEM_PROMPT,
      buildUserPrompt(parsed.data),
      { temperature: 0.5, maxTokens: 4000 },
    );
    return NextResponse.json(result);
  } catch (err) {
    const message = err instanceof Error ? err.message : "Unknown error";
    return NextResponse.json(
      { error: `Marketing failed: ${message}` },
      { status: 502 },
    );
  }
}
