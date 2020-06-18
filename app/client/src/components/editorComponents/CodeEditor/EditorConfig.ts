enum EditorModes {
  TEXT,
  SQL,
}

export enum EditorTheme {
  LIGHT,
  DARK,
}
export enum TabBehaviour {
  INPUT,
  INDENT,
}

export enum EditorSize {
  COMPACT,
  EXTENDED,
}

export type EditorConfig = {
  theme: EditorTheme;
  mode: EditorModes;
  tabBehaviour: TabBehaviour;
  size: EditorSize;
};

export const EditorThemes: Record<EditorTheme, string> = {
  [EditorTheme.LIGHT]: "default",
  [EditorTheme.DARK]: "monokai",
};

export const EditorMode: Record<EditorModes, string> = {
  [EditorModes.TEXT]: "text/plain",
  [EditorModes.SQL]: "sql",
};

/*
CodeMirror.defineMode("sql-js", function(config) {
  // eslint-disable-next-line @typescript-eslint/ban-ts-ignore
  // @ts-ignore
  return CodeMirror.multiplexingMode(
    CodeMirror.getMode(config, "text/x-sql"),
    {
      open: "{{",
      close: "}}",
      mode: CodeMirror.getMode(config, {
        name: "javascript",
        globalVars: true,
      }),
    },
    // .. more multiplexed styles can follow here
  );
});
 */
