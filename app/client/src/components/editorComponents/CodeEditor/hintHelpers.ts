import CodeMirror from "codemirror";
import TernServer from "utils/autocomplete/TernServer";
import KeyboardShortcuts from "constants/KeyboardShortcuts";
import { dataTreeTypeDefCreator } from "utils/autocomplete/dataTreeTypeDefCreator";
import { DataTree } from "entities/DataTree/dataTreeFactory";
import { getDynamicStringSegments } from "utils/DynamicBindingUtils";
import { HintHelper } from "components/editorComponents/CodeEditor/EditorConfig";
import AnalyticsUtil from "utils/AnalyticsUtil";
//TODO : add currentRow to data ?? currentRow: Object of columns ie first row
export const bindingHint: HintHelper = (editor, data, additionalData) => {
  const ternServer = new TernServer(data, additionalData);
  editor.setOption("extraKeys", {
    // eslint-disable-next-line @typescript-eslint/ban-ts-comment
    // @ts-ignore: No types available
    ...editor.options.extraKeys,
    [KeyboardShortcuts.CodeEditor.OpenAutocomplete]: (
      cm: CodeMirror.Editor,
      expected: string,
      entity: string,
    ) => ternServer.complete(cm, expected, entity),
    [KeyboardShortcuts.CodeEditor.ShowTypeAndInfo]: (cm: CodeMirror.Editor) => {
      ternServer.showType(cm);
    },
    [KeyboardShortcuts.CodeEditor.OpenDocsLink]: (cm: CodeMirror.Editor) => {
      ternServer.showDocs(cm);
    },
  });
  return {
    update: (data: DataTree) => {
      const dataTreeDef = dataTreeTypeDefCreator(data);
      ternServer.updateDef("dataTree", dataTreeDef);
    },
    showHint: (
      editor: CodeMirror.Editor,
      expected: string,
      entityName: string,
    ): boolean => {
      const shouldShow = checkIfCursorInsideBinding(editor);
      if (shouldShow) {
        AnalyticsUtil.logEvent("AUTO_COMPLETE_SHOW", {});
        ternServer.complete(editor, expected, entityName);
        return true;
      }
      // eslint-disable-next-line @typescript-eslint/ban-ts-comment
      // @ts-ignore: No types available
      editor.closeHint();
      return false;
    },
  };
};

const computeCursorIndex = (editor: CodeMirror.Editor) => {
  const cursor = editor.getCursor();
  let cursorIndex = cursor.ch;
  if (cursor.line > 0) {
    for (let lineIndex = 0; lineIndex < cursor.line; lineIndex++) {
      const line = editor.getLine(lineIndex);
      cursorIndex = cursorIndex + line.length + 1;
    }
  }
  return cursorIndex;
};

export const checkIfCursorInsideBinding = (
  editor: CodeMirror.Editor,
): boolean => {
  let cursorBetweenBinding = false;
  const value = editor.getValue();
  const cursorIndex = computeCursorIndex(editor);
  const stringSegments = getDynamicStringSegments(value);
  // count of chars processed
  let cumulativeCharCount = 0;
  stringSegments.forEach((segment: string) => {
    const start = cumulativeCharCount;
    const dynamicStart = segment.indexOf("{{");
    const dynamicDoesStart = dynamicStart > -1;
    const dynamicEnd = segment.indexOf("}}");
    const dynamicDoesEnd = dynamicEnd > -1;
    const dynamicStartIndex = dynamicStart + start + 2;
    const dynamicEndIndex = dynamicEnd + start;
    if (
      dynamicDoesStart &&
      cursorIndex >= dynamicStartIndex &&
      ((dynamicDoesEnd && cursorIndex <= dynamicEndIndex) ||
        (!dynamicDoesEnd && cursorIndex >= dynamicStartIndex))
    ) {
      cursorBetweenBinding = true;
    }
    cumulativeCharCount = start + segment.length;
  });
  return cursorBetweenBinding;
};
