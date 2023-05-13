import CodeMirror from "codemirror";
import { merge } from "lodash";
import { EditorModes } from "../../EditorConfig";
import { getSqlMimeFromMode } from "../config";
import { spaceSeparatedStringToObject } from "./utils";

// @ts-expect-error: No type available
const defaultSQLConfig = CodeMirror.resolveMode("text/x-sql");

export const arangoKeywordsMap = {
  // https://www.arangodb.com/docs/stable/aql/fundamentals-syntax.html
  keywords: spaceSeparatedStringToObject(
    "for return filter search sort limit let collect window insert update replace remove upsert with aggregate all all_shortest_paths and any asc collect desc distinct false filter for graph in inbound insert into k_paths k_shortest_paths let like limit none not null or outbound remove replace return shortest_path sort true update upsert window with keep count options prune search to current new",
  ),
};
const arangoConfig = merge(defaultSQLConfig, arangoKeywordsMap);

// Inspired by https://github.com/codemirror/codemirror5/blob/9974ded36bf01746eb2a00926916fef834d3d0d0/mode/sql/sql.js#L290
CodeMirror.defineMIME(
  getSqlMimeFromMode(EditorModes.ARANGO_WITH_BINDING),
  arangoConfig,
);
