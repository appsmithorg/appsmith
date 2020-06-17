import CodeMirror from "codemirror";

enum EditorModes {
  TEXT,
  SQL,
}

enum EditorTheme {
  LIGHT,
  DARK,
}

type EditorConfigType = {
  mode: EditorModes;
  placeholder?: string;
  height?: number;
  theme: EditorTheme;
  lineNumbers?: boolean;
};

export const createEditorConfig = (config: EditorConfigType) => {
  // do something here
};
