import CodeMirror from "codemirror";
import { AUTOCOMPLETE_MATCH_REGEX } from "constants/BindingsConstants";
import { MarkHelper } from "components/editorComponents/CodeEditor/EditorConfig";
import history from "utils/history";

export const bindingMarker: MarkHelper = (editor: CodeMirror.Editor) => {
  editor.eachLine((line: CodeMirror.LineHandle) => {
    const lineNo = editor.getLineNumber(line) || 0;
    let match;
    while ((match = AUTOCOMPLETE_MATCH_REGEX.exec(line.text)) != null) {
      const opening = {
        start: match.index,
        end: match.index + 2,
      };
      const ending = {
        start: AUTOCOMPLETE_MATCH_REGEX.lastIndex - 2,
        end: AUTOCOMPLETE_MATCH_REGEX.lastIndex,
      };
      editor.markText(
        { ch: ending.start, line: lineNo },
        { ch: ending.end, line: lineNo },
        {
          className: "binding-brackets",
        },
      );
      editor.markText(
        { ch: opening.start, line: lineNo },
        { ch: opening.end, line: lineNo },
        {
          className: "binding-brackets",
        },
      );
      editor.markText(
        { ch: opening.start, line: lineNo },
        { ch: ending.end, line: lineNo },
        {
          className: "binding-highlight",
        },
      );
    }
  });
};

export const entityMarker: MarkHelper = (
  editor: CodeMirror.Editor,
  entityNavigationData,
) => {
  editor.eachLine((line: CodeMirror.LineHandle) => {
    const lineNo = editor.getLineNumber(line) || 0;
    const tokens = editor.getLineTokens(lineNo);
    tokens.forEach((token) => {
      if (token.string in entityNavigationData) {
        const data = entityNavigationData[token.string];
        editor.markText(
          { ch: token.start, line: lineNo },
          { ch: token.end, line: lineNo },
          {
            className: "navigable-entity-highlight",
            // eslint-disable-next-line @typescript-eslint/ban-ts-comment
            // @ts-ignore
            attributes: {
              "data-navigation": data.url,
            },
            atomic: false,
          },
        );
      }
    });
  });
};
