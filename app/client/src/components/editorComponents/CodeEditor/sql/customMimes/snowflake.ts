import CodeMirror from "codemirror";
import { merge } from "lodash";
import { EditorModes } from "../../EditorConfig";
import { getSqlMimeFromMode } from "../config";
import { spaceSeparatedStringToObject } from "./utils";

// @ts-expect-error: No type available
const defaultSQLConfig = CodeMirror.resolveMode("text/x-sql");

export const snowflakeKeywordsMap = {
  // Ref:  https://docs.snowflake.com/en/sql-reference/reserved-keywords
  keywords: spaceSeparatedStringToObject(
    "account all alter and any as between by case cast check column connect connection constraint create cross current current_date current_time current_timestamp current_user database delete distinct drop else exists false following for from full grant group gscluster having ilike in increment inner insert intersect into is issue join lateral left like localtime localtimestamp minus natural not null of on or order organization qualify regexp revoke right rlike row rows sample schema select set some start table tablesample then to trigger true try_cast union unique update using values  view when whenever where with",
  ),
};
const snowflakeConfig = merge(defaultSQLConfig, snowflakeKeywordsMap);

// Inspired by https://github.com/codemirror/codemirror5/blob/9974ded36bf01746eb2a00926916fef834d3d0d0/mode/sql/sql.js#L290
CodeMirror.defineMIME(
  getSqlMimeFromMode(EditorModes.SNOWFLAKE_WITH_BINDING),
  snowflakeConfig,
);
