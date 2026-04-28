# Founder Copilot

> An AI copilot for Indian founders. Validate your idea against your locality,
> pivot if needed, then go from registration to marketing to accounts on
> autopilot.

## What it does (v0)

1. **Single-question intake** — "What are you good at?" with voice + text input.
2. **Locality-aware feasibility analysis** — microscopic verdict (good / pivot
   / bad), score, locality reasoning, plausible competitors, demand signals,
   risks, and 2–3 smart pivots. Always.
3. **Setup wizard** — quick prompts on budget, funding stance, and entity type
   produce a tailored plan with:
   - Recommended legal entity + tradeoffs
   - Funding plan with matching India schemes (Mudra, Startup India, PMEGP,
     Stand-Up India, MSME Udyam, CGTMSE, state schemes…)
   - Compliance checklist (Udyam, GST, Shop Act, FSSAI, Trade License, …)
   - Marketing starter moves
   - 30-day rollout milestones

Coming next: Documents auto-drafting, Marketing Studio (logo + posts +
landing page), and Operations (invoicing + payments + books).

## Stack

- **Next.js 16** (App Router, React 19, Turbopack)
- **TypeScript 5**, **Tailwind CSS v4**
- **Zod 4** for input + structured-output validation
- **Azure AI Foundry** (any chat-capable deployment) via direct fetch with
  `response_format: { type: "json_object" }`

## Local dev

```bash
pnpm install
cp .env.example .env.local   # fill in AZURE_AI_ENDPOINT + AZURE_AI_KEY + AZURE_AI_MODEL
pnpm dev
```

The app expects an Azure AI chat-completions endpoint that supports JSON-mode
output. Configure via:

| env                    | default                                                   |
| ---------------------- | --------------------------------------------------------- |
| `AZURE_AI_ENDPOINT`    | required (or set `AZURE_AI_CHAT_URL`)                     |
| `AZURE_AI_CHAT_URL`    | optional — full URL incl. `?api-version=…`                |
| `AZURE_AI_KEY`         | required                                                  |
| `AZURE_AI_MODEL`       | `gpt-4o` — set to your deployment / Foundry model name    |

## Routes

| route          | role                                              |
| -------------- | ------------------------------------------------- |
| `/`            | Intake form (idea + locality)                     |
| `/analyze`     | Feasibility verdict + pivots + approve action     |
| `/wizard`      | Budget + funding + entity → setup plan            |
| `POST /api/analyze` | LLM-backed feasibility analysis (JSON mode)  |
| `POST /api/wizard`  | LLM-backed setup plan generator (JSON mode)  |

## Notes for India

- All money is in ₹ (lakh / crore).
- Entity, scheme, and compliance suggestions are India-specific (Udyam, GST,
  Shop & Establishment, PMMY, Stand-Up India, PMEGP, CGTMSE, Mahila Udyam
  Nidhi, state schemes, etc.).
- The model is instructed to be brutally honest and to ground reasoning in
  locality (city + locality + PIN).
