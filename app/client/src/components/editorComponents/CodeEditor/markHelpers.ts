import CodeMirror from "codemirror";
import { AUTOCOMPLETE_MATCH_REGEX } from "constants/BindingsConstants";
import { MarkHelper } from "components/editorComponents/CodeEditor/EditorConfig";

export const bindingMarker: MarkHelper = (editor: CodeMirror.Editor) => {
  editor.eachLine((line: CodeMirror.LineHandle) => {
    const lineNo = editor.getLineNumber(line) || 0;
    let match;
    while ((match = AUTOCOMPLETE_MATCH_REGEX.exec(line.text)) != null) {
      const start = match.index;
      const end = AUTOCOMPLETE_MATCH_REGEX.lastIndex;
      editor.markText(
        { ch: start, line: lineNo },
        { ch: end, line: lineNo },
        {
          className: "binding-highlight",
        },
      );
    }
  });
};
