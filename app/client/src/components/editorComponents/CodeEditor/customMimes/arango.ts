import CodeMirror from "codemirror";
import { merge } from "lodash";
import { EditorModes } from "../EditorConfig";
import { spaceSeparatedStringToObject } from "./utils";

// @ts-expect-error: No type available
const defaultSQLConfig = CodeMirror.resolveMode("text/x-sql");

export const arangoKeywordsMap = {
  // https://www.arangodb.com/docs/stable/aql/fundamentals-syntax.html
  keywords: spaceSeparatedStringToObject(
    "FOR RETURN FILTER SEARCH SORT LIMIT LET COLLECT WINDOW INSERT UPDATE REPLACE REMOVE UPSERT WITH AGGREGATE ALL ALL_SHORTEST_PATHS AND ANY ASC COLLECT DESC DISTINCT FALSE FILTER FOR GRAPH IN INBOUND INSERT INTO K_PATHS K_SHORTEST_PATHS LET LIKE LIMIT NONE NOT NULL OR OUTBOUND REMOVE REPLACE RETURN SHORTEST_PATH SORT TRUE UPDATE UPSERT WINDOW WITH KEEP COUNT OPTIONS PRUNE SEARCH TO CURRENT NEW OLD",
  ),
};
const arangoConfig = merge(defaultSQLConfig, arangoKeywordsMap);

// Inspired by https://github.com/codemirror/codemirror5/blob/9974ded36bf01746eb2a00926916fef834d3d0d0/mode/sql/sql.js#L290
CodeMirror.defineMIME(EditorModes.ARANGO_WITH_BINDING, arangoConfig);
