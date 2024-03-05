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
import { isEmpty, isString } from "lodash";
import type { getAllDatasourceTableKeys } from "@appsmith/selectors/entitiesSelector";
import { isAISlashCommand } from "@appsmith/components/editorComponents/GPT/trigger";

export enum SQLDataType {
  unknown = "unknown",
  keyword = "keyword",
  text = "text",
  int4 = "int4",
  table = "table",
}
export function getHintDetailsFromClassName(
  text: string,
  className?: string,
): {
  hintType: string;
  iconText: string;
  iconBgType: string;
} {
  switch (className) {
    case "CodeMirror-hint-table":
      const hintDataType = sqlHint.datasourceTableKeys[text];
      return hintDataType
        ? {
            hintType: hintDataType,
            iconText: hintDataType.charAt(0).toLocaleUpperCase(),
            iconBgType: hintDataType || SQLDataType.unknown,
          }
        : {
            hintType: SQLDataType.unknown,
            iconText: "U",
            iconBgType: SQLDataType.unknown,
          };

    case "CodeMirror-hint-keyword":
      return {
        hintType: SQLDataType.keyword,
        iconText: "K",
        iconBgType: SQLDataType.keyword,
      };
    default:
      return {
        hintType: SQLDataType.unknown,
        iconText: "U",
        iconBgType: SQLDataType.unknown,
      };
  }
}

// Beyond 270 hints, the main thread task for rendering the hint tooltip becomes greater than 50ms
// 50ms is the limit beyond which a task is considered a long task
export const MAX_NUMBER_OF_SQL_HINTS = 270;
export function filterCompletions(completions: Hints) {
  completions.list = completions.list.slice(0, MAX_NUMBER_OF_SQL_HINTS);
  return completions;
}

export const bindingHintHelper: HintHelper = (editor: CodeMirror.Editor) => {
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
        CodemirrorTernService.setEntityInformation(editor, {
          ...entityInformation,
          blockCompletions: additionalData.blockCompletions,
        });
      } else {
        CodemirrorTernService.setEntityInformation(editor, entityInformation);
      }

      let shouldShow = false;

      if (additionalData?.isJsEditor) {
        if (additionalData?.enableAIAssistance) {
          shouldShow = !isAISlashCommand(editor);
        } else {
          shouldShow = true;
        }
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

export class SqlHintHelper {
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
    this.getCompletions = this.getCompletions.bind(this);
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

  getCompletions(editor: CodeMirror.Editor) {
    // @ts-expect-error: No types available
    const completions: Hints = CodeMirror.hint.sql(editor, {
      tables: this.tables,
    });
    return completions;
  }

  handleCompletions(editor: CodeMirror.Editor): ReturnType<HandleCompletions> {
    const noHints = { showHints: false, completions: null } as const;
    if (isCursorOnEmptyToken(editor) || !this.isSqlMode(editor)) return noHints;
    let completions: Hints = this.getCompletions(editor);
    if (isEmpty(completions.list)) return noHints;
    completions = filterCompletions(completions);
    return {
      completions: this.addCustomAttributesToCompletions(completions),
      showHints: true,
    };
  }
}

export const sqlHint = new SqlHintHelper();
