import { createHighlighter, type Highlighter } from "shiki";
import path from "path";

const LANG_BY_EXT: Record<string, string> = {
  ts: "typescript",
  tsx: "tsx",
  js: "javascript",
  jsx: "jsx",
  mjs: "javascript",
  cjs: "javascript",
  py: "python",
  rb: "ruby",
  go: "go",
  rs: "rust",
  java: "java",
  kt: "kotlin",
  swift: "swift",
  c: "c",
  h: "c",
  cpp: "cpp",
  cc: "cpp",
  hpp: "cpp",
  cs: "csharp",
  php: "php",
  json: "json",
  yml: "yaml",
  yaml: "yaml",
  toml: "toml",
  md: "markdown",
  mdx: "mdx",
  html: "html",
  css: "css",
  scss: "scss",
  sh: "bash",
  bash: "bash",
  zsh: "bash",
  sql: "sql",
  dockerfile: "dockerfile",
  vue: "vue",
  svelte: "svelte",
  xml: "xml",
};

export function detectLang(filePath: string): string {
  const base = path.basename(filePath).toLowerCase();
  if (base === "dockerfile") return "dockerfile";
  if (base.endsWith(".env") || base === ".env") return "bash";
  const ext = path.extname(filePath).slice(1).toLowerCase();
  return LANG_BY_EXT[ext] ?? "text";
}

let _highlighter: Promise<Highlighter> | null = null;
export function getHighlighter() {
  if (!_highlighter) {
    _highlighter = createHighlighter({
      themes: ["github-dark-default", "github-light"],
      langs: Object.values(LANG_BY_EXT),
    });
  }
  return _highlighter;
}

export async function highlightCode(code: string, lang: string): Promise<string> {
  const h = await getHighlighter();
  const loaded = h.getLoadedLanguages();
  const useLang = loaded.includes(lang) ? lang : "text";
  return h.codeToHtml(code, {
    lang: useLang,
    themes: { dark: "github-dark-default", light: "github-light" },
    defaultColor: false,
  });
}
