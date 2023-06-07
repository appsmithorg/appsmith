import type { Hints } from "codemirror";
import CodeMirror from "codemirror";
import CodemirrorTernService from "utils/autocomplete/CodemirrorTernService";
import KeyboardShortcuts from "constants/KeyboardShortcuts";
import type { HintHelper } from "components/editorComponents/CodeEditor/EditorConfig";
import { EditorModes } from "components/editorComponents/CodeEditor/EditorConfig";
import AnalyticsUtil from "utils/AnalyticsUtil";
import {
  checkIfCursorInsideBinding,
  isCursorOnEmptyToken,
} from "components/editorComponents/CodeEditor/codeEditorUtils";
import { ENTITY_TYPE } from "entities/DataTree/dataTreeFactory";
import { isEmpty, isString } from "lodash";
import type { getAllDatasourceTableKeys } from "selectors/entitiesSelector";
import { renderHint } from "./customSQLHint";

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
  datasourceTableKeys: NonNullable<
    ReturnType<typeof getAllDatasourceTableKeys>
  > = {};
  tables: Record<string, string[]> = {};

  constructor() {
    this.hinter = this.hinter.bind(this);
    this.setDatasourceTableKeys = this.setDatasourceTableKeys.bind(this);
    this.addCustomRendererToCompletions =
      this.addCustomRendererToCompletions.bind(this);
    this.generateTables = this.generateTables.bind(this);
  }

  setDatasourceTableKeys(
    datasourceTableKeys: ReturnType<typeof getAllDatasourceTableKeys>,
  ) {
    this.datasourceTableKeys = datasourceTableKeys || {};
    this.tables = this.generateTables(this.datasourceTableKeys);
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
          alignWithWord: false,
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

  generateTables(
    tableKeys: NonNullable<ReturnType<typeof getAllDatasourceTableKeys>>,
  ) {
    const tables: Record<string, string[]> = {};
    for (const tableKey of Object.keys(tableKeys)) {
      tables[`${tableKey}`] = [];
    }
    return tables;
  }

  isSqlMode(editor: CodeMirror.Editor) {
    const editorMode = editor.getModeAt(editor.getCursor());
    return editorMode?.name === EditorModes.SQL;
  }

  addCustomRendererToCompletions(completions: Hints): Hints {
    completions.list = completions.list.map((completion) => {
      if (isString(completion)) return completion;
      completion.render = (LiElement, data, currentHint) => {
        renderHint(LiElement, currentHint.text, currentHint.className);
      };
      return completion;
    });
    return completions;
  }

  handleCompletions(editor: CodeMirror.Editor): ReturnType<HandleCompletions> {
    const noHints = { showHints: false, completions: null } as const;
    if (isCursorOnEmptyToken(editor) || !this.isSqlMode(editor)) return noHints;
    // @ts-expect-error: No types available
    const completions: Hints = CodeMirror.hint.sql(editor, {
      tables: this.tables,
    });
    if (isEmpty(completions.list)) return noHints;
    return {
      completions: this.addCustomRendererToCompletions(completions),
      showHints: true,
    };
  }
}

export const sqlHint = new SqlHintHelper();
