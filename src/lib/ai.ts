import OpenAI from "openai";

let client: OpenAI | null = null;

function apiKey(): string | undefined {
  return process.env.AI_API_KEY || process.env.OPENAI_API_KEY || process.env.GROQ_API_KEY;
}

function baseURL(): string | undefined {
  if (process.env.AI_BASE_URL) return process.env.AI_BASE_URL;
  if (process.env.OPENAI_BASE_URL) return process.env.OPENAI_BASE_URL;
  if (process.env.GROQ_API_KEY && !process.env.OPENAI_API_KEY) {
    return "https://api.groq.com/openai/v1";
  }
  return undefined;
}

function getClient(): OpenAI | null {
  const key = apiKey();
  if (!key) return null;
  if (!client) client = new OpenAI({ apiKey: key, baseURL: baseURL() });
  return client;
}

export function aiEnabled(): boolean {
  return !!apiKey();
}

function defaultModel(): string {
  if (process.env.AI_MODEL) return process.env.AI_MODEL;
  if (process.env.OPENAI_MODEL) return process.env.OPENAI_MODEL;
  if (process.env.GROQ_API_KEY && !process.env.OPENAI_API_KEY) {
    return "llama-3.3-70b-versatile";
  }
  return "gpt-4o-mini";
}

const MODEL = defaultModel();

export async function summarizePR(opts: {
  title: string;
  body: string;
  diff: string;
  files: { path: string; additions: number; deletions: number }[];
}): Promise<string> {
  const c = getClient();
  if (!c) return "";
  const truncatedDiff = opts.diff.length > 25_000 ? opts.diff.slice(0, 25_000) + "\n... (diff truncated)" : opts.diff;
  const fileSummary = opts.files
    .slice(0, 50)
    .map((f) => `- ${f.path} (+${f.additions}/-${f.deletions})`)
    .join("\n");
  const prompt = `You are an expert code reviewer. Summarize this pull request concisely for a busy reviewer.

Title: ${opts.title}
Description: ${opts.body || "(empty)"}

Files changed:
${fileSummary}

Diff:
\`\`\`
${truncatedDiff}
\`\`\`

Output 3-6 short bullet points covering: what changed, why (if inferrable), notable risks, and anything reviewers should focus on. Be terse, no fluff.`;
  const resp = await c.chat.completions.create({
    model: MODEL,
    messages: [{ role: "user", content: prompt }],
    temperature: 0.3,
  });
  return resp.choices[0]?.message?.content?.trim() ?? "";
}

export async function reviewPR(opts: {
  title: string;
  diff: string;
  files: { path: string; additions: number; deletions: number }[];
}): Promise<string> {
  const c = getClient();
  if (!c) return "";
  const truncated = opts.diff.length > 30_000 ? opts.diff.slice(0, 30_000) + "\n... (truncated)" : opts.diff;
  const prompt = `You are a senior code reviewer. Review this PR and produce a constructive review in markdown.

Title: ${opts.title}

Diff:
\`\`\`diff
${truncated}
\`\`\`

Output sections in markdown:
### Overview
(1-2 sentences)

### Issues
(bullets, severity in brackets like [high]/[medium]/[low]; cite file:line; skip if none)

### Suggestions
(bullets, optional)

### Tests
(what's tested, what's missing)

Be specific and concrete. Skip empty sections. No filler.`;
  const resp = await c.chat.completions.create({
    model: MODEL,
    messages: [{ role: "user", content: prompt }],
    temperature: 0.2,
  });
  return resp.choices[0]?.message?.content?.trim() ?? "";
}

export async function generateCommitMessage(diff: string): Promise<string> {
  const c = getClient();
  if (!c) return "";
  const truncated = diff.length > 15_000 ? diff.slice(0, 15_000) + "\n... (truncated)" : diff;
  const prompt = `Generate a single conventional commit message for this diff. Just the message, no explanation, no markdown.

\`\`\`diff
${truncated}
\`\`\``;
  const resp = await c.chat.completions.create({
    model: MODEL,
    messages: [{ role: "user", content: prompt }],
    temperature: 0.4,
  });
  return resp.choices[0]?.message?.content?.trim().split("\n")[0] ?? "";
}

export async function triageIssue(opts: {
  title: string;
  body: string;
}): Promise<{ labels: string[]; summary: string } | null> {
  const c = getClient();
  if (!c) return null;
  const prompt = `Triage this issue. Output JSON: {"labels": [...], "summary": "..."}. Labels should be lowercase, common kinds like: bug, feature, question, docs, performance, security, ui, infra, good-first-issue. Summary in 1 sentence.

Title: ${opts.title}
Body: ${opts.body || "(empty)"}`;
  const resp = await c.chat.completions.create({
    model: MODEL,
    messages: [{ role: "user", content: prompt }],
    temperature: 0.2,
    response_format: { type: "json_object" },
  });
  const txt = resp.choices[0]?.message?.content?.trim() ?? "{}";
  try {
    const parsed = JSON.parse(txt);
    return { labels: Array.isArray(parsed.labels) ? parsed.labels : [], summary: String(parsed.summary || "") };
  } catch {
    return null;
  }
}
