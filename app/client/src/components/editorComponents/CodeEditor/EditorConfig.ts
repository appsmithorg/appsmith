import CodeMirror from "codemirror";
import { DataTree, ENTITY_TYPE } from "entities/DataTree/dataTreeFactory";
import { AutocompleteDataType } from "utils/autocomplete/TernServer";

export enum EditorModes {
  TEXT = "text/plain",
  SQL = "sql",
  TEXT_WITH_BINDING = "text-js",
  JSON = "application/json",
  JSON_WITH_BINDING = "json-js",
  SQL_WITH_BINDING = "sql-js",
  JAVASCRIPT = "javascript",
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
  hinting: Array<HintHelper>;
  marking: Array<MarkHelper>;
  folding?: boolean;
};

export const EditorThemes: Record<EditorTheme, string> = {
  [EditorTheme.LIGHT]: "duotone-light",
  [EditorTheme.DARK]: "duotone-dark",
};

export type FieldEntityInformation = {
  entityName?: string;
  expectedType?: AutocompleteDataType;
  entityType?: ENTITY_TYPE.ACTION | ENTITY_TYPE.WIDGET | ENTITY_TYPE.JSACTION;
  entityId?: string;
  propertyPath?: string;
};

export type HintHelper = (
  editor: CodeMirror.Editor,
  data: DataTree,
  customDataTree?: Record<string, Record<string, unknown>>,
) => Hinter;
export type Hinter = {
  showHint: (
    editor: CodeMirror.Editor,
    entityInformation: FieldEntityInformation,
    additionalData?: any,
  ) => boolean;
  update?: (data: DataTree) => void;
  trigger?: (editor: CodeMirror.Editor) => void;
};

export type MarkHelper = (editor: CodeMirror.Editor) => void;

export enum CodeEditorBorder {
  NONE = "none",
  ALL_SIDE = "all-side",
  BOTTOM_SIDE = "bottom-side",
}
