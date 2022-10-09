import CodeMirror from "codemirror";
// import TernServer from "utils/autocomplete/TernServer";
import KeyboardShortcuts from "constants/KeyboardShortcuts";
import { HintHelper } from "components/editorComponents/CodeEditor/EditorConfig";
import AnalyticsUtil from "utils/AnalyticsUtil";
// import { checkIfCursorInsideBinding } from "components/editorComponents/CodeEditor/codeEditorUtils";
// import { ENTITY_TYPE } from "entities/DataTree/dataTreeFactory";
import "codemirror/mode/sql/sql.js";
import "codemirror/addon/hint/sql-hint";

import "codemirror/addon/hint/show-hint";
import "codemirror/addon/hint/show-hint.css";

export const pluginBindingHint: HintHelper = (
  editor,
  _tree,
  datasourceStructures,
) => {
  const tables = getTableListFromDatasourceStructure(datasourceStructures);
  return {
    showHint: (editor: CodeMirror.Editor): boolean => {
      AnalyticsUtil.logEvent("AUTO_COMPLETE_SHOW", {});
      editor.showHint({
        // @ts-expect-error Types are not available
        hint: CodeMirror.hint.sql,
        completeSingle: false,
        extraKeys: {
          [KeyboardShortcuts.CodeEditor.OpenAutocomplete]: "autocomplete",
        },
      });

      editor.setOption("hintOptions", {
        // @ts-expect-error types not found
        tables,
      });

      // editor.closeHint();
      return true;
    },
  };
};

const getTableListFromDatasourceStructure = (datasourceStructures: any) => {
  const tables: Record<string, string[]> = {};
  if (datasourceStructures?.tables && datasourceStructures?.tables.length > 0) {
    datasourceStructures?.tables.forEach(
      (table: { name: string; columns: { name: string }[] }) => {
        if (table?.name) {
          tables[table.name] = table.columns.map((column) => column.name);
        }
      },
    );
  }

  return tables;
};
