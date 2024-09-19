import { find } from "lodash";
import type { TEditorModes } from "../EditorConfig";

type ValueOf<T> = T[keyof T];
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

export const pluginNameToSqlMIME: Record<string, TEditorSqlModes> = {
  PostgreSQL: editorSQLModes.POSTGRESQL_WITH_BINDING,
  MySQL: editorSQLModes.MYSQL_WITH_BINDING,
  "Microsoft SQL Server": editorSQLModes.MSSQL_WITH_BINDING,
  Oracle: editorSQLModes.PLSQL_WITH_BINDING,
  Redshift: editorSQLModes.PLSQL_WITH_BINDING,
  Snowflake: editorSQLModes.SNOWFLAKE_WITH_BINDING,
  ArangoDB: editorSQLModes.ARANGO_WITH_BINDING,
  Redis: editorSQLModes.REDIS_WITH_BINDING,
};

export function getSqlEditorModeFromPluginName(name: string) {
  return pluginNameToSqlMIME[name] ?? editorSQLModes.SQL_WITH_BINDING;
}

export function getSqlMimeFromMode(mode: TEditorSqlModes) {
  const modeConfig = find(sqlModesConfig, { mode });

  return modeConfig?.mime ?? "text/x-sql";
}

export function isSqlMode(mode: TEditorModes) {
  return !!Object.keys(sqlModesConfig).includes(mode);
}
