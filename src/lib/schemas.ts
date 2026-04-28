import { z } from "zod";

export const intakeSchema = z.object({
  name: z.string().trim().min(1, "Tell us your name").max(80),
  idea: z.string().trim().min(10, "Describe what you want to do").max(2000),
  city: z.string().trim().min(1, "City is required").max(80),
  address: z.string().trim().min(3, "Add a rough address or locality").max(300),
  pincode: z
    .string()
    .trim()
    .regex(/^[1-9][0-9]{5}$/u, "Enter a valid 6-digit Indian PIN")
    .optional()
    .or(z.literal("")),
});
export type Intake = z.infer<typeof intakeSchema>;

export const competitorSchema = z.object({
  name: z.string(),
  type: z.string().describe("e.g. 'dance studio', 'home tutor'"),
  approxDistanceKm: z.number().nullable().optional(),
  notes: z.string().optional(),
});

export const pivotSchema = z.object({
  title: z.string(),
  why: z.string().describe("Why this pivot fits the locality and the user."),
  estimatedSetupCostInr: z.number().nullable().optional(),
  expectedDemand: z.enum(["low", "medium", "high"]),
});

export const feasibilitySchema = z.object({
  verdict: z.enum(["good", "pivot", "bad"]),
  score: z.number().min(0).max(100),
  headline: z
    .string()
    .describe("One-line summary suitable for a card title."),
  reasoning: z
    .array(z.string())
    .min(2)
    .describe("3-5 bullets of microscopic analysis grounded in the locality."),
  competitorLandscape: z
    .array(competitorSchema)
    .describe("Plausible nearby competitors / substitutes."),
  demandSignals: z
    .array(z.string())
    .describe("Signals like demographics, footfall, schools, IT parks, etc."),
  risks: z.array(z.string()),
  pivots: z
    .array(pivotSchema)
    .describe("Always include 2-3 pivots, even for a 'good' verdict."),
  nextQuestions: z
    .array(z.string())
    .min(2)
    .describe(
      "2-4 sharp follow-up questions the AI should ask next to refine the plan.",
    ),
});
export type Feasibility = z.infer<typeof feasibilitySchema>;

export const wizardInputSchema = z.object({
  intake: intakeSchema,
  feasibility: feasibilitySchema,
  budgetInr: z.number().nonnegative().optional(),
  fundingStance: z
    .enum(["bootstrap", "loan", "scheme", "investor", "unsure"])
    .optional(),
  entityType: z
    .enum(["proprietorship", "partnership", "llp", "pvt_ltd", "opc", "unsure"])
    .optional(),
  startingFromZero: z.boolean().optional(),
});
export type WizardInput = z.infer<typeof wizardInputSchema>;

export const schemeSuggestionSchema = z.object({
  name: z.string(),
  category: z.enum(["bank_loan", "govt_scheme", "subsidy", "grant", "tax_benefit"]),
  description: z.string(),
  eligibility: z.string(),
  approxAmountInr: z.string().describe("e.g. 'Up to ₹10 lakh' or 'Varies'"),
  applyHint: z.string().describe("Where / how to apply, in 1-2 sentences."),
  fitScore: z.number().min(0).max(100),
});

export const documentItemSchema = z.object({
  name: z.string(),
  why: z.string(),
  authority: z.string(),
  estimatedTimeDays: z.number().nullable().optional(),
  estimatedFeeInr: z.string().optional(),
});

export const wizardPlanSchema = z.object({
  recommendedEntity: z.object({
    type: z.enum([
      "proprietorship",
      "partnership",
      "llp",
      "pvt_ltd",
      "opc",
    ]),
    rationale: z.string(),
    tradeoffs: z.array(z.string()),
  }),
  fundingPlan: z.object({
    summary: z.string(),
    schemes: z.array(schemeSuggestionSchema).min(1),
  }),
  complianceChecklist: z.array(documentItemSchema).min(3),
  marketingStarter: z.array(z.string()).describe("3-6 first marketing moves."),
  firstThirtyDays: z
    .array(z.string())
    .min(5)
    .describe("Day-by-week / phase milestones for the first 30 days."),
});
export type WizardPlan = z.infer<typeof wizardPlanSchema>;
