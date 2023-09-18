import type { Hints } from "codemirror";
import CodeMirror from "codemirror";
import CodemirrorTernService from "utils/autocomplete/CodemirrorTernService";
import KeyboardShortcuts from "constants/KeyboardShortcuts";
import type { HintHelper } from "components/editorComponents/CodeEditor/EditorConfig";
import { EditorModes } from "components/editorComponents/CodeEditor/EditorConfig";
import {
  checkIfCursorInsideBinding,
  isCursorOnEmptyToken,
} from "components/editorComponents/CodeEditor/codeEditorUtils";
import { ENTITY_TYPE } from "entities/DataTree/dataTreeFactory";
import { isEmpty, isString } from "lodash";
import type { getAllDatasourceTableKeys } from "@appsmith/selectors/entitiesSelector";
import {
  filterCompletions,
  getHintDetailsFromClassName,
} from "./utils/sqlHint";

export const bindingHintHelper: HintHelper = (editor) => {
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
    this.addCustomAttributesToCompletions =
      this.addCustomAttributesToCompletions.bind(this);
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
            editor.on("mousedown", () => {
              // @ts-expect-error: Types are not available
              editor.closeHint();
            });
            return completions;
          },
          completeSingle: false,
          alignWithWord: false,
          closeOnUnfocus: true,
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

  generateTables(tableKeys: typeof this.datasourceTableKeys) {
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

  addCustomAttributesToCompletions(completions: Hints): Hints {
    completions.list = completions.list.map((completion) => {
      if (isString(completion)) return completion;
      completion.render = (LiElement, _data, { className, text }) => {
        const { hintType, iconBgType, iconText } = getHintDetailsFromClassName(
          text,
          className,
        );
        LiElement.setAttribute("hinttype", hintType);
        LiElement.setAttribute("icontext", iconText);
        LiElement.classList.add("cm-sql-hint");
        LiElement.classList.add(`cm-sql-hint-${iconBgType}`);
        LiElement.innerHTML = text;
      };
      return completion;
    });
    return completions;
  }

  handleCompletions(editor: CodeMirror.Editor): ReturnType<HandleCompletions> {
    const noHints = { showHints: false, completions: null } as const;
    if (isCursorOnEmptyToken(editor) || !this.isSqlMode(editor)) return noHints;
    // @ts-expect-error: No types available
    let completions: Hints = CodeMirror.hint.sql(editor, {
      tables: this.tables,
    });
    if (isEmpty(completions.list)) return noHints;
    completions = filterCompletions(completions);
    return {
      completions: this.addCustomAttributesToCompletions(completions),
      showHints: true,
    };
  }
}

export const sqlHint = new SqlHintHelper();
