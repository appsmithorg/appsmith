import type CodeMirror from "codemirror";
import type { DataTree, ENTITY_TYPE } from "entities/DataTree/dataTreeFactory";
import type { AdditionalDynamicDataTree } from "utils/autocomplete/customTreeTypeDefCreator";
import type { AutocompleteDataType } from "utils/autocomplete/CodemirrorTernService";
import type { EntityNavigationData } from "selectors/navigationSelectors";

export enum EditorModes {
  TEXT = "text/plain",
  SQL = "sql",
  TEXT_WITH_BINDING = "text-js",
  JSON = "application/json",
  JSON_WITH_BINDING = "json-js",
  SQL_WITH_BINDING = "sql-js",
  JAVASCRIPT = "javascript",
  GRAPHQL = "graphql",
  GRAPHQL_WITH_BINDING = "graphql-js",
  POSTGRESQL_WITH_BINDING = "pgsql-js",
  MYSQL_WITH_BINDING = "mysql-js",
  MSSQL_WITH_BINDING = "mssql-js",
  PLSQL_WITH_BINDING = "plsql-js",
  SNOWFLAKE_WITH_BINDING = "snowflakesql-js",
  ARANGO_WITH_BINDING = "arangosql-js",
  REDIS_WITH_BINDING = "redissql-js",
}

export enum ALL_SQL_MIME_TYPES {
  POSTGRESQL_WITH_BINDING = "pgsql-js",
  MYSQL_WITH_BINDING = "mysql-js",
  MSSQL_WITH_BINDING = "mssql-js",
  PLSQL_WITH_BINDING = "plsql-js",
  SNOWFLAKE_WITH_BINDING = "snowflakesql-js",
  ARANGO_WITH_BINDING = "arangosql-js",
  REDIS_WITH_BINDING = "redissql-js",
  //  Generic sql
  SQL_WITH_BINDING = "sql-js",
}

export const pluginToMIME: Record<string, EditorModes> = {
  PostgreSQL: EditorModes.POSTGRESQL_WITH_BINDING,
  MySQL: EditorModes.MYSQL_WITH_BINDING,
  "Microsoft SQL Server": EditorModes.MSSQL_WITH_BINDING,
  Oracle: EditorModes.PLSQL_WITH_BINDING,
  Redshift: EditorModes.PLSQL_WITH_BINDING,
  Snowflake: EditorModes.SNOWFLAKE_WITH_BINDING,
  ArangoDB: EditorModes.ARANGO_WITH_BINDING,
  Redis: EditorModes.REDIS_WITH_BINDING,
};

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
  entityType?: ENTITY_TYPE;
  entityId?: string;
  propertyPath?: string;
  blockCompletions?: Array<{ parentPath: string; subPath: string }>;
};

export type HintHelper = (
  editor: CodeMirror.Editor,
  data: DataTree,
  customDataTree?: AdditionalDynamicDataTree,
) => Hinter;
export type Hinter = {
  showHint: (
    editor: CodeMirror.Editor,
    entityInformation: FieldEntityInformation,
    additionalData?: any,
  ) => boolean;
  update?: (data: DataTree) => void;
  fireOnFocus?: boolean;
};

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
  Enter,
  Escape,
  Comma,
  Semicolon,
  Space,
  Delete,
  "Ctrl+Backspace",
  OSLeft,
  "(",
  ")",
}

export const isCloseKey = (key: any): key is AUTOCOMPLETE_CLOSE_KEY => {
  return AUTOCOMPLETE_CLOSE_KEY.hasOwnProperty(key);
};

export enum MODIFIER {
  Control,
  Meta,
  Alt,
  Shift,
}

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

export const isNavKey = (key: any): key is AUTOCOMPLETE_NAVIGATION => {
  return AUTOCOMPLETE_NAVIGATION.hasOwnProperty(key);
};

export function getSqlEditorModeFromPluginName(name: string) {
  return pluginToMIME[name] ?? EditorModes.SQL_WITH_BINDING;
}
