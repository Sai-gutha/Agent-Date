// Minimal provider-agnostic LLM client (Anthropic or OpenAI, whichever key is set).
export type ChatMsg = { role: "user" | "assistant"; content: string };

export function llmProvider(): "anthropic" | "openai" | null {
  if (process.env.ANTHROPIC_API_KEY) return "anthropic";
  if (process.env.OPENAI_API_KEY) return "openai";
  return null;
}

export async function complete(opts: {
  system: string;
  messages: ChatMsg[];
  maxTokens?: number;
  json?: boolean;
}): Promise<string> {
  const provider = llmProvider();
  if (!provider) throw new Error("NO_LLM_KEY");
  const maxTokens = opts.maxTokens ?? 1024;

  if (provider === "anthropic") {
    const res = await fetch("https://api.anthropic.com/v1/messages", {
      method: "POST",
      headers: {
        "content-type": "application/json",
        "x-api-key": process.env.ANTHROPIC_API_KEY!,
        "anthropic-version": "2023-06-01",
      },
      body: JSON.stringify({
        model: process.env.ANTHROPIC_MODEL || "claude-sonnet-5-5",
        max_tokens: maxTokens,
        system: opts.system,
        messages: opts.messages,
      }),
    });
    if (!res.ok) throw new Error(`Anthropic ${res.status}: ${(await res.text()).slice(0, 200)}`);
    const data = await res.json();
    return (data.content ?? []).map((c: { text?: string }) => c.text ?? "").join("");
  }

  const res = await fetch("https://api.openai.com/v1/chat/completions", {
    method: "POST",
    headers: {
      "content-type": "application/json",
      authorization: `Bearer ${process.env.OPENAI_API_KEY}`,
    },
    body: JSON.stringify({
      model: process.env.OPENAI_MODEL || "gpt-4o-mini",
      max_tokens: maxTokens,
      ...(opts.json ? { response_format: { type: "json_object" } } : {}),
      messages: [{ role: "system", content: opts.system }, ...opts.messages],
    }),
  });
  if (!res.ok) throw new Error(`OpenAI ${res.status}: ${(await res.text()).slice(0, 200)}`);
  const data = await res.json();
  return data.choices?.[0]?.message?.content ?? "";
}

/** Pull the first JSON object out of a model reply. */
export function parseJson<T = unknown>(text: string): T {
  const start = text.indexOf("{");
  const end = text.lastIndexOf("}");
  if (start < 0 || end < start) throw new Error("No JSON in model reply");
  return JSON.parse(text.slice(start, end + 1)) as T;
}
