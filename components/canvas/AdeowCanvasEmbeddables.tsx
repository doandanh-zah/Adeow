"use client";

import { Fragment, useEffect, useMemo, useRef, useState } from "react";
import type {
  CSSProperties,
  PointerEvent as ReactPointerEvent,
} from "react";
import type { CanvasTheme } from "@/lib/canvas-core/ui";

export type AdeowSheetData = {
  cells: string[][];
  colWidths: number[];
  rowHeights: number[];
};

export type AdeowCodeBlockData = {
  code: string;
  filename?: string;
  language: CodeLanguage;
};

export type AdeowStickyNoteData = {
  author: string;
  color: string;
  text: string;
};

export type AdeowEmbeddableData =
  | {
      kind: "sheet";
      sheet: AdeowSheetData;
    }
  | {
      codeBlock: AdeowCodeBlockData;
      kind: "codeblock";
    }
  | {
      kind: "sticky";
      sticky: AdeowStickyNoteData;
    };

type AdeowCanvasEmbeddableProps = {
  element: {
    customData?: Record<string, unknown>;
    height: number;
    id: string;
    width: number;
  };
  onChange: (
    elementId: string,
    data: AdeowEmbeddableData,
    size?: { height: number; width: number },
  ) => void;
  theme: CanvasTheme;
};

export type CodeLanguage =
  | "typescript"
  | "javascript"
  | "python"
  | "java"
  | "csharp"
  | "cpp"
  | "c"
  | "go"
  | "rust"
  | "php"
  | "ruby"
  | "swift"
  | "kotlin"
  | "sql"
  | "shell"
  | "css"
  | "html"
  | "xml"
  | "json"
  | "yaml"
  | "markdown"
  | "dart"
  | "lua"
  | "r"
  | "text";

export const codeLanguages: Array<{ label: string; value: CodeLanguage }> = [
  { label: "TypeScript", value: "typescript" },
  { label: "JavaScript", value: "javascript" },
  { label: "Python", value: "python" },
  { label: "Java", value: "java" },
  { label: "C#", value: "csharp" },
  { label: "C++", value: "cpp" },
  { label: "C", value: "c" },
  { label: "Go", value: "go" },
  { label: "Rust", value: "rust" },
  { label: "PHP", value: "php" },
  { label: "Ruby", value: "ruby" },
  { label: "Swift", value: "swift" },
  { label: "Kotlin", value: "kotlin" },
  { label: "SQL", value: "sql" },
  { label: "Shell", value: "shell" },
  { label: "CSS", value: "css" },
  { label: "HTML", value: "html" },
  { label: "XML", value: "xml" },
  { label: "JSON", value: "json" },
  { label: "YAML", value: "yaml" },
  { label: "Markdown", value: "markdown" },
  { label: "Dart", value: "dart" },
  { label: "Lua", value: "lua" },
  { label: "R", value: "r" },
  { label: "Plain text", value: "text" },
];

const MIN_SHEET_COL_WIDTH = 96;
const MIN_SHEET_ROW_HEIGHT = 38;
const SHEET_CHROME_WIDTH = 44;
const SHEET_CHROME_HEIGHT = 44;
const CODE_MIN_WIDTH = 420;
const CODE_MAX_WIDTH = 980;
const CODE_MIN_HEIGHT = 240;
const CODE_MAX_HEIGHT = 760;
const STICKY_NOTE_WIDTH = 296;
const STICKY_NOTE_HEIGHT = 232;

type CodeTokenKind =
  | "attribute"
  | "builtin"
  | "comment"
  | "constant"
  | "decorator"
  | "function"
  | "heading"
  | "keyword"
  | "number"
  | "operator"
  | "plain"
  | "property"
  | "string"
  | "tag"
  | "type";

type CodeToken = {
  kind: CodeTokenKind;
  value: string;
};

type RawCodeToken = {
  kind: "comment" | "number" | "operator" | "plain" | "string" | "word";
  value: string;
};

type LanguageDefinition = {
  blockComments?: Array<[string, string]>;
  builtins?: string[];
  caseInsensitive?: boolean;
  constants?: string[];
  cssLike?: boolean;
  jsonLike?: boolean;
  keywords: string[];
  lineComments?: string[];
  markdown?: boolean;
  markup?: boolean;
  typeKeywords?: string[];
};

const jsLikeKeywords = [
  "abstract",
  "as",
  "async",
  "await",
  "break",
  "case",
  "catch",
  "class",
  "const",
  "continue",
  "debugger",
  "declare",
  "default",
  "delete",
  "do",
  "else",
  "enum",
  "export",
  "extends",
  "finally",
  "for",
  "from",
  "function",
  "get",
  "if",
  "implements",
  "import",
  "in",
  "infer",
  "instanceof",
  "interface",
  "is",
  "keyof",
  "let",
  "module",
  "namespace",
  "new",
  "of",
  "private",
  "protected",
  "public",
  "readonly",
  "return",
  "satisfies",
  "set",
  "static",
  "super",
  "switch",
  "this",
  "throw",
  "try",
  "type",
  "typeof",
  "var",
  "void",
  "while",
  "with",
  "yield",
];

const cLikeKeywords = [
  "auto",
  "bool",
  "break",
  "case",
  "catch",
  "char",
  "class",
  "const",
  "constexpr",
  "continue",
  "default",
  "delete",
  "do",
  "double",
  "else",
  "enum",
  "explicit",
  "extern",
  "float",
  "for",
  "friend",
  "goto",
  "if",
  "inline",
  "int",
  "long",
  "namespace",
  "new",
  "operator",
  "private",
  "protected",
  "public",
  "return",
  "short",
  "signed",
  "sizeof",
  "static",
  "struct",
  "switch",
  "template",
  "this",
  "throw",
  "try",
  "typedef",
  "typename",
  "union",
  "unsigned",
  "using",
  "virtual",
  "void",
  "volatile",
  "while",
];

const languageDefinitions: Record<CodeLanguage, LanguageDefinition> = {
  typescript: {
    blockComments: [["/*", "*/"]],
    builtins: [
      "Array",
      "Boolean",
      "Date",
      "Map",
      "Math",
      "Number",
      "Object",
      "Promise",
      "Record",
      "Set",
      "String",
      "console",
      "document",
      "window",
    ],
    constants: ["false", "null", "true", "undefined"],
    keywords: jsLikeKeywords,
    lineComments: ["//"],
    typeKeywords: ["class", "enum", "extends", "implements", "interface", "new", "type"],
  },
  javascript: {
    blockComments: [["/*", "*/"]],
    builtins: [
      "Array",
      "Boolean",
      "Date",
      "Map",
      "Math",
      "Number",
      "Object",
      "Promise",
      "Set",
      "String",
      "console",
      "document",
      "window",
    ],
    constants: ["false", "null", "true", "undefined"],
    keywords: jsLikeKeywords.filter(
      (keyword) =>
        !["declare", "infer", "interface", "keyof", "namespace", "satisfies"].includes(
          keyword,
        ),
    ),
    lineComments: ["//"],
    typeKeywords: ["class", "extends", "new"],
  },
  python: {
    builtins: [
      "dict",
      "enumerate",
      "float",
      "int",
      "len",
      "list",
      "print",
      "range",
      "set",
      "str",
      "super",
      "tuple",
      "type",
    ],
    constants: ["False", "None", "True"],
    keywords: [
      "and",
      "as",
      "async",
      "await",
      "break",
      "class",
      "continue",
      "def",
      "del",
      "elif",
      "else",
      "except",
      "finally",
      "for",
      "from",
      "global",
      "if",
      "import",
      "in",
      "is",
      "lambda",
      "nonlocal",
      "not",
      "or",
      "pass",
      "raise",
      "return",
      "try",
      "while",
      "with",
      "yield",
    ],
    lineComments: ["#"],
    typeKeywords: ["class"],
  },
  java: {
    blockComments: [["/*", "*/"]],
    builtins: ["Boolean", "Double", "Integer", "List", "Long", "Map", "Set", "String", "System"],
    constants: ["false", "null", "true"],
    keywords: [
      "abstract",
      "assert",
      "boolean",
      "break",
      "byte",
      "case",
      "catch",
      "char",
      "class",
      "const",
      "continue",
      "default",
      "do",
      "double",
      "else",
      "enum",
      "extends",
      "final",
      "finally",
      "float",
      "for",
      "if",
      "implements",
      "import",
      "instanceof",
      "int",
      "interface",
      "long",
      "new",
      "package",
      "private",
      "protected",
      "public",
      "return",
      "short",
      "static",
      "strictfp",
      "super",
      "switch",
      "synchronized",
      "this",
      "throw",
      "throws",
      "transient",
      "try",
      "void",
      "volatile",
      "while",
    ],
    lineComments: ["//"],
    typeKeywords: ["class", "enum", "extends", "implements", "interface", "new"],
  },
  csharp: {
    blockComments: [["/*", "*/"]],
    builtins: ["Console", "DateTime", "Dictionary", "IEnumerable", "List", "Math", "String", "Task"],
    constants: ["false", "null", "true"],
    keywords: [
      "abstract",
      "async",
      "await",
      "base",
      "bool",
      "break",
      "case",
      "catch",
      "class",
      "const",
      "continue",
      "decimal",
      "default",
      "delegate",
      "do",
      "double",
      "else",
      "enum",
      "event",
      "explicit",
      "extern",
      "finally",
      "fixed",
      "float",
      "for",
      "foreach",
      "if",
      "implicit",
      "in",
      "int",
      "interface",
      "internal",
      "is",
      "lock",
      "namespace",
      "new",
      "object",
      "operator",
      "out",
      "override",
      "params",
      "private",
      "protected",
      "public",
      "readonly",
      "record",
      "ref",
      "return",
      "sealed",
      "static",
      "string",
      "struct",
      "switch",
      "this",
      "throw",
      "try",
      "typeof",
      "using",
      "var",
      "virtual",
      "void",
      "while",
      "yield",
    ],
    lineComments: ["//"],
    typeKeywords: ["class", "enum", "interface", "new", "record", "struct"],
  },
  cpp: {
    blockComments: [["/*", "*/"]],
    builtins: ["std", "cout", "cin", "string", "vector", "map", "set", "unique_ptr", "shared_ptr"],
    constants: ["false", "nullptr", "true"],
    keywords: cLikeKeywords,
    lineComments: ["//"],
    typeKeywords: ["class", "enum", "namespace", "new", "struct", "typename"],
  },
  c: {
    blockComments: [["/*", "*/"]],
    builtins: ["FILE", "printf", "scanf", "size_t", "stderr", "stdin", "stdout"],
    constants: ["NULL", "false", "true"],
    keywords: cLikeKeywords.filter(
      (keyword) => !["catch", "class", "delete", "friend", "namespace", "new", "private", "protected", "public", "template", "this", "throw", "try", "typename", "virtual"].includes(keyword),
    ),
    lineComments: ["//"],
    typeKeywords: ["enum", "struct", "typedef", "union"],
  },
  go: {
    builtins: ["append", "cap", "close", "copy", "delete", "fmt", "len", "make", "new", "panic", "print", "println"],
    constants: ["false", "iota", "nil", "true"],
    keywords: [
      "break",
      "case",
      "chan",
      "const",
      "continue",
      "default",
      "defer",
      "else",
      "fallthrough",
      "for",
      "func",
      "go",
      "goto",
      "if",
      "import",
      "interface",
      "map",
      "package",
      "range",
      "return",
      "select",
      "struct",
      "switch",
      "type",
      "var",
    ],
    lineComments: ["//"],
    blockComments: [["/*", "*/"]],
    typeKeywords: ["interface", "struct", "type"],
  },
  rust: {
    blockComments: [["/*", "*/"]],
    builtins: ["Box", "Err", "Ok", "Option", "Result", "Some", "String", "Vec", "println"],
    constants: ["false", "None", "true"],
    keywords: [
      "as",
      "async",
      "await",
      "break",
      "const",
      "continue",
      "crate",
      "dyn",
      "else",
      "enum",
      "extern",
      "false",
      "fn",
      "for",
      "if",
      "impl",
      "in",
      "let",
      "loop",
      "match",
      "mod",
      "move",
      "mut",
      "pub",
      "ref",
      "return",
      "self",
      "static",
      "struct",
      "trait",
      "true",
      "type",
      "unsafe",
      "use",
      "where",
      "while",
    ],
    lineComments: ["//"],
    typeKeywords: ["enum", "impl", "struct", "trait", "type"],
  },
  php: {
    blockComments: [["/*", "*/"]],
    builtins: ["array", "count", "echo", "isset", "json_encode", "print_r", "var_dump"],
    constants: ["FALSE", "NULL", "TRUE", "false", "null", "true"],
    keywords: [
      "abstract",
      "and",
      "as",
      "break",
      "case",
      "catch",
      "class",
      "clone",
      "const",
      "continue",
      "declare",
      "default",
      "do",
      "echo",
      "else",
      "elseif",
      "extends",
      "final",
      "finally",
      "fn",
      "for",
      "foreach",
      "function",
      "global",
      "if",
      "implements",
      "interface",
      "namespace",
      "new",
      "or",
      "private",
      "protected",
      "public",
      "return",
      "static",
      "switch",
      "throw",
      "trait",
      "try",
      "use",
      "var",
      "while",
      "xor",
    ],
    lineComments: ["//", "#"],
    typeKeywords: ["class", "extends", "implements", "interface", "new", "trait"],
  },
  ruby: {
    builtins: ["Array", "Hash", "Integer", "Kernel", "String", "puts", "require"],
    constants: ["false", "nil", "true"],
    keywords: [
      "BEGIN",
      "END",
      "alias",
      "and",
      "begin",
      "break",
      "case",
      "class",
      "def",
      "defined?",
      "do",
      "else",
      "elsif",
      "end",
      "ensure",
      "for",
      "if",
      "in",
      "module",
      "next",
      "not",
      "or",
      "redo",
      "rescue",
      "retry",
      "return",
      "self",
      "super",
      "then",
      "undef",
      "unless",
      "until",
      "when",
      "while",
      "yield",
    ],
    lineComments: ["#"],
    typeKeywords: ["class", "module"],
  },
  swift: {
    builtins: ["Array", "Bool", "Dictionary", "Double", "Int", "Optional", "Set", "String", "print"],
    constants: ["false", "nil", "true"],
    keywords: [
      "actor",
      "as",
      "associatedtype",
      "async",
      "await",
      "break",
      "case",
      "catch",
      "class",
      "continue",
      "defer",
      "do",
      "else",
      "enum",
      "extension",
      "fallthrough",
      "false",
      "for",
      "func",
      "guard",
      "if",
      "import",
      "in",
      "init",
      "let",
      "nil",
      "private",
      "protocol",
      "public",
      "repeat",
      "return",
      "self",
      "static",
      "struct",
      "switch",
      "throw",
      "throws",
      "true",
      "try",
      "typealias",
      "var",
      "where",
      "while",
    ],
    lineComments: ["//"],
    blockComments: [["/*", "*/"]],
    typeKeywords: ["actor", "class", "enum", "extension", "protocol", "struct", "typealias"],
  },
  kotlin: {
    blockComments: [["/*", "*/"]],
    builtins: ["Array", "Boolean", "Double", "Int", "List", "Map", "Set", "String", "println"],
    constants: ["false", "null", "true"],
    keywords: [
      "as",
      "break",
      "class",
      "continue",
      "data",
      "do",
      "else",
      "false",
      "for",
      "fun",
      "if",
      "in",
      "interface",
      "is",
      "null",
      "object",
      "override",
      "package",
      "private",
      "protected",
      "public",
      "return",
      "sealed",
      "super",
      "this",
      "throw",
      "true",
      "try",
      "typealias",
      "val",
      "var",
      "when",
      "while",
    ],
    lineComments: ["//"],
    typeKeywords: ["class", "data", "interface", "object", "typealias"],
  },
  sql: {
    builtins: ["AVG", "COALESCE", "COUNT", "DATE", "MAX", "MIN", "NOW", "SUM"],
    caseInsensitive: true,
    constants: ["FALSE", "NULL", "TRUE"],
    keywords: [
      "ALTER",
      "AND",
      "AS",
      "ASC",
      "BETWEEN",
      "BY",
      "CASE",
      "CREATE",
      "DELETE",
      "DESC",
      "DISTINCT",
      "DROP",
      "ELSE",
      "END",
      "EXISTS",
      "FROM",
      "GROUP",
      "HAVING",
      "IN",
      "INNER",
      "INSERT",
      "INTO",
      "IS",
      "JOIN",
      "LEFT",
      "LIKE",
      "LIMIT",
      "NOT",
      "ON",
      "OR",
      "ORDER",
      "OUTER",
      "RIGHT",
      "SELECT",
      "SET",
      "TABLE",
      "THEN",
      "UNION",
      "UPDATE",
      "VALUES",
      "WHEN",
      "WHERE",
      "WITH",
    ],
    lineComments: ["--"],
    blockComments: [["/*", "*/"]],
  },
  shell: {
    builtins: ["awk", "cat", "cd", "curl", "echo", "grep", "jq", "printf", "rg", "sed"],
    constants: ["false", "true"],
    keywords: [
      "case",
      "do",
      "done",
      "elif",
      "else",
      "esac",
      "export",
      "fi",
      "for",
      "function",
      "if",
      "in",
      "local",
      "readonly",
      "return",
      "set",
      "then",
      "while",
    ],
    lineComments: ["#"],
  },
  css: {
    blockComments: [["/*", "*/"]],
    builtins: ["calc", "clamp", "hsl", "hsla", "linear-gradient", "minmax", "rgb", "rgba", "url", "var"],
    constants: ["auto", "currentColor", "inherit", "none", "transparent", "unset"],
    cssLike: true,
    keywords: [
      "@container",
      "@font-face",
      "@import",
      "@keyframes",
      "@media",
      "@supports",
      "from",
      "important",
      "to",
    ],
  },
  html: {
    blockComments: [["<!--", "-->"]],
    constants: ["false", "true"],
    keywords: [],
    markup: true,
  },
  xml: {
    blockComments: [["<!--", "-->"]],
    constants: ["false", "true"],
    keywords: [],
    markup: true,
  },
  json: {
    constants: ["false", "null", "true"],
    jsonLike: true,
    keywords: [],
  },
  yaml: {
    constants: ["false", "null", "true"],
    keywords: [],
    lineComments: ["#"],
  },
  markdown: {
    keywords: [],
    markdown: true,
  },
  dart: {
    blockComments: [["/*", "*/"]],
    builtins: ["DateTime", "Future", "List", "Map", "Set", "String", "double", "int", "print"],
    constants: ["false", "null", "true"],
    keywords: [
      "abstract",
      "as",
      "async",
      "await",
      "break",
      "case",
      "catch",
      "class",
      "const",
      "continue",
      "default",
      "do",
      "else",
      "enum",
      "extends",
      "factory",
      "false",
      "final",
      "finally",
      "for",
      "if",
      "implements",
      "import",
      "in",
      "interface",
      "is",
      "late",
      "library",
      "new",
      "null",
      "part",
      "return",
      "static",
      "super",
      "switch",
      "this",
      "throw",
      "true",
      "try",
      "var",
      "void",
      "while",
      "with",
      "yield",
    ],
    lineComments: ["//"],
    typeKeywords: ["class", "enum", "extends", "implements", "new"],
  },
  lua: {
    builtins: ["ipairs", "math", "pairs", "print", "require", "string", "table"],
    constants: ["false", "nil", "true"],
    keywords: [
      "and",
      "break",
      "do",
      "else",
      "elseif",
      "end",
      "false",
      "for",
      "function",
      "if",
      "in",
      "local",
      "nil",
      "not",
      "or",
      "repeat",
      "return",
      "then",
      "true",
      "until",
      "while",
    ],
    lineComments: ["--"],
  },
  r: {
    builtins: ["c", "data.frame", "library", "list", "mean", "print", "summary"],
    constants: ["FALSE", "NA", "NULL", "TRUE"],
    keywords: [
      "break",
      "else",
      "for",
      "function",
      "if",
      "in",
      "next",
      "repeat",
      "return",
      "while",
    ],
    lineComments: ["#"],
  },
  text: {
    keywords: [],
  },
};

function isAdeowEmbeddableData(value: unknown): value is AdeowEmbeddableData {
  if (!value || typeof value !== "object") {
    return false;
  }

  const data = value as Partial<AdeowEmbeddableData>;
  return (
    data.kind === "sheet" ||
    data.kind === "codeblock" ||
    data.kind === "sticky"
  );
}

export function getAdeowEmbeddableData(
  customData?: Record<string, unknown>,
): AdeowEmbeddableData | null {
  const value = customData?.adeowEmbeddable;
  return isAdeowEmbeddableData(value) ? value : null;
}

export function createInitialSheetData(): AdeowEmbeddableData {
  return {
    kind: "sheet",
    sheet: {
      cells: [
        ["Task", "Owner", "Status"],
        ["Canvas toolbar", "ADEOW", "In progress"],
        ["Backend", "", ""],
      ],
      colWidths: [160, 140, 150],
      rowHeights: [42, 42, 42],
    },
  };
}

export function createCodeBlockData({
  code = "",
  filename,
  language = "typescript",
}: Partial<AdeowCodeBlockData> = {}): AdeowEmbeddableData {
  return {
    codeBlock: {
      code,
      filename,
      language,
    },
    kind: "codeblock",
  };
}

export function createStickyNoteData({
  author,
  color,
  text = "",
}: AdeowStickyNoteData): AdeowEmbeddableData {
  return {
    kind: "sticky",
    sticky: {
      author,
      color,
      text,
    },
  };
}

export function inferCodeLanguage(filename: string): CodeLanguage {
  const extension = filename.split(".").pop()?.toLowerCase();

  if (extension === "ts" || extension === "tsx") {
    return "typescript";
  }
  if (
    extension === "js" ||
    extension === "jsx" ||
    extension === "mjs" ||
    extension === "cjs"
  ) {
    return "javascript";
  }
  if (extension === "py") {
    return "python";
  }
  if (extension === "java") {
    return "java";
  }
  if (extension === "cs") {
    return "csharp";
  }
  if (
    extension === "cpp" ||
    extension === "cc" ||
    extension === "cxx" ||
    extension === "hpp" ||
    extension === "hh" ||
    extension === "hxx"
  ) {
    return "cpp";
  }
  if (extension === "c" || extension === "h") {
    return "c";
  }
  if (extension === "go") {
    return "go";
  }
  if (extension === "rs") {
    return "rust";
  }
  if (extension === "php") {
    return "php";
  }
  if (extension === "rb") {
    return "ruby";
  }
  if (extension === "swift") {
    return "swift";
  }
  if (extension === "kt" || extension === "kts") {
    return "kotlin";
  }
  if (extension === "sql") {
    return "sql";
  }
  if (
    extension === "sh" ||
    extension === "bash" ||
    extension === "zsh" ||
    extension === "fish"
  ) {
    return "shell";
  }
  if (extension === "css" || extension === "scss" || extension === "sass") {
    return "css";
  }
  if (extension === "html" || extension === "htm") {
    return "html";
  }
  if (extension === "xml" || extension === "svg") {
    return "xml";
  }
  if (extension === "json") {
    return "json";
  }
  if (extension === "yaml" || extension === "yml") {
    return "yaml";
  }
  if (extension === "md" || extension === "mdx") {
    return "markdown";
  }
  if (extension === "dart") {
    return "dart";
  }
  if (extension === "lua") {
    return "lua";
  }
  if (extension === "r") {
    return "r";
  }

  return "text";
}

export function estimateCodeBlockSize(code: string) {
  const lines = code ? code.split("\n") : [""];
  const longestLine = lines.reduce(
    (longest, line) => Math.max(longest, line.length),
    0,
  );

  return {
    width: Math.min(
      CODE_MAX_WIDTH,
      Math.max(CODE_MIN_WIDTH, longestLine * 8.5 + 160),
    ),
    height: Math.min(
      CODE_MAX_HEIGHT,
      Math.max(CODE_MIN_HEIGHT, lines.length * 24 + 112),
    ),
  };
}

export function estimateSheetSize(sheet: AdeowSheetData) {
  return {
    width:
      SHEET_CHROME_WIDTH +
      sheet.colWidths.reduce((total, width) => total + width, 0),
    height:
      SHEET_CHROME_HEIGHT +
      sheet.rowHeights.reduce((total, height) => total + height, 0),
  };
}

export function estimateStickyNoteSize() {
  return {
    height: STICKY_NOTE_HEIGHT,
    width: STICKY_NOTE_WIDTH,
  };
}

function parseHexColor(color: string) {
  const normalized = color.trim().replace(/^#/, "");

  if (normalized.length !== 3 && normalized.length !== 6) {
    return null;
  }

  const expanded =
    normalized.length === 3
      ? normalized
          .split("")
          .map((char) => `${char}${char}`)
          .join("")
      : normalized;

  const red = Number.parseInt(expanded.slice(0, 2), 16);
  const green = Number.parseInt(expanded.slice(2, 4), 16);
  const blue = Number.parseInt(expanded.slice(4, 6), 16);

  if ([red, green, blue].some((channel) => Number.isNaN(channel))) {
    return null;
  }

  return { blue, green, red };
}

function getStickyInkColor(color: string) {
  const parsed = parseHexColor(color);

  if (!parsed) {
    return "#172031";
  }

  const channels = [parsed.red, parsed.green, parsed.blue].map((channel) => {
    const normalized = channel / 255;

    return normalized <= 0.03928
      ? normalized / 12.92
      : ((normalized + 0.055) / 1.055) ** 2.4;
  });

  const luminance =
    channels[0] * 0.2126 + channels[1] * 0.7152 + channels[2] * 0.0722;

  return luminance < 0.42 ? "#f8fafc" : "#172031";
}

function getSheetWithCellValue(
  sheet: AdeowSheetData,
  rowIndex: number,
  colIndex: number,
  value: string,
): AdeowSheetData {
  const cells = sheet.cells.map((row) => [...row]);
  cells[rowIndex][colIndex] = value;

  const colWidths = [...sheet.colWidths];
  const rowHeights = [...sheet.rowHeights];
  const estimatedWidth = Math.max(MIN_SHEET_COL_WIDTH, value.length * 8 + 32);
  const lineCount = Math.max(1, value.split("\n").length);
  const estimatedHeight = Math.max(MIN_SHEET_ROW_HEIGHT, lineCount * 22 + 16);

  colWidths[colIndex] = Math.max(colWidths[colIndex], estimatedWidth);
  rowHeights[rowIndex] = Math.max(rowHeights[rowIndex], estimatedHeight);

  return {
    cells,
    colWidths,
    rowHeights,
  };
}

function normalizeSheet(sheet: AdeowSheetData): AdeowSheetData {
  const rows = Math.max(sheet.cells.length, 1);
  const cols = Math.max(...sheet.cells.map((row) => row.length), 1);
  const cells = Array.from({ length: rows }, (_, rowIndex) =>
    Array.from(
      { length: cols },
      (_, colIndex) => sheet.cells[rowIndex]?.[colIndex] ?? "",
    ),
  );

  return {
    cells,
    colWidths: Array.from(
      { length: cols },
      (_, index) => sheet.colWidths[index] ?? MIN_SHEET_COL_WIDTH,
    ),
    rowHeights: Array.from(
      { length: rows },
      (_, index) => sheet.rowHeights[index] ?? MIN_SHEET_ROW_HEIGHT,
    ),
  };
}

function getDefinitionSet(
  values: string[] | undefined,
  caseInsensitive?: boolean,
) {
  return new Set(
    (values ?? []).map((value) => (caseInsensitive ? value.toLowerCase() : value)),
  );
}

function normalizeWord(value: string, definition: LanguageDefinition) {
  const cleaned = value.startsWith("$") ? value.slice(1) : value;
  return definition.caseInsensitive ? cleaned.toLowerCase() : cleaned;
}

function isWhitespaceToken(token: RawCodeToken | undefined) {
  return !token || (token.kind === "plain" && /^\s+$/.test(token.value));
}

function getPreviousToken(tokens: RawCodeToken[], index: number) {
  for (let tokenIndex = index - 1; tokenIndex >= 0; tokenIndex -= 1) {
    if (!isWhitespaceToken(tokens[tokenIndex])) {
      return { index: tokenIndex, token: tokens[tokenIndex] };
    }
  }

  return null;
}

function getNextToken(tokens: RawCodeToken[], index: number) {
  for (let tokenIndex = index + 1; tokenIndex < tokens.length; tokenIndex += 1) {
    if (!isWhitespaceToken(tokens[tokenIndex])) {
      return { index: tokenIndex, token: tokens[tokenIndex] };
    }
  }

  return null;
}

function isWordStart(character: string, language: CodeLanguage) {
  return (
    /[A-Za-z_]/.test(character) ||
    character === "@" ||
    character === "$" ||
    (language === "php" && character === "\\")
  );
}

function isWordCharacter(character: string, language: CodeLanguage) {
  if (language === "css" || languageDefinitions[language].markup) {
    return /[A-Za-z0-9_$-]/.test(character);
  }

  if (language === "r") {
    return /[A-Za-z0-9_.$]/.test(character);
  }

  return /[A-Za-z0-9_$]/.test(character);
}

function matchLineComment(
  line: string,
  offset: number,
  definition: LanguageDefinition,
) {
  return definition.lineComments?.find((prefix) =>
    line.startsWith(prefix, offset),
  );
}

function matchBlockComment(
  line: string,
  offset: number,
  definition: LanguageDefinition,
) {
  return definition.blockComments?.find(([start]) => line.startsWith(start, offset));
}

function readStringToken(line: string, start: number) {
  const quote = line[start];
  let index = start + 1;

  if (
    (quote === "'" || quote === '"') &&
    line[start + 1] === quote &&
    line[start + 2] === quote
  ) {
    index = start + 3;
    while (index < line.length && !line.startsWith(`${quote}${quote}${quote}`, index)) {
      index += line[index] === "\\" ? 2 : 1;
    }
    return line.slice(start, Math.min(line.length, index + 3));
  }

  while (index < line.length) {
    if (line[index] === "\\") {
      index += 2;
      continue;
    }

    if (line[index] === quote) {
      index += 1;
      break;
    }

    index += 1;
  }

  return line.slice(start, index);
}

function readNumberToken(line: string, start: number) {
  let index = start;

  while (index < line.length && /[A-Za-z0-9_.]/.test(line[index])) {
    index += 1;
  }

  return line.slice(start, index);
}

function readWordToken(line: string, start: number, language: CodeLanguage) {
  let index = start + 1;

  while (index < line.length && isWordCharacter(line[index], language)) {
    index += 1;
  }

  return line.slice(start, index);
}

function readOperatorToken(line: string, start: number) {
  const multiCharacterOperators = [
    "===",
    "!==",
    ">>>",
    "<<=",
    ">>=",
    "=>",
    "->",
    "::",
    "&&",
    "||",
    "??",
    "==",
    "!=",
    "<=",
    ">=",
    "++",
    "--",
    "+=",
    "-=",
    "*=",
    "/=",
    "%=",
    "&=",
    "|=",
    "^=",
    "..",
  ];
  const match = multiCharacterOperators.find((operator) =>
    line.startsWith(operator, start),
  );

  return match ?? line[start];
}

function lexCodeLine(line: string, language: CodeLanguage): RawCodeToken[] {
  const definition = languageDefinitions[language];
  const rawTokens: RawCodeToken[] = [];
  let index = 0;

  while (index < line.length) {
    const character = line[index];
    const lineComment = matchLineComment(line, index, definition);
    const blockComment = matchBlockComment(line, index, definition);

    if (lineComment) {
      rawTokens.push({ kind: "comment", value: line.slice(index) });
      break;
    }

    if (blockComment) {
      const [start, end] = blockComment;
      const commentEnd = line.indexOf(end, index + start.length);
      const endIndex =
        commentEnd === -1 ? line.length : commentEnd + end.length;
      rawTokens.push({ kind: "comment", value: line.slice(index, endIndex) });
      index = endIndex;
      continue;
    }

    if (/\s/.test(character)) {
      let endIndex = index + 1;
      while (endIndex < line.length && /\s/.test(line[endIndex])) {
        endIndex += 1;
      }
      rawTokens.push({ kind: "plain", value: line.slice(index, endIndex) });
      index = endIndex;
      continue;
    }

    if (character === '"' || character === "'" || character === "`") {
      const value = readStringToken(line, index);
      rawTokens.push({ kind: "string", value });
      index += value.length;
      continue;
    }

    if (/\d/.test(character)) {
      const value = readNumberToken(line, index);
      rawTokens.push({ kind: "number", value });
      index += value.length;
      continue;
    }

    if (isWordStart(character, language)) {
      const value = readWordToken(line, index, language);
      rawTokens.push({ kind: "word", value });
      index += value.length;
      continue;
    }

    const operator = readOperatorToken(line, index);
    rawTokens.push({ kind: "operator", value: operator });
    index += operator.length;
  }

  return rawTokens.length ? rawTokens : [{ kind: "plain", value: line || " " }];
}

function isFunctionDeclarationKeyword(value: string) {
  return [
    "def",
    "fn",
    "func",
    "function",
    "fun",
    "procedure",
    "proc",
    "sub",
  ].includes(value);
}

function isControlKeyword(value: string) {
  return [
    "catch",
    "for",
    "foreach",
    "if",
    "switch",
    "while",
    "with",
  ].includes(value);
}

function isArrowFunctionAssignment(tokens: RawCodeToken[], equalsIndex: number) {
  const tail = tokens
    .slice(equalsIndex + 1)
    .map((token) => token.value)
    .join("");

  return tail.includes("=>");
}

function shouldHighlightFunctionName(
  tokens: RawCodeToken[],
  index: number,
  value: string,
  definition: LanguageDefinition,
) {
  if (isControlKeyword(value)) {
    return false;
  }

  const previous = getPreviousToken(tokens, index);
  const next = getNextToken(tokens, index);
  const previousValue =
    previous?.token.kind === "word"
      ? normalizeWord(previous.token.value, definition)
      : previous?.token.value;

  if (previousValue && isFunctionDeclarationKeyword(previousValue)) {
    return true;
  }

  if (next?.token.value === "(") {
    return true;
  }

  if (next?.token.value === "=" && isArrowFunctionAssignment(tokens, next.index)) {
    return true;
  }

  return false;
}

function shouldHighlightTypeName(
  tokens: RawCodeToken[],
  index: number,
  value: string,
  definition: LanguageDefinition,
) {
  const previous = getPreviousToken(tokens, index);
  const previousValue =
    previous?.token.kind === "word"
      ? normalizeWord(previous.token.value, definition)
      : previous?.token.value;
  const typeKeywords = new Set(
    (definition.typeKeywords ?? []).map((keyword) =>
      definition.caseInsensitive ? keyword.toLowerCase() : keyword,
    ),
  );

  return Boolean(
    previousValue &&
      (typeKeywords.has(previousValue) ||
        (/^[A-Z]/.test(value) && [":", "as", "new", "<", ","].includes(previousValue))),
  );
}

function isMarkupTagName(tokens: RawCodeToken[], index: number) {
  const previous = getPreviousToken(tokens, index);
  const previousPrevious = previous ? getPreviousToken(tokens, previous.index) : null;

  return (
    previous?.token.value === "<" ||
    (previous?.token.value === "/" && previousPrevious?.token.value === "<")
  );
}

function isMarkupAttribute(tokens: RawCodeToken[], index: number) {
  const next = getNextToken(tokens, index);
  const previousTagStart = tokens
    .slice(0, index)
    .findLastIndex((token) => token.value === "<");
  const previousTagEnd = tokens
    .slice(0, index)
    .findLastIndex((token) => token.value === ">");

  return next?.token.value === "=" && previousTagStart > previousTagEnd;
}

function isJsonProperty(tokens: RawCodeToken[], index: number) {
  return getNextToken(tokens, index)?.token.value === ":";
}

function isCssProperty(tokens: RawCodeToken[], index: number) {
  return getNextToken(tokens, index)?.token.value === ":";
}

function tokenizeMarkdownLine(line: string): CodeToken[] {
  const headingMatch = line.match(/^(#{1,6})(\s+.*)?$/);
  if (headingMatch) {
    return [
      { kind: "heading", value: headingMatch[1] },
      { kind: "plain", value: headingMatch[2] ?? "" },
    ];
  }

  if (/^```/.test(line)) {
    return [{ kind: "keyword", value: line }];
  }

  if (/^\s*>/.test(line)) {
    return [
      { kind: "operator", value: line.match(/^\s*>/)?.[0] ?? ">" },
      { kind: "plain", value: line.replace(/^\s*>/, "") },
    ];
  }

  return lexCodeLine(line, "text").map((token) => ({
    kind: token.kind === "number" ? "number" : "plain",
    value: token.value,
  }));
}

function classifyRawTokens(
  rawTokens: RawCodeToken[],
  language: CodeLanguage,
): CodeToken[] {
  const definition = languageDefinitions[language];
  const keywordSet = getDefinitionSet(definition.keywords, definition.caseInsensitive);
  const builtinSet = getDefinitionSet(definition.builtins, definition.caseInsensitive);
  const constantSet = getDefinitionSet(
    definition.constants,
    definition.caseInsensitive,
  );

  return rawTokens.map((token, index) => {
    if (token.kind === "comment") {
      return { kind: "comment", value: token.value };
    }

    if (token.kind === "number") {
      return { kind: "number", value: token.value };
    }

    if (token.kind === "string") {
      return {
        kind: definition.jsonLike && isJsonProperty(rawTokens, index)
          ? "property"
          : "string",
        value: token.value,
      };
    }

    if (token.kind === "operator") {
      return {
        kind: /[{}\[\]().,;:]/.test(token.value) ? "plain" : "operator",
        value: token.value,
      };
    }

    if (token.kind !== "word") {
      return { kind: "plain", value: token.value };
    }

    const normalizedValue = normalizeWord(token.value, definition);

    if (definition.markup && isMarkupTagName(rawTokens, index)) {
      return { kind: "tag", value: token.value };
    }

    if (definition.markup && isMarkupAttribute(rawTokens, index)) {
      return { kind: "attribute", value: token.value };
    }

    if (token.value.startsWith("@")) {
      return { kind: "decorator", value: token.value };
    }

    if (constantSet.has(normalizedValue)) {
      return { kind: "constant", value: token.value };
    }

    if (keywordSet.has(normalizedValue)) {
      return { kind: "keyword", value: token.value };
    }

    if (definition.cssLike && isCssProperty(rawTokens, index)) {
      return { kind: "property", value: token.value };
    }

    if (shouldHighlightFunctionName(rawTokens, index, normalizedValue, definition)) {
      return { kind: "function", value: token.value };
    }

    if (builtinSet.has(normalizedValue)) {
      return { kind: "builtin", value: token.value };
    }

    if (shouldHighlightTypeName(rawTokens, index, token.value, definition)) {
      return { kind: "type", value: token.value };
    }

    return { kind: "plain", value: token.value };
  });
}

function tokenizeCode(line: string, language: CodeLanguage): CodeToken[] {
  if (languageDefinitions[language].markdown) {
    return tokenizeMarkdownLine(line);
  }

  return classifyRawTokens(lexCodeLine(line, language), language);
}

function AdeowSheetEmbeddable({
  data,
  elementId,
  onChange,
}: {
  data: AdeowSheetData;
  elementId: string;
  onChange: (
    data: AdeowEmbeddableData,
    size?: { height: number; width: number },
  ) => void;
}) {
  const sheet = normalizeSheet(data);
  const size = estimateSheetSize(sheet);

  const commitSheet = (nextSheet: AdeowSheetData) => {
    onChange({ kind: "sheet", sheet: nextSheet }, estimateSheetSize(nextSheet));
  };

  const addRow = () => {
    const cols = sheet.colWidths.length;
    commitSheet({
      cells: [...sheet.cells, Array.from({ length: cols }, () => "")],
      colWidths: sheet.colWidths,
      rowHeights: [...sheet.rowHeights, MIN_SHEET_ROW_HEIGHT],
    });
  };

  const addCol = () => {
    commitSheet({
      cells: sheet.cells.map((row) => [...row, ""]),
      colWidths: [...sheet.colWidths, MIN_SHEET_COL_WIDTH],
      rowHeights: sheet.rowHeights,
    });
  };

  const removeRow = () => {
    if (sheet.cells.length <= 1) {
      return;
    }

    commitSheet({
      cells: sheet.cells.slice(0, -1),
      colWidths: sheet.colWidths,
      rowHeights: sheet.rowHeights.slice(0, -1),
    });
  };

  const removeCol = () => {
    if (sheet.colWidths.length <= 1) {
      return;
    }

    commitSheet({
      cells: sheet.cells.map((row) => row.slice(0, -1)),
      colWidths: sheet.colWidths.slice(0, -1),
      rowHeights: sheet.rowHeights,
    });
  };

  const handleCellChange = (
    rowIndex: number,
    colIndex: number,
    value: string,
  ) => {
    commitSheet(getSheetWithCellValue(sheet, rowIndex, colIndex, value));
  };

  const startColumnResize = (
    event: ReactPointerEvent<HTMLButtonElement>,
    colIndex: number,
  ) => {
    event.preventDefault();
    event.stopPropagation();

    const startX = event.clientX;
    const startWidth = sheet.colWidths[colIndex];

    const handlePointerMove = (moveEvent: PointerEvent) => {
      const colWidths = [...sheet.colWidths];
      colWidths[colIndex] = Math.max(
        MIN_SHEET_COL_WIDTH,
        startWidth + moveEvent.clientX - startX,
      );
      commitSheet({ ...sheet, colWidths });
    };

    const handlePointerUp = () => {
      window.removeEventListener("pointermove", handlePointerMove);
      window.removeEventListener("pointerup", handlePointerUp);
    };

    window.addEventListener("pointermove", handlePointerMove);
    window.addEventListener("pointerup", handlePointerUp);
  };

  const startRowResize = (
    event: ReactPointerEvent<HTMLButtonElement>,
    rowIndex: number,
  ) => {
    event.preventDefault();
    event.stopPropagation();

    const startY = event.clientY;
    const startHeight = sheet.rowHeights[rowIndex];

    const handlePointerMove = (moveEvent: PointerEvent) => {
      const rowHeights = [...sheet.rowHeights];
      rowHeights[rowIndex] = Math.max(
        MIN_SHEET_ROW_HEIGHT,
        startHeight + moveEvent.clientY - startY,
      );
      commitSheet({ ...sheet, rowHeights });
    };

    const handlePointerUp = () => {
      window.removeEventListener("pointermove", handlePointerMove);
      window.removeEventListener("pointerup", handlePointerUp);
    };

    window.addEventListener("pointermove", handlePointerMove);
    window.addEventListener("pointerup", handlePointerUp);
  };

  return (
    <section
      aria-label="ADEOW sheet"
      className="adeow-embed adeow-sheet-embed"
      data-element-id={elementId}
      style={{ minHeight: size.height, minWidth: size.width }}
    >
      <div className="adeow-sheet-toolbar">
        <span>Sheet</span>
        <button onClick={addRow} type="button">+ Row</button>
        <button onClick={addCol} type="button">+ Col</button>
        <button onClick={removeRow} type="button">- Row</button>
        <button onClick={removeCol} type="button">- Col</button>
      </div>
      <div
        className="adeow-sheet-grid"
        style={{
          gridTemplateColumns: `${SHEET_CHROME_WIDTH}px ${sheet.colWidths
            .map((width) => `${width}px`)
            .join(" ")}`,
          gridTemplateRows: `${SHEET_CHROME_HEIGHT}px ${sheet.rowHeights
            .map((height) => `${height}px`)
            .join(" ")}`,
        }}
      >
        <div className="adeow-sheet-corner" />
        {sheet.colWidths.map((width, colIndex) => (
          <div className="adeow-sheet-header" key={`col-${colIndex}`}>
            {String.fromCharCode(65 + colIndex)}
            <span className="adeow-sheet-size">{width}px</span>
            <button
              aria-label={`Resize column ${colIndex + 1}`}
              className="adeow-sheet-col-resizer"
              onPointerDown={(event) => startColumnResize(event, colIndex)}
              type="button"
            />
          </div>
        ))}
        {sheet.cells.map((row, rowIndex) => (
          <Fragment key={`row-${rowIndex}`}>
            <div className="adeow-sheet-row-header">
              {rowIndex + 1}
              <button
                aria-label={`Resize row ${rowIndex + 1}`}
                className="adeow-sheet-row-resizer"
                onPointerDown={(event) => startRowResize(event, rowIndex)}
                type="button"
              />
            </div>
            {row.map((cell, colIndex) => (
              <textarea
                aria-label={`Cell ${rowIndex + 1}:${colIndex + 1}`}
                className="adeow-sheet-cell"
                key={`${rowIndex}-${colIndex}`}
                onChange={(event) =>
                  handleCellChange(rowIndex, colIndex, event.target.value)
                }
                value={cell}
              />
            ))}
          </Fragment>
        ))}
      </div>
    </section>
  );
}

function AdeowStickyNoteEmbeddable({
  data,
  elementId,
  onChange,
}: {
  data: AdeowStickyNoteData;
  elementId: string;
  onChange: (data: AdeowEmbeddableData) => void;
}) {
  const textareaRef = useRef<HTMLTextAreaElement | null>(null);

  useEffect(() => {
    const focusTimeout = window.setTimeout(() => {
      textareaRef.current?.focus();
    }, 0);

    return () => window.clearTimeout(focusTimeout);
  }, []);

  const commit = (text: string) => {
    onChange({
      kind: "sticky",
      sticky: {
        ...data,
        text,
      },
    });
  };

  return (
    <section
      aria-label="ADEOW sticky note"
      className="adeow-embed adeow-sticky-embed"
      data-element-id={elementId}
      style={
        {
          "--adeow-sticky-color": data.color,
          "--adeow-sticky-ink": getStickyInkColor(data.color),
        } as CSSProperties
      }
    >
      <textarea
        aria-label="Sticky note text"
        className="adeow-sticky-textarea"
        onChange={(event) => commit(event.target.value)}
        placeholder="Type a note"
        ref={textareaRef}
        spellCheck
        value={data.text}
      />
      <div className="adeow-sticky-author">{data.author || "Quick capture"}</div>
    </section>
  );
}

function AdeowCodeBlockEmbeddable({
  data,
  elementId,
  onChange,
  theme,
}: {
  data: AdeowCodeBlockData;
  elementId: string;
  onChange: (
    data: AdeowEmbeddableData,
    size?: { height: number; width: number },
  ) => void;
  theme: CanvasTheme;
}) {
  const [activeLineIndex, setActiveLineIndex] = useState(0);
  const lines = data.code ? data.code.split("\n") : [""];
  const size = estimateCodeBlockSize(data.code);
  const longestLine = lines.reduce(
    (longest, line) => Math.max(longest, line.length),
    0,
  );
  const contentHeight = Math.max(size.height - 56, lines.length * 24 + 28);
  const contentWidth = Math.max(size.width - 68, longestLine * 8.4 + 44);
  const lineCountLabel = `${lines.length} ${lines.length === 1 ? "line" : "lines"}`;
  const languageLabel = codeLanguages.find(
    (language) => language.value === data.language,
  )?.label;

  const commit = (
    nextData: AdeowCodeBlockData,
    options: { resizeToContent?: boolean } = {},
  ) => {
    onChange(
      { codeBlock: nextData, kind: "codeblock" },
      options.resizeToContent ? estimateCodeBlockSize(nextData.code) : undefined,
    );
  };
  const updateActiveLine = (selectionStart: number) => {
    setActiveLineIndex(data.code.slice(0, selectionStart).split("\n").length - 1);
  };

  return (
    <section
      aria-label="ADEOW code block"
      className="adeow-embed adeow-code-embed"
      data-element-id={elementId}
      data-theme={theme}
    >
      <div className="adeow-code-header">
        <div className="adeow-code-file-group">
          <span
            aria-hidden="true"
            className="adeow-code-file-indicator"
          />
          <input
            aria-label="Code block title"
            className="adeow-code-title-input"
            onChange={(event) =>
              commit({
                ...data,
                filename: event.target.value,
              })
            }
            placeholder="Untitled code block"
            spellCheck={false}
            value={data.filename ?? ""}
          />
        </div>
        <div className="adeow-code-header-meta">
          <span className="adeow-code-stat">{lineCountLabel}</span>
          <select
            aria-label="Code language"
            className="adeow-code-language-select"
            onChange={(event) =>
              commit({
                ...data,
                language: event.target.value as CodeLanguage,
              })
            }
            value={data.language}
          >
            {codeLanguages.map((language) => (
              <option key={language.value} value={language.value}>
                {language.label}
              </option>
            ))}
          </select>
        </div>
      </div>
      <div
        className="adeow-code-body"
        style={
          {
            "--adeow-code-content-height": `${contentHeight}px`,
            "--adeow-code-content-width": `${contentWidth}px`,
          } as CSSProperties
        }
      >
        <div
          className="adeow-code-lines"
          aria-hidden="true"
        >
          {lines.map((_, index) => (
            <span
              className="adeow-code-line-number"
              data-active-line={activeLineIndex === index ? "true" : "false"}
              key={index}
            >
              {index + 1}
            </span>
          ))}
        </div>
        <div
          className="adeow-code-editor"
        >
          <pre
            aria-hidden="true"
            className="adeow-code-highlight"
          >
            {lines.map((line, lineIndex) => (
              <span
                className="adeow-code-line"
                data-active-line={activeLineIndex === lineIndex ? "true" : "false"}
                key={lineIndex}
              >
                {tokenizeCode(line, data.language).map((token, tokenIndex) => (
                  <span
                    className={`adeow-code-token adeow-code-token-${token.kind}`}
                    key={`${lineIndex}-${tokenIndex}`}
                  >
                    {token.value}
                  </span>
                ))}
              </span>
            ))}
          </pre>
          <textarea
            aria-label={`${languageLabel || "Code"} source`}
            className="adeow-code-textarea"
            onClick={(event) => updateActiveLine(event.currentTarget.selectionStart)}
            onChange={(event) => {
              updateActiveLine(event.currentTarget.selectionStart);
              commit({
                ...data,
                code: event.target.value,
              });
            }}
            onFocus={(event) => updateActiveLine(event.currentTarget.selectionStart)}
            onKeyUp={(event) => updateActiveLine(event.currentTarget.selectionStart)}
            onSelect={(event) => updateActiveLine(event.currentTarget.selectionStart)}
            autoCapitalize="off"
            autoComplete="off"
            autoCorrect="off"
            spellCheck={false}
            value={data.code}
            wrap="off"
          />
        </div>
      </div>
    </section>
  );
}

export function AdeowCanvasEmbeddable({
  element,
  onChange,
  theme,
}: AdeowCanvasEmbeddableProps) {
  const data = getAdeowEmbeddableData(element.customData);

  const handleChange = useMemo(
    () =>
      (
        nextData: AdeowEmbeddableData,
        size?: { height: number; width: number },
      ) => {
        onChange(element.id, nextData, size);
      },
    [element.id, onChange],
  );

  if (!data) {
    return null;
  }

  if (data.kind === "sheet") {
    return (
      <AdeowSheetEmbeddable
        data={data.sheet}
        elementId={element.id}
        onChange={handleChange}
      />
    );
  }

  if (data.kind === "sticky") {
    return (
      <AdeowStickyNoteEmbeddable
        data={data.sticky}
        elementId={element.id}
        onChange={handleChange}
      />
    );
  }

  return (
    <AdeowCodeBlockEmbeddable
      data={data.codeBlock}
      elementId={element.id}
      onChange={handleChange}
      theme={theme}
    />
  );
}
