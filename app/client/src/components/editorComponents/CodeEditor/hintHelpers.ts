import type { Hints } from "codemirror";
import CodeMirror from "codemirror";
import CodemirrorTernService from "utils/autocomplete/CodemirrorTernService";
import KeyboardShortcuts from "constants/KeyboardShortcuts";
import type { HintHelper } from "components/editorComponents/CodeEditor/EditorConfig";
import AnalyticsUtil from "utils/AnalyticsUtil";
import { checkIfCursorInsideBinding } from "components/editorComponents/CodeEditor/codeEditorUtils";
import { ENTITY_TYPE } from "entities/DataTree/dataTreeFactory";
import type { getDatasourceStructuresFromDatasourceId } from "selectors/entitiesSelector";
import { isEmpty, trim } from "lodash";

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

type HandleCompletions = (
  editor: CodeMirror.Editor,
) =>
  | { showHints: false; completions: null }
  | { showHints: true; completions: Hints };

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
    this.datasourceStructure = structure || {};
  }
  hinter() {
    return {
      showHint: (editor: CodeMirror.Editor): boolean => {
        const { completions, showHints } = this.handleCompletions(editor);
        if (!showHints) return false;
        editor.showHint({
          hint: () => {
            return completions;
          },
          completeSingle: false,
          extraKeys: {
            Tab: (editor: CodeMirror.Editor, handle) => {
              handle.pick();
            },
          },
        });
        return true;
      },
    };
  }

  handleCompletions(editor: CodeMirror.Editor): ReturnType<HandleCompletions> {
    const noHints = { showHints: false, completions: null } as const;
    if (this.isEmptyToken(editor)) return noHints;
    // @ts-expect-error: No types available
    const completions: Hints = CodeMirror.hint.sql(editor, {
      tables: this.datasourceStructure,
    });

    if (isEmpty(completions.list)) return noHints;
    return { completions, showHints: true };
  }

  // Checks if string at the position of the cursor is empty
  isEmptyToken(editor: CodeMirror.Editor) {
    const currentCursorPosition = editor.getCursor();
    const { string: stringAtCurrentPosition } = editor.getTokenAt(
      currentCursorPosition,
    );
    const isEmptyString = !(
      stringAtCurrentPosition && trim(stringAtCurrentPosition)
    );

    return isEmptyString;
  }
}

export const sqlHint = new SqlHintHelper();
