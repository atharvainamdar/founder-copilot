/**
 * Minimal chat-completions client. Works with three deployment shapes:
 *
 *   1. OpenAI directly         — set OPENAI_API_KEY (and optionally OPENAI_MODEL).
 *   2. Azure OpenAI deployment — set AZURE_OPENAI_ENDPOINT (resource URL),
 *                                AZURE_OPENAI_DEPLOYMENT, AZURE_OPENAI_KEY.
 *   3. Azure AI Foundry models — set AZURE_AI_ENDPOINT (resource or project
 *                                URL) and AZURE_AI_KEY; AZURE_AI_MODEL is the
 *                                Foundry model name (e.g. "gpt-4o", "Kimi-K2.6").
 *
 * Precedence: OpenAI > Azure OpenAI > Azure AI Foundry. The first one fully
 * configured wins.
 *
 * Override the full URL with AZURE_AI_CHAT_URL if needed.
 */

import { z } from "zod";

const DEFAULT_AZURE_API_VERSION = "2024-05-01-preview";
const DEFAULT_AZURE_OPENAI_API_VERSION = "2024-12-01-preview";

type Provider = {
  url: string;
  headers: Record<string, string>;
  bodyExtras: Record<string, unknown>;
  model: string;
};

function resolveProvider(): Provider {
  // 1. OpenAI direct
  const openaiKey = process.env.OPENAI_API_KEY;
  if (openaiKey) {
    return {
      url: process.env.OPENAI_BASE_URL
        ? `${process.env.OPENAI_BASE_URL.replace(/\/$/, "")}/chat/completions`
        : "https://api.openai.com/v1/chat/completions",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${openaiKey}`,
      },
      bodyExtras: {},
      model: process.env.OPENAI_MODEL ?? "gpt-4o",
    };
  }

  // 2. Azure OpenAI deployment
  const azOpenAiEndpoint = process.env.AZURE_OPENAI_ENDPOINT;
  const azOpenAiDeployment = process.env.AZURE_OPENAI_DEPLOYMENT;
  const azOpenAiKey = process.env.AZURE_OPENAI_KEY;
  if (azOpenAiEndpoint && azOpenAiDeployment && azOpenAiKey) {
    const apiVersion =
      process.env.AZURE_OPENAI_API_VERSION ?? DEFAULT_AZURE_OPENAI_API_VERSION;
    const base = azOpenAiEndpoint.replace(/\/$/, "");
    return {
      url: `${base}/openai/deployments/${azOpenAiDeployment}/chat/completions?api-version=${apiVersion}`,
      headers: {
        "Content-Type": "application/json",
        "api-key": azOpenAiKey,
      },
      bodyExtras: {},
      model: azOpenAiDeployment,
    };
  }

  // 3. Azure AI Foundry models
  const aiKey = process.env.AZURE_AI_KEY;
  if (!aiKey) {
    throw new Error(
      "No AI provider configured. Set OPENAI_API_KEY, or AZURE_OPENAI_* vars, " +
        "or AZURE_AI_KEY + AZURE_AI_ENDPOINT.",
    );
  }
  let url = process.env.AZURE_AI_CHAT_URL;
  if (!url) {
    const base = process.env.AZURE_AI_ENDPOINT;
    if (!base) {
      throw new Error(
        "Azure AI not configured: set AZURE_AI_CHAT_URL or AZURE_AI_ENDPOINT.",
      );
    }
    const trimmed = base
      .replace(/\/api\/projects\/[^/]+\/?$/, "")
      .replace(/\/$/, "");
    url = `${trimmed}/models/chat/completions?api-version=${DEFAULT_AZURE_API_VERSION}`;
  }
  return {
    url,
    headers: {
      "Content-Type": "application/json",
      "api-key": aiKey,
      Authorization: `Bearer ${aiKey}`,
    },
    bodyExtras: {},
    model: process.env.AZURE_AI_MODEL ?? "gpt-4o",
  };
}

export type ChatMessage = {
  role: "system" | "user" | "assistant";
  content: string;
};

export type ChatOptions = {
  model?: string;
  temperature?: number;
  maxTokens?: number;
};

async function rawChat(messages: ChatMessage[], opts: ChatOptions = {}) {
  const provider = resolveProvider();
  const body = {
    ...provider.bodyExtras,
    model: opts.model ?? provider.model,
    messages,
    temperature: opts.temperature ?? 0.4,
    max_tokens: opts.maxTokens ?? 4000,
    response_format: { type: "json_object" as const },
  };

  const res = await fetch(provider.url, {
    method: "POST",
    headers: provider.headers,
    body: JSON.stringify(body),
  });

  if (!res.ok) {
    const text = await res.text();
    throw new Error(`AI provider ${res.status}: ${text.slice(0, 500)}`);
  }
  const data = (await res.json()) as {
    choices?: Array<{ message?: { content?: string } }>;
    error?: { message?: string };
  };
  if (data.error) {
    throw new Error(`AI error: ${data.error.message ?? "unknown"}`);
  }
  const content = data.choices?.[0]?.message?.content ?? "";
  if (!content) throw new Error("AI returned empty content");
  return content;
}

/**
 * Calls the model with a JSON-only system constraint and parses the response
 * with the supplied Zod schema. Retries once if parsing fails.
 */
export async function chatJSON<T>(
  schema: z.ZodType<T>,
  systemPrompt: string,
  userPrompt: string,
  opts: ChatOptions = {},
): Promise<T> {
  const messages: ChatMessage[] = [
    {
      role: "system",
      content:
        systemPrompt +
        "\n\nReturn ONLY a single JSON object. No prose, no markdown fences.",
    },
    { role: "user", content: userPrompt },
  ];

  let lastError: unknown = null;
  for (let attempt = 0; attempt < 2; attempt++) {
    const raw = await rawChat(messages, opts);
    const cleaned = stripJsonFence(raw);
    try {
      const parsed = JSON.parse(cleaned);
      return schema.parse(parsed);
    } catch (e) {
      lastError = e;
      // Echo the model's bad response back so it can correct its specific mistake.
      messages.push({ role: "assistant", content: raw });
      const detail = e instanceof Error ? e.message.slice(0, 400) : String(e);
      messages.push({
        role: "user",
        content:
          "Your previous response did not match the required JSON schema. " +
          `Validator said: ${detail}\n` +
          "Reply again with ONLY a valid JSON object that matches the schema.",
      });
    }
  }
  throw new Error(
    `Failed to parse JSON response after retries: ${String(lastError)}`,
  );
}

function stripJsonFence(s: string): string {
  const trimmed = s.trim();
  if (trimmed.startsWith("```")) {
    const inner = trimmed.replace(/^```(?:json)?\s*/i, "").replace(/```\s*$/, "");
    return inner.trim();
  }
  return trimmed;
}
