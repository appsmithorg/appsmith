export enum EditorModes {
  TEXT = "text/plain",
  SQL = "sql",
  TEXT_WITH_BINDING = "text-js",
  JSON = "application/json",
  JSON_WITH_BINDING = "json-js",
  SQL_WITH_BINDING = "sql-js",
}

export enum EditorTheme {
  LIGHT = "LIGHT",
  DARK = "DARK",
}
export enum TabBehaviour {
  INPUT = "INPUT",
  INDENT = "INDENT",
}

export enum EditorSize {
  COMPACT = "COMPACT",
  EXTENDED = "EXTENDED",
}

export type EditorConfig = {
  theme: EditorTheme;
  mode: EditorModes;
  tabBehaviour: TabBehaviour;
  size: EditorSize;
};

export const EditorThemes: Record<EditorTheme, string> = {
  [EditorTheme.LIGHT]: "base16-light",
  [EditorTheme.DARK]: "monokai",
};
