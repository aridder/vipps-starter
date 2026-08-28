// A small syntax highlighter for the code shown on the site.
//
// Deliberately hand-rolled rather than Shiki or Prism: the whole job is a few
// hundred lines of TypeScript and shell in fixed snippets, a real highlighter
// would add hundreds of kilobytes to a starter people are meant to copy, and
// this runs on the server so it costs the visitor nothing.
//
// It is a single-pass scanner, not a stack of regex replaces — those break the
// moment a keyword appears inside a string or a comment.

export type TokenKind =
  | "plain"
  | "comment"
  | "string"
  | "keyword"
  | "number"
  | "fn"
  | "punct";

export type Token = { text: string; kind: TokenKind };

const KEYWORDS = new Set([
  "const", "let", "var", "function", "return", "await", "async", "if", "else",
  "for", "while", "continue", "break", "new", "throw", "try", "catch",
  "finally", "export", "import", "from", "class", "extends", "typeof",
  "instanceof", "in", "of", "this", "true", "false", "null", "undefined",
  "type", "interface", "as", "satisfies", "default",
]);

const IDENT_START = /[A-Za-z_$]/;
const IDENT = /[A-Za-z0-9_$]/;

export function tokenize(code: string): Token[] {
  const out: Token[] = [];
  let i = 0;
  let buf = "";

  const flush = () => {
    if (buf) {
      out.push({ text: buf, kind: "plain" });
      buf = "";
    }
  };
  const push = (text: string, kind: TokenKind) => {
    flush();
    out.push({ text, kind });
  };

  while (i < code.length) {
    const c = code[i]!;
    const next = code[i + 1];

    // Line comment
    if (c === "/" && next === "/") {
      let j = i;
      while (j < code.length && code[j] !== "\n") j++;
      push(code.slice(i, j), "comment");
      i = j;
      continue;
    }

    // Block comment
    if (c === "/" && next === "*") {
      const end = code.indexOf("*/", i + 2);
      const j = end === -1 ? code.length : end + 2;
      push(code.slice(i, j), "comment");
      i = j;
      continue;
    }

    // Shell comment — only at the start of a line, so a URL's # survives
    if (c === "#" && (i === 0 || code[i - 1] === "\n")) {
      let j = i;
      while (j < code.length && code[j] !== "\n") j++;
      push(code.slice(i, j), "comment");
      i = j;
      continue;
    }

    // Strings, including template literals. Interpolations are left inside the
    // string span: highlighting them properly needs a real parser, and getting
    // it half-right looks worse than leaving it whole.
    if (c === '"' || c === "'" || c === "`") {
      let j = i + 1;
      while (j < code.length) {
        if (code[j] === "\\") {
          j += 2;
          continue;
        }
        if (code[j] === c) {
          j++;
          break;
        }
        // An unterminated single-quoted string should not swallow the file.
        if (c !== "`" && code[j] === "\n") break;
        j++;
      }
      push(code.slice(i, j), "string");
      i = j;
      continue;
    }

    // Numbers
    if (/[0-9]/.test(c) && !(buf && IDENT.test(buf[buf.length - 1]!))) {
      let j = i;
      while (j < code.length && /[0-9_.a-fxA-FX]/.test(code[j]!)) j++;
      push(code.slice(i, j), "number");
      i = j;
      continue;
    }

    // Identifiers, keywords and call sites
    if (IDENT_START.test(c)) {
      let j = i;
      while (j < code.length && IDENT.test(code[j]!)) j++;
      const word = code.slice(i, j);
      let k = j;
      while (k < code.length && code[k] === " ") k++;
      if (KEYWORDS.has(word)) push(word, "keyword");
      else if (code[k] === "(") push(word, "fn");
      else {
        buf += word;
      }
      i = j;
      continue;
    }

    if (/[{}()[\];,.:<>=+\-*/&|?!]/.test(c)) {
      push(c, "punct");
      i++;
      continue;
    }

    buf += c;
    i++;
  }
  flush();
  return out;
}

/** Tailwind text colours per token kind, tuned for the dark code surface. */
export const TOKEN_CLASS: Record<TokenKind, string> = {
  plain: "",
  comment: "text-stone-500 italic",
  string: "text-emerald-300",
  keyword: "text-orange-300",
  number: "text-amber-200",
  fn: "text-sky-300",
  punct: "text-stone-400",
};
