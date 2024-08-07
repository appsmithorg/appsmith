import type CodeMirror from "codemirror";
import type { EntityTypeValue } from "ee/entities/DataTree/types";
import type { DataTree } from "entities/DataTree/dataTreeTypes";
import type { AutocompleteDataType } from "utils/autocomplete/AutocompleteDataType";
import type { EntityNavigationData } from "selectors/navigationSelectors";
import type { ExpectedValueExample } from "utils/validation/common";

import { editorSQLModes } from "./sql/config";
import type { WidgetType } from "constants/WidgetConstants";

export const EditorModes = {
  TEXT: "text/plain",
  TEXT_WITH_BINDING: "text-js",
  JSON: "application/json",
  JSON_WITH_BINDING: "json-js",
  JAVASCRIPT: "javascript",
  GRAPHQL: "graphql",
  GRAPHQL_WITH_BINDING: "graphql-js",
  HTMLMIXED: "htmlmixed",
  CSS: "css",
  ...editorSQLModes,
} as const;

type ValueOf<T> = T[keyof T];
export type TEditorModes = ValueOf<typeof EditorModes>;

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
  COMPACT_RETAIN_FORMATTING = "COMPACT_RETAIN_FORMATTING",
}

export interface EditorConfig {
  theme: EditorTheme;
  mode: TEditorModes;
  tabBehaviour: TabBehaviour;
  size: EditorSize;
  hinting?: Array<HintHelper>;
  marking?: Array<MarkHelper>;
  folding?: boolean;
}

export const EditorThemes: Record<EditorTheme, string> = {
  [EditorTheme.LIGHT]: "duotone-light",
  [EditorTheme.DARK]: "duotone-dark",
};

export interface FieldEntityInformation {
  entityName?: string;
  expectedType?: AutocompleteDataType;
  entityType?: EntityTypeValue;
  entityId?: string;
  propertyPath?: string;
  isTriggerPath?: boolean;
  blockCompletions?: Array<{ parentPath: string; subPath: string }>;
  example?: ExpectedValueExample;
  mode?: TEditorModes;
  token?: CodeMirror.Token;
  widgetType?: WidgetType;
}

export type HintHelper = (
  editor: CodeMirror.Editor,
  entitiesForNavigation: EntityNavigationData,
) => Hinter;
export interface Hinter {
  showHint: (
    editor: CodeMirror.Editor,
    entityInformation: FieldEntityInformation,
    // TODO: Fix this the next time the file is edited
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    additionalData?: any,
  ) => boolean;
  update?: (data: DataTree) => void;
  fireOnFocus?: boolean;
}

export type MarkHelper = (
  editor: CodeMirror.Editor,
  entityNavigationData: EntityNavigationData,
  from?: CodeMirror.Position,
  to?: CodeMirror.Position,
) => void;

export enum CodeEditorBorder {
  NONE = "none",
  ALL_SIDE = "all-side",
  BOTTOM_SIDE = "bottom-side",
}

export enum AUTOCOMPLETE_CLOSE_KEY {
  Enter = "Enter",
  Escape = "Escape",
  Comma = "Comma",
  Semicolon = "Semicolon",
  Space = "Space",
  Delete = "Delete",
  "Ctrl+Backspace" = "Ctrl+Backspace",
  OSLeft = "OSLeft",
  "(" = "(",
  ")" = ")",
}

// TODO: Fix this the next time the file is edited
// eslint-disable-next-line @typescript-eslint/no-explicit-any
export const isCloseKey = (key: any): key is AUTOCOMPLETE_CLOSE_KEY => {
  return AUTOCOMPLETE_CLOSE_KEY.hasOwnProperty(key);
};

export enum MODIFIER {
  Control = "Ctrl",
  Meta = "Meta",
  Alt = "Alt",
  Shift = "Shift",
}

// TODO: Fix this the next time the file is edited
// eslint-disable-next-line @typescript-eslint/no-explicit-any
export const isModifierKey = (key: any): key is MODIFIER => {
  return MODIFIER.hasOwnProperty(key);
};

export enum AUTOCOMPLETE_NAVIGATION {
  ArrowUp,
  ArrowDown,
  ArrowRight,
  ArrowLeft,
}

export const INDENTATION_CHARACTERS = {
  " ": " ",
  "\t": "\t",
  "\n": "\n",
};

// TODO: Fix this the next time the file is edited
// eslint-disable-next-line @typescript-eslint/no-explicit-any
export const isNavKey = (key: any): key is AUTOCOMPLETE_NAVIGATION => {
  return AUTOCOMPLETE_NAVIGATION.hasOwnProperty(key);
};
