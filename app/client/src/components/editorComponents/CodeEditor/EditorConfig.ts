import type CodeMirror from "codemirror";
import type { DataTree, ENTITY_TYPE } from "entities/DataTree/dataTreeFactory";
import type { AdditionalDynamicDataTree } from "utils/autocomplete/customTreeTypeDefCreator";
import type { AutocompleteDataType } from "utils/autocomplete/AutocompleteDataType";
import type { EntityNavigationData } from "selectors/navigationSelectors";
import type { ExpectedValueExample } from "utils/validation/common";
import type { getDatasourceStructuresFromDatasourceId } from "selectors/entitiesSelector";
import { find } from "lodash";

export const editorSQLModes = {
  // SQL only
  SQL: "sql",
  // SQL flavour + JS
  SNOWFLAKE_WITH_BINDING: "snowflakesql-js",
  ARANGO_WITH_BINDING: "arangosql-js",
  REDIS_WITH_BINDING: "redissql-js",
  POSTGRESQL_WITH_BINDING: "pgsql-js",
  SQL_WITH_BINDING: "sql-js",
  MYSQL_WITH_BINDING: "mysql-js",
  MSSQL_WITH_BINDING: "mssql-js",
  PLSQL_WITH_BINDING: "plsql-js",
} as const;

export const EditorModes = {
  TEXT: "text/plain",
  TEXT_WITH_BINDING: "text-js",
  JSON: "application/json",
  JSON_WITH_BINDING: "json-js",
  JAVASCRIPT: "javascript",
  GRAPHQL: "graphql",
  GRAPHQL_WITH_BINDING: "graphql-js",
  ...editorSQLModes,
} as const;

type ValueOf<T> = T[keyof T];
export type TEditorModes = ValueOf<typeof EditorModes>;
export type TEditorSqlModes = ValueOf<typeof editorSQLModes>;
type SqlModeConfig = Record<
  TEditorSqlModes,
  {
    mime: string;
    mode: TEditorSqlModes;
    // CodeMirror.multiplexingMode
    isMultiplex: boolean;
  }
>;

// Mime available in sql mode https://github.com/codemirror/codemirror5/blob/9974ded36bf01746eb2a00926916fef834d3d0d0/mode/sql/sql.js#L290
export const sqlModesConfig: SqlModeConfig = {
  [editorSQLModes.SQL]: {
    mime: "sql",
    mode: editorSQLModes.SQL,
    isMultiplex: false,
  },
  [editorSQLModes.SQL_WITH_BINDING]: {
    mime: "text/x-sql",
    mode: editorSQLModes.SQL_WITH_BINDING,
    isMultiplex: true,
  },
  [editorSQLModes.MYSQL_WITH_BINDING]: {
    mime: "text/x-mysql",
    mode: editorSQLModes.MYSQL_WITH_BINDING,
    isMultiplex: true,
  },
  [editorSQLModes.MSSQL_WITH_BINDING]: {
    mime: "text/x-mssql",
    mode: editorSQLModes.MSSQL_WITH_BINDING,
    isMultiplex: true,
  },
  [editorSQLModes.PLSQL_WITH_BINDING]: {
    mime: "text/x-plsql",
    mode: editorSQLModes.PLSQL_WITH_BINDING,
    isMultiplex: true,
  },
  [editorSQLModes.POSTGRESQL_WITH_BINDING]: {
    mime: "text/x-pgsql",
    mode: editorSQLModes.POSTGRESQL_WITH_BINDING,
    isMultiplex: true,
  },
  // Custom mimes
  [editorSQLModes.SNOWFLAKE_WITH_BINDING]: {
    mime: "text/x-snowflakesql",
    mode: editorSQLModes.SNOWFLAKE_WITH_BINDING,
    isMultiplex: true,
  },
  [editorSQLModes.ARANGO_WITH_BINDING]: {
    mime: "text/x-arangosql",
    mode: editorSQLModes.ARANGO_WITH_BINDING,
    isMultiplex: true,
  },
  [editorSQLModes.REDIS_WITH_BINDING]: {
    mime: "text/x-redis",
    mode: editorSQLModes.REDIS_WITH_BINDING,
    isMultiplex: true,
  },
};

export const pluginNameToMIME: Record<string, ValueOf<typeof EditorModes>> = {
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
  mode: ValueOf<typeof EditorModes>;
  tabBehaviour: TabBehaviour;
  size: EditorSize;
  hinting?: Array<HintHelper>;
  marking?: Array<MarkHelper>;
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
  example?: ExpectedValueExample;
  mode?: EditorModes;
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
  return pluginNameToMIME[name] ?? EditorModes.SQL_WITH_BINDING;
}

export function getSqlMimeFromMode(mode: ValueOf<typeof editorSQLModes>) {
  const modeConfig = find(sqlModesConfig, { mode });
  return modeConfig?.mime ?? "text/x-sql";
}

export function isSqlMode(mode: TEditorModes) {
  return !!Object.keys(sqlModesConfig).includes(mode);
}
