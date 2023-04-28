import CodeMirror from "codemirror";
import CodemirrorTernService from "utils/autocomplete/CodemirrorTernService";
import KeyboardShortcuts from "constants/KeyboardShortcuts";
import type { HintHelper } from "components/editorComponents/CodeEditor/EditorConfig";
import AnalyticsUtil from "utils/AnalyticsUtil";
import { checkIfCursorInsideBinding } from "components/editorComponents/CodeEditor/codeEditorUtils";
import { ENTITY_TYPE } from "entities/DataTree/dataTreeFactory";
import type { getDatasourceStructuresFromDatasourceId } from "selectors/entitiesSelector";

export const bindingHint: HintHelper = (editor) => {
  editor.setOption("extraKeys", {
    // @ts-expect-error: Types are not available
    ...editor.options.extraKeys,
    [KeyboardShortcuts.CodeEditor.OpenAutocomplete]: (cm: CodeMirror.Editor) =>
      checkIfCursorInsideBinding(cm) && CodemirrorTernService.complete(cm),
    [KeyboardShortcuts.CodeEditor.ShowTypeAndInfo]: (cm: CodeMirror.Editor) => {
      CodemirrorTernService.showType(cm);
    },
    [KeyboardShortcuts.CodeEditor.OpenDocsLink]: (cm: CodeMirror.Editor) => {
      CodemirrorTernService.showDocs(cm);
    },
  });
  return {
    showHint: (
      editor: CodeMirror.Editor,
      entityInformation,
      additionalData,
    ): boolean => {
      if (additionalData && additionalData.blockCompletions) {
        CodemirrorTernService.setEntityInformation({
          ...entityInformation,
          blockCompletions: additionalData.blockCompletions,
        });
      } else {
        CodemirrorTernService.setEntityInformation(entityInformation);
      }

      const entityType = entityInformation?.entityType;
      let shouldShow = false;
      if (entityType === ENTITY_TYPE.JSACTION) {
        shouldShow = true;
      } else {
        shouldShow = checkIfCursorInsideBinding(editor);
      }
      if (shouldShow) {
        AnalyticsUtil.logEvent("AUTO_COMPLETE_SHOW", {});
        CodemirrorTernService.complete(editor);
        return true;
      }
      // @ts-expect-error: Types are not available
      editor.closeHint();
      return shouldShow;
    },
  };
};

class SqlHintHelper {
  datasourceStructure: ReturnType<
    typeof getDatasourceStructuresFromDatasourceId
  > = {};

  constructor() {
    this.hinter = this.hinter.bind(this);
    this.setDatasourceStructure = this.setDatasourceStructure.bind(this);
  }

  setDatasourceStructure(
    structure: ReturnType<typeof getDatasourceStructuresFromDatasourceId>,
  ) {
    this.datasourceStructure = structure;
  }
  hinter() {
    return {
      showHint: (editor: CodeMirror.Editor): boolean => {
        editor.setOption("hintOptions", {
          // @ts-expect-error: No type available
          tables: this.datasourceStructure || {},
        });
        editor.showHint({
          // @ts-expect-error: No type info
          hint: CodeMirror.hint.sql,
          completeSingle: false,
        });

        return true;
      },
    };
  }
}

export const sqlHint = new SqlHintHelper();
