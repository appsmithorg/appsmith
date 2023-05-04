import CodeMirror from "codemirror";
import { merge } from "lodash";
import { EditorModes } from "../EditorConfig";
import { spaceSeparatedStringToObject } from "./utils";

// @ts-expect-error: No type available
const defaultSQLConfig = CodeMirror.resolveMode("text/x-sql");

export const snowflakeKeywordsMap = {
  // Ref:  https://docs.snowflake.com/en/sql-reference/reserved-keywords
  keywords: spaceSeparatedStringToObject(
    "ACCOUNT ALL ALTER AND ANY AS BETWEEN BY CASE CAST CHECK COLUMN CONNECT CONNECTION CONSTRAINT CREATE CROSS CURRENT CURRENT_DATE CURRENT_TIME CURRENT_TIMESTAMP CURRENT_USER DATABASE DELETE DISTINCT DROP ELSE EXISTS FALSE FOLLOWING FOR FROM FULL GRANT GROUP GSCLUSTER HAVING ILIKE IN INCREMENT INNER INSERT INTERSECT INTO IS ISSUE JOIN LATERAL LEFT LIKE LOCALTIME LOCALTIMESTAMP MINUS NATURAL NOT NULL OF ON OR ORDER ORGANIZATION QUALIFY REGEXP REVOKE RIGHT RLIKE ROW ROWS SAMPLE SCHEMA SELECT SET SOME START TABLE TABLESAMPLE THEN TO TRIGGER TRUE TRY_CAST UNION UNIQUE UPDATE USING VALUES  VIEW WHEN WHENEVER WHERE WITH",
  ),
};
const snowflakeConfig = merge(defaultSQLConfig, snowflakeKeywordsMap);

// Inspired by https://github.com/codemirror/codemirror5/blob/9974ded36bf01746eb2a00926916fef834d3d0d0/mode/sql/sql.js#L290
CodeMirror.defineMIME(EditorModes.SNOWFLAKE_WITH_BINDING, snowflakeConfig);
