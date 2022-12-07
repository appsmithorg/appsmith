import CodeMirror from "codemirror";
import { AUTOCOMPLETE_MATCH_REGEX } from "constants/BindingsConstants";
import { MarkHelper } from "components/editorComponents/CodeEditor/EditorConfig";

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

export const NAVIGATE_TO_ATTRIBUTE = "data-navigate-to";
export const NAVIGATION_CLASSNAME = "navigable-entity-highlight";

export const entityMarker: MarkHelper = (
  editor: CodeMirror.Editor,
  entityNavigationData,
) => {
  editor.eachLine((line: CodeMirror.LineHandle) => {
    const lineNo = editor.getLineNumber(line) || 0;
    const tokens = editor.getLineTokens(lineNo);
    tokens.forEach((token) => {
      const tokenString = token.string;
      const existingMarking = editor
        .findMarks(
          { ch: token.start, line: lineNo },
          { ch: token.end, line: lineNo },
        )
        .filter((marker) => marker.className === NAVIGATION_CLASSNAME);
      if (token.type === "variable" && tokenString in entityNavigationData) {
        if (existingMarking.length) return;
        const data = entityNavigationData[tokenString];
        editor.markText(
          { ch: token.start, line: lineNo },
          { ch: token.end, line: lineNo },
          {
            className: NAVIGATION_CLASSNAME,
            // eslint-disable-next-line @typescript-eslint/ban-ts-comment
            // @ts-ignore
            attributes: {
              [NAVIGATE_TO_ATTRIBUTE]: `${data.name}`,
            },
            atomic: false,
          },
        );
      } else if (existingMarking.length) {
        existingMarking.forEach((mark) => mark.clear());
      }
    });
  });
};
