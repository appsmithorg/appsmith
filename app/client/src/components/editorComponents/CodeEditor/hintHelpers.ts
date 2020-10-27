import CodeMirror from "codemirror";
import TernServer from "utils/autocomplete/TernServer";
import KeyboardShortcuts from "constants/KeyboardShortcuts";
import { dataTreeTypeDefCreator } from "utils/autocomplete/dataTreeTypeDefCreator";
import { DataTree } from "entities/DataTree/dataTreeFactory";
import { getDynamicStringSegments } from "utils/DynamicBindingUtils";
import { HintHelper } from "components/editorComponents/CodeEditor/EditorConfig";
import AnalyticsUtil from "utils/AnalyticsUtil";

export const bindingHint: HintHelper = (editor, data) => {
  const ternServer = new TernServer(data);
  editor.setOption("extraKeys", {
    // eslint-disable-next-line @typescript-eslint/ban-ts-comment
    // @ts-ignore
    ...editor.options.extraKeys,
    [KeyboardShortcuts.CodeEditor.OpenAutocomplete]: (cm: CodeMirror.Editor) =>
      ternServer.complete(cm),
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
    showHint: (editor: CodeMirror.Editor) => {
      let cursorBetweenBinding = false;
      const cursor = editor.getCursor();
      const value = editor.getValue();
      let cursorIndex = cursor.ch;
      if (cursor.line > 0) {
        for (let lineIndex = 0; lineIndex < cursor.line; lineIndex++) {
          const line = editor.getLine(lineIndex);
          // Add line length + 1 for new line character
          cursorIndex = cursorIndex + line.length + 1;
        }
      }
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

      const shouldShow = cursorBetweenBinding;
      if (shouldShow) {
        AnalyticsUtil.logEvent("AUTO_COMPELTE_SHOW", {});
        ternServer.complete(editor);
      } else {
        // eslint-disable-next-line @typescript-eslint/ban-ts-comment
        // @ts-ignore
        editor.closeHint();
      }
    },
  };
};
